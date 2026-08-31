import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

// ─── ApprovalCard ─────────────────────────────────────────────────────────────
//
// A pergunta que precisa de resposta antes que algo com consequência aconteça.
//
// Desenho em docs/shared/styles/nds/agent-run.css, no bloco "Cartão de
// autorização", que também guarda a árvore da marcação e as seis decisões de
// acessibilidade.
//
// ONDE ESTE CARTÃO MORA. Ele é o OUTRO LADO da decisão 3 do grupo de execução:
// uma execução de ferramenta que espera por uma PESSOA não fica dentro da caixa
// recolhida, porque pedir autorização sem mostrar é não pedir. Este é o lugar
// para onde ela sai. Quem separa é quem consome, com `splitWaitingCalls` do
// vocabulário compartilhado — um componente que filtrasse sozinho apagaria da
// tela um dado que recebeu.
//
// O LIMITE DA PEÇA, e é a §7 da guideline 17 que o traça: o design system
// desenha A PERGUNTA e o ESPAÇO DA RESPOSTA. Ele não decide o que a resposta
// significa.
//
//   Fornece: o texto da pergunta, o alcance do que se aprova, o espaço dos
//   controles (`actions`, o mesmo contrato da conversa) e o evento que diz qual
//   foi a escolha.
//
//   NÃO fornece: o que acontece ao recusar, se há campo de motivo, se a escolha
//   vale para as próximas, o que uma autorização permanente abrange. Nada disso
//   está aqui, e nada disso vai estar.
//
// A DECISÃO QUE GOVERNA A PEÇA: aqui EXISTE região viva, e é a terceira exceção
// da folha — as duas primeiras são o indicador de geração e o estado da ligação.
// A proibição padrão continua valendo e é boa: estado que se reanuncia corta a
// leitura da resposta que está chegando. Uma PERGUNTA é de outra natureza: o
// estado se anuncia para informar, e este cartão se anuncia porque, sem ele,
// nada mais acontece. A máquina parou e espera por uma pessoa, e o impasse é dos
// dois lados — quem não vê a tela fica esperando uma resposta que nunca vem,
// porque quem a produziria está esperando por ela.
//
// E A REGIÃO PARA ANTES DOS CONTROLES. Ela envolve a pergunta e o alcance — o
// que é preciso saber para decidir — e deixa de fora a caixa dos controles.
// Botão dentro de anúncio é rótulo recitado que ninguém pode apertar dali.
//
// O QUE O COMPONENTE NÃO FAZ: desenhar controle, decidir qual escolha é a
// recomendada, desabilitar-se depois de respondido, contar tempo ou impor prazo.
// Ele desenha o que recebe e relata qual controle foi acionado.
//
// A RAIZ É O PRÓPRIO CARTÃO, e é por isso que o seletor é de ATRIBUTO. Um
// seletor de elemento somaria uma caixa sem papel entre a pilha e o cartão, e as
// cinco stacks deixariam de renderizar a mesma árvore — markup divergente não é
// a exceção de "API de framework". Mesma escolha do `p[ndsConnectionState]`, do
// `details[ndsToolGroup]` e do `button[ndsButton]`.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//   - `actions` é uma lista de `TemplateRef`, e não de elementos prontos. Quem
//     consome declara os templates e o componente os instancia por
//     `ngTemplateOutlet` — a mesma escolha que `actions` e `approval` já fazem
//     no `chat-thread`, e que o trilho do composer repete. Montar DOM à mão
//     perderia detecção de mudança e os inputs dos componentes projetados. Cada
//     entrada é um pedaço do espaço da resposta: a peça não conta controles, ela
//     instancia o que chega, na ordem em que chega.
//   - o aviso sai por um `output()` chamado `choose`, e não por um callback
//     `onChoose` passado como propriedade. É o caminho desta stack, o mesmo do
//     `retry` do estado da ligação e do `openChange` do grupo. `choose` não é
//     evento nativo de elemento nenhum, então não há segundo disparo a temer.
//   - não há entrada `class`: `class` é nativo do host, e quem consome a escreve
//     direto no elemento.

/** Uma linha do alcance: o rótulo e o valor daquele rótulo. */
export interface ApprovalScopeItem {
  /** O rótulo daquela linha do alcance: o que o valor ao lado é. */
  term: string;
  /**
   * O valor, inteiro.
   *
   * Sem abreviar e sem reticências: alcance pela metade é autorização pela
   * metade, e a folha resolve o caminho comprido com quebra de linha.
   */
  detail: string;
}

/** O atributo com que um controle se declara resposta. Não é nosso: é do contrato. */
const CHOICE_ATTRIBUTE = 'data-approval-choice';

@Component({
  selector: 'div[ndsApprovalCard]',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-approval-card',
    '[attr.data-slot]': '"approval-card"',
    // Nenhum papel ARIA NA RAIZ, e a ausência é deliberada: a região viva é da
    // caixa da pergunta, e só dela (decisão 1) — a raiz contém os botões.
  },
  template: `
    <!-- A CAIXA QUE SE ANUNCIA (decisão 1), e ela existe como elemento
         justamente para que a caixa dos controles fique de fora. Sem ela, o
         único lugar onde o papel caberia seria a raiz.

         O papel de estado é POLIDO: entra na fila e nunca corta o que estiver
         sendo lido. Pedir autorização não é erro, e cortar a leitura é a
         armadilha com que a regra 1 da §8 abre. A fila anda; o impasse não tem
         prazo. -->
    <div class="nds-approval-card-ask" data-slot="approval-card-ask" role="status">
      <p class="nds-approval-card-question" data-slot="approval-card-question">{{ question() }}</p>

      <!-- O ALCANCE É UMA LISTA DE DEFINIÇÃO (decisão 2). Com a lista, o termo e
           o valor continuam pareados quando alguém pula de item em item sem ler
           a linha inteira — o que uma frase com dois-pontos não garante.

           O par é filho DIRETO da lista: o bloco de repetição não soma elemento
           nenhum, e um invólucro quebraria a grade de duas colunas, que é da
           lista e não de cada par. -->
      @if (scopeItems().length) {
        <dl class="nds-approval-card-scope" data-slot="approval-card-scope">
          @for (item of scopeItems(); track $index) {
            <dt
              class="nds-approval-card-scope-term"
              data-slot="approval-card-scope-term"
            >{{ item.term }}</dt>
            <dd
              class="nds-approval-card-scope-detail"
              data-slot="approval-card-scope-detail"
            >{{ item.detail }}</dd>
          }
        </dl>
      }
    </div>

    <!-- O ESPAÇO DA RESPOSTA, e ele vem POR ÚLTIMO na marcação (decisão 3): a
         ordem de leitura é a ordem do foco, e a folha não move nada. Controle
         que é o primeiro para o olho e o último para a tabulação faz duas
         perguntas diferentes na mesma tela.

         Lista vazia ou ausente não desenha a caixa: um vão com afastamento e
         sem nada dentro é espaço reservado para quem nunca chegou.

         DELEGAÇÃO, e não um ouvinte por controle: os controles chegam prontos de
         quem consome, e pendurar um ouvinte em cada um obrigaria a peça a
         conhecer a forma de cada um deles. O que ela conhece é o atributo. -->
    @if (controls().length) {
      <div
        class="nds-approval-card-actions"
        data-slot="approval-card-actions"
        (click)="report($event)"
      >
        @for (control of controls(); track $index) {
          <ng-container *ngTemplateOutlet="control" />
        }
      </div>
    }
  `,
})
export class NdsApprovalCard {
  /**
   * A pergunta. Abre o cartão e é a primeira coisa que o anúncio carrega.
   *
   * Ela diz o que vai acontecer se a resposta for sim — e não como o sistema
   * chama a si mesmo. Quem escreve é quem consome: a peça não a compõe a partir
   * do alcance, porque juntar um nome de ferramenta com um ponto de
   * interrogação produz uma pergunta que ninguém faria.
   */
  readonly question = input.required<string>();

  /**
   * O alcance do que se aprova, em pares de termo e valor.
   *
   * Lista de definição, e não uma frase com dois-pontos (decisão 2 da folha): o
   * pareamento fica na estrutura, e não na pontuação, que não sobrevive à
   * navegação por lista de um leitor de tela. Ausente, a lista não é desenhada.
   */
  readonly scope = input<readonly ApprovalScopeItem[] | undefined>(undefined);

  /**
   * Os controles da resposta, prontos.
   *
   * O MESMO contrato que a autorização dentro da conversa já usa. A peça dá o
   * lugar, a quebra de linha e o afastamento entre alvos vizinhos; o desenho de
   * cada controle, a ênfase de cada escolha e o que cada uma significa são de
   * quem consome (§7 da guideline 17).
   *
   * Vazio ou ausente não desenha a caixa.
   */
  readonly actions = input<readonly TemplateRef<unknown>[] | undefined>(undefined);

  /**
   * Alguém escolheu, e o valor daquela escolha vem junto.
   *
   * O valor sai do atributo `data-approval-choice` do controle acionado, que é o
   * único pedaço do contrato que atravessa a fronteira do que a peça desenha:
   * quem escreve o atributo é quem monta os controles. Controle sem ele não é
   * resposta — um link de "saiba mais" no meio dos controles continua sendo só
   * um link, e não dispara nada.
   */
  readonly choose = output<string>();

  /** O alcance, sempre como lista: ausência e lista vazia desenham igual. */
  protected readonly scopeItems = computed(() => this.scope() ?? []);

  /** Os pedaços do espaço da resposta, sempre como lista. */
  protected readonly controls = computed(() => this.actions() ?? []);

  /**
   * Relata qual controle foi acionado, e nada mais.
   *
   * `closest` porque o alvo do clique pode ser um ícone ou um elemento em linha
   * dentro do botão; a guarda de contenção existe porque `closest` sobe sem
   * limite, e sem ela um atributo posto num ancestral por engano viraria
   * resposta.
   */
  protected report(event: Event): void {
    const box = event.currentTarget as Element | null;
    const target = event.target as Element | null;
    const control = target?.closest(`[${CHOICE_ATTRIBUTE}]`);
    if (!control || !box || !box.contains(control)) return;

    const value = control.getAttribute(CHOICE_ATTRIBUTE);
    // Atributo vazio não é escolha: relatar uma string vazia faria quem consome
    // procurar uma política com nome nenhum.
    if (value) this.choose.emit(value);
  }
}
