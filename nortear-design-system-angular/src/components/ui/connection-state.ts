import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { isRetryScheduled, type ConnectionState } from '@shared/primitives/chat-protocol';
import { NdsButton } from './button';

// ─── ConnectionState ──────────────────────────────────────────────────────────
//
// A linha que diz se ainda há por onde pedir.
//
// Desenho em docs/shared/styles/nds/agent-run.css, no bloco "Estado da
// ligação", que também guarda as seis decisões de acessibilidade. O
// vocabulário — `ConnectionState`, `isRetryScheduled` — vem de
// `@shared/primitives/chat-protocol`.
//
// NÃO É O ESTADO DA EXECUÇÃO, e a diferença não é de aparência: as duas linhas
// se parecem de propósito. Aquela descreve o que o agente está fazendo com o
// que se pediu; esta descreve se ainda há por onde pedir. Uma execução
// concluída sobre uma ligação caída é um par perfeitamente possível, e é por
// isso que os dois vocabulários são separados.
//
// A DECISÃO QUE GOVERNA A PEÇA: aqui EXISTE região viva, e é a segunda exceção
// da folha. A regra da família proíbe por padrão, e a proibição vale — um
// estado que se reanuncia corta a leitura da resposta. Perder a ligação é de
// outra natureza: não é o passo seguinte de algo que ia bem, é o chão saindo, e
// tudo o que for escrito daqui em diante não vai a lugar nenhum. Quem não vê a
// tela não tem outro jeito de descobrir — o silêncio é indistinguível de uma
// resposta demorada.
//
// E A REGIÃO ENVOLVE SÓ A PALAVRA, nunca a raiz. O rótulo carrega uma coisa só
// e muda no máximo quando o estado muda; a contagem, que se reescreve a cada
// segundo, fica FORA da região por construção. Região viva na raiz reanunciaria
// o relógio, que é exatamente a armadilha com que a folha desta família abre.
//
// O QUE O COMPONENTE NÃO FAZ: abrir ligação, reconectar, contar o tempo,
// formatá-lo ou reagendar tentativa. Ele desenha o estado que recebe e avisa
// que alguém pediu para tentar de novo — mesma divisão de `approval` no
// `chat-thread` e do estado da execução.
//
// A RAIZ É O PRÓPRIO PARÁGRAFO, e é por isso que o seletor é de ATRIBUTO. A
// linha é uma frase sobre o que está acontecendo, com o botão como conteúdo
// dela, e um seletor de elemento (`<nds-connection-state>`) somaria uma caixa
// sem papel entre a pilha e a frase — as cinco stacks deixariam de renderizar a
// mesma árvore, e markup divergente não é a exceção de "API de framework". Ou
// se perderia o `<p>`, que é a semântica que a referência escolheu de propósito.
// Mesma escolha do `p[ndsAgentStatus]`, do `ul[ndsComposerContext]` e do
// `button[ndsButton]`.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//   - o aviso sai por um `output()` chamado `retry`, e não por um callback
//     `onRetry` passado como propriedade. É o caminho desta stack, o mesmo do
//     `action` do estado da execução, do `removeAttachment` e do
//     `dismissQuote`. `retry` não é evento nativo de elemento nenhum, então não
//     há segundo disparo a temer.
//   - não há entrada `class`: `class` é nativo do host, e quem consome a escreve
//     direto no elemento.

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

@Component({
  selector: 'p[ndsConnectionState]',
  standalone: true,
  imports: [NdsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-connection-state',
    '[attr.data-slot]': '"connection-state"',
    '[attr.data-state]': 'state()',
    // Nenhum papel ARIA e nenhuma região viva NA RAIZ (decisão 1 da folha), e a
    // ausência é deliberada: a região é do rótulo, e só dele, para que a
    // contagem fique fora dela por construção.
  },
  template: `
    <!-- O PONTO É DECORATIVO (decisão 4). Ele é a leitura rápida para quem vê,
         e sai inteiro do que é lido em voz: a palavra ao lado já diz tudo, e
         repeti-la em desenho não acrescenta nada a quem ouve. -->
    <span
      class="nds-connection-state-dot"
      data-slot="connection-state-dot"
      aria-hidden="true"
    ></span>

    <!-- A PALAVRA É A REGIÃO VIVA, e é a única parte que se anuncia (decisão 1).

         \`role="status"\` é polido: entra na fila e nunca corta o que estiver
         sendo lido. E ele está AQUI, e não na raiz, porque este elemento
         carrega uma coisa só — a palavra — e ela muda no máximo quando o estado
         muda. -->
    <span
      class="nds-connection-state-label"
      data-slot="connection-state-label"
      role="status"
    >{{ labels().state[state()] }}</span>

    <!-- A CONTAGEM SÓ EXISTE ENQUANTO ALGO TENTA (decisão 3), e quem responde é
         \`isRetryScheduled\`, do vocabulário compartilhado — não um teste desta
         stack. "em 5 s" ao lado de "Sem ligação" é um relógio que não corre, e
         quem lê fica esperando por algo que ninguém agendou.

         E ELA NÃO SE ANUNCIA (decisão 2, e regra 9 da guideline 17): fica FORA
         da região viva por construção, e ainda leva \`aria-hidden\`, porque é
         vizinha dela. -->
    @if (clock(); as value) {
      <span
        class="nds-connection-state-countdown"
        data-slot="connection-state-countdown"
        aria-hidden="true"
      >{{ value }}</span>
    }

    <!-- A AÇÃO DIZ O QUE FAZ (decisão 5), e o rótulo é o nome acessível: não há
         \`aria-label\` separado, porque o texto que se vê já diz o que o botão
         faz — e nome acessível que diverge do texto visível quebra WCAG 2.5.3
         pelo caminho. -->
    @if (actionLabel(); as label) {
      <button
        ndsButton
        type="button"
        variant="outline"
        size="sm"
        class="nds-connection-state-action"
        data-slot="connection-state-action"
        (click)="retry.emit()"
      >{{ label }}</button>
    }
  `,
})
export class NdsConnectionState {
  /** Em que pé está a ligação. Quem abre o transporte é quem sabe, e é quem passa. */
  readonly state = input<ConnectionState>('connected');

  /**
   * Quanto falta para a próxima tentativa, JÁ ESCRITO.
   *
   * String, e não segundos: formato de duração é decisão de idioma, e um
   * componente que a formatasse decidiria idioma em cinco lugares diferentes.
   * É a mesma escolha do relógio do estado da execução, com um motivo a mais
   * aqui — ela é vizinha de uma região viva.
   */
  readonly countdown = input<string | undefined>(undefined);

  /** O texto da linha. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<ConnectionStateLabels>();

  /** Alguém pediu para tentar de novo. Abrir a ligação é de quem consome. */
  readonly retry = output<void>();

  /**
   * A contagem, quando ela tem o que contar.
   *
   * Quem responde é `isRetryScheduled`, do vocabulário compartilhado, e não um
   * teste escrito aqui: é uma regra de duas frases que renderia cinco
   * implementações, e a que discordasse seria justamente a de `disconnected`,
   * onde a resposta é menos óbvia.
   */
  protected readonly clock = computed(() => {
    const value = this.countdown();
    return value && isRetryScheduled(this.state()) ? value : undefined;
  });

  /** O rótulo daquele estado, quando ele oferece ação. */
  protected readonly actionLabel = computed(() => this.labels().action?.[this.state()]);
}
