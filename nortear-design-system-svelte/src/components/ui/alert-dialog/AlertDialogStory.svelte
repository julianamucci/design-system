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
    /**
     * Nível do cabeçalho do título. Ausente, o título fica no nível padrão do
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
        Nível do cabeçalho pelo snippet `child`, e não pelo `level` sozinho:
        a lib expressa o nível em `role="heading"` + `aria-level` e mantém a
        TAG em `div`. O `level` vai junto para a tag e o ARIA concordarem. A
        medição está em DialogStory.svelte — os quatro painéis modais desta
        stack caem no mesmo arquivo da lib.
      -->
      {#if titleLevel}
        <AlertDialogTitle level={titleLevel}>
          {#snippet child({ props })}
            <svelte:element this={`h${titleLevel}`} {...props}>{title}</svelte:element>
          {/snippet}
        </AlertDialogTitle>
      {:else}
        <AlertDialogTitle>{title}</AlertDialogTitle>
      {/if}
      <AlertDialogDescription>{description}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onclick={onCancel}>{cancelLabel}</AlertDialogCancel>
      <AlertDialogAction variant={actionVariant} onclick={onConfirm}>{actionLabel}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
