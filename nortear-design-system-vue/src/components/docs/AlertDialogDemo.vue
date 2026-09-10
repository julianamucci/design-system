<script setup lang="ts">
/**
 * AlertDialogDemo — demo reutilizável da docs page de AlertDialog.
 *
 * Renderiza SEMPRE o gatilho fechado: o AlertDialog vive num portal com
 * overlay modal, então qualquer preview aberto por padrão cobriria a página
 * inteira ao carregar. Os previews (demonstração, do & don't, variantes)
 * mostram o botão; o diálogo só aparece após o clique.
 */
import { track } from '@/lib/analytics';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

const props = withDefaults(defineProps<{
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
  /** Variante visual do Button usado como gatilho. */
  triggerVariant?: 'default' | 'destructive' | 'outline';
  /** `destructive` pinta a ação primária com o tom de risco. */
  tone?: 'default' | 'destructive';
}>(), {
  triggerVariant: 'destructive',
  tone: 'default',
});

// Rótulo estável: o título é texto traduzido e quebraria a agregação no GA4
// (um rótulo por idioma para o mesmo demo).
// O `update:open` da lib não diz por que o diálogo fechou, e o `dialog_close`
// exige `reason` (`18-overlay.md` §Analytics). Três caminhos fecham este
// componente, e nenhum deles é o clique fora: `Escape` (anunciado pela lib), o
// Cancelar (`close-button`, que é o que sobra) e a ação que CONFIRMA — `api`,
// "fechou por decisão de dentro". A ação e o Cancelar são partes de fechar da
// lib; sem marcar a confirmação antes, "confirmou" chegaria ao relatório como
// "apertou o botão de fechar".
type AlertDialogCloseReason = 'escape' | 'close-button' | 'api';
let pendingCloseReason: AlertDialogCloseReason | null = null;

const closeWatch = {
  onEscapeKeyDown: () => { pendingCloseReason = 'escape'; },
};

function handleOpenChange(open: boolean) {
  const label = props.tone === 'destructive' ? 'destructive' : 'neutral';
  if (open) {
    pendingCloseReason = null;
    track('dialog_open', { component: 'alert-dialog', label, location: 'docs_demo' });
    return;
  }
  track('dialog_close', {
    component: 'alert-dialog',
    label,
    reason: pendingCloseReason ?? 'close-button',
    location: 'docs_demo',
  });
  pendingCloseReason = null;
}

function handleConfirm() {
  pendingCloseReason = 'api';
  track('dialog_confirm', {
    component: 'alert-dialog',
    label: props.tone === 'destructive' ? 'destructive' : 'neutral',
    location: 'docs_demo',
  });
}
</script>

<template>
  <AlertDialog @update:open="handleOpenChange">
    <AlertDialogTrigger as-child>
      <Button :variant="props.triggerVariant">
        {{ props.triggerLabel }}
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent v-bind="closeWatch">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ props.title }}</AlertDialogTitle>
        <AlertDialogDescription>{{ props.description }}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ props.cancelLabel }}</AlertDialogCancel>
        <AlertDialogAction
          :variant="props.tone === 'destructive' ? 'destructive' : 'default'"
          @click="handleConfirm"
        >
          {{ props.actionLabel }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
