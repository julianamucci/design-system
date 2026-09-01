<script lang="ts">
  import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
  } from './index';
  import {
    SITE_FIELD_ID,
    SITE_GROUP_LABEL,
    SITE_PLACEHOLDER,
    SITE_PREFIX,
    SITE_SUFFIX,
  } from './input-group.fixtures';

  /**
   * Prefixo e sufixo de formato.
   *
   * O rótulo VISÍVEL fica fora da moldura e é ele quem nomeia o campo. O
   * prefixo completa o formato do valor; ele não é o assunto do campo, e trocar
   * um pelo outro deixa o campo sem nome para o leitor de tela.
   *
   * O grupo fica SEM nome de propósito: só há um controle dentro, e nomeá-lo
   * faria o leitor de tela dizer as mesmas palavras duas vezes.
   */
</script>

<div class="nds-stack nds-w-full" data-spacing="sm">
  <label class="nds-label" for={SITE_FIELD_ID}>{SITE_GROUP_LABEL}</label>

  <InputGroup>
    <InputGroupAddon align="inline-start">
      <InputGroupText>{SITE_PREFIX}</InputGroupText>
    </InputGroupAddon>

    <InputGroupInput id={SITE_FIELD_ID} placeholder={SITE_PLACEHOLDER} />

    <InputGroupAddon align="inline-end">
      <InputGroupText>{SITE_SUFFIX}</InputGroupText>
    </InputGroupAddon>
  </InputGroup>
</div>
