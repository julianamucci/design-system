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
    NOTE_PLACEHOLDER,
    SEND_LABEL,
    SITE_PLACEHOLDER,
    SITE_PREFIX,
    SITE_SUFFIX,
  } from './input-group.fixtures';

  /**
   * As quatro posições do addon, uma moldura por posição.
   *
   * Uma moldura por posição, e cada uma com UM addon só: com dois na mesma
   * moldura não daria para afirmar qual deles a folha ordenou.
   *
   * Nenhuma das quatro recebe nome: o rótulo do campo é quem nomeia, e um grupo
   * nomeado à toa faz o leitor de tela repetir.
   */
</script>

<div class="nds-stack nds-w-full" data-spacing="lg">
  <InputGroup>
    <InputGroupAddon align="inline-start">
      <InputGroupText>{SITE_PREFIX}</InputGroupText>
    </InputGroupAddon>
    <InputGroupInput placeholder={SITE_PLACEHOLDER} />
  </InputGroup>

  <InputGroup>
    <InputGroupInput placeholder={SITE_PLACEHOLDER} />
    <InputGroupAddon align="inline-end">
      <InputGroupText>{SITE_SUFFIX}</InputGroupText>
    </InputGroupAddon>
  </InputGroup>

  <!-- As duas em bloco ocupam a largura inteira e fazem o grupo virar coluna —
       decisão da folha compartilhada, sem opção de direção para passar. -->
  <InputGroup>
    <InputGroupAddon align="block-start">
      <InputGroupText>{SITE_PREFIX}</InputGroupText>
    </InputGroupAddon>
    <InputGroupTextarea rows={2} placeholder={NOTE_PLACEHOLDER} />
  </InputGroup>

  <InputGroup>
    <InputGroupTextarea rows={2} placeholder={NOTE_PLACEHOLDER} />
    <InputGroupAddon align="block-end">
      <InputGroupButton>{SEND_LABEL}</InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
</div>
