import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import {
  canWithdraw,
  type QueuedMessage,
  type QueuedMessageState,
} from '@shared/primitives/chat-protocol';
import { NdsBadge } from './badge';
import { NdsButton } from './button';

// ─── MessageQueue ─────────────────────────────────────────────────────────────
//
// As mensagens escritas enquanto a anterior ainda era respondida.
//
// Desenho em docs/shared/styles/nds/composer.css, no bloco da fila de envio,
// que também guarda as cinco decisões de acessibilidade. O vocabulário —
// `QueuedMessage`, `QueuedMessageState`, `canWithdraw` — vem de
// `@shared/primitives/chat-protocol`.
//
// A PEÇA É AUTÔNOMA, e fica ACIMA do campo em vez de dentro dele. Contexto,
// anexo e citação vivem dentro da moldura porque descrevem o que ainda está
// sendo escrito; a fila é o oposto — é o que JÁ SAIU das mãos de quem escreve,
// e pô-la dentro do campo a misturaria com o que ainda não saiu. Quem consome
// empilha as duas peças, nesta ordem.
//
// A DECISÃO QUE GOVERNA A PEÇA: ela não envia nada. Enviar, reordenar e decidir
// o que acontece com o que foi retirado é de quem consome — a mesma divisão de
// `approval` no `chat-thread` e de `removeContext` na lista de contexto. Uma
// fila que enviasse sozinha traria transporte junto, e transporte envelhece por
// produto, não por sistema.
//
// A FILA NÃO É REGIÃO VIVA. Cada item entrou porque a própria pessoa o
// escreveu, e devolver em voz o que se acabou de digitar é repetir, não
// informar. É a mesma decisão do contador de caracteres do campo e do relógio
// do reprodutor de mídia, pelo mesmo motivo.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//
//   - o retorno é um `output()` chamado `withdraw`, e não um callback
//     `onWithdraw` passado como propriedade. É o caminho desta stack, o mesmo
//     de `removeContext`, `removeAttachment` e `dismissQuote`.
//   - a AUSÊNCIA é da `<ol>`, e não do elemento inteiro. Na stack de referência
//     a fábrica devolve nada e não sobra elemento nenhum; aqui o host
//     `<nds-message-queue>` continua existindo, porque um elemento customizado
//     não pode deixar de existir. O que o `@if` tira é a lista — e é ela que
//     seria anunciada como "lista com zero itens", prometendo o que não há.
//   - não há entrada `class`: `class` é nativo do host, e quem consome a
//     escreve direto no elemento. O host leva `nds-block` porque a fila é uma
//     coluna e o elemento customizado nasce em linha — mesma escolha do
//     invólucro do combobox.

/** O texto da fila. Sem padrão em inglês escondido. */
export interface MessageQueueLabels {
  /** Nome acessível da fila. */
  list: string;
  /** Nome do botão de retirar. `{text}` vira o texto da mensagem. */
  withdraw: string;
  /**
   * A palavra de cada estado. É ela que distingue a que já saiu — a folha só a
   * deixa mais apagada, e transparência sozinha não descreve estado
   * (WCAG 1.4.1).
   */
  state: Record<QueuedMessageState, string>;
}

@Component({
  selector: 'nds-message-queue',
  standalone: true,
  imports: [NdsBadge, NdsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-block',
  },
  template: `
    <!-- Sem mensagem, a LISTA não existe. Uma \`<ol>\` vazia seria anunciada
         como "lista com zero itens", que promete algo que não há — e aqui a
         decisão precisa morar no próprio componente: a peça é autônoma, e não
         existe um campo por perto para decidir por ela.

         \`<ol>\` e não \`<ul>\`: aqui a ordem É a informação. Quem espera quer
         saber que é a terceira, e uma lista não ordenada anuncia quantos itens
         há sem dizer em que lugar cada um está.

         A fila tem NOME PRÓPRIO, para se distinguir das outras listas da tela
         — a de contexto e a de anexos moram logo abaixo, dentro do campo. -->
    @if (rows().length > 0) {
      <ol
        class="nds-composer-queue"
        data-slot="composer-queue"
        [attr.aria-label]="labels().list"
      >
        @for (row of rows(); track row.key) {
          <!-- O ocupado é ATRIBUTO, e o que está acontecendo é frase (decisão 3
               da folha). Os dois juntos: quem ouve recebe o estado ocupado do
               item e a palavra que diz o que ele significa. -->
          <li
            class="nds-composer-queue-item"
            data-slot="composer-queue-item"
            [attr.data-state]="row.message.state"
            [attr.data-message-id]="row.message.id ?? null"
            [attr.aria-busy]="row.busy"
          >
            <!-- A posição é TEXTO no documento, e não um \`::before\` da folha
                 (decisão 1): conteúdo gerado por folha não é confiável para
                 leitor de tela e some quando a folha não carrega. O número sai
                 da ordem da lista — a lista é a própria fila, e um número
                 recebido de fora poderia discordar dela. -->
            <span
              class="nds-composer-queue-position"
              data-slot="composer-queue-position"
            >{{ row.position }}</span>

            <span
              class="nds-composer-queue-text"
              data-slot="composer-queue-text"
            >{{ row.message.text }}</span>

            <!-- A palavra do estado, em etiqueta curta. É o badge do design
                 system de propósito: a folha da família não declara classe
                 própria para ela, e inventar uma aqui deixaria o desenho fora
                 do lugar onde as decisões moram. -->
            <span
              ndsBadge
              data-slot="composer-queue-state"
            >{{ row.stateWord }}</span>

            <!-- Quem pode ser retirada sai do VOCABULÁRIO, e não de um \`if\` da
                 tela (decisão 2 da folha). Botão que promete desfazer o que não
                 desfaz é pior que botão nenhum, e cinco \`if\` escritos à mão
                 terminariam com um deles discordando dos outros quatro. -->
            @if (row.withdrawable) {
              <!-- O nome acessível leva o TEXTO DA MENSAGEM (decisão 4): uma
                   fila de três botões chamados "Retirar" é um botão só para
                   quem navega por audição. -->
              <button
                ndsButton
                type="button"
                variant="ghost"
                size="icon-sm"
                class="nds-composer-queue-withdraw"
                data-slot="composer-queue-withdraw"
                [attr.aria-label]="row.withdrawLabel"
                (click)="withdraw.emit(row.message)"
              >×</button>
            }
          </li>
        }
      </ol>
    }
  `,
})
export class NdsMessageQueue {
  /** As mensagens que esperam, na ordem em que saem. */
  readonly messages = input<QueuedMessage[]>([]);

  /** O texto da interface. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<MessageQueueLabels>();

  /**
   * Alguém pediu para retirar, e a mensagem vai junto.
   *
   * Retirar de verdade é de quem envia: só ele sabe se a mensagem ainda dá para
   * segurar. O componente avisa e devolve o controle.
   */
  readonly withdraw = output<QueuedMessage>();

  /**
   * Cada linha já resolvida: a posição, a palavra do estado, o nome do botão e
   * quem oferece retirar.
   *
   * Resolver aqui, e não em chamada de método no template, é o que impede a
   * pergunta ao protocolo de rodar a cada detecção de mudanças.
   */
  protected readonly rows = computed(() => {
    const labels = this.labels();
    return this.messages().map((message, index) => ({
      key: message.id ?? `${index}-${message.text}`,
      message,
      position: String(index + 1),
      stateWord: labels.state[message.state],
      // Atributo só no item que está indo: `aria-busy="false"` em toda a fila
      // seria ruído que não descreve nada.
      busy: message.state === 'sending' ? 'true' : null,
      withdrawable: canWithdraw(message),
      withdrawLabel: labels.withdraw.replace('{text}', message.text),
    }));
  });
}
