import { describe, expect, it } from 'vitest';
import {
  sliderEmFormularioSource,
  sliderEscalaCurtaSource,
  sliderFaixaDePrecoSource,
  sliderFaixaSource,
  sliderSource,
  sliderUnicoSource,
  sliderVerticalSource,
} from './slider.source';

describe('sliderSource', () => {
  it('sem args, entrega a forma canônica com rótulo, valor vivo e a faixa', () => {
    expect(sliderSource()).toBe(
      `<script lang="ts">
  import { Slider } from "@/components/ui/slider";
  import { Label } from "@/components/ui/label";

  let valor = $state([50]);
</script>

<div class="nds-stack nds-w-sm" data-spacing="sm">
  <div class="nds-cluster" data-justify="between">
    <Label>Volume</Label>
    <span class="nds-text-body nds-tabular-nums" aria-live="polite">{valor[0]}%</span>
  </div>
  <Slider bind:value={valor} aria-label="Volume" />
</div>`,
    );
  });

  it('o valor chega como LISTA, inclusive com uma alça só', () => {
    expect(sliderSource('', { args: { value: [30] } })).toContain('$state([30])');
    expect(sliderSource('', { args: { value: [20, 80] } })).toContain('$state([20, 80])');
  });

  it('só escreve min, max e step quando o valor difere do padrão do componente', () => {
    const padrao = sliderSource('', { args: { min: 0, max: 100, step: 1 } });
    expect(padrao).not.toContain('min={');
    expect(padrao).not.toContain('max={');
    expect(padrao).not.toContain('step={');

    const curto = sliderSource('', { args: { min: 1, max: 5, step: 2 } });
    expect(curto).toContain('min={1}');
    expect(curto).toContain('max={5}');
    expect(curto).toContain('step={2}');
  });

  it('acompanha o control de orientação, trocando também o contêiner', () => {
    const emPe = sliderSource('', { args: { orientation: 'vertical' } });
    expect(emPe).toContain('orientation="vertical"');
    // A faixa em pé é centrada por uma linha de flex própria.
    expect(emPe).toContain('data-justify="center"');
    expect(sliderSource('', { args: { orientation: 'horizontal' } })).not.toContain('orientation');
  });

  it('só escreve disabled quando o valor difere do padrão', () => {
    expect(sliderSource('', { args: { disabled: false } })).not.toContain('disabled');
    expect(sliderSource('', { args: { disabled: true } })).toContain('disabled');
  });

  it('o nome acessível nunca sai, em nenhuma combinação de args', () => {
    expect(sliderSource('', { args: { disabled: true, orientation: 'vertical' } })).toContain(
      'aria-label="Volume"',
    );
  });
});

describe('transforms das stories de variação e composição', () => {
  it('a variante única tem uma alça só, e mesmo assim o valor é lista', () => {
    const saida = sliderUnicoSource();
    expect(saida).toContain('$state([50])');
    expect(saida.match(/<Slider/g)).toHaveLength(1);
  });

  it('a faixa nomeia cada alça — sem isso as duas seriam anunciadas igual', () => {
    const saida = sliderFaixaSource();
    expect(saida).toContain('$state([20, 80])');
    expect(saida).toContain('thumbAriaLabels={["Preço mínimo", "Preço máximo"]}');
  });

  it('a variante vertical declara a orientação e a linha que a centra', () => {
    const saida = sliderVerticalSource();
    expect(saida).toContain('orientation="vertical"');
    expect(saida).toContain('data-justify="center"');
  });

  it('a faixa de preço carrega o passo grosso e a escala maior', () => {
    const saida = sliderFaixaDePrecoSource();
    expect(saida).toContain('max={500}');
    expect(saida).toContain('step={10}');
    expect(saida).toContain('$state([100, 400])');
  });

  it('no formulário cada faixa tem nome acessível próprio', () => {
    const saida = sliderEmFormularioSource();
    expect(saida).toContain('<form');
    expect(saida).toContain('aria-label="Brilho"');
    expect(saida).toContain('aria-label="Opacidade"');
    expect(saida.match(/<Slider/g)).toHaveLength(2);
  });

  it('a escala curta anda de 1 a 5', () => {
    const saida = sliderEscalaCurtaSource();
    expect(saida).toContain('min={1}');
    expect(saida).toContain('max={5}');
  });
});
