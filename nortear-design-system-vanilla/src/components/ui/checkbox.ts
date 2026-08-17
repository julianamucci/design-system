import { cn } from '@/lib/utils';

import DOMPurify from 'dompurify';

// ─── Checkbox — Vanilla factory standalone ──────────────────────────────────
//
// Visual: classes .nds-checkbox + .nds-checkbox-indicator (standalone).
// Estado controlado via data-state="checked|unchecked" + aria-checked.
//
// A raiz é um <button type="button" role="checkbox">, e a escolha do elemento é
// funcional, não estética: `label[for]` só alcança CONTROLE ROTULÁVEL do HTML
// (button, input, select, textarea, meter, output, progress). Enquanto a caixa
// foi um <div role="checkbox">, clicar no texto do rótulo não focava nem
// alternava nada — o par rótulo+caixa era inerte, e a story passava havia anos
// porque conferia `label.htmlFor` em vez do efeito. Com <button>, o navegador
// entrega os dois eixos de graça: o clique no rótulo move o foco para a caixa E
// dispara a ativação. Medido nas cinco stacks em docs/shared/testing/checkbox-probe.ts.
//
// Nada é registrado fora da própria raiz — nem ouvinte no rótulo, nem no
// documento —, então a fábrica não precisa de `destroy()` (src/lib/destroy.ts):
// os ouvintes morrem junto com o nó que quem consome remove. Qualquer ouvinte
// no rótulo seria justamente o andaime que este componente passou a dispensar.

const SVG_ABRE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
  'aria-hidden="true">';

const CHECK_SVG = `${SVG_ABRE}<polyline points="20 6 9 20 4 15"/></svg>`;
const MINUS_SVG = `${SVG_ABRE}<line x1="5" y1="12" x2="19" y2="12"/></svg>`;

export type CheckboxOptions = {
  checked?: boolean;
  /**
   * Estado misto — "alguns dos filhos selecionados". Vale sobre `checked`
   * enquanto durar, e o primeiro clique o resolve para marcado, como faz a
   * propriedade `indeterminate` do input nativo.
   */
  indeterminate?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Disparado quando o estado misto é resolvido por interação. */
  onIndeterminateChange?: (indeterminate: boolean) => void;
  id?: string;
  class?: string;
  'aria-label'?: string;
};

export function createCheckbox(options: CheckboxOptions = {}): HTMLElement {
  const { disabled = false, onCheckedChange, onIndeterminateChange, id } = options;
  let checked = options.checked ?? false;
  let indeterminate = options.indeterminate ?? false;

  const wrapper = document.createElement('button');
  // `type="button"` porque um <button> dentro de <form> submete por padrão, e
  // marcar uma caixa não é enviar o formulário.
  wrapper.type = 'button';
  wrapper.dataset.slot = 'checkbox';
  wrapper.className = cn('nds-checkbox', options.class);
  // O papel implícito de <button> é `button`; `role="checkbox"` + `aria-checked`
  // é o que faz o leitor de tela anunciar "caixa de seleção, marcada".
  wrapper.setAttribute('role', 'checkbox');

  if (options['aria-label']) wrapper.setAttribute('aria-label', options['aria-label']);
  if (id) wrapper.id = id;
  if (disabled) {
    // `aria-disabled` em vez do `disabled` nativo: o controle continua
    // alcançável para quem navega lendo a tela, que é a recomendação do
    // WAI-ARIA APG. O `tabindex="-1"` o tira do Tab sem tirá-lo do documento, e
    // quem impede a alternância é a ausência dos ouvintes abaixo.
    wrapper.setAttribute('aria-disabled', 'true');
    wrapper.setAttribute('tabindex', '-1');
  }

  const indicator = document.createElement('span');
  indicator.dataset.slot = 'checkbox-indicator';
  indicator.className = 'nds-checkbox-indicator';

  wrapper.append(indicator);

  // O input nativo NÃO entra no DOM: dois elementos interativos aninhados
  // quebram WCAG/axe (nested-interactive), e o `role="checkbox"` já está no
  // wrapper. Quem precisa de submit nativo lê `onCheckedChange` e escreve o
  // próprio campo — é a divergência assumida em relação às stacks que rodam
  // lib headless, que renderizam esse input por conta própria.
  //
  // Consequência boa: como o `id` fica na raiz visível e não num input oculto,
  // `document.getElementById(id)` devolve a caixa que o usuário vê, e o `for`
  // do rótulo aponta para ela.

  function pintar(): void {
    wrapper.dataset.state = indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked';
    // "mixed" é o que distingue "alguns selecionados" de "todos selecionados";
    // um booleano aqui mentiria para quem lê a tela.
    wrapper.setAttribute('aria-checked', indeterminate ? 'mixed' : String(checked));
    indicator.style.display = indeterminate || checked ? '' : 'none';
    // Constantes literais internas; sanitize no call site por convenção do
    // projeto (guideline 09 — o SAST precisa ver o sanitizador aqui).
    indicator.innerHTML = DOMPurify.sanitize(indeterminate ? MINUS_SVG : CHECK_SVG);
  }

  pintar();

  function alternar(): void {
    if (indeterminate) {
      indeterminate = false;
      checked = true;
      pintar();
      onIndeterminateChange?.(false);
      onCheckedChange?.(true);
      return;
    }
    checked = !checked;
    pintar();
    onCheckedChange?.(checked);
  }

  if (!disabled) {
    // Um ÚNICO ouvinte de ativação. Space não é tratado aqui de propósito: num
    // <button> nativo a barra já dispara `click` no keyup, e alternar também no
    // keydown alternaria duas vezes por tecla. Vale para o navegador e para a
    // suíte — o `userEvent` reproduz esse mesmo keyup→click.
    wrapper.addEventListener('click', alternar);
    wrapper.addEventListener('keydown', (e) => {
      // Enter não alterna caixa de seleção (WAI-ARIA APG: só Space). Num
      // <button> nativo o Enter dispara clique, então cancelar o padrão é o que
      // devolve o contrato do papel — é o mesmo que as libs headless fazem.
      if (e.key === 'Enter') e.preventDefault();
    });
  }

  return wrapper;
}
