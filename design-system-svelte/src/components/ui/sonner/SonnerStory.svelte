<script lang="ts">
  import { Toaster as Sonner } from '@/components/ui/sonner';
  import { Button } from '@/components/ui/button';
  import { toast } from 'svelte-sonner';
  import type { ToasterProps } from 'svelte-sonner';
  import { onMount } from 'svelte';

  let {
    position = 'bottom-right',
    richColors = false,
    expand = false,
    closeButton = false,
    duration = 4000,
    mode = 'playground',
    toastType = 'default',
    toastMessage = 'Toast padrão',
    toastDescription = '',
    toastActionLabel = '',
    autoTrigger = false,
  }: {
    position?: ToasterProps['position'];
    richColors?: boolean;
    expand?: boolean;
    closeButton?: boolean;
    duration?: number;
    mode?: 'playground' | 'single';
    toastType?: string;
    toastMessage?: string;
    toastDescription?: string;
    toastActionLabel?: string;
    autoTrigger?: boolean;
  } = $props();

  function trigger() {
    switch (toastType) {
      case 'success': toast.success(toastMessage, toastDescription ? { description: toastDescription } : undefined); break;
      case 'error': toast.error(toastMessage, toastDescription ? { description: toastDescription } : undefined); break;
      case 'warning': toast.warning(toastMessage, toastDescription ? { description: toastDescription } : undefined); break;
      case 'info': toast.info(toastMessage, toastDescription ? { description: toastDescription } : undefined); break;
      case 'loading': toast.loading(toastMessage); break;
      case 'action': toast(toastMessage, { action: { label: toastActionLabel || 'Desfazer', onClick: () => toast.success('Desfeito!') } }); break;
      case 'promise': toast.promise(new Promise(r => setTimeout(r, 2500)), { loading: 'Salvando...', success: 'Dados salvos!', error: 'Erro ao salvar' }); break;
      case 'description': toast(toastMessage, { description: toastDescription || 'Detalhes da notificação.' }); break;
      default: toast(toastMessage); break;
    }
  }

  onMount(() => { if (autoTrigger) setTimeout(trigger, 300); });
</script>

<div style="min-height: 300px; display: flex; align-items: center; justify-content: center;">
  <Sonner {position} {richColors} {expand} {closeButton} {duration} />

  {#if mode === 'playground'}
    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
      <Button onclick={() => toast('Toast padrão')}>Default</Button>
      <Button variant="outline" onclick={() => toast.success('Salvo com sucesso')}>Success</Button>
      <Button variant="outline" onclick={() => toast.error('Falha ao salvar')}>Error</Button>
      <Button variant="outline" onclick={() => toast.warning('Conexão instável')}>Warning</Button>
      <Button variant="outline" onclick={() => toast.info('Nova versão disponível')}>Info</Button>
      <Button variant="outline" onclick={() => toast.loading('Processando...')}>Loading</Button>
      <Button variant="outline" onclick={() => toast('Item excluído', { action: { label: 'Desfazer', onClick: () => toast.success('Desfeito!') } })}>Com ação</Button>
      <Button variant="secondary" onclick={() => toast.dismiss()}>Fechar todos</Button>
    </div>
  {:else}
    <Button onclick={trigger}>{toastMessage}</Button>
  {/if}
</div>
