import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, waitFor, within, expect } from "storybook/test";
import AutoplayPlugin from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "./carousel";

const meta = {
  title: "UI/Carousel/Settings",
  tags: ["display"],
  component: Carousel,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Configuracoes funcionais do Carousel: item único, múltiplos itens responsivos e autoplay via plugin.",
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Slide sem medida cravada — proporção e cor vêm de classe, não de `style`. */
function SlideCard({ label }: { label: string }) {
  return (
    <div className="nds-aspect-16-9">
      <div
        className="nds-cluster nds-h-full nds-bg-muted-soft nds-rounded-lg"
        data-align="center"
        data-justify="center"
      >
        <span className="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

/** Ver a nota em carousel-estados: o Embla move o trilho, não o `scrollLeft`. */
function visivelNoViewport(slide: Element, viewport: Element): boolean {
  const s = slide.getBoundingClientRect();
  const v = viewport.getBoundingClientRect();
  return s.right > v.left + 1 && s.left < v.right - 1 && s.bottom > v.top + 1 && s.top < v.bottom - 1;
}

function viewportDe(canvasElement: HTMLElement): HTMLElement {
  return canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
}

export const Single: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      description: {
        story: "Um item por vez: cada slide ocupa a largura inteira do viewport.",
      },
    },
  },
  render: () => (
    <Carousel className="nds-w-full nds-max-w-md" aria-label="Galeria de item único">
      <CarouselContent>
        {Array.from({ length: 3 }).map((_, i) => (
          <CarouselItem key={i} className="nds-basis-full">
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
    const viewport = viewportDe(canvasElement);

    await step("O slide ocupa a largura inteira do viewport", async () => {
      const slide = canvas.getAllByRole("group")[0];
      const proporcao = slide.getBoundingClientRect().width / viewport.clientWidth;
      // Passa de 1 de propósito: a margem negativa do trilho puxa o padding do
      // primeiro slide para fora, e é ele que dá o respiro entre os slides.
      await expect(proporcao).toBeGreaterThan(0.98);
      await expect(proporcao).toBeLessThan(1.2);
    });

    await step("Só um slide cabe de cada vez, e ainda há para onde ir", async () => {
      const slides = canvas.getAllByRole("group");
      await expect(slides.length).toBeGreaterThan(1);
      await expect(visivelNoViewport(slides[1], viewport)).toBe(false);
      await waitFor(async () => {
        await expect(canvas.getByRole("button", { name: /próximo item/i })).toBeEnabled();
      });
    });
  },
};

export const MultiResponsive: Story = {
  parameters: {
    covers: ["functional.item6", "visual.item3"],
    docs: {
      description: {
        story:
          "A base do slide muda por breakpoint: um item em telas estreitas, dois em médias, três em largas.",
      },
    },
  },
  render: () => (
    <Carousel className="nds-w-full nds-max-w-lg" aria-label="Galeria de múltiplos itens">
      <CarouselContent>
        {Array.from({ length: 6 }).map((_, i) => (
          <CarouselItem key={i} className="nds-md-basis-half nds-lg-basis-third">
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
    const viewport = viewportDe(canvasElement);
    // A classe é responsiva por definição: afirmar "um terço" sem consultar a
    // media query amarraria o teste à largura do runner, que nenhum
    // `parameters.viewport` controla aqui.
    const janela = canvasElement.ownerDocument.defaultView!;
    const grande = janela.matchMedia("(min-width: 1024px)").matches;
    const medio = janela.matchMedia("(min-width: 768px)").matches;
    const porTela = grande ? 3 : medio ? 2 : 1;

    await step("A base do slide acompanha o breakpoint em vigor", async () => {
      const slide = canvas.getAllByRole("group")[0];
      const proporcao = slide.getBoundingClientRect().width / viewport.clientWidth;
      await expect(proporcao).toBeCloseTo(1 / porTela, 1);
    });

    await step("Vários slides ficam enquadrados ao mesmo tempo", async () => {
      const slides = canvas.getAllByRole("group");
      await expect(slides.length).toBe(6);
      const visiveis = slides.filter((s) => visivelNoViewport(s, viewport)).length;
      await expect(visiveis).toBe(porTela);
    });

    await step("Todos os slides continuam anunciáveis", async () => {
      for (const slide of canvas.getAllByRole("group")) {
        await expect(slide).toHaveAttribute("aria-roledescription", "slide");
      }
    });
  },
};

/**
 * Instância do Embla desta story, capturada por `setApi`.
 *
 * É por ela que o play religa o relógio antes de medir: o replay do painel
 * Interactions roda no MESMO DOM, e sem a precondição a segunda rodada
 * começaria do estado parado que a primeira deixou.
 */
let autoplayApi: CarouselApi;

export const Autoplay: Story = {
  parameters: {
    covers: ["functional.item7", "visual.item3"],
    docs: {
      description: {
        story:
          "O plugin avança sozinho a cada intervalo e cede o controle na primeira interação com o carrossel.",
      },
    },
  },
  render: () => (
    <Carousel
      className="nds-w-full nds-max-w-md"
      aria-label="Galeria com autoplay"
      opts={{ loop: true }}
      setApi={(api) => {
        autoplayApi = api;
      }}
      plugins={[AutoplayPlugin({ delay: 400, stopOnInteraction: true })]}
    >
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
    const viewport = viewportDe(canvasElement);
    // O `!` é intencional: enquanto o Embla não tiver montado, a chamada lança
    // e o `waitFor` do passo de precondição repete até a instância existir.
    const relogio = () => autoplayApi!.plugins().autoplay;
    const posicao = () => {
      const slide = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-item"]')!;
      return slide.getBoundingClientRect().left - viewport.getBoundingClientRect().left;
    };

    await step("Os slides estão montados e a navegação manual segue disponível", async () => {
      // Com repetição ligada as setas nunca desabilitam: o avanço automático
      // não é o único caminho, que é o que a WCAG 2.2.2 pede.
      await expect(canvas.getAllByRole("group")).toHaveLength(5);
      await waitFor(async () => {
        await expect(canvas.getByRole("button", { name: /próximo item/i })).toBeEnabled();
      });
      await expect(canvas.getByRole("button", { name: /item anterior/i })).toBeEnabled();
    });

    await step("Precondição: o relógio do avanço automático está ligado", async () => {
      await waitFor(async () => {
        await expect(relogio()).toBeDefined();
      });
      // `play()` aqui é o método do plugin de autoplay do Embla, não o play de
      // outra story — a regra do lint casa pelo nome e não sabe distinguir.
      // eslint-disable-next-line storybook/context-in-play-function
      if (!relogio().isPlaying()) relogio().play();
      await expect(relogio().isPlaying()).toBe(true);
    });

    await step("O carrossel avança sozinho, sem ninguém tocar nele", async () => {
      const antes = posicao();
      // Geometria, não `scrollLeft`: o Embla desloca o trilho por `transform`.
      await waitFor(() => expect(posicao()).not.toBe(antes), { timeout: 4000 });
    });

    await step("Interagir com o carrossel entrega o controle a quem interagiu", async () => {
      // `stopOnInteraction` escuta o evento `pointerDown` do Embla, que nasce do
      // mousedown no viewport arrastável. Clicar na SETA não passa por ali — é
      // navegação programática, e o relógio continuaria correndo.
      await userEvent.click(viewport);
      await waitFor(async () => {
        await expect(relogio().isPlaying()).toBe(false);
      });
    });

    await step("E a story termina parada, para a captura e para o axe", async () => {
      // Estado observável, não só a bandeira do plugin: passado mais de um
      // intervalo inteiro de autoplay, o carrossel continua no MESMO slide.
      //
      // O índice, e não a caixa do primeiro slide. Com repetição ligada o Embla
      // reposiciona slides individualmente para montar a ilusão do laço, então
      // a caixa se mexe alguns pixels sem ninguém ter avançado nada — foram os
      // 5px de deriva que reprovaram este passo duas vezes. O índice não tem
      // esse ruído, e é exatamente o que "não avançou" quer dizer.
      const antes = autoplayApi!.selectedScrollSnap();
      await new Promise((resolve) => setTimeout(resolve, 1400));   // 3,5x o delay
      await expect(autoplayApi!.selectedScrollSnap()).toBe(antes);
      await expect(relogio().isPlaying()).toBe(false);
    });
  },
};
