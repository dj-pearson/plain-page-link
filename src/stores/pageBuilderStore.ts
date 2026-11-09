/**
 * Page Builder Store
 * Zustand store for managing page builder state
 */

import { create } from 'zustand';
import { PageConfig, BlockConfig } from '@/types/pageBuilder';
import type { BlockType, PageBlock, PageTheme, PageSEO } from '@/types/pageBuilder';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { pageSnapshot } from '@/lib/pageSnapshot';
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
  /**
   * Open a page in the editor. `saved: true` says the page is exactly what is
   * stored (opened from the list or loaded by id), so it is not dirty and
   * autosave does not rewrite it on open. A page that has never been written —
   * one just created from a template — omits it, and autosave inserts it.
   */
  setPage: (page: PageConfig | null, options?: { saved?: boolean }) => void;
  loadPage: (pageId: string) => Promise<void>;
  loadUserPages: () => Promise<PageConfig[]>;
  selectBlock: (blockId: string | null) => void;
  setIsDragging: (isDragging: boolean) => void;
  addBlockToPage: (type: BlockType, position?: number) => Promise<void>;
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
  /**
   * The serialised page as it was last written. Autosave compares against this
   * so it fires on an edit rather than on its own completion (US-116).
   */
  lastSavedSnapshot: string | null;
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
  lastSavedSnapshot: null,

  // Set the current page
  //
  // lastSavedSnapshot is reset here as well. It used to survive a page switch,
  // so it still held the previous page's snapshot: every page opened looked
  // dirty, and autosave rewrote it three seconds after opening — bumping its
  // updated_at, which is what the page list sorts by (US-671).
  setPage: (page, options) => {
    if (page === null) {
      set({
        page: null,
        history: [],
        historyIndex: -1,
        selectedBlockId: null,
        lastSavedSnapshot: null,
      });
    } else {
      set({
        page,
        history: [page],
        historyIndex: 0,
        selectedBlockId: null,
        lastSavedSnapshot: options?.saved ? pageSnapshot(page) : null,
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
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      get().setPage(pageConfig, { saved: true });
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
        isActive: d.is_active,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at),
      }));
    } catch (error) {
      // Rethrown, not `return []`. An empty list here rendered "No pages yet —
      // Create your first page" to an agent whose pages had simply failed to
      // load, inviting them to build a duplicate of the page that is live.
      logger.error('Failed to load user pages', error as Error);
      throw error;
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
  //
  // Auto-population fetches the agent's profile and listings, so this awaits
  // the network. It used to build the result from the page as it was when the
  // click happened and then overwrite whatever the page had become: a second
  // block added before the first had populated replaced the first, and a
  // keystroke typed meanwhile was rolled back (US-671). Only the new block is
  // taken from the populated copy; it is spliced into the page as it is now.
  addBlockToPage: async (type, position) => {
    const startPage = get().page;
    if (!startPage) return;

    try {
      // Get current user for auto-population
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const populated = await addBlock({ ...startPage, blocks: [] }, type, undefined, user?.id);
      const newBlock = populated.blocks[0];
      if (!newBlock) return;

      const { page, history, historyIndex } = get();
      // The agent left this page, or opened another, while the block populated.
      if (!page || page.id !== startPage.id) return;

      const at =
        position !== undefined
          ? Math.max(0, Math.min(position, page.blocks.length))
          : page.blocks.length;
      const blocks = [...page.blocks];
      blocks.splice(at, 0, newBlock);
      const newPage: PageConfig = {
        ...page,
        // New objects, not `block.order = index` on the existing ones: those
        // are shared with the undo history.
        blocks: blocks.map((block, index) =>
          block.order === index ? block : { ...block, order: index }
        ),
        updatedAt: new Date(),
      };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newPage);

      set({
        page: newPage,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        selectedBlockId: newBlock.id,
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

      // maybeSingle, and scoped to the owner. .single() raises PGRST116 when
      // there is no row, and the error was destructured away — so "does this
      // page exist" was answered by a swallowed error. Scoping by user_id also
      // means an id that belongs to someone else reads as absent rather than as
      // an update this agent is not allowed to make (US-116).
      const { data: existing, error: existingError } = await supabase
        .from('custom_pages')
        .select('id')
        .eq('id', page.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingError) throw existingError;

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

      // No toast here. This is called by autosave as well as by the Save
      // button, and it announced every three-second background write as though
      // the agent had asked for it. Callers that the agent initiated do the
      // toasting (US-116).
      set({ lastSavedSnapshot: pageSnapshot(page) });
    } catch (error) {
      logger.error('Failed to save page', error as Error);
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  // Publish page
  //
  // If the write fails the page goes back to its earlier published state.
  // Otherwise the badge read "Published" under a "Failed to publish" toast, and
  // the still-dirty page was published by autosave three seconds later, after
  // the agent had been told it was not (US-671).
  publishPage: async () => {
    const { page, updatePageMeta, savePage } = get();
    if (!page) return;
    const wasPublished = page.published;

    updatePageMeta({ published: true });
    try {
      await savePage();
    } catch (error) {
      if (!wasPublished) {
        const { page: current, history, historyIndex } = get();
        if (current && current.id === page.id && current.published) {
          const reverted = { ...current, published: false };
          const newHistory = [...history];
          newHistory[historyIndex] = reverted;
          set({ page: reverted, history: newHistory });
        }
      }
      throw error;
    }
  },

  // Set as active page (will be shown on profile)
  setAsActivePage: async (pageId) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Deactivate the siblings first. This only ever set is_active on the
      // chosen page and never cleared it anywhere else, so an agent who marked
      // two pages active had two active rows — and the .single() lookups that
      // ask "which page is active?" then failed with PGRST116, leaving them
      // with neither (US-116).
      const { error: clearError } = await supabase
        .from('custom_pages')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .neq('id', pageId);

      if (clearError) throw clearError;

      const { data: activated, error } = await supabase
        .from('custom_pages')
        .update({ is_active: true })
        .eq('id', pageId)
        .eq('user_id', user.id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!activated) throw new Error('That page could not be found on your account');
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
      lastSavedSnapshot: null,
    });
  },
}));
