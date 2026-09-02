import { describe, expect, it } from 'vitest';
import {
  commandLoadingSource,
  commandWithShortcutsSource,
  commandWithGroupsSource,
  commandWithLinkItemSource,
  commandItemDisabledSource,
  commandItemCheckedSource,
  commandPaletteSource,
  commandNoResultsSource,
  commandSource,
} from './command.source';

describe('commandSource', () => {
  it('sem args, entrega a forma canônica com os textos padrão', () => {
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

  function executar(value: string) {
    // roda o comando e devolve o foco para onde ele age
  }
</script>

<Command>
  <CommandInput placeholder="Buscar componente..." />
  <CommandList>
    <CommandGroup heading="Componentes">
      <CommandItem value="button" onSelect={() => executar('button')}>Button</CommandItem>
      <CommandItem value="input" onSelect={() => executar('input')}>Input</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Utilitários">
      <CommandItem value="cn" onSelect={() => executar('cn')}>cn()</CommandItem>
    </CommandGroup>
  </CommandList>
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</Command>`,
    );
  });

  it('acompanha os controls de texto', () => {
    const saida = commandSource('', {
      args: { placeholder: 'Buscar ação...', emptyMessage: 'Nada por aqui.' },
    });
    expect(saida).toContain('<CommandInput placeholder="Buscar ação..." />');
    expect(saida).toContain('<CommandEmpty>Nada por aqui.</CommandEmpty>');
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

  it('importa do design system, nunca do arquivo interno', () => {
    expect(commandSource()).toContain("from '@/components/ui/command'");
  });

  it('todo snippet do painel mantém o vazio fora da lista', () => {
    // A guarda de cada snippet cobre um snippet só. Sem esta, um snippet novo
    // (ou um já existente, editado) volta a ensinar a região viva dentro do
    // listbox sem que nada reprove: o defeito não compila diferente.
    for (const fn of [
      commandSource,
      commandNoResultsSource,
      commandLoadingSource,
      commandItemDisabledSource,
      commandItemCheckedSource,
      commandWithGroupsSource,
      commandWithShortcutsSource,
      commandWithLinkItemSource,
      commandPaletteSource,
    ]) {
      const saida = fn();
      expect(saida).toContain('<CommandEmpty>');
      expect(saida.indexOf('<CommandEmpty>')).toBeGreaterThan(
        saida.lastIndexOf('</CommandList>'),
      );
    }
  });
});

describe('transforms das stories de estado', () => {
  it('sem resultados mostra a frase de vazio FORA da lista', () => {
    const saida = commandNoResultsSource();
    expect(saida).toContain('<CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>');
    // Um grupo só: o que a story ensina é o vazio, não o agrupamento.
    expect(saida.match(/<CommandGroup/g)).toHaveLength(1);
    // A frase é a região viva que anuncia a busca sem resultado, e
    // `role="status"` não é filho permitido de `role="listbox"`.
    expect(saida.indexOf('<CommandEmpty>')).toBeGreaterThan(saida.indexOf('</CommandList>'));
  });

  it('o carregando fica FORA da lista', () => {
    const saida = commandLoadingSource();
    const posLoading = saida.indexOf('<CommandLoading>');
    const posList = saida.indexOf('<CommandList');
    expect(posLoading).toBeGreaterThan(-1);
    // Progresso não é filho permitido de uma lista de opções.
    expect(posLoading).toBeLessThan(posList);
    expect(saida).toContain('</CommandLoading>');
  });

  it('o comando desabilitado escreve a prop no item, não na raiz', () => {
    const saida = commandItemDisabledSource();
    expect(saida).toContain('<CommandItem value="arquivar" disabled');
    expect(saida).toContain('<Command>');
  });

  it('o comando marcável escreve os dois estados de checked', () => {
    const saida = commandItemCheckedSource();
    expect(saida).toContain('checked={true}');
    expect(saida).toContain('checked={false}');
    expect(saida).toContain('<CommandShortcut>Ctrl+S</CommandShortcut>');
  });
});

describe('transforms das stories de composição', () => {
  it('com grupos, dois cabeçalhos e um divisor entre eles', () => {
    const saida = commandWithGroupsSource();
    expect(saida.match(/<CommandGroup heading=/g)).toHaveLength(2);
    expect(saida).toContain('<CommandSeparator />');
  });

  it('o atalho mora dentro do comando', () => {
    const saida = commandWithShortcutsSource();
    expect(saida).toContain(`<CommandItem value="new-file">
        Novo arquivo
        <CommandShortcut>Ctrl+N</CommandShortcut>
      </CommandItem>`);
  });

  it('o comando de link é âncora, e o externo não entrega a janela', () => {
    const saida = commandWithLinkItemSource();
    expect(saida).toContain('<CommandLinkItem href="/docs/button" value="docs-button">');
    expect(saida).toContain('rel="noopener noreferrer"');
  });

  it('a paleta usa o CommandDialog e o atalho global', () => {
    const saida = commandPaletteSource();
    expect(saida).toContain('<CommandDialog');
    expect(saida).toContain('title="Command Palette"');
    expect(saida).toContain("evento.key.toLowerCase() === 'k'");
    expect(saida).toContain('<kbd class="nds-kbd">Ctrl+K</kbd>');
  });
});
