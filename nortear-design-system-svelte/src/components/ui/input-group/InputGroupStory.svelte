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
    INVALID_FIELD_ID,
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
    /**
     * Rótulo VISÍVEL do campo. Ausente, o campo fica com o nome que a
     * composição lhe der — que pode ser nenhum.
     *
     * Ele existe porque descrever não é nomear: com `aria-describedby` ligado e
     * sem nome, o axe reprova em `label-title-only` e o leitor de tela anuncia
     * a mensagem de erro de um campo anônimo. O nome do GRUPO não substitui o
     * do campo: aquele pertence ao conjunto campo + botão.
     */
    fieldLabel?: string;
  }

  let {
    ariaLabel,
    placeholder = SITE_PLACEHOLDER,
    multiline = false,
    rows = 2,
    disabled = false,
    invalid = false,
    fieldLabel,
  }: Props = $props();

  // Estado é palavra, nunca só cor: os dois atributos vão no CAMPO e apontam
  // para o texto que descreve o problema. A moldura vermelha é o eco disso.
  const invalidAttribute = $derived(invalid ? 'true' : undefined);
  const describedBy = $derived(invalid ? INVALID_MESSAGE_ID : undefined);
</script>

<div class="nds-stack nds-w-full" data-spacing="sm">
  {#if fieldLabel}
    <!-- O rótulo VISÍVEL nomeia o campo. Sem ele, num campo que liga mensagem
         de erro, o único candidato a nome é o `aria-describedby` — e descrição
         não é nome: o axe reprova em `label-title-only`, e o leitor de tela
         anuncia "campo de edição, Endereço inválido", que conta o problema sem
         dizer de que campo é. -->
    <label class="nds-label" for={INVALID_FIELD_ID}>{fieldLabel}</label>
  {/if}

  <InputGroup aria-label={ariaLabel}>
    <InputGroupAddon align="inline-start">
      <InputGroupText>{SITE_PREFIX}</InputGroupText>
    </InputGroupAddon>

    {#if multiline}
      <InputGroupTextarea
        id={fieldLabel ? INVALID_FIELD_ID : undefined}
        {placeholder}
        {rows}
        {disabled}
        aria-invalid={invalidAttribute}
        aria-describedby={describedBy}
      />
    {:else}
      <InputGroupInput
        id={fieldLabel ? INVALID_FIELD_ID : undefined}
        {placeholder}
        {disabled}
        aria-invalid={invalidAttribute}
        aria-describedby={describedBy}
      />
    {/if}

    <InputGroupAddon align="inline-end">
      <!-- O `disabled` do grupo alcança o BOTÃO, e não só o campo.
           Ele chegava só ao controle: a moldura esmaecia inteira pela folha
           (`:has(:disabled)`) e ainda entregava um "Colar" que recebia Tab,
           respondia ao clique e reprovava contraste — porque o axe só isenta
           quem está desabilitado de verdade. Aparência de inativo com um
           controle vivo dentro é a pior das duas. -->
      <InputGroupButton {disabled}>{PASTE_LABEL}</InputGroupButton>
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
