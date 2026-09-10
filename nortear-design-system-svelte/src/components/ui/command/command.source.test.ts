import { describe, expect, it } from 'vitest';
import * as sources from './command.source';
import {
  commandBlocks,
  commandInlineSource,
  commandItemCheckedSource,
  commandItemDisabledSource,
  commandLoadingSource,
  commandLongListSource,
  commandNoResultsSource,
  commandPaletteSource,
  commandSource,
  commandWithDisabledItemsSource,
  commandWithGroupsSource,
  commandWithLinkItemSource,
  commandWithSeparatorSource,
  commandWithShortcutsSource,
  EMPTY_STATE_ITEMS,
  LONG_LIST_NAMES,
  PALETTE_ITEMS,
  SEPARATOR_ITEMS,
} from './command.source';

/**
 * Todo construtor de snippet do módulo, sem filtro por nome.
 *
 * Um filtro por sufixo (`/Source$/`) já encolheu em silêncio uma varredura
 * irmã quando a tradução de identificadores moveu o sufixo. Aqui entra TODA
 * função exportada que não recebe dado obrigatório — as auxiliares com
 * parâmetro obrigatório (`commandBlocks`, `commandInlineSource`,
 * `commandSourceWith`) são declaradas pelo nome, e a contagem é conferida.
 */
const HELPERS = new Set(['commandBlocks', 'commandInlineSource', 'commandSourceWith']);
const builders = Object.entries(sources).filter(
  (entry): entry is [string, () => string] =>
    typeof entry[1] === 'function' && !HELPERS.has(entry[0]),
);

describe('commandSource', () => {
  it('sem args, entrega a lista do Playground com os textos padrão', () => {
    expect(commandSource()).toBe(
      `<script lang="ts">
  import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
  } from '@/components/ui/command';

  function runCommand(value: string) {
    // roda o comando e devolve o foco para onde ele age
  }
</script>

<Command>
  <CommandInput placeholder="Buscar componente..." />
  <CommandList>
    <CommandGroup heading="Componentes">
      <CommandItem value="button" onSelect={() => runCommand('button')}>Button</CommandItem>
      <CommandItem value="input" onSelect={() => runCommand('input')}>Input</CommandItem>
      <CommandItem value="separator" onSelect={() => runCommand('separator')}>Separator</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Utilitários">
      <CommandItem value="cn" onSelect={() => runCommand('cn')}>cn()</CommandItem>
      <CommandItem value="clsx" onSelect={() => runCommand('clsx')}>clsx()</CommandItem>
    </CommandGroup>
  </CommandList>
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</Command>`,
    );
  });

  it('acompanha os controls de texto', () => {
    const output = commandSource('', {
      args: { placeholder: 'Buscar ação...', emptyMessage: 'Nada por aqui.' },
    });
    expect(output).toContain('<CommandInput placeholder="Buscar ação..." />');
    expect(output).toContain('<CommandEmpty>Nada por aqui.</CommandEmpty>');
  });

  it('só escreve loop quando o valor difere do padrão', () => {
    expect(commandSource('', { args: { loop: false } })).toContain('<Command>');
    expect(commandSource('', { args: { loop: true } })).toContain('<Command loop>');
  });

  it('só escreve shouldFilter quando o filtro interno é desligado', () => {
    expect(commandSource('', { args: { shouldFilter: true } })).not.toContain('shouldFilter');
    expect(commandSource('', { args: { shouldFilter: false } })).toContain(
      '<Command shouldFilter={false}>',
    );
  });
});

describe('todo snippet do painel', () => {
  it('a varredura alcança os construtores conhecidos', () => {
    // Se um construtor novo nascer, esta contagem sobe e o teste obriga a
    // decidir: ele entra na varredura (padrão) ou vira auxiliar declarada.
    expect(builders.map(([name]) => name).sort()).toEqual(
      [
        'commandItemCheckedSource',
        'commandItemDisabledSource',
        'commandLoadingSource',
        'commandLongListSource',
        'commandNoResultsSource',
        'commandPaletteSource',
        'commandSource',
        'commandWithDisabledItemsSource',
        'commandWithGroupsSource',
        'commandWithLinkItemSource',
        'commandWithSeparatorSource',
        'commandWithShortcutsSource',
      ].sort(),
    );
  });

  it.each(builders)('%s importa do design system e mantém o vazio fora da lista', (_name, build) => {
    const output = build();
    expect(output).toContain("from '@/components/ui/command'");
    // A frase é a região viva que anuncia a busca sem resultado, e
    // `role="status"` não é filho permitido de `role="listbox"`.
    expect(output).toContain('<CommandEmpty>');
    const listEnd = Math.max(output.lastIndexOf('</CommandList>'), output.lastIndexOf('<CommandList />'));
    expect(output.indexOf('<CommandEmpty>')).toBeGreaterThan(listEnd);
  });

  it.each(builders)('%s só importa peça que usa, e usa toda peça que importa', (_name, build) => {
    const output = build();
    const imported = [...output.matchAll(/^\s{4}(Command\w*),$/gm)].map((m) => m[1]);
    const markup = output.slice(output.indexOf('</script>'));
    for (const part of imported) {
      expect(markup).toContain(`<${part}`);
    }
  });
});

describe('commandBlocks', () => {
  it('põe um traço entre um grupo e o seguinte, e só ali', () => {
    const blocks = commandBlocks([
      { value: 'a', label: 'A', group: 'X' },
      { value: 'b', label: 'B', group: 'X' },
      { value: 'c', label: 'C', group: 'Y' },
    ]);
    expect(blocks.map((block) => block.kind)).toEqual(['group', 'separator', 'group']);
  });

  it('comandos sem grupo formam bloco sem cabeçalho, e o traço declarado quebra a sequência', () => {
    expect(commandBlocks(SEPARATOR_ITEMS).map((block) => block.kind)).toEqual([
      'loose',
      'separator',
      'loose',
    ]);
  });
});

describe('transforms das stories de estado', () => {
  it('sem resultados: três comandos num grupo SEM cabeçalho', () => {
    // Comando sem grupo não fica solto na lista: o grupo sem cabeçalho é a
    // caixa que dá o respiro de 4px, a forma da fábrica do Vanilla.
    const output = commandNoResultsSource();
    expect(output.match(/<CommandGroup>/g)).toHaveLength(1);
    expect(output).not.toContain('heading=');
    expect(output.match(/<CommandItem /g)).toHaveLength(EMPTY_STATE_ITEMS.length);
  });

  it('o carregando fica FORA da lista', () => {
    const output = commandLoadingSource();
    const loadingAt = output.indexOf('<CommandLoading>');
    expect(loadingAt).toBeGreaterThan(-1);
    // Progresso não é filho permitido de uma lista de opções.
    expect(loadingAt).toBeLessThan(output.indexOf('<CommandList'));
    expect(output).toContain('</CommandLoading>');
  });

  it('o comando desabilitado escreve a prop no item, não na raiz', () => {
    const output = commandItemDisabledSource();
    expect(output).toContain('<CommandItem value="arquivar" disabled');
    expect(output).toContain('<Command>');
    expect(output).not.toContain('heading=');
  });

  it('o comando marcável escreve os dois estados de checked, e o atalho junto da marca', () => {
    const output = commandItemCheckedSource();
    expect(output).toContain('checked={true}');
    expect(output).toContain('checked={false}');
    expect(output).toContain(`<CommandItem value="sistema" checked={true}>
        Sistema
        <CommandShortcut>Ctrl+S</CommandShortcut>
      </CommandItem>`);
  });

  it('a lista longa escreve os 30 comandos que a story desenha', () => {
    const output = commandLongListSource();
    expect(output.match(/<CommandItem /g)).toHaveLength(LONG_LIST_NAMES.length);
    expect(output).toContain('<CommandItem value="alertdialog">AlertDialog</CommandItem>');
  });
});

describe('transforms das stories de composição', () => {
  it('com grupos, dois cabeçalhos e um divisor entre eles', () => {
    const output = commandWithGroupsSource();
    expect(output.match(/<CommandGroup heading=/g)).toHaveLength(2);
    expect(output.match(/<CommandSeparator \/>/g)).toHaveLength(1);
  });

  it('com traço declarado, dois grupos sem cabeçalho e o traço entre eles', () => {
    const output = commandWithSeparatorSource();
    expect(output).toContain(`    <CommandGroup>
      <CommandItem value="novo">Novo arquivo</CommandItem>
      <CommandItem value="abrir">Abrir recente</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup>
      <CommandItem value="sair">Sair</CommandItem>
    </CommandGroup>`);
    expect(output).not.toContain('heading=');
  });

  it('o atalho mora dentro do comando, e os 4 comandos da story estão lá', () => {
    const output = commandWithShortcutsSource();
    expect(output).toContain(`<CommandItem value="novo">
        Novo arquivo
        <CommandShortcut>Ctrl+N</CommandShortcut>
      </CommandItem>`);
    expect(output.match(/<CommandItem /g)).toHaveLength(4);
    expect(output).toContain('<CommandInput placeholder="Buscar comando..." />');
  });

  it('com itens desabilitados, os três marcados como tal', () => {
    const output = commandWithDisabledItemsSource();
    expect(output.match(/ disabled /g)).toHaveLength(3);
  });

  it('o comando de link é âncora, e o externo não entrega a janela', () => {
    const output = commandWithLinkItemSource();
    expect(output).toContain('<CommandLinkItem href="/docs/button" value="docs-button">');
    expect(output).toContain('rel="noopener noreferrer"');
  });

  it('a paleta usa o CommandDialog, o atalho que só abre, e a dica dentro do gatilho', () => {
    const output = commandPaletteSource();
    expect(output).toContain('<CommandDialog');
    expect(output).toContain('title="Command Palette"');
    expect(output).toContain("event.key.toLowerCase() === 'k'");
    expect(output).toContain('open = true;');
    expect(output).not.toContain('open = !open');
    // O gatilho anuncia que abre um diálogo, e se ele está aberto: o
    // CommandDialog não expõe gatilho próprio que o faça.
    expect(output).toContain(`<Button
  variant="outline"
  aria-haspopup="dialog"
  aria-expanded={open}
  onclick={() => (open = true)}
>
  Buscar
  <kbd class="nds-kbd">Ctrl+K</kbd>
</Button>`);
    expect(output).not.toContain('aria-label');
    expect(output.match(/<CommandItem /g)).toHaveLength(PALETTE_ITEMS.length);
  });

  it('o snippet inline escreve o que recebe', () => {
    const output = commandInlineSource({
      placeholder: 'P',
      emptyMessage: 'E',
      items: [{ value: 'v', label: 'L' }],
    });
    expect(output).toContain('<CommandInput placeholder="P" />');
    expect(output).toContain(`<CommandGroup>
      <CommandItem value="v">L</CommandItem>
    </CommandGroup>`);
    expect(output).toContain('<CommandEmpty>E</CommandEmpty>');
  });
});
