import { describe, expect, it } from 'vitest';
import {
  checkboxComDescricaoSource,
  checkboxComRotuloSource,
  checkboxDesabilitadoMarcadoSource,
  checkboxDesabilitadoSource,
  checkboxDesmarcadoSource,
  checkboxEmFormularioSource,
  checkboxErroSource,
  checkboxFocoSource,
  checkboxGrupoSource,
  checkboxMarcadoSource,
  checkboxMistoSource,
  checkboxSelecionarTodosSource,
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
    const saida = checkboxSource();
    expect(saida).toContain('<Checkbox id="termos" />');
    expect(saida).toContain('<label for="termos" class="nds-label">');
  });

  it('o estado inicial acompanha o control, inclusive no terceiro valor', () => {
    expect(checkboxSource('', { args: { checked: true } })).toContain(':checked="true"');
    expect(checkboxSource('', { args: { checked: 'indeterminate' } })).toContain(
      `:checked="'indeterminate'"`,
    );
  });

  it('não escreve o que já é padrão do componente', () => {
    const saida = checkboxSource('', {
      args: { checked: false, disabled: false, required: false, value: 'on' },
    });
    expect(saida).not.toContain('checked');
    expect(saida).not.toContain('disabled');
    expect(saida).not.toContain('required');
    // "on" é o valor que a caixa envia sem ninguém pedir.
    expect(saida).not.toContain('value=');
  });

  it('desabilitado e obrigatório saem como atributo puro, que é a forma booleana', () => {
    const saida = checkboxSource('', { args: { disabled: true, required: true } });
    expect(saida).toContain('<Checkbox id="termos" disabled required />');
  });

  it('ignora control que não é do tipo esperado — o espião de ação vira ruído no painel', () => {
    const espiao = (() => {}) as never;
    const saida = checkboxSource('', {
      args: { checked: espiao, disabled: espiao, required: espiao, name: espiao, value: espiao },
    });
    expect(saida).toBe(checkboxSource());
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('name=');
  });
});

describe('transforms das stories de estado', () => {
  it('a caixa de partida não carrega prop nenhuma', () => {
    expect(checkboxDesmarcadoSource()).toContain('<Checkbox id="termos" />');
    expect(checkboxDesmarcadoSource()).not.toContain(':checked');
  });

  it('marcado e misto diferem só no valor do estado — e não em um atributo próprio', () => {
    expect(checkboxMarcadoSource()).toContain(':checked="true"');
    expect(checkboxMistoSource()).toContain(`:checked="'indeterminate'"`);
    // Não existe prop `indeterminate`: escrevê-la ensinaria uma API que não há.
    expect(checkboxMistoSource()).not.toContain('indeterminate="');
  });

  it('o desabilitado marca o contêiner do par, e não só a caixa', () => {
    const saida = checkboxDesabilitadoSource();
    // A raiz da caixa não é um `<input>`: nenhum seletor de irmão desabilitado
    // alcançaria o rótulo, então o esmaecimento mora no contêiner.
    expect(saida).toContain('<div class="nds-cluster" data-spacing="sm" data-disabled="true">');
    expect(saida).toContain('<Checkbox id="sessao" disabled />');
  });

  it('desabilitado e marcado convivem — desabilitado não é o mesmo que vazio', () => {
    expect(checkboxDesabilitadoMarcadoSource()).toContain(
      '<Checkbox id="notificacoes" disabled :checked="true" />',
    );
  });

  it('o erro se anuncia por atributo e a frase chega pela descrição', () => {
    const saida = checkboxErroSource();
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).toContain('aria-describedby="termos-erro"');
    expect(saida).toContain('<p id="termos-erro"');
    // Cor sozinha não comunica erro: a frase é o que sobra para quem não a vê.
    expect(saida).toContain('Você precisa aceitar os termos para continuar.');
  });

  it('o foco não tem prop a ligar — o anel sai do próprio componente', () => {
    const saida = checkboxFocoSource();
    expect(saida).toContain('Foco visível via teclado');
    expect(saida).not.toContain('focus');
  });
});

describe('transforms das stories de composição', () => {
  it('a composição mínima é o par, igual à do estado de partida', () => {
    expect(checkboxComRotuloSource()).toBe(checkboxDesmarcadoSource());
  });

  it('a descrição fica fora do rótulo e chega pelo aria-describedby', () => {
    const saida = checkboxComDescricaoSource();
    expect(saida).toContain('aria-describedby="novidades-ajuda"');
    expect(saida).toContain('<p id="novidades-ajuda" class="nds-text-body">');
    // Alinhamento pelo topo e recuo de dois pixels: sem eles a caixa flutua no
    // meio de um bloco de duas linhas.
    expect(saida).toContain('data-align="start"');
    expect(saida).toContain('class="nds-mt-0-5"');
  });

  it('o grupo nasce de um fieldset com legend, e os itens saem de um v-for', () => {
    const saida = checkboxGrupoSource();
    expect(saida).toContain('<legend class="nds-text-body nds-font-semibold nds-px-1">');
    expect(saida).toContain('v-for="preferencia in preferencias"');
    expect(saida).toContain(':key="preferencia.id"');
    expect(saida).toContain('<label :for="preferencia.id" class="nds-label">');
    // Um único par no laço: repetir o bloco três vezes seria copiar a story.
    expect(saida.match(/<Checkbox/g)).toHaveLength(1);
  });

  it('o selecionar-todos fica separado da lista que ele comanda', () => {
    const saida = checkboxSelecionarTodosSource();
    expect(saida).toContain('<Checkbox id="selecionar-todos" />');
    expect(saida).toContain('class="nds-cluster nds-border-b nds-pb-2"');
    expect(saida).toContain('v-for="preferencia in preferencias"');
  });

  it('o formulário leva name, value e required — é o que chega ao submit', () => {
    const saida = checkboxEmFormularioSource();
    expect(saida).toContain('<Checkbox id="termos" name="terms" value="accepted" required');
    expect(saida).toContain('<form class="nds-stack nds-w-sm" data-spacing="md" @submit.prevent>');
    // Componentes do design system, não marcação crua: um `<button>` escrito à
    // mão perde a altura que cresce com a fonte (WCAG 1.4.4).
    expect(saida).toContain('<Button type="submit" class="nds-w-full">Criar conta</Button>');
    expect(saida).toContain(`import { Input } from '@/components/ui/input'`);
    expect(saida).not.toContain('<button');
    expect(saida).not.toContain('<input');
  });

  it('nenhum snippet carrega valor de design em style inline', () => {
    for (const saida of [
      checkboxSource(),
      checkboxComDescricaoSource(),
      checkboxEmFormularioSource(),
      checkboxGrupoSource(),
      checkboxSelecionarTodosSource(),
    ]) {
      // O snippet é o markup que alguém COPIA: um valor cravado aqui sai do
      // alcance do tema no primeiro colar.
      expect(saida).not.toContain('style="');
    }
  });
});
