<script setup lang="ts">
/**
 * As entradas de um menu da barra viva da docs page do Menubar, desenhadas a
 * partir da MESMA lista que imprime o código do card (`menubarSnippet`).
 *
 * Recursiva: o grupo e o submenu desenham as entradas de dentro com ela mesma
 * — e o submenu aceita outro submenu, que é o nível a mais que o "evite" do
 * par 2 do Do & Don't mostra vivo. O estado das marcações e das escolhas
 * únicas, e o aviso de item escolhido, chegam da barra que a contém
 * (`MenubarPreview.vue`) por `inject`; `menu` é o `value` do menu da barra em
 * que estas entradas moram, e desce pela recursão.
 */
import { inject } from 'vue';
import {
  MenubarCheckboxItem,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
} from '@/components/ui/menubar';
import type { MenubarSnippetEntry } from '@/components/ui/menubar/menubar.source';
import { MENU_PREVIEW, type MenuPreviewContext } from './menu-preview';

defineProps<{
  entries: readonly MenubarSnippetEntry[];
  /** O `value` do `MenubarMenu` em que as entradas moram. */
  menu: string;
}>();

const injected = inject(MENU_PREVIEW, null);
if (!injected) throw new Error('MenubarEntries precisa estar dentro de um MenubarPreview');
const preview: MenuPreviewContext = injected;
</script>

<template>
  <template
    v-for="(entry, index) in entries"
    :key="index"
  >
    <MenubarSeparator v-if="entry.kind === 'separator'" />
    <MenubarItem
      v-else-if="entry.kind === 'item'"
      :variant="entry.destructive ? 'destructive' : 'default'"
      @select="preview.select(entry.value, menu)"
    >
      {{ entry.label }}
      <MenubarShortcut v-if="entry.shortcut">
        {{ entry.shortcut }}
      </MenubarShortcut>
    </MenubarItem>
    <!--
      Item de marcação de verdade, com o indicador do componente — nunca glifo
      no texto. Marcar também é escolher: o aviso sai aqui, e o menu segue
      aberto (C10).
    -->
    <MenubarCheckboxItem
      v-else-if="entry.kind === 'checkbox'"
      v-model:checked="preview.checked[entry.value]"
      @select="preview.select(entry.value, menu)"
    >
      {{ entry.label }}
    </MenubarCheckboxItem>
    <MenubarSub v-else-if="entry.kind === 'submenu'">
      <MenubarSubTrigger>{{ entry.label }}</MenubarSubTrigger>
      <MenubarSubContent>
        <MenubarEntries
          :entries="entry.items"
          :menu="menu"
        />
      </MenubarSubContent>
    </MenubarSub>
    <!-- O rótulo mora DENTRO do grupo: é o que faz dele o nome do grupo. -->
    <MenubarGroup v-else-if="entry.kind === 'group'">
      <MenubarLabel>{{ entry.label }}</MenubarLabel>
      <MenubarEntries
        :entries="entry.items"
        :menu="menu"
      />
    </MenubarGroup>
    <MenubarRadioGroup
      v-else-if="entry.kind === 'radio-group'"
      v-model="preview.radio[entry.value]"
    >
      <MenubarLabel v-if="entry.label">
        {{ entry.label }}
      </MenubarLabel>
      <MenubarRadioItem
        v-for="option in entry.options"
        :key="option.value"
        :value="option.value"
        @select="preview.select(option.value, menu)"
      >
        {{ option.label }}
      </MenubarRadioItem>
    </MenubarRadioGroup>
  </template>
</template>
