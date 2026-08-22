import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createCarousel } from './carousel';
import { slidesDeExemplo } from './carousel.fixtures';
import { carouselSource, carouselSourceCom } from './carousel.source';

// ─── Slide helpers ────────────────────────────────────────────────────────────


// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os dois extremos de um carrossel sem repetição. A seta desabilitada é o que
// conta a quem chegou lá que acabou: um botão que continua vivo e não faz nada
// é pior do que um botão apagado.

const meta: Meta = {
  tags: ['display'],
  title: 'UI/Carousel/States',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: carouselSource },
      description: {
        component:
          'Estados extremos do Carousel — no primeiro slide a seta de voltar está desabilitada, no último a de avançar.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function montar(total: number, label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-md';
  wrap.appendChild(createCarousel({ items: slidesDeExemplo(total), label }));
  return wrap;
}

export const FirstSlide: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: { source: { transform: carouselSourceCom({ slides: 4, ariaLabel: 'Slides no primeiro item' }) } },
  },
  render: () => montar(4, 'Slides no primeiro item'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const anterior = canvas.getByRole('button', { name: 'Item anterior' });
    const proximo = canvas.getByRole('button', { name: 'Próximo item' });

    await step('No começo só a seta de avanço leva a algum lugar', async () => {
      await expect(anterior).toBeDisabled();
      // `aria-disabled` acompanha o `disabled` nativo porque o leitor de tela
      // anuncia o primeiro; o segundo é o que tira o botão da ordem de foco.
      await expect(anterior).toHaveAttribute('aria-disabled', 'true');
      await expect(proximo).toBeEnabled();
      await expect(proximo).toHaveAttribute('aria-disabled', 'false');
    });

    await step('O extremo é visível, não só programático', async () => {
      // Duas instâncias do MESMO botão, lado a lado: comparar a seta apagada
      // com a seta viva prova o contraste do estado. Medir só a opacidade da
      // desabilitada passaria numa tela onde todas estivessem apagadas.
      //
      // Leitura direta aqui, e envolvida por `waitFor` no passo espelhado do
      // último slide: a diferença é real. Neste ponto o botão NASCEU
      // desabilitado, e transição não anima valor inicial — não há nada em
      // curso para esperar.
      const apagada = Number(getComputedStyle(anterior).opacity);
      const viva = Number(getComputedStyle(proximo).opacity);
      await expect(apagada).toBeLessThan(viva);
    });
  },
};

export const LastSlide: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    docs: { source: { transform: carouselSourceCom({ slides: 3, ariaLabel: 'Slides no último item' }) } },
  },
  render: () => montar(3, 'Slides no último item'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-track"]')!;
    const recorte = canvasElement.querySelector<HTMLElement>('.nds-carousel-overflow')!;
    const proximo = () =>
      canvas.getByRole('button', { name: 'Próximo item' }) as HTMLButtonElement;

    // Quanto o track já saiu do recorte. Valor ABSOLUTO: "andou mais do que
    // antes" resolve no primeiro quadro da transição, e a medida seguinte
    // partiria de um número ainda em movimento.
    const deslocamento = () =>
      recorte.getBoundingClientRect().left - track.getBoundingClientRect().left;
    const slides = () => canvas.getAllByRole('group') as HTMLElement[];

    await step('Avançar até onde o carrossel deixa', async () => {
      // Avança ENQUANTO der, em vez de clicar um número fixo de vezes: no
      // replay do painel Interactions o carrossel já está no fim, e o clique
      // cego cairia num botão desabilitado — o `userEvent` recusa, e a story
      // quebraria só na segunda rodada.
      const total = slides().length;
      for (let passo = 0; passo < total; passo++) {
        const botao = proximo();
        if (botao.disabled) break;
        await userEvent.click(botao);
      }

      // Assenta no último slide antes de medir qualquer estado.
      const ultimo = slides().length - 1;
      const alvo = ultimo * (slides()[1].offsetLeft - slides()[0].offsetLeft);
      await waitFor(() => expect(Math.abs(deslocamento() - alvo)).toBeLessThan(2), { timeout: 4000 });
    });

    await step('No fim a seta de avanço desabilita e a de voltar acorda', async () => {
      // functional.item4 — o par importa: só "next desabilitado" também seria
      // verdade num carrossel de um slide só, onde nada nunca avançou.
      await expect(proximo()).toBeDisabled();
      await expect(proximo()).toHaveAttribute('aria-disabled', 'true');

      const anterior = canvas.getByRole('button', { name: 'Item anterior' });
      await expect(anterior).toBeEnabled();
      await expect(anterior).toHaveAttribute('aria-disabled', 'false');

      // Espelho da comparação do primeiro slide: agora a apagada é a outra.
      // O `waitFor` não é folga — o controle declara
      // `transition: … opacity var(--duration-fast)`, e o botão só ficou
      // desabilitado no clique anterior. Ler no primeiro quadro pega o valor de
      // PARTIDA (1 contra 1) e o teste reprova por corrida, não por defeito.
      await waitFor(async () => {
        const apagada = Number(getComputedStyle(proximo()).opacity);
        const viva = Number(getComputedStyle(anterior).opacity);
        await expect(apagada).toBeLessThan(viva);
      }, { timeout: 4000 });
    });
  },
};
