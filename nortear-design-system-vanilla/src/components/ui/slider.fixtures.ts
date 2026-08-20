// Fixture compartilhada pelas stories do Slider.
//
// Arquivo à parte porque num `*.stories.ts` TODO export nomeado vira uma story:
// um `export function withLabel()` apareceria na sidebar como se fosse um
// exemplo de controle deslizante.
//
// Havia TRÊS cópias, e cada arquivo tinha feito crescer um pedaço diferente da
// MESMA função: composições ganhou os callbacks (`onValueChange` e
// `onValueCommitted`) e o `name` do input; estados ganhou `disabled` e o `id`;
// variantes ganhou `orientation` com a moldura do eixo vertical. Não eram três
// funções — era um superconjunto acumulado em três lugares, e o que ficou aqui é
// a soma dele. O corpo comum (a linha rótulo + valor, o `aria-live`, o
// `aria-describedby`) já era idêntico nos três.

import { createSlider } from './slider';

export interface WithLabelOptions {
  /** Prefixo dos ids desta instância — rótulo, texto do valor e input. */
  idPrefix: string;
  /** Texto do rótulo visível, à esquerda da linha. */
  labelText: string;
  /** Nome acessível da alça. */
  'aria-label': string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  /** Sufixo do valor exibido ("%", por exemplo). Não entra no nome da alça. */
  unit?: string;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  /** Durante o arrasto e a cada tecla — chamado DEPOIS de o texto do valor mudar. */
  onValueChange?: (value: number) => void;
  /** Ao soltar o arrasto ou largar a tecla — um evento por interação. */
  onValueCommitted?: (value: number) => void;
}

/**
 * Controle com rótulo à esquerda e valor corrente à direita.
 *
 * O valor é anunciado por `aria-live="polite"` e ligado à alça por
 * `aria-describedby`: quem usa leitor de tela ouve o número mudar sem precisar
 * procurá-lo na tela. O `nds-tabular-nums` é o que impede a linha de dançar
 * enquanto os dígitos trocam de largura.
 */
export function withLabel(opts: WithLabelOptions): HTMLElement {
  const {
    idPrefix,
    labelText,
    'aria-label': ariaLabel,
    min = 0,
    max = 100,
    step = 1,
    value = 0,
    unit = '',
    disabled = false,
    orientation = 'horizontal',
    onValueChange,
    onValueCommitted,
  } = opts;
  const vertical = orientation === 'vertical';

  // Em pé, a medida horizontal deixa de fazer sentido: quem dá a altura é o
  // próprio componente, e a moldura larga só afastaria o trilho do rótulo.
  const wrap = document.createElement('div');
  wrap.className = vertical ? 'nds-stack' : 'nds-stack nds-w-sm';
  wrap.dataset.spacing = 'sm';

  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.justify = 'between';

  const label = document.createElement('label');
  label.id = `${idPrefix}-label`;
  label.className = 'nds-text-body nds-font-medium';
  label.textContent = labelText;

  const valueText = document.createElement('span');
  valueText.id = `${idPrefix}-value`;
  valueText.className = 'nds-text-body nds-text-muted-foreground nds-tabular-nums';
  valueText.setAttribute('aria-live', 'polite');
  valueText.textContent = `${value}${unit}`;

  row.append(label, valueText);

  const slider = createSlider({
    min,
    max,
    step,
    value,
    disabled,
    orientation,
    'aria-label': ariaLabel,
    onValueChange: (v) => {
      // O texto primeiro, o consumidor depois: o que a tela mostra não pode
      // depender do que o callback de quem chama faz — nem de ele existir.
      valueText.textContent = `${v}${unit}`;
      onValueChange?.(v);
    },
    onValueCommitted,
  });

  const input = slider.querySelector('input[type="range"]') as HTMLInputElement | null;
  if (input) {
    input.setAttribute('aria-describedby', `${idPrefix}-value`);
    // `id` e `name` SEMPRE, e não só quando a story monta um formulário: era o
    // que a cópia das composições já fazia, e é o mais completo dos três. São
    // atributos — não mudam a árvore desenhada nem o texto na tela —, e é o que
    // torna a alça um campo de formulário de verdade, com nome na serialização.
    input.id = `${idPrefix}-input`;
    input.name = idPrefix;
  }

  if (vertical) {
    const centro = document.createElement('div');
    centro.className = 'nds-cluster';
    centro.dataset.justify = 'center';
    centro.append(slider);
    wrap.append(row, centro);
  } else {
    wrap.append(row, slider);
  }
  return wrap;
}
