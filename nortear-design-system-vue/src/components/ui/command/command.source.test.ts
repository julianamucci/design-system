import { describe, expect, it } from 'vitest';
import {
  commandEmptySource,
  commandItemCheckedSource,
  commandItemDisabledSource,
  commandLongListSource,
  commandPaletteSource,
  commandSource,
  commandWithDisabledItemsSource,
  commandWithGroupsSource,
  commandWithSeparatorSource,
  commandWithShortcutsSource,
} from './command.source';
import { LONG_LIST_NAMES } from './command.fixtures';

const count = (text: string, pattern: RegExp) => text.match(pattern)?.length ?? 0;

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
} from '@/components/ui/command'

function runCommand(value: string) {
  // roda o comando escolhido
}
</script>

<template>
  <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
    <Command>
      <CommandInput placeholder="Buscar componente..." />

      <CommandList>
        <CommandGroup heading="Componentes">
          <CommandItem value="button" @select="runCommand('button')">Button</CommandItem>
          <CommandItem value="input" @select="runCommand('input')">Input</CommandItem>
          <CommandItem value="separator" @select="runCommand('separator')">Separator</CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Utilitários">
          <CommandItem value="cn" @select="runCommand('cn')">cn()</CommandItem>
          <CommandItem value="clsx" @select="runCommand('clsx')">clsx()</CommandItem>
        </CommandGroup>
      </CommandList>

      <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
    </Command>
  </div>
</template>`,
    );
  });

  it('a região viva fica FORA da lista — status dentro de listbox é filho ilegal', () => {
    const output = commandSource();
    const listEnd = output.indexOf('</CommandList>');
    expect(listEnd).toBeGreaterThan(0);
    expect(output.indexOf('<CommandEmpty>')).toBeGreaterThan(listEnd);
  });

  it('os controls de texto trocam o campo e a frase de vazio', () => {
    const output = commandSource('', {
      args: { placeholder: 'Buscar ação...', emptyMessage: 'Nada por aqui.' },
    });
    expect(output).toContain('<CommandInput placeholder="Buscar ação..." />');
    expect(output).toContain('<CommandEmpty>Nada por aqui.</CommandEmpty>');
  });

  it('sem grupos o cabeçalho SOME, e não vira rótulo vazio', () => {
    const output = commandSource('', { args: { showGroups: false } });
    // Cabeçalho vazio não é o mesmo que cabeçalho ausente: o componente remove
    // o `aria-labelledby` quando não há rótulo, em vez de apontar para um id
    // inexistente.
    expect(output).toContain('<CommandGroup>');
    expect(output).not.toContain('heading=');
  });

  it('o Playground não tem ícone, atalho nem marca — o conteúdo é o do Vanilla', () => {
    const output = commandSource();
    expect(output).not.toContain('CommandShortcut');
    expect(output).not.toContain(':checked');
    expect(count(output, /<CommandItem /g)).toBe(5);
  });

  it('ignora control que não é do tipo esperado — o espião de ação vira ruído no painel', () => {
    const spy = (() => {}) as never;
    const output = commandSource('', {
      args: { placeholder: spy, emptyMessage: spy, showGroups: spy },
    });
    expect(output).toBe(commandSource());
    expect(output).not.toContain('function (');
  });
});

describe('transforms das stories de variante e de estado', () => {
  it('com grupos: sete comandos em dois grupos nomeados, com um traço entre eles', () => {
    const output = commandWithGroupsSource();
    expect(count(output, /<CommandGroup heading=/g)).toBe(2);
    expect(count(output, /<CommandItem /g)).toBe(7);
    expect(count(output, /<CommandSeparator \/>/g)).toBe(1);
    expect(output).toContain('<CommandItem value="twmerge">twMerge()</CommandItem>');
    // O componente é quem esconde o traço da árvore: nada a escrever aqui.
    expect(output).not.toContain('aria-hidden');
  });

  it('o estado vazio não escreve nada de especial — quem decide é o componente', () => {
    const output = commandEmptySource();
    expect(output).toContain('<CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>');
    expect(output).not.toContain('data-empty');
    expect(output).not.toContain('role="status"');
    // Três comandos num bloco só, sem cabeçalho — e por isso sem traço.
    expect(count(output, /<CommandItem /g)).toBe(3);
    expect(output).toContain('<CommandGroup>');
    expect(output).not.toContain('CommandSeparator');
  });

  it('o comando desabilitado leva a prop no item, não na raiz', () => {
    const output = commandItemDisabledSource();
    expect(output).toContain(`<CommandItem value="arquivar" disabled @select="runCommand('arquivar')">Arquivar</CommandItem>`);
    expect(output).toContain('<Command>');
    // O andaime de teste da story não é parte do design system.
    expect(output).not.toContain('data-testid');
  });

  it('marcável desmarcado é escrito, porque não é o mesmo que não marcável', () => {
    const output = commandItemCheckedSource();
    expect(output).toContain('<CommandItem value="claro" :checked="true">Claro</CommandItem>');
    expect(output).toContain('<CommandItem value="escuro" :checked="false">Escuro</CommandItem>');
    // Um por item: marca e atalho disputariam a borda direita.
    expect(output).toMatch(/Sistema\n\s+<CommandShortcut>Ctrl\+S<\/CommandShortcut>/);
  });

  it('a lista longa escreve os trinta comandos por v-for, e não um a um', () => {
    const output = commandLongListSource();
    expect(output).toContain('v-for="name in componentNames"');
    expect(output).toContain(':value="name.toLowerCase()"');
    for (const name of LONG_LIST_NAMES) expect(output).toContain(`'${name}'`);
    expect(count(output, /<CommandItem/g)).toBe(1);
  });
});

describe('transforms das stories de composição', () => {
  it('cada atalho mora dentro do item, que é o que o põe no nome acessível', () => {
    const output = commandWithShortcutsSource();
    expect(output).toMatch(/Salvar\n\s+<CommandShortcut>Ctrl\+S<\/CommandShortcut>/);
    expect(count(output, /<CommandShortcut>/g)).toBe(3);
    // Comando sem atalho não ganha um atalho vazio.
    expect(output).toContain('<CommandItem value="preferencias">Preferências</CommandItem>');
    expect(output).toContain('<CommandInput placeholder="Buscar comando..." />');
  });

  it('o traço declarado separa dois blocos sem cabeçalho', () => {
    const output = commandWithSeparatorSource();
    expect(count(output, /<CommandGroup>/g)).toBe(2);
    expect(output).not.toContain('heading=');
    expect(count(output, /<CommandSeparator \/>/g)).toBe(1);
    expect(count(output, /<CommandItem /g)).toBe(3);
  });

  it('os três desabilitados levam a prop, e os habilitados não', () => {
    const output = commandWithDisabledItemsSource();
    expect(count(output, / disabled /g)).toBe(3);
    expect(output).toContain(`<CommandItem value="select" disabled @select="runCommand('select')">Select</CommandItem>`);
    expect(output).toContain(`<CommandItem value="badge" @select="runCommand('badge')">Badge</CommandItem>`);
  });

  it('a palette usa o diálogo, que já traz a raiz por dentro', () => {
    const output = commandPaletteSource();
    expect(output).toContain('<CommandDialog');
    expect(output).toContain('title="Command Palette"');
    expect(output).toContain('description="Busque por um comando ou ação..."');
    // `CommandDialog` monta o `Command` por dentro: escrevê-lo aqui aninharia
    // duas raízes.
    expect(output).not.toContain('<Command>');
    // O atalho de janela é código de quem consome, e sai quando a tela sai.
    expect(output).toContain(`onMounted(() => window.addEventListener('keydown', onKeydown))`);
    expect(output).toContain(`onUnmounted(() => window.removeEventListener('keydown', onKeydown))`);
    // Os comandos são os do Vanilla: dois com atalho e cn().
    expect(output).toContain('<CommandShortcut>Ctrl+I</CommandShortcut>');
    expect(output).toContain(`<CommandItem value="cn" @select="runCommand('cn')">cn()</CommandItem>`);
  });

  it('a dica do atalho fica DENTRO do gatilho, e o texto visível é o nome dele', () => {
    const output = commandPaletteSource();
    const trigger = output.slice(output.indexOf('<Button'), output.indexOf('</Button>'));
    expect(trigger).toContain('<kbd class="nds-kbd">Ctrl+K</kbd>');
    // Nome acessível que não contém o texto visível viola a WCAG 2.5.3.
    expect(trigger).not.toContain('aria-label');
  });

  it('nenhum snippet carrega valor de design em style inline', () => {
    for (const output of [
      commandSource(),
      commandWithGroupsSource(),
      commandEmptySource(),
      commandItemDisabledSource(),
      commandItemCheckedSource(),
      commandLongListSource(),
      commandWithShortcutsSource(),
      commandWithSeparatorSource(),
      commandWithDisabledItemsSource(),
      commandPaletteSource(),
    ]) {
      expect(output).not.toContain('style="');
    }
  });
});
