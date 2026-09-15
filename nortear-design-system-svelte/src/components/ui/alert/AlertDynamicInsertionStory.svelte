<script lang="ts">
  import { Alert, AlertTitle, AlertDescription } from './index';
  import { Button } from '@/components/ui/button';
  import CheckCircle2 from '@lucide/svelte/icons/circle-check-big';
  import type { ClassValue } from 'svelte/elements';
  import { cn } from '@/lib/utils.js';

  // `class` existe para o wrapper ter uma prop em comum com as do Alert — sem
  // isso o `render` da story não tipa contra Meta<typeof Alert>.
  const { class: className = '' }: { class?: ClassValue | null } = $props();

  // O alerta só entra DEPOIS de uma ação: é o caso em que `role="alert"` vale a
  // pena, porque o leitor anuncia na hora. Sem contêiner `aria-live` em volta —
  // ele aninharia duas regiões vivas.
  let generated = $state(false);

  // O painel Interactions reexecuta a play no MESMO DOM, onde o alerta já foi
  // gerado. A play volta ao estado inicial disparando `alert-story-reset`, que
  // borbulha até aqui — andaime da story, fora do snippet publicado.
  let root: HTMLDivElement | undefined = $state();
  $effect(() => {
    if (!root) return;
    const reset = () => (generated = false);
    root.addEventListener('alert-story-reset', reset);
    return () => root?.removeEventListener('alert-story-reset', reset);
  });
</script>

<div bind:this={root} class={cn('nds-stack', className)} data-spacing="sm">
  <div>
    <Button variant="default" size="sm" onclick={() => (generated = true)}>Gerar relatório</Button>
  </div>
  {#if generated}
    <Alert>
      <CheckCircle2 aria-hidden="true" />
      <AlertTitle>Operação concluída</AlertTitle>
      <AlertDescription>O relatório foi gerado com sucesso.</AlertDescription>
    </Alert>
  {/if}
</div>
