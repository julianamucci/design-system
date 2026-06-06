<script lang="ts">
  import { toast } from 'svelte-sonner';
  import { Toaster } from './index.ts';

  type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

  interface Props {
    type?: ToastType;
    message?: string;
    description?: string;
    actionLabel?: string;
    persistent?: boolean;
    withAction?: boolean;
    withPromise?: boolean;
  }

  let {
    type = 'default',
    message = 'Notificação',
    description = '',
    actionLabel = '',
    persistent = false,
    withAction = false,
    withPromise = false,
  }: Props = $props();

  $effect(() => {
    const opts: Record<string, unknown> = {};
    if (description) opts.description = description;
    if (persistent) opts.duration = Infinity;
    if (persistent) opts.dismissible = true;
    if (withAction && actionLabel) opts.action = { label: actionLabel, onClick: () => {} };

    if (withPromise) {
      const promise = new Promise<void>((resolve) => setTimeout(resolve, 2000));
      toast.promise(promise, {
        loading: 'Enviando arquivo...',
        success: 'Arquivo enviado com sucesso.',
        error: 'Erro ao enviar. Tente novamente.',
      });
      return;
    }

    if (type === 'default') toast(message, opts);
    else if (type === 'success') toast.success(message, opts);
    else if (type === 'error') toast.error(message, opts);
    else if (type === 'warning') toast.warning(message, opts);
    else if (type === 'info') toast.info(message, opts);
    else if (type === 'loading') toast.loading(message, opts);
  });
</script>

<div style="contain: layout" class="relative min-h-24 w-full">
  <Toaster position="top-right" />
</div>
