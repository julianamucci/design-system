export function createComponentDemo(child?: HTMLElement): HTMLElement {
  const el = document.createElement('div');
  el.className = 'flex items-center justify-center p-4 mt-2 border rounded-xl bg-background shadow-sm';
  if (child) el.appendChild(child);
  return el;
}
