<script setup lang="ts">
/**
 * Uma barra de menus VIVA da docs page, montada a partir de uma lista de menus.
 *
 * É a mesma lista que o card de Variantes entrega a `menubarSnippet` para
 * imprimir o código ao lado: prévia e código saem de um dado só, e por isso não
 * divergem — nem de idioma, nem de estrutura, nem de estado inicial. Até
 * 2026-09-11 a página tinha, por card, uma barra escrita à mão e um literal de
 * código em português ao lado dela.
 *
 * A barra nasce FECHADA, como no vanilla: com `default-value` cada prévia
 * abriria o seu painel ao carregar a página.
 *
 * Nada de rastreio aqui dentro: a barra só AVISA — `update:modelValue` com o
 * menu aberto (ou `''`) e o motivo do fechamento que a raiz entrega, e
 * `select` com o id estável do item e o `value` do menu em que ele mora. Quem
 * sabe de que seção a prévia é, e portanto a `location`, é a docs page.
 */
import { provide, reactive } from 'vue';
import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
  type MenubarCloseReason,
} from '@/components/ui/menubar';
import type { MenubarSnippetMenu } from '@/components/ui/menubar/menubar.source';
import MenubarEntries from './MenubarEntries.vue';
import { MENU_PREVIEW, initialSelection } from './menu-preview';

const props = defineProps<{
  /** Os menus da barra — a mesma lista do código do card. */
  menus: readonly MenubarSnippetMenu[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string, reason?: MenubarCloseReason];
  select: [menu: string, value: string];
}>();

// O estado nasce UMA vez, das entradas de todos os menus: trocar de idioma
// troca os rótulos e mantém o que a pessoa marcou, porque a chave é o id
// estável e não o texto.
const initial = initialSelection(props.menus.flatMap((menu) => menu.entries));

provide(MENU_PREVIEW, {
  checked: reactive(initial.checked),
  radio: reactive(initial.radio),
  select: (value, menu) => emit('select', menu ?? '', value),
});

function onValueChange(value: string, reason?: MenubarCloseReason) {
  emit('update:modelValue', value, reason);
}
</script>

<template>
  <Menubar @update:model-value="onValueChange">
    <MenubarMenu
      v-for="menu in menus"
      :key="menu.value"
      :value="menu.value"
    >
      <MenubarTrigger>{{ menu.trigger }}</MenubarTrigger>
      <MenubarContent>
        <MenubarEntries
          :entries="menu.entries"
          :menu="menu.value"
        />
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
</template>
