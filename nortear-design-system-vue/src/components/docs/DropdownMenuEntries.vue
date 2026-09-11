<script setup lang="ts">
/**
 * As entradas de um menu vivo da docs page do DropdownMenu, desenhadas a partir
 * da MESMA lista que imprime o código do card (`dropdownMenuSnippet`).
 *
 * Recursiva: o grupo e o submenu desenham as entradas de dentro com ela mesma.
 * O estado das marcações e das escolhas únicas, e o aviso de item escolhido,
 * chegam da prévia que a contém (`DropdownMenuPreview.vue`) por `inject`.
 *
 * O rótulo mora DENTRO do grupo que ele nomeia — é o `aria-labelledby` do
 * grupo que liga os dois —, e o grupo de escolha única é UM grupo só, com o
 * rótulo dentro dele: um grupo comum em volta criaria um segundo, anônimo.
 */
import { inject } from 'vue';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import type { DropdownMenuSnippetEntry } from '@/components/ui/dropdown-menu/dropdown-menu.source';
import { MENU_PREVIEW, type MenuPreviewContext } from './menu-preview';

defineProps<{ entries: readonly DropdownMenuSnippetEntry[] }>();

const injected = inject(MENU_PREVIEW, null);
if (!injected) throw new Error('DropdownMenuEntries precisa estar dentro de um DropdownMenuPreview');
const preview: MenuPreviewContext = injected;
</script>

<template>
  <template
    v-for="(entry, index) in entries"
    :key="index"
  >
    <DropdownMenuSeparator v-if="entry.kind === 'separator'" />
    <DropdownMenuItem
      v-else-if="entry.kind === 'item'"
      :variant="entry.destructive ? 'destructive' : 'default'"
      @select="preview.select(entry.value)"
    >
      {{ entry.label }}
      <DropdownMenuShortcut v-if="entry.shortcut">
        {{ entry.shortcut }}
      </DropdownMenuShortcut>
    </DropdownMenuItem>
    <!--
      Marcar também é escolher: o aviso de item sai aqui, com o id da marcação.
      O menu segue aberto (C10) — quem fecha é outro gesto, e o motivo do
      fechamento é o dele.
    -->
    <DropdownMenuCheckboxItem
      v-else-if="entry.kind === 'checkbox'"
      v-model="preview.checked[entry.value]"
      @select="preview.select(entry.value)"
    >
      {{ entry.label }}
    </DropdownMenuCheckboxItem>
    <!--
      O sub-gatilho não tem ação própria: ele abre o painel filho, e é lá que
      estão os itens que a pessoa veio escolher.
    -->
    <DropdownMenuSub v-else-if="entry.kind === 'submenu'">
      <DropdownMenuSubTrigger>{{ entry.label }}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuEntries :entries="entry.items" />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuGroup v-else-if="entry.kind === 'group'">
      <DropdownMenuLabel>{{ entry.label }}</DropdownMenuLabel>
      <DropdownMenuEntries :entries="entry.items" />
    </DropdownMenuGroup>
    <DropdownMenuRadioGroup
      v-else-if="entry.kind === 'radio-group'"
      v-model="preview.radio[entry.value]"
    >
      <DropdownMenuLabel>{{ entry.label }}</DropdownMenuLabel>
      <DropdownMenuRadioItem
        v-for="option in entry.options"
        :key="option.value"
        :value="option.value"
        @select="preview.select(option.value)"
      >
        {{ option.label }}
      </DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </template>
</template>
