<script lang="ts">
  import X from '@lucide/svelte/icons/x';
  import { Label } from '@/components/ui/label';
  import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupButton,
    InputGroupText,
  } from '@/components/ui/input-group';

  interface Props {
    /** `alinhamentos` mostra os três alinhamentos; `clique` mostra o addon clicável. */
    cenario?: 'alinhamentos' | 'clique';
  }

  let { cenario = 'alinhamentos' }: Props = $props();
</script>

{#if cenario === 'alinhamentos'}
  <div class="nds-stack nds-w-cap-md" data-spacing="lg">
    <div class="nds-stack" data-spacing="xs">
      <Label for="ig-inicio">Buscar</Label>
      <InputGroup>
        <InputGroupAddon align="inline-start" data-testid="addon-inicio">
          <InputGroupText>@</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput id="ig-inicio" type="search" placeholder="Buscar" />
      </InputGroup>
    </div>

    <div class="nds-stack" data-spacing="xs">
      <Label for="ig-fim">Atalho</Label>
      <InputGroup>
        <InputGroupInput id="ig-fim" placeholder="Comando" />
        <InputGroupAddon align="inline-end" data-testid="addon-fim">
          <InputGroupText>Ctrl+K</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>

    <div class="nds-stack" data-spacing="xs">
      <Label for="ig-bloco">Mensagem</Label>
      <InputGroup>
        <InputGroupAddon align="block-start" data-testid="addon-bloco">
          <InputGroupText>Para: suporte</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput id="ig-bloco" placeholder="Assunto" />
      </InputGroup>
    </div>
  </div>
{:else}
  <div class="nds-stack nds-w-cap-md" data-spacing="xs">
    <Label for="ig-clique">Usuário</Label>
    <InputGroup>
      <InputGroupAddon align="inline-start" data-testid="addon">
        <InputGroupText>@</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput id="ig-clique" placeholder="nome.usuario" />
      <!-- Ícone, e não a letra "x": o glifo sozinho dava um alvo de 19.8x21.5px
           e o axe reprovava por target-size (WCAG 2.5.8, mínimo 24x24). -->
      <InputGroupAddon align="inline-end">
        <InputGroupButton type="button" size="icon-sm" aria-label="Limpar">
          <X aria-hidden="true" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  </div>
{/if}
