import { describe, expect, it } from 'vitest';
import {
  comboboxControlledSource,
  comboboxCustomFilterSource,
  comboboxDisabledSource,
  comboboxEmptySource,
  comboboxGroupedSource,
  comboboxInvalidSource,
  comboboxMultipleSource,
  comboboxOpenSource,
  comboboxSingleLineChipsSource,
  comboboxSource,
} from './combobox.source';

// ─── Ferramentas de leitura do snippet ────────────────────────────────────────

const END_SCRIPT = '</' + 'script>';

/** O bloco `<script>` e a marcação, separados. */
function split(output: string): { script: string; markup: string } {
  const end = output.indexOf(END_SCRIPT);
  return { script: output.slice(0, end), markup: output.slice(end + END_SCRIPT.length) };
}

/** Nomes importados de `@/components/ui/combobox`, sem o `type`. */
function imported(output: string): string[] {
  const block = /import \{([^}]*)\} from "@\/components\/ui\/combobox";/.exec(output)?.[1] ?? '';
  return block
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
}

/** Os valores das opções declaradas, na ordem em que aparecem. */
function optionValues(output: string): string[] {
  return [...split(output).script.matchAll(/value: "([^"]+)"/g)].map((m) => m[1]!);
}

/** Os escolhidos iniciais do modo múltiplo. */
function initialValues(output: string): string[] {
  const list = /let value = \$state<string\[\]>\(\[([^\]]*)\]\);/.exec(output)?.[1] ?? '';
  return [...list.matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
}

// As listas de cada story, como elas estão em `combobox*.stories.ts`. O snippet
// publica a mesma: copiar o código e ver outra lista na tela é o descompasso
// que este arquivo existe para barrar.
const STORY_COUNTRIES = ['brasil', 'argentina', 'chile', 'portugal'];
const STORY_ALL_COUNTRIES = [
  'brasil', 'argentina', 'chile', 'colombia', 'mexico', 'peru', 'portugal', 'espanha', 'uruguai',
];
const STORY_VISITED = ['brasil', 'argentina', 'chile', 'colombia', 'mexico', 'portugal', 'uruguai'];
const STORY_COMPOSITION = ['brasil', 'argentina', 'chile', 'portugal', 'uruguai'];
const STORY_GROCERIES = ['maca', 'banana', 'laranja', 'cenoura', 'batata', 'abobrinha'];

const ALL = {
  comboboxSource: () => comboboxSource(),
  comboboxSourceMultiple: () => comboboxSource('', { args: { multiple: true } }),
  comboboxOpenSource,
  comboboxEmptySource,
  comboboxMultipleSource,
  comboboxGroupedSource,
  comboboxSingleLineChipsSource,
  comboboxCustomFilterSource,
  comboboxControlledSource,
  comboboxDisabledSource,
  comboboxInvalidSource,
};

// ─── Playground ───────────────────────────────────────────────────────────────

describe('comboboxSource', () => {
  it('sem args, não escreve nenhum valor padrão da raiz', () => {
    const output = comboboxSource();
    expect(output).toContain('<Combobox {items} bind:value>');
    for (const noise of ['multiple', 'chipsLayout', 'disabled', 'invalid', 'name=']) {
      expect(output).not.toContain(noise);
    }
  });

  it('os controls no valor padrão entregam o mesmo snippet que nenhum control', () => {
    expect(
      comboboxSource('', {
        args: { multiple: false, chipsLayout: 'wrap', disabled: false, invalid: false },
      }),
    ).toBe(comboboxSource());
  });

  it('acompanha os controls de texto e de estado', () => {
    const output = comboboxSource('', {
      args: { label: 'Cidade', placeholder: 'Buscar cidade', name: 'cidade', disabled: true, invalid: true },
    });
    expect(output).toContain('<Combobox {items} bind:value disabled invalid name="cidade">');
    expect(output).toContain('<ComboboxLabel>Cidade</ComboboxLabel>');
    expect(output).toContain('<ComboboxInput placeholder="Buscar cidade" />');
  });

  it('no modo múltiplo, a escolha vira lista e os chips entram com o campo DENTRO da caixa', () => {
    const output = comboboxSource('', { args: { multiple: true } });
    expect(output).toContain('let value = $state<string[]>([]);');
    expect(output).toContain('<Combobox {items} bind:value multiple>');
    // O campo mora dentro da caixa de chips: como irmão dela, limpar e gatilho
    // cairiam de linha quando os chips enchessem a primeira.
    expect(output).toMatch(/<ComboboxChips>[\s\S]*<ComboboxInput [^>]*\/>\s*<\/ComboboxChips>/);
    expect(imported(output)).toEqual(expect.arrayContaining(['ComboboxChip', 'ComboboxChipRemove', 'ComboboxChips']));
  });

  it('o modo de chips acompanha o control, mas só onde há chip', () => {
    expect(comboboxSource('', { args: { multiple: true, chipsLayout: 'single-line' } })).toContain(
      '<Combobox {items} bind:value multiple chipsLayout="single-line">',
    );
    // Sem chip, o modo não desenha nada: escrevê-lo ensina uma prop sem efeito.
    expect(comboboxSource('', { args: { chipsLayout: 'single-line' } })).not.toContain('chipsLayout');
  });

  it('publica a lista inteira que o Playground mostra', () => {
    expect(optionValues(comboboxSource())).toEqual(STORY_ALL_COUNTRIES);
  });
});

// ─── Variantes ────────────────────────────────────────────────────────────────

describe('transforms das stories de variação', () => {
  it('a lista aberta, na íntegra: a composição de escolha única e nada além', () => {
    expect(comboboxOpenSource()).toBe(
      `<script lang="ts">
  import {
    Combobox,
    ComboboxClear,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxInputWrapper,
    ComboboxItem,
    ComboboxLabel,
    ComboboxList,
    ComboboxPopup,
    ComboboxPositioner,
    ComboboxTrigger,
  } from "@/components/ui/combobox";

  const items = [
    { value: "brasil", label: "Brasil" },
    { value: "argentina", label: "Argentina" },
    { value: "chile", label: "Chile" },
    { value: "portugal", label: "Portugal" },
  ];

  let value = $state("");
${END_SCRIPT}

<Combobox {items} bind:value>
  <ComboboxLabel>País</ComboboxLabel>
  <ComboboxInputWrapper>
    <ComboboxInput placeholder="Buscar país" />
    <ComboboxClear aria-label="Limpar" />
    <ComboboxTrigger aria-label="Abrir lista" />
  </ComboboxInputWrapper>
  <ComboboxPositioner>
    <ComboboxPopup>
      <ComboboxList>
        {#each items as item (item.value)}
          <ComboboxItem value={item.value} label={item.label} />
        {/each}
      </ComboboxList>
      <ComboboxEmpty>Nenhum resultado</ComboboxEmpty>
    </ComboboxPopup>
  </ComboboxPositioner>
</Combobox>`,
    );
  });

  it('a múltipla já nasce com os dois chips que a story mostra, da lista inteira', () => {
    const output = comboboxMultipleSource();
    expect(initialValues(output)).toEqual(['brasil', 'argentina']);
    expect(optionValues(output)).toEqual(STORY_ALL_COUNTRIES);
    expect(output).toContain('<Combobox {items} bind:value multiple name="paises">');
    expect(output).toContain('<ComboboxLabel>Países</ComboboxLabel>');
    expect(output).toContain('<ComboboxInput placeholder="Adicionar país" />');
    // Chips em linhas é o padrão do campo: a story o fixa, o snippet o omite.
    expect(output).not.toContain('chipsLayout');
  });

  it('a linha única declara o modo e nasce com os seis que transbordam', () => {
    const output = comboboxSingleLineChipsSource();
    expect(output).toContain('<Combobox {items} bind:value multiple chipsLayout="single-line" name="visitados">');
    expect(optionValues(output)).toEqual(STORY_VISITED);
    expect(initialValues(output)).toEqual(['brasil', 'argentina', 'chile', 'colombia', 'mexico', 'portugal']);
    // A classe que estreita o campo é andaime da story, para o transbordo
    // acontecer em qualquer tela — não é parte do que se ensina.
    expect(output).not.toContain('nds-w-sm');
  });

  it('a lista agrupada esconde o grupo que ficou sem opção, pela mesma conta da peça', () => {
    const output = comboboxGroupedSource();
    expect(optionValues(output)).toEqual(STORY_GROCERIES);
    expect(output).toContain('group.options.map((option) => ({ ...option, group: group.label }))');
    // Cada opção se esconde sozinha, mas o cabeçalho não: iterar `groups` direto
    // deixaria "Legumes" na tela sem nenhuma opção embaixo ao digitar "ban".
    expect(output).toContain('let inputValue = $state("");');
    expect(output).toContain('groups.filter((group) => filterItems(group.options, inputValue).length > 0)');
    expect(output).toContain('<Combobox {items} bind:value bind:inputValue>');
    expect(output).toContain('{#each visibleGroups as group, index (group.label)}');
    expect(output).toContain('{#if index < visibleGroups.length - 1}');
    expect(split(output).markup).not.toContain('{#each groups');
    expect(imported(output)).toEqual(
      expect.arrayContaining(['ComboboxGroup', 'ComboboxGroupLabel', 'ComboboxSeparator', 'filterItems']),
    );
  });
});

// ─── Estados ──────────────────────────────────────────────────────────────────

describe('transforms das stories de estado', () => {
  it('indisponível e reprovado escrevem só a própria flag na raiz', () => {
    expect(comboboxDisabledSource()).toContain('<Combobox {items} bind:value disabled>');
    expect(comboboxInvalidSource()).toContain('<Combobox {items} bind:value invalid>');
    expect(comboboxDisabledSource()).not.toContain('invalid');
    expect(comboboxInvalidSource()).not.toContain('disabled');
  });

  it('o vazio e a lista aberta não mudam a composição — só o estado na tela', () => {
    expect(comboboxEmptySource()).toBe(comboboxOpenSource());
    for (const output of [comboboxOpenSource(), comboboxDisabledSource(), comboboxInvalidSource()]) {
      expect(optionValues(output)).toEqual(STORY_COUNTRIES);
    }
  });
});

// ─── Composições ──────────────────────────────────────────────────────────────

describe('transforms das stories de composição', () => {
  it('o filtro próprio casa pelo início do rótulo, sem acento e sem caixa, como a story', () => {
    const output = comboboxCustomFilterSource();
    expect(output).toContain(`const filter: ComboboxFilter = (item, query) =>
    normalizeText(item.label).startsWith(normalizeText(query.trim()));`);
    expect(output).toContain('<Combobox {items} bind:value {filter}>');
    expect(imported(output)).toEqual(expect.arrayContaining(['normalizeText', 'type ComboboxFilter']));
    // `toLowerCase` perderia a comparação sem acento que o filtro padrão já faz.
    expect(output).not.toContain('toLowerCase');
    // "Uruguai" é o que torna a diferença demonstrável: o padrão o acha por
    // "guai", e a regra própria não.
    expect(optionValues(output)).toEqual(STORY_COMPOSITION);
  });

  it('o controlado liga escolha E texto de busca, sem o andaime dos botões de fora', () => {
    const output = comboboxControlledSource();
    expect(output).toContain('let value = $state("");\n  let inputValue = $state("");');
    expect(output).toContain('<Combobox {items} bind:value bind:inputValue>');
    expect(optionValues(output)).toEqual(STORY_COMPOSITION);
    expect(output).not.toContain('Button');
    expect(output).not.toContain('nds-w-sm');
  });
});

// ─── Regras que valem para todo snippet ───────────────────────────────────────

describe('todo snippet do Combobox', () => {
  it.each(Object.entries(ALL))('%s importa exatamente as peças que usa', (_name, build) => {
    const output = build();
    const { script, markup } = split(output);
    const names = imported(output);

    const tags = new Set([...markup.matchAll(/<(Combobox[A-Za-z]*)\b/g)].map((m) => m[1]!));
    const components = names.filter((name) => /^Combobox/.test(name));
    expect(new Set(components)).toEqual(tags);

    // Função e tipo entram na importação só quando o corpo do script os usa.
    const body = script.slice(script.indexOf('from "@/components/ui/combobox";'));
    for (const helper of ['filterItems', 'normalizeText']) {
      expect(names.includes(helper)).toBe(body.includes(`${helper}(`));
    }
    expect(names.includes('type ComboboxFilter')).toBe(body.includes(': ComboboxFilter'));
  });

  it.each(Object.entries(ALL))('%s declara tudo o que a marcação liga', (_name, build) => {
    const { script, markup } = split(build());
    const used = new Set<string>();
    for (const m of markup.matchAll(/\{#each ([A-Za-z]+)[\s.]/g)) used.add(m[1]!);
    for (const m of markup.matchAll(/bind:([A-Za-z]+)/g)) used.add(m[1]!);
    for (const m of markup.matchAll(/ \{([A-Za-z]+)\}/g)) used.add(m[1]!);
    // O `each` interno percorre um campo do grupo, não uma constante.
    used.delete('group');
    for (const name of used) {
      expect(script).toMatch(new RegExp(`(?:const|let) ${name}\\b`));
    }
  });

  it.each(Object.entries(ALL))('%s não vaza nome do andaime das stories', (_name, build) => {
    const output = build();
    for (const scaffold of [
      'ComboboxStory',
      'ComboboxControlledStory',
      'selection',
      'startOfLabel',
      'outsideChoice',
      'FromOutside',
      'emptyMessage',
      'clearLabel',
      'triggerLabel',
      'removeLabel',
      'className',
      'defaultFilter',
      'untrack',
      '{#key',
      'data-testid',
      './index',
    ]) {
      expect(output).not.toContain(scaffold);
    }
  });

  it.each(Object.entries(ALL))('%s só escolhe de início o que está na lista', (_name, build) => {
    const output = build();
    const options = optionValues(output);
    for (const chosen of initialValues(output)) {
      expect(options).toContain(chosen);
    }
  });
});
