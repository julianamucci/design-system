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
  menubarSnippet,
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
      { label: 'Novo', atalho: 'Ctrl+N' },
      { label: 'Abrir', atalho: 'Ctrl+O' },
      { label: 'Salvar', atalho: 'Ctrl+S' },
    ],
  },
  {
    value: 'edit',
    label: 'Editar',
    itens: [
      { label: 'Desfazer', atalho: 'Ctrl+Z' },
      { label: 'Refazer', atalho: 'Ctrl+Shift+Z' },
      { label: 'Copiar', atalho: 'Ctrl+C' },
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
    const output = menubarSource('', { args: { defaultValue: '', loop: true } });
    expect(output).toContain('<Menubar>');
    expect(output).not.toContain('default-value=');
    expect(output).not.toContain('loop');
  });

  it('desligar a volta da seta é o que precisa ser escrito', () => {
    expect(menubarSource('', { args: { loop: false } })).toContain('<Menubar :loop="false">');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    // `onUpdate:modelValue` chega como espião do Storybook, e `defaultValue`
    // chegaria como função se alguém trocasse o control: nenhum dos dois pode
    // atravessar para o markup.
    const output = menubarSource('', {
      args: { defaultValue: (() => {}) as never, loop: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    expect(output).not.toContain('default-value=');
    expect(output).not.toContain('loop');
  });
});

describe('transforms das stories de variante', () => {
  it('o item neutro não escreve a própria ênfase', () => {
    const output = menubarItemDefaultSource();
    expect(output).toContain(`const itens = ['Novo', 'Abrir', 'Salvar']`);
    expect(output).not.toContain('variant=');
  });

  it('o item de perigo declara a ênfase e ganha um separador antes', () => {
    const output = menubarItemDestructiveSource();
    expect(output).toContain('<MenubarSeparator />');
    expect(output).toContain('<MenubarItem variant="destructive">Descartar alterações</MenubarItem>');
    // O item vizinho continua neutro: a ênfase é do item, não do menu.
    expect(output).toContain('<MenubarItem>Salvar</MenubarItem>');
  });
});

describe('transforms das stories de estado', () => {
  it('fechado é ausência: nenhuma prop declara o estado', () => {
    const output = menubarClosedSource();
    expect(output).toContain('<Menubar>');
    expect(output).not.toContain('default-value=');
    expect(output).not.toContain('open');
  });

  it('aberto na montagem é presença de `default-value` casando com o menu', () => {
    const output = menubarOpenSource();
    expect(output).toContain('<Menubar default-value="file">');
    expect(output).toContain('<MenubarMenu value="file">');
  });

  it('o bloqueio mora no item, e é `:disabled` — nunca no menu inteiro', () => {
    const output = menubarItemBloqueadoSource();
    expect(output).toContain(':disabled="i.disabled"');
    expect(output).toContain(`{ label: 'Enviar para revisão', disabled: true }`);
    expect(output).not.toContain('<Menubar :disabled');
  });

  it('a marcação usa `checked`/`@update:checked` sobre estado reativo', () => {
    const output = menubarCheckboxCheckedSource();
    // A lib por baixo ignora prop desconhecida em silêncio: é `checked` que a
    // API do design system expõe, e é ele que o snippet tem que ensinar.
    expect(output).toContain(':checked="marcado"');
    expect(output).toContain('@update:checked="estado[nome] = $event"');
    expect(output).toContain(`import { reactive } from 'vue'`);
    expect(output).not.toContain('model-value');
  });

  it('o misto é um terceiro valor, escrito como string literal', () => {
    const output = menubarCheckboxMistoSource();
    expect(output).toContain('<MenubarCheckboxItem checked="indeterminate">Colunas');
    // Os três estados no mesmo painel: sem os vizinhos não se vê que o misto é
    // outro valor, e não um marcado esquisito.
    expect(output).toContain(':checked="true"');
    expect(output).toContain(':checked="false"');
  });
});

describe('transforms das stories de composição', () => {
  it('o atalho é filho do item, e não se esconde do leitor', () => {
    const output = menubarWithShortcutsSource();
    expect(output).toContain('<MenubarShortcut>{{ a.atalho }}</MenubarShortcut>');
    // "Desfazer Ctrl+Z" é o nome acessível inteiro; escondê-lo devolveria só o
    // rótulo e o atalho não serviria para quem não enxerga a tela.
    expect(output).not.toContain('aria-hidden');
  });

  it('o submenu embrulha o par gatilho/painel dentro do painel do pai', () => {
    const output = menubarWithSubmenuSource();
    expect(output).toContain('<MenubarSub>');
    expect(output).toContain('<MenubarSubTrigger>Exportar</MenubarSubTrigger>');
    expect(output).toContain('<MenubarSubContent>');
    expect(output).toContain(`const exportacoes = ['PDF', 'CSV', 'PNG']`);
  });

  it('os alternadores vivem em grupo rotulado, cada um com o próprio estado', () => {
    const output = menubarWithCheckboxSource();
    expect(output).toContain('<MenubarGroup>');
    expect(output).toContain('<MenubarLabel>Mostrar na tela</MenubarLabel>');
    expect(output).toContain('@update:checked="estado[e] = $event"');
  });

  it('na escolha única o valor mora no GRUPO, e a opção só declara o seu', () => {
    const output = menubarWithRadioSource();
    expect(output).toContain('<MenubarRadioGroup v-model="tema">');
    expect(output).toContain(':value="t.valor"');
    // Um `v-model` por item transformaria escolha única em três alternadores.
    expect(output).not.toContain('<MenubarRadioItem v-model');
  });

  it('a barra completa junta grupo, separador, atalho e alternador', () => {
    const output = menubarEditorCompletoSource();
    for (const menu of ['file', 'edit', 'view', 'help']) {
      expect(output).toContain(`<MenubarMenu value="${menu}">`);
    }
    expect(output).toContain('<MenubarSeparator />');
    expect(output).toContain('<MenubarShortcut>Ctrl+N</MenubarShortcut>');
    expect(output).toContain('<MenubarCheckboxItem :checked="true">Régua</MenubarCheckboxItem>');
    // A barra nasce fechada: nenhum dos quatro menus abre na montagem.
    expect(output).toContain('<Menubar>');
  });
});

describe('o snippet ensina o design system, não o andaime da story', () => {
  const all = [
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
    for (const fn of all) {
      const output = fn();
      expect(output).not.toContain('contain: layout');
      expect(output).not.toContain('min-height');
    }
  });

  it('todas importam do design system, nunca de um caminho interno', () => {
    for (const fn of all) {
      expect(fn()).toContain(`from '@/components/ui/menubar'`);
    }
  });
});

describe('menubarSnippet — a barra descrita por dados', () => {
  it('imprime os rótulos que recebe: o código diz o que a prévia diz, em qualquer idioma', () => {
    const output = menubarSnippet({
      menus: [
        {
          value: 'file',
          trigger: 'File',
          entries: [
            { kind: 'item', label: 'Save', value: 'save' },
            { kind: 'separator' },
            { kind: 'item', label: 'Delete file', value: 'delete-file', destructive: true },
          ],
        },
      ],
    });
    expect(output).toContain('<MenubarMenu value="file">');
    expect(output).toContain('<MenubarTrigger>File</MenubarTrigger>');
    expect(output).toContain('<MenubarItem variant="destructive">Delete file</MenubarItem>');
    expect(output).not.toContain('Arquivo');
    // `loop` já nasce ligado no wrapper: o trecho não repete o padrão.
    expect(output).not.toContain('loop');
    expect(output).toContain('  <Menubar>\n');
  });

  it('declara o ESTADO INICIAL de cada marcação e da escolha única, com o nome do id estável', () => {
    const output = menubarSnippet({
      menus: [
        {
          value: 'view',
          trigger: 'View',
          entries: [
            {
              kind: 'group',
              label: 'Panels',
              items: [
                { kind: 'checkbox', label: 'Sidebar', value: 'sidebar', checked: true },
                { kind: 'checkbox', label: 'Show ruler', value: 'show-ruler', checked: false },
              ],
            },
          ],
        },
        {
          value: 'theme',
          trigger: 'Theme',
          entries: [
            {
              kind: 'radio-group',
              label: 'Appearance',
              value: 'theme',
              selected: 'dark',
              options: [
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
              ],
            },
          ],
        },
      ],
    });
    expect(output).toContain(`import { ref } from 'vue'

const sidebar = ref(true)
const showRuler = ref(false)
const theme = ref('dark')`);
    // A API desta stack: `checked` com `v-model:checked`, não `modelValue`.
    expect(output).toContain('<MenubarCheckboxItem v-model:checked="showRuler">');
    expect(output).toContain(`        <MenubarRadioGroup v-model="theme">
          <MenubarLabel>Appearance</MenubarLabel>`);
  });

  it('o grupo de escolha única sem rótulo não inventa um', () => {
    const output = menubarSnippet({
      menus: [
        {
          value: 'tools',
          trigger: 'Tools',
          entries: [
            {
              kind: 'radio-group',
              value: 'theme',
              selected: 'system-theme',
              options: [{ label: 'System', value: 'system-theme' }],
            },
          ],
        },
      ],
    });
    expect(output).not.toContain('MenubarLabel');
    expect(output).toContain(`const theme = ref('system-theme')`);
  });

  it('submenu dentro de submenu sai aninhado, com a tríade em cada nível', () => {
    const output = menubarSnippet({
      menus: [
        {
          value: 'file',
          trigger: 'File',
          entries: [
            {
              kind: 'submenu',
              label: 'Export',
              items: [{ kind: 'submenu', label: 'Format', items: [{ kind: 'item', label: 'PDF', value: 'pdf' }] }],
            },
          ],
        },
      ],
    });
    expect(output.match(/<MenubarSub>/g)).toHaveLength(2);
    expect(output).toContain('<MenubarSubTrigger>Format</MenubarSubTrigger>');
  });

  it('sem args, a barra canônica, e o import só com as peças usadas', () => {
    const output = menubarSnippet();
    expect(output).toContain(`import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar'`);
    expect(output).not.toContain(`from 'vue'`);
  });
});
