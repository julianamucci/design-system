/**
 * Sonda de comparação do Breadcrumb entre as cinco stacks.
 *
 * O breadcrumb não tem estado, não gerencia foco e não tem teclado próprio: o
 * que ele entrega é SEMÂNTICA. Por isso a medição aqui é quase toda de árvore de
 * acessibilidade — que papel cada peça tem, qual o nome acessível do landmark,
 * quem carrega `aria-current`, o que o separador expõe, e em que ORDEM o leitor
 * de tela percorre tudo isso.
 *
 * A busca é pelo contrato `.nds-breadcrumb*`. Onde a classe não estiver, o campo
 * vem `null` — e isso É o achado: significa que a folha compartilhada não
 * governa aquela peça naquela stack, e que qualquer regra futura vai nascer
 * divergente sem ninguém perceber.
 */

export interface NavMeasurement {
  presente: boolean;
  tag: string | null;
  classesNds: string;
  /** Nome acessível do landmark. `null` é violação de `landmark-unique`. */
  ariaLabel: string | null;
  role: string | null;
}

export interface ListMeasurement {
  presente: boolean;
  tag: string | null;
  classesNds: string;
  /** Quantos `<li>` diretos — a contagem que o leitor de tela anuncia. */
  items: number;
}

export interface SeparatorMeasurement {
  tag: string;
  classesNds: string;
  role: string | null;
  ariaHidden: string | null;
  /** `svg` quando é ícone, `text` quando é caractere. */
  content: 'svg' | 'texto' | 'vazio';
  /** Largura computada do ícone, em px — pega tamanho que não segue a densidade. */
  larguraDoIcone: number | null;
}

export interface PageMeasurement {
  presente: boolean;
  tag: string | null;
  classesNds: string;
  ariaCurrent: string | null;
  text: string | null;
  /** O contrato diz "último item". `false` é achado. */
  ehUltimoItem: boolean | null;
  /** Página atual nunca é link. */
  temHref: boolean | null;
}

export interface EllipsisMeasurement {
  presente: boolean;
  tag: string | null;
  classesNds: string;
  role: string | null;
  ariaLabel: string | null;
  ariaHidden: string | null;
  /** Tag do ancestral acionável, quando as reticências são gatilho de menu. */
  trigger: string | null;
  /** Nome acessível do gatilho — é ele que nomeia o conjunto oculto. */
  nomeDoGatilho: string | null;
}

export interface BreadcrumbMeasurement {
  cenario: string;
  nav: NavMeasurement;
  list: ListMeasurement;
  links: { text: string; href: string; classesNds: string }[];
  separadores: SeparatorMeasurement[];
  page: PageMeasurement;
  reticencias: EllipsisMeasurement;
  /** O que o leitor de tela percorre, na ordem do DOM. */
  leituraOrder: string[];
}

const NO_NAV: NavMeasurement = { presente: false, tag: null, classesNds: '', ariaLabel: null, role: null };
const NO_LIST: ListMeasurement = { presente: false, tag: null, classesNds: '', items: 0 };
const NO_PAGE: PageMeasurement = {
  presente: false, tag: null, classesNds: '', ariaCurrent: null, text: null, ehUltimoItem: null, temHref: null,
};
const NO_ELLIPSIS: EllipsisMeasurement = {
  presente: false, tag: null, classesNds: '', role: null, ariaLabel: null, ariaHidden: null, trigger: null, nomeDoGatilho: null,
};

function classesNds(el: Element): string {
  return Array.from(el.classList).filter((c) => c.startsWith('nds-')).sort().join(' ');
}

function text(el: Element | null): string {
  return (el?.textContent ?? '').trim().replace(/\s+/g, ' ');
}

/**
 * Nome acessível aproximado: `aria-label`, senão o texto.
 *
 * Aproximado de propósito — a sonda compara stacks entre si, e a mesma
 * aproximação aplicada às cinco revela divergência sem precisar de um
 * computador de accname completo.
 */
function accessibleName(el: Element | null): string | null {
  if (!el) return null;
  return el.getAttribute('aria-label') || text(el) || null;
}

/**
 * O que o leitor de tela percorre, na ordem do DOM.
 *
 * Subárvore com `aria-hidden="true"` é pulada INTEIRA — é assim que se vê se o
 * separador some da leitura de verdade e se o rótulo das reticências está preso
 * dentro de um nó escondido, que foi como o texto sr-only conseguiu existir no
 * markup sem existir para ninguém.
 */
export function leituraOrder(root: Element): string[] {
  const saida: string[] = [];
  const visitar = (el: Element) => {
    if (el.getAttribute('aria-hidden') === 'true') return;
    const tag = el.tagName.toLowerCase();
    if (tag === 'a' && el.hasAttribute('href')) {
      saida.push(`link:${accessibleName(el)}`);
      return;
    }
    if (el.getAttribute('aria-current') === 'page') {
      saida.push(`atual:${accessibleName(el)}`);
      return;
    }
    if (tag === 'button') {
      saida.push(`botao:${accessibleName(el)}`);
      return;
    }
    if (el.getAttribute('role') === 'img') {
      saida.push(`imagem:${el.getAttribute('aria-label')}`);
      return;
    }
    if (el.children.length === 0) {
      const t = text(el);
      if (t) saida.push(`texto:${t}`);
      return;
    }
    Array.from(el.children).forEach(visitar);
  };
  Array.from(root.children).forEach(visitar);
  return saida;
}

export function measureBreadcrumb(root: HTMLElement, cenario = 'padrao'): BreadcrumbMeasurement {
  const nav = root.querySelector<HTMLElement>('.nds-breadcrumb') ?? null;
  // O `data-slot` é a rede: sem ele, uma stack sem a classe do contrato zeraria
  // TODOS os campos e a sonda não diria mais nada além de "não achei".
  const slotNav = root.querySelector<HTMLElement>('[data-slot="breadcrumb"]');
  const escopo = nav ?? slotNav ?? root;

  const list = escopo.querySelector<HTMLElement>('.nds-breadcrumb-list, [data-slot="breadcrumb-list"]');
  const page = escopo.querySelector<HTMLElement>('.nds-breadcrumb-page, [data-slot="breadcrumb-page"]');
  const reticencias = escopo.querySelector<HTMLElement>('.nds-breadcrumb-ellipsis, [data-slot="breadcrumb-ellipsis"]');
  const listItems = list ? Array.from(list.children).filter((f) => f.tagName === 'LI') : [];
  const pageItem = page?.closest('li') ?? null;

  const trigger = reticencias?.closest('button, a, [role="button"]') ?? null;

  return {
    cenario,
    nav: nav
      ? { presente: true, tag: nav.tagName.toLowerCase(), classesNds: classesNds(nav), ariaLabel: nav.getAttribute('aria-label'), role: nav.getAttribute('role') }
      : slotNav
        // Achado explícito: o slot existe, a classe do contrato não.
        ? { presente: false, tag: slotNav.tagName.toLowerCase(), classesNds: classesNds(slotNav), ariaLabel: slotNav.getAttribute('aria-label'), role: slotNav.getAttribute('role') }
        : { ...NO_NAV },
    list: list
      ? { presente: true, tag: list.tagName.toLowerCase(), classesNds: classesNds(list), items: listItems.length }
      : { ...NO_LIST },
    links: Array.from(escopo.querySelectorAll<HTMLAnchorElement>('.nds-breadcrumb-link, [data-slot="breadcrumb-link"]')).map((a) => ({
      text: text(a),
      href: a.getAttribute('href') ?? '',
      classesNds: classesNds(a),
    })),
    separadores: Array.from(escopo.querySelectorAll<HTMLElement>('.nds-breadcrumb-separator, [data-slot="breadcrumb-separator"]')).map((s) => {
      const svg = s.querySelector('svg');
      return {
        tag: s.tagName.toLowerCase(),
        classesNds: classesNds(s),
        role: s.getAttribute('role'),
        ariaHidden: s.getAttribute('aria-hidden'),
        content: svg ? 'svg' : text(s) ? 'texto' : 'vazio',
        larguraDoIcone: svg ? Math.round(svg.getBoundingClientRect().width * 100) / 100 : null,
      };
    }),
    page: page
      ? {
          presente: true,
          tag: page.tagName.toLowerCase(),
          classesNds: classesNds(page),
          ariaCurrent: page.getAttribute('aria-current'),
          text: text(page),
          ehUltimoItem: listItems.length > 0 && pageItem === listItems[listItems.length - 1],
          temHref: page.hasAttribute('href'),
        }
      : { ...NO_PAGE },
    reticencias: reticencias
      ? {
          presente: true,
          tag: reticencias.tagName.toLowerCase(),
          classesNds: classesNds(reticencias),
          role: reticencias.getAttribute('role'),
          ariaLabel: reticencias.getAttribute('aria-label'),
          ariaHidden: reticencias.getAttribute('aria-hidden'),
          trigger: trigger ? trigger.tagName.toLowerCase() : null,
          nomeDoGatilho: accessibleName(trigger),
        }
      : { ...NO_ELLIPSIS },
    leituraOrder: leituraOrder(escopo),
  };
}

/** Uma linha por medida — a tabela para o diff campo a campo entre stacks. */
export function resumirBreadcrumb(m: BreadcrumbMeasurement): string[] {
  return [
    `nav|presente=${m.nav.presente}|tag=${m.nav.tag}|classes=${m.nav.classesNds || '(nenhuma nds)'}|ariaLabel=${m.nav.ariaLabel}|role=${m.nav.role}`,
    `lista|tag=${m.list.tag}|classes=${m.list.classesNds}|itens=${m.list.items}`,
    `links|${m.links.map((l) => `${l.text}->${l.href}(${l.classesNds})`).join(' , ') || 'nenhum'}`,
    ...m.separadores.map((s, i) => `separador${i}|tag=${s.tag}|classes=${s.classesNds}|role=${s.role}|ariaHidden=${s.ariaHidden}|conteudo=${s.content}|iconeLargura=${s.larguraDoIcone}`),
    `pagina|tag=${m.page.tag}|classes=${m.page.classesNds}|ariaCurrent=${m.page.ariaCurrent}|texto=${m.page.text}|ehUltimo=${m.page.ehUltimoItem}|temHref=${m.page.temHref}`,
    `reticencias|presente=${m.reticencias.presente}|tag=${m.reticencias.tag}|role=${m.reticencias.role}|ariaLabel=${m.reticencias.ariaLabel}|ariaHidden=${m.reticencias.ariaHidden}|gatilho=${m.reticencias.trigger}|nomeDoGatilho=${m.reticencias.nomeDoGatilho}`,
    `leitura|${m.leituraOrder.join(' > ')}`,
  ];
}

export interface BreadcrumbFailure {
  motivo: string;
}

/**
 * Reprova o que a anatomia compartilhada promete e a medida não confirma.
 *
 * Cada item aqui existe porque a promessa está escrita em
 * `docs/shared/content/breadcrumb/translations.json` e nenhuma story a
 * verificava.
 */
export function reprovasDeBreadcrumb(m: BreadcrumbMeasurement): BreadcrumbFailure[] {
  const failures: BreadcrumbFailure[] = [];
  const f = (motivo: string) => failures.push({ motivo });

  if (!m.nav.presente) {
    f(`raiz sem a classe do contrato .nds-breadcrumb (tag=${m.nav.tag}, classes=${m.nav.classesNds || 'nenhuma nds'}) — a folha compartilhada não governa este elemento`);
  }
  if (m.nav.tag !== 'nav') f(`raiz é <${m.nav.tag}> e a anatomia pede <nav>`);
  if (!m.nav.ariaLabel) f('landmark <nav> sem nome acessível — dois <nav> na página ficam indistinguíveis');
  if (m.list.tag !== 'ol') f(`lista é <${m.list.tag}> e a anatomia pede <ol> (a ORDEM é o que dá sentido à trilha)`);
  if (!m.list.classesNds.includes('nds-breadcrumb-list')) f('lista sem .nds-breadcrumb-list');

  if (!m.page.presente) f('nenhum item com o papel de página atual');
  else {
    if (m.page.ariaCurrent !== 'page') f(`página atual com aria-current="${m.page.ariaCurrent}" em vez de "page"`);
    if (m.page.ehUltimoItem === false) f('o item com aria-current="page" não é o último da lista');
    if (m.page.temHref) f('página atual é um link — a anatomia diz que ela nunca é navegável');
  }

  for (const [i, s] of m.separadores.entries()) {
    if (s.ariaHidden !== 'true') f(`separador ${i} sem aria-hidden="true" — entra na leitura`);
    if (s.role !== 'presentation') f(`separador ${i} com role="${s.role}" em vez de "presentation"`);
  }

  // O separador é decorativo por padrão no design system, então ele NUNCA pode
  // aparecer na ordem de leitura. Um `texto:›` na lista abaixo é o sintoma.
  const vazado = m.leituraOrder.find((t) => t.startsWith('texto:'));
  if (vazado) f(`peça decorativa vazou para a leitura: ${vazado}`);

  if (m.reticencias.presente) {
    const anunciada = m.reticencias.role === 'img' && !!m.reticencias.ariaLabel;
    const decorativa = m.reticencias.ariaHidden === 'true';
    if (!anunciada && !decorativa) {
      f('reticências nem anunciadas (role="img" + aria-label) nem decorativas (aria-hidden) — ficam num meio-termo mudo');
    }
    if (anunciada && decorativa) f('reticências com rótulo E aria-hidden ao mesmo tempo — o rótulo não chega a ninguém');
  }

  return failures;
}

export function breadcrumbDescribeFailures(fs: BreadcrumbFailure[]): string {
  return fs.map((x) => `  · ${x.motivo}`).join('\n');
}
