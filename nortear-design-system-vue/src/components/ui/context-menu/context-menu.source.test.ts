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
  contextMenuSnippet,
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
      <ContextMenuItem>
        Editar
        <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem>Duplicar</ContextMenuItem>
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

  it('cada `show*` desligado tira a peça do snippet, e o import acompanha', () => {
    // O snippet é o da prévia: um trecho com a peça que a tela não desenha
    // ensinaria outro menu.
    const noShortcuts = contextMenuSource('', { args: { showShortcuts: false } });
    expect(noShortcuts).not.toContain('ContextMenuShortcut');
    expect(noShortcuts).toContain('<ContextMenuItem>Editar</ContextMenuItem>');

    const noSeparator = contextMenuSource('', { args: { showSeparator: false } });
    expect(noSeparator).not.toContain('ContextMenuSeparator');
    expect(noSeparator).toContain('variant="destructive"');

    const noDestructive = contextMenuSource('', { args: { showDestructive: false } });
    expect(noDestructive).not.toContain('Excluir');
    expect(noDestructive).not.toContain('Delete');
    expect(noDestructive).toContain('<ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>');
  });

  it('não abre grupo em volta das ações — grupo sem rótulo não tem nome', () => {
    // A lib escreve `aria-labelledby` em todo grupo; sem rótulo dentro, ele
    // aponta para um id que não existe. O Vanilla só abre grupo onde há rótulo.
    for (const args of [{}, { showShortcuts: false }, { showSeparator: false }]) {
      expect(contextMenuSource('', { args })).not.toContain('ContextMenuGroup');
    }
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
    // Sem atalho, como na prévia: o assunto é o item indisponível.
    expect(saida).not.toContain('ContextMenuShortcut');
    // E sem grupo: não há rótulo que o nomeie.
    expect(saida).not.toContain('ContextMenuGroup');
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
    expect(saida).not.toContain('ContextMenuGroup');
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

  it('o rótulo da marcação mora DENTRO do grupo que ele nomeia', () => {
    const saida = contextMenuMarkupMistaSource();
    expect(saida).toContain(`      <ContextMenuGroup>
        <ContextMenuLabel>Mostrar na tela</ContextMenuLabel>`);
    expect(saida).toContain('ContextMenuGroup,');
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
    // Os mesmos estados iniciais da prévia: grade desmarcada, réguas marcadas.
    expect(saida).toContain('const showGrid = ref(false)\nconst showRulers = ref(true)');
    // Só `:checked` prenderia o item ao valor inicial.
    expect(saida).toContain('<ContextMenuCheckboxItem v-model:checked="showGrid">');
    expect(saida).not.toContain('<ContextMenuCheckboxItem :checked=');
  });

  it('na escolha única o valor vive no grupo, e cada item traz o seu `value`', () => {
    const saida = contextMenuWithChoiceUnicaSource();
    expect(saida).toContain(`const layout = ref('grid')`);
    expect(saida).toContain('<ContextMenuRadioGroup v-model="layout">');
    expect(saida).toContain('<ContextMenuRadioItem value="columns">Colunas</ContextMenuRadioItem>');
  });

  it('na escolha única há UM grupo só: o de rádio, com o rótulo dentro dele', () => {
    // O grupo de rádio já é um grupo por baixo. Um `ContextMenuGroup` em volta
    // seria o segundo, e o de dentro ficaria com `aria-labelledby` pendurado —
    // o rótulo pegaria o id do grupo de fora.
    const saida = contextMenuWithChoiceUnicaSource();
    expect(saida).not.toContain('ContextMenuGroup');
    expect(saida).toContain(`      <ContextMenuRadioGroup v-model="layout">
        <ContextMenuLabel>Layout</ContextMenuLabel>
        <ContextMenuRadioItem value="grid">Grade</ContextMenuRadioItem>`);
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
    // Três grupos, três separadores entre eles e a ação perigosa no fim. O de
    // escolha única é o próprio grupo de rádio, e o rótulo mora dentro dele.
    expect([...saida.matchAll(/<ContextMenuSeparator \/>/g)].length).toBe(3);
    expect([...saida.matchAll(/<ContextMenuGroup>/g)].length).toBe(2);
    expect(saida).toContain(`<ContextMenuRadioGroup v-model="layout">
        <ContextMenuLabel>Layout</ContextMenuLabel>`);
    // Um `ref` por `v-model`, na ordem em que aparecem.
    expect(saida).toContain(`const showGrid = ref(true)\nconst layout = ref('grid')`);
  });
});

describe('contextMenuSnippet — o menu descrito por dados', () => {
  it('imprime os rótulos que recebe: o código diz o que a prévia diz, em qualquer idioma', () => {
    const saida = contextMenuSnippet({
      triggerLabel: 'Right-click here',
      entries: [
        { kind: 'item', label: 'Edit' },
        { kind: 'separator' },
        { kind: 'item', label: 'Delete', destructive: true },
      ],
    });
    expect(saida).toContain('\n      Right-click here\n');
    expect(saida).toContain('<ContextMenuItem>Edit</ContextMenuItem>');
    expect(saida).toContain('<ContextMenuItem variant="destructive">Delete</ContextMenuItem>');
    expect(saida).not.toContain('Editar');
    expect(saida).not.toContain('Clique com o botão direito aqui');
  });

  it('importa só as peças usadas, e só declara `ref` quando há `v-model`', () => {
    const saida = contextMenuSnippet({ entries: [{ kind: 'item', label: 'Edit' }] });
    expect(saida).toContain(`import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/context-menu'`);
    expect(saida).not.toContain(`from 'vue'`);
  });

  it('o rótulo recuado leva `inset`, e o grupo sempre tem rótulo', () => {
    const saida = contextMenuSnippet({
      entries: [
        {
          kind: 'group',
          label: 'Actions',
          inset: true,
          entries: [{ kind: 'item', label: 'Edit', inset: true }],
        },
      ],
    });
    expect(saida).toContain(`      <ContextMenuGroup>
        <ContextMenuLabel inset>Actions</ContextMenuLabel>
        <ContextMenuItem inset>Edit</ContextMenuItem>
      </ContextMenuGroup>`);
  });
});
