/**
 * Page Builder Store
 * Zustand store for managing page builder state
 */

import { create } from 'zustand';
import { PageConfig, BlockConfig } from '@/types/pageBuilder';
import type { PageBlock, PageTheme, PageSEO } from '@/types/pageBuilder';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { Json } from '@/integrations/supabase/types';
import {
  addBlock,
  removeBlock,
  updateBlock,
  reorderBlocks,
  toggleBlockVisibility,
  duplicateBlock,
} from '@/lib/pageBuilder';

interface PageBuilderStore {
  // State
  page: PageConfig | null;
  selectedBlockId: string | null;
  isDragging: boolean;
  history: PageConfig[];
  historyIndex: number;
  isPreviewMode: boolean;
  isSaving: boolean;

  // Actions
  setPage: (page: PageConfig | null) => void;
  loadPage: (pageId: string) => Promise<void>;
  loadUserPages: () => Promise<PageConfig[]>;
  selectBlock: (blockId: string | null) => void;
  setIsDragging: (isDragging: boolean) => void;
  addBlockToPage: (type: any, position?: number) => Promise<void>;
  removeBlockFromPage: (blockId: string) => void;
  updateBlockConfig: (blockId: string, config: Partial<BlockConfig>) => void;
  reorderPageBlocks: (sourceIndex: number, destIndex: number) => void;
  toggleBlockVisible: (blockId: string) => void;
  duplicatePageBlock: (blockId: string) => void;
  updatePageMeta: (meta: Partial<PageConfig>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  togglePreviewMode: () => void;
  savePage: () => Promise<void>;
  publishPage: () => Promise<void>;
  setAsActivePage: (pageId: string) => Promise<void>;
  resetBuilder: () => void;
}

/**
 * The jsonb round trip for `custom_pages`.
 *
 * blocks, theme and seo are jsonb columns, and PageBlock/PageTheme/PageSEO are
 * interfaces — so they have no implicit index signature and do not satisfy
 * Json on the way in, while on the way out Json does not narrow to them. The
 * six `as any` casts that used to sit at these boundaries meant a shape change
 * on either side went unnoticed. Confined to this pair: toJson asserts once on
 * write, fromJson gives back a typed default when the stored value is not the
 * shape it should be, so a malformed row degrades instead of throwing
 * mid-render.
 */
const toJson = (value: unknown): Json => value as unknown as Json;

const blocksFromJson = (value: Json): PageBlock[] =>
  Array.isArray(value) ? (value as unknown as PageBlock[]) : [];

const objectFromJson = <T>(value: Json, fallback: T): T =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as unknown as T)
    : fallback;

const EMPTY_THEME = {} as PageTheme;
const EMPTY_SEO = {} as PageSEO;

export const usePageBuilderStore = create<PageBuilderStore>((set, get) => ({
  // Initial state
  page: null,
  selectedBlockId: null,
  isDragging: false,
  history: [],
  historyIndex: -1,
  isPreviewMode: false,
  isSaving: false,

  // Set the current page
  setPage: (page) => {
    if (page === null) {
      set({
        page: null,
        history: [],
        historyIndex: -1,
        selectedBlockId: null,
      });
    } else {
      set({
        page,
        history: [page],
        historyIndex: 0,
        selectedBlockId: null,
      });
    }
  },

  // Load a page from the database
  loadPage: async (pageId) => {
    try {
      const { data, error } = await supabase
        .from('custom_pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Page not found');

      // Convert database format to PageConfig
      const pageConfig: PageConfig = {
        id: data.id,
        userId: data.user_id,
        slug: data.slug,
        title: data.title,
        description: data.description || '',
        blocks: blocksFromJson(data.blocks),
        theme: objectFromJson(data.theme, EMPTY_THEME),
        seo: objectFromJson(data.seo, EMPTY_SEO),
        published: data.published,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      get().setPage(pageConfig);
    } catch (error) {
      logger.error('Failed to load page', error as Error);
      toast.error('Failed to load page');
      throw error;
    }
  },

  // Load all user pages
  loadUserPages: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('custom_pages')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((d) => ({
        id: d.id,
        userId: d.user_id,
        slug: d.slug,
        title: d.title,
        description: d.description || '',
        blocks: blocksFromJson(d.blocks),
        theme: objectFromJson(d.theme, EMPTY_THEME),
        seo: objectFromJson(d.seo, EMPTY_SEO),
        published: d.published,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at),
      }));
    } catch (error) {
      logger.error('Failed to load user pages', error as Error);
      return [];
    }
  },

  // Select a block
  selectBlock: (blockId) => {
    set({ selectedBlockId: blockId });
  },

  // Set dragging state
  setIsDragging: (isDragging) => {
    set({ isDragging });
  },

  // Add a block to the page (with auto-population)
  addBlockToPage: async (type, position) => {
    const { page, history, historyIndex } = get();
    if (!page) return;

    try {
      // Get current user for auto-population
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const newPage = await addBlock(page, type, position, user?.id);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newPage);

      set({
        page: newPage,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        selectedBlockId: newPage.blocks[newPage.blocks.length - 1]?.id,
      });
    } catch (error) {
      logger.error('Error adding block', error as Error);
      toast.error('Failed to add block');
    }
  },

  // Remove a block from the page
  removeBlockFromPage: (blockId) => {
    const { page, history, historyIndex } = get();
    if (!page) return;

    const newPage = removeBlock(page, blockId);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPage);

    set({
      page: newPage,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedBlockId: null,
    });
  },

  // Update a block's configuration
  updateBlockConfig: (blockId, config) => {
    const { page, history, historyIndex } = get();
    if (!page) return;

    const newPage = updateBlock(page, blockId, config);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPage);

    set({
      page: newPage,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  // Reorder blocks
  reorderPageBlocks: (sourceIndex, destIndex) => {
    const { page, history, historyIndex } = get();
    if (!page) return;

    const newPage = reorderBlocks(page, sourceIndex, destIndex);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPage);

    set({
      page: newPage,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  // Toggle block visibility
  toggleBlockVisible: (blockId) => {
    const { page, history, historyIndex } = get();
    if (!page) return;

    const newPage = toggleBlockVisibility(page, blockId);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPage);

    set({
      page: newPage,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  // Duplicate a block
  duplicatePageBlock: (blockId) => {
    const { page, history, historyIndex } = get();
    if (!page) return;

    const newPage = duplicateBlock(page, blockId);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPage);

    set({
      page: newPage,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  // Update page metadata
  updatePageMeta: (meta) => {
    const { page, history, historyIndex } = get();
    if (!page) return;

    const newPage = {
      ...page,
      ...meta,
      updatedAt: new Date(),
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPage);

    set({
      page: newPage,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  // Undo
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({
        page: history[historyIndex - 1],
        historyIndex: historyIndex - 1,
      });
    }
  },

  // Redo
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({
        page: history[historyIndex + 1],
        historyIndex: historyIndex + 1,
      });
    }
  },

  // Can undo
  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  // Can redo
  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  // Toggle preview mode
  togglePreviewMode: () => {
    set((state) => ({
      isPreviewMode: !state.isPreviewMode,
      selectedBlockId: null,
    }));
  },

  // Save page (to Supabase)
  savePage: async () => {
    const { page } = get();
    if (!page) return;

    set({ isSaving: true });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const pageData = {
        user_id: user.id,
        slug: page.slug,
        title: page.title,
        description: page.description,
        blocks: toJson(page.blocks),
        theme: toJson(page.theme),
        seo: toJson(page.seo),
        published: page.published,
      };

      // Check if page exists
      const { data: existing } = await supabase
        .from('custom_pages')
        .select('id')
        .eq('id', page.id)
        .single();

      if (existing) {
        // Update existing page
        const { error } = await supabase
          .from('custom_pages')
          .update(pageData)
          .eq('id', page.id)
          .select('id')
          .single();

        if (error) throw error;
      } else {
        // Insert new page
        const { error } = await supabase.from('custom_pages').insert({ ...pageData, id: page.id });

        if (error) throw error;
      }

      toast.success('Page saved successfully');
    } catch (error) {
      logger.error('Failed to save page', error as Error);
      toast.error('Failed to save page');
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  // Publish page
  publishPage: async () => {
    const { page, updatePageMeta, savePage } = get();
    if (!page) return;

    updatePageMeta({ published: true });
    await savePage();
    toast.success('Page published successfully!');
  },

  // Set as active page (will be shown on profile)
  setAsActivePage: async (pageId) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Set the page as active
      const { error } = await supabase
        .from('custom_pages')
        .update({ is_active: true })
        .eq('id', pageId)
        .eq('user_id', user.id)
        .select('id')
        .single();

      if (error) throw error;

      toast.success('This page is now your active profile');
    } catch (error) {
      logger.error('Failed to set active page', error as Error);
      toast.error('Failed to set active page');
      throw error;
    }
  },

  // Reset builder state
  resetBuilder: () => {
    set({
      page: null,
      selectedBlockId: null,
      isDragging: false,
      history: [],
      historyIndex: -1,
      isPreviewMode: false,
      isSaving: false,
    });
  },
}));
