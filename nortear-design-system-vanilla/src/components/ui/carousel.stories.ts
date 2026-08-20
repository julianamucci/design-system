import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createCarousel } from './carousel';
import { slidesDeExemplo } from './carousel.fixtures';
import { carouselSource } from './carousel.source';
import { createCarouselDocs } from '@/components/docs/CarouselDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Slide helpers ────────────────────────────────────────────────────────────


// ─── Meta ─────────────────────────────────────────────────────────────────────

type CarouselArgs = {
  slides: number;
  autoplay: boolean;
  autoplayInterval: number;
};

const meta: Meta<CarouselArgs> = {
  title: 'UI/Carousel',
  tags: ['autodocs', 'display'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(createCarouselDocs), source: { transform: carouselSource } },
  },
  argTypes: {
    slides: {
      control: { type: 'number', min: 2, max: 10 },
      description: 'Número de slides renderizados dentro do carrossel',
      table: { type: { summary: 'number' }, defaultValue: { summary: '5' } },
    },
    autoplay: {
      control: 'boolean',
      description: 'Ativa o avanço automático entre slides',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    autoplayInterval: {
      control: { type: 'number', min: 500, max: 10000, step: 500 },
      description: 'Intervalo em milissegundos entre avanços automáticos',
      table: { type: { summary: 'number' }, defaultValue: { summary: '3000' } },
    },
  },
  args: {
    slides: 5,
    autoplay: false,
    autoplayInterval: 3000,
  },
};

export default meta;
type Story = StoryObj<CarouselArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'visual.item1',
    ],
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-cap-md';
    wrap.appendChild(
      createCarousel({
        items: slidesDeExemplo(args.slides),
        autoplay: args.autoplay,
        autoplayInterval: args.autoplayInterval,
        label: 'Galeria de exemplos',
      }),
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const regiao = canvas.getByRole('region');
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-track"]')!;
    const recorte = canvasElement.querySelector<HTMLElement>('.nds-carousel-overflow')!;
    const anterior = () =>
      canvas.getByRole('button', { name: 'Item anterior' }) as HTMLButtonElement;
    const proximo = () =>
      canvas.getByRole('button', { name: 'Próximo item' }) as HTMLButtonElement;

    // O track é movido por `transform`, então `scrollLeft` fica em zero o tempo
    // todo: o que anda é a caixa. `deslocamento` é ABSOLUTO — quanto o track já
    // saiu do recorte — e não "andou mais do que antes", que é o erro fácil
    // aqui: a espera resolve no PRIMEIRO quadro em que a caixa passa do limiar,
    // com a transição ainda correndo, e a medida seguinte parte de um número em
    // movimento. Custou uma reprovação (-448 contra -166) para aparecer.
    // A leitura é RELATIVA ao repouso. O track tem margem negativa de -16px em
    // horizontal (o seletor de orientação no CSS compartilhado, ligado em 2026-08-19
    // para o primeiro slide encostar na borda como nas outras quatro), então a
    // distância entre recorte e track NUNCA é zero em repouso. Medir em absoluto
    // dava 16.7 onde a conta esperava 0.
    const repouso = recorte.getBoundingClientRect().left - track.getBoundingClientRect().left;
    const deslocamento = () =>
      recorte.getBoundingClientRect().left - track.getBoundingClientRect().left - repouso;

    // Coordenada de LAYOUT: `offsetLeft` não é afetado pelo `transform`
    // corrente, então o passo esperado não muda enquanto o deslize corre.
    const slides = () => canvas.getAllByRole('group') as HTMLElement[];
    const passo = () => slides()[1].offsetLeft - slides()[0].offsetLeft;

    /** Espera o carrossel ASSENTAR no slide `i`, não apenas sair do anterior. */
    const emSlide = async (i: number) =>
      waitFor(() => expect(Math.abs(deslocamento() - i * passo())).toBeLessThan(2), { timeout: 4000 });

    await step('A região tem papel, roledescription e nome', async () => {
      // Sem nome acessível a região não vira marco de navegação e o leitor
      // anuncia "carrossel" sem dizer de quê.
      await expect(regiao).toHaveAttribute('aria-roledescription', 'carousel');
      await expect(regiao).toHaveAccessibleName('Galeria de exemplos');
    });

    await step('Cada slide é um grupo anunciável com posição e total', async () => {
      const slides = canvas.getAllByRole('group');
      // Nunca contado à mão: o total sai do próprio conjunto renderizado.
      const total = slides.length;
      await expect(total).toBeGreaterThan(2);
      for (const [i, slide] of slides.entries()) {
        await expect(slide).toHaveAttribute('aria-roledescription', 'slide');
        await expect(slide).toHaveAccessibleName(`Slide ${i + 1} de ${total}`);
      }
    });

    await step('No primeiro slide só a seta de avanço está ativa', async () => {
      await expect(anterior()).toBeDisabled();
      await expect(anterior()).toHaveAttribute('aria-disabled', 'true');
      await expect(proximo()).toBeEnabled();
      await expect(proximo()).toHaveAttribute('aria-disabled', 'false');
    });

    await step('Clicar em avançar leva ao segundo slide e libera a seta de voltar', async () => {
      await userEvent.click(proximo());
      await emSlide(1);
      await expect(anterior()).toBeEnabled();
    });

    await step('A seta do teclado avança com o foco na região', async () => {
      // WCAG 2.1.1: toda navegação precisa de equivalente de teclado, e sem
      // `tabindex` na região o foco não teria onde cair.
      regiao.focus();
      await expect(regiao).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      await emSlide(2);
    });

    await step('E a story termina onde diz que termina: no primeiro slide', async () => {
      // `visual.item1` reivindica o ESTADO INICIAL, e é o quadro final que o
      // Chromatic fotografa e o axe varre. Sem voltar, a foto seria do terceiro
      // slide — e o replay do painel Interactions começaria de lá, invertendo o
      // passo "no primeiro slide só a seta de avanço está ativa".
      for (let volta = 0; volta < slides().length; volta++) {
        const botao = anterior();
        if (botao.disabled) break;
        await userEvent.click(botao);
      }
      await emSlide(0);
      await expect(anterior()).toBeDisabled();
    });
  },
};
