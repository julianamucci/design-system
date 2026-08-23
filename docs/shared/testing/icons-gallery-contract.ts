/**
 * Contrato da galeria de Foundations/Icons, compartilhado pelas cinco stacks.
 *
 * A página de Icons não tem um primitivo em `components/ui` — ela É a galeria.
 * Até esta rodada, o único teste que a alcançava era a fumaça de docs page
 * (`docs-smoke`), que prova que a página monta e passa no axe, e nada mais: a
 * busca, o estado vazio e o rótulo do botão de copiar não tinham asserção em
 * stack nenhuma. Os quatro arquivos `*.stories.*` que existiam eram stubs
 * `!test`, herdados da migração para MDX, e não executavam nada.
 *
 * Aqui ficam as verificações que valem igual nas cinco, para que a cobertura
 * não divirja por estilo de quem escreveu a story. Cada função devolve uma
 * lista de problemas em texto; a story falha com `expect(problemas).toEqual([])`
 * e a mensagem já diz o que quebrou.
 *
 * Nenhum import: o módulo roda dentro do browser do teste em qualquer stack.
 */

/** Seletores do contrato `.nds-*` da galeria. */
const GRID = '.nds-icon-grid';
const ITEM = '.nds-icon-grid-item';
const TILE = '.nds-icon-tile';
const EMPTY = '.nds-icon-empty-state';
const SEARCH = 'input[type="search"]';

function text(el: Element | null): string {
  return (el?.textContent ?? '').trim();
}

/** Item visível = está no DOM e não carrega `is-hidden`. */
export function itemsVisiveis(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(ITEM)).filter(
    (item) => !item.classList.contains('is-hidden')
  );
}

export function searchField(root: HTMLElement): HTMLInputElement {
  const field = root.querySelector<HTMLInputElement>(SEARCH);
  if (!field) throw new Error('contrato: a galeria não tem campo de busca (input[type="search"])');
  return field;
}

/**
 * Escreve no campo de busca de um jeito que as cinco stacks enxergam.
 *
 * `campo.value = x` sozinho não serve: o rastreador de valor do React engole a
 * mudança e o componente não re-renderiza. O setter do protótipo contorna o
 * rastreador, e o evento `input` é o mesmo que Vue, Svelte, Vanilla e Angular
 * já escutam. Uma única emissão por consulta, em vez de uma por tecla — com
 * dois mil tiles no DOM, a diferença é de segundos por story.
 */
export function searchDigitar(root: HTMLElement, query: string): HTMLInputElement {
  const field = searchField(root);
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(field) as object,
    'value'
  )?.set;
  setter?.call(field, query);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  return field;
}

/** Texto da região viva que anuncia quantos ícones estão à vista. */
export function contagemText(root: HTMLElement): string {
  return text(root.querySelector('[aria-live="polite"]'));
}

export function stateEmptyVisible(root: HTMLElement): boolean {
  const vazio = root.querySelector(EMPTY);
  return !!vazio && vazio.classList.contains('is-visible');
}

export function gridEscondida(root: HTMLElement): boolean {
  const grid = root.querySelector(GRID);
  return !!grid && grid.classList.contains('is-hidden');
}

/**
 * Estrutura da galeria em repouso.
 *
 * `totalEsperado` vem de `NOMES_DE_ICONE.length` — a mesma fonte que a página
 * usa. Bater o número prova que a grade nasce INTEIRA (a filtragem é por
 * classe, não por remoção de nó) e que nenhuma stack perdeu ícone no caminho.
 */
export function galeriaAuditarStructure(
  root: HTMLElement,
  totalEsperado: number
): string[] {
  const problemas: string[] = [];

  const grid = root.querySelector<HTMLElement>(GRID);
  if (!grid) {
    problemas.push(`sem ${GRID} na página`);
    return problemas;
  }
  if (grid.tagName !== 'UL') {
    problemas.push(`a grade é <${grid.tagName.toLowerCase()}>, e o contrato é <ul>`);
  }
  if (!grid.getAttribute('aria-label')?.trim()) {
    problemas.push('a grade não tem aria-label — a lista fica sem nome acessível');
  }

  const items = Array.from(root.querySelectorAll<HTMLElement>(ITEM));
  if (items.length !== totalEsperado) {
    problemas.push(`a grade tem ${items.length} itens, e o catálogo tem ${totalEsperado}`);
  }

  const noName = items.filter((item) => !item.dataset.iconName).length;
  if (noName > 0) {
    problemas.push(`${noName} itens sem data-icon-name — a sonda não consegue endereçá-los`);
  }

  const vazio = root.querySelector(EMPTY);
  if (!vazio) {
    problemas.push(`sem ${EMPTY} no DOM — o estado vazio precisa existir antes de a busca falhar`);
  } else if (vazio.getAttribute('role') !== 'status') {
    problemas.push('o estado vazio não é role="status"');
  }

  if (!root.querySelector('[aria-live="polite"]')) {
    problemas.push('sem região viva anunciando a contagem da busca');
  }

  return problemas;
}

/**
 * Um tile qualquer: nome acessível, geometria desenhada e tamanho contido.
 *
 * O teste de tamanho não é decoração: um `<svg>` com `viewBox` e sem classe de
 * dimensão cai no tamanho intrínseco de 300×150 e estoura o tile. Era o estado
 * do Vanilla antes desta rodada, e nenhuma asserção pegava.
 */
export function auditarTile(root: HTMLElement, nomeDoIcone: string): string[] {
  const problemas: string[] = [];

  const item = root.querySelector<HTMLElement>(`${ITEM}[data-icon-name="${nomeDoIcone}"]`);
  if (!item) {
    problemas.push(`nenhum item para o ícone ${nomeDoIcone}`);
    return problemas;
  }

  const button = item.querySelector<HTMLButtonElement>(`button${TILE}`);
  if (!button) {
    problemas.push(`o item de ${nomeDoIcone} não tem <button class="nds-icon-tile">`);
    return problemas;
  }
  if (button.type !== 'button') {
    problemas.push(`o tile de ${nomeDoIcone} é type="${button.type}" — submete o formulário ao redor`);
  }

  const label = button.getAttribute('aria-label') ?? '';
  if (!label.includes(nomeDoIcone)) {
    problemas.push(
      `o nome acessível do tile de ${nomeDoIcone} não contém o nome do ícone (veio "${label}")`
    );
  }

  const svg = button.querySelector('svg');
  if (!svg) {
    problemas.push(`o tile de ${nomeDoIcone} não desenhou <svg>`);
    return problemas;
  }
  if (svg.children.length === 0) {
    problemas.push(`o <svg> de ${nomeDoIcone} está vazio — a geometria do catálogo não chegou`);
  }
  if (svg.getAttribute('aria-hidden') !== 'true') {
    problemas.push(`o <svg> de ${nomeDoIcone} não é aria-hidden — o leitor lê o desenho`);
  }

  const box = svg.getBoundingClientRect();
  if (box.width > 32 || box.height > 32) {
    problemas.push(
      `o <svg> de ${nomeDoIcone} mede ${Math.round(box.width)}×${Math.round(box.height)}px — ` +
        'sem classe de dimensão, o SVG cai no tamanho intrínseco'
    );
  }

  return problemas;
}

/**
 * WCAG 1.4.4 no campo de busca: a altura tem de ser RESULTADO do texto.
 *
 * Mede a caixa, dobra a fonte do próprio campo, mede de novo e restaura. Com
 * `height` fixo os dois números são iguais e o texto transborda a 200% — que
 * era o caso do `.nds-icon-search-input` antes de virar modificador do
 * `.nds-input`.
 */
export function fieldAuditarHeight(root: HTMLElement): string[] {
  const field = searchField(root);
  const fonteOriginal = field.style.fontSize;
  const antes = field.getBoundingClientRect().height;
  try {
    field.style.fontSize = '200%';
    // Leitura force o layout antes de medir.
    void field.offsetHeight;
    const depois = field.getBoundingClientRect().height;
    if (depois <= antes) {
      return [
        `o campo de busca não cresce com a fonte (${Math.round(antes)}px a 100%, ` +
          `${Math.round(depois)}px a 200%) — altura fixa viola a WCAG 1.4.4`,
      ];
    }
    return [];
  } finally {
    // Restaurar SEMPRE: o Chromatic fotografa o fim da play.
    field.style.fontSize = fonteOriginal;
  }
}
