<script setup lang="ts">
/**
 * AlertDialogDemo — demo reutilizável da docs page de AlertDialog.
 *
 * Renderiza SEMPRE o gatilho fechado: o AlertDialog vive num portal com
 * overlay modal, então qualquer preview aberto por padrão cobriria a página
 * inteira ao carregar. Os previews (demonstração, do & don't, variantes)
 * mostram o botão; o diálogo só aparece após o clique.
 */
import { computed } from 'vue';
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
  /**
   * Seção da docs page onde o preview está (`docs_demo`, `docs_variantes`,
   * `docs_do_dont`). Obrigatória: o mesmo demo serve três seções, e um valor
   * fixo aqui dentro mandaria todo clique como se viesse da demonstração.
   */
  location: string;
  /**
   * Id estável do gatilho, o `trigger_id` dos eventos. Sem ele, sai do tom
   * (`destructive` / `neutral`); o Do & Don't passa o do par (`pair1-do`,
   * `pair2-dont`…, as chaves `doDont.pair*` do conteúdo), porque ali o tom não
   * distingue o exemplo certo do errado.
   */
  triggerId?: string;
}>(), {
  triggerVariant: 'destructive',
  tone: 'default',
  triggerId: undefined,
});

const resolvedTriggerId = computed(
  () => props.triggerId ?? (props.tone === 'destructive' ? 'destructive' : 'neutral'),
);

// `trigger_id` é id estável, nunca o título: o título é texto traduzido e
// quebraria a agregação no GA4 (um valor por idioma para o mesmo demo).
// O `update:open` da lib não diz por que o diálogo fechou, e o `dialog_close`
// exige `reason` (`18-overlay.md` §Analytics). Três caminhos fecham este
// componente, e nenhum deles é o clique fora: `Escape` (anunciado pela lib), o
// Cancelar (`close-button`, que é o que sobra) e a ação que CONFIRMA — `api`,
// "fechou por decisão de dentro". A ação e o Cancelar são partes de fechar da
// lib; sem marcar a confirmação antes, "confirmou" chegaria ao relatório como
// "apertou o botão de fechar". A marca chega ANTES do fechamento porque o
// wrapper da ação entrega o `@click` na captura (`AlertDialogAction.vue`) — e
// não por esta demo ser não controlada, que era o que a sustentava até
// 2026-09-10: no modo controlado a lib emite a mudança síncrona, dentro do
// próprio fechamento.
type AlertDialogCloseReason = 'escape' | 'close-button' | 'api';
let pendingCloseReason: AlertDialogCloseReason | null = null;

const closeWatch = {
  onEscapeKeyDown: () => { pendingCloseReason = 'escape'; },
};

function handleOpenChange(open: boolean) {
  if (open) {
    pendingCloseReason = null;
    track('dialog_open', {
      component: 'alert-dialog',
      trigger_id: resolvedTriggerId.value,
      location: props.location,
    });
    return;
  }
  track('dialog_close', {
    component: 'alert-dialog',
    trigger_id: resolvedTriggerId.value,
    reason: pendingCloseReason ?? 'close-button',
    location: props.location,
  });
  pendingCloseReason = null;
}

function handleConfirm() {
  pendingCloseReason = 'api';
  track('dialog_confirm', {
    component: 'alert-dialog',
    trigger_id: resolvedTriggerId.value,
    location: props.location,
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
