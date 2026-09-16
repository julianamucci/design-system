<script lang="ts">
  import type { ClassValue } from 'svelte/elements';
  import { cn } from '@/lib/utils.js';
  import { Alert, AlertTitle, AlertDescription } from './index';
  import Info from '@lucide/svelte/icons/info';
  import AlertCircle from '@lucide/svelte/icons/circle-alert';

  // `class` existe para o wrapper ter uma prop em comum com as do Alert — sem
  // isso o `render` da story não tipa contra Meta<typeof Alert>.
  const { class: className = '' }: { class?: ClassValue | null } = $props();
</script>

<div class={cn('nds-stack', className)} data-spacing="md">
  <!-- Estático: já está na tela quando a página carrega — `role="note"` não é
       live region, e o leitor de tela lê na ordem do documento. -->
  <Alert role="note">
    <Info aria-hidden="true" />
    <AlertTitle as="h4">Nota de implementação</AlertTitle>
    <AlertDescription>
      Conteúdo estático: o leitor de tela lê na ordem do documento, sem interromper.
    </AlertDescription>
  </Alert>

  <!-- Sem a prop, o padrão continua `role="alert"`. -->
  <Alert variant="destructive">
    <AlertCircle aria-hidden="true" />
    <AlertTitle as="h4">Falha no envio</AlertTitle>
    <AlertDescription>
      Mensagem urgente surgida em tempo de execução: anúncio imediato.
    </AlertDescription>
  </Alert>
</div>
