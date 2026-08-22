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

export type { Contraste } from './cor';
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

const texto = (el: Element | null | undefined): string | null =>
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
function marcado(el: Element | null): boolean | null {
  if (!el) return null;
  const aria = el.getAttribute('aria-checked');
  if (aria === 'true' || aria === 'false') return aria === 'true';
  if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
    return el.checked;
  }
  const estado = el.getAttribute('data-state');
  if (estado === 'checked' || estado === 'unchecked') return estado === 'checked';
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
function labelAoClick(rotulo: HTMLElement, controle: Element | null) {
  const doc = rotulo.ownerDocument;
  const focusPrevious = doc.activeElement as HTMLElement | null;
  const checkedBefore = marcado(controle);

  let focou: boolean | null = null;
  let ativou: boolean | null = null;
  let erro: string | null = null;

  try {
    rotulo.click();
    const focado = doc.activeElement;
    focou = !!controle && (focado === controle || !!controle.contains(focado));
    const checkedAfter = marcado(controle);
    ativou = checkedBefore === null ? null : checkedAfter !== checkedBefore;
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e);
  }

  // Desfaz: devolve o marcável ao estado original e o foco a quem o tinha.
  if (checkedBefore !== null && marcado(controle) !== checkedBefore) {
    (controle as HTMLElement).click();
  }
  if (focusPrevious && focusPrevious !== doc.body) focusPrevious.focus();
  else (doc.activeElement as HTMLElement | null)?.blur?.();

  return { focouOControle: focou, ativouOControle: ativou, erro };
}

/** Quem recebe o clique no centro do rótulo — pega rótulo coberto por overlay. */
function clickReach(rotulo: HTMLElement): { ehORotulo: boolean; quemRecebe: string | null } {
  const caixa = rotulo.getBoundingClientRect();
  if (caixa.width === 0 || caixa.height === 0) return { ehORotulo: false, quemRecebe: null };
  const alvo = rotulo.ownerDocument.elementFromPoint(
    caixa.left + caixa.width / 2,
    caixa.top + caixa.height / 2,
  );
  return {
    ehORotulo: !!alvo && (alvo === rotulo || rotulo.contains(alvo)),
    quemRecebe: alvo ? `${alvo.tagName.toLowerCase()}.${classesDe(alvo).join('.')}` : null,
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
export function clickFocaOControle(rotulo: HTMLElement, controle: Element | null): boolean | null {
  return labelAoClick(rotulo, controle).focouOControle;
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

/** Mede UM rótulo e o controle que ele rotula. `raiz` é o wrapper do cenário. */
export function measureLabel(raiz: HTMLElement) {
  const rotulo =
    raiz.querySelector<HTMLElement>('[data-slot="label"]') ??
    raiz.querySelector<HTMLElement>('label.nds-label') ??
    raiz.querySelector<HTMLElement>('label');

  if (!rotulo) return { presente: false } as const;

  const doc = rotulo.ownerDocument;
  const classes = classesDe(rotulo);
  const cs = getComputedStyle(rotulo);
  const caixa = rotulo.getBoundingClientRect();

  // ── Associação ──────────────────────────────────────────────────────────────
  const htmlFor = rotulo.getAttribute('for');
  const forTarget = htmlFor ? doc.getElementById(htmlFor) : null;
  const nested = rotulo.querySelector(SELECTOR_CONTROL);
  const controle = forTarget ?? nested ?? raiz.querySelector(SELECTOR_CONTROL);
  const forma = forTarget ? 'for' : nested ? 'aninhado' : null;

  // ── Marcador de obrigatório ─────────────────────────────────────────────────
  const marcador =
    rotulo.querySelector<HTMLElement>('[aria-hidden="true"]') ??
    rotulo.querySelector<HTMLElement>('.nds-text-destructive');
  const csMarcador = marcador ? getComputedStyle(marcador) : null;
  const marcadorBackground = marcador ? backgroundEffective(marcador) : null;

  const background = backgroundEffective(rotulo);

  // ── Irmão desabilitado: qual vocabulário cada stack usa ─────────────────────
  const irmaos = [...(rotulo.parentElement?.children ?? [])].filter((el) => el !== rotulo);
  const familiaDePeer = CLASSES_DE_PEER.filter((c) =>
    irmaos.some((el) => el.classList.contains(c)),
  );

  return {
    presente: true,
    estrutura: {
      tag: rotulo.tagName.toLowerCase(),
      dataSlot: rotulo.getAttribute('data-slot'),
      temClasseBase: classes.includes('nds-label'),
      classes,
      /** Classe sem o prefixo do design system: inerte, não pinta nada. */
      classesInertes: classes.filter((c) => !c.startsWith('nds-')),
      /** Vocabulário de "esmaeça com o irmão desabilitado" presente no rótulo. */
      familiaDePeerNoRotulo: CLASSES_DE_PEER_LABEL.filter((c) => classes.includes(c)),
      /** Vocabulário de "sou o controle irmão" presente nos irmãos do rótulo. */
      familiaDePeer,
      estiloInline: rotulo.getAttribute('style'),
      textoVisivel: texto(rotulo),
      wrapperClasses: classesDe(raiz.firstElementChild),
      wrapperDataDisabled: raiz.querySelector('[data-disabled]')?.getAttribute('data-disabled') ?? null,
    },
    associacao: {
      forma,
      htmlFor,
      alvoDoForExiste: htmlFor ? !!forTarget : null,
      controleTag: controle?.tagName.toLowerCase() ?? null,
      controleTipo: controle?.getAttribute('type') ?? controle?.getAttribute('role') ?? null,
      controleId: controle?.getAttribute('id') ?? null,
      controleDesabilitado: estaDisabled(controle),
      controleAriaRequired: controle?.getAttribute('aria-required') ?? null,
      /** Nome acessível do controle: é o que o leitor de tela anuncia. */
      nomeDoControle: controle
        ? (controle.getAttribute('aria-label') ??
           (controle.getAttribute('aria-labelledby')
             ? texto(doc.getElementById(controle.getAttribute('aria-labelledby')!.split(/\s+/)[0]))
             : null) ??
           (controle.getAttribute('id')
             ? texto(doc.querySelector(`label[for="${CSS.escape(controle.getAttribute('id')!)}"]`))
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
      largura: Math.round(caixa.width),
      altura: Math.round(caixa.height),
      /** Altura fixa em primitivo com texto é defeito de WCAG 1.4.4. */
      alturaCss: cs.height === 'auto' ? 'auto' : cs.height,
    },
    estado: {
      cor: cs.color,
      backgroundEffective: background,
      opacidade: Number(cs.opacity),
      cursor: cs.cursor,
      pointer: cs.pointerEvents,
    },
    obrigatorio: {
      existe: !!marcador,
      texto: texto(marcador),
      ariaHidden: marcador?.getAttribute('aria-hidden') ?? null,
      cor: csMarcador?.color ?? null,
      /** `null` significa "só pintura": nada anuncia a obrigatoriedade. */
      anunciado:
        controle?.getAttribute('aria-required') === 'true' ||
        (controle as HTMLInputElement | null)?.required === true
          ? 'aria-required'
          : null,
      contraste: csMarcador && marcadorBackground ? ratio(csMarcador.color, marcadorBackground) : null,
    },
    clique: {
      ...labelAoClick(rotulo, controle),
      reach: clickReach(rotulo),
    },
    contraste: {
      textoNoFundo: background ? ratio(cs.color, background) : null,
    },
  };
}

/**
 * Mede os cenários marcados com `data-sonda="<nome>"` dentro de `raiz`.
 * Cenário ausente vem `null` — é o achado de "a stack não monta este caso".
 */
export function measureLabels(raiz: HTMLElement, cenarios: string[]) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    registro[cenario] = alvo ? measureLabel(alvo) : null;
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
export function darkMeasure(raiz: HTMLElement, cenario: string) {
  const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
  const rotulo = alvo?.querySelector<HTMLElement>('label');
  if (!alvo || !rotulo) return null;

  const desfazer = darkLigarTheme(raiz.ownerDocument);
  try {
    // Trocar o tema troca `color`, que é propriedade em transição: sem desligá-la
    // a sonda leria a cor do tema CLARO e relataria um contraste que não existe.
    return noTransicao(rotulo, () => {
      const measurement = measureLabel(alvo);
      if (!measurement.presente) return null;
      return { estado: measurement.estado, contraste: measurement.contraste, obrigatorio: measurement.obrigatorio };
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
export function reportProbe(stack: string, raiz: HTMLElement, cenarios: string[]) {
  const registro = {
    light: measureLabels(raiz, cenarios),
    escuro: darkMeasure(raiz, cenarios[0]),
  };
  throw new Error(`SONDA::${stack}::${JSON.stringify(registro)}`);
}
