import { describe, expect, it } from 'vitest';
import {
  commandComAtalhosSource,
  commandComGruposSource,
  commandComoComboboxSource,
  commandItemDesabilitadoSource,
  commandItemMarcadoSource,
  commandPaletteSource,
  commandSource,
  commandVazioSource,
} from './command.source';

describe('commandSource', () => {
  it('sem args, entrega a paleta inline inteira', () => {
    expect(commandSource()).toBe(
      `<script setup lang="ts">
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

function executar(valor: string) {
  // roda o comando escolhido e devolve o foco para onde ele age
}
</script>

<template>
  <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
    <Command>
      <CommandInput placeholder="Buscar componente..." />

      <CommandList>
        <CommandGroup heading="Componentes">
          <CommandItem value="button" @select="executar('button')">
            Button
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem value="input" @select="executar('input')">Input</CommandItem>
          <CommandItem value="separator" @select="executar('separator')">Separator</CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Utilitários">
          <CommandItem value="cn" @select="executar('cn')">cn()</CommandItem>
          <CommandItem value="clsx" @select="executar('clsx')">clsx()</CommandItem>
        </CommandGroup>
      </CommandList>

      <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
    </Command>
  </div>
</template>`,
    );
  });

  it('a região viva fica FORA da lista — status dentro de listbox é filho ilegal', () => {
    const saida = commandSource();
    const fimDaLista = saida.indexOf('</CommandList>');
    expect(fimDaLista).toBeGreaterThan(0);
    expect(saida.indexOf('<CommandEmpty>')).toBeGreaterThan(fimDaLista);
  });

  it('os controls de texto trocam o campo e a frase de vazio', () => {
    const saida = commandSource('', {
      args: { placeholder: 'Buscar ação...', emptyMessage: 'Nada por aqui.' },
    });
    expect(saida).toContain('<CommandInput placeholder="Buscar ação..." />');
    expect(saida).toContain('<CommandEmpty>Nada por aqui.</CommandEmpty>');
  });

  it('sem grupos o cabeçalho SOME, e não vira rótulo vazio', () => {
    const saida = commandSource('', { args: { showGroups: false } });
    // Cabeçalho vazio não é o mesmo que cabeçalho ausente: o componente remove
    // o `aria-labelledby` quando não há rótulo, em vez de apontar para um id
    // inexistente.
    expect(saida).toContain('<CommandGroup>');
    expect(saida).not.toContain('heading=');
  });

  it('o destaque por ponteiro só entra quando difere do padrão', () => {
    expect(commandSource('', { args: { highlightOnHover: true } })).toContain(
      '<Command highlight-on-hover>',
    );
    expect(commandSource('', { args: { highlightOnHover: false } })).toContain('<Command>');
  });

  it('ignora control que não é do tipo esperado — o espião de ação vira ruído no painel', () => {
    const espiao = (() => {}) as never;
    const saida = commandSource('', {
      args: { placeholder: espiao, emptyMessage: espiao, highlightOnHover: espiao },
    });
    expect(saida).toBe(commandSource());
    expect(saida).not.toContain('function (');
  });
});

describe('transforms das stories de estado', () => {
  it('o estado vazio não escreve nada de especial — quem decide é o componente', () => {
    const saida = commandVazioSource();
    expect(saida).toContain('<CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>');
    expect(saida).not.toContain('data-empty');
    expect(saida).not.toContain('role="status"');
  });

  it('o comando desabilitado leva a prop no item, não na raiz', () => {
    const saida = commandItemDesabilitadoSource();
    expect(saida).toContain('<CommandItem value="arquivar" disabled @select="ultimo = \'arquivar\'">');
    expect(saida).toContain('<Command>');
    expect(saida).toContain(`const ultimo = ref('')`);
    // O andaime de teste da story não é parte do design system.
    expect(saida).not.toContain('data-testid');
  });

  it('marcável desmarcado é escrito, porque não é o mesmo que não marcável', () => {
    const saida = commandItemMarcadoSource();
    expect(saida).toContain('<CommandItem value="claro" :checked="true">Claro</CommandItem>');
    expect(saida).toContain('<CommandItem value="escuro" :checked="false">Escuro</CommandItem>');
    // Um por item: marca e atalho disputariam a borda direita.
    expect(saida).toContain('<CommandShortcut>⌘S</CommandShortcut>');
  });
});

describe('transforms das stories de composição', () => {
  it('os grupos são separados por um divisor que não é comando', () => {
    const saida = commandComGruposSource();
    expect(saida.match(/<CommandGroup heading=/g)).toHaveLength(2);
    expect(saida).toContain('<CommandSeparator />');
    // O componente é quem esconde o divisor da árvore: nada a escrever aqui.
    expect(saida).not.toContain('aria-hidden');
  });

  it('cada atalho mora dentro do item, que é o que o põe no nome acessível', () => {
    const saida = commandComAtalhosSource();
    expect(saida).toMatch(/Salvar\n\s+<CommandShortcut>⌘S<\/CommandShortcut>/);
    expect(saida.match(/<CommandShortcut>/g)).toHaveLength(5);
  });

  it('o combobox costura rótulo invisível e valor visível no mesmo nome', () => {
    const saida = commandComoComboboxSource();
    expect(saida).toContain('aria-labelledby="componente-rotulo componente-valor"');
    expect(saida).toContain('<span id="componente-rotulo" class="nds-sr-only">Componente</span>');
    expect(saida).toContain('role="combobox"');
    // Fechar ao escolher: sem isso o painel cobre o valor recém-selecionado.
    expect(saida).toContain('aberto.value = false');
    expect(saida).toContain('v-for="item in itens"');
    expect(saida).toContain(`import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'`);
  });

  it('a palette usa o diálogo, que já traz a raiz por dentro', () => {
    const saida = commandPaletteSource();
    expect(saida).toContain('<CommandDialog');
    expect(saida).toContain('title="Command Palette"');
    // `CommandDialog` monta o `Command` por dentro: escrevê-lo aqui aninharia
    // duas raízes.
    expect(saida).not.toContain('<Command>');
    // O atalho de janela é código de quem consome, e sai quando a tela sai.
    expect(saida).toContain(`onMounted(() => window.addEventListener('keydown', aoTeclar))`);
    expect(saida).toContain(`onUnmounted(() => window.removeEventListener('keydown', aoTeclar))`);
    // Atalho escondido é atalho que ninguém descobre.
    expect(saida).toContain('<kbd class="nds-kbd">⌘K</kbd>');
  });

  it('nenhum snippet carrega valor de design em style inline', () => {
    for (const saida of [
      commandSource(),
      commandItemDesabilitadoSource(),
      commandComoComboboxSource(),
      commandPaletteSource(),
    ]) {
      expect(saida).not.toContain('style="');
    }
  });
});
