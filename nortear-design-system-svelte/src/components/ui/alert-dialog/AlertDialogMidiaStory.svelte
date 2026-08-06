<script lang="ts">
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from './index';
  import { Button } from '@/components/ui/button';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

  // Wrapper dedicado: o AlertDialogStory é o caminho sem mídia, e ramificar
  // aquele por prop faria um wrapper com dois caminhos.
  let { open = $bindable(true) }: { open?: boolean } = $props();
</script>

<AlertDialog bind:open>
  <AlertDialogTrigger>
    {#snippet child({ props })}
      <Button {...props} variant="destructive">Excluir conta</Button>
    {/snippet}
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogMedia>
        <TriangleAlert aria-hidden="true" />
      </AlertDialogMedia>
      <AlertDialogTitle>Excluir conta</AlertDialogTitle>
      <AlertDialogDescription>
        Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction variant="destructive">Excluir</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
