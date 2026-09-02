<script lang="ts">
  import Eye from '@lucide/svelte/icons/eye';
  import EyeOff from '@lucide/svelte/icons/eye-off';
  import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
  } from './index';
  import {
    HIDE_LABEL,
    PASSWORD_FIELD_ID,
    PASSWORD_GROUP_LABEL,
    PASSWORD_SAMPLE,
    REVEAL_LABEL,
  } from './input-group.fixtures';

  /**
   * Senha com alternância.
   *
   * O que age dentro da moldura é um BOTÃO de verdade — um bloco clicável não
   * recebe foco e some para quem navega por teclado. E o que ele fez é contado
   * pela PALAVRA: o nome acessível muda junto com o estado, porque o desenho do
   * ícone sozinho não conta nada a quem não o vê.
   *
   * O estado vive AQUI, e não no componente: a moldura não guarda estado de
   * ninguém, e é isso que o snippet do painel Code também ensina.
   */
  let visible = $state(false);
</script>

<div class="nds-stack nds-w-full" data-spacing="sm">
  <!-- O campo tem nome PRÓPRIO, e o nome do grupo não o substitui: aquele
       pertence ao conjunto campo + botão (decisão 2 do primitivo), e o leitor
       de tela não o empresta ao campo. Sem este rótulo o campo ficava anônimo —
       sem `<label>`, sem `aria-label` e sem `placeholder` —, que é justamente o
       caso que o axe reprova na regra `label`. -->
  <label class="nds-label" for={PASSWORD_FIELD_ID}>{PASSWORD_GROUP_LABEL}</label>

  <InputGroup aria-label={PASSWORD_GROUP_LABEL}>
    <InputGroupInput
      id={PASSWORD_FIELD_ID}
      type={visible ? 'text' : 'password'}
      value={PASSWORD_SAMPLE}
    />

    <InputGroupAddon align="inline-end">
      <InputGroupButton
        size="icon-xs"
        aria-label={visible ? HIDE_LABEL : REVEAL_LABEL}
        onclick={() => (visible = !visible)}
      >
        {#if visible}
          <EyeOff aria-hidden="true" />
        {:else}
          <Eye aria-hidden="true" />
        {/if}
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
</div>
