import { describe, expect, it } from 'vitest';
import {
  drawerComConfirmacaoSource,
  drawerComFormularioSource,
  drawerComRolagemSource,
  drawerSource,
} from './drawer.source';

describe('drawerSource', () => {
  it('sem args, entrega o painel canônico fechado e sem direção explícita', () => {
    expect(drawerSource()).toBe(
      `<script lang="ts">
  import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from "@/components/ui/drawer";
  import { Button } from "@/components/ui/button";

  let open = $state(false);
</script>

<Drawer bind:open>
  <DrawerTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Abrir drawer</Button>
    {/snippet}
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Editar perfil</DrawerTitle>
      <DrawerDescription>Atualize seus dados pessoais e foto.</DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
      <Button>Confirmar</Button>
      <DrawerClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>Cancelar</Button>
        {/snippet}
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
    );
  });

  it('só escreve direction quando a direção difere do padrão', () => {
    expect(drawerSource('', { args: { direction: 'bottom' } })).not.toContain('direction');
    expect(drawerSource('', { args: { direction: 'right' } })).toContain(
      '<Drawer bind:open direction="right">',
    );
    expect(drawerSource('', { args: { direction: 'left' } })).toContain('direction="left"');
    expect(drawerSource('', { args: { direction: 'top' } })).toContain('direction="top"');
  });

  it('só escreve dismissible quando o valor difere do padrão', () => {
    expect(drawerSource('', { args: { dismissible: true } })).not.toContain('dismissible');
    expect(drawerSource('', { args: { dismissible: false } })).toContain(
      '<Drawer bind:open dismissible={false}>',
    );
  });

  it('o estado inicial sai do valor ligado, e não de uma prop de abertura padrão', () => {
    // O primitivo desta stack não tem prop de abertura inicial: o valor entra
    // pelo mesmo estado ligado, e é isso que o snippet precisa ensinar.
    expect(drawerSource('', { args: { defaultOpen: true } })).toContain('let open = $state(true);');
    expect(drawerSource('', { args: { open: true } })).toContain('let open = $state(true);');
    expect(drawerSource()).toContain('let open = $state(false);');
    expect(drawerSource('', { args: { defaultOpen: true } })).not.toContain('defaultOpen');
  });

  it('os textos do painel acompanham os controls', () => {
    const saida = drawerSource('', {
      args: {
        triggerLabel: 'Abrir filtros',
        title: 'Filtros',
        description: 'Refine sua busca.',
        actionLabel: 'Salvar',
        cancelLabel: 'Descartar',
      },
    });
    expect(saida).toContain('>Abrir filtros</Button>');
    expect(saida).toContain('<DrawerTitle>Filtros</DrawerTitle>');
    expect(saida).toContain('<DrawerDescription>Refine sua busca.</DrawerDescription>');
    expect(saida).toContain('<Button>Salvar</Button>');
    expect(saida).toContain('>Descartar</Button>');
  });
});

describe('transforms das stories de composição', () => {
  it('a composição com formulário abre à direita e rotula os dois campos', () => {
    const saida = drawerComFormularioSource();
    expect(saida).toContain('direction="right"');
    expect(saida).toContain('<Label for="drawer-nome">Nome</Label>');
    expect(saida).toContain('<Label for="drawer-email">E-mail</Label>');
    expect(saida).toContain('from "@/components/ui/input"');
  });

  it('a confirmação usa o corpo do painel para a mensagem curta', () => {
    const saida = drawerComConfirmacaoSource();
    expect(saida).toContain('<DrawerBody class="nds-text-body nds-text-muted-foreground">');
    expect(saida).toContain('<Button>Remover</Button>');
  });

  it('o corpo rolável não leva altura cravada — quem rola é o corpo', () => {
    const saida = drawerComRolagemSource();
    expect(saida).toContain('<DrawerBody');
    expect(saida).not.toContain('height');
    expect(saida).not.toContain('style=');
  });
});
