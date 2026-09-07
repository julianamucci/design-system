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

  it('o grupo com rótulo não marca "Sair" de vermelho — sair não é irreversível', () => {
    // A TAG inteira, e não o texto solto: `not.toContain('destructive')` também
    // casaria com o nome da variante em qualquer comentário do snippet.
    expect(dropdownMenuWithLabelSource()).toContain('<DropdownMenuItem>Sair</DropdownMenuItem>');
    expect(dropdownMenuWithLabelSource()).not.toContain(
      '<DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>',
    );
  });

  it('os alternadores ligam cada item ao seu próprio estado', () => {
    const saida = dropdownMenuWithCheckboxSource();
    expect(saida).toContain('let mostrarNome = $state(true);');
    expect(saida).toContain('let mostrarEmail = $state(false);');
    expect(saida).toContain('let mostrarFuncao = $state(false);');
    expect(saida).toContain('<DropdownMenuCheckboxItem bind:checked={mostrarEmail}>');
  });

  it('os alternadores são as TRÊS colunas da tabela, e o gatilho as anuncia', () => {
    // O snippet acompanha o preview: três itens, os mesmos rótulos, o mesmo
    // gatilho. Painel Code que mostra outra lista ensina um menu que a página
    // não tem. Três é o número do vanilla, que é a referência.
    const saida = dropdownMenuWithCheckboxSource();
    expect(saida).toContain('<DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>');
    expect(saida).toContain('>Colunas</Button>');
    expect(saida).toContain('<DropdownMenuCheckboxItem bind:checked={mostrarFuncao}>');
    expect(saida.match(/<DropdownMenuCheckboxItem /g)).toHaveLength(3);
  });

  it('a escolha única compartilha um valor só entre os itens', () => {
    const saida = dropdownMenuWithRadioSource();
    expect(saida).toContain('let tema = $state("light");');
    expect(saida).toContain('<DropdownMenuRadioGroup bind:value={tema}>');
    expect(saida.match(/<DropdownMenuRadioItem value="/g)).toHaveLength(3);
  });

  it('a escolha única é a aparência, e nasce no valor que a story mostra marcado', () => {
    const saida = dropdownMenuWithRadioSource();
    expect(saida).toContain('<DropdownMenuLabel>Aparência</DropdownMenuLabel>');
    expect(saida).toContain('<DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>');
    expect(saida).toContain('<DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>');
    expect(saida).toContain('<DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>');
    expect(saida).toContain('>Tema</Button>');
  });

  it('o submenu aninha conteúdo dentro do próprio item', () => {
    const saida = dropdownMenuWithSubmenuSource();
    expect(saida).toContain('<DropdownMenuSub>');
    expect(saida).toContain('<DropdownMenuSubContent>');
  });

  it('o submenu lista os dois formatos do preview, e nada depois dele', () => {
    const saida = dropdownMenuWithSubmenuSource();
    expect(saida).toContain('<DropdownMenuItem>Renomear</DropdownMenuItem>');
    expect(saida).toContain('<DropdownMenuItem>PDF</DropdownMenuItem>');
    expect(saida).toContain('<DropdownMenuItem>CSV</DropdownMenuItem>');
    // O terceiro formato e o item destrutivo saíram do preview; o painel Code
    // acompanha, senão ele mostra um menu que a story não monta.
    expect(saida).not.toContain('<DropdownMenuItem>JSON</DropdownMenuItem>');
    expect(saida).not.toContain('<DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>');
    expect(saida).not.toContain('<DropdownMenuSeparator />');
  });

  it('o atalho é filho do item, não texto solto ao lado dele', () => {
    const saida = dropdownMenuWithShortcutsSource();
    expect(saida).toContain('<DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>');
    expect(saida).toContain('>Editar</Button>');
  });
});
