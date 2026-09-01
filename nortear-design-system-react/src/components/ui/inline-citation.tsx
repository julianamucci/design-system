import type * as React from "react"
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import { cn } from "@/lib/utils"
import type { Citation } from "@shared/primitives/chat-protocol"
import { isSafeUrl } from "@shared/primitives/markdown-ast"

/**
 * A marca numerada que liga uma frase à fonte em que ela se apoia.
 *
 * Desenho em `nds/evidencia.css`, no bloco "Citação em linha", que também
 * guarda as dez decisões de acessibilidade e o eixo da família.
 *
 * A TRIAGEM VEIO ANTES DO DESENHO, e a pergunta que a abre é a mais barata de
 * todas: isto é mais do que um cartão de ponteiro com título e link? A resposta
 * é sim, e por duas razões que nenhum painel flutuante genérico resolve.
 *
 *   - ELA VIVE DENTRO DE TEXTO CORRIDO, e isso é GEOMETRIA PRÓPRIA. A marca
 *     interrompe um parágrafo: precisa assentar na linha de base sem esticar a
 *     entrelinha, não pode se separar da palavra que a antecede quando a linha
 *     quebra, e mesmo assim precisa de um alvo de toque de 24 px (WCAG 2.5.8).
 *     As três exigências brigam entre si, e nenhuma classe desta base as
 *     concilia — as irmãs desenham listas e caixas, onde a altura do elemento é
 *     livre porque não há linha de texto em volta dele.
 *   - TOQUE NÃO TEM PONTEIRO. Uma citação que só abrisse ao passar o mouse
 *     seria invisível em telefone, e a regra 3 da §8 da guideline 17 é literal
 *     a respeito. O cartão de ponteiro desta base abre por `mouseenter` e por
 *     `focus`, com 600 ms de espera — desenho certo para uma prévia de link e
 *     errado para uma marca de referência: percorrer com Tab um parágrafo de
 *     cinco citações abriria cinco painéis, um por parada.
 *
 * POR QUE A PEÇA NÃO É O CARTÃO DE PONTEIRO DA LIB HEADLESS DESTA STACK: aquele
 * nasce `role="dialog"`, e papel de diálogo exige nome acessível — com um
 * gatilho cujo texto é "1", o resultado seria um diálogo chamado "1". Além
 * disso ele portala o conteúdo, e portalado o Tab sairia da marca para a
 * próxima palavra do parágrafo, deixando o link do título inalcançável. A
 * marcação aqui é própria, e é a mesma nas cinco stacks.
 *
 * O QUE O COMPONENTE NÃO FAZ: buscar a fonte, resolver o endereço, recortar o
 * trecho, numerar as marcas de uma página, decidir se duas podem estar abertas
 * ao mesmo tempo. Ele desenha o que recebe (§2 da guideline 17).
 *
 * DIVERGÊNCIA DE API, e só de API: o controle de fora é por COMANDO, e nesta
 * stack o comando chega por `ref` — `React.Ref<InlineCitationHandle>`, com
 * `open`/`close`/`toggle`/`isOpen`. Não há propriedade `open` controlada: a
 * peça guarda o próprio estado, devolve cada mudança por `onOpenChange` e
 * aceita a ordem por comando. É o mesmo contrato da fábrica das outras stacks,
 * alcançado pelo caminho que este renderer oferece.
 */

export interface InlineCitationLabels {
  /**
   * O nome acessível da marca, JÁ ESCRITO.
   *
   * O que se vê é um número, e "1" sozinho não diz nada a quem ouve. O nome
   * chega escrito porque junta três coisas que só quem monta conhece — a
   * palavra para "fonte", o número e o título do documento —, e a ordem entre
   * elas troca com o idioma.
   *
   * Ele PRECISA conter o número que a marca mostra (WCAG 2.5.3, rótulo no
   * nome), e é por isso que quem o escreve recebe o número junto no andaime.
   */
  marker: string
  /**
   * O que se diz no lugar do endereço quando ele foi recusado.
   *
   * Endereço recusado não é um lugar, e imprimi-lo responderia com ruído a
   * pergunta que a linha existe para responder — de onde isto vem. O título
   * continua legível; o que sai é o link e o endereço.
   */
  unsafeSource: string
}

/**
 * Os comandos que o controle de fora precisa.
 *
 * A peça não conhece as vizinhas, e não conhecê-las é o que permite que duas
 * marcas da mesma frase venham de lugares diferentes da resposta. Quem tem a
 * lista é quem fecha as outras — e é por aqui que ele manda.
 */
export type InlineCitationHandle = {
  open: () => void
  close: () => void
  toggle: () => void
  isOpen: () => boolean
}

export interface InlineCitationProps {
  /**
   * A citação: a fonte, o trecho e onde dentro dela.
   *
   * Vem inteira de `@shared/primitives/chat-protocol`. `excerpt` e `anchor` são
   * opcionais lá e continuam opcionais aqui: quem cita um documento sem saber a
   * página tem uma citação legítima, e a caixa simplesmente não monta a parte
   * que não veio — nunca um traço no lugar dela.
   */
  citation: Citation
  /**
   * O número que a marca mostra.
   *
   * É CONTEÚDO, e não decoração: é por ele que a frase se refere à fonte, e é
   * ele que amarra a marca à lista de fontes do turno. Quem numera é quem
   * escreve a frase — uma marca que se numerasse sozinha precisaria conhecer as
   * irmãs, e marcas irmãs podem nem estar no mesmo parágrafo.
   */
  index: number
  /** Abre já montada. Serve para fotografar; no uso corrente quem abre é quem lê. */
  defaultOpen?: boolean
  /** Cada abertura e cada fechamento, para quem controla de fora. */
  onOpenChange?: (open: boolean) => void
  labels: InlineCitationLabels
  className?: string
  /** O comando. Ver `InlineCitationHandle`. */
  ref?: React.Ref<InlineCitationHandle>
}

/**
 * Espera antes de abrir ao passar o ponteiro.
 *
 * Menor que os 600 ms do cartão de ponteiro, e de propósito: lá o gatilho é um
 * nome de pessoa ou um link, e abrir cedo demais atrapalha quem só atravessa a
 * frase; aqui o gatilho é uma marca deliberadamente pequena, difícil de pegar
 * por acidente. Quem parou o ponteiro em cima dela quis parar.
 */
const OPEN_DELAY = 300

/**
 * Espera antes de fechar depois que o ponteiro sai.
 *
 * Dá tempo de atravessar o vão entre a marca e a caixa. Mesmo valor do cartão
 * de ponteiro, e pelo mesmo motivo.
 */
const CLOSE_DELAY = 300

/**
 * Folga entre a caixa e a borda da janela, em pixels.
 *
 * Número mecânico, e não valor de desenho: ele não pinta nada e não entra em
 * folha nenhuma — é o limite contra o qual a caixa é empurrada de volta para
 * dentro da tela.
 */
const VIEWPORT_GUTTER = 8

/**
 * Empurra a caixa de volta para dentro da janela, e escolhe o lado.
 *
 * A FOLHA POSICIONA; esta função só MEDE, e devolve o resultado por uma custom
 * property e por um atributo. É a divisão que mantém o desenho na folha: sem
 * ela, o deslocamento viraria `left` em `style` inline, e no dia em que a folha
 * mudasse a largura da caixa o número inline continuaria o mesmo.
 *
 * Roda uma vez por abertura, de dentro de `useLayoutEffect` — depois de a caixa
 * existir no documento e antes da pintura. Fora de qualquer espera com
 * observador de mutação: ela LÊ layout, e leitura que provoca a própria
 * reavaliação é a armadilha que pendura a aba (regra do `waitFor` no CLAUDE.md
 * raiz).
 */
function fitPanel(marker: HTMLElement, panel: HTMLElement): void {
  panel.style.removeProperty("--nds-inline-citation-shift")
  panel.dataset.side = "bottom"

  const markerRect = marker.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()

  // ABAIXO NÃO CABE? Abre para cima — e só quando ACIMA cabe. Sem a segunda
  // metade da pergunta, uma marca numa janela baixa trocaria um transbordo por
  // outro, e o de cima é pior: a caixa cobriria a frase que se estava lendo.
  const roomBelow = window.innerHeight - markerRect.bottom - VIEWPORT_GUTTER
  if (panelRect.height > roomBelow && markerRect.top > panelRect.height + VIEWPORT_GUTTER) {
    panel.dataset.side = "top"
  }

  // O DESVIO HORIZONTAL é medido depois do lado, com a caixa já onde vai ficar.
  // Só a componente horizontal é empurrada: a vertical já foi resolvida pelo
  // lado, e empurrar as duas faria a caixa descolar da marca que a abriu.
  const placed = panel.getBoundingClientRect()
  let shift = 0
  if (placed.right > window.innerWidth - VIEWPORT_GUTTER) {
    shift = window.innerWidth - VIEWPORT_GUTTER - placed.right
  }
  if (placed.left + shift < VIEWPORT_GUTTER) {
    shift = VIEWPORT_GUTTER - placed.left
  }
  if (shift !== 0) {
    // A ÚNICA COISA QUE O CÓDIGO ESCREVE EM `style` é esta custom property, e
    // ela não é valor de desenho: é a medida do empurrão que só existe em
    // tempo de execução. Quem posiciona continua sendo a folha, que a lê.
    panel.style.setProperty("--nds-inline-citation-shift", `${Math.round(shift)}px`)
  }
}

/** O endereço, o título, o trecho e o lugar dentro da fonte. */
function CitationPanel({
  id,
  citation,
  labels,
  ref,
  onMouseEnter,
  onMouseLeave,
}: {
  id: string
  citation: Citation
  labels: InlineCitationLabels
  ref: React.Ref<HTMLSpanElement>
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  // O ENDEREÇO VEM DE QUEM GEROU A RESPOSTA, e endereço vindo dali é ENTRADA:
  // `javascript:` num `href` executa. A pergunta é feita AQUI, no ponto em que
  // o endereço encosta no DOM — e não antes, nem por um invólucro que uma
  // varredura de segurança não reconheceria. Mesma decisão da lista de fontes
  // da conversa e do Markdown.
  const safe = isSafeUrl(citation.source.url)

  return (
    // `<span>`, e não `<div>`: a marca vive dentro de um parágrafo, e `<p>` só
    // aceita conteúdo de frase. Um `<div>` aqui fecharia o parágrafo antes da
    // metade da frase, e o resto do texto viraria irmão do parágrafo em vez de
    // continuação dele. Dentro de uma caixa flexível todo filho é blocado de
    // qualquer jeito, então nada se perde no desenho.
    //
    // A SUPERFÍCIE É A COMPARTILHADA — fundo, borda, raio, sombra e respiro vêm
    // do painel ancorado desta base; o que a folha desta família acrescenta é o
    // que só a citação tem.
    //
    // A CAIXA NÃO É UM DIÁLOGO: sem papel e sem nome próprio, ligada ao botão
    // por `aria-controls`. Quem chegou até ela veio da marca, e a marca já
    // disse de que fonte se trata (decisão 1 da folha).
    <span
      ref={ref}
      id={id}
      className="nds-popover-content nds-inline-citation-panel"
      data-slot="inline-citation-panel"
      data-side="bottom"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* O MONOESPAÇADO SÓ ENTRA QUANDO A LINHA É MESMO UM ENDEREÇO. Recusado,
          o que fica ali são PALAVRAS — endereço recusado não é um lugar, e
          imprimi-lo responderia com ruído a pergunta que a linha existe para
          responder. */}
      <span
        className={
          safe
            ? "nds-inline-citation-address nds-font-mono nds-truncate"
            : "nds-inline-citation-address"
        }
        data-slot="inline-citation-address"
      >
        {safe ? citation.source.url : labels.unsafeSource}
      </span>

      {/* O TÍTULO CONTINUA LEGÍVEL quando o endereço foi recusado, e deixa de
          ser link: não há para onde ir, e um link que não leva a lugar nenhum é
          uma parada de tabulação sem destino. */}
      {safe ? (
        <a
          className="nds-inline-citation-title"
          data-slot="inline-citation-title"
          href={citation.source.url}
          rel="noreferrer"
        >
          {citation.source.title}
        </a>
      ) : (
        <span
          className="nds-inline-citation-title"
          data-slot="inline-citation-title"
          data-unsafe=""
        >
          {citation.source.title}
        </span>
      )}

      {/* O TRECHO É UMA CITAÇÃO, e `<q>` é o elemento que diz isso — com as
          aspas do idioma vindo do navegador em vez de escritas no texto, que é
          o mesmo motivo pelo qual nenhum glifo entra na `translations.json`.
          `cite` leva o endereço só quando ele passou, porque o atributo é um
          endereço como o `href`. */}
      {citation.excerpt ? (
        <q
          className="nds-inline-citation-excerpt"
          data-slot="inline-citation-excerpt"
          cite={safe ? citation.source.url : undefined}
        >
          {citation.excerpt}
        </q>
      ) : null}

      {/* ONDE DENTRO DA FONTE — página, âncora, intervalo de linhas. Chega
          escrito, porque "12" sozinho não é um lugar e o que precede o número é
          idioma. Ausente, NADA é montado no lugar. */}
      {citation.anchor ? (
        <span className="nds-inline-citation-anchor" data-slot="inline-citation-anchor">
          {citation.anchor}
        </span>
      ) : null}
    </span>
  )
}

function InlineCitation({
  citation,
  index,
  defaultOpen = false,
  onOpenChange,
  labels,
  className,
  ref,
}: InlineCitationProps) {
  /**
   * Escopo de id por INSTÂNCIA.
   *
   * `aria-controls` aponta para a caixa por identificador, e um id derivado do
   * número colidiria na hora em que a mesma página mostrasse duas marcas "1" —
   * o atributo passa a resolver para o PRIMEIRO id do documento. Mesma
   * precaução do bloco de terminal.
   *
   * O `useId` do React 19 devolve algo entre aspas angulares: válido em `id`,
   * ilegível num seletor. Normalizar mantém o id utilizável em `querySelector`
   * também.
   */
  const markerId = `nds-inline-citation-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const panelId = `${markerId}-panel`

  const [open, setOpen] = useState(defaultOpen)

  const rootRef = useRef<HTMLSpanElement>(null)
  const markerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLSpanElement>(null)

  /**
   * O estado como REFERÊNCIA, além de como estado.
   *
   * Os comandos e os temporizadores rodam fora da renderização: ler o estado
   * dali pegaria o valor do desenho em que o ouvinte foi criado, e não o
   * último. Mesma divisão do relógio do player.
   */
  const openRef = useRef(defaultOpen)

  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Quem abriu.
   *
   * `pointer` fecha sozinho quando o ponteiro sai; `control` fica até alguém
   * fechar. Sem essa distinção, a caixa aberta por clique sumiria ao primeiro
   * movimento do mouse — e quem abriu por toque veria a prévia piscar.
   */
  const openedBy = useRef<"pointer" | "control">(defaultOpen ? "control" : "pointer")

  /**
   * O callback de quem consome, sempre o do último desenho.
   *
   * Sem isto ele entraria na lista de dependências dos efeitos, e uma função
   * escrita em linha — que é como toda story a passa — reassinaria tudo a cada
   * renderização.
   */
  const onOpenChangeRef = useRef(onOpenChange)
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  })

  const clearTimers = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current)
      openTimer.current = null
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  /** Único caminho para o estado — e o único lugar que solta os temporizadores. */
  const apply = useCallback(
    (next: boolean) => {
      clearTimers()
      openRef.current = next
      setOpen(next)
    },
    [clearTimers],
  )

  /**
   * Cada abertura e cada fechamento chegam a quem controla de fora.
   *
   * A referência começa em `false` porque é ele o estado de partida do desenho:
   * uma marca que nasce aberta por `defaultOpen` é uma ABERTURA, e quem
   * controla de fora tem de saber dela — é o que a fábrica das outras stacks
   * faz ao chamar `show()` no primeiro quadro.
   */
  const notified = useRef(false)
  useEffect(() => {
    if (notified.current === open) return
    notified.current = open
    onOpenChangeRef.current?.(open)
  }, [open])

  // Temporizador pendente não sobrevive à peça: quem tira a marca da página com
  // uma espera em curso não passa por lugar nenhum que a soltasse.
  useEffect(() => clearTimers, [clearTimers])

  /**
   * Encaixar a caixa, uma vez por abertura.
   *
   * `useLayoutEffect` e não `useEffect`: a medida exige o retângulo da marca e
   * o da caixa, e ler layout depois da pintura faria a caixa aparecer no lugar
   * errado por um quadro.
   */
  useLayoutEffect(() => {
    if (!open) return
    const marker = markerRef.current
    const panel = panelRef.current
    if (!marker || !panel) return
    fitPanel(marker, panel)
  }, [open])

  // Os dois ouvintes de documento só existem enquanto a caixa está aberta.
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      // Escape fecha e o foco NÃO se move: ele já está na marca, que é de onde
      // a caixa saiu (WCAG 2.1.2, e a regra 2 da §8 da guideline 17).
      if (event.key !== "Escape") return
      event.stopPropagation()
      apply(false)
      markerRef.current?.focus()
    }

    function onOutsidePointer(event: Event) {
      const target = event.target
      if (target instanceof Node && rootRef.current?.contains(target)) return
      apply(false)
    }

    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("pointerdown", onOutsidePointer, true)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("pointerdown", onOutsidePointer, true)
    }
  }, [open, apply])

  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        openedBy.current = "control"
        apply(true)
      },
      close: () => {
        apply(false)
      },
      toggle: () => {
        openedBy.current = "control"
        apply(!openRef.current)
      },
      isOpen: () => openRef.current,
    }),
    [apply],
  )

  const scheduleShow = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    if (openRef.current) return
    openTimer.current = setTimeout(() => {
      openedBy.current = "pointer"
      apply(true)
    }, OPEN_DELAY)
  }, [apply])

  const scheduleHide = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current)
      openTimer.current = null
    }
    // Aberta por controle, o ponteiro que sai não fecha: quem clicou pediu que
    // ficasse, e em toque não há "sair" nenhum para desfazer o pedido.
    if (openedBy.current === "control") return
    closeTimer.current = setTimeout(() => {
      apply(false)
    }, CLOSE_DELAY)
  }, [apply])

  const holdOpen = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  // PONTEIRO, TOQUE E TECLADO, e nenhum deles sozinho. O clique é o caminho que
  // serve aos três — em toque ele é o único que existe, e no teclado ele é o
  // que Enter e Espaço já disparam num botão. O ponteiro ganha a abertura por
  // espera como CONVENIÊNCIA, nunca como único caminho (regra 3 da §8).
  const handleClick = useCallback(() => {
    openedBy.current = "control"
    apply(!openRef.current)
  }, [apply])

  // A MARCA NÃO ABRE POR FOCO, e é a divergência deliberada em relação ao
  // cartão de ponteiro. Percorrer com Tab um parágrafo de cinco citações
  // abriria cinco caixas, uma por parada — e caixa aberta sem ninguém pedir
  // cobre o texto que a pessoa estava lendo.

  return (
    // A RAIZ É UM `<span>` EM LINHA, e a caixa é FILHA dela — não um portal
    // para o `body`. Duas coisas dependem disso, e as duas são desta peça:
    //
    //   · A ORDEM DE TABULAÇÃO fica natural. Da marca, o Tab entra na caixa e
    //     alcança o link do título. Com a caixa portalada para o fim do `body`,
    //     o Tab sairia da marca para a próxima palavra do parágrafo e o link
    //     ficaria inalcançável sem mover o foco à mão — e mover o foco é o que
    //     a regra 2 da §8 proíbe.
    //   · O POSICIONAMENTO fica na FOLHA. A raiz é `position: relative`, então
    //     a caixa se ancora nela por CSS; o único número que o código escreve é
    //     o empurrão de volta para dentro da janela.
    <span
      ref={rootRef}
      className={cn("nds-inline-citation", className)}
      data-slot="inline-citation"
    >
      {/* A MARCA É UM BOTÃO QUE EXPANDE, e não um link nem um gatilho de
          diálogo. `aria-expanded` é o que diz o estado, e ele é PALAVRA para
          quem ouve — nada aqui depende de a marca mudar de cor (WCAG 1.4.1).

          O NÚMERO É O TEXTO, e o nome acessível o contém (WCAG 2.5.3). Ele
          chega PRONTO em `labels.marker`: o componente nunca o monta. */}
      <button
        ref={markerRef}
        type="button"
        id={markerId}
        className="nds-inline-citation-marker"
        data-slot="inline-citation-marker"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={labels.marker}
        onClick={handleClick}
        onMouseEnter={scheduleShow}
        onMouseLeave={scheduleHide}
      >
        {index}
      </button>

      {open ? (
        <CitationPanel
          ref={panelRef}
          id={panelId}
          citation={citation}
          labels={labels}
          onMouseEnter={holdOpen}
          onMouseLeave={scheduleHide}
        />
      ) : null}
    </span>
  )
}

export { InlineCitation }
