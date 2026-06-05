import { createCard } from '@/components/ui/card';
export function createComponentDemo(child?: HTMLElement): HTMLElement {
  const el = createCard({ className: 'nds-docs-demo' });
  if (child) el.appendChild(child);
  return el;
}
