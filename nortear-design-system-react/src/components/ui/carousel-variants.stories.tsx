import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, waitFor } from "storybook/test";
import {
  measureSlides,
  reprovasDeEscala,
  feedbackDePointerReprovas,
  pontoDeParadaIntacto,
  controlReach,
  escalaSobMovimentoReduzido,
  describeFailures,
} from "@shared/testing/carousel-probe";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "./carousel";
import { SlideCard, viewportVisible } from "./carousel.fixtures";
import { carouselSource, carouselVerticalSource } from "./carousel.source";

const meta = {
  title: "Primitives/Display/Carousel/Variants",
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
          "Variações de orientação do Carousel: horizontal (padrão) e vertical.",
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  parameters: {
    covers: ["accessibility.item5", "accessibility.item7", "functional.item10", "visual.item2", "visual.item6"],
    docs: {
      description: {
        story:
          "Orientação padrão: os slides deitam em linha e as setas ficam nas laterais, fora da área recortada.",
      },
    },
  },
  render: () => (
    <Carousel className="nds-w-md" aria-label="Slides na horizontal">
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, i) => (
          <CarouselItem key={i}>
            <SlideCard label={`Slide ${i + 1}`} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label="Item anterior" />
      <CarouselNext aria-label="Próximo item" />
    </Carousel>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const regiao = canvas.getByRole("region");
    const track = canvasElement.querySelector<HTMLElement>(".nds-carousel-track")!;

    await step("A região se anuncia como carrossel e tem nome próprio", async () => {
      await expect(regiao).toHaveAttribute("aria-roledescription", "carousel");
      await expect(regiao).toHaveAccessibleName("Slides na horizontal");
    });

    await step("O trilho deita os slides em linha", async () => {
      await expect(track).toHaveAttribute("data-orientation", "horizontal");
      await expect(getComputedStyle(track).flexDirection).toBe("row");
    });

    await step("As setas ficam nas laterais, fora da área dos slides", async () => {
      // É o que `.nds-carousel-arrow-*[data-orientation="horizontal"]` faz. Se
      // o atributo não chegasse, os botões empilhariam SOBRE o primeiro slide,
      // sem erro nenhum no console — e o contraste que o axe mede deixaria de
      // ser contra o fundo da página para ser contra a arte do slide.
      const area = regiao.getBoundingClientRect();
      const previous = canvas
        .getByRole("button", { name: /item anterior/i })
        .getBoundingClientRect();
      const next = canvas
        .getByRole("button", { name: /próximo item/i })
        .getBoundingClientRect();
      await expect(previous.left).toBeLessThan(area.left);
      await expect(next.right).toBeGreaterThan(area.right);
    });

    await step("O slide atual fica em tamanho cheio e os vizinhos recuam", async () => {
      // A escala é `transform`, e `transform` não deixa rastro em atributo, em
      // texto nem em papel ARIA: a única prova é a caixa RENDERIZADA contra a
      // caixa de LAYOUT. O `waitFor` não é folga — a transição parte do tamanho
      // cheio e leva `--duration-base` para chegar, então o primeiro quadro
      // mede o ponto de partida e reprovaria por corrida.
      await waitFor(async () => {
        await expect(describeFailures(reprovasDeEscala(measureSlides(canvasElement), 0))).toBe("");
      }, { timeout: 4000 });
    });

    await step("A escala não moveu o ponto de parada da rolagem", async () => {
      // `transform` é pintura, não layout — mas isso é promessa. Passos de
      // layout desiguais entre slides significariam que a escala vazou para o
      // layout, e o carrossel passaria a parar fora do slide.
      await expect(describeFailures(pontoDeParadaIntacto(canvasElement))).toBe("");
    });

    await step("Com movimento reduzido a escala some por inteiro", async () => {
      // Não basta a transição parar: um salto de tamanho é justamente o que a
      // preferência pede para não acontecer. A sonda liga a preferência pelo
      // mesmo canal do toolbar do Storybook e a desliga no `finally`, senão a
      // story seguinte e a foto dela sairiam envenenadas.
      const failures = await escalaSobMovimentoReduzido(canvasElement, waitFor);
      await expect(describeFailures(failures)).toBe("");
    });

    await step("A seta responde ao ponteiro sem sair do lugar", async () => {
      const next = canvas.getByRole("button", { name: /próximo item/i });

      // A escrita direta do `transform` faz as vezes do ponteiro. Não é atalho:
      // `userEvent.hover` despacha eventos, e o `:hover` do CSS responde ao
      // cursor de verdade — medido, dá razão 1.000 e não verifica nada. O que
      // importa aqui é a COLISÃO de duas regras na propriedade `transform`, e
      // escrevê-la à mão reproduz a colisão inteira.
      const failures = [
        ...(await feedbackDePointerReprovas(next, waitFor)),
        ...controlReach(next),
      ];
      await expect(describeFailures(failures)).toBe("");
    });
  },
};

export const Vertical: Story = {
  parameters: {
    covers: ["functional.item5", "functional.item10", "visual.item2"],
    docs: {
      // O arquivo desliga os controls, então o meta não tem de onde ler o eixo
      // — e o eixo é o assunto: com ele mudam o trilho, as setas e as teclas.
      source: { transform: carouselVerticalSource },
      description: {
        story:
          "Os slides empilham e as setas passam para cima e para baixo do viewport, que recebe altura por classe de proporção.",
      },
    },
  },
  render: () => (
    <Carousel
      orientation="vertical"
      className="nds-w-xs"
      aria-label="Slides na vertical"
    >
      {/* `nds-aspect-4-3` dá ao trilho a altura DEFINIDA que a base
          `flex: 0 0 100%` do slide precisa para resolver. Sem ela o carrossel
          vertical empilha os slides e nada é recortado. */}
      <CarouselContent className="nds-aspect-4-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <CarouselItem key={i} className="nds-basis-full">
            <SlideCard label={`Slide ${i + 1}`} preencher />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label="Item anterior" />
      <CarouselNext aria-label="Próximo item" />
    </Carousel>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const regiao = canvas.getByRole("region");
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
    const track = canvasElement.querySelector<HTMLElement>(".nds-carousel-track")!;

    await step("O trilho empilha os slides em coluna", async () => {
      await expect(track).toHaveAttribute("data-orientation", "vertical");
      await expect(getComputedStyle(track).flexDirection).toBe("column");
    });

    await step("Cada slide ocupa a altura do viewport", async () => {
      // A prova de que a altura definida chegou: sem ela a base 100% do slide
      // cai para `auto` e o slide encolhe até o conteúdo.
      const slides = canvas.getAllByRole("group");
      await expect(slides[0].getBoundingClientRect().height).toBeGreaterThanOrEqual(
        viewport.clientHeight,
      );
      // E o recorte é real: o segundo slide já está fora do enquadramento.
      await expect(viewportVisible(slides[0], viewport)).toBe(true);
      await expect(viewportVisible(slides[1], viewport)).toBe(false);
    });

    await step("As setas ficam acima e abaixo do viewport", async () => {
      const area = regiao.getBoundingClientRect();
      const previous = canvas
        .getByRole("button", { name: /item anterior/i })
        .getBoundingClientRect();
      const next = canvas
        .getByRole("button", { name: /próximo item/i })
        .getBoundingClientRect();
      await expect(previous.top).toBeLessThan(area.top);
      await expect(next.bottom).toBeGreaterThan(area.bottom);
    });

    await step("A seta girada também não sai do lugar sob o ponteiro", async () => {
      // O eixo vertical é o caso difícil: aqui a centralização vem acompanhada
      // de uma ROTAÇÃO. Escrita em `transform`, ela desaparecia junto com a
      // centralização quando o `scale` do hover chegava — o chevron voltava a
      // apontar para o lado errado no mesmo quadro em que o botão despencava.
      // Escrita em `translate` + `rotate`, as duas convivem com o `scale`.
      const next = canvas.getByRole("button", { name: /próximo item/i });
      const failures = await feedbackDePointerReprovas(next, waitFor);
      await expect(describeFailures(failures)).toBe("");
    });
  },
};
