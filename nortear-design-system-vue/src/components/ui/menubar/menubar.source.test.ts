import { describe, expect, it } from 'vitest';
import {
  menubarOpenSource,
  menubarCheckboxCheckedSource,
  menubarCheckboxMistoSource,
  menubarWithShortcutsSource,
  menubarWithCheckboxSource,
  menubarWithRadioSource,
  menubarWithSubmenuSource,
  menubarEditorCompletoSource,
  menubarClosedSource,
  menubarItemBloqueadoSource,
  menubarItemDefaultSource,
  menubarItemDestructiveSource,
  menubarSource,
} from './menubar.source';

describe('menubarSource', () => {
  it('sem args, entrega a barra canônica com um menu por categoria', () => {
    expect(menubarSource()).toBe(
      `<script setup lang="ts">
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar'

type Menu = {
  value: string
  label: string
  itens: { label: string; atalho?: string }[]
}

const menus: Menu[] = [
  {
    value: 'file',
    label: 'Arquivo',
    itens: [
      { label: 'Novo', atalho: '⌘N' },
      { label: 'Abrir', atalho: '⌘O' },
      { label: 'Salvar', atalho: '⌘S' },
    ],
  },
  {
    value: 'edit',
    label: 'Editar',
    itens: [
      { label: 'Desfazer', atalho: '⌘Z' },
      { label: 'Refazer', atalho: '⇧⌘Z' },
      { label: 'Copiar', atalho: '⌘C' },
    ],
  },
  {
    value: 'view',
    label: 'Exibir',
    itens: [{ label: 'Aproximar' }, { label: 'Afastar' }, { label: 'Tela cheia' }],
  },
  {
    value: 'help',
    label: 'Ajuda',
    itens: [{ label: 'Documentação' }, { label: 'Atalhos de teclado' }],
  },
]
</script>

<template>
  <Menubar>
    <MenubarMenu v-for="m in menus" :key="m.value" :value="m.value">
      <MenubarTrigger>{{ m.label }}</MenubarTrigger>
      <MenubarContent>
        <MenubarItem v-for="i in m.itens" :key="i.label">
          {{ i.label }}
          <MenubarShortcut v-if="i.atalho">{{ i.atalho }}</MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
</template>`,
    );
  });

  it('o menu aberto na montagem casa com o `value` de um dos menus', () => {
    expect(menubarSource('', { args: { defaultValue: 'edit' } })).toContain(
      '<Menubar default-value="edit">',
    );
  });

  it('não escreve o padrão: barra fechada e volta da seta já são o de fábrica', () => {
    const saida = menubarSource('', { args: { defaultValue: '', loop: true } });
    expect(saida).toContain('<Menubar>');
    expect(saida).not.toContain('default-value=');
    expect(saida).not.toContain('loop');
  });

  it('desligar a volta da seta é o que precisa ser escrito', () => {
    expect(menubarSource('', { args: { loop: false } })).toContain('<Menubar :loop="false">');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    // `onUpdate:modelValue` chega como espião do Storybook, e `defaultValue`
    // chegaria como função se alguém trocasse o control: nenhum dos dois pode
    // atravessar para o markup.
    const saida = menubarSource('', {
      args: { defaultValue: (() => {}) as never, loop: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('default-value=');
    expect(saida).not.toContain('loop');
  });
});

describe('transforms das stories de variante', () => {
  it('o item neutro não escreve a própria ênfase', () => {
    const saida = menubarItemDefaultSource();
    expect(saida).toContain(`const itens = ['Novo', 'Abrir', 'Salvar']`);
    expect(saida).not.toContain('variant=');
  });

  it('o item de perigo declara a ênfase e ganha um separador antes', () => {
    const saida = menubarItemDestructiveSource();
    expect(saida).toContain('<MenubarSeparator />');
    expect(saida).toContain('<MenubarItem variant="destructive">Descartar alterações</MenubarItem>');
    // O item vizinho continua neutro: a ênfase é do item, não do menu.
    expect(saida).toContain('<MenubarItem>Salvar</MenubarItem>');
  });
});

describe('transforms das stories de estado', () => {
  it('fechado é ausência: nenhuma prop declara o estado', () => {
    const saida = menubarClosedSource();
    expect(saida).toContain('<Menubar>');
    expect(saida).not.toContain('default-value=');
    expect(saida).not.toContain('open');
  });

  it('aberto na montagem é presença de `default-value` casando com o menu', () => {
    const saida = menubarOpenSource();
    expect(saida).toContain('<Menubar default-value="file">');
    expect(saida).toContain('<MenubarMenu value="file">');
  });

  it('o bloqueio mora no item, e é `:disabled` — nunca no menu inteiro', () => {
    const saida = menubarItemBloqueadoSource();
    expect(saida).toContain(':disabled="i.disabled"');
    expect(saida).toContain(`{ label: 'Enviar para revisão', disabled: true }`);
    expect(saida).not.toContain('<Menubar :disabled');
  });

  it('a marcação usa `checked`/`@update:checked` sobre estado reativo', () => {
    const saida = menubarCheckboxCheckedSource();
    // A lib por baixo ignora prop desconhecida em silêncio: é `checked` que a
    // API do design system expõe, e é ele que o snippet tem que ensinar.
    expect(saida).toContain(':checked="marcado"');
    expect(saida).toContain('@update:checked="estado[nome] = $event"');
    expect(saida).toContain(`import { reactive } from 'vue'`);
    expect(saida).not.toContain('model-value');
  });

  it('o misto é um terceiro valor, escrito como string literal', () => {
    const saida = menubarCheckboxMistoSource();
    expect(saida).toContain('<MenubarCheckboxItem checked="indeterminate">Colunas');
    // Os três estados no mesmo painel: sem os vizinhos não se vê que o misto é
    // outro valor, e não um marcado esquisito.
    expect(saida).toContain(':checked="true"');
    expect(saida).toContain(':checked="false"');
  });
});

describe('transforms das stories de composição', () => {
  it('o atalho é filho do item, e não se esconde do leitor', () => {
    const saida = menubarWithShortcutsSource();
    expect(saida).toContain('<MenubarShortcut>{{ a.atalho }}</MenubarShortcut>');
    // "Desfazer ⌘Z" é o nome acessível inteiro; escondê-lo devolveria só o
    // rótulo e o atalho não serviria para quem não enxerga a tela.
    expect(saida).not.toContain('aria-hidden');
  });

  it('o submenu embrulha o par gatilho/painel dentro do painel do pai', () => {
    const saida = menubarWithSubmenuSource();
    expect(saida).toContain('<MenubarSub>');
    expect(saida).toContain('<MenubarSubTrigger>Exportar</MenubarSubTrigger>');
    expect(saida).toContain('<MenubarSubContent>');
    expect(saida).toContain(`const exportacoes = ['PDF', 'CSV', 'PNG']`);
  });

  it('os alternadores vivem em grupo rotulado, cada um com o próprio estado', () => {
    const saida = menubarWithCheckboxSource();
    expect(saida).toContain('<MenubarGroup>');
    expect(saida).toContain('<MenubarLabel>Mostrar na tela</MenubarLabel>');
    expect(saida).toContain('@update:checked="estado[e] = $event"');
  });

  it('na escolha única o valor mora no GRUPO, e a opção só declara o seu', () => {
    const saida = menubarWithRadioSource();
    expect(saida).toContain('<MenubarRadioGroup v-model="tema">');
    expect(saida).toContain(':value="t.valor"');
    // Um `v-model` por item transformaria escolha única em três alternadores.
    expect(saida).not.toContain('<MenubarRadioItem v-model');
  });

  it('a barra completa junta grupo, separador, atalho e alternador', () => {
    const saida = menubarEditorCompletoSource();
    for (const menu of ['file', 'edit', 'view', 'help']) {
      expect(saida).toContain(`<MenubarMenu value="${menu}">`);
    }
    expect(saida).toContain('<MenubarSeparator />');
    expect(saida).toContain('<MenubarShortcut>⌘N</MenubarShortcut>');
    expect(saida).toContain('<MenubarCheckboxItem :checked="true">Régua</MenubarCheckboxItem>');
    // A barra nasce fechada: nenhum dos quatro menus abre na montagem.
    expect(saida).toContain('<Menubar>');
  });
});

describe('o snippet ensina o design system, não o andaime da story', () => {
  const todas = [
    menubarSource,
    menubarItemDefaultSource,
    menubarItemDestructiveSource,
    menubarClosedSource,
    menubarOpenSource,
    menubarItemBloqueadoSource,
    menubarCheckboxCheckedSource,
    menubarCheckboxMistoSource,
    menubarWithShortcutsSource,
    menubarWithSubmenuSource,
    menubarWithCheckboxSource,
    menubarWithRadioSource,
    menubarEditorCompletoSource,
  ];

  it('nenhuma traz a moldura de contenção que existe só para a foto do Chromatic', () => {
    for (const fn of todas) {
      const saida = fn();
      expect(saida).not.toContain('contain: layout');
      expect(saida).not.toContain('min-height');
    }
  });

  it('todas importam do design system, nunca de um caminho interno', () => {
    for (const fn of todas) {
      expect(fn()).toContain(`from '@/components/ui/menubar'`);
    }
  });
});
