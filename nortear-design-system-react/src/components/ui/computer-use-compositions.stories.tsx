import { useCallback } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"
import { AgentStatus } from "./agent-status"
import { ComputerUse } from "./computer-use"
import { elapsedOf, useAgentStatusLabels } from "./agent-status.fixtures"
import { DemoScreen, useComputerUseLabels } from "./computer-use.fixtures"
import {
  computerUseBesideRunSource,
  computerUsePortraitSource,
  computerUseScreenSource,
} from "./computer-use.source"
import {
  COMPUTER_STEPS_LOGIN,
  COMPUTER_URL,
  COMPUTER_URL_LONG,
} from "@shared/primitives/computer-use-examples"

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde a peça mora em relação às irmãs, e o que acontece quando o que entra
// nela é maior que o espaço — que é a pergunta de desenho mais difícil de uma
// moldura: o endereço que não cabe na barra, o alvo que não cabe na legenda, e
// o quadro que não tem a proporção que a tela pede.

const meta: Meta = {
  title: "Primitives/Conversational/ComputerUse/Compositions",
  tags: ["conversational"],
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: computerUseBesideRunSource },
      description: {
        component:
          "A peça é autônoma: ela não sabe que as irmãs existem, não dirige nada e não oferece ação — parar e repetir são do estado da execução.",
      },
    },
  },
}

export default meta
type Story = StoryObj

const pieceOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="computer-use"]')!

/**
 * A tela abaixo da linha de estado da execução.
 *
 * As duas são AUTÔNOMAS e respondem a perguntas diferentes: uma diz em que pé
 * está a resposta inteira e carrega as ações de parar e repetir, a outra mostra
 * onde o agente está tocando agora. Por isso a story monta as duas em sequência
 * em vez de passar uma para dentro da outra.
 *
 * Os rótulos vêm de hook, então o render passa por um componente.
 */
function BesideRunStatusExample() {
  return (
    <div className="nds-stack nds-max-w-md" data-spacing="sm">
      <AgentStatus
        status="running"
        elapsed={elapsedOf("running")}
        labels={useAgentStatusLabels()}
      />
      <ComputerUse
        url={COMPUTER_URL}
        screen={<DemoScreen />}
        steps={COMPUTER_STEPS_LOGIN}
        activeIndex={3}
        status="running"
        labels={useComputerUseLabels()}
      />
    </div>
  )
}

/**
 * O endereço e o alvo longos, cortados.
 *
 * O quarto passo é o do alvo longo — a senha guardada no cofre.
 */
function LongTextExample() {
  return (
    <div className="nds-stack nds-max-w-2xs">
      <ComputerUse
        url={COMPUTER_URL_LONG}
        screen={<DemoScreen />}
        steps={COMPUTER_STEPS_LOGIN}
        activeIndex={3}
        status="running"
        labels={useComputerUseLabels()}
      />
    </div>
  )
}

/**
 * O quadro em retrato.
 *
 * A proporção é propriedade PERSONALIZADA, e não valor de desenho em `style`:
 * fosse `aspect-ratio` direto, a declaração venceria a folha e sairia do tema.
 *
 * A PROPRIEDADE TEM DE ALCANÇAR A PEÇA, e não o contêiner — e é a armadilha
 * desta story. A folha declara `--computer-use-aspect` DENTRO de
 * `.nds-computer-use`, e declaração no próprio elemento vence valor herdado:
 * posta no invólucro, ela nunca chegaria, e a story fotografaria dezesseis por
 * nove achando que fotografa retrato. Nem a `play` reprovaria, porque o valor
 * estaria lá — no elemento errado.
 *
 * DIVERGÊNCIA DE FRAMEWORK, e ela está registrada: a assinatura da peça é a
 * mesma das irmãs da família nesta stack (`className`, e mais nada do
 * renderer), então não há `style` para repassar. O caminho que a documentação
 * ensina é o mesmo nas cinco, e é o da FOLHA de quem consome — uma regra em
 * `.nds-computer-use`, que é onde o valor padrão também está declarado. Aqui a
 * story escreve essa mesma declaração no elemento, que é o único caminho que
 * este renderer oferece para tocá-lo, e é o equivalente exato do que a story do
 * vanilla faz depois de a fábrica devolver a figura.
 */
function PortraitExample() {
  const applyAspect = useCallback((node: HTMLDivElement | null) => {
    node
      ?.querySelector<HTMLElement>('[data-slot="computer-use"]')
      ?.style.setProperty("--computer-use-aspect", "9 / 16")
  }, [])

  return (
    <div className="nds-stack nds-max-w-2xs" ref={applyAspect}>
      <ComputerUse
        url="m.exemplo.com/entrar"
        screen={<DemoScreen />}
        steps={COMPUTER_STEPS_LOGIN}
        activeIndex={2}
        status="running"
        labels={useComputerUseLabels()}
      />
    </div>
  )
}

export const BesideRunStatus: Story = {
  parameters: {
    covers: ["functional.item12", "visual.item8"],
    docs: { source: { transform: computerUseBesideRunSource } },
  },
  render: () => <BesideRunStatusExample />,
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement)

    await step("A ação de parar existe só na linha de estado", async () => {
      // Dois botões de parar para uma execução só fariam quem apertasse um
      // deles não saber qual parou. Esta peça é o REGISTRO do que está sendo
      // feito, não o controle.
      await expect(
        canvasElement.querySelector('[data-slot="agent-status-action"]'),
      ).not.toBeNull()
      // A tela de demonstração tem um botão dentro, e ele é da FOTO: `inert` o
      // tira da ordem de foco e da árvore de acessibilidade. O que a asserção
      // cobra é que a peça não ofereça ação PRÓPRIA — nada fora da tela.
      const own = [...piece.querySelectorAll("button")].filter(
        (el) => el.closest("[inert]") === null,
      )
      await expect(own).toEqual([])
    })

    await step("Nenhuma contém a outra", async () => {
      const status = canvasElement.querySelector<HTMLElement>('[data-slot="agent-status"]')!
      await expect(status.contains(piece)).toBe(false)
      await expect(piece.contains(status)).toBe(false)
    })
  },
}

/**
 * O endereço e o alvo longos, cortados.
 *
 * Os dois crescem sem teto — o endereço traz parâmetro de consulta, e o alvo é
 * o que o agente decidiu chamar aquilo. Cortar é a escolha certa aqui, e é o
 * contrário da que o comando do bloco de terminal fez: comando pela metade é
 * instrução pela metade, mas endereço pela metade continua dizendo qual tela é.
 */
export const LongText: Story = {
  parameters: {
    covers: [
      "functional.item11",
      "accessibility.item6", "accessibility.item7", "accessibility.item8",
      "visual.item9",
    ],
    docs: { source: { transform: computerUseScreenSource } },
  },
  render: () => <LongTextExample />,
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement)

    await step("O endereço e o alvo levam a utilitária que corta", async () => {
      // A classe mora na MARCAÇÃO, e some em silêncio quando alguém copia a
      // árvore pela metade — nenhum portão a alcança, então a asserção é ela.
      const url = piece.querySelector<HTMLElement>('[data-slot="computer-use-url"]')!
      const target = piece.querySelector<HTMLElement>('[data-slot="computer-use-target"]')!
      await expect(url.classList.contains("nds-truncate")).toBe(true)
      await expect(target.classList.contains("nds-truncate")).toBe(true)
    })

    await step("O texto inteiro continua no elemento, ainda que cortado na tela", async () => {
      // Cortar é desenho, e não perda: quem lê com leitor de tela recebe o
      // endereço completo, porque o corte é do CSS e não do conteúdo.
      const url = piece.querySelector<HTMLElement>('[data-slot="computer-use-url"]')!
      await expect(url.textContent).toBe(COMPUTER_URL_LONG)
    })

    await step("Nada dentro da peça entra na ordem de foco", async () => {
      // A tela é uma FOTO: parada de tabulação para dentro de um retrato daria
      // ao teclado um caminho para uma tela que ninguém está usando. O quadro
      // recorta em vez de rolar, então também não há região rolável a nomear.
      const focusable = piece.querySelectorAll(
        "a[href], button, input, select, textarea, [tabindex]",
      )
      await expect([...focusable].every((el) => el.closest("[inert]") !== null)).toBe(true)
    })
  },
}

/**
 * O quadro em retrato.
 *
 * Tela de telefone não é dezesseis por nove, e a peça não tem como saber. A
 * proporção é propriedade personalizada justamente para que quem consome a mude
 * na folha dele, sem tirar o valor do tema e da escala de tipo.
 */
export const Portrait: Story = {
  parameters: {
    covers: ["visual.item10"],
    docs: { source: { transform: computerUsePortraitSource } },
  },
  render: () => <PortraitExample />,
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement)

    await step("A proporção do quadro veio da propriedade personalizada", async () => {
      // Leitura pura, e no COMPUTADO — nunca no `style` do invólucro. Ler o
      // invólucro passaria com o quadro em dezesseis por nove, porque a folha
      // declara a propriedade no próprio elemento e declaração vence herança:
      // seria portão sem dentes, verde justamente no defeito que ele existe
      // para pegar.
      const aspect = getComputedStyle(piece)
        .getPropertyValue("--computer-use-aspect")
        .replace(/\s+/g, "")
      await expect(aspect).toBe("9/16")
      // E a proporção NÃO entrou como `aspect-ratio` de desenho, que sairia do
      // tema e da escala de tipo.
      await expect(piece.style.aspectRatio).toBe("")
    })
  },
}
