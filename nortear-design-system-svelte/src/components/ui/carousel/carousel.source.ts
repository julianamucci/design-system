/**
 * Transforms do painel Code do Carousel.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type CarouselArgs = {
  orientation: 'horizontal' | 'vertical';
};

const IMPORT = `import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";`;

const SLIDES = `const slides = [1, 2, 3, 4, 5];`;

/**
 * A largura máxima faz parte da lição: o carrossel recorta o que passa do
 * contêiner, e sem largura definida não há o que recortar.
 */
const LARGURA_MD = 'nds-w-md';

/**
 * Miolo demonstrativo de um slide, já indentado para dentro do `CarouselItem`.
 * O conteúdo é livre — o que o componente pede é só o item em volta.
 */
function miolo(vertical: boolean): string {
  const externa = vertical ? 'nds-p-1 nds-h-full' : 'nds-p-1';
  const forma = vertical ? 'nds-h-full' : 'nds-aspect-square';
  return `          <div class="${externa}">
            <div
              class="nds-cluster ${forma} nds-rounded-md nds-bg-muted"
              data-align="center"
              data-justify="center"
            >
              {numero}
            </div>
          </div>`;
}

/**
 * Forma canônica: região nomeada, trilho, um item por slide e as duas setas.
 * O eixo acompanha o control de orientação.
 */
export function carouselSource(_gerado?: string, ctx?: { args?: Partial<CarouselArgs> }): string {
  const { orientation = 'horizontal' } = ctx?.args ?? {};
  const vertical = orientation === 'vertical';

  const raiz = attrs(
    vertical ? 'orientation="vertical"' : '',
    'aria-label="Galeria de exemplos"',
  );
  // No eixo vertical o trilho precisa de altura DEFINIDA: sem ela a base do
  // slide não tem contra o que resolver, e o carrossel cresce em vez de
  // recortar. A altura vem de uma classe de proporção, nunca de `style`.
  const trilho = vertical ? ' class="nds-aspect-4-3"' : '';

  return svelteSnippet(
    `${IMPORT}\n\n${SLIDES}`,
    `<div class="${vertical ? 'nds-w-xs' : LARGURA_MD}">
  <Carousel${raiz}>
    <CarouselContent${trilho}>
      {#each slides as numero (numero)}
        <CarouselItem aria-label="Slide {numero} de {slides.length}">
${miolo(vertical)}
        </CarouselItem>
      {/each}
    </CarouselContent>
    <CarouselPrevious aria-label="Item anterior" />
    <CarouselNext aria-label="Próximo item" />
  </Carousel>
</div>`,
  );
}

/** Variante vertical: o eixo troca, e com ele o par de setas e o de teclas. */
export function carouselVerticalSource(): string {
  return carouselSource(undefined, { args: { orientation: 'vertical' } });
}

/**
 * Estado de fim de fila: montar já no último slide é uma opção do motor, e a
 * seta de avanço desabilita sozinha — o componente calcula os extremos.
 */
export function carouselUltimoSlideSource(): string {
  return svelteSnippet(
    `${IMPORT}\n\n${SLIDES}`,
    `<div class="${LARGURA_MD}">
  <Carousel
    opts={{ startIndex: slides.length - 1 }}
    aria-label="Slides no último item"
  >
    <CarouselContent>
      {#each slides as numero (numero)}
        <CarouselItem aria-label="Slide {numero} de {slides.length}">
${miolo(false)}
        </CarouselItem>
      {/each}
    </CarouselContent>
    <CarouselPrevious aria-label="Item anterior" />
    <CarouselNext aria-label="Próximo item" />
  </Carousel>
</div>`,
  );
}

/**
 * Conjunto longo de slides: a base de largura mora no ITEM, e é responsiva — um
 * slide por tela no celular, dois no médio, três no grande.
 */
export function carouselVariosItensSource(): string {
  return svelteSnippet(
    `${IMPORT}

const slides = [1, 2, 3, 4, 5, 6];`,
    `<div class="nds-w-lg">
  <Carousel aria-label="Carrossel com múltiplos itens">
    <CarouselContent>
      {#each slides as numero (numero)}
        <CarouselItem
          class="nds-md-basis-half nds-lg-basis-third"
          aria-label="Slide {numero} de {slides.length}"
        >
${miolo(false)}
        </CarouselItem>
      {/each}
    </CarouselContent>
    <CarouselPrevious aria-label="Item anterior" />
    <CarouselNext aria-label="Próximo item" />
  </Carousel>
</div>`,
  );
}

/**
 * Avanço automático: vem de um plugin do motor, não de uma prop do componente.
 * `stopOnInteraction` é o que devolve o controle a quem tocou no carrossel.
 */
export function carouselAutoplaySource(): string {
  return svelteSnippet(
    `${IMPORT}
import Autoplay from "embla-carousel-autoplay";

${SLIDES}`,
    `<div class="${LARGURA_MD}">
  <Carousel
    opts={{ loop: true }}
    plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
    aria-label="Destaques"
  >
    <CarouselContent>
      {#each slides as numero (numero)}
        <CarouselItem aria-label="Slide {numero} de {slides.length}">
${miolo(false)}
        </CarouselItem>
      {/each}
    </CarouselContent>
    <CarouselPrevious aria-label="Item anterior" />
    <CarouselNext aria-label="Próximo item" />
  </Carousel>
</div>`,
  );
}

/**
 * Galeria de fotos do produto: aqui a imagem É o conteúdo, então cada uma precisa do seu
 * próprio texto alternativo — repetir o mesmo em todas equivale a não ter.
 */
export function carouselGaleriaSource(): string {
  return svelteSnippet(
    `${IMPORT}

const fotos = [
  { src: "/fotos/trilha-ao-amanhecer.jpg", alt: "Trilha de montanha ao amanhecer" },
  { src: "/fotos/lago-entre-montanhas.jpg", alt: "Lago cercado por montanhas nevadas" },
  { src: "/fotos/campo-ao-entardecer.jpg", alt: "Campo aberto com o sol se pondo atrás das nuvens" },
];`,
    `<div class="${LARGURA_MD}">
  <Carousel aria-label="Galeria de fotos do produto">
    <CarouselContent>
      {#each fotos as foto, i (foto.src)}
        <CarouselItem aria-label="Slide {i + 1} de {fotos.length}">
          <div class="nds-p-1">
            <img
              src={foto.src}
              alt={foto.alt}
              loading="lazy"
              decoding="async"
              class="nds-aspect-square nds-w-full nds-rounded-md nds-bg-muted"
              style="object-fit: cover"
            />
          </div>
        </CarouselItem>
      {/each}
    </CarouselContent>
    <CarouselPrevious aria-label="Foto anterior" />
    <CarouselNext aria-label="Próxima foto" />
  </Carousel>
</div>`,
  );
}

/**
 * Paginação por pontos: ela se monta sobre a instância que o componente expõe
 * em `setApi` — é de lá que saem o índice atual e o salto direto.
 *
 * O ponto é botão comum, e não aba: ele não comanda painel nenhum. O atual se
 * marca com `aria-current`, e o inativo NÃO carrega o atributo — a string
 * "false" ainda casaria com um seletor de presença.
 */
export function carouselComDotsSource(): string {
  return svelteSnippet(
    `${IMPORT}
import type { CarouselAPI } from "@/components/ui/carousel/context";

${SLIDES}

let api = $state<CarouselAPI | null>(null);
let atual = $state(0);

function registrarApi(instancia?: CarouselAPI) {
  api = instancia ?? null;
  if (!instancia) return;
  atual = instancia.selectedScrollSnap();
  instancia.on("select", () => (atual = instancia.selectedScrollSnap()));
}`,
    `<div class="${LARGURA_MD}">
  <Carousel setApi={registrarApi} aria-label="Galeria com dots">
    <CarouselContent>
      {#each slides as numero (numero)}
        <CarouselItem aria-label="Slide {numero} de {slides.length}">
${miolo(false)}
        </CarouselItem>
      {/each}
    </CarouselContent>
    <CarouselPrevious aria-label="Item anterior" />
    <CarouselNext aria-label="Próximo item" />
  </Carousel>

  <div class="nds-cluster nds-mt-4" data-align="center" data-justify="center" data-spacing="sm">
    {#each slides as numero, i (i)}
      <button
        type="button"
        class="nds-carousel-dot"
        aria-label="Ir para o slide {numero} de {slides.length}"
        aria-current={atual === i ? "true" : null}
        onclick={() => api?.scrollTo(i)}
      ><span class="nds-carousel-dot-label">Slide {numero}</span></button>
    {/each}
  </div>
</div>`,
  );
}
