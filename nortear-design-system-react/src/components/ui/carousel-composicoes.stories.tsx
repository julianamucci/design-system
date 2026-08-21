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
import { SlideCard, visivelNoViewport } from "./carousel.fixtures";
import {
  carouselComDotsSource,
  carouselGaleriaSource,
  carouselSource,
} from "./carousel.source";
import carouselTranslations from "@shared/content/carousel/translations.json";

/**
 * "Slide" é texto VISÍVEL dentro da pílula, então é conteúdo e não literal de
 * código: sai do mesmo `translations.json` que a docs page lê, onde a chave
 * existe nos três idiomas. A story é fixture e fica presa a pt-BR de propósito
 * — quem resolve o idioma de quem lê é a docs page, e uma play que dependesse
 * do seletor de idioma procuraria um nome diferente a cada rodada.
 */
const CONTEUDO = carouselTranslations["pt-BR"].demonstration.labels;
/** Nome acessível: posição E total. "Slide 2" sozinho não diz para onde leva. */
const nomeAcessivel = (posicao: number, total: number) =>
  `${CONTEUDO.goToSlide} ${posicao} ${CONTEUDO.of} ${total}`;
/** Texto visível da pílula — um PEDAÇO do nome acessível (WCAG 2.5.3). */
const rotuloVisivel = (posicao: number) => `${CONTEUDO.slide} ${posicao}`;

const meta = {
  title: "UI/Carousel/Compositions",
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
          "Composicoes do Carousel com outros componentes: dots customizados via CarouselApi e galeria de imagens em Card.",
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const TOTAL_SLIDES = 5;

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
    <div className="nds-stack nds-w-md" data-spacing="sm">
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

      {/* Botões comuns, não abas: a paginação não controla painéis, e o
          conteúdo compartilhado descreve exatamente isto — `aria-label` com
          posição e total, `aria-current` no atual. O inativo NÃO carrega o
          atributo: um seletor de presença casaria com a string "false".

          Todo o desenho está em `.nds-carousel-dot`: o atual vira pílula com o
          rótulo à vista, os demais continuam pontos, e o alvo tem 24px de piso
          nos dois estados — um botão do tamanho do ponto reprova no
          `target-size` (WCAG 2.5.8). A forma sai do próprio `aria-current`,
          então o que o leitor anuncia e o que se vê não podem divergir.

          O rótulo mora em TODOS os controles, não só no atual: é o que deixa a
          pílula abrir e fechar por recorte em vez de o texto piscar. */}
      <div className="nds-cluster" data-justify="center" data-spacing="sm">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            className="nds-carousel-dot"
            aria-current={i === current ? "true" : undefined}
            aria-label={nomeAcessivel(i + 1, count)}
            onClick={() => api?.scrollTo(i)}
          >
            <span className="nds-carousel-dot-label">{rotuloVisivel(i + 1)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export const WithDots: Story = {
  parameters: {
    covers: ["functional.item8", "accessibility.item6", "visual.item5"],
    docs: {
      // A paginação se monta sobre a instância entregue em `setApi` e precisa
      // de estado: o exemplo é um componente inteiro, não marcação solta.
      source: { transform: carouselComDotsSource },
      description: {
        story:
          "A paginação traz posição e total no nome — \"2\" sozinho não diz para onde leva — e o slide atual ocupa a própria posição da fileira como pílula rotulada, não só como ponto de outra cor.",
      },
    },
  },
  render: () => <ComDotsCarousel />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
    const dot = (posicao: number) =>
      canvas.getByRole("button", { name: nomeAcessivel(posicao, TOTAL_SLIDES) });
    /**
     * O rótulo é o único filho do controle — a marca do ponto é `::before`, e
     * pseudo-elemento não entra em `firstElementChild`. Buscar por classe seria
     * asserir o nome dela; o que interessa aqui é a CAIXA que ela produz.
     */
    const rotulo = (el: Element) => el.firstElementChild as HTMLElement;
    const largura = (el: Element) => el.getBoundingClientRect().width;

    /**
     * Par idempotente: só clica quando o dot ainda não é o atual. O replay do
     * painel Interactions roda no MESMO DOM, então um clique cego partiria do
     * estado que a rodada anterior deixou.
     */
    const irPara = async (posicao: number) => {
      if (dot(posicao).getAttribute("aria-current") !== "true") await userEvent.click(dot(posicao));
      await waitFor(async () => {
        await expect(dot(posicao)).toHaveAttribute("aria-current", "true");
      }, { timeout: 4000 });
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
      }, { timeout: 4000 });
      await irPara(1);
      await expect(dot(2).hasAttribute("aria-current")).toBe(false);
    });

    await step("O slide atual vira pílula rotulada na própria posição da fileira", async () => {
      // Este é o padrão novo: a fileira não é de N peças iguais. Com o 2º slide
      // atual, ela é `• [Slide 2] • • •` — e a asserção mede exatamente isso,
      // na posição 2, sem nunca citar nome de classe.
      await irPara(2);

      // `waitFor` porque a mudança de forma é ANIMADA: medida no primeiro
      // quadro, a pílula ainda está fechada e o ponto anterior ainda aberto.
      await waitFor(async () => {
        await expect(largura(rotulo(dot(2)))).toBeGreaterThan(0);
        await expect(largura(rotulo(dot(1)))).toBeLessThan(1);
      }, { timeout: 4000 });

      // Rótulo visível certo, e é um pedaço do nome acessível (WCAG 2.5.3).
      await expect(rotulo(dot(2))).toHaveTextContent(rotuloVisivel(2));
      await expect(nomeAcessivel(2, TOTAL_SLIDES).toLowerCase()).toContain(
        rotuloVisivel(2).toLowerCase(),
      );

      // A forma mudou, não só a cor: a pílula é mais larga que o ponto vizinho.
      await expect(largura(dot(2))).toBeGreaterThan(largura(dot(3)));

      // E os DEMAIS continuam pontos: nenhum outro rótulo à vista, e um único
      // `aria-current` na fileira inteira.
      const demais = Array.from({ length: TOTAL_SLIDES }, (_, k) => k + 1).filter((p) => p !== 2);
      for (const posicao of demais) {
        await expect(largura(rotulo(dot(posicao)))).toBeLessThan(1);
        await expect(dot(posicao).hasAttribute("aria-current")).toBe(false);
      }
    });

    await step("O alvo de cada controle da paginação continua com 24px de piso", async () => {
      // Medido na densidade padrão do preview. O ponto tem marca de 8px e a
      // pílula tem texto de 12px: sem o piso, os dois ficariam abaixo dos 24px
      // que a WCAG 2.5.8 cobra — foi o defeito que criou `.nds-carousel-dot`.
      for (let posicao = 1; posicao <= TOTAL_SLIDES; posicao++) {
        const caixa = dot(posicao).getBoundingClientRect();
        await expect(caixa.width).toBeGreaterThanOrEqual(24);
        await expect(caixa.height).toBeGreaterThanOrEqual(24);
      }
    });

    await step("Clicar num dot salta direto para aquele slide", async () => {
      const slides = canvas.getAllByRole("group");
      await irPara(3);
      // Salto, não passo: a prova é o slide alvo entrar no enquadramento.
      await waitFor(async () => {
        await expect(visivelNoViewport(slides[2], viewport)).toBe(true);
      }, { timeout: 4000 });
      await expect(visivelNoViewport(slides[0], viewport)).toBe(false);
      await expect(dot(1).hasAttribute("aria-current")).toBe(false);
    });

    await step("E a story termina no começo, como na captura", async () => {
      const slides = canvas.getAllByRole("group");
      await irPara(1);
      await waitFor(async () => {
        await expect(visivelNoViewport(slides[0], viewport)).toBe(true);
      }, { timeout: 4000 });
      await expect(dot(3).hasAttribute("aria-current")).toBe(false);
    });
  },
};

export const Gallery: Story = {
  parameters: {
    docs: {
      // Aqui a imagem É o conteúdo do slide: cada uma com o seu texto
      // alternativo, coisa que o miolo genérico do meta não mostraria.
      source: { transform: carouselGaleriaSource },
      description: {
        story: "Fotos em Card: cada imagem carrega alt próprio, não um rótulo genérico repetido.",
      },
    },
  },
  render: () => (
    <Carousel className="nds-w-md" aria-label="Galeria de fotos do produto">
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
