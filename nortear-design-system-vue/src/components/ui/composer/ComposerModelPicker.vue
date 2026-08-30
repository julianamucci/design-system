<script setup lang="ts">
/**
 * O controle do trilho que diz QUEM responde.
 *
 * Desenho em `nds/composer.css`, no bloco do seletor de modelo, que também
 * guarda as quatro decisões de acessibilidade. O vocabulário — `ModelOption`,
 * `isModelSelectable` — vem de `@shared/primitives/chat-protocol`.
 *
 * A PEÇA É AUTÔNOMA. Ela não mora dentro do composer: quem consome a monta e a
 * põe no início do trilho, pelo mesmo espaço que qualquer outro controle usa.
 * É o que permite ter o seletor sem ter o campo — numa barra de ferramentas,
 * numa página de ajustes — e é o que impede o composer de crescer uma prop por
 * controle que alguém invente.
 *
 * O GATILHO LEVA SÓ O NOME, A LISTA LEVA A DESCRIÇÃO. Um trilho é estreito e o
 * nome é o que se confere de relance; a descrição é o que se lê na hora de
 * trocar. Pôr as duas no gatilho encolhe o campo, que é o que importa ali.
 *
 * O FOCO ENTRA NA LISTA, ao contrário do seletor do caractere gatilho. Lá o
 * foco não pode sair do campo, porque quem escolhe continua escrevendo; aqui
 * não há texto em curso — a escolha é o único assunto enquanto a lista está
 * aberta, e a lista é o lugar certo para o teclado estar. O cursor anda por
 * `aria-activedescendant`, e fechar devolve o foco ao gatilho.
 *
 * O QUE O COMPONENTE NÃO FAZ: trocar de modelo. Ele avisa qual foi confirmado
 * e devolve o controle — quem sabe o que a troca custa, quem tem direito a
 * qual e o que acontece depois é quem monta a conversa. Mesma divisão de
 * `approval` no `chat-thread`.
 *
 * DIVERGÊNCIA DE API DE FRAMEWORK, registrada e não "alinhada": o aviso de
 * escolha e o de abertura são EVENTOS (`@change`, `@open-change`), e não
 * retornos que se passam por prop. O conceito é o mesmo dos dois lados — quem
 * aplica a troca é quem monta a conversa; o que muda é por onde o aviso sai.
 */
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  watch,
  type HTMLAttributes,
} from 'vue'
import { isModelSelectable, type ModelOption } from '@shared/primitives/chat-protocol'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ComposerModelPickerLabels } from './index'

const props = withDefaults(
  defineProps<{
    /** Os modelos que podem responder, na ordem em que aparecem na lista. */
    models: ModelOption[]
    /** O texto da interface. Sem padrão em inglês escondido. */
    labels: ComposerModelPickerLabels
    /**
     * O modelo escolhido, pelo endereço dele.
     *
     * Sem ele, o primeiro que PODE responder: abrir com um indisponível no
     * gatilho prometeria uma resposta que não vem. Sozinho é semente;
     * acompanhado do aviso de troca, é quem consome que manda.
     */
    value?: string
    /**
     * A lista começa aberta.
     *
     * É SEMENTE, e não controle: quem abre e fecha depois é o próprio seletor,
     * porque abrir e fechar é desenho e não estado do mundo (guideline 17, §2).
     * O aviso de abertura existe para quem precisa acompanhar.
     */
    open?: boolean
    class?: HTMLAttributes['class']
  }>(),
  { open: false },
)

const emit = defineEmits<{
  /** Alguém confirmou um modelo. Aplicar a troca é de quem monta a conversa. */
  change: [model: ModelOption]
  /** A lista abriu ou fechou. */
  openChange: [open: boolean]
}>()

const id = useId()
const panelId = `${id}-panel`
const optionId = (index: number) => `${id}-option-${index}`

/** O primeiro que pode responder, ou o primeiro da lista se nenhum puder. */
function firstSelectable(): number {
  const found = props.models.findIndex(isModelSelectable)
  return found === -1 ? 0 : found
}

/** Onde mora o endereço recebido — ou o primeiro que pode responder. */
function indexOf(target: string | undefined): number {
  if (target === undefined) return firstSelectable()
  const found = props.models.findIndex((model) => model.id === target)
  return found === -1 ? firstSelectable() : found
}

const selectedIndex = ref(indexOf(props.value))
const activeIndex = ref(selectedIndex.value)
const isOpen = ref(props.open)

const rootRef = ref<HTMLDivElement | null>(null)
const panelRef = ref<HTMLDivElement | null>(null)
const triggerRef = ref<{ $el?: unknown } | null>(null)

/**
 * O escolhido pode vir de fora depois de montado — é por aqui que uma escolha
 * APLICADA volta para a tela. `open` não tem par: ele é semente, e quem abre e
 * fecha depois é o próprio seletor.
 */
watch(
  () => props.value,
  (next) => {
    selectedIndex.value = indexOf(next)
  },
)

const selected = computed<ModelOption | undefined>(() => props.models[selectedIndex.value])

/** O gatilho leva só o NOME: a descrição é da lista. */
const triggerText = computed(() => selected.value?.label ?? '')

/**
 * Decisão 1 da folha: o nome acessível diz O QUE o gatilho escolhe, e não só o
 * valor escolhido — "Rápido, botão" não informa nada.
 */
const triggerName = computed(() => props.labels.trigger.replace('{label}', triggerText.value))

/** O `Primitive` do reka devolve a instância; o nó vem pelo `$el`. */
function triggerElement(): HTMLElement | undefined {
  const el = triggerRef.value?.$el
  return el instanceof HTMLElement ? el : undefined
}

function setActive(index: number): void {
  if (index < 0 || index >= props.models.length) return
  activeIndex.value = index
}

function move(delta: number): void {
  const total = props.models.length
  if (total === 0) return
  // Anda por TODAS as opções, inclusive as que não podem ser escolhidas.
  // Pular a indisponível esconderia o motivo justamente de quem navega por
  // teclado — que é quem mais depende de ele estar na leitura.
  setActive((activeIndex.value + delta + total) % total)
}

function onDocumentPointerDown(event: Event): void {
  // O que acontece DENTRO do seletor é dele — inclusive no gatilho, que fecha
  // pelo próprio clique logo depois.
  if (rootRef.value?.contains(event.target as Node)) return
  setOpen(false, false)
}

function setOpen(next: boolean, moveFocus: boolean): void {
  if (next === isOpen.value) return
  isOpen.value = next

  if (next) {
    // O cursor começa no que já estava escolhido: é de lá que quem troca
    // parte, e começar no topo faria a lista perder o lugar a cada abertura.
    activeIndex.value = selectedIndex.value
    document.addEventListener('pointerdown', onDocumentPointerDown, true)
    // A lista só entra no documento no próximo quadro.
    if (moveFocus) void nextTick(() => panelRef.value?.focus())
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerDown, true)
    // Sem isto o foco cairia no começo da página quando a lista some, e quem
    // navega por teclado perderia o lugar.
    if (moveFocus) triggerElement()?.focus()
  }

  emit('openChange', next)
}

function choose(index: number): void {
  const model = props.models[index]
  if (!model) return
  // A pergunta vai ao vocabulário compartilhado, e não a um `if
  // (model.unavailable)` escrito aqui: cinco stacks escreveriam cinco versões
  // da mesma regra, e uma delas discordaria.
  if (!isModelSelectable(model)) {
    // Nada muda, e a lista CONTINUA ABERTA. Fechar sem trocar pareceria uma
    // troca que não aconteceu, e o motivo — que está na própria opção — sairia
    // da tela junto.
    setActive(index)
    return
  }
  selectedIndex.value = index
  setOpen(false, true)
  emit('change', model)
}

function onTriggerKeydown(event: KeyboardEvent): void {
  // A seta abre já com a lista sob o cursor — é o atalho de quem troca de
  // modelo sem tirar as mãos do teclado.
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  if (isOpen.value) return
  event.preventDefault()
  setOpen(true, true)
}

function onPanelKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      move(1)
      return
    case 'ArrowUp':
      event.preventDefault()
      move(-1)
      return
    case 'Home':
      event.preventDefault()
      setActive(0)
      return
    case 'End':
      event.preventDefault()
      setActive(props.models.length - 1)
      return
    case 'Enter':
    case ' ':
      event.preventDefault()
      choose(activeIndex.value)
      return
    case 'Escape':
    case 'Tab':
      // Tab fecha como Escape: a lista não é uma parada da ordem de foco, e
      // deixar o foco sair dela com o painel aberto deixaria um painel sem
      // dono na tela.
      event.preventDefault()
      setOpen(false, true)
      return
    default:
  }
}

function toggle(): void {
  // Abrir leva o foco para a lista; fechar pelo gatilho não mexe no foco, que
  // já está nele.
  setOpen(!isOpen.value, !isOpen.value)
}

onMounted(() => {
  // A semente já abriu a lista, mas o ouvinte do documento só passa a existir
  // aqui — e sem ele um toque fora não fecharia nada. Abrir de saída NÃO move
  // o foco: roubá-lo ao montar a página é exatamente o que a story
  // fotografaria.
  if (isOpen.value) document.addEventListener('pointerdown', onDocumentPointerDown, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
})
</script>

<template>
  <div
    ref="rootRef"
    data-slot="composer-model"
    :data-state="isOpen ? 'open' : 'closed'"
    :class="cn('nds-composer-model', props.class)"
  >
    <!-- O gatilho só aponta a lista enquanto ela existe: apontar um endereço
         vazio é prometer um elemento que não está no documento. -->
    <Button
      ref="triggerRef"
      data-slot="composer-model-trigger"
      variant="ghost"
      size="sm"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? panelId : undefined"
      :aria-label="triggerName"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      {{ triggerText }}
    </Button>

    <!-- A lista só existe no documento quando aberta. Não é uma lista
         escondida: uma lista presente e invisível continuaria sendo lida, e
         prometeria uma escolha que não está à mão. O foco pousa nela e o
         cursor anda por `aria-activedescendant`; `tabindex` de -1 e não de 0
         porque a lista não é uma parada da ordem de foco — quem chega por Tab
         chega ao gatilho, que é o controle. -->
    <div
      v-if="isOpen"
      :id="panelId"
      ref="panelRef"
      data-slot="composer-model-panel"
      class="nds-composer-model-panel"
      role="listbox"
      :tabindex="-1"
      :aria-label="labels.list"
      :aria-activedescendant="optionId(activeIndex)"
      @keydown="onPanelKeydown"
    >
      <!-- Decisão 2 da folha: `aria-disabled` mais a frase, nunca só o cinza.
           `disabled` de verdade tiraria a opção da leitura em vez de
           explicá-la. -->
      <div
        v-for="(model, index) in models"
        :id="optionId(index)"
        :key="model.id"
        class="nds-composer-model-option"
        data-slot="composer-model-option"
        :data-model-id="model.id"
        role="option"
        :aria-selected="index === selectedIndex"
        :aria-disabled="isModelSelectable(model) ? undefined : 'true'"
        :data-active="index === activeIndex ? 'true' : undefined"
        @click="choose(index)"
      >
        <span class="nds-composer-model-name">{{ model.label }}</span>

        <!-- Decisão 3 da folha: a etiqueta é REFORÇO. O desenho vem do badge
             do sistema; o lugar na grade vem da classe da folha. -->
        <Badge
          v-if="model.badge"
          class="nds-composer-model-badge"
        >
          {{ model.badge }}
        </Badge>

        <span
          v-if="model.description"
          class="nds-composer-model-description"
        >{{ model.description }}</span>

        <!-- O motivo em TEXTO, dentro da opção — é o que o cursor anuncia ao
             passar por ela. Opção apagada sem explicação é a pergunta "por que
             não posso?" sem resposta na tela. -->
        <span
          v-if="model.unavailable && model.unavailableReason"
          class="nds-composer-model-description"
          data-slot="composer-model-reason"
        >{{ model.unavailableReason }}</span>
      </div>
    </div>
  </div>
</template>
