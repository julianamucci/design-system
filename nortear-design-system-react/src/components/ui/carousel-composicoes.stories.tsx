import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { userEvent, waitFor, within, expect } from "storybook/test";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "./carousel";
import { Card, CardContent } from "./card";

const meta = {
  title: "UI/Carousel/Compositions",
  tags: ["display"],
  component: Carousel,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes do Carousel com outros componentes: dots customizados via CarouselApi e galeria de imagens em Card.",
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const TOTAL_SLIDES = 5;

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

function ComDotsCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    // Embla API imperativa — ver CarouselDocs.tsx pra justificativa.
    /* eslint-disable react-hooks/set-state-in-effect */
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    /* eslint-enable react-hooks/set-state-in-effect */
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <div className="nds-stack nds-w-full nds-max-w-md" data-spacing="sm">
      <Carousel setApi={setApi} className="nds-w-full" aria-label="Galeria com dots">
        <CarouselContent>
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <CarouselItem key={i}>
              <SlideCard label={`Slide ${i + 1}`} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious aria-label="Item anterior" />
        <CarouselNext aria-label="Próximo item" />
      </Carousel>

      {/* Botões comuns, não abas: os dots não controlam painéis, e o conteúdo
          compartilhado descreve exatamente isto — `aria-label` com posição e
          total, `aria-current` no ativo. O inativo NÃO carrega o atributo: um
          seletor de presença casaria com a string "false".

          Todo o desenho está em `.nds-carousel-dot`: alvo de 24px com marca de
          8px no `::before`, porque um botão do tamanho do ponto reprova no
          `target-size` (WCAG 2.5.8). A cor do ativo sai do próprio
          `aria-current`, então o que o leitor anuncia e o que se vê não podem
          divergir. */}
      <div className="nds-cluster" data-justify="center" data-spacing="sm">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            className="nds-carousel-dot"
            aria-current={i === current ? "true" : undefined}
            aria-label={`Ir para o slide ${i + 1} de ${count}`}
            onClick={() => api?.scrollTo(i)}
          />
        ))}
      </div>
    </div>
  );
}

export const WithDots: Story = {
  parameters: {
    covers: ["visual.item5"],
    docs: {
      description: {
        story:
          "Os dots trazem posição e total no nome — \"2\" sozinho não diz para onde leva — e o ativo se distingue por cor, não só por posição.",
      },
    },
  },
  render: () => <ComDotsCarousel />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
    const dot = (posicao: number) =>
      canvas.getByRole("button", { name: `Ir para o slide ${posicao} de ${TOTAL_SLIDES}` });

    /**
     * Par idempotente: só clica quando o dot ainda não é o atual. O replay do
     * painel Interactions roda no MESMO DOM, então um clique cego partiria do
     * estado que a rodada anterior deixou.
     */
    const irPara = async (posicao: number) => {
      if (dot(posicao).getAttribute("aria-current") !== "true") await userEvent.click(dot(posicao));
      await waitFor(async () => {
        await expect(dot(posicao)).toHaveAttribute("aria-current", "true");
      });
    };

    await step("Há um dot por slide, e o primeiro é o atual", async () => {
      // Total contado a partir dos slides renderizados: um número escrito à mão
      // continuaria batendo depois de alguém tirar um slide da lista.
      const slides = canvas.getAllByRole("group");
      await expect(slides.length).toBe(TOTAL_SLIDES);
      // Os dots só existem depois que o Embla entrega a lista de snaps.
      await waitFor(async () => {
        await expect(canvas.getAllByRole("button", { name: /ir para o slide/i })).toHaveLength(
          slides.length,
        );
      });
      await irPara(1);
      await expect(dot(2).hasAttribute("aria-current")).toBe(false);
    });

    await step("O dot atual se distingue dos outros por mais do que a posição", async () => {
      // Comparação entre dois dots, e não medida absoluta de um só: "tem fundo"
      // é verdade para os cinco. O que prova o destaque é o atual ter um fundo
      // DIFERENTE do inativo.
      //
      // A leitura é no `::before`: o botão em si é só o alvo de 24px e é
      // transparente nos dois estados — medir o elemento daria a MESMA cor para
      // ativo e inativo, e a asserção reprovaria um componente correto.
      const cor = (el: Element) => getComputedStyle(el, "::before").backgroundColor;
      await expect(cor(dot(1))).not.toBe(cor(dot(2)));
    });

    await step("Clicar num dot salta direto para aquele slide", async () => {
      const slides = canvas.getAllByRole("group");
      await irPara(3);
      // Salto, não passo: a prova é o slide alvo entrar no enquadramento.
      await waitFor(async () => {
        await expect(visivelNoViewport(slides[2], viewport)).toBe(true);
      });
      await expect(visivelNoViewport(slides[0], viewport)).toBe(false);
      await expect(dot(1).hasAttribute("aria-current")).toBe(false);
    });

    await step("E a story termina no começo, como na captura", async () => {
      const slides = canvas.getAllByRole("group");
      await irPara(1);
      await waitFor(async () => {
        await expect(visivelNoViewport(slides[0], viewport)).toBe(true);
      });
      await expect(dot(3).hasAttribute("aria-current")).toBe(false);
    });
  },
};

export const Gallery: Story = {
  parameters: {
    docs: {
      description: {
        story: "Fotos em Card: cada imagem carrega alt próprio, não um rótulo genérico repetido.",
      },
    },
  },
  render: () => (
    <Carousel className="nds-w-full nds-max-w-md" aria-label="Galeria de fotos do produto">
      <CarouselContent>
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <CarouselItem key={i}>
            <Card>
              <img
                src={`https://picsum.photos/seed/carousel-${i + 1}/640/360`}
                alt={`Imagem de exemplo ${i + 1}`}
                className="nds-block nds-aspect-16-9"
                // `object-fit` é mecânica de recorte, não valor de design: não
                // há classe .nds-* para ele e nenhum tema o altera.
                style={{ objectFit: "cover" }}
              />
              <CardContent>
                <p className="nds-text-body nds-font-medium">Imagem {i + 1}</p>
                <p className="nds-text-caption nds-text-muted-foreground">
                  Exemplo de conteúdo fotográfico em slide.
                </p>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label="Item anterior" />
      <CarouselNext aria-label="Próximo item" />
    </Carousel>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Toda imagem da galeria tem alt próprio", async () => {
      // Uma por slide, e cada uma com o seu texto: alt repetido seria o mesmo
      // que alt vazio para quem navega de imagem em imagem.
      const slides = canvas.getAllByRole("group");
      const imgs = canvas.getAllByRole("img");
      await expect(imgs.length).toBe(slides.length);
      for (const [i, img] of imgs.entries()) {
        await expect(img).toHaveAttribute("alt", `Imagem de exemplo ${i + 1}`);
      }
    });

    await step("A região da galeria se anuncia com nome próprio", async () => {
      const regiao = canvas.getByRole("region");
      await expect(regiao).toHaveAttribute("aria-roledescription", "carousel");
      await expect(regiao).toHaveAccessibleName("Galeria de fotos do produto");
    });
  },
};
