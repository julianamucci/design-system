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

let entradaTimer = 0
let saidaTimer = 0
let dismissed = false
let saidaFinalizada = false

function limparEntrada() {
  window.clearTimeout(entradaTimer)
  root.value?.removeEventListener('animationend', limparEntrada)
  if (animationClass.value === 'nds-animate-in') animationClass.value = null
}

function finalizarSaida() {
  if (saidaFinalizada) return
  saidaFinalizada = true
  window.clearTimeout(saidaTimer)
  root.value?.removeEventListener('animationend', finalizarSaida)
  visible.value = false
  emit('dismiss')
}

onMounted(() => {
  if (!props.dismissible || !root.value) return
  root.value.addEventListener('animationend', limparEntrada)
  entradaTimer = window.setTimeout(limparEntrada, ENTER_FALLBACK_MS)
})

onBeforeUnmount(() => {
  window.clearTimeout(entradaTimer)
  window.clearTimeout(saidaTimer)
})

function handleDismiss() {
  if (dismissed) return
  dismissed = true

  // Fechar antes da entrada terminar deixaria as duas classes no elemento.
  limparEntrada()
  animationClass.value = 'nds-animate-out'

  const el = root.value
  if (!el) {
    finalizarSaida()
    return
  }
  // Corrida entre `animationend` e o timeout — quem vencer remove o nó e
  // emite `dismiss` (uma única vez, depois da remoção).
  el.addEventListener('animationend', finalizarSaida)
  saidaTimer = window.setTimeout(finalizarSaida, EXIT_FALLBACK_MS)
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
