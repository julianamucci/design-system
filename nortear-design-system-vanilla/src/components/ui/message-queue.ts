import { createBadge } from './badge';
import { createButton } from './button';
import {
  canWithdraw,
  type QueuedMessage,
  type QueuedMessageState,
} from '@shared/primitives/chat-protocol';

/**
 * As mensagens escritas enquanto a anterior ainda era respondida.
 *
 * Desenho em `nds/composer.css`, no bloco da fila de envio, que também guarda
 * as cinco decisões de acessibilidade. O vocabulário — `QueuedMessage`,
 * `QueuedMessageState`, `canWithdraw` — vem de
 * `@shared/primitives/chat-protocol`.
 *
 * A PEÇA É AUTÔNOMA, e fica ACIMA do campo em vez de dentro dele. Contexto,
 * anexo e citação vivem dentro da moldura porque descrevem o que ainda está
 * sendo escrito; a fila é o oposto — é o que JÁ SAIU das mãos de quem escreve,
 * e pô-la dentro do campo a misturaria com o que ainda não saiu. Quem consome
 * empilha as duas peças, nesta ordem.
 *
 * A DECISÃO QUE GOVERNA A PEÇA: ela não envia nada. Enviar, reordenar e decidir
 * o que acontece com o que foi retirado é de quem consome — a mesma divisão de
 * `approval` no `chat-thread` e de `onRemove` nos anexos. Uma fila que
 * enviasse sozinha traria transporte junto, e transporte envelhece por produto,
 * não por sistema.
 *
 * A FILA NÃO É REGIÃO VIVA. Cada item entrou porque a própria pessoa o
 * escreveu, e devolver em voz o que se acabou de digitar é repetir, não
 * informar. É a mesma decisão do contador de caracteres do campo e do relógio
 * do reprodutor de mídia, pelo mesmo motivo.
 */

export interface MessageQueueLabels {
  /** Nome acessível da fila. */
  list: string;
  /** Nome do botão de retirar. `{text}` vira o texto da mensagem. */
  withdraw: string;
  /**
   * A palavra de cada estado. É ela que distingue a que já saiu — a folha só
   * a deixa mais apagada, e transparência sozinha não descreve estado
   * (WCAG 1.4.1).
   */
  state: Record<QueuedMessageState, string>;
}

export interface MessageQueueOptions {
  /** As mensagens que esperam, na ordem em que saem. */
  messages: QueuedMessage[];
  labels: MessageQueueLabels;
  /** Alguém pediu para retirar. Retirar de verdade é de quem envia. */
  onWithdraw?: (message: QueuedMessage) => void;
  class?: string;
}

/**
 * Monta a fila, ou nada quando não há o que esperar.
 *
 * `null` e não uma lista vazia: uma `<ol>` sem item é anunciada como "lista com
 * zero itens", que promete algo que não há. É a mesma decisão da lista de
 * contexto do campo, e aqui ela precisa morar na fábrica — a peça é autônoma, e
 * não existe um campo por perto para decidir por ela.
 */
export function createMessageQueue(
  options: MessageQueueOptions,
): HTMLOListElement | null {
  const { messages, labels, onWithdraw } = options;

  if (messages.length === 0) return null;

  // `<ol>` e não `<ul>`: aqui a ordem É a informação. Quem espera quer saber
  // que é a terceira, e uma lista não ordenada anuncia quantos itens há sem
  // dizer em que lugar cada um está.
  const list = document.createElement('ol');
  list.dataset.slot = 'composer-queue';
  list.className = ['nds-composer-queue', options.class].filter(Boolean).join(' ');
  list.setAttribute('aria-label', labels.list);

  messages.forEach((message, index) => {
    const item = document.createElement('li');
    item.className = 'nds-composer-queue-item';
    item.dataset.slot = 'composer-queue-item';
    item.dataset.state = message.state;
    if (message.id) item.dataset.messageId = message.id;

    // O ocupado é ATRIBUTO, e o que está acontecendo é frase (decisão 3 da
    // folha). Os dois juntos: quem ouve recebe o estado ocupado do item e a
    // palavra que diz o que ele significa.
    if (message.state === 'sending') item.setAttribute('aria-busy', 'true');

    // A posição é TEXTO no documento, e não um `::before` da folha (decisão 1):
    // conteúdo gerado por folha não é confiável para leitor de tela e some
    // quando a folha não carrega. O número sai do índice — a ordem da lista é
    // a própria fila, e um número recebido de fora poderia discordar dela.
    const position = document.createElement('span');
    position.className = 'nds-composer-queue-position';
    position.dataset.slot = 'composer-queue-position';
    position.textContent = String(index + 1);
    item.appendChild(position);

    const text = document.createElement('span');
    text.className = 'nds-composer-queue-text';
    text.dataset.slot = 'composer-queue-text';
    text.textContent = message.text;
    item.appendChild(text);

    // A palavra do estado, em etiqueta curta. É `nds-badge` de propósito: a
    // folha da família não declara classe própria para ela, e inventar uma
    // aqui deixaria o desenho fora do lugar onde as decisões moram.
    const stateLabel = createBadge({ children: labels.state[message.state] });
    stateLabel.dataset.slot = 'composer-queue-state';
    item.appendChild(stateLabel);

    // Quem pode ser retirada sai do VOCABULÁRIO, e não de um `if` da tela
    // (decisão 2 da folha). Botão que promete desfazer o que não desfaz é pior
    // que botão nenhum, e cinco `if` escritos à mão terminariam com um deles
    // discordando dos outros quatro.
    if (canWithdraw(message)) {
      // O nome acessível leva o TEXTO DA MENSAGEM (decisão 4): uma fila de três
      // botões chamados "Retirar" é um botão só para quem navega por audição.
      const withdraw = createButton({
        label: '×',
        variant: 'ghost',
        size: 'icon-sm',
        'aria-label': labels.withdraw.replace('{text}', message.text),
        onClick: () => onWithdraw?.(message),
      });
      withdraw.classList.add('nds-composer-queue-withdraw');
      withdraw.dataset.slot = 'composer-queue-withdraw';
      item.appendChild(withdraw);
    }

    list.appendChild(item);
  });

  return list;
}
