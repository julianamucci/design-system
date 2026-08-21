/**
 * Transforms do painel Code do Carousel.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 */
import { attrs, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type CarouselArgs = {
  orientation: 'horizontal' | 'vertical';
};

const IMPORT = `import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'`;

const SLIDES = `const slides = [1, 2, 3, 4, 5]`;

/**
 * A largura máxima faz parte da lição: o carrossel recorta o que passa do
 * contêiner, e sem largura definida não há o que recortar.
 */
const LARGURA_SM = 'nds-w-sm';

/**
 * Miolo demonstrativo de um slide, já indentado para dentro do `CarouselItem`.
 * O conteúdo é livre — o que o componente pede é só o item em volta.
 */
function miolo(vertical: boolean, recuo = 6): string {
  const forma = vertical ? 'nds-h-full' : 'nds-aspect-16-9';
  const p = ' '.repeat(recuo);
  return `${p}<div class="nds-cluster ${forma} nds-bg-muted-soft nds-rounded-lg" data-justify="center">
${p}  <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">Slide {{ n }}</span>
${p}</div>`;
}

/** Corpo comum: a raiz nomeada, o trilho, um item por slide e as duas setas. */
function carrossel(opcoes: {
  raiz?: string;
  trilho?: string;
  item?: string;
  vertical?: boolean;
  rotulo: string;
  miolo?: string;
  laco?: string;
}): string {
  const {
    raiz = '',
    trilho = '',
    item = '',
    vertical = false,
    rotulo,
    laco = 'v-for="n in slides" :key="n"',
  } = opcoes;
  const largura = vertical ? 'nds-w-xs' : LARGURA_SM;
  return `<Carousel${attrs(raiz, `class="${largura}"`, `aria-label="${rotulo}"`)}>
  <CarouselContent${attrs(trilho)}>
    <CarouselItem ${attrs(laco, item).trim()}>
${opcoes.miolo ?? miolo(vertical)}
    </CarouselItem>
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`;
}

/**
 * Forma canônica: região nomeada, trilho, um item por slide e as duas setas.
 * O eixo acompanha o control de orientação.
 *
 * No eixo vertical o trilho precisa de altura DEFINIDA: sem ela a base do slide
 * não tem contra o que resolver, e o carrossel cresce em vez de recortar. A
 * altura vem de uma classe de proporção, nunca de `style`.
 */
export const carouselSource: SourceTransform<CarouselArgs> = (_gerado, ctx) => {
  const vertical = ctx?.args?.orientation === 'vertical';
  return vueSnippet(
    `${IMPORT}\n\n${SLIDES}`,
    carrossel({
      raiz: vertical ? 'orientation="vertical"' : '',
      trilho: vertical ? 'class="nds-aspect-4-3"' : '',
      vertical,
      rotulo: 'Galeria de exemplos',
    }),
  );
};

/** Variante horizontal: o eixo padrão, com as setas nas laterais. */
export function carouselHorizontalSource(): string {
  return vueSnippet(
    `${IMPORT}\n\n${SLIDES}`,
    carrossel({ rotulo: 'Slides na horizontal' }),
  );
}

/** Variante vertical: o eixo troca, e com ele o par de setas e o de teclas. */
export function carouselVerticalSource(): string {
  return vueSnippet(
    `${IMPORT}\n\n${SLIDES}`,
    carrossel({
      raiz: 'orientation="vertical"',
      trilho: 'class="nds-aspect-4-3"',
      vertical: true,
      rotulo: 'Slides na vertical',
    }),
  );
}

/**
 * Estado de entrada: o índice inicial é opção do motor, e a seta de voltar
 * desabilita sozinha — o componente calcula os extremos.
 */
export function carouselPrimeiroSlideSource(): string {
  return vueSnippet(
    `${IMPORT}\n\n${SLIDES}\nconst opts = { startIndex: 0 }`,
    carrossel({ raiz: ':opts="opts"', rotulo: 'Slides no primeiro item' }),
  );
}

/** Estado de fim de fila: mesmo mecanismo, o extremo oposto. */
export function carouselUltimoSlideSource(): string {
  return vueSnippet(
    `${IMPORT}\n\n${SLIDES}\nconst opts = { startIndex: slides.length - 1 }`,
    carrossel({ raiz: ':opts="opts"', rotulo: 'Slides no último item' }),
  );
}

/** Um item por vez: nenhuma base própria no item, o slide toma o viewport. */
export function carouselItemUnicoSource(): string {
  return vueSnippet(
    `${IMPORT}\n\n${SLIDES}`,
    carrossel({ rotulo: 'Um item por vez' }),
  );
}

/**
 * Conjunto longo de slides: a base de largura mora no ITEM, e é responsiva — um
 * slide por tela no estreito, dois no médio, três no grande.
 */
export function carouselMultiResponsivoSource(): string {
  return vueSnippet(
    `${IMPORT}\n\nconst slides = [1, 2, 3, 4, 5, 6]`,
    `<Carousel class="nds-w-lg" aria-label="Conjunto longo de slides">
  <CarouselContent>
    <CarouselItem v-for="n in slides" :key="n" class="nds-md-basis-half nds-lg-basis-third">
      <div class="nds-cluster nds-aspect-16-9 nds-bg-muted-soft nds-rounded-lg" data-justify="center">
        <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">Slide {{ n }}</span>
      </div>
    </CarouselItem>
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`,
  );
}

/**
 * Avanço automático: vem de um plugin do motor, não de uma prop do componente.
 * `stopOnInteraction` é o que devolve o controle a quem tocou no carrossel.
 */
export function carouselAutoplaySource(): string {
  return vueSnippet(
    `${IMPORT}
import AutoplayPlugin from 'embla-carousel-autoplay'

${SLIDES}
const plugins = [AutoplayPlugin({ delay: 4000, stopOnInteraction: true })]`,
    carrossel({ raiz: ':plugins="plugins"', rotulo: 'Destaques' }),
  );
}

/**
 * Gesto de arrastar: não há prop a ligar — o motor já escuta o ponteiro. O que
 * o exemplo mostra é a forma canônica, e é isso que o leitor precisa saber.
 */
export function carouselArrastarSource(): string {
  return vueSnippet(
    `${IMPORT}\n\nconst slides = [1, 2, 3, 4]`,
    carrossel({ rotulo: 'Galeria com gesto de arrastar' }),
  );
}

/**
 * Galeria de conteúdo visual: cada slide é uma superfície com o rótulo ancorado
 * na base. O conteúdo do item é livre; o componente só pede o item em volta.
 */
export function carouselGaleriaSource(): string {
  return vueSnippet(
    `${IMPORT}

const slides = [
  'Trilha ao amanhecer',
  'Lago entre montanhas',
  'Campo ao entardecer',
]`,
    `<Carousel class="${LARGURA_SM}" aria-label="Galeria de fotos do produto">
  <CarouselContent>
    <CarouselItem v-for="(rotulo, i) in slides" :key="i">
      <div class="nds-cluster nds-aspect-16-9 nds-p-4 nds-bg-muted-soft nds-rounded-lg" data-align="end" data-justify="start">
        <span class="nds-text-body nds-font-semibold nds-text-foreground">{{ rotulo }}</span>
      </div>
    </CarouselItem>
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`,
  );
}

/**
 * Paginação por pontos: ela se monta sobre a instância que o componente entrega
 * em `init-api` — é de lá que saem o índice atual e o salto direto.
 *
 * O ponto é botão comum, e não aba: ele não comanda painel nenhum. O atual se
 * marca com `aria-current`, e o inativo NÃO carrega o atributo — a string
 * "false" ainda casaria com um seletor de presença.
 */
export function carouselComDotsSource(): string {
  return vueSnippet(
    `${IMPORT}
import { ref } from 'vue'
import type { CarouselApi } from '@/components/ui/carousel'

${SLIDES}
const api = ref<CarouselApi | null>(null)
const atual = ref(0)

function aoIniciar(payload: CarouselApi) {
  api.value = payload
  if (!payload) return
  atual.value = payload.selectedScrollSnap()
  payload.on('select', () => { atual.value = payload.selectedScrollSnap() })
}`,
    `<div class="nds-stack" data-spacing="md">
  <Carousel class="${LARGURA_SM}" aria-label="Galeria com dots" @init-api="aoIniciar">
    <CarouselContent>
      <CarouselItem v-for="n in slides" :key="n">
${miolo(false, 8)}
      </CarouselItem>
    </CarouselContent>
    <CarouselPrevious aria-label="Item anterior" />
    <CarouselNext aria-label="Próximo item" />
  </Carousel>

  <div class="nds-cluster" data-justify="center">
    <button
      v-for="(n, i) in slides"
      :key="i"
      type="button"
      class="nds-carousel-dot"
      :aria-current="atual === i ? 'true' : null"
      :aria-label="\`Ir para o slide \${i + 1} de \${slides.length}\`"
      @click="api?.scrollTo(i)"
    >
      <span class="nds-carousel-dot-label">Slide {{ i + 1 }}</span>
    </button>
  </div>
</div>`,
  );
}
