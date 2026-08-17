/**
 * Sonda de comparação do AspectRatio entre as cinco stacks.
 *
 * Num componente cujo trabalho inteiro é "manter a proporção", a asserção fácil
 * é `o elemento existe`. A pergunta que importa é aritmética: dada a largura que
 * o pai concedeu, a ALTURA resultante é a que a razão pedida implica? E ela
 * continua sendo, quando o pai muda de tamanho?
 *
 * A sonda também registra COMO a proporção é obtida. Há dois mecanismos vivos no
 * mercado — `aspect-ratio` nativo e o antigo truque do `padding-bottom` em
 * porcentagem — e os dois produzem a mesma caixa na tela. Se as stacks
 * divergirem aqui, nenhuma medida de proporção acusa: só a leitura do mecanismo
 * mostra que o CSS compartilhado governa umas e não outras.
 */

export type Mecanismo = 'aspect-ratio' | 'padding-bottom' | 'altura-cravada' | 'nenhum';

export interface MedidaDeCaixa {
  /** `null` quando o seletor não casou — isso É o achado, não falha da medição. */
  presente: boolean;
  tag: string | null;
  /** Só as classes do design system, ordenadas. */
  classesNds: string;
  /** Quantos elementos existem entre a raiz da story e esta caixa. */
  profundidade: number | null;
  /** Valor inline de `--ratio` — o contrato das stacks sem lib headless. */
  ratioInline: string | null;
  aspectRatioComputado: string | null;
  paddingBottomComputado: string | null;
  /** Altura declarada no `style` inline: qualquer valor aqui é altura cravada. */
  alturaInline: string | null;
  posicao: string | null;
  overflow: string | null;
  largura: number | null;
  altura: number | null;
  /** largura / altura, com duas casas. */
  razao: number | null;
  mecanismo: Mecanismo;
}

export interface MedidaDeFilho {
  presente: boolean;
  tag: string | null;
  posicao: string | null;
  objectFit: string | null;
  /** Diferença entre a caixa do filho e a do container, em px. */
  transbordoLargura: number | null;
  transbordoAltura: number | null;
}

export interface MedidaDeProporcao {
  cenario: string;
  larguraDoPai: number;
  /** A caixa que o contrato `.nds-*` promete. */
  contrato: MedidaDeCaixa;
  /** A caixa que o `data-slot` aponta — pode não ser a mesma. */
  slot: MedidaDeCaixa;
  filho: MedidaDeFilho;
}

const NENHUMA: MedidaDeCaixa = {
  presente: false,
  tag: null,
  classesNds: '',
  profundidade: null,
  ratioInline: null,
  aspectRatioComputado: null,
  paddingBottomComputado: null,
  alturaInline: null,
  posicao: null,
  overflow: null,
  largura: null,
  altura: null,
  razao: null,
  mecanismo: 'nenhum',
};

function profundidadeAte(raiz: Element, el: Element): number {
  let n = 0;
  let atual: Element | null = el;
  while (atual && atual !== raiz) {
    n += 1;
    atual = atual.parentElement;
  }
  return n;
}

/**
 * Qual mecanismo está de fato sustentando a caixa.
 *
 * A ordem importa: `aspect-ratio` computado vem como `auto` quando não há
 * declaração, e o truque do padding só conta quando é PERCENTUAL — um
 * `padding-bottom: 8px` de espaçamento comum não sustenta proporção nenhuma.
 */
function mecanismoDe(cs: CSSStyleDeclaration, alturaInline: string | null): Mecanismo {
  if (cs.aspectRatio && cs.aspectRatio !== 'auto') return 'aspect-ratio';
  if (cs.paddingBottom && cs.paddingBottom !== '0px') {
    // O computado já vem resolvido em px; a porcentagem só aparece na
    // declaração inline, que é onde as libs headless a escrevem.
    return 'padding-bottom';
  }
  if (alturaInline) return 'altura-cravada';
  return 'nenhum';
}

function medirCaixa(raiz: Element, el: HTMLElement | null): MedidaDeCaixa {
  if (!el) return { ...NENHUMA };
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const alturaInline = el.style.height || null;
  return {
    presente: true,
    tag: el.tagName.toLowerCase(),
    classesNds: Array.from(el.classList)
      .filter((c) => c.startsWith('nds-'))
      .sort()
      .join(' '),
    profundidade: profundidadeAte(raiz, el),
    ratioInline: el.style.getPropertyValue('--ratio').trim() || null,
    aspectRatioComputado: cs.aspectRatio || null,
    // O computado devolve px; a declaração inline preserva a porcentagem, que é
    // o que distingue o truque antigo de um padding qualquer.
    paddingBottomComputado: el.style.paddingBottom || cs.paddingBottom || null,
    alturaInline,
    posicao: cs.position,
    overflow: cs.overflow,
    largura: Math.round(rect.width * 100) / 100,
    altura: Math.round(rect.height * 100) / 100,
    razao: rect.height > 0 ? Math.round((rect.width / rect.height) * 100) / 100 : null,
    mecanismo: mecanismoDe(cs, alturaInline),
  };
}

function medirFilho(caixa: HTMLElement | null): MedidaDeFilho {
  // `:scope > *` e não um seletor descendente: a regra que interessa é
  // `.nds-aspect-ratio > *`, que só alcança filho DIRETO. Buscar em profundidade
  // devolveria um neto e mediria uma promessa que a folha não faz.
  const filho = caixa?.querySelector<HTMLElement>(':scope > *');
  if (!caixa || !filho) return { presente: false, tag: null, posicao: null, objectFit: null, transbordoLargura: null, transbordoAltura: null };
  const rc = caixa.getBoundingClientRect();
  const rf = filho.getBoundingClientRect();
  const cs = getComputedStyle(filho);
  return {
    presente: true,
    tag: filho.tagName.toLowerCase(),
    posicao: cs.position,
    objectFit: cs.objectFit,
    transbordoLargura: Math.round((rf.width - rc.width) * 100) / 100,
    transbordoAltura: Math.round((rf.height - rc.height) * 100) / 100,
  };
}

/**
 * Mede UM cenário: o container `pai` já dimensionado pela story.
 *
 * Duas buscas, de propósito. `.nds-aspect-ratio` é o CONTRATO do design system —
 * a classe que a folha compartilhada estiliza. `[data-slot="aspect-ratio"]` é o
 * marcador de composição. Onde os dois não caem no mesmo elemento, ou onde o
 * primeiro vem `null`, a stack está sustentando a proporção por fora da folha.
 */
export function medirProporcao(pai: HTMLElement, cenario: string): MedidaDeProporcao {
  const porContrato = pai.querySelector<HTMLElement>('.nds-aspect-ratio');
  const porSlot = pai.querySelector<HTMLElement>('[data-slot="aspect-ratio"]');
  return {
    cenario,
    larguraDoPai: Math.round(pai.getBoundingClientRect().width * 100) / 100,
    contrato: medirCaixa(pai, porContrato),
    slot: medirCaixa(pai, porSlot),
    filho: medirFilho(porSlot ?? porContrato),
  };
}

/** Mede todos os cenários marcados com `data-cenario` dentro da raiz. */
export function medirCenarios(raiz: HTMLElement): MedidaDeProporcao[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>('[data-cenario]')).map((pai) =>
    medirProporcao(pai, pai.dataset.cenario ?? '?'),
  );
}

/** Uma linha por cenário — a tabela para o diff campo a campo entre stacks. */
export function resumirProporcoes(medidas: MedidaDeProporcao[]): string[] {
  return medidas.map((m) => {
    const c = m.contrato;
    const s = m.slot;
    return [
      m.cenario,
      `pai=${m.larguraDoPai}`,
      `contrato=${c.presente ? `${c.tag}.${c.classesNds || '(sem classe nds)'}` : 'null'}`,
      `slot=${s.presente ? s.tag : 'null'}@prof${s.profundidade}`,
      `ratioInline=${s.ratioInline ?? c.ratioInline ?? 'null'}`,
      `mecanismo=${s.mecanismo}`,
      `caixa=${s.largura}x${s.altura}`,
      `razao=${s.razao}`,
      `alturaInline=${s.alturaInline ?? 'null'}`,
      `filho=${m.filho.tag}/${m.filho.posicao}/${m.filho.objectFit}`,
      `transbordo=${m.filho.transbordoLargura}x${m.filho.transbordoAltura}`,
    ].join('|');
  });
}

export interface FalhaDeProporcao {
  cenario: string;
  motivo: string;
}

/**
 * Reprova o que o contrato promete e a medida não confirma.
 *
 * `tolerancia` em razão, não em pixels: a caixa é subpixel e comparar altura
 * exata reprova por arredondamento do layout.
 */
export function reprovasDeProporcao(
  medidas: MedidaDeProporcao[],
  razaoEsperada: number,
  tolerancia = 0.02,
): FalhaDeProporcao[] {
  const falhas: FalhaDeProporcao[] = [];
  for (const m of medidas) {
    if (!m.contrato.presente) {
      falhas.push({ cenario: m.cenario, motivo: '.nds-aspect-ratio não existe — a folha compartilhada não governa esta caixa' });
      continue;
    }
    if (m.contrato.mecanismo !== 'aspect-ratio') {
      falhas.push({ cenario: m.cenario, motivo: `proporção sustentada por ${m.contrato.mecanismo}, e não pelo aspect-ratio nativo da folha` });
    }
    if (m.contrato.alturaInline) {
      falhas.push({ cenario: m.cenario, motivo: `altura cravada no style inline: ${m.contrato.alturaInline}` });
    }
    if (m.contrato.razao === null) {
      falhas.push({ cenario: m.cenario, motivo: 'altura zero — a caixa não reservou espaço' });
      continue;
    }
    if (Math.abs(m.contrato.razao - razaoEsperada) > tolerancia) {
      falhas.push({
        cenario: m.cenario,
        motivo: `razão medida ${m.contrato.razao} contra ${Math.round(razaoEsperada * 100) / 100} pedida (caixa ${m.contrato.largura}x${m.contrato.altura})`,
      });
    }
    // A folha promete que o filho DIRETO cobre a caixa
    // (`.nds-aspect-ratio > * { position: absolute; inset: 0 }`). Sem a regra, um
    // filho sem altura própria fica menor que o container e a promessa é falsa —
    // sem que a proporção da caixa acuse nada.
    if (m.filho.presente && m.filho.posicao !== 'absolute') {
      falhas.push({
        cenario: m.cenario,
        motivo: `filho <${m.filho.tag}> em position: ${m.filho.posicao} — a folha não o está esticando para cobrir a caixa`,
      });
    }
  }
  return falhas;
}

export function descreverFalhasDeProporcao(fs: FalhaDeProporcao[]): string {
  return fs.map((f) => `  · ${f.cenario} — ${f.motivo}`).join('\n');
}
