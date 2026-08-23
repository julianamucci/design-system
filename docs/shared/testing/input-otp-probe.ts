/**
 * Sonda de comparação do InputOTP entre as cinco stacks.
 *
 * Um campo de código de verificação é o caso em que a contagem de `expect()`
 * mente com mais facilidade: as stacks que rodam lib headless escondem UM
 * `<input>` real atrás de caixas desenhadas, e uma play que confere
 * `input.value` fica verde mesmo que NENHUMA caixa seja pintada. Foi o que
 * aconteceu — um Playground verde renderizando zero slots.
 *
 * A sonda procura os elementos pelo contrato `.nds-*`. Onde o contrato não é
 * cumprido o campo vem `null` (ou `0`) — e isso É o achado, não falha da
 * medição.
 *
 * Duas famílias de markup convivem por decisão de arquitetura, e a sonda aceita
 * as duas registrando qual casou:
 *
 *   · NATIVA   — um `<input maxlength="1">` por dígito dentro de `.nds-input-otp`
 *                (referência cross-stack: sem lib, é o que o design system
 *                define). Cada slot é focalizável e tem nome próprio.
 *   · COMPOSTA — `.nds-input-otp-container` com UM `<input>` recortado e slots
 *                `<div>` pintados por `data-active`/`char`. Um nome só para o
 *                conjunto; as caixas não existem para o leitor de tela.
 *
 * Armadilhas já tropeçadas e evitadas aqui:
 *
 *   - `console.log` não chega ao terminal (o addon instrumenta o console dentro
 *     da play). O canal é a exceção — ver `reportProbe`.
 *   - `[data-active]` casa `data-active="false"`, que a lib emite em TODOS os
 *     slots. Os seletores usam `:not([data-active="false"])`.
 *   - `:hover` não acende com evento sintético do `userEvent`. A cor do hover é
 *     lida da DECLARAÇÃO da folha e resolvida pelo navegador — ver
 *     `hoverColorDeclarada`.
 *   - medir logo após `focus()` devolve o primeiro quadro da transição de
 *     `border-color`. Toda leitura de estado passa por `noTransicao`.
 */

import { ruleDeclaration, backgroundEffective, darkLigarTheme, ratio, resolveColor, noTransicao } from './cor';

export type { Contrast } from './cor';
export { darkLigarTheme };

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FamiliaDeMarkup = 'nativa' | 'composta' | 'nenhuma';

export interface SlotMeasurement {
  index: number;
  tag: string;
  /** O que a pessoa vê na caixa: `value` no input, texto no div. */
  caractere: string | null;
  focalizavel: boolean;
  /** `null` é caixa anônima — o leitor não diz em qual dígito a pessoa está. */
  accessibleName: string | null;
  active: boolean;
  temCaret: boolean;
  disabled: boolean;
  ariaInvalid: string | null;
  autocomplete: string | null;
  inputmode: string | null;
  width: number;
  height: number;
  raio: string;
  borderWidth: string;
  corDaBorda: string;
  background: string;
  cor: string;
  opacity: string;
  classesInertes: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEL_CONTAINER = '.nds-input-otp, .nds-input-otp-container';
const SEL_SLOT = '.nds-input-otp-slot';
const SEL_SEPARATOR = '.nds-input-otp-separator';
const SEL_ACTIVE = '[data-active]:not([data-active="false"])';

const text = (el: Element | null | undefined): string | null =>
  el?.textContent?.trim().replace(/\s+/g, ' ') || null;

const classesDe = (el: Element | null | undefined): string[] =>
  (el?.getAttribute('class') || '').split(/\s+/).filter(Boolean);

/** Nome acessível pela ordem que o leitor usa. `null` é elemento sem nome. */
export function accessibleName(el: Element | null | undefined): string | null {
  if (!el) return null;
  const labelled = el.getAttribute('aria-labelledby');
  if (labelled) {
    const partes = labelled
      .split(/\s+/)
      .map((id) => el.ownerDocument.getElementById(id)?.textContent?.trim())
      .filter(Boolean);
    if (partes.length) return partes.join(' ');
  }
  const label = el.getAttribute('aria-label');
  if (label?.trim()) return label.trim();
  const id = el.getAttribute('id');
  if (id) {
    const label = el.ownerDocument.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }
  const inside = el.closest('label');
  if (inside?.textContent?.trim()) return inside.textContent.trim();
  return null;
}

export function containerDe(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>(SEL_CONTAINER);
}

export function slotsDe(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(SEL_SLOT)];
}

export function familiaDe(root: HTMLElement): FamiliaDeMarkup {
  const slots = slotsDe(root);
  if (!slots.length) return 'nenhuma';
  return slots[0].tagName.toLowerCase() === 'input' ? 'nativa' : 'composta';
}

/**
 * O elemento que RECEBE a digitação.
 *
 * Na família composta é o `<input>` único recortado pela lib — que não carrega
 * a classe do contrato, então é procurado pela vizinhança do container. Na
 * nativa é o primeiro slot. Devolver o alvo certo é o que permite às cinco
 * stories digitarem com o mesmo código.
 */
export function entryField(root: HTMLElement): HTMLInputElement | null {
  const familia = familiaDe(root);
  if (familia === 'nativa') return slotsDe(root)[0] as HTMLInputElement | null;
  const container = containerDe(root);
  return (
    root.querySelector<HTMLInputElement>('input[data-input-otp]') ??
    container?.parentElement?.querySelector<HTMLInputElement>('input') ??
    root.querySelector<HTMLInputElement>('input') ??
    null
  );
}

/** O que cada caixa EXIBE hoje — `''` é caixa pintada e vazia. */
export function caracteresVisiveis(root: HTMLElement): string[] {
  return slotsDe(root).map((s) =>
    s.tagName.toLowerCase() === 'input' ? (s as HTMLInputElement).value : (text(s) ?? ''),
  );
}

/** Índice da caixa que mostra o cursor. `-1` é nenhuma — o cursor sumiu. */
export function slotWithCaret(root: HTMLElement): number {
  const slots = slotsDe(root);
  const byAttr = slots.findIndex(
    (s) => s.matches(SEL_ACTIVE) || !!s.querySelector('.nds-input-otp-caret'),
  );
  if (byAttr !== -1) return byAttr;
  return slots.findIndex((s) => s === s.ownerDocument.activeElement);
}

/**
 * Cola `code` no elemento em foco, como o navegador faria.
 *
 * `userEvent.paste` existe, mas depende do clipboard do runner e cada stack o
 * importa do seu próprio pacote. Um `ClipboardEvent` real medido no mesmo lugar
 * nas cinco é o que torna a coluna comparável.
 */
export function colar(root: HTMLElement, code: string): boolean {
  const target = (root.ownerDocument.activeElement as HTMLElement | null) ?? entryField(root);
  if (!target) return false;
  const data = new DataTransfer();
  data.setData('text', code);
  return target.dispatchEvent(
    new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }),
  );
}

/**
 * Cor que a folha DECLARA para o hover do slot, já resolvida pelo navegador.
 *
 * `:hover` não acende com evento sintético, então provocar o estado não é
 * opção. Ler a declaração e deixar o navegador expandir `var()` e compor o alfa
 * mantém a medida sendo do navegador — e é assim que se prova que o hover
 * REFORÇA a borda em vez de apagá-la, comparando com a cor de repouso.
 */
export function hoverColorDeclarada(root: HTMLElement): string | null {
  const declarada = ruleDeclaration(
    root.ownerDocument,
    (selector) => selector.includes(':hover') && selector.includes('nds-input-otp'),
    'border-color',
  );
  return declarada ? resolveColor(root, declarada) : null;
}

// ─── Medição ──────────────────────────────────────────────────────────────────

/**
 * Folga horizontal entre duas peças vizinhas, em pixels arredondados.
 *
 * `gap` computado não responde: numa família as caixas são filhas diretas do
 * contêiner e na outra estão dentro de grupos, então o mesmo `gap` produz
 * espaçamentos diferentes. A distância entre as caixas responde nas duas.
 */
export function folgaEntre(a: Element | null | undefined, b: Element | null | undefined): number | null {
  if (!a || !b) return null;
  const ca = a.getBoundingClientRect();
  const cb = b.getBoundingClientRect();
  return Math.round(cb.left - ca.right);
}

function measureSlot(el: HTMLElement, index: number): SlotMeasurement {
  const cs = getComputedStyle(el);
  const box = el.getBoundingClientRect();
  const ehInput = el.tagName.toLowerCase() === 'input';
  return {
    index,
    tag: el.tagName.toLowerCase(),
    caractere: ehInput ? (el as HTMLInputElement).value : text(el),
    focalizavel: ehInput ? !(el as HTMLInputElement).disabled : el.tabIndex >= 0,
    accessibleName: accessibleName(el),
    active: el.matches(SEL_ACTIVE),
    temCaret: !!el.querySelector('.nds-input-otp-caret'),
    disabled: ehInput ? (el as HTMLInputElement).disabled : el.hasAttribute('data-disabled'),
    ariaInvalid: el.getAttribute('aria-invalid'),
    autocomplete: el.getAttribute('autocomplete'),
    inputmode: el.getAttribute('inputmode'),
    width: Math.round(box.width),
    height: Math.round(box.height),
    raio: `${cs.borderStartStartRadius} ${cs.borderStartEndRadius}`,
    borderWidth: `${cs.borderTopWidth} ${cs.borderInlineStartWidth} ${cs.borderInlineEndWidth}`,
    corDaBorda: cs.borderTopColor,
    background: cs.backgroundColor,
    cor: cs.color,
    opacity: cs.opacity,
    classesInertes: classesDe(el).filter((c) => !c.startsWith('nds-')),
  };
}

/** Mede UM InputOTP e o que o acompanha. `root` é o wrapper do cenário. */
export function measureInputOtp(root: HTMLElement) {
  const container = containerDe(root);
  const slots = slotsDe(root);
  const separadores = [...root.querySelectorAll<HTMLElement>(SEL_SEPARATOR)];
  const groups = [...root.querySelectorAll<HTMLElement>('.nds-input-otp-group')];
  const field = entryField(root);
  const familia = familiaDe(root);

  if (!container && !slots.length) {
    return { presente: false, familia } as const;
  }

  const csContainer = container ? getComputedStyle(container) : null;
  const described = field?.getAttribute('aria-describedby') ?? null;
  const targetsDescribed = described
    ? described.split(/\s+/).map((id) => root.ownerDocument.getElementById(id))
    : [];

  const measurements = noTransicao(container ?? root, () => slots.map(measureSlot));
  const background = backgroundEffective(slots[0] ?? container);

  return {
    presente: true,
    familia,
    estrutura: {
      containerTag: container?.tagName.toLowerCase() ?? null,
      containerClasses: classesDe(container),
      containerDataSlot: container?.getAttribute('data-slot') ?? null,
      /** Zero é o achado: caixa nenhuma pintada, com a suíte verde. */
      quantidadeDeSlots: slots.length,
      quantidadeDeGrupos: groups.length,
      quantidadeDeSeparadores: separadores.length,
      slotDataSlot: slots[0]?.getAttribute('data-slot') ?? null,
      /** Classe sem o prefixo do design system: inerte, não pinta nada. */
      classesInertes: [
        ...new Set([...classesDe(container), ...slots.flatMap(classesDe)].filter((c) => !c.startsWith('nds-'))),
      ],
      campoDeEntradaTag: field?.tagName.toLowerCase() ?? null,
      campoRecortado: field ? getComputedStyle(field).opacity !== '1' || !!field.style.clipPath : null,
    },
    semantica: {
      papelDoConjunto: container?.getAttribute('role') ?? null,
      nomeDoConjunto: accessibleName(container),
      nomeDoCampo: accessibleName(field),
      /** Quantas caixas o leitor consegue nomear. `0` na família composta. */
      slotsComNome: measurements.filter((m) => m.accessibleName).length,
      slotsFocalizaveis: measurements.filter((m) => m.focalizavel).length,
      nomesDosSlots: measurements.map((m) => m.accessibleName),
      autocompleteDoCampo: field?.getAttribute('autocomplete') ?? null,
      inputmodeDoCampo: field?.getAttribute('inputmode') ?? null,
      autocompletePorSlot: measurements.map((m) => m.autocomplete),
      papelDoSeparador: separadores[0]?.getAttribute('role') ?? null,
      separadorEscondido: separadores[0]?.getAttribute('aria-hidden') ?? null,
      textoDoSeparador: text(separadores[0]),
      ariaInvalidDoCampo: field?.getAttribute('aria-invalid') ?? null,
      ariaInvalidPorSlot: measurements.map((m) => m.ariaInvalid),
      ariaDescribedby: described,
      alvoDescribedbyExiste: described ? targetsDescribed.every(Boolean) : null,
      maxlengthDoCampo: field && field.maxLength > 0 ? field.maxLength : null,
      campoDesabilitado: field?.disabled ?? null,
    },
    geometria: {
      larguraDoConjunto: container ? Math.round(container.getBoundingClientRect().width) : null,
      displayDoContainer: csContainer?.display ?? null,
      gapDoContainer: csContainer?.gap ?? null,
      slot: measurements[0]
        ? { width: measurements[0].width, height: measurements[0].height, border: measurements[0].borderWidth }
        : null,
      raioPrimeiro: measurements[0]?.raio ?? null,
      raioUltimo: measurements.at(-1)?.raio ?? null,
      raioMiolo: measurements[1]?.raio ?? null,
      /** Slots colados: a borda esquerda do miolo é suprimida no desenho. */
      bordaDoMiolo: measurements[1]?.borderWidth ?? null,
      /**
       * Distância REAL entre dois slots vizinhos, em pixels.
       *
       * É o par da `bordaDoMiolo`: o desenho suprime a borda esquerda do miolo
       * porque conta que a caixa vizinha encoste. Qualquer folga aqui deixa a
       * caixa aberta de um lado — defeito que só a medição pega, porque o CSS
       * das duas peças está certo em separado.
       */
      folgaEntreSlots: folgaEntre(slots[0], slots[1]),
      folgaAntesDoSeparador: folgaEntre(separadores[0]?.previousElementSibling, separadores[0]),
      folgaDepoisDoSeparador: folgaEntre(separadores[0], separadores[0]?.nextElementSibling),
    },
    state: {
      caretEm: slotWithCaret(root),
      caracteres: measurements.map((m) => m.caractere),
      opacidadeDoContainer: csContainer?.opacity ?? null,
      opacidadeDoSlot: measurements[0]?.opacity ?? null,
      corDaBordaEmRepouso: measurements[0]?.corDaBorda ?? null,
      corDaBordaNoHover: hoverColorDeclarada(root),
      fundoDoSlot: measurements[0]?.background ?? null,
      corDoTexto: measurements[0]?.cor ?? null,
    },
    /**
     * As linhas da TABELA DE TOKENS, medidas em vez de lidas na folha.
     *
     * A tabela existe para quem vai customizar, e errada custa mais que
     * ausente: a rodada do textarea achou linhas que eram falsas ALÉM de
     * mortas. Cada campo aqui é uma linha da tabela, e é este bloco que a
     * confirma.
     */
    tokens: (() => {
      const caret = root.querySelector<HTMLElement>('.nds-input-otp-caret');
      const csCaret = caret ? getComputedStyle(caret) : null;
      const csSep = separadores[0] ? getComputedStyle(separadores[0]) : null;
      const csFirst = slots[0] ? getComputedStyle(slots[0]) : null;
      return {
        slotSize: csFirst ? `${csFirst.width} × ${csFirst.height}` : null,
        slotFontSize: csFirst?.fontSize ?? null,
        border: csFirst ? `${csFirst.borderTopWidth} ${csFirst.borderTopColor}` : null,
        rounded: measurements[0]?.raio ?? null,
        caretExiste: !!caret,
        caretCaixa: csCaret ? `${csCaret.width} × ${csCaret.height}` : null,
        caretCor: csCaret?.backgroundColor ?? null,
        caretAnimacao: csCaret ? `${csCaret.animationName} ${csCaret.animationDuration}` : null,
        separadorMargem: csSep ? `${csSep.marginInlineStart} / ${csSep.marginInlineEnd}` : null,
        separadorCor: csSep?.color ?? null,
      };
    })(),
    contraste: {
      textoNoSlot: background && measurements[0] ? ratio(measurements[0].cor, background) : null,
      bordaNoFundo: background && measurements[0] ? ratio(measurements[0].corDaBorda, background) : null,
      hoverNoFundo: background && hoverColorDeclarada(root) ? ratio(hoverColorDeclarada(root)!, background) : null,
    },
    slots: measurements,
  };
}

/**
 * Mede os cenários marcados com `data-sonda="<nome>"` dentro de `root`.
 * Cenário ausente vem `null` — é o achado de "a stack não monta este caso".
 */
export function multipleMeasure(root: HTMLElement, cenarios: string[]) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const target = root.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    registro[cenario] = target ? measureInputOtp(target) : null;
  }
  return registro;
}

/**
 * Mede o cenário no tema ESCURO — metade do produto que o axe do test-runner
 * nunca vê, porque a tela está sempre no claro. A classe sai no `finally`:
 * deixá-la posta envenena a story seguinte e a foto do Chromatic.
 */
export function darkMeasure(root: HTMLElement, cenario: string) {
  const target = root.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
  if (!target) return null;
  const desfazer = darkLigarTheme(root.ownerDocument);
  try {
    const measurement = measureInputOtp(target);
    if (!measurement.presente) return null;
    return { state: measurement.state, contraste: measurement.contraste };
  } finally {
    desfazer();
  }
}

/**
 * Emite o registro para fora do navegador.
 *
 * Via exceção, e não `console.log`: o addon do Storybook instrumenta o console
 * dentro da play e nada do que se escreve ali chega ao terminal do vitest.
 */
export function reportProbe(stack: string, root: HTMLElement, cenarios: string[], extra?: unknown) {
  const registro = {
    light: multipleMeasure(root, cenarios),
    escuro: darkMeasure(root, cenarios[0]),
    comportamento: extra ?? null,
  };
  throw new Error(`SONDA::${stack}::${JSON.stringify(registro)}`);
}
