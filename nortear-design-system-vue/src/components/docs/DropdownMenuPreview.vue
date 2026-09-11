<script setup lang="ts">
/**
 * Um DropdownMenu VIVO da docs page, montado a partir de uma lista de entradas.
 *
 * É a mesma lista que o card de Variantes entrega a `dropdownMenuSnippet` para
 * imprimir o código ao lado: prévia e código saem de um dado só, e por isso não
 * divergem — nem de idioma, nem de estrutura, nem de estado inicial. Até
 * 2026-09-11 a página tinha, por card, um menu escrito à mão e um literal de
 * código em português ao lado dele.
 *
 * Nada de rastreio aqui dentro: a prévia só AVISA — `update:open` com o motivo
 * que a raiz entrega, e `select` com o id estável do item. Quem sabe de que
 * seção a prévia é, e portanto a `location`, é a docs page que a monta.
 */
import { provide, reactive } from 'vue';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  type DropdownMenuCloseReason,
} from '@/components/ui/dropdown-menu';
import type { DropdownMenuSnippetEntry } from '@/components/ui/dropdown-menu/dropdown-menu.source';
import { Button, type ButtonVariants } from '@/components/ui/button';
import DropdownMenuEntries from './DropdownMenuEntries.vue';
import { MENU_PREVIEW, initialSelection } from './menu-preview';

const props = withDefaults(
  defineProps<{
    /** Texto do botão que abre o menu. */
    trigger: string;
    /** O menu como lista de entradas — a mesma do código do card. */
    entries: readonly DropdownMenuSnippetEntry[];
    size?: ButtonVariants['size'];
  }>(),
  { size: 'default' },
);

const emit = defineEmits<{
  'update:open': [open: boolean, reason?: DropdownMenuCloseReason];
  select: [value: string];
}>();

// O estado nasce UMA vez, das entradas: trocar de idioma troca os rótulos e
// mantém o que a pessoa marcou, porque a chave é o id estável e não o texto.
const initial = initialSelection(props.entries);

provide(MENU_PREVIEW, {
  checked: reactive(initial.checked),
  radio: reactive(initial.radio),
  select: (value) => emit('select', value),
});

function onOpenChange(open: boolean, reason?: DropdownMenuCloseReason) {
  emit('update:open', open, reason);
}
</script>

<template>
  <DropdownMenu @update:open="onOpenChange">
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        :size="size"
      >
        {{ trigger }}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      side="bottom"
      align="start"
    >
      <DropdownMenuEntries :entries="entries" />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
