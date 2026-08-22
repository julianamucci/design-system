/**
 * Transforms do painel Code do Slider.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * `value` é SEMPRE array, inclusive com uma alça só — por isso todo snippet
 * declara o estado como lista.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type SliderArgs = {
  value: number[];
  min: number;
  max: number;
  step: number;
  orientation: 'horizontal' | 'vertical';
  disabled: boolean;
};

const IMPORT = `import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";`;

/** O texto do valor ao lado do rótulo — `aria-live` para quem não vê a alça. */
const VALUE_VIVO = 'class="nds-text-body nds-tabular-nums" aria-live="polite"';

/**
 * Forma canônica: rótulo, valor textual ao lado e a faixa embaixo.
 *
 * Serve o Playground e cascateia para as stories de estado, que só mudam os
 * args. Escreve apenas o que difere do padrão do componente (`min=0`,
 * `max=100`, `step=1`, horizontal); o nome acessível fica sempre, porque um
 * slider sem nome é anunciado como "controle deslizante" e nada mais.
 */
export function sliderSource(_gerado?: string, ctx?: { args?: Partial<SliderArgs> }): string {
  const {
    value = [50],
    min = 0,
    max = 100,
    step = 1,
    orientation = 'horizontal',
    disabled = false,
  } = ctx?.args ?? {};

  const props = attrs(
    'bind:value={valor}',
    min !== 0 ? `min={${min}}` : '',
    max !== 100 ? `max={${max}}` : '',
    step !== 1 ? `step={${step}}` : '',
    orientation === 'vertical' ? 'orientation="vertical"' : '',
    disabled ? 'disabled' : '',
    'aria-label="Volume"',
  );

  const estado = `let valor = $state([${value.join(', ')}]);`;

  if (orientation === 'vertical') {
    return svelteSnippet(
      `${IMPORT}

${estado}`,
      `<div class="nds-stack" data-spacing="sm">
  <div class="nds-cluster" data-align="center" data-justify="between">
    <Label>Volume</Label>
    <span ${VALUE_VIVO}>{valor[0]}%</span>
  </div>
  <div class="nds-cluster" data-justify="center">
    <Slider${props} />
  </div>
</div>`,
    );
  }

  return svelteSnippet(
    `${IMPORT}

${estado}`,
    `<div class="nds-stack nds-w-sm" data-spacing="sm">
  <div class="nds-cluster" data-justify="between">
    <Label>Volume</Label>
    <span ${VALUE_VIVO}>{valor[0]}%</span>
  </div>
  <Slider${props} />
</div>`,
  );
}

/** Variante Single: uma alça só, e mesmo assim `value` é lista de um item. */
export function sliderUnicoSource(): string {
  return svelteSnippet(
    `${IMPORT}

let volume = $state([50]);`,
    `<div class="nds-stack nds-w-sm" data-spacing="sm">
  <div class="nds-cluster" data-justify="between">
    <Label>Volume</Label>
    <span ${VALUE_VIVO}>{volume[0]}%</span>
  </div>
  <Slider bind:value={volume} aria-label="Volume" />
</div>`,
  );
}

/**
 * Variante Range: duas alças na mesma lista, e um nome acessível para cada uma
 * — sem `thumbAriaLabels` as duas seriam anunciadas com o mesmo texto.
 */
export function sliderRangeSource(): string {
  return svelteSnippet(
    `${IMPORT}

let faixa = $state([20, 80]);`,
    `<div class="nds-stack nds-w-sm" data-spacing="sm">
  <div class="nds-cluster" data-justify="between">
    <Label>Faixa de preço</Label>
    <span ${VALUE_VIVO}>R$ {faixa[0]} — R$ {faixa[1]}</span>
  </div>
  <Slider
    bind:value={faixa}
    aria-label="Faixa de preço"
    thumbAriaLabels={["Preço mínimo", "Preço máximo"]}
  />
</div>`,
  );
}

/** Variante Vertical: a faixa em pé, com a altura mínima vinda do componente. */
export function sliderVerticalSource(): string {
  return svelteSnippet(
    `${IMPORT}

let brilho = $state([60]);`,
    `<div class="nds-stack" data-spacing="sm">
  <div class="nds-cluster" data-align="center" data-justify="between">
    <Label>Brilho</Label>
    <span ${VALUE_VIVO}>{brilho[0]}%</span>
  </div>
  <div class="nds-cluster" data-justify="center">
    <Slider bind:value={brilho} orientation="vertical" aria-label="Brilho" />
  </div>
</div>`,
  );
}

/** Composição PriceRange: faixa de preço com passo grosso e prefixo de moeda. */
export function precoSliderRangeSource(): string {
  return svelteSnippet(
    `${IMPORT}

let preco = $state([100, 400]);`,
    `<div class="nds-stack nds-w-sm" data-spacing="sm">
  <div class="nds-cluster" data-justify="between">
    <Label>Faixa de preço</Label>
    <span ${VALUE_VIVO}>R$ {preco[0]} — R$ {preco[1]}</span>
  </div>
  <Slider
    bind:value={preco}
    max={500}
    step={10}
    aria-label="Faixa de preço"
    thumbAriaLabels={["Preço mínimo", "Preço máximo"]}
  />
</div>`,
  );
}

/**
 * Composição InForm: dois sliders no mesmo formulário. Cada um precisa do
 * próprio nome acessível — repetir "Valor" faria o leitor de tela anunciar dois
 * controles idênticos.
 */
export function formSliderSource(): string {
  return svelteSnippet(
    `import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

let brilho = $state([70]);
let opacidade = $state([100]);`,
    `<form class="nds-stack nds-w-sm" data-spacing="md" aria-label="Configurações de áudio">
  <div class="nds-stack" data-spacing="sm">
    <Label for="preset">Nome do preset</Label>
    <Input id="preset" placeholder="Meu preset" />
  </div>

  <div class="nds-stack" data-spacing="sm">
    <div class="nds-cluster" data-justify="between">
      <Label>Brilho</Label>
      <span ${VALUE_VIVO}>{brilho[0]}%</span>
    </div>
    <Slider bind:value={brilho} aria-label="Brilho" />
  </div>

  <div class="nds-stack" data-spacing="sm">
    <div class="nds-cluster" data-justify="between">
      <Label>Opacidade</Label>
      <span ${VALUE_VIVO}>{opacidade[0]}%</span>
    </div>
    <Slider bind:value={opacidade} aria-label="Opacidade" />
  </div>

  <Button type="submit" size="sm">Salvar preset</Button>
</form>`,
  );
}

/** Composição ThickStep: escala discreta e curta, onde cada passo é um degrau. */
export function sliderEscalaCurtaSource(): string {
  return svelteSnippet(
    `${IMPORT}

let avaliacao = $state([3]);`,
    `<div class="nds-stack nds-w-sm" data-spacing="sm">
  <div class="nds-cluster" data-justify="between">
    <Label>Avaliação</Label>
    <span ${VALUE_VIVO}>{avaliacao[0]} / 5</span>
  </div>
  <Slider bind:value={avaliacao} min={1} max={5} aria-label="Avaliação" />
</div>`,
  );
}
