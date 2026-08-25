<script lang="ts">
  // Etiqueta com contador: o número entra DENTRO da etiqueta, à direita do
  // texto. O rótulo diz de que é a contagem, então o número não precisa de
  // aria-label próprio — "Urgente 12" já se lê inteiro.
  import { Badge, BadgeCounter } from './index';
  import type { BadgeVariant } from './index';

  interface Props {
    variant?: BadgeVariant;
    label?: string;
    count?: string;
  }

  let { variant = 'destructive', label = 'Urgente', count = '12' }: Props = $props();
</script>

<Badge {variant}>
  {label}
  <BadgeCounter>{count}</BadgeCounter>
</Badge>
