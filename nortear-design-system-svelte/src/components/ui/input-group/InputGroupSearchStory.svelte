<script lang="ts">
  import Search from '@lucide/svelte/icons/search';
  import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
  } from './index';
  import {
    SEARCH_GROUP_LABEL,
    SEARCH_PLACEHOLDER,
    SEARCH_SHORTCUT,
  } from './input-group.fixtures';

  /**
   * Busca: ícone antes, atalho de teclado depois.
   *
   * O ícone é decoração e fica fora da árvore de acessibilidade — o que ele
   * ilustra já está no nome do grupo e no rótulo do campo. O atalho é TEXTO:
   * `⌘K` informa, ele não age, e um botão ali prometeria uma ação que o
   * componente não tem.
   *
   * O grupo tem nome porque a busca é um conjunto, e não só um campo.
   */
</script>

<InputGroup aria-label={SEARCH_GROUP_LABEL}>
  <InputGroupAddon align="inline-start">
    <Search aria-hidden="true" />
  </InputGroupAddon>

  <InputGroupInput placeholder={SEARCH_PLACEHOLDER} />

  <InputGroupAddon align="inline-end">
    <InputGroupText>{SEARCH_SHORTCUT}</InputGroupText>
  </InputGroupAddon>
</InputGroup>
