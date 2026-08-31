import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import type { ChatToolCall, ToolCallState } from '@shared/primitives/chat-protocol';
import {
  summarizeToolCalls,
  toolCallBadgeClass,
} from '@shared/primitives/tool-group-summary';

// ─── ToolGroup ────────────────────────────────────────────────────────────────
//
// O que o agente fez para responder, reunido num bloco só.
//
// Desenho em docs/shared/styles/nds/agent-run.css, no bloco "Grupo de chamadas
// de ferramenta", que também guarda as cinco decisões de acessibilidade. O
// vocabulário — `ChatToolCall`, `ToolCallState` — vem de
// `@shared/primitives/chat-protocol`; o que o resumo diz sai de
// `@shared/primitives/tool-group-summary`.
//
// AS DECISÕES QUE GOVERNAM A PEÇA
//
// 1. É UM `<details>` DE VERDADE, e não uma caixa imitada com `aria-expanded`.
//    O navegador já dá o botão, o estado de expansão e o teclado — e dá tudo
//    isso de graça, sem uma linha de ARIA escrita à mão que possa envelhecer
//    errado.
// 2. NASCE RECOLHIDO, e o resumo diz em palavra o que há dentro, inclusive que
//    algo falhou. Um grupo fechado que esconde uma falha é uma falha que
//    ninguém vê. A saída NÃO é forçar a abertura: isso brigaria com quem
//    acabou de fechar, e ninguém fecha uma caixa duas vezes de bom humor.
// 3. NÃO É REGIÃO VIVA. As chamadas chegam enquanto a resposta é gerada logo
//    abaixo, e anunciar cada uma corta a leitura do que importa — e é por isso
//    que não há `aria-live` nem `role` nenhum aqui.
// 4. O ESTADO É PALAVRA, em `.nds-badge`, nunca só cor ou ícone (WCAG 1.4.1).
//    A cor da etiqueta é reforço, e some para quem não a percebe.
// 5. A CHAMADA QUE ESPERA UMA PESSOA NÃO FICA AQUI DENTRO. Pedir autorização
//    dentro de uma caixa fechada é pedir sem mostrar. Quem separa é quem
//    consome — `splitWaitingCalls` faz a conta —, e não este componente: um
//    componente que filtrasse sozinho apagaria da tela um dado que recebeu.
//
// `tool-error` DO CATÁLOGO É UM ESTADO DAQUI, e não outra peça: `ToolCallState`
// já separa `failed`, e a chamada que falhou desenha diferente sem virar outro
// componente.
//
// O QUE O COMPONENTE NÃO FAZ: executar ferramenta, repetir chamada, decidir o
// que uma falha significa ou tirar alguém da lista. Ele desenha as chamadas que
// recebe e avisa quando alguém abre ou fecha.
//
// A RAIZ É O PRÓPRIO `<details>`, e é por isso que o seletor é de ATRIBUTO. Um
// seletor de elemento (`<nds-tool-group>`) somaria uma caixa sem papel entre a
// pilha e o bloco — as cinco stacks deixariam de renderizar a mesma árvore, e
// markup divergente não é a exceção de "API de framework". Ou se perderia o
// `<details>`, que é a decisão 1 inteira: o botão, o estado de expansão e o
// teclado vêm do elemento, não de ARIA escrita à mão. Mesma escolha do
// `p[ndsAgentStatus]`, do `ul[ndsComposerContext]` e do `button[ndsButton]`.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//   - o aviso sai por um `output()` chamado `openChange`, e não por um callback
//     `onOpenChange` passado como propriedade. É o caminho desta stack, o mesmo
//     de `action` na linha de estado da execução. De quebra, `open` mais
//     `openChange` dão o atalho de duas vias desta stack, e quem quiser a caixa
//     controlada escreve `[(open)]` sem fiação extra.
//   - não há entrada `class`: `class` é nativo do host, e quem consome a escreve
//     direto no elemento.

export interface ToolGroupLabels {
  /**
   * O título do resumo, a partir da contagem.
   *
   * FUNÇÃO, e não texto pronto: plural é decisão de idioma, e o componente que
   * escolhesse entre singular e plural escolheria por cinco idiomas de uma vez.
   * É a mesma razão pela qual o relógio do estado da execução chega já escrito.
   */
  title: (count: number) => string;
  /**
   * A palavra que o RESUMO mostra sobre o conjunto.
   *
   * `Record` completo de propósito — estado novo no vocabulário compartilhado
   * reprova a compilação aqui, em vez de desenhar uma etiqueta em branco que
   * ninguém repara.
   */
  summary: Record<ToolCallState, string>;
  /** A palavra de cada chamada na lista. Mesmas quatro chaves, outra escala. */
  call: Record<ToolCallState, string>;
}

@Component({
  selector: 'details[ndsToolGroup]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-tool-group',
    '[attr.data-slot]': '"tool-group"',
    // A propriedade do próprio elemento: quem abre e fecha é o navegador, e
    // esta ligação só diz com que estado a caixa nasce. Depois do primeiro
    // quadro ela não briga com quem clicou — a ligação só escreve quando o
    // valor de entrada muda, e é isso que dá o atalho de duas vias com
    // `[(open)]` sem tirar do navegador o controle que é dele.
    '[open]': 'open()',
    // O evento do próprio elemento, e não um `click` no resumo: o navegador
    // abre e fecha a caixa por teclado, por busca na página e por script, e só
    // o `toggle` vê os três.
    '(toggle)': 'reportOpen($event)',
    // Nenhum papel ARIA e nenhuma região viva (decisão 3), e a ausência é
    // deliberada: quem quiser anunciar põe a região por fora.
  },
  template: `
    <summary class="nds-tool-group-summary" data-slot="tool-group-summary">
      <!-- A SETA GIRA COM O ESTADO DA CAIXA, e existe porque o \`display: flex\`
           do resumo tira o marcador que o navegador daria — e tira em engine,
           não em todas. Ela é \`aria-hidden\` porque repete em desenho o que o
           próprio controle já anuncia. -->
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="nds-icon nds-tool-group-icon"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>

      <span
        class="nds-tool-group-title"
        data-slot="tool-group-title"
      >{{ labels().title(calls().length) }}</span>

      <!-- O RESUMO DIZ O QUE HÁ DENTRO (decisão 2), em palavra e não só em cor
           (decisão 4). -->
      <span
        [class]="summaryBadgeClass()"
        data-slot="tool-group-state"
      >{{ labels().summary[summaryState()] }}</span>
    </summary>

    <ol class="nds-tool-group-list" data-slot="tool-group-list">
      @for (call of calls(); track call.id ?? call.name) {
        <!-- O endereço vai para o DOM quando existe: é por ele que quem atualiza
             uma chamada em andamento acha a linha certa quando duas têm o mesmo
             nome. -->
        <li
          class="nds-tool-call"
          data-slot="tool-call"
          [attr.data-state]="call.state"
          [attr.data-call-id]="call.id ?? null"
        >
          <span
            class="nds-tool-call-name"
            data-slot="tool-call-name"
          >{{ call.name }}</span>

          <span
            [class]="badgeClassOf(call.state)"
            data-slot="tool-call-state"
          >{{ labels().call[call.state] }}</span>

          <!-- Sem detalhe não há parágrafo: um \`<p>\` vazio ocuparia a linha
               inteira da grade e abriria um vão que parece defeito de
               espaçamento. -->
          @if (call.detail; as detail) {
            <p
              class="nds-tool-call-detail"
              data-slot="tool-call-detail"
            >{{ detail }}</p>
          }
        </li>
      }
    </ol>
  `,
})
export class NdsToolGroup implements OnInit {
  /** As chamadas que o grupo desenha, na ordem em que aconteceram. */
  readonly calls = input.required<ChatToolCall[]>();

  /** O texto da caixa. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<ToolGroupLabels>();

  /**
   * A caixa começa aberta.
   *
   * O padrão é fechada (decisão 2): são detalhes de execução, e não a resposta.
   */
  readonly open = input(false);

  /** Alguém abriu ou fechou a caixa, e o novo estado vem junto. */
  readonly openChange = output<boolean>();

  /**
   * O QUE O RESUMO DIZ vem do primitivo compartilhado, e nunca de um `if` da
   * tela: se a escolha morasse aqui, as cinco stacks escreveriam cinco versões
   * dela, e uma discordaria justamente no caso em que a resposta é menos óbvia
   * — uma falha ao lado de algo que ainda corre.
   */
  protected readonly summaryState = computed(() => summarizeToolCalls(this.calls()).state);

  /**
   * A cor da etiqueta do conjunto.
   *
   * O mapa de variantes também é do primitivo compartilhado. Escrevê-lo à mão
   * aqui seria a quinta cópia de uma tabela de quatro linhas, e é assim que se
   * produzem cinco telas que discordam sobre a cor de um estado.
   *
   * `nds-tool-group-state` entra JUNTO no `[class]`, e não como `class`
   * estática ao lado dele: é a classe que a folha estiliza (o empurrão para a
   * direita), e aqui ela não depende de como o Angular reconcilia estático com
   * ligação. O `data-slot` continua no template — ele é o contrato de markup
   * das cinco stacks, e o que se faz aqui é somar, não substituir.
   */
  protected readonly summaryBadgeClass = computed(
    () => `${toolCallBadgeClass(this.summaryState())} nds-tool-group-state`,
  );

  /** A cor da etiqueta de uma linha, do mesmo mapa compartilhado. */
  protected badgeClassOf(state: ToolCallState): string {
    return toolCallBadgeClass(state);
  }

  /**
   * O ÚLTIMO VALOR RELATADO, e a guarda que ele sustenta.
   *
   * A guarda não é zelo: o navegador enfileira um `toggle` quando o atributo
   * `open` é escrito, e num render declarativo isso acontece no primeiro
   * quadro. Sem ela, um grupo que nasce aberto avisaria que alguém o abriu — e
   * ninguém abriu.
   *
   * O valor inicial é lido em `ngOnInit` porque é lá que a entrada já chegou:
   * num inicializador de campo o sinal ainda devolveria o padrão, e a guarda
   * nasceria medindo a coisa errada justamente no caso que ela existe para
   * cobrir.
   */
  private lastReported = false;

  ngOnInit(): void {
    this.lastReported = this.open();
  }

  protected reportOpen(event: Event): void {
    const host = event.target as HTMLDetailsElement;
    if (host.open === this.lastReported) return;
    this.lastReported = host.open;
    this.openChange.emit(host.open);
  }
}
