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

export type { Contraste } from './cor';
export { darkLigarTheme };

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FamiliaDeMarkup = 'nativa' | 'composta' | 'nenhuma';

export interface SlotMeasurement {
  indice: number;
  tag: string;
  /** O que a pessoa vê na caixa: `value` no input, texto no div. */
  caractere: string | null;
  focalizavel: boolean;
  /** `null` é caixa anônima — o leitor não diz em qual dígito a pessoa está. */
  nomeAcessivel: string | null;
  ativo: boolean;
  temCaret: boolean;
  desabilitado: boolean;
  ariaInvalid: string | null;
  autocomplete: string | null;
  inputmode: string | null;
  largura: number;
  altura: number;
  raio: string;
  borderWidth: string;
  corDaBorda: string;
  background: string;
  cor: string;
  opacidade: string;
  classesInertes: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEL_CONTAINER = '.nds-input-otp, .nds-input-otp-container';
const SEL_SLOT = '.nds-input-otp-slot';
const SEL_SEPARATOR = '.nds-input-otp-separator';
const SEL_ACTIVE = '[data-active]:not([data-active="false"])';

const texto = (el: Element | null | undefined): string | null =>
  el?.textContent?.trim().replace(/\s+/g, ' ') || null;

const classesDe = (el: Element | null | undefined): string[] =>
  (el?.getAttribute('class') || '').split(/\s+/).filter(Boolean);

/** Nome acessível pela ordem que o leitor usa. `null` é elemento sem nome. */
export function nomeAcessivel(el: Element | null | undefined): string | null {
  if (!el) return null;
  const labelled = el.getAttribute('aria-labelledby');
  if (labelled) {
    const partes = labelled
      .split(/\s+/)
      .map((id) => el.ownerDocument.getElementById(id)?.textContent?.trim())
      .filter(Boolean);
    if (partes.length) return partes.join(' ');
  }
  const rotulo = el.getAttribute('aria-label');
  if (rotulo?.trim()) return rotulo.trim();
  const id = el.getAttribute('id');
  if (id) {
    const label = el.ownerDocument.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }
  const dentro = el.closest('label');
  if (dentro?.textContent?.trim()) return dentro.textContent.trim();
  return null;
}

export function containerDe(raiz: HTMLElement): HTMLElement | null {
  return raiz.querySelector<HTMLElement>(SEL_CONTAINER);
}

export function slotsDe(raiz: HTMLElement): HTMLElement[] {
  return [...raiz.querySelectorAll<HTMLElement>(SEL_SLOT)];
}

export function familiaDe(raiz: HTMLElement): FamiliaDeMarkup {
  const slots = slotsDe(raiz);
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
export function entryField(raiz: HTMLElement): HTMLInputElement | null {
  const familia = familiaDe(raiz);
  if (familia === 'nativa') return slotsDe(raiz)[0] as HTMLInputElement | null;
  const container = containerDe(raiz);
  return (
    raiz.querySelector<HTMLInputElement>('input[data-input-otp]') ??
    container?.parentElement?.querySelector<HTMLInputElement>('input') ??
    raiz.querySelector<HTMLInputElement>('input') ??
    null
  );
}

/** O que cada caixa EXIBE hoje — `''` é caixa pintada e vazia. */
export function caracteresVisiveis(raiz: HTMLElement): string[] {
  return slotsDe(raiz).map((s) =>
    s.tagName.toLowerCase() === 'input' ? (s as HTMLInputElement).value : (texto(s) ?? ''),
  );
}

/** Índice da caixa que mostra o cursor. `-1` é nenhuma — o cursor sumiu. */
export function slotWithCaret(raiz: HTMLElement): number {
  const slots = slotsDe(raiz);
  const byAttr = slots.findIndex(
    (s) => s.matches(SEL_ACTIVE) || !!s.querySelector('.nds-input-otp-caret'),
  );
  if (byAttr !== -1) return byAttr;
  return slots.findIndex((s) => s === s.ownerDocument.activeElement);
}

/**
 * Cola `codigo` no elemento em foco, como o navegador faria.
 *
 * `userEvent.paste` existe, mas depende do clipboard do runner e cada stack o
 * importa do seu próprio pacote. Um `ClipboardEvent` real medido no mesmo lugar
 * nas cinco é o que torna a coluna comparável.
 */
export function colar(raiz: HTMLElement, codigo: string): boolean {
  const alvo = (raiz.ownerDocument.activeElement as HTMLElement | null) ?? entryField(raiz);
  if (!alvo) return false;
  const dados = new DataTransfer();
  dados.setData('text', codigo);
  return alvo.dispatchEvent(
    new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dados }),
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
export function hoverColorDeclarada(raiz: HTMLElement): string | null {
  const declarada = ruleDeclaration(
    raiz.ownerDocument,
    (seletor) => seletor.includes(':hover') && seletor.includes('nds-input-otp'),
    'border-color',
  );
  return declarada ? resolveColor(raiz, declarada) : null;
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

function measureSlot(el: HTMLElement, indice: number): SlotMeasurement {
  const cs = getComputedStyle(el);
  const caixa = el.getBoundingClientRect();
  const ehInput = el.tagName.toLowerCase() === 'input';
  return {
    indice,
    tag: el.tagName.toLowerCase(),
    caractere: ehInput ? (el as HTMLInputElement).value : texto(el),
    focalizavel: ehInput ? !(el as HTMLInputElement).disabled : el.tabIndex >= 0,
    nomeAcessivel: nomeAcessivel(el),
    ativo: el.matches(SEL_ACTIVE),
    temCaret: !!el.querySelector('.nds-input-otp-caret'),
    desabilitado: ehInput ? (el as HTMLInputElement).disabled : el.hasAttribute('data-disabled'),
    ariaInvalid: el.getAttribute('aria-invalid'),
    autocomplete: el.getAttribute('autocomplete'),
    inputmode: el.getAttribute('inputmode'),
    largura: Math.round(caixa.width),
    altura: Math.round(caixa.height),
    raio: `${cs.borderStartStartRadius} ${cs.borderStartEndRadius}`,
    borderWidth: `${cs.borderTopWidth} ${cs.borderInlineStartWidth} ${cs.borderInlineEndWidth}`,
    corDaBorda: cs.borderTopColor,
    background: cs.backgroundColor,
    cor: cs.color,
    opacidade: cs.opacity,
    classesInertes: classesDe(el).filter((c) => !c.startsWith('nds-')),
  };
}

/** Mede UM InputOTP e o que o acompanha. `raiz` é o wrapper do cenário. */
export function measureInputOtp(raiz: HTMLElement) {
  const container = containerDe(raiz);
  const slots = slotsDe(raiz);
  const separadores = [...raiz.querySelectorAll<HTMLElement>(SEL_SEPARATOR)];
  const grupos = [...raiz.querySelectorAll<HTMLElement>('.nds-input-otp-group')];
  const campo = entryField(raiz);
  const familia = familiaDe(raiz);

  if (!container && !slots.length) {
    return { presente: false, familia } as const;
  }

  const csContainer = container ? getComputedStyle(container) : null;
  const described = campo?.getAttribute('aria-describedby') ?? null;
  const targetsDescribed = described
    ? described.split(/\s+/).map((id) => raiz.ownerDocument.getElementById(id))
    : [];

  const measurements = noTransicao(container ?? raiz, () => slots.map(measureSlot));
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
      quantidadeDeGrupos: grupos.length,
      quantidadeDeSeparadores: separadores.length,
      slotDataSlot: slots[0]?.getAttribute('data-slot') ?? null,
      /** Classe sem o prefixo do design system: inerte, não pinta nada. */
      classesInertes: [
        ...new Set([...classesDe(container), ...slots.flatMap(classesDe)].filter((c) => !c.startsWith('nds-'))),
      ],
      campoDeEntradaTag: campo?.tagName.toLowerCase() ?? null,
      campoRecortado: campo ? getComputedStyle(campo).opacity !== '1' || !!campo.style.clipPath : null,
    },
    semantica: {
      papelDoConjunto: container?.getAttribute('role') ?? null,
      nomeDoConjunto: nomeAcessivel(container),
      nomeDoCampo: nomeAcessivel(campo),
      /** Quantas caixas o leitor consegue nomear. `0` na família composta. */
      slotsComNome: measurements.filter((m) => m.nomeAcessivel).length,
      slotsFocalizaveis: measurements.filter((m) => m.focalizavel).length,
      nomesDosSlots: measurements.map((m) => m.nomeAcessivel),
      autocompleteDoCampo: campo?.getAttribute('autocomplete') ?? null,
      inputmodeDoCampo: campo?.getAttribute('inputmode') ?? null,
      autocompletePorSlot: measurements.map((m) => m.autocomplete),
      papelDoSeparador: separadores[0]?.getAttribute('role') ?? null,
      separadorEscondido: separadores[0]?.getAttribute('aria-hidden') ?? null,
      textoDoSeparador: texto(separadores[0]),
      ariaInvalidDoCampo: campo?.getAttribute('aria-invalid') ?? null,
      ariaInvalidPorSlot: measurements.map((m) => m.ariaInvalid),
      ariaDescribedby: described,
      alvoDescribedbyExiste: described ? targetsDescribed.every(Boolean) : null,
      maxlengthDoCampo: campo && campo.maxLength > 0 ? campo.maxLength : null,
      campoDesabilitado: campo?.disabled ?? null,
    },
    geometria: {
      larguraDoConjunto: container ? Math.round(container.getBoundingClientRect().width) : null,
      displayDoContainer: csContainer?.display ?? null,
      gapDoContainer: csContainer?.gap ?? null,
      slot: measurements[0]
        ? { largura: measurements[0].largura, altura: measurements[0].altura, border: measurements[0].borderWidth }
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
    estado: {
      caretEm: slotWithCaret(raiz),
      caracteres: measurements.map((m) => m.caractere),
      opacidadeDoContainer: csContainer?.opacity ?? null,
      opacidadeDoSlot: measurements[0]?.opacidade ?? null,
      corDaBordaEmRepouso: measurements[0]?.corDaBorda ?? null,
      corDaBordaNoHover: hoverColorDeclarada(raiz),
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
      const caret = raiz.querySelector<HTMLElement>('.nds-input-otp-caret');
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
      hoverNoFundo: background && hoverColorDeclarada(raiz) ? ratio(hoverColorDeclarada(raiz)!, background) : null,
    },
    slots: measurements,
  };
}

/**
 * Mede os cenários marcados com `data-sonda="<nome>"` dentro de `raiz`.
 * Cenário ausente vem `null` — é o achado de "a stack não monta este caso".
 */
export function multipleMeasure(raiz: HTMLElement, cenarios: string[]) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    registro[cenario] = alvo ? measureInputOtp(alvo) : null;
  }
  return registro;
}

/**
 * Mede o cenário no tema ESCURO — metade do produto que o axe do test-runner
 * nunca vê, porque a tela está sempre no claro. A classe sai no `finally`:
 * deixá-la posta envenena a story seguinte e a foto do Chromatic.
 */
export function darkMeasure(raiz: HTMLElement, cenario: string) {
  const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
  if (!alvo) return null;
  const desfazer = darkLigarTheme(raiz.ownerDocument);
  try {
    const measurement = measureInputOtp(alvo);
    if (!measurement.presente) return null;
    return { estado: measurement.estado, contraste: measurement.contraste };
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
export function reportProbe(stack: string, raiz: HTMLElement, cenarios: string[], extra?: unknown) {
  const registro = {
    light: multipleMeasure(raiz, cenarios),
    escuro: darkMeasure(raiz, cenarios[0]),
    comportamento: extra ?? null,
  };
  throw new Error(`SONDA::${stack}::${JSON.stringify(registro)}`);
}
