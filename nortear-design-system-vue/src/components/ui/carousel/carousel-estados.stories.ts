import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, waitFor } from 'storybook/test';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './index';

const meta = {
  title: 'UI/Carousel/States',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component: 'Estados de extremo do Carousel — sem loop, o botão anterior ou próximo fica automaticamente desabilitado.',
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Retângulos do viewport e dos slides — a geometria é a prova de qual slide está à mostra. */
function medidas(canvasElement: HTMLElement) {
  const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
  const slides = Array.from(
    canvasElement.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]'),
  );
  return { v: viewport.getBoundingClientRect(), s: slides.map((el) => el.getBoundingClientRect()) };
}

export const FirstSlide: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story: 'Estado de entrada: nada foi navegado ainda, então voltar não leva a lugar nenhum e a seta anterior nasce desabilitada.',
      },
    },
  },
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext },
    setup() { return { opts: { startIndex: 0 }, slides: [1, 2, 3, 4, 5] }; },
    template: `
      <Carousel :opts="opts" class="nds-w-full nds-max-w-sm" aria-label="Galeria no primeiro slide">
        <CarouselContent>
          <CarouselItem v-for="n in slides" :key="n">
            <div class="nds-cluster nds-aspect-video nds-bg-muted-soft nds-rounded-lg" data-justify="center">
              <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">Slide {{ n }}</span>
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious aria-label="Item anterior" />
        <CarouselNext aria-label="Próximo item" />
      </Carousel>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const anterior = canvas.getByRole('button', { name: /item anterior/i });
    const proximo = canvas.getByRole('button', { name: /próximo item/i });

    await step('No começo só a seta de avanço leva a algum lugar', async () => {
      // `canScrollNext` nasce falso e só vira verdadeiro no `init` do embla,
      // agendado com `setTimeout(…, 0)` — daí a espera na seta viva.
      await waitFor(() => expect(proximo).toBeEnabled());
      await expect(anterior).toBeDisabled();
    });

    await step('O extremo é visível, não só programático', async () => {
      // Duas instâncias do MESMO botão, lado a lado: comparar a seta apagada
      // com a seta viva prova o contraste do estado. Medir só a opacidade da
      // desabilitada passaria numa tela onde todas estivessem apagadas.
      //
      // O `waitFor` não é folga: `.nds-button` declara
      // `transition: … opacity var(--duration-fast)`, e a seta de avanço ACABOU
      // de sair do desabilitado quando o `init` chegou. Ler no primeiro quadro
      // pegaria o valor de partida — 0.5 contra 0.5 — e o teste reprovaria por
      // corrida, não por defeito.
      await waitFor(async () => {
        const apagada = Number(getComputedStyle(anterior).opacity);
        const viva = Number(getComputedStyle(proximo).opacity);
        await expect(apagada).toBeLessThan(viva);
      });
    });

    await step('É o primeiro slide que está à mostra', async () => {
      // A prova de que o extremo é real e não só um sinalizador do componente:
      // o primeiro slide cobre o viewport e o segundo ainda não entrou nele.
      const { v, s } = medidas(canvasElement);
      await expect(Math.abs(s[0].right - v.right)).toBeLessThan(2);
      await expect(s[1].left).toBeGreaterThan(v.right - 2);
    });
  },
};

export const LastSlide: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    docs: {
      description: {
        story: 'No fim da sequência sem repetição, avançar deixa de ser possível e a seta seguinte fica desabilitada.',
      },
    },
  },
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext },
    setup() { return { opts: { startIndex: 4 }, slides: [1, 2, 3, 4, 5] }; },
    template: `
      <Carousel :opts="opts" class="nds-w-full nds-max-w-sm" aria-label="Galeria no último slide">
        <CarouselContent>
          <CarouselItem v-for="n in slides" :key="n">
            <div class="nds-cluster nds-aspect-video nds-bg-muted-soft nds-rounded-lg" data-justify="center">
              <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">Slide {{ n }}</span>
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious aria-label="Item anterior" />
        <CarouselNext aria-label="Próximo item" />
      </Carousel>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const anterior = canvas.getByRole('button', { name: /item anterior/i });
    const proximo = canvas.getByRole('button', { name: /próximo item/i });

    await step('No fim a seta de avanço desabilita e a de voltar acorda', async () => {
      // O par importa: só "próximo desabilitado" também seria verdade num
      // carrossel de um slide só, onde nada nunca avançou.
      await waitFor(() => expect(anterior).toBeEnabled());
      await expect(proximo).toBeDisabled();
    });

    await step('O extremo é visível, não só programático', async () => {
      // Espelho da comparação do primeiro slide: agora a apagada é a outra.
      await waitFor(async () => {
        const apagada = Number(getComputedStyle(proximo).opacity);
        const viva = Number(getComputedStyle(anterior).opacity);
        await expect(apagada).toBeLessThan(viva);
      });
    });

    await step('É o último slide que está à mostra', async () => {
      // Não sobrou trilho à frente: o último slide cobre o viewport e o
      // penúltimo já saiu por completo pela esquerda.
      await waitFor(async () => {
        const { v, s } = medidas(canvasElement);
        const ultimo = s[s.length - 1];
        await expect(Math.abs(ultimo.right - v.right)).toBeLessThan(2);
        await expect(s[s.length - 2].right).toBeLessThan(v.left + 2);
      });
    });
  },
};
