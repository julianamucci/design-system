/**
 * Transforms do painel Code do Carousel.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * Aqui está o pior caso do defeito que motivou o arquivo: o painel imprimia
 * `<SlideCard label="Slide 1" />`, uma peça que existe só no módulo de andaime
 * das stories. Quem copiava recebia um erro de símbolo indefinido. O miolo do
 * slide é justamente o que quem consome escreve, então ele vai por extenso.
 */
import {
  attrsMultilinha,
  indentar,
  jsxSnippet,
  propOption,
  type SourceTransform,
} from '@/lib/story-source';

export type CarouselArgs = {
  orientation: 'horizontal' | 'vertical';
};

const ORIENTACOES = ['horizontal', 'vertical'] as const;

const IMPORT = `import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";`;

const SLIDES = 'const slides = [1, 2, 3, 4, 5];';

/**
 * A largura máxima faz parte da lição: o carrossel recorta o que passa do
 * contêiner, e sem largura definida não há o que recortar.
 */
const LARGURA_MD = 'nds-w-md';

/**
 * Miolo demonstrativo de um slide, já indentado para dentro do `CarouselItem`.
 *
 * O conteúdo é livre — o que o componente exige é só o item em volta. A única
 * dimensão que muda com o eixo é a altura: na horizontal ela vem da proporção
 * 16:9; na vertical o slide já tem altura própria (a base `flex: 0 0 100%`
 * resolvida contra o trilho) e o cartão só precisa preenchê-la. Nos dois casos
 * a medida vem de classe, nunca de `style`.
 */
function miolo(vertical: boolean): string {
  const forma = vertical ? 'nds-h-full' : 'nds-aspect-16-9';
  return `        <div className="${forma}">
          <div
            className="nds-cluster nds-h-full nds-bg-muted-soft nds-rounded-lg"
            data-align="center"
            data-justify="center"
          >
            <span className="nds-text-h3 nds-font-semibold nds-text-muted-foreground">
              Slide {numero}
            </span>
          </div>
        </div>`;
}

/** As duas setas, sempre nomeadas: o chevron sozinho não diz para onde leva. */
const SETAS = `  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />`;

/**
 * Forma canônica: região nomeada, trilho, um item por slide e as duas setas.
 * O eixo acompanha o control de orientação.
 *
 * O nome da região não é enfeite — sem ele o leitor de tela anuncia "carrossel"
 * sem dizer de quê, e a região deixa de ser um marco de navegação.
 */
export const carouselSource: SourceTransform<CarouselArgs> = (_gerado, ctx) => {
  const vertical = ctx?.args?.orientation === 'vertical';
  const raiz = attrsMultilinha([
    propOption('orientation', ctx?.args?.orientation, ORIENTACOES, 'horizontal'),
    `className="${vertical ? 'nds-w-xs' : LARGURA_MD}"`,
    'aria-label="Galeria de exemplos"',
  ]);
  // No eixo vertical o trilho precisa de altura DEFINIDA: sem ela a base
  // `flex: 0 0 100%` do slide não tem contra o que resolver, e o carrossel
  // cresce em vez de recortar. A altura vem de uma classe de proporção.
  const trilho = vertical ? ' className="nds-aspect-4-3"' : '';
  const item = vertical ? ' className="nds-basis-full"' : '';

  return jsxSnippet(
    `${IMPORT}\n\n${SLIDES}`,
    `<Carousel${raiz}>
  <CarouselContent${trilho}>
    {slides.map((numero) => (
      <CarouselItem key={numero}${item}>
${miolo(vertical)}
      </CarouselItem>
    ))}
  </CarouselContent>
${SETAS}
</Carousel>`,
  );
};

/**
 * Eixo vertical: o arquivo desliga os controls, então o `meta` não tem de onde
 * ler a orientação — e o eixo É o assunto desta story. Com ele trocam as setas
 * (que passam para cima e para baixo) e o par de teclas que navega.
 */
export function carouselVerticalSource(): string {
  return carouselSource(undefined, { args: { orientation: 'vertical' } });
}

/**
 * Um item por vez: a base de largura mora no ITEM, e `nds-basis-full` faz cada
 * slide ocupar o viewport inteiro.
 */
export function carouselItemUnicoSource(): string {
  return jsxSnippet(
    `${IMPORT}\n\nconst slides = [1, 2, 3];`,
    `<Carousel className="${LARGURA_MD}" aria-label="Um item por vez">
  <CarouselContent>
    {slides.map((numero) => (
      <CarouselItem key={numero} className="nds-basis-full">
${miolo(false)}
      </CarouselItem>
    ))}
  </CarouselContent>
${SETAS}
</Carousel>`,
  );
}

/**
 * Conjunto longo de slides: a base é responsiva e mora no item — um slide por tela
 * no estreito, dois no médio, três no largo. Nenhuma media query autoral.
 */
export function carouselVariosItensSource(): string {
  return jsxSnippet(
    `${IMPORT}\n\nconst slides = [1, 2, 3, 4, 5, 6];`,
    `<Carousel className="nds-w-lg" aria-label="Conjunto longo de slides">
  <CarouselContent>
    {slides.map((numero) => (
      <CarouselItem key={numero} className="nds-md-basis-half nds-lg-basis-third">
${miolo(false)}
      </CarouselItem>
    ))}
  </CarouselContent>
${SETAS}
</Carousel>`,
  );
}

/**
 * Avanço automático: vem de um plugin do motor, não de uma prop do componente.
 *
 * `stopOnInteraction` devolve o controle a quem tocou no carrossel, e a
 * repetição mantém as setas vivas nos dois extremos — juntos são o que a WCAG
 * 2.2.2 pede de qualquer conteúdo que se move sozinho.
 */
export function carouselAutoplaySource(): string {
  return jsxSnippet(
    `${IMPORT}
import Autoplay from "embla-carousel-autoplay";

${SLIDES}`,
    `<Carousel
  className="${LARGURA_MD}"
  aria-label="Destaques"
  opts={{ loop: true }}
  plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
>
  <CarouselContent>
    {slides.map((numero) => (
      <CarouselItem key={numero}>
${miolo(false)}
      </CarouselItem>
    ))}
  </CarouselContent>
${SETAS}
</Carousel>`,
  );
}

/**
 * Fim da fila: montar já no último slide é opção do motor (`startIndex`), e é o
 * componente que calcula os extremos — a seta de avanço desabilita sozinha, sem
 * nenhum estado autoral.
 */
export function carouselUltimoSlideSource(): string {
  return jsxSnippet(
    `${IMPORT}\n\nconst slides = [1, 2, 3];`,
    `<Carousel
  className="${LARGURA_MD}"
  aria-label="Slides no último item"
  opts={{ startIndex: slides.length - 1 }}
>
  <CarouselContent>
    {slides.map((numero) => (
      <CarouselItem key={numero}>
${miolo(false)}
      </CarouselItem>
    ))}
  </CarouselContent>
${SETAS}
</Carousel>`,
  );
}

/**
 * Galeria de fotos do produto: aqui a imagem É o conteúdo, então cada uma precisa do seu
 * próprio texto alternativo — repetir o mesmo em todas equivale a não ter
 * nenhum para quem navega de imagem em imagem. `object-fit` é mecânica de
 * recorte, não valor de design: não há classe `.nds-*` e nenhum tema o altera.
 */
export function carouselGaleriaSource(): string {
  return jsxSnippet(
    `${IMPORT}
import { Card, CardContent } from "@/components/ui/card";

const fotos = [
  { src: "/fotos/trilha-ao-amanhecer.jpg", alt: "Trilha de montanha ao amanhecer" },
  { src: "/fotos/lago-entre-montanhas.jpg", alt: "Lago cercado por montanhas nevadas" },
  { src: "/fotos/campo-ao-entardecer.jpg", alt: "Campo aberto com o sol se pondo" },
];`,
    `<Carousel className="${LARGURA_MD}" aria-label="Galeria de fotos do produto">
  <CarouselContent>
    {fotos.map((foto) => (
      <CarouselItem key={foto.src}>
        <Card>
          <img
            src={foto.src}
            alt={foto.alt}
            loading="lazy"
            decoding="async"
            className="nds-block nds-w-full nds-aspect-16-9"
            style={{ objectFit: "cover" }}
          />
          <CardContent>
            <p className="nds-text-body nds-font-medium">{foto.alt}</p>
          </CardContent>
        </Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious aria-label="Foto anterior" />
  <CarouselNext aria-label="Próxima foto" />
</Carousel>`,
  );
}

/**
 * Paginação por pontos: monta-se sobre a instância que o componente entrega em
 * `setApi` — é de lá que saem o índice atual e o salto direto. Como precisa de
 * estado, o exemplo é um componente, e não marcação solta.
 *
 * O ponto é botão comum, e não aba: ele não comanda painel nenhum. O nome traz
 * posição E total, porque "2" sozinho não diz para onde leva. E o atual se
 * marca com `aria-current`: o inativo NÃO carrega o atributo, já que a string
 * "false" ainda casaria com um seletor de presença — daí o espalhamento
 * condicional em vez de um ternário que escreveria o atributo sempre.
 *
 * O componente do snippet é declarado SEM `export`: quem cola decide o que
 * exporta do próprio arquivo, e `export function` dentro da string é lido pelo
 * auditor como export de verdade deste módulo — foi assim que `GaleriaComPaginacao`
 * virou achado de `export_sem_story` num símbolo que nunca existiu.
 */
export function carouselComDotsSource(): string {
  return jsxSnippet(
    `import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";

${SLIDES}`,
    `function GaleriaComPaginacao() {
  const [api, setApi] = useState<CarouselApi>();
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    if (!api) return;
    setAtual(api.selectedScrollSnap());
    const aoSelecionar = () => setAtual(api.selectedScrollSnap());
    api.on("select", aoSelecionar);
    return () => {
      api.off("select", aoSelecionar);
    };
  }, [api]);

  return (
    <div className="nds-stack ${LARGURA_MD}" data-spacing="sm">
      <Carousel setApi={setApi} className="nds-w-full" aria-label="Galeria com dots">
        <CarouselContent>
          {slides.map((numero) => (
            <CarouselItem key={numero}>
${indentar(miolo(false), '      ')}
            </CarouselItem>
          ))}
        </CarouselContent>
${indentar(SETAS, '      ')}
      </Carousel>

      <div className="nds-cluster" data-justify="center" data-spacing="sm">
        {slides.map((numero, i) => (
          <button
            key={numero}
            type="button"
            className="nds-carousel-dot"
            aria-label={\`Ir para o slide \${numero} de \${slides.length}\`}
            {...(i === atual ? { "aria-current": "true" as const } : {})}
            onClick={() => api?.scrollTo(i)}
          >
            <span className="nds-carousel-dot-label">Slide {numero}</span>
          </button>
        ))}
      </div>
    </div>
  );
}`,
  );
}
