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

<div class={cn('nds-stack', className)} data-spacing="sm">
  <!-- Conteúdo estático: `role="note"` NÃO é live region — o leitor de tela
       não interrompe nem salta para cá no carregamento da página. -->
  <Alert role="note" class="nds-w-full">
    <Info class="nds-icon" aria-hidden="true" />
    <AlertTitle>Nota de implementação</AlertTitle>
    <AlertDescription>
      Conteúdo já presente quando a página carrega — não deve ser anunciado.
    </AlertDescription>
  </Alert>

  <!-- Sem a prop, o padrão continua `role="alert"`: live region assertiva para
       mensagem urgente que surge em tempo de execução. -->
  <Alert variant="destructive" class="nds-w-full">
    <AlertCircle class="nds-icon" aria-hidden="true" />
    <AlertTitle>Erro ao salvar</AlertTitle>
    <AlertDescription>
      Mensagem urgente inserida em tempo de execução — anunciada de imediato.
    </AlertDescription>
  </Alert>
</div>
