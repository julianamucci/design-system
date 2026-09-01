<script lang="ts">
  import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
    InputGroupText,
    InputGroupTextarea,
  } from './index';
  import {
    INVALID_MESSAGE,
    INVALID_MESSAGE_ID,
    PASTE_LABEL,
    SITE_PLACEHOLDER,
    SITE_PREFIX,
  } from './input-group.fixtures';

  /**
   * A moldura canônica: prefixo de formato, campo e botão no fim.
   *
   * O Storybook para Svelte não aceita slot na render function, então a
   * composição inteira mora aqui e as stories mandam dados. Uma só serve à
   * Playground e às três stories de estado — repouso, inválido e desabilitado
   * são a MESMA marcação com um atributo a mais no CAMPO, e é justamente isso
   * que elas precisam mostrar. Uma cópia por estado diria o contrário.
   *
   * Os textos e o id do erro saem da fixture: escritos à mão aqui, um deles
   * diverge da asserção e nenhuma story reprova.
   */
  interface Props {
    /** Nome acessível do grupo. Ausente, o grupo não recebe nome. */
    ariaLabel?: string;
    placeholder?: string;
    /** Área de texto no lugar do campo de uma linha. A folha empilha sozinha. */
    multiline?: boolean;
    rows?: number;
    disabled?: boolean;
    /** Marca o CAMPO como inválido e o liga ao texto que descreve o problema. */
    invalid?: boolean;
  }

  let {
    ariaLabel,
    placeholder = SITE_PLACEHOLDER,
    multiline = false,
    rows = 2,
    disabled = false,
    invalid = false,
  }: Props = $props();

  // Estado é palavra, nunca só cor: os dois atributos vão no CAMPO e apontam
  // para o texto que descreve o problema. A moldura vermelha é o eco disso.
  const invalidAttribute = $derived(invalid ? 'true' : undefined);
  const describedBy = $derived(invalid ? INVALID_MESSAGE_ID : undefined);
</script>

<div class="nds-stack nds-w-full" data-spacing="sm">
  <InputGroup aria-label={ariaLabel}>
    <InputGroupAddon align="inline-start">
      <InputGroupText>{SITE_PREFIX}</InputGroupText>
    </InputGroupAddon>

    {#if multiline}
      <InputGroupTextarea
        {placeholder}
        {rows}
        {disabled}
        aria-invalid={invalidAttribute}
        aria-describedby={describedBy}
      />
    {:else}
      <InputGroupInput
        {placeholder}
        {disabled}
        aria-invalid={invalidAttribute}
        aria-describedby={describedBy}
      />
    {/if}

    <InputGroupAddon align="inline-end">
      <InputGroupButton>{PASTE_LABEL}</InputGroupButton>
    </InputGroupAddon>
  </InputGroup>

  {#if invalid}
    <!-- O texto do erro mora FORA da moldura: dentro dela ele herdaria o
         `cursor: text` do addon e disputaria a largura com o que a pessoa
         digita. -->
    <p id={INVALID_MESSAGE_ID} class="nds-text-caption nds-text-destructive">
      {INVALID_MESSAGE}
    </p>
  {/if}
</div>
