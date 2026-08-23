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
} from './dropdown-menu.source';

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

    const saida = dropdownMenuSource('', { args: { side: 'top', align: 'end', sideOffset: 8 } });
    expect(saida).toContain('<DropdownMenuContent side="top" align="end" sideOffset={8}>');
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
      '<DropdownMenuSubTrigger>Exportar como</DropdownMenuSubTrigger>',
    );
    expect(dropdownMenuSource('', { args: { variant: 'withShortcuts' } })).toContain(
      '<DropdownMenuShortcut>⌘S</DropdownMenuShortcut>',
    );
  });

  it('importa exatamente as peças que a composição escolhida usa', () => {
    const submenu = dropdownMenuSource('', { args: { variant: 'withSubmenu' } });
    expect(submenu).toContain('  DropdownMenuSubContent,');
    expect(submenu).toContain('  DropdownMenuSeparator,');
    // O grupo não entra: esta composição não o usa, e import morto no snippet
    // vira erro de lint na primeira colagem.
    expect(submenu).not.toContain('  DropdownMenuGroup,');
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
    const saida = dropdownMenuDestructiveSource();
    expect(saida).toContain('<DropdownMenuItem>Editar</DropdownMenuItem>');
    expect(saida).toContain('<DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>');
    expect(saida).toContain('>Ações da conta</Button>');
  });

  it('o override controlado liga o estado externo por bind:open', () => {
    const saida = dropdownMenuControlledSource();
    expect(saida).toContain('let aberto = $state(false);');
    expect(saida).toContain('<DropdownMenu bind:open={aberto}>');
    expect(saida).toContain('>Abrir via estado externo</Button>');
  });

  it('o item desabilitado continua no menu, escrito como tal', () => {
    expect(dropdownMenuItemDisabledSource()).toContain(
      '<DropdownMenuItem disabled>Arquivar (indisponível)</DropdownMenuItem>',
    );
  });

  it('o indeterminado mostra os três estados do alternador de uma vez', () => {
    const saida = dropdownMenuIndeterminadoSource();
    expect(saida).toContain('<DropdownMenuCheckboxItem indeterminate>Nome</DropdownMenuCheckboxItem>');
    expect(saida).toContain('<DropdownMenuCheckboxItem checked>E-mail</DropdownMenuCheckboxItem>');
    expect(saida).toContain('<DropdownMenuCheckboxItem>Telefone</DropdownMenuCheckboxItem>');
  });

  it('o grupo com rótulo usa GroupHeading, que é quem nomeia o agrupamento', () => {
    const saida = dropdownMenuWithLabelSource();
    expect(saida).toContain('<DropdownMenuGroupHeading>Conta</DropdownMenuGroupHeading>');
    expect(saida).toContain('<DropdownMenuGroupHeading>Suporte</DropdownMenuGroupHeading>');
  });

  it('os alternadores ligam cada item ao seu próprio estado', () => {
    const saida = dropdownMenuWithCheckboxSource();
    expect(saida).toContain('let mostrarBarraDeStatus = $state(true);');
    expect(saida).toContain('<DropdownMenuCheckboxItem bind:checked={mostrarBarraDeAtividade}>');
  });

  it('a escolha única compartilha um valor só entre os itens', () => {
    const saida = dropdownMenuWithRadioSource();
    expect(saida).toContain('let posicao = $state("bottom");');
    expect(saida).toContain('<DropdownMenuRadioGroup bind:value={posicao}>');
    expect(saida.match(/<DropdownMenuRadioItem value="/g)).toHaveLength(3);
  });

  it('o submenu aninha conteúdo dentro do próprio item', () => {
    const saida = dropdownMenuWithSubmenuSource();
    expect(saida).toContain('<DropdownMenuSub>');
    expect(saida).toContain('<DropdownMenuSubContent>');
  });

  it('o atalho é filho do item, não texto solto ao lado dele', () => {
    const saida = dropdownMenuWithShortcutsSource();
    expect(saida).toContain('<DropdownMenuShortcut>⌘D</DropdownMenuShortcut>');
    expect(saida).toContain('>Editar</Button>');
  });
});
