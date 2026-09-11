import { describe, expect, it } from 'vitest';
import * as comboboxSourceModule from './combobox.source';
import {
  comboboxControlledSnippet,
  comboboxCustomFilterSnippet,
  comboboxSnippet,
  comboboxSource,
} from './combobox.source';

/**
 * A ausência deste arquivo era o `source_sem_teste` do auditor.
 *
 * O painel Code imprime o `template` da story literalmente — com o `@for` que
 * monta as opções e o `[value]` ligado a um armazém de módulo — e essa saída NÃO
 * chega ao DOM durante a `play`: nenhuma suíte de navegador a alcança. O
 * `transform` devolve o uso real, e é aqui que ele tem guarda.
 *
 * A varredura genérica do `source-snippets.test.ts` chama cada construtor UMA
 * vez, sem argumento, e prova que o snippet importa o que usa e liga só o que a
 * classe declara. O que ela NÃO pode provar é o que este arquivo cobra: omitir o
 * valor padrão, bater com a story ao lado, e compilar em TODOS os ramos — o ramo
 * múltiplo, que ela nunca chama, lia `this.items` numa classe que não o
 * declarava.
 */

// ─── A story ao lado, lida como texto ─────────────────────────────────────────
//
// As aspas DENTRO das expressões regulares deste arquivo vão por escape hexa
// (x22 e x27), e não literais: o portão `identificador_pt_novo` descasca literal de
// texto por PAREAMENTO de aspas antes de contar, e não descasca regex — uma aspa
// ímpar num regex inverte o pareamento, e texto de mensagem passa a contar como
// código.
//
// Lida como TEXTO, e não importada: o arquivo de story importa o componente
// Angular, e importá-lo fora do compilador quebra. A pergunta aqui não precisa de
// execução — é sobre o que a story renderiza, e isso está escrito nela.

const storyFiles = import.meta.glob<string>('./combobox*.stories.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function storyFile(name: string): string {
  const text = storyFiles[`./${name}`];
  // Reprova em vez de sair calado: arquivo renomeado tiraria a story da
  // comparação sem uma palavra, com a suíte verde medindo menos.
  expect(text, `${name} não chegou à leitura — o arquivo mudou de nome?`).toBeTypeOf('string');
  return text!;
}

/** O bloco de uma story — do `export const` dela até o próximo, ou o fim. */
function storyBlock(file: string, story: string): string {
  const text = storyFile(file);
  const start = text.indexOf(`export const ${story}: Story`);
  expect(start, `${file}: a story ${story} não existe mais`).toBeGreaterThan(-1);
  const next = text.indexOf('\nexport const ', start + 1);
  return text.slice(start, next === -1 ? undefined : next);
}

type Option = { value: string; label: string };

/** As opções de uma constante de lista da story: `{ value: '…', label: '…' }`. */
function storyOptions(file: string, constant: string): Option[] {
  const text = storyFile(file);
  const body = new RegExp(`const ${constant} = \\[([\\s\\S]*?)\\] as const;`).exec(text)?.[1];
  expect(body, `${file}: a constante ${constant} não existe mais`).toBeTypeOf('string');
  return [...body!.matchAll(/\{ value: \x27([^\x27]+)\x27, label: \x27([^\x27]+)\x27 \}/g)].map((m) => ({
    value: m[1]!,
    label: m[2]!,
  }));
}

/** Os grupos da story agrupada: nome do cabeçalho e opções, na ordem. */
function storyGroups(file: string, constant: string): { name: string; options: Option[] }[] {
  const text = storyFile(file);
  const body = new RegExp(`const ${constant} = \\[([\\s\\S]*?)\\] as const;`).exec(text)?.[1];
  expect(body, `${file}: a constante ${constant} não existe mais`).toBeTypeOf('string');
  return [...body!.matchAll(/name: \x27([^\x27]+)\x27,\s*items: \[([\s\S]*?)\]/g)].map((m) => ({
    name: m[1]!,
    options: [...m[2]!.matchAll(/\{ value: \x27([^\x27]+)\x27, label: \x27([^\x27]+)\x27 \}/g)].map((o) => ({
      value: o[1]!,
      label: o[2]!,
    })),
  }));
}

// ─── O snippet, lido como texto ───────────────────────────────────────────────

/** As opções que o snippet escreve, com o valor e o rótulo de cada uma. */
function snippetOptions(code: string): Option[] {
  return [...code.matchAll(/<div ndsComboboxItem value=\x22([^\x22]+)\x22>\n\s*([^\n]+)\n/g)].map((m) => ({
    value: m[1]!,
    label: m[2]!.trim(),
  }));
}

/** A tag de abertura da raiz — de `<nds-combobox` até o primeiro `>`. */
function rootTag(code: string): string {
  const tag = /<nds-combobox\b([^>]*)>/.exec(code)?.[1];
  expect(tag, 'o snippet não tem raiz <nds-combobox>').toBeTypeOf('string');
  return tag!;
}

/** Atributo SEM valor na raiz — `multiple`, `disabled`, `invalid`. */
function hasBareAttribute(tag: string, name: string): boolean {
  return new RegExp(`(?:^|\\s)${name}(?=\\s|$)`).test(tag);
}

/** O corpo da classe do exemplo. */
function classBody(code: string): string {
  const body = /export class Example \{\n([\s\S]*?)\n\}$/.exec(code)?.[1];
  expect(body, 'o snippet não termina na classe do exemplo').toBeTypeOf('string');
  return body!;
}

// ─── Os construtores e a story que cada chamada serve ─────────────────────────

/** Os `args` do meta do Playground — o que o transform recebe sem control mexido. */
const PLAYGROUND_ARGS = {
  label: 'País',
  placeholder: 'Buscar país',
  disabled: false,
  invalid: false,
  name: 'pais',
};

/** Os `args` da story de múltipla escolha, que o transform dela repassa. */
const MULTIPLE_ARGS = {
  label: 'Países',
  placeholder: 'Adicionar país',
  multiple: true,
  name: 'paises',
};

/**
 * Cada story com painel Code, a chamada que o `transform` dela faz, e a
 * constante de lista que o `render` dela usa.
 *
 * A chamada é REPETIDA aqui, e não lida da story, porque avaliar o transform
 * exigiria importar a story. Por isso o caso logo abaixo confere a outra ponta:
 * o `transform` de cada story ainda chama o construtor que esta tabela diz.
 */
const CASES: Array<{
  file: string;
  story: string;
  /** Trecho do `transform` na story — a chamada que a tabela repete. */
  transform: string;
  /** A constante que o `render` da story itera. */
  list: string;
  build: () => string;
  /** Rótulo, placeholder e nome vêm de `args` na story, e não escritos no template. */
  argBound?: { label: string; placeholder: string; name: string };
}> = [
  {
    file: 'combobox.stories.ts',
    story: 'Playground',
    transform: 'source: { transform: comboboxSource }',
    list: 'COUNTRIES',
    build: () => comboboxSource('', { args: PLAYGROUND_ARGS }),
    argBound: PLAYGROUND_ARGS,
  },
  {
    file: 'combobox-variants.stories.ts',
    story: 'OpenWithActiveOption',
    transform: 'comboboxSnippet({ items:',
    list: 'COUNTRIES',
    build: () => comboboxSnippet({ items: ['Brasil', 'Argentina', 'Chile', 'Portugal'] }),
  },
  {
    file: 'combobox-variants.stories.ts',
    story: 'MultipleWithChips',
    transform: 'comboboxSource(',
    list: 'ALL_COUNTRIES',
    build: () => comboboxSource('', { args: MULTIPLE_ARGS }),
    argBound: MULTIPLE_ARGS,
  },
  {
    file: 'combobox-variants.stories.ts',
    story: 'SingleLineChips',
    transform: "chipsLayout: 'single-line'",
    list: 'ALL_COUNTRIES',
    build: () =>
      comboboxSnippet({
        label: 'Países visitados',
        placeholder: 'Adicionar país',
        multiple: true,
        name: 'paises',
        chipsLayout: 'single-line',
        items: [
          'Brasil', 'Argentina', 'Chile', 'Colômbia', 'México',
          'Peru', 'Portugal', 'Espanha', 'Uruguai',
        ],
      }),
  },
  {
    file: 'combobox-states.stories.ts',
    story: 'Disabled',
    transform: 'comboboxSnippet({ disabled: true })',
    list: 'COUNTRIES',
    build: () => comboboxSnippet({ disabled: true }),
  },
  {
    file: 'combobox-states.stories.ts',
    story: 'Invalid',
    transform: 'comboboxSnippet({ invalid: true })',
    list: 'COUNTRIES',
    build: () => comboboxSnippet({ invalid: true }),
  },
  {
    file: 'combobox-states.stories.ts',
    story: 'EmptyResult',
    transform: 'comboboxSnippet({})',
    list: 'COUNTRIES',
    build: () => comboboxSnippet({}),
  },
  {
    file: 'combobox-compositions.stories.ts',
    story: 'CustomFilter',
    transform: 'comboboxCustomFilterSnippet()',
    list: 'COUNTRIES',
    build: comboboxCustomFilterSnippet,
  },
  {
    file: 'combobox-compositions.stories.ts',
    story: 'Controlled',
    transform: 'comboboxControlledSnippet()',
    list: 'COUNTRIES',
    build: comboboxControlledSnippet,
  },
];

describe('cobertura', () => {
  it('todo construtor exportado pelo módulo entra na varredura', () => {
    // A lista é COBRADA: um construtor novo que não entre em `CASES` (ou na
    // story agrupada, que tem caso próprio lá embaixo) reprova em vez de sair
    // calado. É a lição do `source-snippets.test.ts` do Vue, onde 28 exports
    // saíram do alcance e a suíte seguiu verde medindo menos.
    const exported = Object.entries(comboboxSourceModule)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort();
    expect(exported).toEqual([
      'comboboxControlledSnippet',
      'comboboxCustomFilterSnippet',
      'comboboxSnippet',
      'comboboxSource',
    ]);
  });

  it('toda story com painel Code próprio tem caso aqui', () => {
    // A outra ponta da tabela: cada `source: { transform` das stories precisa
    // de um caso — ou da story agrupada, que tem o dela.
    const covered = new Set([...CASES.map((c) => `${c.file}#${c.story}`), 'combobox-variants.stories.ts#Grouped']);
    for (const [path, text] of Object.entries(storyFiles)) {
      const file = path.replace('./', '');
      for (const m of text.matchAll(/^export const (\w+): Story = \{/gm)) {
        const block = storyBlock(file, m[1]!);
        if (!block.includes('transform:') && file !== 'combobox.stories.ts') continue;
        expect(covered.has(`${file}#${m[1]}`), `${file}#${m[1]} tem painel Code e nenhum caso aqui`).toBe(true);
      }
    }
  });

  for (const { file, story, transform } of CASES) {
    it(`${story}: a story ainda chama o construtor que a tabela repete`, () => {
      // O Playground herda o transform do `meta`, e é ali que ele mora.
      const where = story === 'Playground' ? storyFile(file) : storyBlock(file, story);
      expect(where).toContain(transform);
    });
  }
});

// ─── O que vale para todo snippet ─────────────────────────────────────────────

describe('bate com a story ao lado', () => {
  for (const { file, story, list, build, argBound } of CASES) {
    describe(`${story} (${file})`, () => {
      const code = build();
      const block = storyBlock(file, story);

      it('publica o componente, não o andaime da story', () => {
        // O que só existe dentro da story: o armazém de módulo, o objeto de
        // args, o espião de output, os helpers do render e o laço sobre a
        // constante da story.
        expect(code).not.toContain('store.');
        expect(code).not.toContain('args.');
        expect(code).not.toContain('onChange(');
        expect(code).not.toContain('countryLabel');
        expect(code).not.toContain('external.');
        expect(code).not.toMatch(/@for \(item of items/);
        expect(code).not.toContain('data-testid');
        // O primitivo escreve `data-slot` em runtime, e no Angular o host
        // binding apaga o atributo estático: nomear peça por ele no snippet
        // ensinaria algo que não funciona.
        expect(code).not.toContain('data-slot=');
        expect(code).not.toContain('style=');
        // A lib headless por baixo não é API do design system.
        expect(code).not.toContain('@radix-ng');
      });

      it('importa do design system e declara o que usa', () => {
        expect(code).toContain("import { NDS_COMBOBOX } from '@/components/ui/combobox';");
        expect(code).toContain('imports: [...NDS_COMBOBOX],');
        // Todo `this.x` do corpo da classe precisa ser membro declarado — foi
        // assim que o ramo múltiplo publicava um `labelOf` que não compilava.
        const body = classBody(code);
        for (const m of body.matchAll(/this\.(\w+)/g)) {
          expect(body, `this.${m[1]} sem declaração na classe`).toMatch(
            new RegExp(`^\\s*(?:readonly\\s+)?${m[1]}\\s*[=(]`, 'm'),
          );
        }
      });

      it('escreve a composição inteira, na ordem do componente', () => {
        const order = [
          '<nds-combobox',
          '<label ndsComboboxLabel>',
          '<div ndsComboboxInputWrapper>',
          '<input ndsComboboxInput ',
          '<button ndsComboboxClear aria-label="Limpar"></button>',
          '<button ndsComboboxTrigger aria-label="Abrir lista">',
          '<svg ndsComboboxIcon></svg>',
          '<ng-template ndsComboboxPopup>',
          '<div ndsComboboxList>',
          '<div ndsComboboxEmpty>Nenhum resultado</div>',
          '</nds-combobox>',
        ];
        let cursor = -1;
        for (const piece of order) {
          const at = code.indexOf(piece, cursor + 1);
          expect(at, `"${piece}" fora de ordem ou ausente`).toBeGreaterThan(cursor);
          cursor = at;
        }
        // Uma raiz por snippet, e cada opção com a marca de escolhido.
        expect(code.match(/<nds-combobox\b/g)).toHaveLength(1);
        expect(code.match(/<div ndsComboboxItem /g)?.length).toBe(
          code.match(/<span ndsComboboxItemIndicator><\/span>/g)?.length,
        );
      });

      it('enumera as MESMAS opções que a story renderiza, com os mesmos valores', () => {
        // Rótulo E valor: o snippet deriva o valor do rótulo, e a story o
        // declara à parte. Divergir em qualquer um dos dois ensina uma lista que
        // o preview ao lado não tem.
        expect(snippetOptions(code)).toEqual(storyOptions(file, list));
      });

      it('escreve o rótulo e o placeholder que a story mostra', () => {
        const label = /<label ndsComboboxLabel>([^<]*)<\/label>/.exec(block)?.[1];
        const placeholder = /\bplaceholder=\x22([^\x22]*)\x22/.exec(block)?.[1];
        const expectedLabel = argBound ? argBound.label : label;
        const expectedPlaceholder = argBound ? argBound.placeholder : placeholder;
        expect(expectedLabel).toBeTruthy();
        expect(expectedPlaceholder).toBeTruthy();
        expect(code).toContain(`<label ndsComboboxLabel>${expectedLabel}</label>`);
        expect(code).toContain(`<input ndsComboboxInput placeholder="${expectedPlaceholder}" />`);
      });

      it('liga na raiz os mesmos atributos fixos que a story liga', () => {
        const storyRoot = /<nds-combobox\b([^>]*)>/.exec(block)?.[1] ?? '';
        const snippetRoot = rootTag(code);
        // Booleanos sem valor: presentes na story ⇔ presentes no snippet. No
        // Playground eles vêm por binding do control, e o padrão é `false` —
        // por isso também ficam fora do snippet.
        for (const flag of ['multiple', 'disabled', 'invalid']) {
          expect(hasBareAttribute(snippetRoot, flag), `${flag} na raiz`).toBe(
            hasBareAttribute(storyRoot, flag),
          );
        }
        // A forma de linha única só aparece onde a story a escolhe.
        expect(snippetRoot.includes('chipsLayout="single-line"')).toBe(
          storyRoot.includes('chipsLayout="single-line"'),
        );
        // O nome do campo: o fixo da story, ou o que o control entrega.
        const storyName = /\sname=\x22([^\x22]+)\x22/.exec(storyRoot)?.[1] ?? (argBound ? argBound.name : undefined);
        if (storyName) expect(snippetRoot).toContain(`name="${storyName}"`);
        else expect(snippetRoot).not.toContain('name=');
      });
    });
  }
});

// ─── Playground: os controls ──────────────────────────────────────────────────

describe('comboboxSource (Playground)', () => {
  it('sem control mexido, não repete valor padrão', () => {
    // Snippet que repete o default ensina ruído a quem copia.
    const code = comboboxSource('');
    const root = rootTag(code);
    for (const flag of ['multiple', 'disabled', 'invalid']) {
      expect(hasBareAttribute(root, flag), flag).toBe(false);
    }
    expect(root).not.toContain('name=');
    expect(root).not.toContain('chipsLayout');
    expect(code).toContain('<label ndsComboboxLabel>País</label>');
    expect(code).toContain('<input ndsComboboxInput placeholder="Buscar país" />');
  });

  it('segue os controls de rótulo, placeholder, nome e estado', () => {
    const code = comboboxSource('', {
      args: { label: 'Destino', placeholder: 'Buscar destino', name: 'destino', disabled: true, invalid: true },
    });
    const root = rootTag(code);
    expect(code).toContain('<label ndsComboboxLabel>Destino</label>');
    expect(code).toContain('<input ndsComboboxInput placeholder="Buscar destino" />');
    expect(root).toContain('name="destino"');
    expect(hasBareAttribute(root, 'disabled')).toBe(true);
    expect(hasBareAttribute(root, 'invalid')).toBe(true);
    // O valor é da classe, em duas vias contra um sinal — e não o armazém de
    // módulo que a story usa para sobreviver à recriação da árvore.
    expect(root).toContain('[(value)]="value"');
    expect(code).toContain('  readonly value = signal<string | undefined>(undefined);');
  });

  it('escolha única não publica caixa de chips', () => {
    const code = comboboxSource('');
    expect(code).not.toContain('ndsComboboxChip');
    expect(code).not.toContain('labelOf');
    // O campo de texto é filho direto do wrapper.
    expect(code).toMatch(/<div ndsComboboxInputWrapper>\n\s*<input ndsComboboxInput /);
  });
});

// ─── Múltipla escolha ─────────────────────────────────────────────────────────

describe('modo múltiplo', () => {
  const code = comboboxSource('', { args: MULTIPLE_ARGS });

  it('põe o campo de texto DENTRO da caixa de chips, e limpar e abrir fora dela', () => {
    // É o que mantém o texto fluindo depois do último chip e deixa os dois
    // botões fora do que quebra de linha.
    const chips = code.indexOf('<div ndsComboboxChips>');
    const input = code.indexOf('<input ndsComboboxInput ');
    const chipsEnd = code.indexOf('</div>', input);
    expect(chips).toBeGreaterThan(-1);
    expect(input).toBeGreaterThan(chips);
    expect(code.indexOf('<button ndsComboboxClear')).toBeGreaterThan(chipsEnd);
    expect(code.indexOf('<button ndsComboboxTrigger')).toBeGreaterThan(chipsEnd);
  });

  it('dá a cada botão de remover o nome do que ele remove', () => {
    // Cinco botões chamados "Remover" são indistinguíveis por lista de
    // controles — o rótulo do chip entra no nome.
    expect(code).toContain('@for (chosen of value(); track chosen) {');
    expect(code).toContain('<span ndsComboboxChip [value]="chosen">');
    expect(code).toContain(
      `<button ndsComboboxChipRemove [attr.aria-label]="'Remover ' + labelOf(chosen)"></button>`,
    );
  });

  it('declara a lista que o labelOf lê, com as opções da lista de baixo', () => {
    // O defeito que a varredura genérica não via: ela só chama o ramo padrão.
    expect(code).toContain('  readonly value = signal<string[]>([]);');
    expect(code).toContain('  readonly items = [');
    const declared = [...code.matchAll(/\{ value: \x27([^\x27]+)\x27, label: \x27([^\x27]+)\x27 \},/g)].map((m) => ({
      value: m[1]!,
      label: m[2]!,
    }));
    expect(declared).toEqual(snippetOptions(code));
    expect(declared.length).toBeGreaterThan(0);
  });

  it('só publica chipsLayout quando difere do padrão', () => {
    expect(rootTag(code)).not.toContain('chipsLayout');
    expect(rootTag(comboboxSnippet({ multiple: true, chipsLayout: 'wrap' }))).not.toContain('chipsLayout');
    expect(rootTag(comboboxSnippet({ multiple: true, chipsLayout: 'single-line' }))).toContain(
      'chipsLayout="single-line"',
    );
  });
});

// ─── Agrupado ─────────────────────────────────────────────────────────────────

describe('lista agrupada (Grouped)', () => {
  const file = 'combobox-variants.stories.ts';
  const groups = storyGroups(file, 'GROCERIES');
  const code = comboboxSnippet({
    label: 'Ingrediente',
    placeholder: 'Buscar ingrediente',
    groups: Object.fromEntries(groups.map((g) => [g.name, g.options.map((o) => o.label)])),
  });

  it('a story ainda chama o construtor com os grupos', () => {
    const block = storyBlock(file, 'Grouped');
    expect(block).toContain('comboboxSnippet({');
    expect(block).toContain('groups: {');
    // E os grupos que o transform da story escreve à mão são os da constante
    // que o `render` itera — é a outra metade do "bate com a story".
    for (const group of groups) {
      expect(block).toContain(`${group.name}: [${group.options.map((o) => `'${o.label}'`).join(', ')}]`);
    }
  });

  it('um cabeçalho por grupo, na ordem da story', () => {
    const headings = [...code.matchAll(/<div ndsComboboxGroupLabel>([^<]+)<\/div>/g)].map((m) => m[1]);
    expect(headings).toEqual(groups.map((g) => g.name));
    expect(code.match(/<div ndsComboboxGroup>/g)).toHaveLength(groups.length);
  });

  it('as opções de cada grupo, com os valores da story', () => {
    expect(snippetOptions(code)).toEqual(groups.flatMap((g) => g.options));
  });

  it('um divisor ENTRE os grupos, e nunca depois do último', () => {
    expect(code.match(/<div ndsComboboxSeparator><\/div>/g)).toHaveLength(groups.length - 1);
    const lastGroup = code.lastIndexOf('<div ndsComboboxGroup>');
    expect(code.lastIndexOf('<div ndsComboboxSeparator>')).toBeLessThan(lastGroup);
  });

  it('o rótulo e o placeholder da story', () => {
    const block = storyBlock(file, 'Grouped');
    expect(block).toContain('<label ndsComboboxLabel>Ingrediente</label>');
    expect(block).toContain('placeholder="Buscar ingrediente"');
    expect(code).toContain('<label ndsComboboxLabel>Ingrediente</label>');
    expect(code).toContain('<input ndsComboboxInput placeholder="Buscar ingrediente" />');
  });
});

// ─── Composições ──────────────────────────────────────────────────────────────

describe('composições', () => {
  it('comboboxCustomFilterSnippet publica o predicado de TRÊS argumentos', () => {
    // Um predicado de dois parâmetros compila e nunca vê o rótulo: a opção é
    // registrada por string, e quem devolve o texto é o `itemToString`.
    const code = comboboxCustomFilterSnippet();
    expect(code).toContain("import type { ComboboxFilter } from '@/components/ui/combobox';");
    expect(code).toContain(
      'const startsWithFilter: ComboboxFilter = (itemValue, query, itemToString) => {',
    );
    expect(code).toContain('itemToString?.(itemValue)');
    expect(code).toContain('.startsWith(normalize(query))');
    expect(rootTag(code)).toContain('[filter]="filter"');
    // Constante de módulo é invisível no template: a classe a republica.
    expect(classBody(code)).toContain('  readonly filter = startsWithFilter;');
  });

  it('comboboxControlledSnippet liga as duas pontas em uma via, contra sinais', () => {
    const code = comboboxControlledSnippet();
    const root = rootTag(code);
    expect(root).toContain('[value]="chosen()"');
    expect(root).toContain('(valueChange)="onValueChange($event)"');
    expect(root).toContain('[inputValue]="query()"');
    expect(root).toContain('(inputValueChange)="query.set($event)"');
    // Duas vias aqui apagariam o assunto da story: é o estado de fora quem manda.
    expect(root).not.toContain('[(');
    // Sinais, e não campos comuns: sem zone.js, é a escrita no sinal que agenda
    // o redesenho.
    const body = classBody(code);
    expect(body).toContain('  readonly chosen = signal<string | null>(null);');
    expect(body).toContain("  readonly query = signal('');");
    expect(body).toContain('  onValueChange(value: unknown): void {');
  });
});
