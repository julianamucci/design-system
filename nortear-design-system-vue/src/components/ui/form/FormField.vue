<script lang="ts">
// ─── Form ─────────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-form-* (docs/shared/styles/nds/form.css).
//
// O produto deste componente NÃO é o que se vê: é a costura de ACESSIBILIDADE
// em volta do campo, e ela só existe em atributo. Um campo pode estar perfeito
// na tela e mudo no leitor de tela, e nenhuma foto do Chromatic acusa.
//
//   · o <label> aponta para o controle (`for` ↔ `id`), com id gerado quando falta
//   · descrição e mensagem ganham id e entram no `aria-describedby` do controle
//   · a mensagem nasce com `aria-live="polite"`, então é anunciada ao aparecer
//   · o rótulo ganha `data-error`, que é o que o CSS usa para pintá-lo
//
// O ESTADO DE FORMULÁRIO NÃO MORA AQUI. Esta pasta guardava um wrapper preso ao
// `vee-validate` — `useFormField` lançava exceção fora de um `<Field>`, nenhuma
// story o renderizava e os `data-slot` divergiam do Vanilla (`form-item` em vez
// de `field`, `form-message` em vez de `field-error`). Valor, `touched`, `dirty`
// e erros de validação são da lib que a aplicação escolher, e reimplementá-los
// daria dois donos para a mesma informação — a mesma decisão registrada no Form
// do Angular.
//
// A fiação é feita PELO CAMPO, em uma direção só, varrendo o próprio DOM: o
// campo acha o controle projetado dentro dele e escreve nele e no rótulo. É o
// que faz `<Input>`, `<Textarea>`, `<select>` e os controles compostos passarem
// pelo mesmo caminho sem cada um precisar saber que está dentro de um campo.

/**
 * Ordem de prioridade para achar o controle dentro do campo.
 *
 * `querySelector` devolve o primeiro elemento em ordem de DOM, não o primeiro
 * seletor que casa — por isso a busca é seletor a seletor. Os `data-slot`
 * compostos vêm antes dos elementos nativos de propósito: checkbox, switch e
 * select desta stack renderizam um `<input>` escondido para participar do
 * formulário, e ele casaria com `input` antes do controle de verdade.
 */
const SELETORES_CONTROLE = [
  '[data-slot="input-group-control"]',
  '[data-slot="checkbox"]',
  '[data-slot="switch"]',
  '[data-slot="select-trigger"]',
  '[data-slot="slider"]',
  'input:not([type="hidden"])',
  'textarea',
  'select',
]

/** Contador de módulo: id curto aparece legível no `aria-describedby`. */
let sequencia = 0
</script>

<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { nextTick, onMounted, onUpdated, ref } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  /** Texto do rótulo. O campo o associa ao controle. */
  label?: string
  /** Texto de apoio abaixo do controle — formato esperado, política, exemplo. */
  description?: string
  /** Mensagem de erro. Presente, é anunciada e pinta o rótulo. */
  error?: string
  class?: HTMLAttributes['class']
}>()

sequencia += 1
const base = `nds-form-field-${sequencia}`
const idDescricao = `${base}-description`
const idErro = `${base}-error`

const raiz = ref<HTMLElement | null>(null)
/** Ids que quem compõe já tinha escrito no controle — preservados na junção. */
let describedbyEscrito: string[] | null = null

function aplicar() {
  const el = raiz.value
  if (!el) return

  let controle: HTMLElement | null = null
  for (const seletor of SELETORES_CONTROLE) {
    controle = el.querySelector<HTMLElement>(seletor)
    if (controle) break
  }

  const rotulo = el.querySelector<HTMLLabelElement>('label')
  // `for` só quando falta. Label que ENVOLVE o controle já está associado pela
  // estrutura, e escrever `for` ali não acrescenta nada.
  if (rotulo && controle && !rotulo.getAttribute('for') && !rotulo.contains(controle)) {
    if (!controle.id) controle.id = `${base}-control`
    rotulo.setAttribute('for', controle.id)
  }

  if (!controle) return

  // Junção, não substituição: quem compõe pode já ter apontado o controle para
  // um texto fora do campo, e sobrescrever descartaria essa instrução.
  describedbyEscrito ??= (controle.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter(Boolean)

  const ids = [
    ...describedbyEscrito,
    ...(props.description ? [idDescricao] : []),
    ...(props.error ? [idErro] : []),
  ]
  if (ids.length) controle.setAttribute('aria-describedby', ids.join(' '))
  else controle.removeAttribute('aria-describedby')
}

onMounted(() => nextTick(aplicar))
onUpdated(aplicar)
</script>

<template>
  <div
    ref="raiz"
    data-slot="field"
    :data-invalid="error ? 'true' : undefined"
    :class="cn('nds-form-field', props.class)"
  >
    <!-- `.nds-form-label[data-error="true"]` é a regra que pinta o rótulo de
         destructive. Sem o atributo, o erro só existiria abaixo do campo. -->
    <label
      v-if="label"
      data-slot="label"
      :data-error="error ? 'true' : undefined"
      class="nds-form-label"
    >
      {{ label }}
    </label>

    <slot />

    <p
      v-if="description"
      :id="idDescricao"
      data-slot="field-description"
      class="nds-form-description"
    >
      {{ description }}
    </p>

    <!-- `aria-live="polite"` e não `role="alert"`: em validação a cada tecla,
         interromper a digitação a cada caractere é pior que esperar a pausa. -->
    <p
      v-if="error"
      :id="idErro"
      data-slot="field-error"
      aria-live="polite"
      class="nds-form-error"
    >
      {{ error }}
    </p>
  </div>
</template>
