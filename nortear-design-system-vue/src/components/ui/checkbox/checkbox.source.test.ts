import { describe, expect, it } from 'vitest';
import {
  checkboxWithDescriptionSource,
  checkboxWithLabelSource,
  checkboxDisabledCheckedSource,
  checkboxDisabledSource,
  checkboxDesmarcadoSource,
  formCheckboxSource,
  checkboxErrorSource,
  checkboxFocusSource,
  checkboxGroupSource,
  checkboxCheckedSource,
  checkboxMistoSource,
  checkboxSelectAllSource,
  checkboxSource,
} from './checkbox.source';

describe('checkboxSource', () => {
  it('com os args do Playground, entrega o par caixa + rótulo', () => {
    expect(
      checkboxSource('', {
        args: { checked: false, disabled: false, required: false, name: 'terms', value: 'accepted' },
      }),
    ).toBe(
      `<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox'
</script>

<template>
  <div class="nds-cluster" data-spacing="sm">
    <Checkbox id="termos" name="terms" value="accepted" />
    <label for="termos" class="nds-label">Aceito os termos e condições</label>
  </div>
</template>`,
    );
  });

  it('o rótulo é amarrado à caixa pelo par id/for — é ele que dá nome ao controle', () => {
    const output = checkboxSource();
    expect(output).toContain('<Checkbox id="termos" />');
    expect(output).toContain('<label for="termos" class="nds-label">');
  });

  it('o estado inicial acompanha o control, inclusive no terceiro valor', () => {
    expect(checkboxSource('', { args: { checked: true } })).toContain(':checked="true"');
    expect(checkboxSource('', { args: { checked: 'indeterminate' } })).toContain(
      `:checked="'indeterminate'"`,
    );
  });

  it('não escreve o que já é padrão do componente', () => {
    const output = checkboxSource('', {
      args: { checked: false, disabled: false, required: false, value: 'on' },
    });
    expect(output).not.toContain('checked');
    expect(output).not.toContain('disabled');
    expect(output).not.toContain('required');
    // "on" é o valor que a caixa envia sem ninguém pedir.
    expect(output).not.toContain('value=');
  });

  it('desabilitado e obrigatório saem como atributo puro, que é a forma booleana', () => {
    const output = checkboxSource('', { args: { disabled: true, required: true } });
    expect(output).toContain('<Checkbox id="termos" disabled required />');
  });

  it('ignora control que não é do tipo esperado — o espião de ação vira ruído no painel', () => {
    const spy = (() => {}) as never;
    const output = checkboxSource('', {
      args: { checked: spy, disabled: spy, required: spy, name: spy, value: spy },
    });
    expect(output).toBe(checkboxSource());
    expect(output).not.toContain('function');
    expect(output).not.toContain('name=');
  });
});

describe('transforms das stories de estado', () => {
  it('a caixa de partida não carrega prop nenhuma', () => {
    expect(checkboxDesmarcadoSource()).toContain('<Checkbox id="termos" />');
    expect(checkboxDesmarcadoSource()).not.toContain(':checked');
  });

  it('marcado e misto diferem só no valor do estado — e não em um atributo próprio', () => {
    expect(checkboxCheckedSource()).toContain(':checked="true"');
    expect(checkboxMistoSource()).toContain(`:checked="'indeterminate'"`);
    // Não existe prop `indeterminate`: escrevê-la ensinaria uma API que não há.
    expect(checkboxMistoSource()).not.toContain('indeterminate="');
  });

  it('o desabilitado marca o contêiner do par, e não só a caixa', () => {
    const output = checkboxDisabledSource();
    // A raiz da caixa não é um `<input>`: nenhum seletor de irmão desabilitado
    // alcançaria o rótulo, então o esmaecimento mora no contêiner.
    expect(output).toContain('<div class="nds-cluster" data-spacing="sm" data-disabled="true">');
    expect(output).toContain('<Checkbox id="sessao" disabled />');
  });

  it('desabilitado e marcado convivem — desabilitado não é o mesmo que vazio', () => {
    expect(checkboxDisabledCheckedSource()).toContain(
      '<Checkbox id="notificacoes" disabled :checked="true" />',
    );
  });

  it('o erro se anuncia por atributo e a frase chega pela descrição', () => {
    const output = checkboxErrorSource();
    expect(output).toContain('aria-invalid="true"');
    expect(output).toContain('aria-describedby="termos-erro"');
    expect(output).toContain('<p id="termos-erro"');
    // Cor sozinha não comunica erro: a frase é o que sobra para quem não a vê.
    expect(output).toContain('Você precisa aceitar os termos para continuar.');
  });

  it('o foco não tem prop a ligar — o anel sai do próprio componente', () => {
    const output = checkboxFocusSource();
    expect(output).toContain('Foco visível via teclado');
    expect(output).not.toContain('focus');
  });
});

describe('transforms das stories de composição', () => {
  it('a composição mínima é o par, igual à do estado de partida', () => {
    expect(checkboxWithLabelSource()).toBe(checkboxDesmarcadoSource());
  });

  it('a descrição fica fora do rótulo e chega pelo aria-describedby', () => {
    const output = checkboxWithDescriptionSource();
    expect(output).toContain('aria-describedby="novidades-ajuda"');
    expect(output).toContain('<p id="novidades-ajuda" class="nds-text-body">');
    // Alinhamento pelo topo e recuo de dois pixels: sem eles a caixa flutua no
    // meio de um bloco de duas linhas.
    expect(output).toContain('data-align="start"');
    expect(output).toContain('class="nds-mt-0-5"');
  });

  it('o grupo nasce de um fieldset com legend, e os itens saem de um v-for', () => {
    const output = checkboxGroupSource();
    expect(output).toContain('<legend class="nds-text-body nds-font-semibold nds-px-1">');
    expect(output).toContain('v-for="preferencia in preferencias"');
    expect(output).toContain(':key="preferencia.id"');
    expect(output).toContain('<label :for="preferencia.id" class="nds-label">');
    // Um único par no laço: repetir o bloco três vezes seria copiar a story.
    expect(output.match(/<Checkbox/g)).toHaveLength(1);
  });

  it('o selecionar-todos fica separado da lista que ele comanda', () => {
    const output = checkboxSelectAllSource();
    expect(output).toContain('<Checkbox id="selecionar-todos" />');
    expect(output).toContain('class="nds-cluster nds-border-b nds-pb-2"');
    expect(output).toContain('v-for="preferencia in preferencias"');
  });

  it('o formulário leva name, value e required — é o que chega ao submit', () => {
    const output = formCheckboxSource();
    expect(output).toContain('<Checkbox id="termos" name="terms" value="accepted" required');
    expect(output).toContain('<form class="nds-stack nds-w-sm" data-spacing="md" @submit.prevent>');
    // Componentes do design system, não marcação crua: um `<button>` escrito à
    // mão perde a altura que cresce com a fonte (WCAG 1.4.4).
    expect(output).toContain('<Button type="submit" class="nds-w-full">Criar conta</Button>');
    expect(output).toContain(`import { Input } from '@/components/ui/input'`);
    expect(output).not.toContain('<button');
    expect(output).not.toContain('<input');
  });

  it('nenhum snippet carrega valor de design em style inline', () => {
    for (const output of [
      checkboxSource(),
      checkboxWithDescriptionSource(),
      formCheckboxSource(),
      checkboxGroupSource(),
      checkboxSelectAllSource(),
    ]) {
      // O snippet é o markup que alguém COPIA: um valor cravado aqui sai do
      // alcance do tema no primeiro colar.
      expect(output).not.toContain('style="');
    }
  });
});
