<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { AlertVariants } from './index'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { alertVariants } from './index'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  variant?: AlertVariants['variant']
  /**
   * Semântica de anúncio da raiz.
   *
   * `alert` (padrão) é live region assertiva — o leitor de tela interrompe o
   * que estiver fazendo e anuncia na hora; só faz sentido para mensagem
   * urgente que SURGE em tempo de execução. `status` é live region polida.
   * `note` não é live region: é o valor correto para conteúdo estático já
   * presente quando a página carrega.
   *
   * Declarar `role` como prop também o retira de `$attrs`, então o valor aqui
   * é o único a chegar na raiz — sem atributo duplicado nem fallthrough
   * sobrescrevendo a decisão do componente.
   */
  role?: 'alert' | 'status' | 'note'
  /** Renderiza o botão de fechar no canto superior direito. */
  dismissible?: boolean
  /** Rótulo acessível do botão de fechar. */
  dismissLabel?: string
}>(), {
  role: 'alert',
  dismissible: false,
  dismissLabel: 'Fechar alerta',
})

const emit = defineEmits<{
  /** Disparado uma única vez, quando o usuário aciona o botão de fechar. */
  dismiss: []
}>()

/**
 * As classes `.nds-animate-in` / `.nds-animate-out` vivem em `utilities.css` e
 * servem a qualquer componente que apareça/suma em runtime.
 *
 * Os timeouts NÃO são redundância defensiva genérica: sem eles o alert nunca
 * sai da tela em dois cenários reais — `prefers-reduced-motion`, onde a
 * animação é suprimida e `animationend` jamais dispara, e ambiente sem
 * composição de quadros (Chromium headless dos testes), onde a animação fica
 * presa no primeiro quadro. Quem vencer a corrida finaliza; roda uma vez só.
 */
const EXIT_FALLBACK_MS = 300  // --duration-base (200ms) + folga
const ENTER_FALLBACK_MS = 450 // --duration-spring (400ms) + folga

const visible = ref(true)
const root = ref<HTMLElement | null>(null)

// A classe de entrada entra já no PRIMEIRO render — em `onMounted` a animação
// começaria um quadro depois do alert aparecer. Ela é TRANSITÓRIA: sai no
// `animationend` E por timeout de segurança. Se ficasse, um ambiente que não
// avança a animação (headless) manteria o alert preso em opacity: 0, invisível.
const animationClass = ref<string | null>(props.dismissible ? 'nds-animate-in' : null)

let entryTimer = 0
let outputTimer = 0
let dismissed = false
let outputFinalizada = false

// `animationend` borbulha: a animação de qualquer descendente (o botão de
// fechar, um ícone) chegaria aqui e encerraria entrada ou saída antes da hora.
// Só o próprio elemento conta. Chamada direta (sem evento) sempre passa.
function ownElementoEh(event?: Event) {
  return !event || event.target === root.value
}

function clearEntry(event?: Event) {
  if (!ownElementoEh(event)) return
  window.clearTimeout(entryTimer)
  root.value?.removeEventListener('animationend', clearEntry)
  if (animationClass.value === 'nds-animate-in') animationClass.value = null
}

function finalizarOutput(event?: Event) {
  if (!ownElementoEh(event)) return
  /* v8 ignore next -- guarda de dupla finalização: os dois caminhos que chamam
     (animationend e timeout) removem listener e timer antes de sair, então não
     há ordem de eventos que a alcance. Fica como rede se um deles mudar. */
  if (outputFinalizada) return
  outputFinalizada = true
  window.clearTimeout(outputTimer)
  root.value?.removeEventListener('animationend', finalizarOutput)
  visible.value = false
  emit('dismiss')
}

onMounted(() => {
  if (!props.dismissible || !root.value) return
  root.value.addEventListener('animationend', clearEntry)
  entryTimer = window.setTimeout(clearEntry, ENTER_FALLBACK_MS)
})

onBeforeUnmount(() => {
  window.clearTimeout(entryTimer)
  window.clearTimeout(outputTimer)
})

function handleDismiss() {
  if (dismissed) return
  dismissed = true

  // Fechar antes da entrada terminar deixaria as duas classes no elemento.
  clearEntry()
  animationClass.value = 'nds-animate-out'

  const el = root.value
  /* v8 ignore next 4 -- o handler só existe dentro do `v-if="visible"`, onde a
     ref já está preenchida; o ramo existe porque o tipo da ref é nullable. */
  if (!el) {
    finalizarOutput()
    return
  }
  // Corrida entre `animationend` e o timeout — quem vencer remove o nó e
  // emite `dismiss` (uma única vez, depois da remoção).
  el.addEventListener('animationend', finalizarOutput)
  outputTimer = window.setTimeout(finalizarOutput, EXIT_FALLBACK_MS)
}
</script>

<template>
  <div
    v-if="visible"
    ref="root"
    data-slot="alert"
    :class="cn(alertVariants({ variant }), animationClass, props.class)"
    :role="props.role"
  >
    <slot />
    <Button
      v-if="props.dismissible"
      variant="ghost"
      size="icon-sm"
      class="nds-alert-dismiss"
      type="button"
      :aria-label="props.dismissLabel"
      data-slot="alert-dismiss"
      @click="handleDismiss"
    >
      <X
        class="nds-icon"
        aria-hidden="true"
      />
    </Button>
  </div>
</template>
