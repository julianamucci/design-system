// ─── Sonda do DropdownMenu ────────────────────────────────────────────────────
//
// Colhedor compartilhado: mede o MESMO cenário nas cinco stacks e devolve um
// retrato do que cada lib produz. O que difere entre as colunas é o achado —
// campo `null` significa "o contrato não foi cumprido aqui", não falha da
// medição.
//
// Três armadilhas já tropeçadas e evitadas aqui:
//  - `console.log` não chega ao terminal (o addon instrumenta o console dentro
//    da `play`); o canal é a exceção — ver `lancarProbe`.
//  - atributo de presença casa valor "false": todo seletor de presença usa
//    `[attr]:not([attr="false"])`.
//  - divergência de nome de classe entre stacks faz o seletor não casar e o
//    campo vir `null`; os seletores aceitam as formas conhecidas e o retrato
//    registra QUAL casou (`classes`).

import { ratio, backgroundEffective, type Contrast } from './cor';

export type RetratoDeElemento = {
  texto: string;
  tag: string;
  role: string | null;
  classes: string;
  slot: string | null;
  tabIndex: number;
  ariaChecked: string | null;
  ariaDisabled: string | null;
  ariaHaspopup: string | null;
  ariaExpanded: string | null;
  ariaHidden: string | null;
  /** `pointer-events` computado — é o que barra o clique no item desabilitado. */
  pointerEvents: string;
  outrosData: string[];
};

export type PanelRetrato = {
  tag: string;
  role: string | null;
  classes: string;
  slot: string | null;
  /** Fundo composto; `rgba(0, 0, 0, 0)` denuncia painel translúcido. */
  background: string;
  cor: string;
  raio: string;
  sombra: string;
  border: string;
  ancoradoNoBody: boolean;
} | null;

export type KeyboardRetrato = {
  /** Quem recebe o foco assim que o painel abre. */
  openFocus: string | null;
  /** Quantos itens estão no percurso do Tab (roving tabindex exige 1). */
  itemsTabulaveis: number;
  arrowBaixoAfter: string | null;
  arrowCimaAfter: string | null;
  endAfter: string | null;
  homeAfter: string | null;
  /** Typeahead: para onde o foco vai ao digitar uma letra. */
  digitarAfter: string | null;
  /** A seta pousa no item desabilitado? WAI-ARIA permite; nem toda lib faz. */
  arrowAlcancaDisabled: boolean | null;
};

export type RetratoDoDropdown = {
  gatilho: RetratoDeElemento | null;
  painel: PanelRetrato;
  /** `role="group"` dentro do menu e o nome acessível de cada um. */
  grupos: Array<{ accessibleName: string | null; slot: string | null }>;
  rotulos: RetratoDeElemento[];
  separadores: RetratoDeElemento[];
  itens: RetratoDeElemento[];
  marcacoes: RetratoDeElemento[];
  /** Indicador visual do item marcado — `display` computado por estado. */
  indicadores: Array<{ parent: string; display: string; classes: string }>;
  shortcuts: Array<{ texto: string; classes: string; ariaHidden: string | null; encostaNaDireita: boolean }>;
  teclado: KeyboardRetrato | null;
  submenu: {
    subTrigger: RetratoDeElemento | null;
    arrowAbriu: boolean | null;
    /** O submenu nasce ao lado (não por cima) do menu pai? */
    onSide: boolean | null;
    /** O submenu cobre os irmãos do item que o abriu? */
    sobrepoe: boolean | null;
    escapeFechou: boolean | null;
  } | null;
  /** Para onde o foco volta depois de Escape. */
  closeFocus: string | null;
};

const DATA_IGNORADOS = new Set(['data-slot', 'data-testid']);

/** Presença de atributo SEM casar o valor "false", que algumas libs emitem. */
const PRESENTE = (attr: string) => `[${attr}]:not([${attr}="false"])`;

function describe(el: Element | null | undefined): string | null {
  if (!el) return null;
  const html = el as HTMLElement;
  const texto = (html.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
  const papel = html.getAttribute('role') ?? html.tagName.toLowerCase();
  return texto ? `${papel}:${texto}` : papel;
}

function retratar(el: HTMLElement): RetratoDeElemento {
  return {
    texto: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute('role'),
    classes: el.getAttribute('class') ?? '',
    slot: el.getAttribute('data-slot'),
    tabIndex: el.tabIndex,
    ariaChecked: el.getAttribute('aria-checked'),
    ariaDisabled: el.getAttribute('aria-disabled'),
    ariaHaspopup: el.getAttribute('aria-haspopup'),
    ariaExpanded: el.getAttribute('aria-expanded'),
    ariaHidden: el.getAttribute('aria-hidden'),
    pointerEvents: getComputedStyle(el).pointerEvents,
    outrosData: el
      .getAttributeNames()
      .filter((n) => n.startsWith('data-') && !DATA_IGNORADOS.has(n)),
  };
}

function retratarPanel(painel: HTMLElement | null): PanelRetrato {
  if (!painel) return null;
  const s = getComputedStyle(painel);
  return {
    tag: painel.tagName.toLowerCase(),
    role: painel.getAttribute('role'),
    classes: painel.getAttribute('class') ?? '',
    slot: painel.getAttribute('data-slot'),
    background: s.backgroundColor,
    cor: s.color,
    raio: s.borderTopLeftRadius,
    sombra: s.boxShadow,
    border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
    ancoradoNoBody: !painel.closest('#storybook-root'),
  };
}

/** O painel aberto: o primeiro `role="menu"` do documento. */
export function findPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[role="menu"]');
}

/** Espera a condição virar verdadeira; devolve o que ela valia no fim. */
async function ate(cond: () => boolean, limit = 1200): Promise<boolean> {
  const end = Date.now() + limit;
  while (Date.now() < end) {
    if (cond()) return true;
    await new Promise((r) => setTimeout(r, 25));
  }
  return cond();
}

export type ProbeOptions = {
  /** O botão que abre o menu; `null` onde a story não tem gatilho. */
  gatilho?: HTMLElement | null;
  /** `userEvent` de `storybook/test` — injetado para o colhedor não importar nada. */
  teclado: {
    keyboard: (texto: string) => Promise<void>;
    click: (el: Element) => Promise<void>;
  };
  /** Mede navegação por setas/Home/End/typeahead. Exige menu já aberto. */
  measureKeyboard?: boolean;
  /** Letra usada no typeahead — deve ser a inicial do ÚLTIMO item. */
  letraDeBusca?: string;
  /** Mede abertura do submenu por seta e fechamento por Escape. */
  medirSubmenu?: boolean;
  /** Fecha com Escape ao final e mede para onde o foco volta. */
  medirFocoAoFechar?: boolean;
};

/**
 * Radiografa o menu ABERTO no documento e, opcionalmente, exercita teclado e
 * submenu. Ordem importa: teclado antes de submenu, e o Escape final por
 * último, porque cada um muda o estado que o próximo lê.
 */
export async function radiografarDropdown(
  opts: ProbeOptions,
): Promise<RetratoDoDropdown> {
  const { gatilho = null, teclado } = opts;
  const painel = findPanel();

  const inside = <T extends HTMLElement>(sel: string): T[] =>
    painel ? Array.from(painel.querySelectorAll<T>(sel)) : [];

  // Os retratos são materializados AGORA, não no `return`: o painel do Vanilla
  // sai do DOM no mesmo tick do Escape, e `getComputedStyle` de nó desanexado
  // devolve string vazia em todo campo — o que se leria como "sem estilo" é a
  // medição chegando tarde.
  const itens = inside<HTMLElement>('[role="menuitem"]').map(retratar);
  const marcacoes = inside<HTMLElement>(
    '[role="menuitemcheckbox"], [role="menuitemradio"]',
  ).map(retratar);
  const rotulos = inside<HTMLElement>(
    '.nds-dropdown-menu-label, [data-slot="dropdown-menu-label"], [data-slot="dropdown-menu-group-heading"]',
  ).map(retratar);
  const separadores = inside<HTMLElement>(
    '[role="separator"], .nds-dropdown-menu-separator, [data-slot="dropdown-menu-separator"]',
  ).map(retratar);
  const grupos = inside<HTMLElement>('[role="group"]').map((g) => ({
    accessibleName:
      g.getAttribute('aria-label') ??
      (g.getAttribute('aria-labelledby')
        ? (document.getElementById(g.getAttribute('aria-labelledby')!)?.textContent ?? '').trim()
        : null),
    slot: g.getAttribute('data-slot'),
  }));
  const panelRetrato = retratarPanel(painel);

  const indicadores = inside<HTMLElement>(
    '.nds-dropdown-menu-item-indicator, [data-slot$="item-indicator"]',
  ).map((ind) => ({
    parent: describe(ind.closest('[role^="menuitem"]')) ?? '—',
    display: getComputedStyle(ind).display,
    classes: ind.getAttribute('class') ?? '',
  }));

  const shortcuts = inside<HTMLElement>(
    '.nds-dropdown-menu-shortcut, [data-slot="dropdown-menu-shortcut"]',
  ).map((a) => {
    const item = a.closest<HTMLElement>('[role^="menuitem"]');
    const ca = a.getBoundingClientRect();
    const ci = item?.getBoundingClientRect();
    return {
      texto: (a.textContent ?? '').trim(),
      classes: a.getAttribute('class') ?? '',
      ariaHidden: a.getAttribute('aria-hidden'),
      encostaNaDireita: ci ? ci.right - ca.right < ca.left - ci.left : false,
    };
  });

  // ── Teclado ────────────────────────────────────────────────────────────────
  let keyboardRetrato: KeyboardRetrato | null = null;
  if (opts.measureKeyboard && painel) {
    const navegaveis = [
      ...painel.querySelectorAll<HTMLElement>(
        '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
      ),
    ];
    const openFocus = describe(document.activeElement);
    const itemsTabulaveis = navegaveis.filter((i) => i.tabIndex === 0).length;

    // A medição parte do primeiro item, e não de onde a abertura deixou o foco:
    // sem isso o resultado depende do estado inicial de cada lib.
    navegaveis[0]?.focus();
    await teclado.keyboard('{ArrowDown}');
    const arrowBaixoAfter = describe(document.activeElement);
    await teclado.keyboard('{ArrowUp}');
    const arrowCimaAfter = describe(document.activeElement);
    await teclado.keyboard('{End}');
    const endAfter = describe(document.activeElement);
    await teclado.keyboard('{Home}');
    const homeAfter = describe(document.activeElement);

    let digitarAfter: string | null = null;
    if (opts.letraDeBusca) {
      await teclado.keyboard(opts.letraDeBusca);
      digitarAfter = describe(document.activeElement);
    }

    const desabilitado = painel.querySelector<HTMLElement>(
      `${PRESENTE('data-disabled')}, [aria-disabled="true"]`,
    );
    let arrowAlcancaDisabled: boolean | null = null;
    if (desabilitado) {
      navegaveis[0]?.focus();
      arrowAlcancaDisabled = false;
      for (let i = 0; i < navegaveis.length + 1; i++) {
        await teclado.keyboard('{ArrowDown}');
        if (document.activeElement === desabilitado) {
          arrowAlcancaDisabled = true;
          break;
        }
      }
    }

    keyboardRetrato = {
      openFocus,
      itemsTabulaveis,
      arrowBaixoAfter,
      arrowCimaAfter,
      endAfter,
      homeAfter,
      digitarAfter,
      arrowAlcancaDisabled,
    };
  }

  // ── Submenu ────────────────────────────────────────────────────────────────
  let submenu: RetratoDoDropdown['submenu'] = null;
  if (opts.medirSubmenu && painel) {
    const alvo = painel.querySelector<HTMLElement>(
      '.nds-dropdown-menu-sub-trigger, [data-slot="dropdown-menu-sub-trigger"], [aria-haspopup="menu"]',
    );
    if (!alvo) {
      submenu = {
        subTrigger: null,
        arrowAbriu: null,
        onSide: null,
        sobrepoe: null,
        escapeFechou: null,
      };
    } else {
      alvo.focus();
      await teclado.keyboard('{ArrowRight}');
      await ate(() => document.querySelectorAll('[role="menu"]').length > 1);
      const panels = Array.from(document.querySelectorAll<HTMLElement>('[role="menu"]'));
      const filho = panels.find((p) => p !== painel) ?? null;
      const arrowAbriu = filho !== null;
      // O posicionador (floating-ui) coloca o popup em passo assíncrono: medir a
      // caixa no tick da abertura lê a posição de partida, não a final. Espera a
      // esquerda parar de mudar antes de comparar com o menu pai.
      if (filho) {
        let previous = NaN;
        await ate(() => {
          const atual = filho.getBoundingClientRect().left;
          const estavel = atual === previous;
          previous = atual;
          return estavel;
        }, 1500);
      }
      const onSide = filho
        ? filho.getBoundingClientRect().left >= painel.getBoundingClientRect().right - 8
        : null;
      // Sobreposição real com o menu pai: `onSide` responde "nasce à direita?",
      // isto responde "cobre os irmãos do item que o abriu?".
      const sobrepoe = filho
        ? filho.getBoundingClientRect().left < painel.getBoundingClientRect().right - 8
        : null;
      await teclado.keyboard('{Escape}');
      const escapeFechou = await ate(
        () => document.querySelectorAll('[role="menu"]').length < panels.length,
      );
      submenu = { subTrigger: retratar(alvo), arrowAbriu, onSide, sobrepoe, escapeFechou };
    }
  }

  // ── Foco ao fechar ─────────────────────────────────────────────────────────
  let closeFocus: string | null = null;
  if (opts.medirFocoAoFechar) {
    await teclado.keyboard('{Escape}');
    // A devolução do foco é assíncrona em toda lib headless: ler o
    // `activeElement` no mesmo tick mede o menu ainda desmontando, e o retrato
    // acusaria uma falha de foco que não existe.
    await ate(() => document.querySelector('[role="menu"]') === null);
    await ate(() => document.activeElement === gatilho);
    closeFocus =
      document.activeElement === gatilho ? 'gatilho' : describe(document.activeElement);
  }

  return {
    gatilho: gatilho ? retratar(gatilho) : null,
    painel: panelRetrato,
    grupos,
    rotulos,
    separadores,
    itens,
    marcacoes,
    indicadores,
    shortcuts,
    teclado: keyboardRetrato,
    submenu,
    closeFocus,
  };
}

/** Único canal que atravessa o instrumentador do Storybook até o terminal. */
export function lancarProbe(stack: string, cenario: string, dados: unknown): never {
  throw new Error(`SONDA::${stack}::${cenario}::${JSON.stringify(dados)}`);
}

/**
 * Razão de contraste entre o texto do item e o fundo do popup.
 *
 * Existe porque o item de contrato correspondente dizia, e continuava dizendo,
 * "verificar por axe-core" — uma verificação que ninguém rodava: o axe do
 * test-runner mede o que está na tela, e comparar nome de token não responde a
 * pergunta. A razão WCAG responde.
 *
 * Duas armadilhas já pagas e resolvidas aqui: o fundo do painel pode ter alfa,
 * e aí `backgroundColor` devolve uma cor que ninguém vê — `backgroundEffective` sobe
 * até o primeiro ancestral opaco; e o item em REALCE tem outro fundo, então
 * medir o item destacado mede o realce, não o repouso. Passe um item em
 * repouso.
 *
 * O limite é 4.5: o item usa `--text-control` (14px) em peso normal, que é
 * texto normal pela WCAG — 3:1 só valeria a partir de 24px, ou 18.66px em
 * negrito.
 */
export function itemContrast(item: HTMLElement): Contrast | null {
  const frente = getComputedStyle(item).color;
  const background = backgroundEffective(item);
  if (!background) return null;
  return ratio(frente, background);
}
