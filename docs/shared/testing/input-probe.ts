/**
 * Sonda de comparação do Input entre as cinco stacks.
 *
 * O Input é o campo mais copiado do design system e o que mais promete por
 * escrito: a tabela de tokens diz qual token pintar, a tabela de estados diz
 * qual borda aparece em cada situação, e os `testes.*` afirmam medidas em px e
 * porcentagem. Nada disso tinha uma única asserção computada — as cinco stacks
 * verificavam presença, `type` e `aria-invalid`, e mais nada.
 *
 * A sonda procura o campo pelo contrato `.nds-*` / `data-slot`. Onde o contrato
 * não é cumprido o campo vem `null` — e isso É o achado, não falha da medição.
 *
 * Armadilhas já pagas, evitadas aqui:
 *
 *   - `console.log` não chega ao terminal (o addon instrumenta o console dentro
 *     da play). O canal é a exceção — ver `reportProbe`.
 *   - **ler estilo logo após `focus()` devolve o PRIMEIRO QUADRO da transição.**
 *     `.nds-input` transiciona `border-color` e `box-shadow`, então o computado
 *     sai `rgba(0,0,0,0) 0px 0px 0px 0px` e um anel perfeitamente pintado parece
 *     inexistente. Todo acesso a estado passa por `noTransicao`.
 *   - `:hover` não acende por evento sintético. A sonda lê a DECLARAÇÃO da folha
 *     e manda o navegador resolver o `var()` — a medida continua sendo dele.
 *   - divergência de NOME de classe entre stacks faz o seletor não casar. A
 *     sonda registra `classesInertes` (tudo sem o prefixo `nds-`): classe morta
 *     sobrevivendo numa stack é, ela própria, o achado.
 *   - `aria-describedby` presente não quer dizer alvo existente. A sonda resolve
 *     o id: `alvoDescribedbyExiste: false` é apontar para o nada.
 *   - foco muda o estado medido; a sonda devolve o foco a quem o tinha.
 */

import {
  ruleDeclaration,
  backgroundEffective,
  darkLigarTheme,
  ratio,
  resolveColor,
  noTransicao,
} from './cor';

export type { Contrast } from './cor';
export { darkLigarTheme, noTransicao };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const text = (el: Element | null | undefined): string | null =>
  el?.textContent?.trim().replace(/\s+/g, ' ') || null;

/** Nome acessível pela ordem que o leitor usa. `null` é campo sem nome. */
export function accessibleName(el: Element | null | undefined): string | null {
  if (!el) return null;
  const labelled = el.getAttribute('aria-labelledby');
  if (labelled) {
    const target = el.ownerDocument.getElementById(labelled.split(/\s+/)[0]);
    if (target?.textContent?.trim()) return target.textContent.trim();
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

/** O `<input>` do cenário, pelo contrato e com os degraus de fallback. */
export function fieldOf(root: HTMLElement): HTMLInputElement | null {
  return (
    root.querySelector<HTMLInputElement>('input[data-slot="input"]') ??
    root.querySelector<HTMLInputElement>('input.nds-input') ??
    root.querySelector<HTMLInputElement>('input')
  );
}

// ─── Aferições reusadas pelas stories ─────────────────────────────────────────
//
// Existem para que as stories afirmem EFEITO COMPUTADO em vez de nome de classe.
// Asserção de classe passou anos verde afirmando `border-input` — um nome de
// utilitário do Tailwind, inerte desde a migração `.nds-*`.

/**
 * Altura RESULTANTE do campo, em px, e as parcelas que a produzem.
 *
 * O projeto proíbe `height` cravada em primitivo com texto (WCAG 1.4.4): a
 * altura tem que sair de `padding-block` + `line-height`, para o campo crescer
 * junto quando a pessoa aumenta a fonte do navegador. `heightCss !== 'auto'`
 * é a assinatura do defeito.
 */
export function heightResultante(el: HTMLElement) {
  const cs = getComputedStyle(el);
  return {
    box: Math.round(el.getBoundingClientRect().height),
    heightCss: cs.height,
    minHeightCss: cs.minHeight,
    paddingBloco: [cs.paddingTop, cs.paddingBottom] as const,
    alturaDeLinha: cs.lineHeight,
    tamanhoDaFonte: cs.fontSize,
    /** `true` quando a folha crava altura — o defeito que a regra proíbe. */
    alturaCravada:
      ruleDeclaration(el.ownerDocument, (s) => /\.nds-input(?![\w-])/.test(s), 'height') !== null,
  };
}

/**
 * Borda no repouso, no foco e — pela folha — no hover.
 *
 * O hover não acende por evento sintético, então a cor dele vem da declaração
 * da regra resolvida pelo próprio navegador. É a mesma leitura que o portão
 * `QA/Borda de Campo` faz em 6 alvos; aqui ela é só descritiva.
 */
export function stateBorders(el: HTMLInputElement) {
  const doc = el.ownerDocument;
  const previous = doc.activeElement as HTMLElement | null;

  return noTransicao(el, () => {
    const rest = getComputedStyle(el);
    const measurementRest = {
      cor: rest.borderTopColor,
      espessura: rest.borderTopWidth,
      estilo: rest.borderTopStyle,
      sombra: rest.boxShadow,
    };

    el.focus();
    const focus = getComputedStyle(el);
    const measurementFocus = {
      cor: focus.borderTopColor,
      sombra: focus.boxShadow,
      contorno: `${focus.outlineWidth} ${focus.outlineStyle}`,
      casaFocusVisible: el.matches(':focus-visible'),
    };
    el.blur();
    if (previous && previous !== doc.body) previous.focus();

    const declaradoHover = ruleDeclaration(
      doc,
      (s) => /\.nds-input:hover/.test(s),
      'border-color',
    );

    // A sonda de resolução entra no PAI: `<input>` é elemento vazio e um filho
    // apendado nele nunca é renderizado — `getComputedStyle` devolveria vazio e
    // o hover viria `null`, um falso "a regra sumiu da folha".
    const host = (el.parentElement ?? doc.body) as HTMLElement;

    return {
      rest: measurementRest,
      focus: measurementFocus,
      hover: {
        declarado: declaradoHover,
        resolvido: declaradoHover ? resolveColor(host, declaradoHover) : null,
      },
    };
  });
}

/**
 * O halo de foco assentado, decomposto: espessura em px, alfa e cor.
 *
 * O contrato afirma "halo de 2px com 30% de opacidade" e nenhuma stack
 * verificava isso — a documentação dizia 3px e 50% havia meses. Ler o
 * `box-shadow` cru numa asserção obrigaria cada stack a repetir o mesmo regex.
 *
 * `null` quando não há halo: é o resultado esperado no campo desabilitado, e é
 * achado em qualquer outro.
 */
export function focusHalo(
  el: HTMLInputElement,
): { espessura: number; alfa: number; cor: string } | null {
  const sombra = stateBorders(el).focus.sombra;
  if (!sombra || sombra === 'none') return null;
  const cor = /rgba?\([^)]+\)/.exec(sombra)?.[0];
  if (!cor) return null;
  // O box-shadow do campo é `<cor> 0px 0px 0px <espessura>` — o spread é o
  // quarto comprimento, e é ele que a pessoa vê como grossura do halo.
  const comprimentos = [...sombra.matchAll(/(-?[\d.]+)px/g)].map((m) => parseFloat(m[1]));
  const alfa = parseFloat(/rgba\([^)]*[,/]\s*([\d.]+)\s*\)/.exec(cor)?.[1] ?? '1');
  return { espessura: comprimentos[3] ?? 0, alfa, cor };
}

/**
 * Contraste do texto, do placeholder e da borda nos DOIS modos.
 *
 * O axe do test-runner mede só o que está na tela, e a tela está sempre no tema
 * claro — metade do produto ficava sem medição, e o item de contraste do
 * contrato dizia "verificado por axe-core" sem que ninguém rodasse nada no
 * escuro. A classe sai no `finally`: deixá-la posta envenena a story seguinte e
 * a foto do Chromatic.
 */
export function contrastesNosDoisModos(root: HTMLElement) {
  const field = fieldOf(root);
  if (!field) return null;

  const measure = (mode: 'claro' | 'escuro') => {
    const m = measureInput(root);
    if (!m.presente) return null;
    return {
      mode,
      text: m.contraste.textoNoFundo?.ratio ?? null,
      placeholder: m.contraste.placeholderNoFundo?.ratio ?? null,
      border: m.contraste.bordaNoFundo?.ratio ?? null,
    };
  };

  const light = measure('claro');
  const desfazer = darkLigarTheme(root.ownerDocument);
  let escuro;
  try {
    escuro = noTransicao(field, () => measure('escuro'));
  } finally {
    desfazer();
  }
  return [light, escuro].filter(Boolean) as {
    mode: string; text: number | null; placeholder: number | null; border: number | null;
  }[];
}

/**
 * A cor que um token vira depois que o navegador resolve `var()` e o tema.
 *
 * Serve para a story afirmar "esta borda é --destructive" sem escrever um rgb
 * literal, que quebraria a cada ajuste de paleta e não valeria nos temas de
 * marca. `root` precisa ser um elemento que RENDERIZE — `<input>` é vazio e um
 * filho apendado nele nunca entra no layout.
 */
export function tokenColor(root: HTMLElement, token: string): string | null {
  const host = root.tagName === 'INPUT' ? root.parentElement ?? root : root;
  return resolveColor(host as HTMLElement, `hsl(var(${token}))`);
}

/** Razão WCAG entre a borda em repouso e o fundo — o alvo de 3:1 (1.4.11). */
export function borderContrast(el: HTMLElement) {
  const background = backgroundEffective(el);
  if (!background) return null;
  return noTransicao(el, () => ratio(getComputedStyle(el).borderTopColor, background));
}

// ─── Medição de um campo ──────────────────────────────────────────────────────

export function measureInput(root: HTMLElement) {
  const field = fieldOf(root);
  if (!field) return { presente: false } as const;

  const classes = (field.getAttribute('class') || '').split(/\s+/).filter(Boolean);
  const cs = getComputedStyle(field);
  const csPlaceholder = getComputedStyle(field, '::placeholder');
  const fileCsButton = getComputedStyle(field, '::file-selector-button');
  const box = field.getBoundingClientRect();
  const background = backgroundEffective(field);

  const describedby = field.getAttribute('aria-describedby');
  const targetsDescribed = describedby
    ? describedby
        .split(/\s+/)
        .map((id) => field.ownerDocument.getElementById(id))
        .filter(Boolean)
    : [];

  return {
    presente: true,
    estrutura: {
      tag: field.tagName.toLowerCase(),
      dataSlot: field.getAttribute('data-slot'),
      temClasseBase: classes.includes('nds-input'),
      classes,
      /** Classe sem o prefixo do design system: inerte, não pinta nada. */
      classesInertes: classes.filter((c) => !c.startsWith('nds-')),
      estiloInline: field.getAttribute('style'),
      wrapper: {
        tag: root.firstElementChild?.tagName.toLowerCase() ?? null,
        classes: (root.firstElementChild?.getAttribute('class') || '').split(/\s+/).filter(Boolean),
        estiloInline: root.firstElementChild?.getAttribute('style') ?? null,
      },
    },
    semantica: {
      accessibleName: accessibleName(field),
      /** `type` do atributo e da propriedade: divergem quando a stack não repassa. */
      typeAtributo: field.getAttribute('type'),
      typePropriedade: field.type,
      papel: field.getAttribute('role'),
      placeholder: field.getAttribute('placeholder'),
      ariaInvalid: field.getAttribute('aria-invalid'),
      ariaRequired: field.getAttribute('aria-required'),
      required: field.required,
      disabled: field.disabled,
      somenteLeitura: field.readOnly,
      /** Só `readonly` continua focalizável — é o que separa os dois estados. */
      focalizavel: !field.disabled,
      name: field.name || null,
      autocomplete: field.getAttribute('autocomplete'),
      ariaDescribedby: describedby,
      alvoDescribedbyExiste: describedby
        ? targetsDescribed.length === describedby.split(/\s+/).length
        : null,
      textoDescrito: targetsDescribed.map((el) => text(el)),
    },
    geometria: {
      width: Math.round(box.width),
      ...heightResultante(field),
      paddingInline: [cs.paddingLeft, cs.paddingRight] as const,
      familiaDaFonte: cs.fontFamily.split(',')[0],
      raio: cs.borderTopLeftRadius,
      larguraCss: cs.width,
      displayCss: cs.display,
      boxSizing: cs.boxSizing,
    },
    state: {
      background: cs.backgroundColor,
      backgroundEffective: background,
      cor: cs.color,
      opacity: cs.opacity,
      cursor: cs.cursor,
      corDoPlaceholder: csPlaceholder.color || null,
      /** `::file-selector-button` só existe em `type="file"`; nos demais vem herdado. */
      botaoDeArquivo: {
        background: fileCsButton.backgroundColor || null,
        cor: fileCsButton.color || null,
        raio: fileCsButton.borderTopLeftRadius || null,
        espessuraDaBorda: fileCsButton.borderTopWidth || null,
      },
      borders: stateBorders(field),
    },
    contraste: {
      textoNoFundo: background ? ratio(cs.color, background) : null,
      placeholderNoFundo: background && csPlaceholder.color ? ratio(csPlaceholder.color, background) : null,
      bordaNoFundo: borderContrast(field),
    },
  };
}

/**
 * Mede os cenários marcados com `data-sonda="<nome>"` dentro de `root`.
 * Cenário ausente vem `null` — é o achado de "a stack não monta este caso".
 */
export function measureInputs(root: HTMLElement, cenarios: string[]) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const target = root.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    registro[cenario] = target ? measureInput(target) : null;
  }
  return registro;
}

/**
 * Mede um cenário no tema ESCURO — metade do produto que o axe do test-runner
 * nunca vê, porque a tela está sempre no claro.
 *
 * A classe sai no `finally`: deixá-la posta envenena a story seguinte e a foto
 * do Chromatic.
 */
export function darkMeasure(root: HTMLElement, cenario: string) {
  const target = root.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
  const field = target ? fieldOf(target) : null;
  if (!target || !field) return null;

  const desfazer = darkLigarTheme(root.ownerDocument);
  try {
    // Trocar o tema troca `border-color`, que é propriedade em transição: sem
    // desligá-la a sonda leria a cor do tema CLARO e relataria uma borda que
    // não escurece.
    return noTransicao(field, () => {
      const measurement = measureInput(target);
      if (!measurement.presente) return null;
      return { state: measurement.state, contraste: measurement.contraste };
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
    light: measureInputs(root, cenarios),
    escuro: darkMeasure(root, cenarios[0]),
  };
  throw new Error(`SONDA::${stack}::${JSON.stringify(registro)}`);
}
