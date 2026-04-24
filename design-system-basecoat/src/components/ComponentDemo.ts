import { createCard } from '@/components/ui/card';
export function createComponentDemo(child?: HTMLElement): HTMLElement {
  const el = createCard({ className: 'flex items-center justify-center p-4 mt-2 shadow-sm' });
  if (child) el.appendChild(child);
  return el;
}
