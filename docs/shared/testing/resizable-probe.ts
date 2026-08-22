/**
 * Sonda de comparação do Resizable entre as cinco stacks.
 *
 * Um componente de arraste é dos mais fáceis de "testar" sem testar nada:
 * `expect(painel).toBeTruthy()` depois de um arraste que não moveu um pixel
 * passa sempre, e quatro das cinco stacks estavam exatamente nesse estado. O que
 * nenhuma delas verificava — e por isso não aparecia em contagem de `expect()` —
 * é se o painel MUDA DE TAMANHO, se a soma é preservada, se a alça é operável
 * sem mouse e se o valor anunciado ao leitor de tela é o tamanho real.
 *
 * A sonda procura os elementos pelo contrato `.nds-*` de
 * `docs/shared/styles/nds/resizable.css`. Onde o contrato não é cumprido o campo
 * vem `null` (ou `false`) — e isso É o achado, não falha da medição.
 *
 * Armadilhas evitadas aqui:
 *
 *   - `console.log` não chega ao terminal (o addon instrumenta o console dentro
 *     da play). O canal é a exceção — ver `reportProbe`.
 *   - **Geometria computada, nunca `style.width`.** O CSS compartilhado dá
 *     `flex-basis: 0` ao painel, e com isso `width` inline é ignorado no eixo
 *     principal: uma stack pode escrever `width: 35%` no elemento, a asserção
 *     sobre `style.width` passar, e os painéis continuarem do mesmo tamanho na
 *     tela. Aqui a medida é sempre `getBoundingClientRect`.
 *   - **Divergência de vocabulário entre stacks.** Cada lib emite o eixo com um
 *     atributo diferente (`data-direction`, `aria-orientation`,
 *     `data-panel-group-direction`, `data-orientation`). A sonda registra TODOS
 *     e diz qual casou — a divergência é, ela própria, o achado.
 *   - **Atributo de presença casa valor "false"**: `[data-disabled]` casaria
 *     `data-disabled="false"`. Os seletores usam `:not([attr="false"])`.
 *   - O foco muda o estado medido; a sonda devolve o foco a quem o tinha.
 */

import { backgroundEffective, darkLigarTheme, ratio, noTransicao } from './cor';

export type { Contraste } from './cor';
export { darkLigarTheme };

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PanelMeasurement {
  /** A classe do contrato. `false` é a stack não vestir o painel. */
  temClasseDoContrato: boolean;
  dataSlot: string | null;
  /** Região rolável precisa estar na ordem de tabulação (WCAG 2.1.1). */
  tabindex: string | null;
  overflow: string;
  larguraPx: number;
  alturaPx: number;
  /** Fração do eixo principal do grupo — é o número que a pessoa vê. */
  fraction: number | null;
  /** O que a stack escreveu, para comparar com o que o navegador aplicou. */
  styleWidth: string;
  styleHeight: string;
  panelSizeVar: string | null;
  flexGrow: string;
  flexBasis: string;
}

export interface HandleMeasurement {
  role: string | null;
  nomeAcessivel: string | null;
  ariaOrientation: string | null;
  /** Os outros vocabulários de eixo, para o diff entre stacks. */
  dataOrientation: string | null;
  dataPanelGroupDirection: string | null;
  dataDirection: string | null;
  valuenow: string | null;
  valuemin: string | null;
  valuemax: string | null;
  tabindex: string | null;
  ariaDisabled: string | null;
  dataDisabled: boolean;
  larguraPx: number;
  alturaPx: number;
  cursor: string;
  background: string;
  contrasteNoFundo: ReturnType<typeof ratio>;
  temGripDePontos: boolean;
  temGripBar: boolean;
  /** Seis pontinhos não têm nada a dizer a um leitor de tela. */
  gripAriaHidden: string | null;
}

export interface KeyboardMeasurement {
  /** `false` é o achado maior: alça inalcançável ou inerte sem mouse. */
  respondeAsSetas: boolean;
  fracaoAntes: number | null;
  fracaoDepois: number | null;
  valuenowBefore: string | null;
  valuenowAfter: string | null;
  /** O que um painel ganha o vizinho perde — a soma não pode escorrer. */
  somaPreservada: boolean;
  /** Setas do outro eixo não podem mover nada (nem roubar a rolagem). */
  ignoraOutroEixo: boolean;
  /** Insistir na seta contrária para no piso declarado, e não em zero. */
  fracaoNoPiso: number | null;
  valuenowNoPiso: string | null;
  /** Home / End / Enter — o extra que o conteúdo compartilhado promete. */
  respondeHome: boolean;
  respondeEnd: boolean;
  respondeEnter: boolean;
}

export interface GroupMeasurement {
  presente: boolean;
  tag: string | null;
  temClasseDoContrato: boolean;
  dataDirection: string | null;
  ariaOrientation: string | null;
  dataPanelGroupDirection: string | null;
  flexDirection: string;
  panels: PanelMeasurement[];
  punhos: HandleMeasurement[];
  teclado: KeyboardMeasurement | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEL_GROUP = '.nds-resizable, [data-slot="resizable"], [data-slot="resizable-panel-group"], [data-slot="resizable-pane-group"]';
const SEL_PANEL = '[data-slot="resizable-panel"], [data-slot="resizable-pane"], .nds-resizable-panel';
const SEL_HANDLE = '[data-slot="resizable-handle"], .nds-resizable-handle';

const num = (v: number): number => Math.round(v * 100) / 100;

/** Nome acessível pela ordem que o leitor usa. `null` é controle sem nome. */
function nomeAcessivel(el: Element | null | undefined): string | null {
  if (!el) return null;
  const labelled = el.getAttribute('aria-labelledby');
  if (labelled) {
    const alvo = el.ownerDocument.getElementById(labelled.split(/\s+/)[0]);
    if (alvo?.textContent?.trim()) return alvo.textContent.trim();
  }
  const rotulo = el.getAttribute('aria-label');
  if (rotulo?.trim()) return rotulo.trim();
  return el.textContent?.trim() || null;
}

/** Filhos DIRETOS: num layout aninhado, o grupo de dentro não é do de fora. */
function childrenDiretos(grupo: HTMLElement, seletor: string): HTMLElement[] {
  return [...grupo.children].filter((c): c is HTMLElement => c instanceof HTMLElement && c.matches(seletor));
}

function horizontalEh(grupo: HTMLElement): boolean {
  return getComputedStyle(grupo).flexDirection.startsWith('row');
}

function measurement(el: HTMLElement, horizontal: boolean): number {
  const r = el.getBoundingClientRect();
  return horizontal ? r.width : r.height;
}

// ─── Medição estática ─────────────────────────────────────────────────────────

function measurePanel(p: HTMLElement, horizontal: boolean, total: number): PanelMeasurement {
  const cs = getComputedStyle(p);
  const r = p.getBoundingClientRect();
  return {
    temClasseDoContrato: p.classList.contains('nds-resizable-panel'),
    dataSlot: p.getAttribute('data-slot'),
    tabindex: p.getAttribute('tabindex'),
    overflow: cs.overflow,
    larguraPx: num(r.width),
    alturaPx: num(r.height),
    fraction: total > 0 ? num(measurement(p, horizontal) / total) : null,
    styleWidth: p.style.width,
    styleHeight: p.style.height,
    panelSizeVar: p.style.getPropertyValue('--panel-size') || null,
    flexGrow: cs.flexGrow,
    flexBasis: cs.flexBasis,
  };
}

function measureHandle(h: HTMLElement): HandleMeasurement {
  const cs = getComputedStyle(h);
  const r = h.getBoundingClientRect();
  const background = cs.backgroundColor;
  const atras = backgroundEffective(h.parentElement) ?? 'rgb(255, 255, 255)';
  const grip = h.querySelector('.nds-resizable-grip');
  return {
    role: h.getAttribute('role'),
    nomeAcessivel: nomeAcessivel(h),
    ariaOrientation: h.getAttribute('aria-orientation'),
    dataOrientation: h.getAttribute('data-orientation'),
    dataPanelGroupDirection: h.getAttribute('data-panel-group-direction'),
    dataDirection: h.getAttribute('data-direction'),
    valuenow: h.getAttribute('aria-valuenow'),
    valuemin: h.getAttribute('aria-valuemin'),
    valuemax: h.getAttribute('aria-valuemax'),
    tabindex: h.getAttribute('tabindex'),
    ariaDisabled: h.getAttribute('aria-disabled'),
    dataDisabled: h.matches('[data-disabled]:not([data-disabled="false"])'),
    larguraPx: num(r.width),
    alturaPx: num(r.height),
    cursor: cs.cursor,
    background,
    contrasteNoFundo: ratio(background, atras),
    temGripDePontos: !!grip,
    temGripBar: !!h.querySelector('.nds-resizable-grip-bar'),
    gripAriaHidden: grip?.querySelector('svg')?.getAttribute('aria-hidden') ?? null,
  };
}

// ─── Medição por teclado ──────────────────────────────────────────────────────

/**
 * Redimensionar por teclado é o item que mais costuma faltar: a alça precisa ser
 * alcançável e operável sem mouse (WCAG 2.1.1) e sem gesto de arrasto (2.5.7).
 *
 * A tecla vai por `KeyboardEvent` real e borbulhante no próprio punho — é onde
 * as quatro libs registram o ouvinte. `cancelable: true` porque todas chamam
 * `preventDefault`, e um evento não cancelável faz o ramo divergir.
 */
async function teclar(h: HTMLElement, key: string): Promise<void> {
  h.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  await settle();
}

/**
 * Espera o layout assentar antes de medir.
 *
 * Nenhuma das cinco stacks reescreve a geometria de forma síncrona ao `keydown`:
 * React agenda estado, Vue agenda o flush, Angular roda sem zone e o Vanilla
 * mexe no estilo mas o navegador só refaz o layout depois. A primeira versão
 * desta sonda media no mesmo instante da tecla e relatou "não responde às setas"
 * em TODAS as stacks — um defeito que não existia, dito por uma medição cega.
 */
function settle(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

function fracoes(panels: HTMLElement[], horizontal: boolean, total: number): number[] {
  return total > 0 ? panels.map((p) => measurement(p, horizontal) / total) : [];
}

async function measureKeyboard(
  grupo: HTMLElement,
  panels: HTMLElement[],
  punho: HTMLElement,
): Promise<KeyboardMeasurement | null> {
  if (panels.length < 2) return null;
  const horizontal = horizontalEh(grupo);
  const total = measurement(grupo, horizontal);
  const cresce = horizontal ? 'ArrowRight' : 'ArrowDown';
  const encolhe = horizontal ? 'ArrowLeft' : 'ArrowUp';
  const otherEixo = horizontal ? 'ArrowDown' : 'ArrowRight';

  const anterior = grupo.ownerDocument.activeElement as HTMLElement | null;
  punho.focus();

  try {
    const antes = fracoes(panels, horizontal, total);
    const valuenowBefore = punho.getAttribute('aria-valuenow');

    for (let i = 0; i < 5; i++) await teclar(punho, cresce);
    const depois = fracoes(panels, horizontal, total);
    const valuenowAfter = punho.getAttribute('aria-valuenow');

    const sum = depois.reduce((a, b) => a + b, 0);
    const sumBefore = antes.reduce((a, b) => a + b, 0);

    // Outro eixo: mede a partir do estado corrente, e não do inicial.
    const base = fracoes(panels, horizontal, total);
    for (let i = 0; i < 3; i++) await teclar(punho, otherEixo);
    const aposOtherEixo = fracoes(panels, horizontal, total);

    // Piso: insistir na seta contrária tem que parar no mínimo declarado.
    for (let i = 0; i < 40; i++) await teclar(punho, encolhe);
    const noPiso = fracoes(panels, horizontal, total);
    const valuenowNoPiso = punho.getAttribute('aria-valuenow');

    const mede = (a: number[], b: number[]) => a.some((v, i) => Math.abs(v - (b[i] ?? v)) > 0.005);

    const endBefore = fracoes(panels, horizontal, total);
    await teclar(punho, 'End');
    const respondeEnd = mede(endBefore, fracoes(panels, horizontal, total));
    const homeBefore = fracoes(panels, horizontal, total);
    await teclar(punho, 'Home');
    const respondeHome = mede(homeBefore, fracoes(panels, horizontal, total));
    const enterBefore = fracoes(panels, horizontal, total);
    await teclar(punho, 'Enter');
    const respondeEnter = mede(enterBefore, fracoes(panels, horizontal, total));

    return {
      respondeAsSetas: mede(antes, depois),
      fracaoAntes: antes[0] !== undefined ? num(antes[0]) : null,
      fracaoDepois: depois[0] !== undefined ? num(depois[0]) : null,
      valuenowBefore,
      valuenowAfter,
      somaPreservada: Math.abs(sum - sumBefore) < 0.02,
      ignoraOutroEixo: !mede(base, aposOtherEixo),
      fracaoNoPiso: noPiso[0] !== undefined ? num(noPiso[0]) : null,
      valuenowNoPiso,
      respondeHome,
      respondeEnd,
      respondeEnter,
    };
  } finally {
    anterior?.focus?.();
  }
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Mede um grupo. `comTeclado: false` para os cenários em que a interação
 * envenenaria a medida seguinte (o grupo desabilitado, por exemplo).
 */
export async function measureGroup(raiz: HTMLElement, comTeclado = true): Promise<GroupMeasurement> {
  const grupo = raiz.matches(SEL_GROUP) ? raiz : raiz.querySelector<HTMLElement>(SEL_GROUP);
  if (!grupo) {
    return {
      presente: false,
      tag: null,
      temClasseDoContrato: false,
      dataDirection: null,
      ariaOrientation: null,
      dataPanelGroupDirection: null,
      flexDirection: '',
      panels: [],
      punhos: [],
      teclado: null,
    };
  }

  const horizontal = horizontalEh(grupo);
  const total = measurement(grupo, horizontal);
  const panels = childrenDiretos(grupo, SEL_PANEL);
  const punhos = childrenDiretos(grupo, SEL_HANDLE);

  const estatico: GroupMeasurement = {
    presente: true,
    tag: grupo.tagName.toLowerCase(),
    temClasseDoContrato: grupo.classList.contains('nds-resizable'),
    dataDirection: grupo.getAttribute('data-direction'),
    ariaOrientation: grupo.getAttribute('aria-orientation'),
    dataPanelGroupDirection: grupo.getAttribute('data-panel-group-direction'),
    flexDirection: getComputedStyle(grupo).flexDirection,
    panels: panels.map((p) => measurePanel(p, horizontal, total)),
    punhos: punhos.map(measureHandle),
    teclado: null,
  };

  if (comTeclado && punhos[0]) estatico.teclado = await measureKeyboard(grupo, panels, punhos[0]);
  return estatico;
}

/**
 * Mede o punho no tema ESCURO — metade do produto que o axe do test-runner
 * nunca vê, porque a tela está sempre no claro. A classe sai no `finally`:
 * deixá-la posta envenena a story seguinte e a foto do Chromatic.
 */
export function darkMeasure(raiz: HTMLElement) {
  const punho = raiz.querySelector<HTMLElement>(SEL_HANDLE);
  if (!punho) return null;
  const desfazer = darkLigarTheme(raiz.ownerDocument);
  try {
    // `background-color` do punho está em transição; sem desligá-la a sonda
    // leria a cor do tema CLARO e relataria um divisor que não escurece.
    return noTransicao(punho, () => {
      const cs = getComputedStyle(punho);
      const atras = backgroundEffective(punho.parentElement) ?? 'rgb(0, 0, 0)';
      return { background: cs.backgroundColor, contrasteNoFundo: ratio(cs.backgroundColor, atras) };
    });
  } finally {
    desfazer();
  }
}

/**
 * O que a folha compartilhada REALMENTE aplica, lido do navegador.
 *
 * A tabela de tokens documentava seis classes de um framework utilitário que
 * saiu do projeto, e duas das linhas eram falsas além de mortas — diziam
 * `--border` no divisor (é `--ring`) e um "offset do anel de foco" que não
 * existe em regra nenhuma. Conferir a tabela contra a folha lida a olho foi
 * exatamente o que deixou isso passar; aqui a fonte é `getComputedStyle`.
 */
export function measureTokens(raiz: HTMLElement) {
  const punho = raiz.querySelector<HTMLElement>(SEL_HANDLE);
  const painel = raiz.querySelector<HTMLElement>(SEL_PANEL);
  if (!punho) return null;
  const grip = punho.querySelector<HTMLElement>('.nds-resizable-grip');
  const bar = punho.querySelector<HTMLElement>('.nds-resizable-grip-bar');
  const cs = getComputedStyle(punho);
  const anterior = raiz.ownerDocument.activeElement as HTMLElement | null;
  punho.focus();
  const withFocus = getComputedStyle(punho).boxShadow;
  anterior?.focus?.();
  const lineAfter = getComputedStyle(punho, '::after');

  return {
    punho: {
      background: cs.backgroundColor,
      transicao: cs.transitionDuration,
      boxShadowComFoco: withFocus,
      focusVisible: punho.matches(':focus-visible'),
    },
    areaDeToque: { largura: lineAfter.width, altura: lineAfter.height },
    grip: grip
      ? {
          background: getComputedStyle(grip).backgroundColor,
          border: getComputedStyle(grip).borderTopColor,
          raio: getComputedStyle(grip).borderTopLeftRadius,
          largura: getComputedStyle(grip).width,
          altura: getComputedStyle(grip).height,
        }
      : null,
    gripBar: bar
      ? {
          background: getComputedStyle(bar).backgroundColor,
          raio: getComputedStyle(bar).borderTopLeftRadius,
          largura: getComputedStyle(bar).width,
          altura: getComputedStyle(bar).height,
        }
      : null,
    painel: painel ? { overflow: getComputedStyle(painel).overflow, flexBasis: getComputedStyle(painel).flexBasis } : null,
    variaveis: {
      ring: getComputedStyle(raiz).getPropertyValue('--ring').trim(),
      border: getComputedStyle(raiz).getPropertyValue('--border').trim(),
      foreground: getComputedStyle(raiz).getPropertyValue('--foreground').trim(),
      radiusXs: getComputedStyle(raiz).getPropertyValue('--radius-xs').trim(),
      radius: getComputedStyle(raiz).getPropertyValue('--radius').trim(),
      spacing1: getComputedStyle(raiz).getPropertyValue('--spacing-1').trim(),
      spacing4: getComputedStyle(raiz).getPropertyValue('--spacing-4').trim(),
      spacing6: getComputedStyle(raiz).getPropertyValue('--spacing-6').trim(),
      durationFast: getComputedStyle(raiz).getPropertyValue('--duration-fast').trim(),
    },
  };
}

/**
 * Mede os cenários marcados com `data-sonda="<nome>"` dentro de `raiz`.
 * Cenário ausente vem `null` — é o achado de "a stack não monta este caso".
 */
export async function measureCenarios(raiz: HTMLElement, cenarios: string[]) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    // O cenário desabilitado TAMBÉM passa pelo teclado: o achado ali é o
    // divisor travado que mesmo assim se mexe.
    registro[cenario] = alvo ? await measureGroup(alvo, true) : null;
  }
  return registro;
}

/**
 * Emite o registro para fora do navegador.
 *
 * Via exceção, e não `console.log`: o addon do Storybook instrumenta o console
 * dentro da play e nada do que se escreve ali chega ao terminal do vitest.
 */
export async function reportProbe(stack: string, raiz: HTMLElement, cenarios: string[]) {
  const registro = {
    tokens: measureTokens(raiz),
    light: await measureCenarios(raiz, cenarios),
    escuro: darkMeasure(raiz),
    persistencia: Object.keys(localStorage).filter((k) => /resiz|panel|split|pane/i.test(k)),
  };
  throw new Error(`SONDA::${stack}::${JSON.stringify(registro)}`);
}
