<script lang="ts">
  import { toast } from 'svelte-sonner';
  import { Toaster } from './index.ts';
  import { Button } from '@/components/ui/button';

  interface Props {
    position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
    richColors?: boolean;
    expand?: boolean;
    duration?: number;
  }

  let {
    position = 'top-right',
    richColors = true,
    expand = false,
    duration = 4000,
  }: Props = $props();
</script>

<div style="contain: layout" class="flex flex-wrap gap-2 p-4">
  <Toaster {position} {richColors} {expand} {duration} />

  <Button variant="outline" onclick={() => toast('Código copiado.')}>
    Disparar default
  </Button>
  <Button variant="outline" onclick={() => toast.success('Alterações salvas.')}>
    Disparar success
  </Button>
  <Button variant="outline" onclick={() => toast.error('Não foi possível salvar. Tente novamente.')}>
    Disparar error
  </Button>
  <Button variant="outline" onclick={() => toast.warning('Sua sessão expira em 5 minutos.')}>
    Disparar warning
  </Button>
  <Button variant="outline" onclick={() => toast.info('Nova versão disponível.')}>
    Disparar info
  </Button>
  <Button variant="outline" onclick={() => toast.loading('Enviando arquivo...')}>
    Disparar loading
  </Button>
  <Button variant="outline" onclick={() => toast.success('Preferências atualizadas.', { description: 'Suas configurações foram salvas e entrarão em vigor na próxima sessão.' })}>
    Com descrição
  </Button>
  <Button variant="outline" onclick={() => toast('Item excluído.', { action: { label: 'Desfazer', onClick: () => {} } })}>
    Com ação
  </Button>
  <Button variant="outline" onclick={() => {
    const promise = new Promise<void>((resolve) => setTimeout(resolve, 2000));
    toast.promise(promise, {
      loading: 'Enviando arquivo...',
      success: 'Arquivo enviado com sucesso.',
      error: 'Erro ao enviar. Tente novamente.',
    });
  }}>
    Com promise
  </Button>
  <Button variant="outline" onclick={() => toast.error('Falha crítica no servidor.', { duration: Infinity, dismissible: true })}>
    Persistente
  </Button>
</div>
