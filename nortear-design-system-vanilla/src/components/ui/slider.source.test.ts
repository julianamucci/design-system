import { describe, expect, it } from 'vitest';
import { sliderSnippet, sliderSource, sliderSourceWith } from './slider.source';

describe('sliderSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = sliderSnippet();
    expect(code).toContain("import { createSlider } from '@/components/ui/slider';");
    expect(code).toContain('createSlider({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('input type="range"');
  });

  it('usa o nome acessível canônico, nunca o apelido depreciado', () => {
    const code = sliderSnippet({ 'aria-label': 'Brilho' });
    expect(code).toContain("'aria-label': 'Brilho'");
    expect(code).not.toContain('ariaLabel');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = sliderSnippet();
    expect(code).not.toContain('min');
    expect(code).not.toContain('max');
    expect(code).not.toContain('step');
    expect(code).not.toContain('disabled');
    expect(code).not.toContain('orientation');
  });

  it('mostra faixa, passo e estados quando a story os usa', () => {
    const code = sliderSnippet({ min: 0, max: 1000, step: 10, value: 75, disabled: true });
    expect(code).not.toContain('min:');
    expect(code).toContain('max: 1000');
    expect(code).toContain('step: 10');
    expect(code).toContain('value: 75');
    expect(code).toContain('disabled: true');
  });

  it('um PAR de valores vira o intervalo, com um nome por alça', () => {
    // É a forma do valor que pede as duas alças — não existe opção separada.
    const code = sliderSnippet({
      value: [20, 80],
      'aria-label': ['Faixa de preço — mínimo', 'Faixa de preço — máximo'],
    });
    expect(code).toContain('value: [20, 80]');
    expect(code).toContain("'aria-label': ['Faixa de preço — mínimo', 'Faixa de preço — máximo']");
  });

  it('sem nome informado, o intervalo já nasce com dois nomes', () => {
    // Um nome só repetido nas duas alças deixa quem ouve sem saber qual extremo
    // está mexendo.
    const code = sliderSnippet({ value: [10, 90] });
    expect(code).toContain('mínimo');
    expect(code).toContain('máximo');
  });

  it('mostra a orientação em pé quando a story a usa', () => {
    expect(sliderSnippet({ orientation: 'vertical' })).toContain("orientation: 'vertical'");
    expect(sliderSnippet({ orientation: 'horizontal' })).not.toContain('orientation');
  });

  it('não vaza a decoração nem o andaime das stories', () => {
    const code = sliderSnippet({ value: 50 });
    // `unit` e `withLabel` só existem dentro dos arquivos de story.
    expect(code).not.toContain('unit');
    expect(code).not.toContain('withLabel');
    expect(code).not.toContain('idPrefix');
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
    const noArgs = sliderSource('<div data-slot="slider">', {});
    const withArgs = sliderSource('<div data-slot="slider">', {
      args: { value: 75, step: 5, disabled: true },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain('value: 75');
    expect(withArgs).toContain('step: 5');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(sliderSource('<div data-slot="slider" data-orientation="horizontal">', {})).not.toContain(
      'data-orientation',
    );
  });
});

describe('sliderSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const code = sliderSourceWith({ orientation: 'vertical', value: 60 })('', {
      args: { value: 10, orientation: 'horizontal' },
    });
    expect(code).toContain("orientation: 'vertical'");
    expect(code).toContain('value: 60');
  });

  it('aceita uma expressão própria para o callback', () => {
    const code = sliderSourceWith({
      onValueChange: '([minimo, maximo]) => mostrarFaixa(minimo, maximo)',
    })('', {});
    expect(code).toContain('onValueChange: ([minimo, maximo]) => mostrarFaixa(minimo, maximo)');
  });
});
