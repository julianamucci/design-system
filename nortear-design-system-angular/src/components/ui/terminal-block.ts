import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { isRunFinished, type RunStatus } from '@shared/primitives/chat-protocol';

// ─── TerminalBlock ────────────────────────────────────────────────────────────
//
// O comando que o agente rodou, e o que voltou dele.
//
// Desenho em docs/shared/styles/nds/agent-run.css, no bloco "Bloco de terminal",
// que também guarda as dez decisões de acessibilidade. O vocabulário —
// `RunStatus`, `isRunFinished` — vem de `@shared/primitives/chat-protocol`.
//
// NÃO É O BLOCO DE CÓDIGO, e essa foi a primeira pergunta a responder. Aquele
// mostra código que alguém vai LER e copiar: ele tokeniza por gramática, numera
// linha, destaca intervalo e trunca o título com reticências. Este mostra o que
// uma máquina JÁ ESCREVEU: não há gramática para tokenizar (colorir saída por
// uma linguagem inventa sentido que ela não tem), não há linha para citar, e o
// comando não pode truncar — comando pela metade é instrução pela metade. E,
// sobretudo, este tem ESTADO e CÓDIGO DE SAÍDA, que são vocabulário de execução;
// enfiá-los no bloco de código levaria a família 2 inteira para dentro da peça
// que documenta cinquenta componentes.
//
// O ESTADO É `RunStatus`, e serve inteiro. Um comando fica na fila, corre, é
// interrompido por quem lê, termina ou quebra — e o `stopped` daqui é o mais
// literal dos cinco: é o Ctrl-C, que é interrupção de pessoa e não falha da
// máquina, exatamente a distinção que o vocabulário registra. `ToolCallState`
// não serviria por dois motivos: ele tem `pending`, que é espera por uma PESSOA,
// e um comando que roda não espera por ninguém; e não tem `stopped`, que é
// justamente o estado mais característico de um terminal.
//
// O CÓDIGO DE SAÍDA É DADO, e não estado. Ele não decide o desenho — quem decide
// é `status` —, e a peça NÃO o interpreta: zero é sucesso por convenção, mas
// `grep` sai com 1 quando não acha nada e `diff` sai com 1 quando os arquivos
// diferem, e nenhum dos dois falhou. Derivar o estado do número daria duas
// fontes de verdade que podem discordar, que é o defeito que `TokenUsage` já
// evita ao deixar o total ser função em vez de campo.
//
// A DECISÃO QUE GOVERNA A PEÇA: saída em curso NÃO é região viva (regra 1 da §8
// da guideline 17). Texto que chega aos poucos, anunciado a cada pedaço, torna a
// tela impossível de ouvir — e a saída de um comando é o caso extremo, porque
// chega em rajada. O que existe no lugar é `aria-busy` enquanto corre. Quem
// quiser anunciar o fim escreve o resultado UMA vez num anunciador próprio, do
// lado de fora.
//
// SEM BOTÃO DE COPIAR, SEM VARIANTE DE SUPERFÍCIE E SEM AÇÃO. As três foram
// recusadas com motivo escrito na folha: copiar O QUÊ é pergunta de quem
// consome; uma superfície que ignora o tema teria de ser medida à parte em três
// temas e dois modos; e parar e repetir são do estado da execução, que já os
// carrega — dois botões de parar para uma execução só fariam quem apertasse um
// deles não saber qual parou. Esta peça é o REGISTRO do que rodou.
//
// O QUE O COMPONENTE NÃO FAZ: executar, abrir processo, revelar linha por linha,
// contar tempo ou acompanhar o fim da rolagem. Ele desenha o comando e as linhas
// que recebe.
//
// A RAIZ É UMA CAIXA, e por isso o seletor é de ATRIBUTO em `div`. Aqui não há
// uma frase, há um bloco com um parágrafo, uma caixa rolável e outro parágrafo
// dentro — a referência escolheu `<div>` de propósito, e um seletor de elemento
// (`<nds-terminal-block>`) somaria uma caixa sem papel entre a pilha e o bloco.
// As cinco stacks deixariam de renderizar a mesma árvore, e markup divergente
// não é a exceção de "API de framework". Mesma escolha do `div[ndsJobProgress]`,
// do `p[ndsAgentStatus]` e do `div[ndsProgressIndicator]`.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//   - não há entrada `class`: `class` é nativo do host, e quem consome a escreve
//     direto no elemento. Mesma escolha do estado da execução e do andamento de
//     trabalho longo.
//   - as entradas são `input()` de signal, então `lines` chega por
//     `[lines]="saida"` e o padrão vazio mora na própria declaração.
//   - não há saída nenhuma: a peça não oferece ação, e não há o que avisar.

/**
 * Escopo de id por instância.
 *
 * A saída é uma região rolável NOMEADA (decisão 3), e o nome é o comando, por
 * `aria-labelledby`. Ids derivados só do comando colidiriam na hora em que a
 * mesma tela mostrasse `npm run build` duas vezes — e `aria-labelledby` passa a
 * resolver para o PRIMEIRO id do documento, dando à segunda saída o nome da
 * primeira. Contador de módulo, e não `crypto.randomUUID()`: id curto e estável
 * aparece legível no atributo e não polui o diff de snapshot. Mesma precaução do
 * `nextId` do formulário, pelo mesmo motivo.
 */
let sequencia = 0;

export interface TerminalBlockLabels {
  /**
   * A palavra de cada estado.
   *
   * É ela que descreve (decisão 5 da folha): o ponto ao lado é decorativo, e cor
   * sozinha não descreve estado (WCAG 1.4.1). `Record` completo de propósito —
   * estado novo no vocabulário compartilhado reprova a compilação aqui, em vez
   * de desenhar uma linha em branco que ninguém repara.
   */
  status: Record<RunStatus, string>;
  /**
   * O molde do código de saída. `{code}` vira o número.
   *
   * Molde, e não texto pronto: a palavra que apresenta o número é do idioma, e o
   * número em si é dado. É a mesma divisão da conta do andamento de trabalho
   * longo, onde os números saem de `toLocaleString` e a palavra que os liga sai
   * dos rótulos.
   */
  exitCode: string;
}

@Component({
  selector: 'div[ndsTerminalBlock]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-terminal-block',
    '[attr.data-slot]': '"terminal-block"',
    '[attr.data-status]': 'status()',
    // OCUPADO ENQUANTO CORRE, e só (decisão 1, regra 1 da §8 da guideline 17).
    // `aria-busy` diz que aquele pedaço da tela ainda se escreve, sem anunciar
    // nada — é o contrário da região viva, e é o que o andamento de trabalho
    // longo já usa. Nada aqui é `aria-live`, nada aqui é `role="status"` e nada
    // aqui é `role="log"`.
    '[attr.aria-busy]': 'busy()',
  },
  // A MONOESPAÇADA ANDA NA MARCAÇÃO, em dois lugares: a linha do comando e a
  // caixa de saída. A folha não declara `font-family` nenhuma, e aqui a mono é
  // CARGA e não efeito — saída de terminal se alinha em COLUNAS, e coluna só
  // fecha com avanço fixo. `.nds-font-mono` é a utilitária que já existe em
  // `typography.css`: nem token novo (não há token de fonte mono neste sistema)
  // nem uma terceira cópia da pilha literal do bloco de código. O risco da
  // escolha é o esquecimento silencioso — classe que mora só na marcação some
  // quando alguém copia a árvore pela metade —, e por isso a `play` a AFIRMA nos
  // dois elementos.
  //
  // O CONTEÚDO DO `<pre>` É LITERAL. O compilador do Angular não apara espaço
  // dentro de `pre`, então recuo de template vira saída visível: o texto sai
  // exatamente como `lines.join('\n')`, e por isso a interpolação encosta no
  // `>`, o bloco do cursor encosta na interpolação e o fechamento encosta no
  // bloco.
  template: `
    <p
      class="nds-terminal-block-command nds-font-mono"
      data-slot="terminal-block-command"
    >
      <!-- O CIFRÃO É DECORATIVO (decisão 2), e é FIXO. Lido em voz ele vira
           "cifrão npm run build", e não faz parte do que se executou nem do que
           se copiaria. Fixo porque configurável convidaria a pôr informação ali
           — máquina, usuário, caminho —, e informação atrás de aria-hidden não
           chega a quem ouve. O que for informação entra no comando, ou ao lado
           dele. -->
      <span
        class="nds-terminal-block-sigil"
        data-slot="terminal-block-sigil"
        aria-hidden="true"
      >$</span>

      <!-- lang="en": o conteúdo é comando — binário, sinalizador, caminho. Sem
           isto, a voz do leitor de tela em pt-BR tenta pronunciá-lo como
           português (WCAG 3.1.2). Mesma decisão do bloco de código. O id é por
           INSTÂNCIA porque é ele que dá nome à caixa de saída. -->
      <code
        class="nds-terminal-block-command-text"
        data-slot="terminal-block-command-text"
        lang="en"
        [id]="commandId"
      >{{ command() }}</code>
    </p>

    <!-- A CAIXA SÓ EXISTE QUANDO HÁ O QUE MOSTRAR: uma linha, ou o cursor de
         quem ainda escreve. Um comando concluído sem saída nenhuma é caso REAL —
         é o que um terminal de verdade mostra —, e desenhar uma caixa vazia com
         parada de tabulação dentro seria dar foco a lugar nenhum.

         REGIÃO ROLÁVEL ALCANÇÁVEL PELO TECLADO e NOMEADA (decisão 3, regra 6 da
         §8). tabindex fixo, e não entrada: torná-lo configurável só criaria o
         jeito de desligar a única coisa que faz a rolagem existir para quem não
         usa mouse (axe scrollable-region-focusable). role="group" e não
         region: region é marco de página, e um marco por bloco de terminal
         numa conversa é uma lista de marcos que ninguém navega.

         O NOME É O COMANDO, por referência e não por cópia: nome acessível que
         diverge do texto visível é o defeito que WCAG 2.5.3 descreve, e apontar
         para o elemento torna a divergência impossível.

         O CURSOR É DECORATIVO (decisão 4) e marca a costura entre o que chegou e
         o que ainda vem. Ele só existe enquanto corre: cursor que fica é cursor
         que mente, e quem ouve não tem como saber que ele parou de valer. -->
    @if (hasOutput()) {
      <pre
        class="nds-terminal-block-output nds-font-mono"
        data-slot="terminal-block-output"
        role="group"
        tabindex="0"
        lang="en"
        [attr.aria-labelledby]="commandId"
      >{{ text() }}@if (running()) {<span class="nds-terminal-block-cursor" data-slot="terminal-block-cursor" aria-hidden="true"></span>}</pre>
    }

    <p
      class="nds-terminal-block-result"
      data-slot="terminal-block-result"
    >
      <!-- O PONTO É DECORATIVO (decisão 5). Ele é a leitura rápida para quem vê
           — numa tela com dez blocos empilhados é o que permite achar o que
           quebrou sem ler dez palavras. Sai inteiro do que é lido em voz. -->
      <span
        class="nds-terminal-block-dot"
        data-slot="terminal-block-dot"
        aria-hidden="true"
      ></span>

      <!-- A PALAVRA É O ESTADO, e é ela que descreve (decisão 5). -->
      <span
        class="nds-terminal-block-status"
        data-slot="terminal-block-status"
      >{{ labels().status[status()] }}</span>

      <!-- O CÓDIGO DE SAÍDA CHEGA A QUEM OUVE (decisão 6), como texto e sem
           aria-hidden: ele não se reescreve, então não é o relógio de que a
           folha se defende. E ele NÃO é .nds-badge — naquela etiqueta, nesta
           folha, mora a palavra do estado, e vestir o número com ela convidaria
           a lê-lo como o estado. -->
      @if (exitText(); as written) {
        <span
          class="nds-terminal-block-exit"
          data-slot="terminal-block-exit"
        >{{ written }}</span>
      }
    </p>
  `,
})
export class NdsTerminalBlock {
  /** O que foi executado, como se escreveu. É também o nome da saída. */
  readonly command = input.required<string>();

  /**
   * As linhas que voltaram, na ordem em que voltaram.
   *
   * Quem fatia é quem consome: revelar aos poucos é agendar quadro, e a peça não
   * agenda nada (§2 da guideline 17). Ela desenha as linhas que recebe.
   */
  readonly lines = input<readonly string[]>([]);

  /** Em que pé está o comando. Quem executa é quem sabe, e é quem passa. */
  readonly status = input<RunStatus>('idle');

  /**
   * O que o processo devolveu ao terminar.
   *
   * Só aparece depois que a execução acabou, e quem responde "já acabou?" é
   * `isRunFinished`, do vocabulário compartilhado — não um `if` desta stack.
   * Código de saída ao lado de "Em andamento" é um resultado que ainda não
   * existe.
   */
  readonly exitCode = input<number | undefined>(undefined);

  /** O texto da peça. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<TerminalBlockLabels>();

  /** O id do comando, por instância. É ele que nomeia a caixa de saída. */
  protected readonly commandId = `nds-terminal-block-${(sequencia += 1)}-command`;

  /** A peça se declara ocupada enquanto corre, e em nenhum outro momento. */
  protected readonly busy = computed(() => (this.status() === 'running' ? 'true' : null));

  /** Enquanto corre há cursor, e só então. */
  protected readonly running = computed(() => this.status() === 'running');

  /**
   * Há caixa de saída?
   *
   * Uma linha, ou o cursor de quem ainda escreve. As duas ausências dizem a
   * mesma coisa sobre a caixa: não há o que mostrar.
   */
  protected readonly hasOutput = computed(
    () => this.lines().length > 0 || this.status() === 'running',
  );

  /**
   * A saída, como uma cadeia só.
   *
   * Interpolação, e nunca `[innerHTML]`: a saída de um comando é texto de
   * terceiro por definição. Sem marcação não há o que sanitizar.
   */
  protected readonly text = computed(() => this.lines().join('\n'));

  /**
   * O código de saída já escrito, ou nada enquanto ele não existe.
   *
   * Quem responde "já acabou?" é o vocabulário compartilhado, pela mesma razão
   * de `isRetryScheduled` no estado da ligação — a resposta tem de ser a mesma
   * nas cinco stacks, e a que discordaria é a do comando interrompido.
   */
  protected readonly exitText = computed<string | undefined>(() => {
    const code = this.exitCode();
    if (code === undefined || !isRunFinished(this.status())) return undefined;
    return this.labels().exitCode.replace('{code}', String(code));
  });
}
