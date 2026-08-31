import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { isRunFinished, type RunStatus } from '@shared/primitives/chat-protocol';
import { NdsButton } from './button';

// ─── AgentStatus ──────────────────────────────────────────────────────────────
//
// A linha que diz em que pé está a resposta.
//
// Desenho em docs/shared/styles/nds/agent-run.css, no bloco "Estado da
// execução", que também guarda as quatro decisões de acessibilidade. O
// vocabulário — `RunStatus`, `isRunFinished` — vem de
// `@shared/primitives/chat-protocol`.
//
// A DECISÃO QUE GOVERNA A PEÇA: ela NÃO É REGIÃO VIVA, apesar de o estado mudar
// sozinho. A tentação é grande, e é errada: quem lê está ouvindo a RESPOSTA ser
// gerada logo abaixo, e um anúncio a cada troca de estado corta a leitura no
// meio. Quem quiser anunciar põe a região viva por fora, sabendo o que está
// fazendo — e é por isso que não há `aria-live` nem `role` nenhum aqui.
//
// `stopped-run` DO CATÁLOGO É UM ESTADO DAQUI, e não outra peça: `RunStatus` já
// separa `stopped` de `failed` porque um oferece continuar e o outro tentar de
// novo. O desenho muda, o componente não.
//
// O QUE O COMPONENTE NÃO FAZ: parar, retomar, repetir, contar o tempo ou
// formatá-lo. Ele desenha o estado que recebe e avisa que alguém pediu a ação —
// mesma divisão de `approval` no `chat-thread` e da faixa de rascunho.
//
// A RAIZ É O PRÓPRIO PARÁGRAFO, e é por isso que o seletor é de ATRIBUTO. A
// linha é uma frase sobre o que está acontecendo, com o botão como conteúdo
// dela, e um seletor de elemento (`<nds-agent-status>`) somaria uma caixa sem
// papel entre a pilha e a frase — as cinco stacks deixariam de renderizar a
// mesma árvore, e markup divergente não é a exceção de "API de framework". Ou
// se perderia o `<p>`, que é a semântica que a referência escolheu de propósito.
// Mesma escolha do `ul[ndsComposerContext]`, do `button[ndsButton]` e do
// `div[ndsProgressIndicator]`.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//   - o aviso sai por um `output()` chamado `action`, e não por um callback
//     `onAction` passado como propriedade. É o caminho desta stack, o mesmo de
//     `removeAttachment`, `dismissQuote` e da faixa de rascunho. `action` não é
//     evento nativo de elemento nenhum, então não há segundo disparo a temer.
//   - não há entrada `class`: `class` é nativo do host, e quem consome a escreve
//     direto no elemento.

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
export type AgentStatusIntent = 'stop' | 'start';

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
  status: Record<RunStatus, string>;
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
  action?: Partial<Record<RunStatus, string>>;
}

@Component({
  selector: 'p[ndsAgentStatus]',
  standalone: true,
  imports: [NdsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-agent-status',
    '[attr.data-slot]': '"agent-status"',
    '[attr.data-status]': 'status()',
    // Nenhum papel ARIA e nenhuma região viva (decisão 1 da folha), e a
    // ausência é deliberada: quem quiser anunciar põe a região por fora.
  },
  template: `
    <!-- O PONTO É DECORATIVO (decisão 2). Ele é a leitura rápida para quem vê,
         e sai inteiro do que é lido em voz: a palavra ao lado já diz tudo, e
         repeti-la em desenho não acrescenta nada a quem ouve. -->
    <span
      class="nds-agent-status-dot"
      data-slot="agent-status-dot"
      aria-hidden="true"
    ></span>

    <span
      class="nds-agent-status-label"
      data-slot="agent-status-label"
    >{{ labels().status[status()] }}</span>

    <!-- O RELÓGIO NÃO SE ANUNCIA (decisão 3, e regra 9 da guideline 17).

         Ele se reescreve enquanto a execução corre, e um número que se
         reanuncia a cada segundo torna a tela impossível de ouvir. Fica
         visível e sai do que é lido — quem ouve recebe a palavra do estado,
         que é o que decide o que fazer. -->
    @if (elapsed(); as clock) {
      <span
        class="nds-agent-status-elapsed"
        data-slot="agent-status-elapsed"
        aria-hidden="true"
      >{{ clock }}</span>
    }

    <!-- A AÇÃO MUDA COM O ESTADO (decisão 4), e o rótulo é o nome acessível:
         não há \`aria-label\` separado, porque o texto que se vê já diz o que o
         botão faz — e nome acessível que diverge do texto visível quebra WCAG
         2.5.3 pelo caminho. -->
    @if (actionLabel(); as label) {
      <button
        ndsButton
        type="button"
        variant="outline"
        size="sm"
        class="nds-agent-status-action"
        data-slot="agent-status-action"
        (click)="action.emit(intent())"
      >{{ label }}</button>
    }
  `,
})
export class NdsAgentStatus {
  /** Em que pé está a execução. Quem executa é quem sabe, e é quem passa. */
  readonly status = input<RunStatus>('idle');

  /**
   * Há quanto tempo a execução corre, JÁ ESCRITO.
   *
   * String, e não segundos: formato de duração é decisão de idioma, e um
   * componente que o formatasse decidiria idioma em cinco lugares diferentes.
   * É a mesma escolha do tempo decorrido do ditado por voz e do carimbo da
   * faixa de rascunho.
   */
  readonly elapsed = input<string | undefined>(undefined);

  /** O texto da linha. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<AgentStatusLabels>();

  /** Alguém pediu a ação. Parar e começar de verdade são de quem consome. */
  readonly action = output<AgentStatusIntent>();

  /** O rótulo daquele estado, quando ele oferece ação. */
  protected readonly actionLabel = computed(() => this.labels().action?.[this.status()]);

  /**
   * A INTENÇÃO SAI DO VOCABULÁRIO, e não de um `if` daqui: enquanto a execução
   * não terminou a ação INTERROMPE, e depois de terminada ela COMEÇA DE NOVO.
   *
   * Quem responde "já terminou?" é `isRunFinished`, e é o que impede as cinco
   * stacks de escreverem cinco versões da mesma regra — uma delas discordaria
   * sobre a execução interrompida, que é o estado em que a resposta é menos
   * óbvia.
   */
  protected readonly intent = computed<AgentStatusIntent>(() =>
    isRunFinished(this.status()) ? 'start' : 'stop',
  );
}
