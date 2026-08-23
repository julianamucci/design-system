import { describe, expect, it } from 'vitest';
import {
  sliderDisabledSource,
  sliderRangeSource,
  sliderFocusSource,
  sliderFormSource,
  sliderNoMaximoSource,
  minimumSliderSource,
  sliderDefaultSource,
  sliderStepGrossoSource,
  sliderPlaygroundSource,
  sliderPrecoSource,
  sliderUnicoSource,
  sliderVerticalSource,
  sliderVolumeSource,
} from './slider.source';

const ALL = [
  sliderPlaygroundSource,
  sliderUnicoSource,
  sliderRangeSource,
  sliderVerticalSource,
  sliderDefaultSource,
  sliderFocusSource,
  sliderDisabledSource,
  minimumSliderSource,
  sliderNoMaximoSource,
  sliderVolumeSource,
  sliderPrecoSource,
  sliderFormSource,
  sliderStepGrossoSource,
];

describe('sliderPlaygroundSource', () => {
  it('sem args, entrega o rótulo, o valor corrente e o controle', () => {
    expect(sliderPlaygroundSource()).toBe(
      `<script setup lang="ts">
import { ref } from 'vue'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

const volume = ref([50])
</script>

<template>
  <div class="nds-stack nds-w-sm" data-spacing="sm">
    <div class="nds-cluster" data-justify="between">
      <Label>Volume</Label>
      <span aria-live="polite" class="nds-text-body nds-tabular-nums">{{ volume[0] }}%</span>
    </div>
    <Slider v-model="volume" aria-label="Volume" />
  </div>
</template>`,
    );
  });

  it('o estado inicial acompanha o control de valor', () => {
    expect(sliderPlaygroundSource('', { args: { modelValue: [20, 80] } })).toContain(
      'const volume = ref([20, 80])',
    );
    // Sem valor controlado, o inicial vem do não-controlado.
    expect(sliderPlaygroundSource('', { args: { defaultValue: [15] } })).toContain(
      'const volume = ref([15])',
    );
  });

  it('não escreve os padrões — repetir valor padrão ensina ruído', () => {
    const saida = sliderPlaygroundSource('', {
      args: { min: 0, max: 100, step: 1, orientation: 'horizontal', disabled: false },
    });
    expect(saida).toContain('<Slider v-model="volume" aria-label="Volume" />');
    expect(saida).not.toContain(':min');
    expect(saida).not.toContain(':max');
    expect(saida).not.toContain(':step');
    expect(saida).not.toContain('orientation');
    expect(saida).not.toContain('disabled');
  });

  it('escreve o que difere, na ordem em que a API se lê', () => {
    const saida = sliderPlaygroundSource('', {
      args: { min: 10, max: 50, step: 5, orientation: 'vertical', disabled: true },
    });
    expect(saida).toContain(
      '<Slider v-model="volume" :min="10" :max="50" :step="5" orientation="vertical" disabled aria-label="Volume" />',
    );
  });

  it('ignora control que não é string nem número — o espião vira ruído no painel', () => {
    const saida = sliderPlaygroundSource('', {
      args: {
        modelValue: (() => {}) as never,
        min: (() => {}) as never,
        orientation: (() => {}) as never,
      },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('[object Object]');
    // Cai no padrão em vez de interpolar o espião.
    expect(saida).toContain('const volume = ref([50])');
    expect(saida).toContain('<Slider v-model="volume" aria-label="Volume" />');
  });
});

describe('o que vale para todas as transforms do componente', () => {
  it('o valor é sempre um array, e sempre por v-model', () => {
    for (const fn of ALL) {
      const saida = fn();
      expect(saida).toMatch(/const \w+ = ref\(\[/);
      expect(saida).toContain('<Slider v-model="');
    }
  });

  it('todo controle leva nome acessível — a alça sozinha não tem texto', () => {
    for (const fn of ALL) {
      for (const tag of fn().match(/<Slider [^>]*\/>/g) ?? []) {
        expect(tag).toMatch(/aria-label="[^"]+"/);
      }
    }
  });
});

describe('transforms das stories de variante', () => {
  it('a faixa vem do tamanho do array, não de uma prop de modo', () => {
    const saida = sliderRangeSource();
    expect(saida).toContain('const faixa = ref([20, 80])');
    expect(saida).toContain('R$ {{ faixa[0] }} — R$ {{ faixa[1] }}');
    expect(saida).not.toContain('range');
  });

  it('a vertical troca o eixo e ganha o contêiner que a centraliza', () => {
    const saida = sliderVerticalSource();
    expect(saida).toContain('orientation="vertical"');
    expect(saida).toContain('<div class="nds-cluster" data-justify="center">');
    // Em pé o controle não ocupa a largura da coluna: a largura fixa sairia.
    expect(saida).not.toContain('nds-w-sm');
  });
});

describe('transforms das stories de estado', () => {
  it('o foco não tem o que escrever — nem prop, nem classe', () => {
    const saida = sliderFocusSource();
    expect(saida).not.toContain('focus');
    expect(saida).not.toContain('tabindex');
    // Sem a linha de valor, que disputaria a atenção com o desenho do foco.
    expect(saida).not.toContain('aria-live');
  });

  it('desabilitado liga a prop na raiz, que alcança todas as alças', () => {
    expect(sliderDisabledSource()).toContain(
      '<Slider v-model="volume" disabled aria-label="Volume" />',
    );
  });

  it('os extremos moram no valor inicial, não em prop', () => {
    expect(minimumSliderSource()).toContain('const volume = ref([0])');
    expect(sliderNoMaximoSource()).toContain('const volume = ref([100])');
    // O limite é do componente: escrevê-lo aqui ensinaria uma prop de trava.
    expect(sliderNoMaximoSource()).not.toContain('readonly');
  });
});

describe('transforms das stories de composição', () => {
  it('o preço abre a faixa e engrossa o passo, com a escala embaixo', () => {
    const saida = sliderPrecoSource();
    expect(saida).toContain('<Slider v-model="faixa" :max="500" :step="10" aria-label="Faixa de preço" />');
    // O mínimo continua sendo o padrão do componente.
    expect(saida).not.toContain(':min');
    expect(saida).toContain('<span>R$ 500</span>');
  });

  it('no formulário, cada controle leva o próprio nome acessível', () => {
    const saida = sliderFormSource();
    expect(saida).toContain('aria-label="Brilho"');
    expect(saida).toContain('aria-label="Opacidade"');
    expect(saida).toContain('@submit.prevent="salvar"');
    expect(saida).toContain('<Button type="submit" size="sm">Salvar preset</Button>');
    // O campo de texto se liga ao rótulo pelo id, não por proximidade.
    expect(saida).toContain('<Label for="preset-nome">Nome do preset</Label>');
  });

  it('a faixa curta escreve só os limites que diferem do padrão', () => {
    const saida = sliderStepGrossoSource();
    expect(saida).toContain('<Slider v-model="avaliacao" :min="1" :max="5" aria-label="Avaliação" />');
    // Passo 1 é o padrão do componente.
    expect(saida).not.toContain(':step');
  });
});
