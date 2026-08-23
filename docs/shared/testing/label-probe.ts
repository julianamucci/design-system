/**
 * Sonda de comparação do Label entre as cinco stacks.
 *
 * Um rótulo é o componente mais simples do catálogo e por isso o menos medido:
 * as cinco stacks tinham stories verdes que só conferiam presença no DOM e o
 * atributo `for`. Nenhuma verificava a ÚNICA função do componente — que clicar
 * no rótulo leve o foco (e a ativação) para o controle associado — nem o
 * esmaecimento prometido pela documentação quando o controle está desabilitado.
 *
 * A sonda procura os elementos pelo contrato `.nds-*`. Onde o contrato não é
 * cumprido o campo vem `null` — e isso É o achado, não falha da medição.
 *
 * Armadilhas evitadas aqui:
 *
 *   - `console.log` não chega ao terminal (o addon instrumenta o console dentro
 *     da play). O canal é a exceção — ver `reportProbe`.
 *   - `label.click()` é o teste real da associação: conferir só o atributo `for`
 *     passa com um id que não aponta para lugar nenhum. A sonda clica, lê o
 *     `activeElement` e DESFAZ o efeito (o toggle do checkbox volta ao estado
 *     anterior), para não envenenar a story seguinte.
 *   - opacidade só significa alguma coisa em COMPARAÇÃO: o esmaecimento do
 *     rótulo desabilitado é `opacidade < opacidade do cenário padrão`, não um
 *     número absoluto. Por isso todos os cenários são medidos na mesma passagem.
 *   - a divergência de vocabulário de classe é, ela própria, o achado: as duas
 *     famílias conhecidas de "controle irmão" (`peer` sem prefixo e `nds-peer`)
 *     são registradas em `familiaDePeer`.
 */

import { backgroundEffective, darkLigarTheme, ratio, noTransicao } from './cor';

export type { Contrast } from './cor';
export { darkLigarTheme };

// ─── Vocabulário ──────────────────────────────────────────────────────────────

/** Classes que já foram usadas para dizer "sou o controle irmão do rótulo". */
const CLASSES_DE_PEER = ['peer', 'nds-peer'] as const;

/** Classes que já foram usadas para dizer "esmaeça quando o irmão desabilitar". */
const CLASSES_DE_PEER_LABEL = [
  'nds-peer-label',
  'peer-disabled:opacity-50',
  'peer-disabled:cursor-not-allowed',
] as const;

const SELECTOR_CONTROL =
  'input, select, textarea, button, [role="checkbox"], [role="radio"], [role="switch"], [role="textbox"]';

const text = (el: Element | null | undefined): string | null =>
  el?.textContent?.trim().replace(/\s+/g, ' ') || null;

const classesDe = (el: Element | null | undefined): string[] =>
  (el?.getAttribute('class') || '').split(/\s+/).filter(Boolean);

/** `true` quando o controle está desabilitado por atributo OU por ARIA. */
function estaDisabled(el: Element | null): boolean | null {
  if (!el) return null;
  if ('disabled' in el && typeof (el as HTMLInputElement).disabled === 'boolean') {
    if ((el as HTMLInputElement).disabled) return true;
  }
  return el.getAttribute('aria-disabled') === 'true';
}

/** Estado marcável do controle, seja nativo ou ARIA. `null` = não é marcável. */
function checked(el: Element | null): boolean | null {
  if (!el) return null;
  const aria = el.getAttribute('aria-checked');
  if (aria === 'true' || aria === 'false') return aria === 'true';
  if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
    return el.checked;
  }
  const state = el.getAttribute('data-state');
  if (state === 'checked' || state === 'unchecked') return state === 'checked';
  return null;
}

// ─── Medição do clique ────────────────────────────────────────────────────────

/**
 * A função inteira do componente: clicar no rótulo foca e ativa o controle.
 *
 * `HTMLElement.click()` executa o comportamento de ativação do `<label>` como um
 * clique real — é o caminho do navegador, não uma simulação da biblioteca de
 * teste, e por isso responde pelo produto.
 *
 * Tudo é restaurado: o marcável volta ao estado anterior e o foco volta a quem
 * o tinha. Sem isso a sonda mudaria o resultado da story seguinte.
 */
function labelAoClick(label: HTMLElement, control: Element | null) {
  const doc = label.ownerDocument;
  const focusPrevious = doc.activeElement as HTMLElement | null;
  const checkedBefore = checked(control);

  let focou: boolean | null = null;
  let ativou: boolean | null = null;
  let error: string | null = null;

  try {
    label.click();
    const focado = doc.activeElement;
    focou = !!control && (focado === control || !!control.contains(focado));
    const checkedAfter = checked(control);
    ativou = checkedBefore === null ? null : checkedAfter !== checkedBefore;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  // Desfaz: devolve o marcável ao estado original e o foco a quem o tinha.
  if (checkedBefore !== null && checked(control) !== checkedBefore) {
    (control as HTMLElement).click();
  }
  if (focusPrevious && focusPrevious !== doc.body) focusPrevious.focus();
  else (doc.activeElement as HTMLElement | null)?.blur?.();

  return { focouOControle: focou, ativouOControle: ativou, error };
}

/** Quem recebe o clique no centro do rótulo — pega rótulo coberto por overlay. */
function clickReach(label: HTMLElement): { ehORotulo: boolean; quemRecebe: string | null } {
  const box = label.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return { ehORotulo: false, quemRecebe: null };
  const target = label.ownerDocument.elementFromPoint(
    box.left + box.width / 2,
    box.top + box.height / 2,
  );
  return {
    ehORotulo: !!target && (target === label || label.contains(target)),
    quemRecebe: target ? `${target.tagName.toLowerCase()}.${classesDe(target).join('.')}` : null,
  };
}

// ─── Aferições reusadas pelas stories ─────────────────────────────────────────
//
// Existem para que as stories afirmem EFEITO COMPUTADO em vez de nome de classe.
// Asserção de classe ficou anos verde afirmando `peer-disabled:opacity-50` — uma
// classe sem prefixo, inerte, que não esmaecia nada.

/** Opacidade de fato aplicada ao rótulo. */
export function opacityComputada(el: Element): number {
  return Number(getComputedStyle(el).opacity);
}

/** `cursor` de fato aplicado ao rótulo. */
export function cursorComputado(el: Element): string {
  return getComputedStyle(el).cursor;
}

/**
 * Clica no rótulo e devolve se o controle recebeu foco — sem deixar rastro.
 * É a asserção que faltava nas cinco stacks.
 */
export function clickFocaOControle(label: HTMLElement, control: Element | null): boolean | null {
  return labelAoClick(label, control).focouOControle;
}

/** Razão WCAG entre o texto do rótulo e o primeiro fundo opaco acima dele. */
export function labelContrast(el: Element): number | null {
  const background = backgroundEffective(el);
  if (!background) return null;
  return ratio(getComputedStyle(el).color, background)?.ratio ?? null;
}

/**
 * Contraste do rótulo NOS DOIS TEMAS — é o que o item de acessibilidade promete
 * ("em todos os temas") e o que o axe do test-runner nunca vê, porque a tela
 * está sempre no claro.
 *
 * A classe do escuro sai no `finally`: deixá-la posta envenena a story seguinte
 * e a foto do Chromatic.
 */
export function themeContrast(el: HTMLElement): { light: number | null; escuro: number | null } {
  const light = labelContrast(el);
  const desfazer = darkLigarTheme(el.ownerDocument);
  try {
    // `color` está em transição na troca de tema: sem desligá-la a leitura
    // devolveria a cor do tema claro e o número não diria nada.
    const escuro = noTransicao(el, () => labelContrast(el));
    return { light, escuro };
  } finally {
    desfazer();
  }
}

// ─── Medição ──────────────────────────────────────────────────────────────────

/** Mede UM rótulo e o controle que ele rotula. `root` é o wrapper do cenário. */
export function measureLabel(root: HTMLElement) {
  const label =
    root.querySelector<HTMLElement>('[data-slot="label"]') ??
    root.querySelector<HTMLElement>('label.nds-label') ??
    root.querySelector<HTMLElement>('label');

  if (!label) return { presente: false } as const;

  const doc = label.ownerDocument;
  const classes = classesDe(label);
  const cs = getComputedStyle(label);
  const box = label.getBoundingClientRect();

  // ── Associação ──────────────────────────────────────────────────────────────
  const htmlFor = label.getAttribute('for');
  const forTarget = htmlFor ? doc.getElementById(htmlFor) : null;
  const nested = label.querySelector(SELECTOR_CONTROL);
  const control = forTarget ?? nested ?? root.querySelector(SELECTOR_CONTROL);
  const forma = forTarget ? 'for' : nested ? 'aninhado' : null;

  // ── Marcador de obrigatório ─────────────────────────────────────────────────
  const marcador =
    label.querySelector<HTMLElement>('[aria-hidden="true"]') ??
    label.querySelector<HTMLElement>('.nds-text-destructive');
  const csMarcador = marcador ? getComputedStyle(marcador) : null;
  const marcadorBackground = marcador ? backgroundEffective(marcador) : null;

  const background = backgroundEffective(label);

  // ── Irmão desabilitado: qual vocabulário cada stack usa ─────────────────────
  const irmaos = [...(label.parentElement?.children ?? [])].filter((el) => el !== label);
  const familiaDePeer = CLASSES_DE_PEER.filter((c) =>
    irmaos.some((el) => el.classList.contains(c)),
  );

  return {
    presente: true,
    estrutura: {
      tag: label.tagName.toLowerCase(),
      dataSlot: label.getAttribute('data-slot'),
      temClasseBase: classes.includes('nds-label'),
      classes,
      /** Classe sem o prefixo do design system: inerte, não pinta nada. */
      classesInertes: classes.filter((c) => !c.startsWith('nds-')),
      /** Vocabulário de "esmaeça com o irmão desabilitado" presente no rótulo. */
      familiaDePeerNoRotulo: CLASSES_DE_PEER_LABEL.filter((c) => classes.includes(c)),
      /** Vocabulário de "sou o controle irmão" presente nos irmãos do rótulo. */
      familiaDePeer,
      estiloInline: label.getAttribute('style'),
      textoVisivel: text(label),
      wrapperClasses: classesDe(root.firstElementChild),
      wrapperDataDisabled: root.querySelector('[data-disabled]')?.getAttribute('data-disabled') ?? null,
    },
    associacao: {
      forma,
      htmlFor,
      alvoDoForExiste: htmlFor ? !!forTarget : null,
      controleTag: control?.tagName.toLowerCase() ?? null,
      controleTipo: control?.getAttribute('type') ?? control?.getAttribute('role') ?? null,
      controleId: control?.getAttribute('id') ?? null,
      controleDesabilitado: estaDisabled(control),
      controleAriaRequired: control?.getAttribute('aria-required') ?? null,
      /** Nome acessível do controle: é o que o leitor de tela anuncia. */
      nomeDoControle: control
        ? (control.getAttribute('aria-label') ??
           (control.getAttribute('aria-labelledby')
             ? text(doc.getElementById(control.getAttribute('aria-labelledby')!.split(/\s+/)[0]))
             : null) ??
           (control.getAttribute('id')
             ? text(doc.querySelector(`label[for="${CSS.escape(control.getAttribute('id')!)}"]`))
             : null))
        : null,
    },
    tipografia: {
      tamanhoDaFonte: cs.fontSize,
      pesoDaFonte: cs.fontWeight,
      alturaDeLinha: cs.lineHeight,
      familiaDaFonte: cs.fontFamily.split(',')[0],
      espacamentoDeLetra: cs.letterSpacing,
      display: cs.display,
      alinhamento: cs.alignItems,
      espacoInterno: cs.gap,
      selecaoDeTexto: cs.userSelect,
      width: Math.round(box.width),
      height: Math.round(box.height),
      /** Altura fixa em primitivo com texto é defeito de WCAG 1.4.4. */
      alturaCss: cs.height === 'auto' ? 'auto' : cs.height,
    },
    state: {
      cor: cs.color,
      backgroundEffective: background,
      opacity: Number(cs.opacity),
      cursor: cs.cursor,
      pointer: cs.pointerEvents,
    },
    obrigatorio: {
      existe: !!marcador,
      text: text(marcador),
      ariaHidden: marcador?.getAttribute('aria-hidden') ?? null,
      cor: csMarcador?.color ?? null,
      /** `null` significa "só pintura": nada anuncia a obrigatoriedade. */
      anunciado:
        control?.getAttribute('aria-required') === 'true' ||
        (control as HTMLInputElement | null)?.required === true
          ? 'aria-required'
          : null,
      contraste: csMarcador && marcadorBackground ? ratio(csMarcador.color, marcadorBackground) : null,
    },
    clique: {
      ...labelAoClick(label, control),
      reach: clickReach(label),
    },
    contraste: {
      textoNoFundo: background ? ratio(cs.color, background) : null,
    },
  };
}

/**
 * Mede os cenários marcados com `data-sonda="<nome>"` dentro de `root`.
 * Cenário ausente vem `null` — é o achado de "a stack não monta este caso".
 */
export function measureLabels(root: HTMLElement, cenarios: string[]) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const target = root.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    registro[cenario] = target ? measureLabel(target) : null;
  }
  return registro;
}

/**
 * Mede o cenário no tema ESCURO — metade do produto que o axe do test-runner
 * nunca vê, porque a tela está sempre no claro.
 *
 * A classe sai no `finally`: deixá-la posta envenena a story seguinte e a foto
 * do Chromatic.
 */
export function darkMeasure(root: HTMLElement, cenario: string) {
  const target = root.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
  const label = target?.querySelector<HTMLElement>('label');
  if (!target || !label) return null;

  const desfazer = darkLigarTheme(root.ownerDocument);
  try {
    // Trocar o tema troca `color`, que é propriedade em transição: sem desligá-la
    // a sonda leria a cor do tema CLARO e relataria um contraste que não existe.
    return noTransicao(label, () => {
      const measurement = measureLabel(target);
      if (!measurement.presente) return null;
      return { state: measurement.state, contraste: measurement.contraste, obrigatorio: measurement.obrigatorio };
    });
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
export function reportProbe(stack: string, root: HTMLElement, cenarios: string[]) {
  const registro = {
    light: measureLabels(root, cenarios),
    escuro: darkMeasure(root, cenarios[0]),
  };
  throw new Error(`SONDA::${stack}::${JSON.stringify(registro)}`);
}
