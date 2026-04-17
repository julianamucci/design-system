import { createSheet } from './sheet';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DrawerOptions = {
  trigger: HTMLElement;
  title?: string;
  description?: string;
  content: HTMLElement;
  footer?: HTMLElement;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

// ─── createDrawer ─────────────────────────────────────────────────────────────

export function createDrawer(options: DrawerOptions): HTMLElement {
  return createSheet({
    ...options,
    side: 'bottom',
  });
}
