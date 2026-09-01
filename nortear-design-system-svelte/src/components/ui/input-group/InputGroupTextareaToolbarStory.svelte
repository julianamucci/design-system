<script lang="ts">
  import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupTextarea,
  } from './index';
  import {
    NOTE_GROUP_LABEL,
    NOTE_PLACEHOLDER,
    SEND_LABEL,
  } from './input-group.fixtures';

  /**
   * Área de texto com barra embaixo.
   *
   * Com a área de texto dentro, o grupo empilha sozinho — não há opção de
   * direção: a folha troca linha por coluna por `:has(> textarea)`.
   *
   * O grupo tem nome porque guarda mais de um controle: o campo e o botão de
   * enviar. É exatamente o caso em que "grupo" sozinho não diria de que o botão
   * é vizinho.
   */
</script>

<InputGroup aria-label={NOTE_GROUP_LABEL}>
  <InputGroupTextarea rows={3} placeholder={NOTE_PLACEHOLDER} />

  <InputGroupAddon align="block-end">
    <InputGroupButton>{SEND_LABEL}</InputGroupButton>
  </InputGroupAddon>
</InputGroup>
