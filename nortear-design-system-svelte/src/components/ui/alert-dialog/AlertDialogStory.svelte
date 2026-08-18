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

  type Tone = 'destructive' | 'default';

  interface Props {
    open?: boolean;
    triggerLabel?: string;
    triggerVariant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'secondary' | 'link';
    title?: string;
    /**
     * Descrição do diálogo. A descrição é opcional no design system, mas este
     * wrapper sempre a renderiza **de propósito**: o primitivo desta stack grava
     * o id da descrição no estado da raiz e NÃO o apaga ao destruí-la (conferido
     * em `bits-ui/dist/bits/dialog/dialog.svelte.js`), então remover o parágrafo
     * em tempo de execução deixaria o painel apontando para um id ausente. Quem
     * exercita o caminho sem descrição é `AlertDialogSemDescricaoStory.svelte`,
     * que nasce sem ela.
     */
    description?: string;
    /** Bloco de ícone no topo do header. É o control showMedia do Playground. */
    showMedia?: boolean;
    /** Classe extra no painel — o caminho de extensibilidade documentado. */
    contentClass?: string;
    /** Classe extra no bloco de mídia. */
    mediaClass?: string;
    cancelLabel?: string;
    actionLabel?: string;
    tone?: Tone;
    onConfirm?: () => void;
    onCancel?: () => void;
    onOpenChange?: (open: boolean) => void;
  }

  // Rótulos padrão: docs/shared/content/alert-dialog/translations.json →
  // demonstration.labels.
  let {
    open = $bindable(false),
    triggerLabel = 'Excluir conta',
    triggerVariant = 'destructive',
    title = 'Excluir conta',
    description = 'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
    showMedia = false,
    contentClass,
    mediaClass,
    cancelLabel = 'Cancelar',
    actionLabel = 'Excluir',
    tone = 'destructive',
    onConfirm,
    onCancel,
    onOpenChange,
  }: Props = $props();

  // Variante do Button, não classe de fundo crua: bg-destructive e
  // text-destructive-foreground saíram com o Tailwind e não têm CSS.
  const actionVariant = $derived(tone === 'destructive' ? 'destructive' : 'default');
</script>

<AlertDialog bind:open {onOpenChange}>
  <AlertDialogTrigger>
    {#snippet child({ props })}
      <Button {...props} variant={triggerVariant}>{triggerLabel}</Button>
    {/snippet}
  </AlertDialogTrigger>
  <AlertDialogContent class={contentClass}>
    <AlertDialogHeader>
      {#if showMedia}
        <AlertDialogMedia class={mediaClass}>
          <TriangleAlert aria-hidden="true" />
        </AlertDialogMedia>
      {/if}
      <AlertDialogTitle>{title}</AlertDialogTitle>
      <AlertDialogDescription>{description}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onclick={onCancel}>{cancelLabel}</AlertDialogCancel>
      <AlertDialogAction variant={actionVariant} onclick={onConfirm}>{actionLabel}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
