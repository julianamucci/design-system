import { describe, expect, it } from 'vitest';
import {
  contextMenuWithShortcutsSource,
  contextMenuWithChoiceUnicaSource,
  contextMenuWithMarkupSource,
  contextMenuWithSubmenuSource,
  contextMenuCompletoSource,
  contextMenuItemDisabledSource,
  contextMenuItemDestructiveSource,
  contextMenuItemRecuadoSource,
  contextMenuMarkupMistaSource,
  contextMenuPaletteDarkSource,
  contextMenuSource,
} from './context-menu.source';

describe('contextMenuSource', () => {
  it('sem args, entrega a forma canônica do menu de gesto', () => {
    expect(contextMenuSource()).toBe(
      `<script setup lang="ts">
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from '@/components/ui/context-menu'
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger
      class="nds-cluster nds-w-xs nds-p-8 nds-rounded-md nds-border-default nds-border-dashed nds-text-body nds-text-muted-foreground nds-cursor-default"
      data-align="center"
      data-justify="center"
    >
      Clique com o botão direito aqui
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuGroup>
        <ContextMenuItem>
          Editar
          <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>Duplicar</ContextMenuItem>
      </ContextMenuGroup>
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive">
        Excluir
        <ContextMenuShortcut>Delete</ContextMenuShortcut>
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>`,
    );
  });

  it('a moldura leva as DUAS classes de borda e nenhuma altura', () => {
    const saida = contextMenuSource();
    // `nds-border-dashed` só troca o estilo do traço: sozinha, herda a largura
    // inicial e a cor do texto.
    expect(saida).toContain('nds-border-default nds-border-dashed');
    // O quadro nasce do padding e cresce com a fonte do navegador (WCAG 1.4.4).
    expect(saida).toContain('nds-p-8');
    expect(saida).not.toContain('height');
  });

  it('o rótulo da moldura acompanha o control', () => {
    expect(contextMenuSource('', { args: { triggerLabel: 'Botão direito no cartão' } })).toContain(
      '\n      Botão direito no cartão\n',
    );
  });

  it('só escreve `modal` quando ele é desligado — ligado é o padrão da raiz', () => {
    expect(contextMenuSource('', { args: { modal: true } })).toContain('<ContextMenu>');
    expect(contextMenuSource('', { args: { modal: false } })).toContain(
      '<ContextMenu :modal="false">',
    );
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    // `onOpenChange` é `fn()` no meta; qualquer arg pode chegar como função no
    // painel, e o corpo do mock apareceria como se fosse o exemplo.
    const saida = contextMenuSource('', { args: { triggerLabel: (() => {}) as never } });
    expect(saida).not.toContain('function');
    expect(saida).toContain('Clique com o botão direito aqui');
  });
});

describe('transforms das stories de estado', () => {
  it('o item indisponível se declara por prop, e a ação perigosa também pode estar', () => {
    const saida = contextMenuItemDisabledSource();
    expect(saida).toContain('<ContextMenuItem disabled>Duplicar</ContextMenuItem>');
    expect(saida).toContain('<ContextMenuItem variant="destructive" disabled>Excluir</ContextMenuItem>');
  });

  it('o recuo mora no rótulo e no item, e convive com a variante', () => {
    const saida = contextMenuItemRecuadoSource();
    expect(saida).toContain('<ContextMenuLabel inset>Arquivo</ContextMenuLabel>');
    expect(saida).toContain('<ContextMenuItem inset>Duplicar</ContextMenuItem>');
    expect(saida).toContain('<ContextMenuItem inset variant="destructive">Excluir</ContextMenuItem>');
    // O item vizinho fica SEM recuo: é o par que mostra o alinhamento.
    expect(saida).toContain('<ContextMenuItem>Editar</ContextMenuItem>');
  });

  it('o item neutro não escreve a variante padrão', () => {
    const saida = contextMenuItemDestructiveSource();
    expect(saida).toContain('<ContextMenuItem variant="destructive">');
    expect(saida).not.toContain('variant="default"');
  });

  it('os três estados da marcação aparecem lado a lado', () => {
    const saida = contextMenuMarkupMistaSource();
    // Misto é um valor entregue, não um booleano: uma comparação frouxa o leria
    // como marcado.
    expect(saida).toContain('<ContextMenuCheckboxItem checked="indeterminate">Colunas');
    expect(saida).toContain('<ContextMenuCheckboxItem :checked="true">Régua');
    expect(saida).toContain('<ContextMenuCheckboxItem :checked="false">Grade');
    // A prop é `checked`; `model-value` é da lib por baixo e o item não a lê.
    expect(saida).not.toContain('model-value');
  });

  it('a paleta escura não muda uma linha do markup', () => {
    const saida = contextMenuPaletteDarkSource();
    // A troca é global, por classe no documento: nada de prop de tema no menu.
    expect(saida).not.toContain('dark');
    expect(saida).not.toContain('theme');
    expect(saida).toContain('<ContextMenuItem disabled>Duplicar</ContextMenuItem>');
  });
});

describe('transforms das stories de composição', () => {
  it('o atalho mora DENTRO do item, e não ao lado dele', () => {
    const saida = contextMenuWithShortcutsSource();
    expect(saida).toContain(`      <ContextMenuItem>
        Desfazer
        <ContextMenuShortcut>Ctrl+Z</ContextMenuShortcut>
      </ContextMenuItem>`);
  });

  it('a marcação liga o par completo: prop de entrada e evento de volta', () => {
    const saida = contextMenuWithMarkupSource();
    expect(saida).toContain(`import { ref } from 'vue'`);
    expect(saida).toContain('const mostrarReguas = ref(true)');
    // Só `:checked` prenderia o item ao valor inicial.
    expect(saida).toContain('<ContextMenuCheckboxItem v-model:checked="mostrarGrade">');
    expect(saida).not.toContain('<ContextMenuCheckboxItem :checked=');
  });

  it('na escolha única o valor vive no grupo, e cada item traz o seu `value`', () => {
    const saida = contextMenuWithChoiceUnicaSource();
    expect(saida).toContain(`const layout = ref('grid')`);
    expect(saida).toContain('<ContextMenuRadioGroup v-model="layout">');
    expect(saida).toContain('<ContextMenuRadioItem value="columns">Colunas</ContextMenuRadioItem>');
  });

  it('o submenu é a tríade completa, com o conteúdo dentro dela', () => {
    const saida = contextMenuWithSubmenuSource();
    expect(saida).toContain(`      <ContextMenuSub>
        <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuItem>Por e-mail</ContextMenuItem>
          <ContextMenuItem>Por link</ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>`);
  });

  it('o menu completo põe as três famílias de item em grupos nomeados', () => {
    const saida = contextMenuCompletoSource();
    expect(saida).toContain('<ContextMenuLabel>Ações</ContextMenuLabel>');
    expect(saida).toContain('<ContextMenuLabel>Visualização</ContextMenuLabel>');
    expect(saida).toContain('<ContextMenuLabel>Layout</ContextMenuLabel>');
    // Três grupos, três separadores entre eles e a ação perigosa no fim.
    expect([...saida.matchAll(/<ContextMenuSeparator \/>/g)].length).toBe(3);
    expect([...saida.matchAll(/<ContextMenuGroup>/g)].length).toBe(3);
  });
});
