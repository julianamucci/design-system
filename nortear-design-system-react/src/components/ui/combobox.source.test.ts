import { describe, expect, it } from 'vitest';
import {
  comboboxControlledSource,
  comboboxCustomFilterSource,
  comboboxDisabledSource,
  comboboxEmptySource,
  comboboxGroupedSource,
  comboboxInFormSource,
  comboboxInvalidSource,
  comboboxMultipleSource,
  comboboxSingleLineChipsSource,
  comboboxSource,
} from './combobox.source';

/**
 * Fonte crua das stories e do módulo de fixtures — para cobrar que cada snippet
 * publica o que a story AO LADO desenha, e não um exemplo vizinho.
 */
const raw = import.meta.glob<string>('./combobox*.{stories,fixtures}.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function rawOf(file: string): string {
  const content = raw[`./${file}`];
  // Cobrado, e não pulado: glob que deixa de achar o arquivo encolhe a
  // verificação em silêncio.
  expect(content, `${file} não foi alcançado pela leitura crua`).toBeDefined();
  return content!;
}

/** Os construtores chamáveis sem argumento — todos os que o painel usa. */
const ALL = {
  comboboxSource: () => comboboxSource(),
  comboboxMultipleSource,
  comboboxSingleLineChipsSource,
  comboboxGroupedSource,
  comboboxEmptySource,
  comboboxDisabledSource,
  comboboxInvalidSource,
  comboboxCustomFilterSource,
  comboboxControlledSource,
  comboboxInFormSource,
};

/** Nomes do bloco `import { … } from "@/components/ui/combobox"`. */
function importedParts(snippet: string): string[] {
  const block = snippet.match(/import \{([^}]*)\} from "@\/components\/ui\/combobox";/);
  expect(block, 'o snippet não importa do design system').not.toBeNull();
  return block![1]
    .split(',')
    .map((part) => part.trim().replace(/^type\s+/, ''))
    .filter(Boolean);
}

describe('todos os snippets', () => {
  it('importam do design system, e nunca da lib headless', () => {
    for (const [name, build] of Object.entries(ALL)) {
      const output = build();
      expect(output, name).toContain('} from "@/components/ui/combobox";');
      expect(output, name).not.toContain('@base-ui');
    }
  });

  it('importam exatamente as peças que usam', () => {
    // Peça importada e não usada é import morto no lint de quem copia; peça
    // usada e não importada é snippet que não compila.
    for (const [name, build] of Object.entries(ALL)) {
      const output = build();
      const imported = importedParts(output);
      const used = new Set(
        [...output.matchAll(/<(Combobox[A-Za-z]*)\b/g)].map(([, tag]) => tag),
      );
      for (const part of imported.filter((p) => p.startsWith('Combobox'))) {
        // `ComboboxValue` é tipo: aparece em anotação, não em tag.
        if (part === 'ComboboxValue') {
          expect(output, name).toContain('useState<ComboboxValue>');
          continue;
        }
        expect(used.has(part), `${name} importa ${part} e não o usa`).toBe(true);
      }
      for (const tag of used) {
        expect(imported, `${name} usa <${tag}> sem importar`).toContain(tag);
      }
    }
  });

  it('declaram os próprios dados, sem vazar o andaime das stories', () => {
    // COUNTRIES, INGREDIENTS e as constantes de rótulo moram no módulo de
    // fixtures, que quem copia não tem.
    for (const [name, build] of Object.entries(ALL)) {
      const output = build();
      expect(output, name).not.toMatch(
        /\b(COUNTRIES|INGREDIENTS|CLEAR_LABEL|OPEN_LABEL|EMPTY_MESSAGE|REMOVE_PREFIX|ComboboxFrame|fixtures)\b/,
      );
      expect(output, name).not.toMatch(
        /\b(SingleCountryCombobox|MultiCountryCombobox|OverflowingChipsCombobox|GroupedIngredientCombobox|StartsWithCountryCombobox|ControlledCountryCombobox|SubmittedCountryForm)\b/,
      );
      // O quadro da lista portalizada é do Storybook, não do campo.
      expect(output, name).not.toContain('contain:');
      expect(output, name).not.toContain('nds-min-h-');
    }
  });

  it('usam o vocabulário das fixtures: mesma lista, mesmos nomes acessíveis', () => {
    // Divergir aqui é o que faz o painel ensinar um campo que a prévia não tem.
    const fixtures = rawOf('combobox.fixtures.tsx');
    expect(fixtures).toContain('export const CLEAR_LABEL = "Limpar"');
    expect(fixtures).toContain('export const OPEN_LABEL = "Abrir lista"');
    expect(fixtures).toContain('export const EMPTY_MESSAGE = "Nenhum resultado"');
    for (const [name, build] of Object.entries(ALL)) {
      const output = build();
      expect(output, name).toContain('<ComboboxClear aria-label="Limpar" />');
      expect(output, name).toContain('<ComboboxTrigger aria-label="Abrir lista" />');
      expect(output, name).toContain('emptyMessage="Nenhum resultado"');
    }
    for (const [value, label] of [['brasil', 'Brasil'], ['colombia', 'Colômbia'], ['uruguai', 'Uruguai']]) {
      expect(fixtures).toContain(`{ value: "${value}", label: "${label}" }`);
      expect(comboboxSource()).toContain(`{ value: "${value}", label: "${label}" }`);
    }
  });

  it('nenhum exemplo trava a altura do campo', () => {
    // WCAG 1.4.4: a caixa cresce com a fonte do navegador.
    for (const [name, build] of Object.entries(ALL)) {
      expect(build(), name).not.toMatch(/\bheight\b/);
    }
  });
});

describe('comboboxSource — o Playground', () => {
  it('sem args, publica o campo único canônico e omite todo padrão', () => {
    const output = comboboxSource();
    expect(output).toContain('<Combobox items={PAISES}>');
    expect(output).toContain('<ComboboxLabel>País</ComboboxLabel>');
    expect(output).toContain('<ComboboxInput placeholder="Buscar país" />');
    // Padrões do componente não entram: `multiple`, `disabled`, `aria-invalid`,
    // `chipsLayout="wrap"` só ensinariam ruído.
    expect(output).not.toContain('multiple');
    expect(output).not.toContain('disabled');
    expect(output).not.toContain('aria-invalid');
    expect(output).not.toContain('chipsLayout');
    expect(output).not.toContain('ComboboxChip');
  });

  it('com os args padrão do meta, só o nome difere do padrão do componente', () => {
    const output = comboboxSource(undefined, {
      args: {
        label: 'País',
        placeholder: 'Buscar país',
        multiple: false,
        chipsLayout: 'wrap',
        disabled: false,
        invalid: false,
        name: 'pais',
      },
    });
    expect(output).toContain('<Combobox items={PAISES} name="pais">');
    expect(output).not.toContain('disabled');
    expect(output).not.toContain('aria-invalid');
    expect(output).not.toContain('chipsLayout');
  });

  it('acompanha rótulo e dica dos controls', () => {
    const output = comboboxSource(undefined, {
      args: { label: 'Destino', placeholder: 'Buscar destino' },
    });
    expect(output).toContain('<ComboboxLabel>Destino</ComboboxLabel>');
    expect(output).toContain('<ComboboxInput placeholder="Buscar destino" />');
    expect(output).not.toContain('Buscar país');
  });

  it('desabilitado vai à raiz E à caixa, como a story monta', () => {
    const output = comboboxSource(undefined, { args: { disabled: true } });
    expect(output).toContain('<Combobox items={PAISES} disabled>');
    expect(output).toContain('<ComboboxInputWrapper disabled>');
  });

  it('inválido marca o campo de texto, que é quem a folha lê', () => {
    const output = comboboxSource(undefined, { args: { invalid: true } });
    expect(output).toContain('<ComboboxInput placeholder="Buscar país" aria-invalid="true" />');
  });

  it('no modo múltiplo leva rótulo, dica, nome, estado e forma dos chips', () => {
    // O Playground passa os MESMOS controls ao campo múltiplo; o snippet
    // publicava o múltiplo fixo e deixava todos para trás.
    const output = comboboxSource(undefined, {
      args: {
        multiple: true,
        chipsLayout: 'single-line',
        label: 'País',
        placeholder: 'Buscar país',
        name: 'pais',
        disabled: true,
        invalid: true,
      },
    });
    expect(output).toContain('  multiple\n  chipsLayout="single-line"\n  items={PAISES}\n  name="pais"\n  disabled\n');
    expect(output).toContain('<ComboboxLabel>País</ComboboxLabel>');
    expect(output).toContain('<ComboboxInputWrapper disabled>');
    expect(output).toContain('<ComboboxInput placeholder="Buscar país" aria-invalid="true" />');
  });

  it('a forma padrão dos chips não entra no snippet', () => {
    const output = comboboxSource(undefined, { args: { multiple: true, chipsLayout: 'wrap' } });
    expect(output).toContain('multiple');
    expect(output).not.toContain('chipsLayout');
  });

  it('control adulterado não vira atributo inventado', () => {
    const output = comboboxSource(undefined, {
      args: { multiple: true, chipsLayout: 'grade' as never },
    });
    expect(output).not.toContain('chipsLayout');
  });

  it('rótulo com chave ou sinal de tag vai como string, sem quebrar o JSX', () => {
    const output = comboboxSource(undefined, { args: { label: 'País {x} <b>' } });
    expect(output).toContain('<ComboboxLabel>{"País {x} <b>"}</ComboboxLabel>');
  });

  it('o espião do control não vira código', () => {
    const spy = (() => 'CORPO_DO_MOCK') as never;
    const output = comboboxSource(undefined, {
      args: { label: spy, placeholder: spy, name: spy },
    });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).toContain('<ComboboxLabel>País</ComboboxLabel>');
    expect(output).not.toContain('onValueChange');
  });
});

describe('variantes', () => {
  it('o múltiplo publica a escolha inicial e o rótulo que a story mostra', () => {
    // A fixture parte de `[COUNTRIES[0], COUNTRIES[1]]`, com "Países" e
    // "Adicionar país".
    const fixtures = rawOf('combobox.fixtures.tsx');
    expect(fixtures).toContain('label = "Países"');
    expect(fixtures).toContain('placeholder = "Adicionar país"');
    const output = comboboxMultipleSource();
    expect(output).toContain('useState([PAISES[0], PAISES[1]])');
    expect(output).toContain('<ComboboxLabel>Países</ComboboxLabel>');
    expect(output).toContain('<ComboboxInput placeholder="Adicionar país" />');
    expect(output).not.toContain('chipsLayout');
  });

  it('o múltiplo só guarda LISTA no estado, que é o que compila ao colar', () => {
    // O valor tem o mesmo tipo nos dois modos; `setEscolhidos(valor)` direto
    // não compila, porque o valor pode ser uma opção só ou nulo.
    const output = comboboxMultipleSource();
    expect(output).toContain('onValueChange={(valor) => setEscolhidos(Array.isArray(valor) ? valor : [])}');
    expect(output).toContain('import { useState } from "react";');
  });

  it('cada chip tem botão de remover com nome próprio', () => {
    expect(comboboxMultipleSource()).toContain('<ComboboxChipRemove aria-label={"Remover " + pais.label} />');
  });

  it('a linha única de chips publica a forma e os SEIS escolhidos da story', () => {
    const stories = rawOf('combobox-variants.stories.tsx');
    expect(stories).toContain('<OverflowingChipsCombobox chipsLayout="single-line" />');
    expect(stories).toContain('source: { transform: comboboxSingleLineChipsSource }');
    expect(rawOf('combobox.fixtures.tsx')).toContain('COUNTRIES.slice(0, 6)');

    const output = comboboxSingleLineChipsSource();
    expect(output).toContain('chipsLayout="single-line"');
    expect(output).toContain('useState(PAISES.slice(0, 6))');
    expect(output).toContain('<ComboboxLabel>Países visitados</ComboboxLabel>');
    // A caixa estreita é andaime da prévia.
    expect(output).not.toContain('nds-w-xs');
  });

  it('o agrupado itera grupos, e cada grupo declara o seu cabeçalho', () => {
    const output = comboboxGroupedSource();
    expect(output).toContain('<Combobox items={INGREDIENTES}>');
    expect(output).toContain('<ComboboxGroup key={grupo.value} items={grupo.items}>');
    expect(output).toContain('<ComboboxGroupLabel>{grupo.value}</ComboboxGroupLabel>');
    expect(importedParts(output)).toEqual(expect.arrayContaining(['ComboboxGroup', 'ComboboxGroupLabel']));
  });
});

describe('estados', () => {
  it('lista vazia publica a mensagem, que é o assunto da story', () => {
    expect(comboboxEmptySource()).toContain('<ComboboxContent emptyMessage="Nenhum resultado">');
  });

  it('desabilitado espelha a story: raiz e caixa, e nada mais', () => {
    expect(rawOf('combobox-states.stories.tsx')).toContain('<SingleCountryCombobox disabled />');
    const output = comboboxDisabledSource();
    expect(output).toContain('<Combobox items={PAISES} disabled>');
    expect(output).toContain('<ComboboxInputWrapper disabled>');
    expect(output).not.toContain('aria-invalid');
  });

  it('inválido publica o campo com o atributo, como a story — e sem parágrafo solto', () => {
    // O parágrafo de erro que o snippet acrescentava não existe na story, e
    // nem era ligado ao campo por `aria-describedby`.
    expect(rawOf('combobox-states.stories.tsx')).toContain('<SingleCountryCombobox invalid />');
    const output = comboboxInvalidSource();
    expect(output).toContain('<ComboboxInput placeholder="Buscar país" aria-invalid="true" />');
    expect(output).not.toContain('<p');
    expect(output).not.toContain('disabled');
  });
});

describe('composições', () => {
  it('o formulário leva o nome do campo, que é o que viaja no envio', () => {
    const output = comboboxInFormSource();
    expect(output).toContain('<Combobox items={PAISES} name="pais">');
    expect(output).toContain('<Button type="submit">Continuar</Button>');
    expect(output).toContain('import { Button } from "@/components/ui/button";');
    // O "Enviado:" da story é a superfície que a play lê.
    expect(output).not.toContain('Enviado');
  });

  it('o filtro do consumidor é o que a story entrega, e não o campo de fábrica', () => {
    // Até 2026-09-10 esta story herdava a transform do `meta` e publicava o
    // campo único sem filtro nenhum.
    const stories = rawOf('combobox-compositions.stories.tsx');
    expect(stories).toContain('filter={startsWithFilter}');
    expect(stories).toContain('source: { transform: comboboxCustomFilterSource }');

    const output = comboboxCustomFilterSource();
    expect(output).toContain('<Combobox items={PAISES} name="pais" filter={comecaCom}>');
    expect(output).toContain('function comecaCom(item: { label: string }, busca: string)');
    expect(output).toContain('semAcento(item.label).startsWith(semAcento(busca))');
    // O escape do template literal chega inteiro ao leitor.
    expect(output).toContain('.replace(/\\p{Diacritic}/gu, "")');
    // O nome interno da story não vaza.
    expect(output).not.toContain('startsWithFilter');
    expect(output).not.toContain('normalize(item');
  });

  it('o controlado liga as duas pontas e mostra quem escreve de fora', () => {
    const stories = rawOf('combobox-compositions.stories.tsx');
    expect(stories).toContain('source: { transform: comboboxControlledSource }');
    expect(stories).toContain('Preencher a busca');
    expect(stories).toContain('const EXTERNAL_QUERY = "por"');

    const output = comboboxControlledSource();
    expect(output).toContain('const [escolhido, setEscolhido] = useState<ComboboxValue>(null);');
    expect(output).toContain('const [busca, setBusca] = useState("");');
    expect(output).toContain('value={escolhido}');
    expect(output).toContain('onValueChange={setEscolhido}');
    expect(output).toContain('inputValue={busca}');
    expect(output).toContain('onInputValueChange={setBusca}');
    expect(output).toContain('onClick={() => setBusca("por")}');
    expect(output).toContain('Escolher Chile');
    // O controlado NÃO mistura o caminho não controlado.
    expect(output).not.toContain('defaultValue');
    expect(output).not.toContain('EXTERNAL_');
  });
});

describe('fiação das stories', () => {
  it('toda story com desenho próprio declara a própria transform', () => {
    // A transform do `meta` publica o campo único. Story que desenha outra
    // coisa e não declara a sua ensina, no painel, o exemplo vizinho.
    const expected: Array<[string, string]> = [
      ['combobox-variants.stories.tsx', 'comboboxMultipleSource'],
      ['combobox-variants.stories.tsx', 'comboboxSingleLineChipsSource'],
      ['combobox-variants.stories.tsx', 'comboboxGroupedSource'],
      ['combobox-states.stories.tsx', 'comboboxEmptySource'],
      ['combobox-states.stories.tsx', 'comboboxDisabledSource'],
      ['combobox-states.stories.tsx', 'comboboxInvalidSource'],
      ['combobox-compositions.stories.tsx', 'comboboxInFormSource'],
      ['combobox-compositions.stories.tsx', 'comboboxCustomFilterSource'],
      ['combobox-compositions.stories.tsx', 'comboboxControlledSource'],
    ];
    for (const [file, transform] of expected) {
      expect(rawOf(file), `${file} não liga ${transform}`).toContain(`transform: ${transform} }`);
    }
  });
});
