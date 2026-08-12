import type { Meta, StoryObj } from '@storybook/html-vite';
import { createCarousel } from './carousel';
import { createCard, createCardContent } from './card';
import { within, expect, userEvent, waitFor } from 'storybook/test';

// ─── Slide helpers ────────────────────────────────────────────────────────────

function buildSlide(label: string): HTMLElement {
  const card = createCard({ className: 'nds-w-full nds-cluster nds-aspect-16-9 nds-bg-muted-soft' });
  card.dataset.align = 'center';
  card.dataset.justify = 'center';
  const content = createCardContent({ className: 'nds-cluster' });
  content.dataset.align = 'center';
  content.dataset.justify = 'center';
  const span = document.createElement('span');
  span.className = 'nds-text-h2 nds-font-semibold nds-text-foreground';
  span.textContent = label;
  content.appendChild(span);
  card.appendChild(content);
  return card;
}

function buildSlides(count: number, prefix = 'Slide'): HTMLElement[] {
  return Array.from({ length: count }, (_, i) => buildSlide(`${prefix} ${i + 1}`));
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['display'],
  title: 'UI/Carousel/Settings',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Configuracoes do Carousel — um item por vez (padrão), conjuntos longos e avanço automático com parada na primeira interação.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Um item por vez ──────────────────────────────────────────────────────────

export const Single: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
    wrap.appendChild(createCarousel({ items: buildSlides(4), label: 'Um item por vez' }));
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const recorte = canvasElement.querySelector<HTMLElement>('.nds-carousel-overflow')!;

    await step('O slide ocupa a largura inteira do recorte', async () => {
      const slide = canvas.getAllByRole('group')[0];
      const proporcao = slide.getBoundingClientRect().width / recorte.clientWidth;
      await expect(proporcao).toBeCloseTo(1, 1);
    });

    await step('Há mais slides do que cabem, e a seta de avanço está viva', async () => {
      await expect(canvas.getAllByRole('group').length).toBeGreaterThan(1);
      await expect(canvas.getByRole('button', { name: 'Próximo item' })).toBeEnabled();
    });
  },
};

// ─── Conjunto longo ───────────────────────────────────────────────────────────

export const MultiResponsive: Story = {
  parameters: {
    covers: ['visual.item3'],
    // A factory desliza um slide por vez: o deslocamento é `translate` de 100%
    // do track, que não tem como resolver uma base fracionária no slide. Fazer
    // `basis-1/2` valer aqui exigiria trocar o deslocamento por deslocamento
    // medido (offset do slide) com trava no fim do trilho — mudança de motor,
    // não de story. Enquanto isso não for decidido, esta stack não reivindica o
    // item: declarar cobertura que não existe é pior do que não declarar.
    coversNotApplicable: {
      'functional.item6': 'a factory desliza um slide por vez e não expõe base fracionária no slide',
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-lg';
    wrap.appendChild(createCarousel({ items: buildSlides(6), label: 'Conjunto longo de slides' }));
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Todos os slides continuam anunciáveis com posição e total', async () => {
      const slides = canvas.getAllByRole('group');
      const total = slides.length;
      await expect(total).toBe(6);
      for (const [i, slide] of slides.entries()) {
        await expect(slide).toHaveAccessibleName(`Slide ${i + 1} de ${total}`);
      }
    });

    await step('O conjunto longo não muda o extremo de entrada', async () => {
      await expect(canvas.getByRole('button', { name: 'Item anterior' })).toBeDisabled();
      await expect(canvas.getByRole('button', { name: 'Próximo item' })).toBeEnabled();
    });
  },
};

// ─── Autoplay com parada na interação ─────────────────────────────────────────

export const Autoplay: Story = {
  parameters: { covers: ['functional.item7', 'visual.item3'] },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
    wrap.appendChild(
      createCarousel({
        items: buildSlides(4, 'Destaque'),
        autoplay: true,
        // Intervalo curto para o teste não esperar por três segundos; em uso
        // real a recomendação do conteúdo compartilhado é 3–6s.
        autoplayInterval: 400,
        label: 'Destaques',
      }),
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-track"]')!;
    const recorte = canvasElement.querySelector<HTMLElement>('.nds-carousel-overflow')!;
    const posicao = () => track.getBoundingClientRect().left;

    await step('O carrossel avança sozinho', async () => {
      const antes = posicao();
      await waitFor(() => expect(posicao()).toBeLessThan(antes), { timeout: 4000 });
    });

    await step('A primeira interação para o relógio de vez', async () => {
      // `stopOnInteraction`: quem tomou o controle não deve ser atropelado
      // alguns segundos depois. Antes desta rodada a factory REINICIAVA o
      // temporizador na interação, o oposto do que o conteúdo compartilhado
      // documenta.
      //
      // O gesto é um toque na ÁREA DOS SLIDES, não um clique na seta: a
      // posição aqui é conduzida por um temporizador, e quando o relógio para
      // num extremo a seta nasce desabilitada — o `userEvent` recusa o clique e
      // o teste falha por corrida, não por defeito. É também o gesto que as
      // outras stacks reconhecem, onde o plugin assina o `pointerDown` da área
      // dos slides e nunca vê o clique das setas.
      await userEvent.click(recorte);

      // A medida de referência só vale depois que o deslize assenta: parar o
      // relógio não cancela o quadro que já estava em curso.
      //
      // `NaN` na semente não é descuido, é o que obriga a espera a comparar
      // duas amostras SEPARADAS NO TEMPO. Semeando com a posição atual, a
      // primeira verificação — que roda no mesmo quadro — comparava o valor
      // consigo mesmo, dava "assentou" e a espera saía sem provar nada;
      // o deslize seguia por mais 214px depois disso.
      let anterior = NaN;
      await waitFor(async () => {
        const agora = posicao();
        const assentou = Math.abs(agora - anterior) < 0.5;
        anterior = agora;
        await expect(assentou).toBe(true);
      }, { timeout: 3000 });
      const parado = anterior;

      // Dois intervalos inteiros sem sair do lugar. É também o que deixa a foto
      // do Chromatic e a varredura do axe caírem num componente imóvel — story
      // com temporizador vivo fotografa um slide diferente a cada rodada.
      await new Promise((resolve) => setTimeout(resolve, 900));
      await expect(Math.abs(posicao() - parado)).toBeLessThan(0.5);
    });
  },
};
