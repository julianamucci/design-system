<script lang="ts">
  import { Badge } from './index';
  import type { BadgeVariant } from './index';
  import { Button } from '@/components/ui/button';
  import Check from '@lucide/svelte/icons/check';

  type Kind = 'simple' | 'withIcon' | 'asButton' | 'asLink';

  interface Props {
    kind?: Kind;
    // Sem valor padrão aqui: o Playground prova que a etiqueta declara
    // `data-variant="default"` mesmo quando ninguém passa a variante.
    variant?: BadgeVariant;
    label?: string;
    ariaLabel?: string;
  }

  let { kind = 'simple', variant, label = 'Novo', ariaLabel }: Props = $props();
</script>

{#if kind === 'withIcon'}
  <Badge {variant}>
    <Check aria-hidden="true" data-icon="inline-start" />
    {label}
  </Badge>
{:else if kind === 'asButton'}
  <!-- A etiqueta DENTRO do Button do design system: foco, teclado e evento são
       do botão, e o nome acessível também — o rótulo curto não basta. -->
  <Button variant="ghost" size="sm" aria-label={ariaLabel}>
    <Badge {variant}>{label}</Badge>
  </Button>
{:else if kind === 'asLink'}
  <!-- O link recebe foco e navegação; a folha troca o fundo da etiqueta no
       hover (`a > .nds-badge:hover`). -->
  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- Storybook sem router: o destino é o fragmento vazio da demonstração -->
  <a href="#">
    <Badge {variant}>{label}</Badge>
  </a>
{:else}
  <Badge {variant}>{label}</Badge>
{/if}
