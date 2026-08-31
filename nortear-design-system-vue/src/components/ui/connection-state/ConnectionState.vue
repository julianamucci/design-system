<script lang="ts">
/**
 * A linha que diz se ainda há por onde pedir.
 *
 * Desenho em `nds/agent-run.css`, no bloco "Estado da ligação", que também
 * guarda as seis decisões de acessibilidade. O vocabulário — `ConnectionState`,
 * `isRetryScheduled` — vem de `@shared/primitives/chat-protocol`.
 *
 * NÃO É O ESTADO DA EXECUÇÃO, e a diferença não é de aparência: as duas linhas
 * se parecem de propósito. Aquela descreve o que o agente está fazendo com o
 * que se pediu; esta descreve se ainda há por onde pedir. Uma execução
 * concluída sobre uma ligação caída é um par perfeitamente possível, e é por
 * isso que os dois vocabulários são separados.
 *
 * A DECISÃO QUE GOVERNA A PEÇA: aqui EXISTE região viva, e é a segunda exceção
 * da folha. A regra da família proíbe por padrão, e a proibição vale — um
 * estado que se reanuncia corta a leitura da resposta. Perder a ligação é de
 * outra natureza: não é o passo seguinte de algo que ia bem, é o chão saindo, e
 * tudo o que for escrito daqui em diante não vai a lugar nenhum. Quem não vê a
 * tela não tem outro jeito de descobrir — o silêncio é indistinguível de uma
 * resposta demorada.
 *
 * E A REGIÃO ENVOLVE SÓ A PALAVRA, nunca a raiz. O rótulo carrega uma coisa só
 * e muda no máximo quando o estado muda; a contagem, que se reescreve a cada
 * segundo, fica FORA da região por construção. Região viva na raiz reanunciaria
 * o relógio, que é exatamente a armadilha com que a folha desta família abre.
 *
 * O QUE O COMPONENTE NÃO FAZ: abrir ligação, reconectar, contar o tempo,
 * formatá-lo ou reagendar tentativa. Ele desenha o estado que recebe e avisa
 * que alguém pediu para tentar de novo — mesma divisão de `approval` no
 * `chat-thread` e do estado da execução.
 *
 * DIVERGÊNCIA DE API DE FRAMEWORK, registrada e não "alinhada": o aviso de que
 * alguém pediu para tentar de novo é um EVENTO (`@retry`), e não um retorno que
 * se passa por prop. O conceito é o mesmo dos dois lados — quem abre a ligação é
 * quem consome; o que muda é por onde o pedido sai. Mesma forma do `@action` do
 * estado da execução nesta stack.
 *
 * O vocabulário mora neste bloco, e não no índice da pasta, porque a peça é
 * autônoma: ela não entra na API de nenhuma outra, e quem a usa a importa por
 * inteiro — componente e tipos — de um lugar só.
 */
import { isRetryScheduled, type ConnectionState } from '@shared/primitives/chat-protocol'

export interface ConnectionStateLabels {
  /**
   * A palavra de cada estado.
   *
   * É ela que descreve, e não a cor do ponto (decisão 4 da folha): cor sozinha
   * não descreve estado (WCAG 1.4.1), e aqui a cor é a ÚNICA diferença visual
   * entre os três. `Record` completo de propósito — estado novo no vocabulário
   * compartilhado reprova a compilação aqui, em vez de desenhar uma linha em
   * branco que ninguém repara.
   */
  state: Record<ConnectionState, string>
  /**
   * O rótulo da ação em cada estado. Estado sem entrada não oferece ação.
   *
   * Cada um diz O QUE FAZ naquele estado (decisão 5 da folha): apressar a
   * tentativa que já está marcada é outra coisa que começar uma quando não há
   * nenhuma. Botão que troca de função sem trocar de nome é o mesmo botão
   * fazendo coisas diferentes, e quem chega nele por tabulação não tem como
   * saber qual das duas.
   *
   * A ligação de pé fica de fora nas cinco stacks, e é decisão: sobre uma
   * ligação que está funcionando não há o que fazer aqui.
   */
  action?: Partial<Record<ConnectionState, string>>
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'

const props = withDefaults(
  defineProps<{
    /** Em que pé está a ligação. Quem abre o transporte é quem sabe, e é quem passa. */
    state?: ConnectionState
    /**
     * Quanto falta para a próxima tentativa, JÁ ESCRITO.
     *
     * String, e não segundos: formato de duração é decisão de idioma, e um
     * componente que o formatasse decidiria idioma em cinco lugares diferentes.
     * É a mesma escolha do relógio do estado da execução, com um motivo a mais
     * aqui — ela é vizinha de uma região viva.
     */
    countdown?: string
    labels: ConnectionStateLabels
  }>(),
  { state: 'connected' },
)

const emit = defineEmits<{
  /** Alguém pediu para tentar de novo. Abrir a ligação é de quem consome. */
  retry: []
}>()

/** O rótulo daquele estado, ou nada — e sem rótulo não há botão. */
const actionLabel = computed(() => props.labels.action?.[props.state])

/**
 * A CONTAGEM SÓ EXISTE ENQUANTO ALGO TENTA (decisão 3), e quem responde é
 * `isRetryScheduled`, do vocabulário compartilhado — não um `if` desta stack.
 * "em 5 s" ao lado de "Sem ligação" é um relógio que não corre, e quem lê fica
 * esperando por algo que ninguém agendou.
 */
const showsCountdown = computed(() => Boolean(props.countdown) && isRetryScheduled(props.state))
</script>

<template>
  <!-- `<p>`, e não `<div>`: é uma frase sobre o que está acontecendo, e o botão
       é conteúdo de frase. Nenhum papel ARIA na raiz — a região viva é do
       rótulo, e só dele (decisão 1). -->
  <p
    class="nds-connection-state"
    data-slot="connection-state"
    :data-state="state"
  >
    <!-- O PONTO É DECORATIVO (decisão 4). Ele é a leitura rápida para quem vê,
         e sai inteiro do que é lido em voz: a palavra ao lado já diz tudo. -->
    <span
      class="nds-connection-state-dot"
      data-slot="connection-state-dot"
      aria-hidden="true"
    />

    <!-- A PALAVRA É A REGIÃO VIVA, e é a única parte que se anuncia (decisão 1).

         `role="status"` é polido: entra na fila e nunca corta o que estiver
         sendo lido. E ele está AQUI, e não na raiz, porque este elemento
         carrega uma coisa só — a palavra — e ela muda no máximo quando o estado
         muda. -->
    <span
      class="nds-connection-state-label"
      data-slot="connection-state-label"
      role="status"
    >{{ labels.state[state] }}</span>

    <!-- E A CONTAGEM NÃO SE ANUNCIA (decisão 2): fica FORA da região viva por
         construção, e ainda leva `aria-hidden`, porque é vizinha dela. -->
    <span
      v-if="showsCountdown"
      class="nds-connection-state-countdown"
      data-slot="connection-state-countdown"
      aria-hidden="true"
    >{{ countdown }}</span>

    <!-- A AÇÃO DIZ O QUE FAZ (decisão 5), e o rótulo é o nome acessível: não há
         `aria-label` separado, porque o texto que se vê já diz o que o botão
         faz — e nome acessível que diverge do texto visível quebra WCAG 2.5.3
         pelo caminho. -->
    <Button
      v-if="actionLabel"
      class="nds-connection-state-action"
      data-slot="connection-state-action"
      variant="outline"
      size="sm"
      @click="emit('retry')"
    >
      {{ actionLabel }}
    </Button>
  </p>
</template>
