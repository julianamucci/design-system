<script lang="ts">
/**
 * A linha que diz em que pé está a resposta.
 *
 * Desenho em `nds/agent-run.css`, no bloco "Estado da execução", que também
 * guarda as quatro decisões de acessibilidade. O vocabulário — `RunStatus`,
 * `isRunFinished` — vem de `@shared/primitives/chat-protocol`.
 *
 * A DECISÃO QUE GOVERNA A PEÇA: ela NÃO É REGIÃO VIVA, apesar de o estado mudar
 * sozinho. A tentação é grande, e é errada: quem lê está ouvindo a RESPOSTA ser
 * gerada logo abaixo, e um anúncio a cada troca de estado corta a leitura no
 * meio. Quem quiser anunciar põe a região viva por fora, sabendo o que está
 * fazendo — e é por isso que não há `aria-live` nem `role` nenhum aqui.
 *
 * A PEÇA É AUTÔNOMA. Ela fica ACIMA do campo de mensagem, e não dentro dele: o
 * campo desenha o que se escreve agora, e esta linha fala do que já foi pedido.
 * Nenhum arquivo do campo sabe que ela existe, e ela não entra na descrição
 * acessível dele.
 *
 * O QUE O COMPONENTE NÃO FAZ: parar, retomar, repetir, contar o tempo ou
 * formatá-lo. Ele desenha o estado que recebe e avisa que alguém pediu a ação —
 * mesma divisão da faixa de rascunho e da aprovação de ferramenta.
 *
 * DIVERGÊNCIA DE API DE FRAMEWORK, registrada e não "alinhada": o aviso de que
 * alguém pediu a ação é um EVENTO (`@action`), e não um retorno que se passa
 * por prop. O conceito é o mesmo dos dois lados — quem para e quem recomeça é
 * quem consome; o que muda é por onde o pedido sai.
 *
 * O vocabulário mora neste bloco, e não no índice da pasta, porque a peça é
 * autônoma: ela não entra na API de nenhuma outra, e quem a usa a importa por
 * inteiro — componente e tipos — de um lugar só.
 */
import { isRunFinished, type RunStatus } from '@shared/primitives/chat-protocol'

/**
 * O que a ação pede.
 *
 * É INTENÇÃO, e não o estado seguinte: entre pedir para parar e a execução
 * parar de fato existe uma resposta a caminho, e um componente que anunciasse
 * `stopped` estaria adivinhando o que ainda não aconteceu. Mesma escolha do
 * ditado por voz.
 *
 * `start` cobre retomar e refazer de propósito. A diferença entre continuar de
 * onde parou e começar do zero é política de produto — o design system desenha
 * a mesma linha nos dois casos, e é quem consome que sabe o que sobrou.
 */
export type AgentStatusIntent = 'stop' | 'start'

export interface AgentStatusLabels {
  /**
   * A palavra de cada estado.
   *
   * É ela que descreve, e não a cor do ponto (decisão 2 da folha): a cor é a
   * única diferença visual entre três dos cinco, e cor sozinha não descreve
   * estado (WCAG 1.4.1). `Record` completo de propósito — estado novo no
   * vocabulário compartilhado reprova a compilação aqui, em vez de desenhar uma
   * linha em branco que ninguém repara.
   */
  status: Record<RunStatus, string>
  /**
   * O rótulo da ação em cada estado. Estado sem entrada não oferece ação.
   *
   * Cada um diz O QUE FAZ naquele estado (decisão 4 da folha) — "Parar"
   * enquanto corre, "Tentar de novo" depois da falha. Botão que troca de função
   * sem trocar de nome é o mesmo botão fazendo coisas diferentes, e quem chega
   * nele por tabulação não tem como saber qual das duas.
   *
   * Em espera e concluída ficam de fora nas cinco stacks, e é decisão: começar
   * uma execução é do campo de mensagem, não desta linha, e sobre uma resposta
   * pronta não há o que fazer aqui.
   */
  action?: Partial<Record<RunStatus, string>>
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'

const props = withDefaults(
  defineProps<{
    /** Em que pé está a execução. Quem executa é quem sabe, e é quem passa. */
    status?: RunStatus
    /**
     * Há quanto tempo a execução corre, JÁ ESCRITO.
     *
     * String, e não segundos: formato de duração é decisão de idioma, e um
     * componente que o formatasse decidiria idioma em cinco lugares diferentes.
     * É a mesma escolha do tempo decorrido do ditado por voz e do carimbo da
     * faixa de rascunho.
     */
    elapsed?: string
    labels: AgentStatusLabels
  }>(),
  { status: 'idle' },
)

const emit = defineEmits<{
  /** Alguém pediu a ação. Parar e começar de verdade são de quem consome. */
  action: [intent: AgentStatusIntent]
}>()

/** O rótulo daquele estado, ou nada — e sem rótulo não há botão. */
const actionLabel = computed(() => props.labels.action?.[props.status])

/**
 * A INTENÇÃO SAI DO VOCABULÁRIO, e não de um `if` daqui: enquanto a execução
 * não terminou a ação INTERROMPE, e depois de terminada ela COMEÇA DE NOVO.
 * Quem responde "já terminou?" é `isRunFinished`, e é o que impede as cinco
 * stacks de escreverem cinco versões da mesma regra — uma delas discordaria
 * sobre a execução interrompida, que é o estado em que a resposta é menos
 * óbvia.
 */
const intent = computed<AgentStatusIntent>(() =>
  isRunFinished(props.status) ? 'start' : 'stop',
)
</script>

<template>
  <!-- `<p>`, e não `<div>`: é uma frase sobre o que está acontecendo, e o botão
       é conteúdo de frase. Nenhum papel ARIA, nenhuma região viva (decisão 1
       da folha) — quem lê está ouvindo a resposta ser gerada logo abaixo. -->
  <p
    class="nds-agent-status"
    data-slot="agent-status"
    :data-status="status"
  >
    <!-- O PONTO É DECORATIVO (decisão 2). Ele é a leitura rápida para quem vê,
         e sai inteiro do que é lido em voz: a palavra ao lado já diz tudo, e
         repeti-la em desenho não acrescenta nada a quem ouve. -->
    <span
      class="nds-agent-status-dot"
      data-slot="agent-status-dot"
      aria-hidden="true"
    />

    <span
      class="nds-agent-status-label"
      data-slot="agent-status-label"
    >{{ labels.status[status] }}</span>

    <!-- O RELÓGIO NÃO SE ANUNCIA (decisão 3, e regra 9 da guideline 17).

         Ele se reescreve enquanto a execução corre, e um número que se
         reanuncia a cada segundo torna a tela impossível de ouvir. Fica visível
         e sai do que é lido — quem ouve recebe a palavra do estado, que é o que
         decide o que fazer. -->
    <span
      v-if="elapsed"
      class="nds-agent-status-elapsed"
      data-slot="agent-status-elapsed"
      aria-hidden="true"
    >{{ elapsed }}</span>

    <!-- A AÇÃO MUDA COM O ESTADO (decisão 4), e o rótulo é o nome acessível:
         não há `aria-label` separado, porque o texto que se vê já diz o que o
         botão faz — e nome acessível que diverge do texto visível quebra WCAG
         2.5.3 pelo caminho. -->
    <Button
      v-if="actionLabel"
      data-slot="agent-status-action"
      variant="outline"
      size="sm"
      @click="emit('action', intent)"
    >
      {{ actionLabel }}
    </Button>
  </p>
</template>
