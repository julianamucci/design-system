/**
 * Sonda de comparação do Textarea entre as cinco stacks.
 *
 * Um campo de texto parece simples demais para merecer sonda — e foi exatamente
 * por isso que ninguém percebeu que a documentação ensinava seis classes mortas,
 * que três stacks afirmavam `resize-y` sem prefixo (classe inerte) e que a
 * altura mínima prometida em `min-h-[120px]` não existia em lugar nenhum.
 * Contagem de `expect()` não acha nada disso: o que falta é o que NENHUMA das
 * cinco verifica.
 *
 * A sonda procura os elementos pelo contrato `.nds-*`. Onde o contrato não é
 * cumprido o campo vem `null` — e isso É o achado, não falha da medição.
 *
 * Armadilhas evitadas aqui:
 *
 *   - `console.log` não chega ao terminal (o addon instrumenta o console dentro
 *     da play). O canal é a exceção — ver `reportProbe`.
 *   - divergência de NOME de classe entre stacks faz o seletor não casar e o
 *     campo vir `null`. As duas formas conhecidas (`nds-resize-y` e `resize-y`)
 *     são aceitas e `familiaDeResize` registra qual casou — a divergência de
 *     vocabulário é, ela própria, o achado.
 *   - `aria-describedby` presente não quer dizer alvo existente. A sonda resolve
 *     o id: `alvoDescribedbyExiste: false` é apontar para o nada.
 *   - foco muda o estado medido; a sonda devolve o foco a quem o tinha.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

// As primitivas de cor (luminância, razão WCAG, fundo opaco efetivo, congelar
// transição, ligar o escuro) saíram deste arquivo para `cor.ts` quando a rodada
// de foundations precisou das mesmas quatro funções fora do textarea. Ficam
// re-exportadas aqui porque as stories das cinco stacks já importam daqui.
import { backgroundEffective, darkLigarTheme, ratio, noTransicao } from './cor';

export type { Contraste } from './cor';
export { darkLigarTheme };

export interface CounterMeasurement {
  existe: boolean;
  ariaLive: string | null;
  ariaLabel: string | null;
  texto: string | null;
  /** Um contador fora do fluxo de leitura não é anunciado ao mudar. */
  ehRegiaoViva: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CLASSES_DE_RESIZE = [
  'nds-resize-y',
  'nds-resize-none',
  'nds-resize',
  'nds-textarea-tall',
  'resize-y',
  'resize-none',
  'resize',
] as const;

const HEIGHT_CLASSES = [
  'nds-min-h-24',
  'nds-min-h-25',
  'nds-min-h-30',
  'nds-min-h-50',
  'nds-min-h-100',
  'min-h-[120px]',
  'min-h-[100px]',
] as const;

const texto = (el: Element | null | undefined): string | null =>
  el?.textContent?.trim().replace(/\s+/g, ' ') || null;

/** Nome acessível pela ordem que o leitor usa. `null` é campo sem nome. */
function accessibleName(el: Element | null | undefined): string | null {
  if (!el) return null;
  const labelled = el.getAttribute('aria-labelledby');
  if (labelled) {
    const alvo = el.ownerDocument.getElementById(labelled.split(/\s+/)[0]);
    if (alvo?.textContent?.trim()) return alvo.textContent.trim();
  }
  const rotulo = el.getAttribute('aria-label');
  if (rotulo?.trim()) return rotulo.trim();
  const id = el.getAttribute('id');
  if (id) {
    const label = el.ownerDocument.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }
  const inside = el.closest('label');
  if (inside?.textContent?.trim()) return inside.textContent.trim();
  return null;
}

// ─── Medição ──────────────────────────────────────────────────────────────────

/**
 * Altura antes e depois de encher o campo de linhas.
 *
 * É a pergunta que o conteúdo compartilhado respondia errado havia meses:
 * `field-sizing-content` foi documentado como "ajusta a altura automaticamente
 * ao conteúdo", e nenhuma stack aplica a propriedade. O valor `cresceu` responde
 * pelo navegador em vez de pela prosa.
 *
 * Não dispara evento: escreve `.value`, lê o layout no mesmo tick e restaura.
 * Componente controlado não re-renderiza porque nada foi notificado.
 */
function crescimento(ta: HTMLTextAreaElement) {
  const original = ta.value;
  const antes = Math.round(ta.getBoundingClientRect().height);
  ta.value = Array.from({ length: 12 }, (_, i) => `linha ${i + 1} de conteúdo`).join('\n');
  const depois = Math.round(ta.getBoundingClientRect().height);
  const transbordaNoCrescer = ta.scrollHeight > ta.clientHeight + 1;
  ta.value = original;
  return { antes, depois, cresceu: depois > antes + 1, transbordaNoCrescer };
}

/** Sombra e contorno com o campo focado — e o foco volta para quem o tinha. */
function aoFocar(ta: HTMLTextAreaElement) {
  const doc = ta.ownerDocument;
  const previous = doc.activeElement as HTMLElement | null;
  return noTransicao(ta, () => {
    ta.focus();
    const cs = getComputedStyle(ta);
    const measurement = {
      boxShadow: cs.boxShadow,
      corDaBorda: cs.borderTopColor,
      outlineWidth: cs.outlineWidth,
      outlineStyle: cs.outlineStyle,
      casaFocusVisible: ta.matches(':focus-visible'),
    };
    ta.blur();
    if (previous && previous !== doc.body) previous.focus();
    return measurement;
  });
}

// ─── Aferições reusadas pelas stories ─────────────────────────────────────────
//
// As três funções abaixo existem para que as stories afirmem EFEITO COMPUTADO
// em vez de nome de classe. Asserção de classe passou anos verde afirmando
// `resize-y` — uma classe sem prefixo, inerte, que não redimensionava nada.

/** `resize` de fato aplicado: `vertical`, `none`, `both` ou `horizontal`. */
export function resizeComputado(el: Element): string {
  return getComputedStyle(el).resize;
}

/** `min-height` de fato aplicado, em pixels. */
export function heightMinimaPx(el: Element): number {
  return Math.round(parseFloat(getComputedStyle(el).minHeight) || 0);
}

/**
 * Anel de foco DEPOIS da transição — o valor que a pessoa vê.
 *
 * Lido logo após `focus()`, o computado devolve o primeiro quadro da transição:
 * `rgba(0, 0, 0, 0) 0px 0px 0px 0px`, que faz um anel perfeitamente pintado
 * parecer inexistente. Ver `noTransicao`.
 */
export function focusAssentadoRing(el: HTMLElement): { boxShadow: string; corDaBorda: string } {
  return noTransicao(el, () => {
    el.focus();
    const cs = getComputedStyle(el);
    return { boxShadow: cs.boxShadow, corDaBorda: cs.borderTopColor };
  });
}

/** Razão WCAG entre o texto do campo e o primeiro fundo opaco acima dele. */
export function contrastTextBackground(el: Element): number | null {
  const background = backgroundEffective(el);
  if (!background) return null;
  return ratio(getComputedStyle(el).color, background)?.ratio ?? null;
}

/**
 * Leva o campo até `n` caracteres sem gastar `n` eventos de teclado.
 *
 * Serve ao item de contrato "atingir maxLength bloqueia novos caracteres":
 * digitar 500 caracteres levaria a play a minutos, e `maxLength` não se aplica
 * a escrita programática — então a story chega à BORDA por aqui e digita os
 * últimos de verdade, que é onde o bloqueio precisa acontecer.
 *
 * Usa o setter nativo do protótipo porque o React instala um setter próprio
 * para rastrear valor: escrever em `ta.value` direto não marca o campo como
 * sujo e o `onChange` não dispara.
 */
export function preencherAte(ta: HTMLTextAreaElement, n: number): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(ta, 'x'.repeat(n));
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Mede UM textarea e o que o acompanha. `raiz` é o wrapper do cenário. */
export function measureTextarea(raiz: HTMLElement) {
  const ta =
    raiz.querySelector<HTMLTextAreaElement>('textarea[data-slot="textarea"]') ??
    raiz.querySelector<HTMLTextAreaElement>('textarea.nds-textarea') ??
    raiz.querySelector<HTMLTextAreaElement>('textarea');

  if (!ta) {
    return { presente: false } as const;
  }

  const classes = (ta.getAttribute('class') || '').split(/\s+/).filter(Boolean);
  const cs = getComputedStyle(ta);
  const csPlaceholder = getComputedStyle(ta, '::placeholder');
  const caixa = ta.getBoundingClientRect();

  const describedby = ta.getAttribute('aria-describedby');
  const targetDescribed = describedby
    ? describedby
        .split(/\s+/)
        .map((id) => ta.ownerDocument.getElementById(id))
        .filter(Boolean)
    : [];

  const counterEl =
    raiz.querySelector<HTMLElement>('[aria-live]') ?? raiz.querySelector<HTMLElement>('[role="status"]');
  const contador: CounterMeasurement = {
    existe: !!counterEl,
    ariaLive: counterEl?.getAttribute('aria-live') ?? null,
    ariaLabel: counterEl?.getAttribute('aria-label') ?? null,
    texto: texto(counterEl),
    ehRegiaoViva: counterEl?.getAttribute('aria-live') === 'polite' || counterEl?.getAttribute('role') === 'status',
  };

  const background = backgroundEffective(ta);

  return {
    presente: true,
    estrutura: {
      tag: ta.tagName.toLowerCase(),
      dataSlot: ta.getAttribute('data-slot'),
      temClasseBase: classes.includes('nds-textarea'),
      classes,
      /** Qual vocabulário de resize casou — `null` é campo sem nenhum. */
      familiaDeResize: CLASSES_DE_RESIZE.filter((c) => classes.includes(c)),
      familiaDeAltura: HEIGHT_CLASSES.filter((c) => classes.includes(c)),
      /** Classe sem o prefixo do design system: inerte, não pinta nada. */
      classesInertes: classes.filter((c) => !c.startsWith('nds-')),
      estiloInline: ta.getAttribute('style'),
      wrapper: {
        tag: raiz.firstElementChild?.tagName.toLowerCase() ?? null,
        classes: (raiz.firstElementChild?.getAttribute('class') || '').split(/\s+/).filter(Boolean),
        estiloInline: raiz.firstElementChild?.getAttribute('style') ?? null,
      },
    },
    semantica: {
      accessibleName: accessibleName(ta),
      papel: ta.getAttribute('role'),
      placeholder: ta.getAttribute('placeholder'),
      rowsAtributo: ta.getAttribute('rows'),
      rowsPropriedade: ta.rows,
      maxLength: ta.maxLength > 0 ? ta.maxLength : null,
      ariaInvalid: ta.getAttribute('aria-invalid'),
      ariaRequired: ta.getAttribute('aria-required'),
      desabilitado: ta.disabled,
      somenteLeitura: ta.readOnly,
      nome: ta.name || null,
      ariaDescribedby: describedby,
      alvoDescribedbyExiste: describedby ? targetDescribed.length === describedby.split(/\s+/).length : null,
      textoDescrito: targetDescribed.map((el) => texto(el)),
      contador,
    },
    geometria: {
      largura: Math.round(caixa.width),
      altura: Math.round(caixa.height),
      minHeight: cs.minHeight,
      height: cs.height,
      paddingBloco: `${cs.paddingTop} ${cs.paddingBottom}`,
      paddingInline: `${cs.paddingLeft} ${cs.paddingRight}`,
      alturaDeLinha: cs.lineHeight,
      tamanhoDaFonte: cs.fontSize,
      familiaDaFonte: cs.fontFamily.split(',')[0],
      raio: cs.borderTopLeftRadius,
      espessuraDaBorda: cs.borderTopWidth,
      larguraCss: cs.width,
      displayCss: cs.display,
    },
    comportamento: {
      resize: cs.resize,
      fieldSizing: (cs as unknown as Record<string, string>).fieldSizing ?? null,
      overflow: cs.overflowY,
      crescimento: crescimento(ta),
      aoFocar: aoFocar(ta),
    },
    estado: {
      background: cs.backgroundColor,
      backgroundEffective: background,
      cor: cs.color,
      corDaBorda: cs.borderTopColor,
      corDoPlaceholder: csPlaceholder.color || null,
      opacidade: cs.opacity,
      cursor: cs.cursor,
    },
    contraste: {
      textoNoFundo: background ? ratio(cs.color, background) : null,
      placeholderNoFundo: background && csPlaceholder.color ? ratio(csPlaceholder.color, background) : null,
      bordaNoFundo: background ? ratio(cs.borderTopColor, background) : null,
      contadorNoFundo: counterEl
        ? ratio(getComputedStyle(counterEl).color, backgroundEffective(counterEl) ?? background ?? 'rgb(255,255,255)')
        : null,
    },
  };
}

/**
 * Mede os cenários marcados com `data-sonda="<nome>"` dentro de `raiz`.
 * Cenário ausente vem `null` — é o achado de "a stack não monta este caso".
 */
export function measureTextareas(raiz: HTMLElement, cenarios: string[]) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    registro[cenario] = alvo ? measureTextarea(alvo) : null;
  }
  return registro;
}

/**
 * Mede o cenário padrão no tema ESCURO — metade do produto que o axe do
 * test-runner nunca vê, porque a tela está sempre no claro.
 *
 * A classe sai no `finally`: deixá-la posta envenena a story seguinte e a foto
 * do Chromatic.
 */
export function darkMeasure(raiz: HTMLElement, cenario: string) {
  const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
  const campo = alvo?.querySelector<HTMLTextAreaElement>('textarea');
  if (!alvo || !campo) return null;

  const desfazer = darkLigarTheme(raiz.ownerDocument);
  try {
    // Trocar o tema troca `border-color`, que é uma propriedade em transição:
    // sem desligá-la a sonda leria a cor do tema CLARO e relataria uma borda
    // que não escurece. Ver `noTransicao`.
    return noTransicao(campo, () => {
      const measurement = measureTextarea(alvo);
      if (!measurement.presente) return null;
      return { estado: measurement.estado, contraste: measurement.contraste };
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
    light: measureTextareas(raiz, cenarios),
    escuro: darkMeasure(raiz, cenarios[0]),
  };
  throw new Error(`SONDA::${stack}::${JSON.stringify(registro)}`);
}
