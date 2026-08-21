<script lang="ts">
  import { toast } from 'svelte-sonner';
  import { Toaster } from './index.ts';
  import { Button } from '@/components/ui/button';

  type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

  interface Props {
    type?: ToastType;
    title?: string;
    description?: string;
    actionLabel?: string;
    position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
    richColors?: boolean;
    closeButton?: boolean;
    duration?: number;
  }

  let {
    type = 'success',
    title = 'Alterações salvas.',
    description = '',
    actionLabel = '',
    position = 'top-right',
    richColors = true,
    closeButton = false,
    duration = 4000,
  }: Props = $props();

  function fire() {
    const options: Record<string, unknown> = {};
    if (description) options.description = description;
    if (actionLabel) options.action = { label: actionLabel, onClick: () => undefined };

    if (type === 'default') toast(title, options);
    else if (type === 'success') toast.success(title, options);
    else if (type === 'error') toast.error(title, options);
    else if (type === 'warning') toast.warning(title, options);
    else if (type === 'info') toast.info(title, options);
    else toast.loading(title, options);
  }
</script>

<!-- `contain: layout` prende a região `position: fixed` da lib a este quadro, em
     vez de mandá-la para o canto da janela. A altura mínima vem de classe: medida
     escrita no elemento venceria a folha e sairia do tema e da densidade. -->
<div class="nds-stack nds-min-h-30" data-spacing="md" style="contain: layout; position: relative;">
  <Button variant="outline" onclick={fire}>Disparar notificação</Button>

  <!-- O prazo vem da região, e não de cada `toast()`: é o mesmo caminho que o
       teste usa para encurtar o tempo sem depender do relógio real. -->
  <Toaster {position} {richColors} {closeButton} {duration} />
</div>
