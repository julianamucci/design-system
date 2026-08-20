import { describe, expect, it } from 'vitest';
import { sliderSnippet, sliderSource, sliderSourceCom } from './slider.source';

describe('sliderSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = sliderSnippet();
    expect(código).toContain("import { createSlider } from '@/components/ui/slider';");
    expect(código).toContain('createSlider({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('input type="range"');
  });

  it('usa o nome acessível canônico, nunca o apelido depreciado', () => {
    const código = sliderSnippet({ 'aria-label': 'Brilho' });
    expect(código).toContain("'aria-label': 'Brilho'");
    expect(código).not.toContain('ariaLabel');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = sliderSnippet();
    expect(código).not.toContain('min');
    expect(código).not.toContain('max');
    expect(código).not.toContain('step');
    expect(código).not.toContain('disabled');
    expect(código).not.toContain('orientation');
  });

  it('mostra faixa, passo e estados quando a story os usa', () => {
    const código = sliderSnippet({ min: 0, max: 1000, step: 10, value: 75, disabled: true });
    expect(código).not.toContain('min:');
    expect(código).toContain('max: 1000');
    expect(código).toContain('step: 10');
    expect(código).toContain('value: 75');
    expect(código).toContain('disabled: true');
  });

  it('um PAR de valores vira o intervalo, com um nome por alça', () => {
    // É a forma do valor que pede as duas alças — não existe opção separada.
    const código = sliderSnippet({
      value: [20, 80],
      'aria-label': ['Faixa de preço — mínimo', 'Faixa de preço — máximo'],
    });
    expect(código).toContain('value: [20, 80]');
    expect(código).toContain("'aria-label': ['Faixa de preço — mínimo', 'Faixa de preço — máximo']");
  });

  it('sem nome informado, o intervalo já nasce com dois nomes', () => {
    // Um nome só repetido nas duas alças deixa quem ouve sem saber qual extremo
    // está mexendo.
    const código = sliderSnippet({ value: [10, 90] });
    expect(código).toContain('mínimo');
    expect(código).toContain('máximo');
  });

  it('mostra a orientação em pé quando a story a usa', () => {
    expect(sliderSnippet({ orientation: 'vertical' })).toContain("orientation: 'vertical'");
    expect(sliderSnippet({ orientation: 'horizontal' })).not.toContain('orientation');
  });

  it('não vaza a decoração nem o andaime das stories', () => {
    const código = sliderSnippet({ value: 50 });
    // `unit` e `withLabel` só existem dentro dos arquivos de story.
    expect(código).not.toContain('unit');
    expect(código).not.toContain('withLabel');
    expect(código).not.toContain('idPrefix');
  });

  it('só liga a linha do callback quando a story o exercita', () => {
    expect(sliderSnippet()).not.toContain('onValueChange');
    expect(sliderSnippet({ onValueChange: () => {} })).toContain(
      'onValueChange: (valor) => mostrarValor(valor)',
    );
    expect(sliderSnippet({ onValueCommitted: () => {} })).toContain(
      'onValueCommitted: (valor) => registrarAjuste(valor)',
    );
  });
});

describe('sliderSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const semArgs = sliderSource('<div data-slot="slider">', {});
    const comArgs = sliderSource('<div data-slot="slider">', {
      args: { value: 75, step: 5, disabled: true },
    });
    expect(semArgs).not.toBe(comArgs);
    expect(comArgs).toContain('value: 75');
    expect(comArgs).toContain('step: 5');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(sliderSource('<div data-slot="slider" data-orientation="horizontal">', {})).not.toContain(
      'data-orientation',
    );
  });
});

describe('sliderSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const código = sliderSourceCom({ orientation: 'vertical', value: 60 })('', {
      args: { value: 10, orientation: 'horizontal' },
    });
    expect(código).toContain("orientation: 'vertical'");
    expect(código).toContain('value: 60');
  });

  it('aceita uma expressão própria para o callback', () => {
    const código = sliderSourceCom({
      onValueChange: '([minimo, maximo]) => mostrarFaixa(minimo, maximo)',
    })('', {});
    expect(código).toContain('onValueChange: ([minimo, maximo]) => mostrarFaixa(minimo, maximo)');
  });
});
