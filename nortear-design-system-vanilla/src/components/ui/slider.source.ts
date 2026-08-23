// Snippet do painel Code do Slider — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

/**
 * O que as stories usam de `SliderOptions` e que o snippet precisa mostrar.
 *
 * As chaves são as MESMAS dos args da story — inclusive `'aria-label'`, que é o
 * nome canônico da opção na fábrica (`ariaLabel` é apelido `@deprecated`). Assim
 * `{ ...ctx.args }` entra sem tradução.
 */
export type SliderSnippetOptions = {
  min?: number;
  max?: number;
  step?: number;
  /**
   * Um número é uma alça; um PAR é o intervalo. É a forma do valor que decide,
   * e não uma opção separada — não existe intervalo sem os dois extremos.
   */
  value?: number | number[];
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  /** Nome acessível. No intervalo são dois nomes, um por alça. */
  'aria-label'?: string | string[];
  class?: string;
  /** Presença liga a linha do callback; string troca a expressão mostrada. */
  onValueChange?: unknown;
  /** Idem, para o callback que dispara quando o valor assenta. */
  onValueCommitted?: unknown;
};

const CHANGE_DEFAULT = '(valor) => mostrarValor(valor)';
const COMMIT_DEFAULT = '(valor) => registrarAjuste(valor)';

/** `role="slider"` sem nome é controle que o leitor de tela não sabe ler. */
function accessibleName(o: SliderSnippetOptions, intervalo: boolean): string {
  const raw =
    o['aria-label'] ??
    (intervalo ? ['Faixa de preço — mínimo', 'Faixa de preço — máximo'] : 'Volume');
  return Array.isArray(raw) ? `[${raw.map(texto).join(', ')}]` : texto(raw);
}

function valueLiteral(valor: number | number[] | undefined): string | undefined {
  if (valor === undefined) return undefined;
  return Array.isArray(valor) ? `[${valor.join(', ')}]` : String(valor);
}

function expressao(valor: unknown, padrao: string): string | undefined {
  if (!valor) return undefined;
  return typeof valor === 'string' ? valor : padrao;
}

/** A chamada real de `createSlider` com as opções da story. */
export function sliderSnippet(o: SliderSnippetOptions = {}): string {
  const intervalo = Array.isArray(o.value);

  const lines = opcoes([
    ['min', o.min !== undefined && o.min !== 0 ? String(o.min) : undefined],
    ['max', o.max !== undefined && o.max !== 100 ? String(o.max) : undefined],
    ['step', o.step !== undefined && o.step !== 1 ? String(o.step) : undefined],
    ['value', valueLiteral(o.value)],
    ['aria-label', accessibleName(o, intervalo)],
    ['orientation', o.orientation === 'vertical' ? texto('vertical') : undefined],
    ['disabled', o.disabled ? 'true' : undefined],
    ['class', o.class ? texto(o.class) : undefined],
    ['onValueChange', expressao(o.onValueChange, CHANGE_DEFAULT)],
    ['onValueCommitted', expressao(o.onValueCommitted, COMMIT_DEFAULT)],
  ]);

  return snippet(
    importing('slider', 'createSlider'),
    `const controle = ${chamada('createSlider', lines)};`,
    montar('controle'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica, que é o uso
 * canônico de uma alça só.
 */
export const sliderSource: SourceTransform<SliderSnippetOptions> = (_gerado, ctx) =>
  sliderSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function sliderSourceWith(fixas: SliderSnippetOptions): SourceTransform<SliderSnippetOptions> {
  return (_gerado, ctx) => sliderSnippet({ ...ctx.args, ...fixas });
}
