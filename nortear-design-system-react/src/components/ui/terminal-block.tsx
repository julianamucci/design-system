import { useId } from "react"

import { cn } from "@/lib/utils"
import { isRunFinished, type RunStatus } from "@shared/primitives/chat-protocol"

/**
 * O comando que o agente rodou, e o que voltou dele.
 *
 * Desenho em `nds/agent-run.css`, no bloco "Bloco de terminal", que também
 * guarda as dez decisões de acessibilidade. O vocabulário — `RunStatus`,
 * `isRunFinished` — vem de `@shared/primitives/chat-protocol`.
 *
 * NÃO É O BLOCO DE CÓDIGO, e essa foi a primeira pergunta a responder. Aquele
 * mostra código que alguém vai LER e copiar: ele tokeniza por gramática,
 * numera linha, destaca intervalo e trunca o título com reticências. Este
 * mostra o que uma máquina JÁ ESCREVEU: não há gramática para tokenizar
 * (colorir saída por uma linguagem inventa sentido que ela não tem), não há
 * linha para citar, e o comando não pode truncar — comando pela metade é
 * instrução pela metade. E, sobretudo, este tem ESTADO e CÓDIGO DE SAÍDA, que
 * são vocabulário de execução; enfiá-los no bloco de código levaria a família 2
 * inteira para dentro da peça que documenta cinquenta componentes.
 *
 * O ESTADO É `RunStatus`, e serve inteiro. Um comando fica na fila, corre, é
 * interrompido por quem lê, termina ou quebra — e o `stopped` daqui é o mais
 * literal dos cinco: é o Ctrl-C, que é interrupção de pessoa e não falha da
 * máquina, exatamente a distinção que o vocabulário registra. `ToolCallState`
 * não serviria por dois motivos: ele tem `pending`, que é espera por uma
 * PESSOA, e um comando que roda não espera por ninguém; e não tem `stopped`,
 * que é justamente o estado mais característico de um terminal.
 *
 * O CÓDIGO DE SAÍDA É DADO, e não estado. Ele não decide o desenho — quem
 * decide é `status` —, e a peça NÃO o interpreta: zero é sucesso por convenção,
 * mas `grep` sai com 1 quando não acha nada e `diff` sai com 1 quando os
 * arquivos diferem, e nenhum dos dois falhou. Derivar o estado do número daria
 * duas fontes de verdade que podem discordar, que é o defeito que `TokenUsage`
 * já evita ao deixar o total ser função em vez de campo.
 *
 * A DECISÃO QUE GOVERNA A PEÇA: saída em curso NÃO é região viva (regra 1 da §8
 * da guideline 17). Texto que chega aos poucos, anunciado a cada pedaço, torna
 * a tela impossível de ouvir — e a saída de um comando é o caso extremo, porque
 * chega em rajada. O que existe no lugar é `aria-busy` enquanto corre. Quem
 * quiser anunciar o fim escreve o resultado UMA vez num anunciador próprio, do
 * lado de fora.
 *
 * O QUE O COMPONENTE NÃO FAZ: executar, abrir processo, revelar linha por
 * linha, contar tempo, acompanhar o fim da rolagem ou oferecer parar. Ele
 * desenha o comando e as linhas que recebe. Parar e repetir são do estado da
 * execução, que já os carrega — dois botões de parar para uma execução só
 * fariam quem apertasse um deles não saber qual parou.
 *
 * A API NÃO DIVERGE nos NOMES: `command`, `lines`, `status`, `exitCode` e
 * `labels` são os mesmos das outras stacks, porque aqui não há estado
 * imperativo para traduzir. O único nome próprio desta stack é `className`, que
 * é a convenção do renderer e não uma propriedade desta peça.
 */

export interface TerminalBlockLabels {
  /**
   * A palavra de cada estado.
   *
   * É ela que descreve (decisão 5 da folha): o ponto ao lado é decorativo, e
   * cor sozinha não descreve estado (WCAG 1.4.1). `Record` completo de
   * propósito — estado novo no vocabulário compartilhado reprova a compilação
   * aqui, em vez de desenhar uma linha em branco que ninguém repara.
   */
  status: Record<RunStatus, string>
  /**
   * O molde do código de saída. `{code}` vira o número.
   *
   * Molde, e não texto pronto: a palavra que apresenta o número é do idioma, e
   * o número em si é dado. É a mesma divisão da conta do andamento de trabalho
   * longo, onde os números saem de `toLocaleString` e a palavra que os liga sai
   * dos rótulos.
   */
  exitCode: string
}

export interface TerminalBlockProps {
  /** O que foi executado, como se escreveu. É também o nome da saída. */
  command: string
  /**
   * As linhas que voltaram, na ordem em que voltaram.
   *
   * Quem fatia é quem consome: revelar aos poucos é agendar quadro, e a peça
   * não agenda nada (§2 da guideline 17). Ela desenha as linhas que recebe.
   */
  lines?: readonly string[]
  /** Em que pé está o comando. Quem executa é quem sabe, e é quem passa. */
  status?: RunStatus
  /**
   * O que o processo devolveu ao terminar.
   *
   * Só aparece depois que a execução acabou, e quem responde "já acabou?" é
   * `isRunFinished`, do vocabulário compartilhado — não um `if` desta stack.
   * Código de saída ao lado de "Em andamento" é um resultado que ainda não
   * existe.
   */
  exitCode?: number
  labels: TerminalBlockLabels
  className?: string
}

function TerminalBlock({
  command,
  lines = [],
  status = "idle",
  exitCode,
  labels,
  className,
}: TerminalBlockProps) {
  /**
   * Escopo de id por INSTÂNCIA.
   *
   * A saída é uma região rolável NOMEADA (decisão 3), e o nome é o comando, por
   * `aria-labelledby`. Um id derivado do comando colidiria na hora em que a
   * mesma tela mostrasse `npm run build` duas vezes — e `aria-labelledby` passa
   * a resolver para o PRIMEIRO id do documento, dando à segunda saída o nome da
   * primeira. Mesma precaução do accordion, pelo mesmo motivo.
   *
   * O `useId` do React 19 devolve algo entre aspas angulares: válido em `id`,
   * ilegível num seletor. Normalizar mantém o id utilizável em `querySelector`
   * também, como no balão de dica.
   */
  const commandId = `nds-terminal-block-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}-command`

  // A CAIXA SÓ EXISTE QUANDO HÁ O QUE MOSTRAR: uma linha, ou o cursor de quem
  // ainda escreve. Um comando concluído sem saída nenhuma é caso REAL — é o que
  // um terminal de verdade mostra —, e desenhar uma caixa vazia com parada de
  // tabulação dentro seria dar foco a lugar nenhum.
  const hasOutput = lines.length > 0 || status === "running"

  return (
    // OCUPADO ENQUANTO CORRE, e só (decisão 1, regra 1 da §8 da guideline 17).
    // `aria-busy` diz que aquele pedaço da tela ainda se escreve, sem anunciar
    // nada — é o contrário da região viva, e é o que o andamento de trabalho
    // longo já usa. Nada aqui é `aria-live`, e nada aqui é `role="status"`.
    <div
      data-slot="terminal-block"
      className={cn("nds-terminal-block", className)}
      data-status={status}
      aria-busy={status === "running" ? true : undefined}
    >
      {/* O QUE FOI EXECUTADO.

          `<p>` com `<code>` dentro: é uma linha de texto cujo conteúdo é
          código. A monoespaçada vem de `.nds-font-mono`, a utilitária que já
          existe em `typography.css` — nem token novo (não há token de fonte
          mono neste sistema) nem uma terceira cópia da pilha literal do
          `code-block`. Ela ANDA NA MARCAÇÃO, e por isso some em silêncio
          quando alguém copia a árvore pela metade: a `play` a afirma nos dois
          lugares. */}
      <p
        className="nds-terminal-block-command nds-font-mono"
        data-slot="terminal-block-command"
      >
        {/* O CIFRÃO É DECORATIVO (decisão 2), e é FIXO. Ele diz "isto é um
            comando" e não faz parte do que se executa nem do que se copiaria.
            Torná-lo configurável convidaria a pôr informação ali — máquina,
            usuário, caminho —, e informação atrás de `aria-hidden` não chega a
            quem ouve. O que for informação entra no comando, ou ao lado dele. */}
        <span
          className="nds-terminal-block-sigil"
          data-slot="terminal-block-sigil"
          aria-hidden="true"
        >
          $
        </span>

        {/* `lang="en"`: o conteúdo é comando — binário, sinalizador, caminho.
            Sem isto, a voz do leitor de tela em pt-BR tenta pronunciá-lo como
            português (WCAG 3.1.2). Mesma decisão do bloco de código. */}
        <code
          className="nds-terminal-block-command-text"
          data-slot="terminal-block-command-text"
          id={commandId}
          lang="en"
        >
          {command}
        </code>
      </p>

      {/* O QUE VOLTOU.

          REGIÃO ROLÁVEL ALCANÇÁVEL PELO TECLADO e NOMEADA (decisão 3, regra 6
          da §8). `tabIndex` fixo, e não opção: torná-lo configurável só criaria
          o jeito de desligar a única coisa que faz a rolagem existir para quem
          não usa mouse (axe `scrollable-region-focusable`).

          `role="group"` e não `region`: `region` é marco de página, e um marco
          por bloco de terminal numa conversa é uma lista de marcos que ninguém
          navega.

          O NOME É O COMANDO, por referência e não por cópia: nome acessível que
          diverge do texto visível é o defeito que WCAG 2.5.3 descreve, e apontar
          para o elemento torna a divergência impossível.

          As linhas entram como TEXTO, e nunca como marcação: a saída de um
          comando é texto de terceiro por definição. Sem marcação não há o que
          sanitizar. */}
      {hasOutput ? (
        <pre
          className="nds-terminal-block-output nds-font-mono"
          data-slot="terminal-block-output"
          lang="en"
          tabIndex={0}
          role="group"
          aria-labelledby={commandId}
        >
          {lines.join("\n")}
          {/* O CURSOR É DECORATIVO (decisão 4) e marca a costura entre o que
              chegou e o que ainda vem. Ele só existe enquanto corre: cursor que
              fica é cursor que mente, e quem ouve não tem como saber que ele
              parou de valer. */}
          {status === "running" ? (
            <span
              className="nds-terminal-block-cursor"
              data-slot="terminal-block-cursor"
              aria-hidden="true"
            />
          ) : null}
        </pre>
      ) : null}

      {/* COMO TERMINOU. */}
      <p className="nds-terminal-block-result" data-slot="terminal-block-result">
        {/* O PONTO É DECORATIVO (decisão 5). Ele é a leitura rápida para quem
            vê — e numa tela com dez blocos empilhados é o que permite achar o
            que quebrou sem ler dez palavras. Sai inteiro do que é lido em voz. */}
        <span
          className="nds-terminal-block-dot"
          data-slot="terminal-block-dot"
          aria-hidden="true"
        />

        {/* A PALAVRA É O ESTADO, e é ela que descreve (decisão 5). */}
        <span className="nds-terminal-block-status" data-slot="terminal-block-status">
          {labels.status[status]}
        </span>

        {/* O CÓDIGO DE SAÍDA CHEGA A QUEM OUVE (decisão 6), como texto e sem
            `aria-hidden`: ele não se reescreve, então não é o relógio de que a
            folha se defende. E ele só aparece depois de a execução acabar — quem
            responde é o vocabulário compartilhado, pela mesma razão de
            `isRetryScheduled` no estado da ligação. */}
        {exitCode !== undefined && isRunFinished(status) ? (
          <span className="nds-terminal-block-exit" data-slot="terminal-block-exit">
            {labels.exitCode.replace("{code}", String(exitCode))}
          </span>
        ) : null}
      </p>
    </div>
  )
}

export { TerminalBlock }
