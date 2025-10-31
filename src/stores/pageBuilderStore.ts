/**
 * Page Builder Store
 * Zustand store for managing page builder state
 */

import { create } from "zustand";
import { PageConfig, PageBlock, BlockConfig } from "@/types/pageBuilder";
import {
    addBlock,
    removeBlock,
    updateBlock,
    reorderBlocks,
    toggleBlockVisibility,
    duplicateBlock,
} from "@/lib/pageBuilder";

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
    setPage: (page: PageConfig) => void;
    selectBlock: (blockId: string | null) => void;
    setIsDragging: (isDragging: boolean) => void;
    addBlockToPage: (type: any, position?: number) => void;
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
    resetBuilder: () => void;
}

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
        set({
            page,
            history: [page],
            historyIndex: 0,
            selectedBlockId: null,
        });
    },

    // Select a block
    selectBlock: (blockId) => {
        set({ selectedBlockId: blockId });
    },

    // Set dragging state
    setIsDragging: (isDragging) => {
        set({ isDragging });
    },

    // Add a block to the page
    addBlockToPage: (type, position) => {
        const { page, history, historyIndex } = get();
        if (!page) return;

        const newPage = addBlock(page, type, position);
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newPage);

        set({
            page: newPage,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            selectedBlockId: newPage.blocks[newPage.blocks.length - 1]?.id,
        });
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

    // Save page (to API/localStorage)
    savePage: async () => {
        const { page } = get();
        if (!page) return;

        set({ isSaving: true });

        try {
            // TODO: Implement actual API call
            // await api.savePage(page);

            // For now, save to localStorage
            localStorage.setItem(`page_${page.id}`, JSON.stringify(page));

            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 500));

            console.log("Page saved successfully");
        } catch (error) {
            console.error("Failed to save page:", error);
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
