import { describe, expect, it } from 'vitest';
import {
  dropdownMenuWithShortcutsSource,
  dropdownMenuWithCheckboxSource,
  dropdownMenuWithRadioSource,
  dropdownMenuWithLabelSource,
  dropdownMenuWithSubmenuSource,
  dropdownMenuControlledSource,
  dropdownMenuDestructiveSource,
  dropdownMenuIndeterminadoSource,
  dropdownMenuItemDisabledSource,
  dropdownMenuDefaultSource,
  dropdownMenuSource,
  dropdownMenuEntriesSource,
} from './dropdown-menu.source';
import type { MenuDocsEntry } from './dropdown-menu.fixtures';

describe('dropdownMenuSource', () => {
  it('sem args, entrega o menu canônico fechado, importando só as peças usadas', () => {
    expect(dropdownMenuSource()).toBe(
      `<script lang="ts">
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
  import { Button } from "@/components/ui/button";
</script>

<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Mais ações</Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuGroup>
      <DropdownMenuItem>Perfil</DropdownMenuItem>
      <DropdownMenuItem>Configurações</DropdownMenuItem>
      <DropdownMenuItem>Equipe</DropdownMenuItem>
    </DropdownMenuGroup>
  </DropdownMenuContent>
</DropdownMenu>`,
    );
  });

  it('acompanha o control de posicionamento, e só escreve o que difere do padrão', () => {
    expect(dropdownMenuSource()).not.toContain('side=');
    expect(dropdownMenuSource()).not.toContain('align=');
    expect(dropdownMenuSource()).not.toContain('sideOffset');

    const output = dropdownMenuSource('', { args: { side: 'top', align: 'end', sideOffset: 8 } });
    expect(output).toContain('<DropdownMenuContent side="top" align="end" sideOffset={8}>');
  });

  it('acompanha o control do rótulo do gatilho', () => {
    expect(dropdownMenuSource('', { args: { triggerLabel: 'Opções' } })).toContain(
      '<Button variant="outline" {...props}>Opções</Button>',
    );
  });

  it('abre pelo estado ligado, porque a raiz não tem defaultOpen', () => {
    const closed = dropdownMenuSource('', { args: { defaultOpen: false } });
    expect(closed).toContain('<DropdownMenu>');
    expect(closed).not.toContain('$state');

    const isOpen = dropdownMenuSource('', { args: { defaultOpen: true } });
    expect(isOpen).toContain('let aberto = $state(true);');
    expect(isOpen).toContain('<DropdownMenu bind:open={aberto}>');
    // `defaultOpen` é prop do invólucro da story, não do primitivo: escrevê-la
    // no snippet ensinaria uma API que a raiz não aceita.
    expect(isOpen).not.toContain('defaultOpen');
  });

  it('o control de abertura externa vence o inicial', () => {
    expect(dropdownMenuSource('', { args: { open: true, defaultOpen: false } })).toContain(
      'bind:open={aberto}',
    );
    expect(dropdownMenuSource('', { args: { open: false, defaultOpen: true } })).not.toContain(
      'bind:open',
    );
  });

  it('troca o miolo do conteúdo conforme o control de composição', () => {
    expect(dropdownMenuSource('', { args: { variant: 'destructive' } })).toContain(
      '<DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>',
    );
    expect(dropdownMenuSource('', { args: { variant: 'withSubmenu' } })).toContain(
      '<DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>',
    );
    expect(dropdownMenuSource('', { args: { variant: 'withShortcuts' } })).toContain(
      '<DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>',
    );
  });

  it('importa exatamente as peças que a composição escolhida usa', () => {
    const submenu = dropdownMenuSource('', { args: { variant: 'withSubmenu' } });
    expect(submenu).toContain('  DropdownMenuSubContent,');
    expect(submenu).toContain('  DropdownMenuSubTrigger,');
    // Nem grupo nem separador entram: esta composição não usa nenhum dos dois, e
    // import morto no snippet vira erro de lint na primeira colagem. O separador
    // saiu junto com o item destrutivo que vinha depois do submenu — ele existia
    // só para separá-lo do resto.
    expect(submenu).not.toContain('  DropdownMenuGroup,');
    expect(submenu).not.toContain('  DropdownMenuSeparator,');
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('nenhum override abre o menu na montagem — isso é andaime da captura', () => {
    for (const fn of [
      dropdownMenuDefaultSource,
      dropdownMenuDestructiveSource,
      dropdownMenuItemDisabledSource,
      dropdownMenuIndeterminadoSource,
      dropdownMenuWithLabelSource,
      dropdownMenuWithCheckboxSource,
      dropdownMenuWithRadioSource,
      dropdownMenuWithSubmenuSource,
      dropdownMenuWithShortcutsSource,
    ]) {
      expect(fn(), fn.name).not.toContain('bind:open');
    }
  });

  it('a variante padrão mostra o item neutro, sem cor semântica', () => {
    expect(dropdownMenuDefaultSource()).not.toContain('variant="destructive"');
  });

  it('a variante destrutiva marca só a ação irreversível', () => {
    const output = dropdownMenuDestructiveSource();
    expect(output).toContain('<DropdownMenuItem>Editar</DropdownMenuItem>');
    expect(output).toContain('<DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>');
    expect(output).toContain('>Ações da conta</Button>');
  });

  it('o override controlado liga o estado externo por bind:open', () => {
    const output = dropdownMenuControlledSource();
    expect(output).toContain('let aberto = $state(false);');
    expect(output).toContain('<DropdownMenu bind:open={aberto}>');
    expect(output).toContain('>Abrir via estado externo</Button>');
  });

  it('o item desabilitado continua no menu, escrito como tal', () => {
    expect(dropdownMenuItemDisabledSource()).toContain(
      '<DropdownMenuItem disabled>Arquivar (indisponível)</DropdownMenuItem>',
    );
  });

  it('o indeterminado mostra os três estados do alternador de uma vez', () => {
    const output = dropdownMenuIndeterminadoSource();
    expect(output).toContain('<DropdownMenuCheckboxItem indeterminate>Nome</DropdownMenuCheckboxItem>');
    expect(output).toContain('<DropdownMenuCheckboxItem checked>E-mail</DropdownMenuCheckboxItem>');
    expect(output).toContain('<DropdownMenuCheckboxItem>Telefone</DropdownMenuCheckboxItem>');
  });

  it('o grupo com rótulo usa GroupHeading, que é quem nomeia o agrupamento', () => {
    const output = dropdownMenuWithLabelSource();
    expect(output).toContain('<DropdownMenuGroupHeading>Conta</DropdownMenuGroupHeading>');
    expect(output).toContain('<DropdownMenuGroupHeading>Suporte</DropdownMenuGroupHeading>');
  });

  it('o grupo com rótulo não marca "Sair" de vermelho — sair não é irreversível', () => {
    // A TAG inteira, e não o texto solto: `not.toContain('destructive')` também
    // casaria com o nome da variante em qualquer comentário do snippet.
    expect(dropdownMenuWithLabelSource()).toContain('<DropdownMenuItem>Sair</DropdownMenuItem>');
    expect(dropdownMenuWithLabelSource()).not.toContain(
      '<DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>',
    );
  });

  it('os alternadores ligam cada item ao seu próprio estado', () => {
    const output = dropdownMenuWithCheckboxSource();
    expect(output).toContain('let mostrarNome = $state(true);');
    expect(output).toContain('let mostrarEmail = $state(false);');
    expect(output).toContain('let mostrarFuncao = $state(false);');
    expect(output).toContain('<DropdownMenuCheckboxItem bind:checked={mostrarEmail}>');
  });

  it('os alternadores são as TRÊS colunas da tabela, e o gatilho as anuncia', () => {
    // O snippet acompanha o preview: três itens, os mesmos rótulos, o mesmo
    // gatilho. Painel Code que mostra outra lista ensina um menu que a página
    // não tem. Três é o número do vanilla, que é a referência.
    const output = dropdownMenuWithCheckboxSource();
    expect(output).toContain('<DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>');
    expect(output).toContain('>Colunas</Button>');
    expect(output).toContain('<DropdownMenuCheckboxItem bind:checked={mostrarFuncao}>');
    expect(output.match(/<DropdownMenuCheckboxItem /g)).toHaveLength(3);
  });

  it('a escolha única compartilha um valor só entre os itens', () => {
    const output = dropdownMenuWithRadioSource();
    expect(output).toContain('let tema = $state("light");');
    expect(output).toContain('<DropdownMenuRadioGroup bind:value={tema}>');
    expect(output.match(/<DropdownMenuRadioItem value="/g)).toHaveLength(3);
  });

  it('a escolha única é a aparência, e nasce no valor que a story mostra marcado', () => {
    const output = dropdownMenuWithRadioSource();
    expect(output).toContain('<DropdownMenuLabel>Aparência</DropdownMenuLabel>');
    expect(output).toContain('<DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>');
    expect(output).toContain('<DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>');
    expect(output).toContain('<DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>');
    expect(output).toContain('>Tema</Button>');
  });

  it('o submenu aninha conteúdo dentro do próprio item', () => {
    const output = dropdownMenuWithSubmenuSource();
    expect(output).toContain('<DropdownMenuSub>');
    expect(output).toContain('<DropdownMenuSubContent>');
  });

  it('o submenu lista os dois formatos do preview, e nada depois dele', () => {
    const output = dropdownMenuWithSubmenuSource();
    expect(output).toContain('<DropdownMenuItem>Renomear</DropdownMenuItem>');
    expect(output).toContain('<DropdownMenuItem>PDF</DropdownMenuItem>');
    expect(output).toContain('<DropdownMenuItem>CSV</DropdownMenuItem>');
    // O terceiro formato e o item destrutivo saíram do preview; o painel Code
    // acompanha, senão ele mostra um menu que a story não monta.
    expect(output).not.toContain('<DropdownMenuItem>JSON</DropdownMenuItem>');
    expect(output).not.toContain('<DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>');
    expect(output).not.toContain('<DropdownMenuSeparator />');
  });

  it('o atalho é filho do item, não texto solto ao lado dele', () => {
    const output = dropdownMenuWithShortcutsSource();
    expect(output).toContain('<DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>');
    expect(output).toContain('>Editar</Button>');
  });
});

describe('dropdownMenuEntriesSource — o código dos cards de Variantes', () => {
  // A mesma lista monta a prévia e imprime o código: o que a lista diz é o que
  // o painel mostra, no idioma em que os rótulos chegaram.
  const entries: MenuDocsEntry[] = [
    {
      type: 'group',
      label: 'Account',
      items: [
        { type: 'item', label: 'Profile', value: 'profile' },
        { type: 'item', label: 'Settings', value: 'settings' },
      ],
    },
    { type: 'separator' },
    { type: 'item', label: 'Log out', value: 'logout', variant: 'destructive' },
  ];

  it('escreve o gatilho e os rótulos que recebeu, sem português cravado', () => {
    const output = dropdownMenuEntriesSource({ triggerLabel: 'Account', entries });
    expect(output).toContain('<Button variant="outline" {...props}>Account</Button>');
    expect(output).toContain('<DropdownMenuGroupHeading>Account</DropdownMenuGroupHeading>');
    expect(output).toContain('<DropdownMenuItem>Profile</DropdownMenuItem>');
    expect(output).toContain('<DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>');
    expect(output).not.toMatch(/Perfil|Conta|Sair/);
  });

  it('o rótulo do grupo mora DENTRO do grupo que ele nomeia', () => {
    const output = dropdownMenuEntriesSource({ triggerLabel: 'Account', entries });
    expect(output).toContain(
      '    <DropdownMenuGroup>\n      <DropdownMenuGroupHeading>Account</DropdownMenuGroupHeading>',
    );
  });

  it('importa só as peças que a lista usa, e nenhum estado quando nada liga', () => {
    const output = dropdownMenuEntriesSource({ triggerLabel: 'Account', entries });
    expect(output).toContain('  DropdownMenuSeparator,');
    expect(output).not.toContain('DropdownMenuShortcut');
    expect(output).not.toContain('DropdownMenuCheckboxItem');
    expect(output).not.toContain('$state');
  });

  it('a marcação e a escolha única declaram as variáveis que ligam, com o estado da lista', () => {
    const output = dropdownMenuEntriesSource({
      triggerLabel: 'Columns',
      entries: [
        { type: 'checkbox', label: 'Name', value: 'column-name', checked: true },
        { type: 'checkbox', label: 'Email', value: 'column-email', checked: false },
        {
          type: 'radio-group',
          label: 'Appearance',
          name: 'theme',
          value: 'light',
          items: [
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ],
        },
      ],
    });
    expect(output).toContain('let columnName = $state(true);');
    expect(output).toContain('let columnEmail = $state(false);');
    expect(output).toContain("let theme = $state('light');");
    expect(output).toContain('<DropdownMenuCheckboxItem bind:checked={columnName}>');
    expect(output).toContain('<DropdownMenuRadioGroup bind:value={theme}>');
    expect(output).toContain('<DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>');
  });

  it('o atalho é filho do item, numa linha própria', () => {
    const output = dropdownMenuEntriesSource({
      triggerLabel: 'Edit',
      entries: [{ type: 'item', label: 'Undo', value: 'undo', shortcut: 'Ctrl+Z' }],
    });
    expect(output).toContain(
      '<DropdownMenuItem>\n      Undo\n      <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>\n    </DropdownMenuItem>',
    );
  });
});
