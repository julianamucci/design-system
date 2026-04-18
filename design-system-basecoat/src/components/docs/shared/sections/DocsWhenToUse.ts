import { sanitizeHtml } from '@/lib/sanitize-html';

export interface DocsWhenToUseScenario { s: string; u: string; a: string }
export interface DocsWhenToUseUXRow { element: string; do: string; dont: string; rules?: string }

export interface DocsWhenToUseProps {
  title: string;
  guidelines: { title: string; items: string[] };
  scenarios: { title?: string; cols: { scenario: string; use: string; alternative: string }; items: DocsWhenToUseScenario[] };
  uxWriting: { title: string; cols: { element: string; do: string; dont: string; rules?: string }; items: DocsWhenToUseUXRow[] };
  do: { title: string; items: string[] };
  dont: { title: string; items: string[] };
}

export function createDocsWhenToUse(props: DocsWhenToUseProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'quando-usar';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;

  const card = document.createElement('div');
  card.className = 'border rounded-xl p-6 shadow-sm space-y-6';

  // Guidelines
  const guidelinesBlock = document.createElement('div');
  guidelinesBlock.className = 'bg-muted/30 rounded-lg p-4 space-y-3';
  guidelinesBlock.innerHTML = `<h3 class="font-medium text-sm">${sanitizeHtml(props.guidelines.title)}</h3>`;
  const guidelinesList = document.createElement('ul');
  guidelinesList.className = 'list-disc pl-5 space-y-2 text-sm text-muted-foreground';
  props.guidelines.items.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = sanitizeHtml(item);
    guidelinesList.appendChild(li);
  });
  guidelinesBlock.appendChild(guidelinesList);

  // Scenarios table
  const scenariosBlock = document.createElement('div');
  scenariosBlock.className = 'overflow-x-auto';
  scenariosBlock.innerHTML = `
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="border-b border-border text-left bg-muted/50 font-medium">
          <th class="p-3 border-r border-border">${sanitizeHtml(props.scenarios.cols.scenario)}</th>
          <th class="p-3 border-r border-border">${sanitizeHtml(props.scenarios.cols.use)}</th>
          <th class="p-3">${sanitizeHtml(props.scenarios.cols.alternative)}</th>
        </tr>
      </thead>
      <tbody>
        ${props.scenarios.items.map(item => `
          <tr class="border-b border-border hover:bg-muted/5">
            <td class="p-3 border-r border-border">${sanitizeHtml(item.s)}</td>
            <td class="p-3 border-r border-border font-medium text-primary">${sanitizeHtml(item.u)}</td>
            <td class="p-3 text-muted-foreground">${sanitizeHtml(item.a)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;

  // UX Writing table
  const uxBlock = document.createElement('div');
  uxBlock.className = 'space-y-3';
  uxBlock.innerHTML = `
    <h3 class="font-medium text-sm">${sanitizeHtml(props.uxWriting.title)}</h3>
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border bg-muted/70 text-left">
            <th class="p-3 border-r border-border font-semibold">${sanitizeHtml(props.uxWriting.cols.element)}</th>
            ${props.uxWriting.cols.rules ? `<th class="p-3 border-r border-border font-semibold">${sanitizeHtml(props.uxWriting.cols.rules)}</th>` : ''}
            <th class="p-3 border-r border-border font-semibold text-green-700">✓ ${sanitizeHtml(props.uxWriting.cols.do)}</th>
            <th class="p-3 font-semibold text-red-700">✗ ${sanitizeHtml(props.uxWriting.cols.dont)}</th>
          </tr>
        </thead>
        <tbody>
          ${props.uxWriting.items.map(row => `
            <tr class="border-b border-border last:border-0 hover:bg-muted/5">
              <td class="p-3 border-r border-border font-medium">${sanitizeHtml(row.element)}</td>
              ${props.uxWriting.cols.rules ? `<td class="p-3 border-r border-border text-muted-foreground">${sanitizeHtml(row.rules ?? '')}</td>` : ''}
              <td class="p-3 border-r border-border font-medium text-green-600">${sanitizeHtml(row.do)}</td>
              <td class="p-3 font-medium text-red-600">${sanitizeHtml(row.dont)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  // Do / Don't cards
  const doBlock = document.createElement('div');
  doBlock.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
  doBlock.innerHTML = `
    <div class="bg-card border rounded-xl p-4 shadow-sm">
      <h3 class="mb-3 text-sm font-semibold text-green-600 flex items-center gap-2">
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-xs font-bold flex-shrink-0">✓</span>
        ${sanitizeHtml(props.do.title)}
      </h3>
      <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
        ${props.do.items.map(i => `<li>${sanitizeHtml(i)}</li>`).join('')}
      </ul>
    </div>
    <div class="bg-card border rounded-xl p-4 shadow-sm">
      <h3 class="mb-3 text-sm font-semibold text-red-600 flex items-center gap-2">
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-xs font-bold flex-shrink-0">✗</span>
        ${sanitizeHtml(props.dont.title)}
      </h3>
      <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
        ${props.dont.items.map(i => `<li>${sanitizeHtml(i)}</li>`).join('')}
      </ul>
    </div>`;

  card.append(guidelinesBlock, scenariosBlock, uxBlock, doBlock);
  section.append(h2, card);
  return section;
}
