// ─── Sonda do Menubar ─────────────────────────────────────────────────────────
//
// Colhedor compartilhado: mede o MESMO cenário nas cinco stacks e devolve um
// retrato do DOM que cada lib produz. O que difere entre as colunas é o achado —
// campo `null` significa "o contrato não foi cumprido aqui", não falha da
// medição.
//
// O canal de saída é a exceção, e não o `console.log`: o addon do Storybook
// instrumenta o console dentro da `play` e a mensagem não chega ao terminal.

export type RetratoDeElemento = {
  texto: string;
  tag: string;
  role: string | null;
  classes: string;
  slot: string | null;
  tabIndex: number;
  ariaHaspopup: string | null;
  ariaExpanded: string | null;
  ariaChecked: string | null;
  ariaDisabled: string | null;
  dataState: string | null;
  outrosData: string[];
};

export type RetratoDoMenubar = {
  barra: {
    tag: string;
    role: string | null;
    classes: string;
    slot: string | null;
    ariaOrientation: string | null;
  } | null;
  triggers: RetratoDeElemento[];
  /** Quantos gatilhos são alcançáveis pelo Tab — o menubar exige exatamente 1. */
  gatilhosTabulaveis: number;
  panels: Array<{
    role: string | null;
    slot: string | null;
    classes: string;
    background: string;
    ancoradoNoBody: boolean;
  }>;
  itens: RetratoDeElemento[];
  marcacoes: RetratoDeElemento[];
  shortcuts: { quantidade: number; classes: string | null };
};

const DATA_IGNORADOS = new Set(['data-slot', 'data-state', 'data-testid']);

function retratar(el: HTMLElement): RetratoDeElemento {
  return {
    texto: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute('role'),
    classes: el.getAttribute('class') ?? '',
    slot: el.getAttribute('data-slot'),
    tabIndex: el.tabIndex,
    ariaHaspopup: el.getAttribute('aria-haspopup'),
    ariaExpanded: el.getAttribute('aria-expanded'),
    ariaChecked: el.getAttribute('aria-checked'),
    ariaDisabled: el.getAttribute('aria-disabled'),
    dataState: el.getAttribute('data-state'),
    outrosData: el
      .getAttributeNames()
      .filter((n) => n.startsWith('data-') && !DATA_IGNORADOS.has(n)),
  };
}

/**
 * Radiografa a barra e TODOS os painéis abertos no documento.
 *
 * `barra` é o elemento com `role="menubar"`; os painéis são procurados no
 * `document.body` porque quatro das cinco stacks os portalizam.
 */
export function radiografarMenubar(barra: HTMLElement | null): RetratoDoMenubar {
  const triggers = barra
    ? Array.from(barra.querySelectorAll<HTMLElement>('[aria-haspopup], button'))
    : [];

  const panels = Array.from(document.querySelectorAll<HTMLElement>('[role="menu"]'));

  const itens: RetratoDeElemento[] = [];
  const marcacoes: RetratoDeElemento[] = [];
  let shortcuts: { quantidade: number; classes: string | null } = {
    quantidade: 0,
    classes: null,
  };

  for (const painel of panels) {
    for (const el of painel.querySelectorAll<HTMLElement>('[role="menuitem"]')) {
      itens.push(retratar(el));
    }
    for (const el of painel.querySelectorAll<HTMLElement>(
      '[role="menuitemcheckbox"], [role="menuitemradio"]',
    )) {
      marcacoes.push(retratar(el));
    }
    const encontrados = painel.querySelectorAll<HTMLElement>(
      '[data-slot$="shortcut"], .nds-dropdown-menu-shortcut, .nds-menubar-shortcut',
    );
    if (encontrados.length > 0) {
      shortcuts = {
        quantidade: shortcuts.quantidade + encontrados.length,
        classes: encontrados[0].getAttribute('class'),
      };
    }
  }

  return {
    barra: barra
      ? {
          tag: barra.tagName.toLowerCase(),
          role: barra.getAttribute('role'),
          classes: barra.getAttribute('class') ?? '',
          slot: barra.getAttribute('data-slot'),
          ariaOrientation: barra.getAttribute('aria-orientation'),
        }
      : null,
    triggers: triggers.map(retratar),
    gatilhosTabulaveis: triggers.filter((g) => g.tabIndex === 0).length,
    panels: panels.map((p) => ({
      role: p.getAttribute('role'),
      slot: p.getAttribute('data-slot'),
      classes: p.getAttribute('class') ?? '',
      background: getComputedStyle(p).backgroundColor,
      ancoradoNoBody: !p.closest('#storybook-root'),
    })),
    itens,
    marcacoes,
    shortcuts,
  };
}

/** Único canal que atravessa o instrumentador do Storybook até o terminal. */
export function lancarProbe(stack: string, cenario: string, dados: unknown): never {
  throw new Error(`SONDA::${stack}::${cenario}::${JSON.stringify(dados)}`);
}
