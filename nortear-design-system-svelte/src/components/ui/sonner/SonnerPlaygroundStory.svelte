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

  function disparar() {
    const opcoes: Record<string, unknown> = {};
    if (description) opcoes.description = description;
    if (actionLabel) opcoes.action = { label: actionLabel, onClick: () => undefined };

    if (type === 'default') toast(title, opcoes);
    else if (type === 'success') toast.success(title, opcoes);
    else if (type === 'error') toast.error(title, opcoes);
    else if (type === 'warning') toast.warning(title, opcoes);
    else if (type === 'info') toast.info(title, opcoes);
    else toast.loading(title, opcoes);
  }
</script>

<!-- `contain: layout` prende a região `position: fixed` da lib a este quadro, em
     vez de mandá-la para o canto da janela. A altura mínima vem de classe: medida
     escrita no elemento venceria a folha e sairia do tema e da densidade. -->
<div class="nds-stack nds-min-h-30" data-spacing="md" style="contain: layout; position: relative;">
  <Button variant="outline" onclick={disparar}>Disparar notificação</Button>

  <!-- O prazo vem da região, e não de cada `toast()`: é o mesmo caminho que o
       teste usa para encurtar o tempo sem depender do relógio real. -->
  <Toaster {position} {richColors} {closeButton} {duration} />
</div>
