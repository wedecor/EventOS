import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UiState = {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  expandedNavIds: string[];
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  toggleNavGroup: (id: string) => void;
  setNavGroupExpanded: (id: string, expanded: boolean) => void;
};

/** UI chrome preferences only — not server/session state. */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      expandedNavIds: ['operations', 'settings'],
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      toggleNavGroup: (id) =>
        set((s) => ({
          expandedNavIds: s.expandedNavIds.includes(id)
            ? s.expandedNavIds.filter((x) => x !== id)
            : [...s.expandedNavIds, id],
        })),
      setNavGroupExpanded: (id, expanded) =>
        set((s) => ({
          expandedNavIds: expanded
            ? Array.from(new Set([...s.expandedNavIds, id]))
            : s.expandedNavIds.filter((x) => x !== id),
        })),
    }),
    {
      name: 'eventos-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        expandedNavIds: state.expandedNavIds,
      }),
    },
  ),
);
