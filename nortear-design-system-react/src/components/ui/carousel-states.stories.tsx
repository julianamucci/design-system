import type { Meta, StoryObj } from "@storybook/react-vite";
import { waitFor, within, expect } from "storybook/test";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "./carousel";
import { SlideCard, viewportVisible } from "./carousel.fixtures";
import { carouselSource, carouselUltimoSlideSource } from "./carousel.source";

const meta = {
  title: "UI/Carousel/States",
  tags: ["display"],
  component: Carousel,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: carouselSource },
      description: {
        component:
          "Os dois extremos do carrossel sem repetição: no primeiro slide a seta de voltar está desabilitada, no último a de avançar.",
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const SLIDES = [1, 2, 3];

export const FirstSlide: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: {
      description: {
        story:
          "Estado de entrada: nada foi navegado ainda, então voltar não leva a lugar nenhum e a seta anterior nasce desabilitada.",
      },
    },
  },
  render: () => (
    <Carousel className="nds-w-md" aria-label="Slides no primeiro item">
      <CarouselContent>
        {SLIDES.map((n) => (
          <CarouselItem key={n}>
            <SlideCard label={`Slide ${n}`} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label="Item anterior" />
      <CarouselNext aria-label="Próximo item" />
    </Carousel>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
    const anterior = canvas.getByRole("button", { name: /item anterior/i });
    const proximo = canvas.getByRole("button", { name: /próximo item/i });

    await step("No começo só a seta de avanço leva a algum lugar", async () => {
      await expect(anterior).toBeDisabled();
      // `canScrollNext` nasce falso e só é sincronizado com o Embla numa
      // microtask: a seta de avanço ACABA de sair do disabled quando o play
      // começa, daí a espera.
      await waitFor(async () => {
        await expect(proximo).toBeEnabled();
      }, { timeout: 4000 });
    });

    await step("O extremo é visível, não só programático", async () => {
      // Duas instâncias do MESMO botão, lado a lado: comparar a seta apagada
      // com a viva prova o contraste do estado. Medir só a opacidade da
      // desabilitada passaria numa tela onde todas estivessem apagadas.
      //
      // O `waitFor` não é folga: `.nds-button` declara
      // `transition: … opacity var(--duration-fast)`, e a seta de avanço acabou
      // de mudar de estado no passo anterior. Ler no primeiro quadro pegaria o
      // valor de PARTIDA — 0.5 contra 0.5 — e o teste reprovaria por corrida.
      await waitFor(async () => {
        const apagada = Number(getComputedStyle(anterior).opacity);
        const viva = Number(getComputedStyle(proximo).opacity);
        await expect(apagada).toBeLessThan(viva);
      }, { timeout: 4000 });
    });

    await step("O trilho está no começo", async () => {
      // A prova de que o começo é real e não só um sinalizador do componente:
      // o primeiro slide está enquadrado e o último ficou fora.
      const slides = canvas.getAllByRole("group");
      await expect(slides.length).toBe(SLIDES.length);
      await expect(viewportVisible(slides[0], viewport)).toBe(true);
      await expect(viewportVisible(slides[slides.length - 1], viewport)).toBe(false);
    });
  },
};

export const LastSlide: Story = {
  parameters: {
    covers: ["functional.item4", "visual.item4"],
    docs: {
      // Montar já no fim é uma opção do motor (`startIndex`), e é ela que cria
      // o estado — a seta desabilita sozinha, sem estado autoral nenhum.
      source: { transform: carouselUltimoSlideSource },
      description: {
        story:
          "No fim do percurso sem repetição avançar deixa de ser possível e a seta seguinte fica desabilitada.",
      },
    },
  },
  render: () => (
    <Carousel
      className="nds-w-md"
      aria-label="Slides no último item"
      opts={{ startIndex: SLIDES.length - 1 }}
    >
      <CarouselContent>
        {SLIDES.map((n) => (
          <CarouselItem key={n}>
            <SlideCard label={`Slide ${n}`} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label="Item anterior" />
      <CarouselNext aria-label="Próximo item" />
    </Carousel>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
    const anterior = canvas.getByRole("button", { name: /item anterior/i });
    const proximo = canvas.getByRole("button", { name: /próximo item/i });

    await step("No fim a seta de avanço desabilita e a de voltar acorda", async () => {
      // O par importa: só "avançar desabilitado" também seria verdade num
      // carrossel de um slide só, onde nada nunca avançou.
      await waitFor(async () => {
        await expect(proximo).toBeDisabled();
      }, { timeout: 4000 });
      // A POSIÇÃO chega antes do ESTADO: a rolagem encostou no alvo, mas quem
      // muda o controle é a reconciliação do índice, adiada até o motor silenciar.
      await waitFor(async () => {
        await expect(anterior).toBeEnabled();
      }, { timeout: 4000 });
    });

    await step("O extremo é visível, não só programático", async () => {
      // Espelho da comparação do primeiro slide: agora a apagada é a outra.
      await waitFor(async () => {
        const apagada = Number(getComputedStyle(proximo).opacity);
        const viva = Number(getComputedStyle(anterior).opacity);
        await expect(apagada).toBeLessThan(viva);
      }, { timeout: 4000 });
    });

    await step("O trilho chegou ao fim", async () => {
      const slides = canvas.getAllByRole("group");
      await expect(slides.length).toBe(SLIDES.length);
      await waitFor(async () => {
        await expect(viewportVisible(slides[slides.length - 1], viewport)).toBe(true);
      }, { timeout: 4000 });
      await expect(viewportVisible(slides[0], viewport)).toBe(false);
    });
  },
};
