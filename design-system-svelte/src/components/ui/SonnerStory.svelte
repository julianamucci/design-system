<script lang="ts">
  import Sonner from './Sonner.svelte';
  import Button from './Button.svelte';
  import { toast } from 'svelte-sonner';
  import type { ToasterProps } from 'svelte-sonner';

  export let position: ToasterProps['position'] = 'bottom-right';
  export let richColors: boolean = false;
  export let expand: boolean = false;
  export let closeButton: boolean = false;
  export let duration: number = 4000;
  export let mode: 'playground' | 'single' = 'playground';
  export let toastType: string = 'default';
  export let toastMessage: string = 'Toast padrão';
  export let toastDescription: string = '';
  export let toastActionLabel: string = '';
  export let autoTrigger: boolean = false;

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

  import { onMount } from 'svelte';
  onMount(() => { if (autoTrigger) setTimeout(trigger, 300); });
</script>

<div style="min-height: 300px; display: flex; align-items: center; justify-content: center;">
  <Sonner {position} {richColors} {expand} {closeButton} {duration} />

  {#if mode === 'playground'}
    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
      <Button on:click={() => toast('Toast padrão')}>Default</Button>
      <Button variant="outline" on:click={() => toast.success('Salvo com sucesso')}>Success</Button>
      <Button variant="outline" on:click={() => toast.error('Falha ao salvar')}>Error</Button>
      <Button variant="outline" on:click={() => toast.warning('Conexão instável')}>Warning</Button>
      <Button variant="outline" on:click={() => toast.info('Nova versão disponível')}>Info</Button>
      <Button variant="outline" on:click={() => toast.loading('Processando...')}>Loading</Button>
      <Button variant="outline" on:click={() => toast('Item excluído', { action: { label: 'Desfazer', onClick: () => toast.success('Desfeito!') } })}>Com ação</Button>
      <Button variant="secondary" on:click={() => toast.dismiss()}>Fechar todos</Button>
    </div>
  {:else}
    <Button on:click={trigger}>{toastMessage}</Button>
  {/if}
</div>
