<script lang="ts">
  import { Toaster } from './index.ts';
  import type { ToasterProps } from 'svelte-sonner';

  /**
   * Quadro da story: a região `position: fixed` da lib fica presa a este
   * invólucro por causa do `contain: layout`, em vez de ir para o canto da
   * janela inteira. Quem dispara as notificações é a play — um `$effect` que
   * chamasse `toast()` na montagem reexecutaria a cada mudança reativa e
   * empilharia notificações que ninguém pediu.
   *
   * A altura vem de uma CLASSE `.nds-min-h-*`, e não de um `style` inline:
   * medida escrita no elemento vence a folha e sai do tema, da densidade e da
   * escala tipográfica. O `contain`/`position` continuam inline porque não são
   * valores de design — são o mecanismo que prende o portal ao quadro.
   */
  let { alturaClasse = 'nds-min-h-30', ...args }: ToasterProps & { alturaClasse?: string } = $props();
</script>

<div style="contain: layout; position: relative;" class={alturaClasse}>
  <Toaster {...args} />
</div>
