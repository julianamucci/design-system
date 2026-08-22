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
const VAZIO = '.nds-icon-empty-state';
const SEARCH = 'input[type="search"]';

function texto(el: Element | null): string {
  return (el?.textContent ?? '').trim();
}

/** Item visível = está no DOM e não carrega `is-hidden`. */
export function itemsVisiveis(raiz: HTMLElement): HTMLElement[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>(ITEM)).filter(
    (item) => !item.classList.contains('is-hidden')
  );
}

export function searchField(raiz: HTMLElement): HTMLInputElement {
  const campo = raiz.querySelector<HTMLInputElement>(SEARCH);
  if (!campo) throw new Error('contrato: a galeria não tem campo de busca (input[type="search"])');
  return campo;
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
export function searchDigitar(raiz: HTMLElement, consulta: string): HTMLInputElement {
  const campo = searchField(raiz);
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(campo) as object,
    'value'
  )?.set;
  setter?.call(campo, consulta);
  campo.dispatchEvent(new Event('input', { bubbles: true }));
  return campo;
}

/** Texto da região viva que anuncia quantos ícones estão à vista. */
export function textoDaContagem(raiz: HTMLElement): string {
  return texto(raiz.querySelector('[aria-live="polite"]'));
}

export function stateEmptyVisible(raiz: HTMLElement): boolean {
  const vazio = raiz.querySelector(VAZIO);
  return !!vazio && vazio.classList.contains('is-visible');
}

export function gridEscondida(raiz: HTMLElement): boolean {
  const grade = raiz.querySelector(GRID);
  return !!grade && grade.classList.contains('is-hidden');
}

/**
 * Estrutura da galeria em repouso.
 *
 * `totalEsperado` vem de `NOMES_DE_ICONE.length` — a mesma fonte que a página
 * usa. Bater o número prova que a grade nasce INTEIRA (a filtragem é por
 * classe, não por remoção de nó) e que nenhuma stack perdeu ícone no caminho.
 */
export function galeriaAuditarStructure(
  raiz: HTMLElement,
  totalEsperado: number
): string[] {
  const problemas: string[] = [];

  const grade = raiz.querySelector<HTMLElement>(GRID);
  if (!grade) {
    problemas.push(`sem ${GRID} na página`);
    return problemas;
  }
  if (grade.tagName !== 'UL') {
    problemas.push(`a grade é <${grade.tagName.toLowerCase()}>, e o contrato é <ul>`);
  }
  if (!grade.getAttribute('aria-label')?.trim()) {
    problemas.push('a grade não tem aria-label — a lista fica sem nome acessível');
  }

  const itens = Array.from(raiz.querySelectorAll<HTMLElement>(ITEM));
  if (itens.length !== totalEsperado) {
    problemas.push(`a grade tem ${itens.length} itens, e o catálogo tem ${totalEsperado}`);
  }

  const noName = itens.filter((item) => !item.dataset.iconName).length;
  if (noName > 0) {
    problemas.push(`${noName} itens sem data-icon-name — a sonda não consegue endereçá-los`);
  }

  const vazio = raiz.querySelector(VAZIO);
  if (!vazio) {
    problemas.push(`sem ${VAZIO} no DOM — o estado vazio precisa existir antes de a busca falhar`);
  } else if (vazio.getAttribute('role') !== 'status') {
    problemas.push('o estado vazio não é role="status"');
  }

  if (!raiz.querySelector('[aria-live="polite"]')) {
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
export function auditarTile(raiz: HTMLElement, nomeDoIcone: string): string[] {
  const problemas: string[] = [];

  const item = raiz.querySelector<HTMLElement>(`${ITEM}[data-icon-name="${nomeDoIcone}"]`);
  if (!item) {
    problemas.push(`nenhum item para o ícone ${nomeDoIcone}`);
    return problemas;
  }

  const botao = item.querySelector<HTMLButtonElement>(`button${TILE}`);
  if (!botao) {
    problemas.push(`o item de ${nomeDoIcone} não tem <button class="nds-icon-tile">`);
    return problemas;
  }
  if (botao.type !== 'button') {
    problemas.push(`o tile de ${nomeDoIcone} é type="${botao.type}" — submete o formulário ao redor`);
  }

  const rotulo = botao.getAttribute('aria-label') ?? '';
  if (!rotulo.includes(nomeDoIcone)) {
    problemas.push(
      `o nome acessível do tile de ${nomeDoIcone} não contém o nome do ícone (veio "${rotulo}")`
    );
  }

  const svg = botao.querySelector('svg');
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

  const caixa = svg.getBoundingClientRect();
  if (caixa.width > 32 || caixa.height > 32) {
    problemas.push(
      `o <svg> de ${nomeDoIcone} mede ${Math.round(caixa.width)}×${Math.round(caixa.height)}px — ` +
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
export function fieldAuditarHeight(raiz: HTMLElement): string[] {
  const campo = searchField(raiz);
  const fonteOriginal = campo.style.fontSize;
  const antes = campo.getBoundingClientRect().height;
  try {
    campo.style.fontSize = '200%';
    // Leitura force o layout antes de medir.
    void campo.offsetHeight;
    const depois = campo.getBoundingClientRect().height;
    if (depois <= antes) {
      return [
        `o campo de busca não cresce com a fonte (${Math.round(antes)}px a 100%, ` +
          `${Math.round(depois)}px a 200%) — altura fixa viola a WCAG 1.4.4`,
      ];
    }
    return [];
  } finally {
    // Restaurar SEMPRE: o Chromatic fotografa o fim da play.
    campo.style.fontSize = fonteOriginal;
  }
}
