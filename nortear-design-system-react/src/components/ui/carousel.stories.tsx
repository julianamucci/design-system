import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, waitFor, within, expect } from "storybook/test";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "./carousel";
import { CarouselDocs } from "@/components/docs/CarouselDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Carousel",
  component: Carousel,
  tags: ["autodocs", "display"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(CarouselDocs) },
  },
  argTypes: {
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
      description: "Direção do deslize dos slides",
    },
  },
  args: {
    orientation: "horizontal",
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Slide sem uma medida cravada: a proporção e a cor vêm de classe, então o
 * exemplo acompanha tema, densidade e escala tipográfica. `style` inline
 * venceria a folha e sairia dos três.
 */
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


export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item2", "functional.item3",
      "accessibility.item1", "accessibility.item2", "accessibility.item3",
      "accessibility.item4", "visual.item1",
    ],
  },
  render: (args) => (
    <Carousel {...args} className="nds-w-full nds-max-w-md" aria-label="Galeria de exemplos">
      {/* Em vertical o trilho precisa de altura DEFINIDA: sem ela a base
          `flex: 0 0 100%` do slide não tem contra o que resolver. A altura vem
          de uma classe de proporção, nunca de `style`. */}
      <CarouselContent className={args.orientation === "vertical" ? "nds-aspect-4-3" : undefined}>
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const regiao = canvas.getByRole("region");
    const eixo = args.orientation === "vertical" ? "top" : "left";
    const anterior = () =>
      canvas.getByRole("button", { name: /item anterior/i }) as HTMLButtonElement;
    const proximo = () =>
      canvas.getByRole("button", { name: /próximo item/i }) as HTMLButtonElement;

    const slides = () => canvas.getAllByRole("group") as HTMLElement[];
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;

    /**
     * Índice do slide que ocupa a maior parte do viewport.
     *
     * Duas tentativas anteriores mediram PIXEL, e as duas erraram. "Andou em
     * relação à medida de agora" resolve no primeiro quadro da transição, com
     * o trilho ainda correndo, e a medida seguinte parte de um número em
     * movimento (-391 contra -17). Trocar por um alvo absoluto em passos de
     * slide também não fecha: a sonda mostrou slide de 464px num viewport de
     * 448px, então o Embla não desloca um "passo" inteiro por snap — o clique
     * andou 338px, e a conta esperava 464.
     *
     * Qual slide está à vista não depende de nenhuma dessas suposições: não
     * depende do alinhamento do Embla, nem do respiro de 16px entre slides,
     * nem da cauda da animação. E é literalmente o que a story afirma.
     */
    const slideEmFoco = () => {
      const v = viewport.getBoundingClientRect();
      let melhor = 0;
      let maior = -Infinity;
      slides().forEach((slide, i) => {
        const r = slide.getBoundingClientRect();
        const visivel = eixo === "left"
          ? Math.min(r.right, v.right) - Math.max(r.left, v.left)
          : Math.min(r.bottom, v.bottom) - Math.max(r.top, v.top);
        if (visivel > maior) { maior = visivel; melhor = i; }
      });
      return melhor;
    };

    const emSlide = async (i: number) =>
      waitFor(async () => { await expect(slideEmFoco()).toBe(i); });

    /**
     * Volta ao primeiro slide clicando ENQUANTO a seta de voltar estiver viva.
     * Número fixo de cliques quebraria no replay do painel Interactions, que
     * roda no mesmo DOM: a segunda rodada partiria de onde a primeira parou.
     */
    const voltarAoInicio = async () => {
      for (let volta = 0; volta < slides().length; volta++) {
        const botao = anterior();
        if (botao.disabled) break;
        await userEvent.click(botao);
      }
      await emSlide(0);
    };

    // Precondição do conjunto: no replay o carrossel chega aqui onde a rodada
    // anterior parou.
    await voltarAoInicio();

    await step("A região se anuncia como carrossel e tem nome próprio", async () => {
      // Sem nome acessível a região não vira marco de navegação: o leitor de
      // tela anuncia "carrossel" sem dizer de quê.
      await expect(regiao).toHaveAttribute("aria-roledescription", "carousel");
      await expect(regiao).toHaveAccessibleName("Galeria de exemplos");
    });

    await step("Cada slide é um grupo anunciável", async () => {
      const slides = canvas.getAllByRole("group");
      // Total lido do conjunto renderizado, nunca escrito à mão.
      await expect(slides.length).toBe(5);
      for (const slide of slides) {
        await expect(slide).toHaveAttribute("aria-roledescription", "slide");
      }
    });

    await step("No primeiro slide só a seta de avanço leva a algum lugar", async () => {
      // A precondição já foi estabelecida ao medir `base`: no replay o
      // carrossel pode chegar aqui no meio, e `voltarAoInicio` o traz de volta.
      await waitFor(async () => {
        await expect(anterior()).toBeDisabled();
      });
      await expect(proximo()).toBeEnabled();
    });

    await step("Clicar em avançar leva ao segundo slide e acorda a seta de voltar", async () => {
      await userEvent.click(proximo());
      await emSlide(1);
      await expect(anterior()).toBeEnabled();
    });

    await step("A seta do teclado avança com o foco dentro do carrossel", async () => {
      // O caminho que um carrossel só-arrasto não tem: WCAG 2.1.1 exige
      // equivalente de teclado para toda navegação. O `onKeyDownCapture` mora
      // na região, então basta o foco estar dentro dela.
      proximo().focus();
      await expect(proximo()).toHaveFocus();
      await userEvent.keyboard(eixo === "top" ? "{ArrowDown}" : "{ArrowRight}");
      await emSlide(2);
    });

    await step("E a story termina no primeiro slide, como na captura", async () => {
      // `visual.item1` reivindica o estado INICIAL, e é o quadro final que o
      // Chromatic fotografa e o axe varre.
      await voltarAoInicio();
      await waitFor(async () => {
        await expect(anterior()).toBeDisabled();
      });
    });
  },
};
