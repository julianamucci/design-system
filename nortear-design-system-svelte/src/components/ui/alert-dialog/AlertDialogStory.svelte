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
     * Descrição do diálogo — opcional (D4). Vazia, o subcomponente sai da
     * composição, e pode sair com o painel aberto: apagar o texto no control do
     * Playground tira o `aria-describedby` junto (ver
     * `alert-dialog-description-registry.ts`).
     */
    description?: string;
    /**
     * Caixa reativa que, quando traz texto (ou `''`), vence `description` — lida
     * por DENTRO deste componente, então trocar o valor muda a descrição com o
     * painel aberto, sem remontar nada. Só o Playground passa; ver
     * `alert-dialog-runtime-description.svelte.ts`.
     */
    descriptionOverride?: { current: string | undefined };
    /** Bloco de ícone no topo do header. É o control showMedia do Playground. */
    showMedia?: boolean;
    /** Classe extra no painel — o caminho de extensibilidade documentado. */
    contentClass?: string;
    /** Classe extra no bloco de mídia. */
    mediaClass?: string;
    cancelLabel?: string;
    actionLabel?: string;
    tone?: Tone;
    /**
     * Nível do cabeçalho do título. Ausente, o título fica no `h2` padrão do
     * primitivo — é o que todas as outras stories deste andaime exercitam.
     */
    titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
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
    descriptionOverride,
    showMedia = false,
    contentClass,
    mediaClass,
    cancelLabel = 'Cancelar',
    actionLabel = 'Excluir',
    tone = 'destructive',
    titleLevel,
    onConfirm,
    onCancel,
    onOpenChange,
  }: Props = $props();

  // Variante do Button, não classe de fundo crua: bg-destructive e
  // text-destructive-foreground saíram com o Tailwind e não têm CSS.
  const actionVariant = $derived(tone === 'destructive' ? 'destructive' : 'default');
  const shownDescription = $derived(descriptionOverride?.current ?? description);
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
      <!--
        O `level` do primitivo troca a TAG e o `aria-level` juntos (ver
        alert-dialog-title.svelte); ausente, vale o `h2` padrão.
      -->
      <AlertDialogTitle level={titleLevel}>{title}</AlertDialogTitle>
      {#if shownDescription}
        <AlertDialogDescription>{shownDescription}</AlertDialogDescription>
      {/if}
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onclick={onCancel}>{cancelLabel}</AlertDialogCancel>
      <AlertDialogAction variant={actionVariant} onclick={onConfirm}>{actionLabel}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
