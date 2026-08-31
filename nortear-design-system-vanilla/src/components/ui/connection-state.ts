import { createButton } from './button';
import { isRetryScheduled, type ConnectionState } from '@shared/primitives/chat-protocol';

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
 */

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
  state: Record<ConnectionState, string>;
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
  action?: Partial<Record<ConnectionState, string>>;
}

export interface ConnectionStateOptions {
  /** Em que pé está a ligação. Quem abre o transporte é quem sabe, e é quem passa. */
  state?: ConnectionState;
  /**
   * Quanto falta para a próxima tentativa, JÁ ESCRITO.
   *
   * String, e não segundos: formato de duração é decisão de idioma, e um
   * componente que o formatasse decidiria idioma em cinco lugares diferentes.
   * É a mesma escolha do relógio do estado da execução, com um motivo a mais
   * aqui — ela é vizinha de uma região viva.
   */
  countdown?: string;
  labels: ConnectionStateLabels;
  /** Alguém pediu para tentar de novo. Abrir a ligação é de quem consome. */
  onRetry?: () => void;
  class?: string;
}

export function createConnectionState(options: ConnectionStateOptions): HTMLElement {
  const { state = 'connected', countdown, labels, onRetry } = options;

  // `<p>`, e não `<div>`: é uma frase sobre o que está acontecendo, e o botão é
  // conteúdo de frase. Nenhum papel ARIA na raiz — a região viva é do rótulo,
  // e só dele (decisão 1).
  const root = document.createElement('p');
  root.dataset.slot = 'connection-state';
  root.className = ['nds-connection-state', options.class].filter(Boolean).join(' ');
  root.dataset.state = state;

  // O PONTO É DECORATIVO (decisão 4). Ele é a leitura rápida para quem vê, e
  // sai inteiro do que é lido em voz: a palavra ao lado já diz tudo.
  const dot = document.createElement('span');
  dot.className = 'nds-connection-state-dot';
  dot.dataset.slot = 'connection-state-dot';
  dot.setAttribute('aria-hidden', 'true');
  root.appendChild(dot);

  // A PALAVRA É A REGIÃO VIVA, e é a única parte que se anuncia (decisão 1).
  //
  // `role="status"` é polido: entra na fila e nunca corta o que estiver sendo
  // lido. E ele está AQUI, e não na raiz, porque este elemento carrega uma
  // coisa só — a palavra — e ela muda no máximo quando o estado muda.
  const label = document.createElement('span');
  label.className = 'nds-connection-state-label';
  label.dataset.slot = 'connection-state-label';
  label.setAttribute('role', 'status');
  label.textContent = labels.state[state];
  root.appendChild(label);

  // A CONTAGEM SÓ EXISTE ENQUANTO ALGO TENTA (decisão 3), e quem responde é
  // `isRetryScheduled`, do vocabulário compartilhado — não um `if` desta stack.
  // "em 5 s" ao lado de "Sem ligação" é um relógio que não corre, e quem lê
  // fica esperando por algo que ninguém agendou.
  //
  // E ELA NÃO SE ANUNCIA (decisão 2): fica FORA da região viva por construção,
  // e ainda leva `aria-hidden`, porque é vizinha dela.
  if (countdown && isRetryScheduled(state)) {
    const clock = document.createElement('span');
    clock.className = 'nds-connection-state-countdown';
    clock.dataset.slot = 'connection-state-countdown';
    clock.setAttribute('aria-hidden', 'true');
    clock.textContent = countdown;
    root.appendChild(clock);
  }

  // A AÇÃO DIZ O QUE FAZ (decisão 5), e o rótulo é o nome acessível: não há
  // `aria-label` separado, porque o texto que se vê já diz o que o botão faz —
  // e nome acessível que diverge do texto visível quebra WCAG 2.5.3 pelo
  // caminho.
  const actionLabel = labels.action?.[state];
  if (actionLabel) {
    const action = createButton({
      label: actionLabel,
      variant: 'outline',
      size: 'sm',
      onClick: () => onRetry?.(),
    });
    action.classList.add('nds-connection-state-action');
    action.dataset.slot = 'connection-state-action';
    root.appendChild(action);
  }

  return root;
}
