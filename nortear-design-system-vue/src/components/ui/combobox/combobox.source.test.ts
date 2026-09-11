import { describe, expect, it } from 'vitest';
import {
  comboboxControlledSource,
  comboboxCustomFilterSource,
  comboboxDisabledSource,
  comboboxGroupedSource,
  comboboxInFormSource,
  comboboxInvalidSource,
  comboboxMultipleSource,
  comboboxSingleLineSource,
  comboboxSource,
} from './combobox.source';

/** Todas as saídas do módulo, com o nome da story que as consome. */
const ALL_SOURCES: Array<[string, () => string]> = [
  ['Playground / SingleSelect', () => comboboxSource('', { args: {} })],
  ['MultipleSelect', comboboxMultipleSource],
  ['Grouped', comboboxGroupedSource],
  ['Disabled', comboboxDisabledSource],
  ['Invalid', comboboxInvalidSource],
  ['InForm', comboboxInFormSource],
  ['SingleLineChips', comboboxSingleLineSource],
  ['CustomFilter', comboboxCustomFilterSource],
  ['Controlled', comboboxControlledSource],
];

/** Os nomes importados de `@/components/ui/combobox`, na ordem do bloco. */
function importedNames(source: string): string[] {
  const block = source.match(/import \{\n([\s\S]*?)\n\} from '@\/components\/ui\/combobox'/);
  if (!block) return [];
  return block[1]
    .split('\n')
    .map((line) => line.trim().replace(/,$/, ''))
    .filter(Boolean);
}

/** As peças do Combobox que o template instancia. */
function usedParts(source: string): string[] {
  const template = source.slice(source.indexOf('<template>'));
  return [...new Set([...template.matchAll(/<(Combobox[A-Za-z]*)\b/g)].map((m) => m[1]))].sort();
}

describe('comboboxSource', () => {
  it('sem args, entrega a forma canônica da escolha única', () => {
    expect(comboboxSource('', { args: {} })).toBe(
      `<script setup lang="ts">
import { ref } from 'vue'
import {
  Combobox,
  ComboboxClear,
  ComboboxEmpty,
  ComboboxIcon,
  ComboboxInput,
  ComboboxInputWrapper,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxList,
  ComboboxPopup,
  ComboboxPositioner,
  ComboboxTrigger,
} from '@/components/ui/combobox'

const countries = [
  { value: 'brasil', label: 'Brasil' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'chile', label: 'Chile' },
]

const country = ref('')
</script>

<template>
  <Combobox v-model="country">
    <ComboboxLabel>País</ComboboxLabel>
    <ComboboxInputWrapper>
      <ComboboxInput placeholder="Buscar país" />
      <ComboboxClear aria-label="Limpar" />
      <ComboboxTrigger aria-label="Abrir lista">
        <ComboboxIcon />
      </ComboboxTrigger>
    </ComboboxInputWrapper>
    <ComboboxPositioner>
      <ComboboxPopup>
        <ComboboxList>
          <ComboboxItem
            v-for="country in countries"
            :key="country.value"
            :value="country.value"
          >
            {{ country.label }}
            <ComboboxItemIndicator />
          </ComboboxItem>
        </ComboboxList>
        <ComboboxEmpty>Nenhum resultado</ComboboxEmpty>
      </ComboboxPopup>
    </ComboboxPositioner>
  </Combobox>
</template>`,
    );
  });

  it('omite o valor padrão: `multiple` e `disabled` desligados não viram atributo', () => {
    const output = comboboxSource('', { args: { multiple: false, disabled: false } });
    expect(output).toContain('<Combobox v-model="country">');
    expect(output).not.toContain('multiple');
    expect(output).not.toContain('disabled');
    expect(output).not.toContain(':disabled="false"');
  });

  it('o que o control liga entra na raiz, e o `name` vai como está', () => {
    expect(comboboxSource('', { args: { disabled: true, name: 'pais' } })).toContain(
      '<Combobox v-model="country" disabled name="pais">',
    );
  });

  it('o placeholder acompanha o control, e cai no da story quando não vem', () => {
    expect(comboboxSource('', { args: { placeholder: 'Buscar cidade' } })).toContain(
      '<ComboboxInput placeholder="Buscar cidade" />',
    );
    expect(comboboxSource('', { args: {} })).toContain('<ComboboxInput placeholder="Buscar país" />');
  });

  it('ignora control que não é string — o espião de evento vira ruído no painel', () => {
    const output = comboboxSource('', {
      args: { name: (() => {}) as never, placeholder: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    expect(output).not.toContain('name=');
    expect(output).toContain('placeholder="Buscar país"');
  });

  it('sem ctx nenhum, não quebra: sai a forma canônica', () => {
    expect(comboboxSource()).toBe(comboboxSource('', { args: {} }));
  });
});

describe('o snippet ensina o campo, nunca a moldura da story', () => {
  it.each(ALL_SOURCES)('%s não vaza binding nem enquadramento que só existe na story', (_, build) => {
    const output = build();
    // `v-bind="args"` e as funções de rótulo existem no `setup` da story, não
    // no código de quem copia.
    expect(output).not.toContain('args');
    expect(output).not.toContain('removeLabelOf');
    expect(output).not.toContain('removedAnnouncementOf');
    // A altura reservada para a caixa aberta é do canvas do Chromatic.
    expect(output).not.toMatch(/nds-min-h-/);
    expect(output).not.toContain('COUNTRIES');
  });

  it.each(ALL_SOURCES)('%s importa exatamente as peças que o template usa', (_, build) => {
    const output = build();
    // A varredura genérica prova só um sentido — que tudo o que se usa foi
    // importado. Aqui vale o outro também: import sobrando ensina peça que o
    // exemplo não tem.
    expect(importedNames(output).sort()).toEqual(usedParts(output));
  });

  it.each(ALL_SOURCES)('%s deixa a mensagem de lista vazia IRMÃ da lista, nunca filha', (_, build) => {
    // Região viva não é filha permitida de `role="listbox"`.
    const output = build();
    const list = output.slice(output.indexOf('<ComboboxList>'), output.indexOf('</ComboboxList>'));
    expect(list).not.toContain('ComboboxEmpty');
    expect(output).toMatch(/<\/ComboboxList>\n\s*<ComboboxEmpty>Nenhum resultado<\/ComboboxEmpty>/);
  });
});

describe('modo múltiplo', () => {
  it('bate com a story: rótulo, placeholder e os dois escolhidos iniciais', () => {
    const output = comboboxMultipleSource();
    expect(output).toContain('<Combobox v-model="chosen" multiple>');
    expect(output).toContain('<ComboboxLabel>Países</ComboboxLabel>');
    expect(output).toContain('<ComboboxInput placeholder="Adicionar país" />');
    expect(output).toContain(`const chosen = ref(['brasil', 'argentina'])`);
  });

  it('os chips saem do MESMO valor que a raiz guarda — não há segunda lista', () => {
    const output = comboboxMultipleSource();
    expect(output).toContain(`import { computed, ref } from 'vue'`);
    expect(output).toContain(
      'const chips = computed(() =>\n  chosen.value.flatMap((value) => countries.filter((item) => item.value === value)),\n)',
    );
    expect(output).toContain('v-for="item in chips"');
  });

  it('cada botão de remover tem nome PRÓPRIO e anuncia o fato, não o comando', () => {
    const output = comboboxMultipleSource();
    expect(output).toContain(`:aria-label="'Remover ' + item.label"`);
    expect(output).toContain(`:removed-announcement="item.label + ' removido'"`);
    // "Remover" sozinho repetido em todo chip é o contraexemplo do Do & Don't.
    expect(output).not.toContain('aria-label="Remover"');
  });

  it('o texto mora DENTRO da caixa de chips, e o gatilho fica fora dela', () => {
    const output = comboboxMultipleSource();
    const chips = output.slice(output.indexOf('<ComboboxChips>'), output.indexOf('</ComboboxChips>'));
    expect(chips).toContain('<ComboboxInput placeholder="Adicionar país" />');
    expect(chips).not.toContain('ComboboxTrigger');
    expect(output.indexOf('</ComboboxChips>')).toBeLessThan(output.indexOf('<ComboboxTrigger'));
  });

  it('sem botão de limpar, como a story — e sem importá-lo', () => {
    const output = comboboxMultipleSource();
    expect(output).not.toContain('ComboboxClear');
  });
});

describe('chips numa linha só', () => {
  it('a escolha de layout vai na RAIZ, e não no wrapper', () => {
    const output = comboboxSingleLineSource();
    expect(output).toContain('<Combobox v-model="chosen" multiple chips-layout="single-line">');
    expect(output).toContain('<ComboboxInputWrapper>\n');
    expect(output).not.toContain('data-chips');
  });

  it('limpar e gatilho são IRMÃOS da caixa de chips, nunca filhos', () => {
    const output = comboboxSingleLineSource();
    const chips = output.slice(output.indexOf('<ComboboxChips>'), output.indexOf('</ComboboxChips>'));
    expect(chips).not.toContain('ComboboxClear');
    expect(chips).not.toContain('ComboboxTrigger');
    const closing = output.indexOf('</ComboboxChips>');
    expect(closing).toBeLessThan(output.indexOf('<ComboboxClear aria-label="Limpar" />'));
    expect(output.indexOf('<ComboboxClear')).toBeLessThan(output.indexOf('<ComboboxTrigger'));
  });
});

describe('lista agrupada', () => {
  it('bate com a story: rótulo, placeholder, cabeçalho por grupo e divisor entre eles', () => {
    const output = comboboxGroupedSource();
    expect(output).toContain('<ComboboxLabel>Ingrediente</ComboboxLabel>');
    expect(output).toContain('<ComboboxInput placeholder="Buscar ingrediente" />');
    expect(output).toContain('<ComboboxGroup>\n            <ComboboxGroupLabel>Frutas</ComboboxGroupLabel>');
    expect(output).toContain('<ComboboxGroup>\n            <ComboboxGroupLabel>Legumes</ComboboxGroupLabel>');
    expect(output).toMatch(/<\/ComboboxGroup>\n\s*<ComboboxSeparator \/>\n\s*<ComboboxGroup>/);
    expect([...output.matchAll(/<ComboboxSeparator \/>/g)]).toHaveLength(1);
  });

  it('não declara a lista de países — o exemplo não a usa', () => {
    const output = comboboxGroupedSource();
    expect(output).not.toContain('const countries');
    expect(output).toContain(`const ingredient = ref('')`);
  });
});

describe('transforms das stories de estado', () => {
  it('o bloqueio é da raiz, com um valor já escolhido', () => {
    const output = comboboxDisabledSource();
    expect(output).toContain('<Combobox v-model="country" disabled>');
    expect(output).toContain(`const country = ref('brasil')`);
    // Nada no campo de texto nem no gatilho repete o bloqueio.
    expect(output).not.toContain('<ComboboxInput placeholder="Buscar país" disabled');
    expect([...output.matchAll(/disabled/g)]).toHaveLength(1);
  });

  it('a invalidez mora no TEXTO, e a mensagem é escrita ao lado', () => {
    const output = comboboxInvalidSource();
    expect(output).toContain('<ComboboxInput placeholder="Buscar país" aria-invalid="true" />');
    expect(output).not.toContain('<Combobox v-model="country" aria-invalid');
    expect(output).toContain(
      '<p class="nds-text-body nds-text-destructive">Escolha um país para continuar.</p>',
    );
  });
});

describe('transforms das stories de composição', () => {
  it('no formulário, o `name` vai na raiz e o envio é interceptado', () => {
    const output = comboboxInFormSource();
    expect(output).toContain('<form class="nds-stack nds-w-xs" data-spacing="md" @submit.prevent>');
    expect(output).toContain('<Combobox v-model="country" name="country">');
    expect(output).toContain('<Button type="submit">Continuar</Button>');
    expect(output).toContain(`import { Button } from '@/components/ui/button'`);
  });

  it('o rótulo do envio é o que a prévia mostra, em qualquer idioma', () => {
    const output = comboboxInFormSource('Continue');
    expect(output).toContain('<Button type="submit">Continue</Button>');
    expect(output).not.toContain('Continuar');
    expect(output).not.toContain('Enviar');
  });

  it('o filtro do consumidor entra por prop, tipado pelo design system', () => {
    const output = comboboxCustomFilterSource();
    expect(output).toContain('<Combobox v-model="country" :filter="startsWithLabel">');
    expect(output).toContain(`import type { ComboboxFilter } from '@/components/ui/combobox'`);
    expect(output).toContain('const startsWithLabel: ComboboxFilter = (item, query) =>');
  });

  it('controlado: valor e texto de busca entram os dois como modelo', () => {
    const output = comboboxControlledSource();
    expect(output).toContain('<Combobox v-model="country" v-model:input-value="search">');
    expect(output).toContain(`const country = ref('')\nconst search = ref('')`);
    // O par prop + evento É o callback de mudança em Vue; um `@update:` solto
    // ao lado do `v-model` ensinaria a registrar a mudança duas vezes.
    expect(output).not.toContain('@update:');
  });
});
