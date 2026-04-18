import { sanitizeHtml } from '@/lib/sanitize-html';

export interface DocsTestItem { action: string; result: string; priority: string }
export interface DocsA11yTestItem { criterion: string; level: string; how: string }
export interface DocsVisualTestItem { story: string; priority: string }

export interface DocsTestesProps {
  title: string;
  functional: { title: string; cols: { action: string; result: string; priority: string }; items: DocsTestItem[] };
  accessibility: { title: string; cols: { criterion: string; level: string; how: string }; items: DocsA11yTestItem[] };
  visual: { title: string; cols: { story: string; priority: string }; items: DocsVisualTestItem[] };
}

const priorityClass = (p: string) =>
  ({ Alta: 'text-red-600', Média: 'text-yellow-600', Baixa: 'text-green-600', High: 'text-red-600', Medium: 'text-yellow-600', Low: 'text-green-600' } as Record<string, string>)[p] ?? '';

export function createDocsTestes(props: DocsTestesProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'testes';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;
  section.appendChild(h2);

  const container = document.createElement('div');
  container.className = 'space-y-8';

  // Functional
  const funcBlock = document.createElement('div');
  funcBlock.className = 'space-y-3';
  funcBlock.innerHTML = `
    <h3 class="text-base font-semibold">${sanitizeHtml(props.functional.title)}</h3>
    <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border bg-muted/50 text-left">
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(props.functional.cols.action)}</th>
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(props.functional.cols.result)}</th>
            <th class="p-3 font-semibold">${sanitizeHtml(props.functional.cols.priority)}</th>
          </tr>
        </thead>
        <tbody>
          ${props.functional.items.map(item => `
            <tr class="border-b border-border last:border-0 hover:bg-muted/5">
              <td class="p-3 border-r border-border">${sanitizeHtml(item.action)}</td>
              <td class="p-3 border-r border-border text-muted-foreground">${sanitizeHtml(item.result)}</td>
              <td class="p-3 font-medium ${priorityClass(item.priority)}">${sanitizeHtml(item.priority)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  // Accessibility
  const a11yBlock = document.createElement('div');
  a11yBlock.className = 'space-y-3';
  a11yBlock.innerHTML = `<h3 class="text-base font-semibold">${sanitizeHtml(props.accessibility.title)}</h3>`;
  const a11yGrid = document.createElement('div');
  a11yGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-3';
  props.accessibility.items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'border rounded-lg p-3 bg-muted/30 space-y-1';
    card.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono font-bold text-primary border border-primary/20 rounded px-1.5 py-0.5 bg-primary/5">${sanitizeHtml(item.level)}</span>
        <span class="text-sm font-medium">${sanitizeHtml(item.criterion)}</span>
      </div>
      <p class="text-xs text-muted-foreground pl-0.5">${sanitizeHtml(item.how)}</p>`;
    a11yGrid.appendChild(card);
  });
  a11yBlock.appendChild(a11yGrid);

  // Visual
  const visualBlock = document.createElement('div');
  visualBlock.className = 'space-y-3';
  visualBlock.innerHTML = `
    <h3 class="text-base font-semibold">${sanitizeHtml(props.visual.title)}</h3>
    <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border bg-muted/50 text-left">
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(props.visual.cols.story)}</th>
            <th class="p-3 font-semibold">${sanitizeHtml(props.visual.cols.priority)}</th>
          </tr>
        </thead>
        <tbody>
          ${props.visual.items.map(item => `
            <tr class="border-b border-border last:border-0 hover:bg-muted/5">
              <td class="p-3 border-r border-border font-mono text-xs">${sanitizeHtml(item.story)}</td>
              <td class="p-3 font-medium ${priorityClass(item.priority)}">${sanitizeHtml(item.priority)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  container.append(funcBlock, a11yBlock, visualBlock);
  section.appendChild(container);
  return section;
}
