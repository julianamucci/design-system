import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NDS_CAROUSEL } from './carousel';
import { NdsAspectRatio } from './aspect-ratio';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os dois extremos de um carrossel sem repetição. Sem `loop` a navegação tem
// começo e fim, e é a seta desabilitada que conta isso a quem chegou lá: um
// botão que continua vivo e não faz nada é pior do que um botão apagado.

const meta: Meta = {
  title: 'UI/Carousel/States',
  decorators: [moduleMetadata({ imports: [...NDS_CAROUSEL, NdsAspectRatio] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Os dois extremos do carrossel sem repetição: no primeiro slide a seta de voltar está desabilitada, no último a de avançar.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const SLIDES = [1, 2, 3, 4];

/** Mesmo markup nos dois extremos — o que muda é só onde a story para. */
const TEMPLATE = `
  <nds-carousel class="nds-w-full nds-max-w-md" label="Slides sem repetição" slideLabel="Slide {index} de {total}">
    <div ndsCarouselContent>
      @for (i of slides; track i) {
        <div ndsCarouselItem>
          <div ndsAspectRatio [ratio]="16 / 9">
            <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
              <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">Slide {{ i }}</span>
            </div>
          </div>
        </div>
      }
    </div>
    <button ndsCarouselPrevious label="Item anterior"></button>
    <button ndsCarouselNext label="Próximo item"></button>
  </nds-carousel>
`;

// ─── Primeiro slide ───────────────────────────────────────────────────────────

export const FirstSlide: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story:
          'Estado de entrada: nada foi navegado ainda, então voltar não leva a lugar nenhum e a seta anterior nasce desabilitada.',
      },
    },
  },
  render: () => ({ props: { slides: SLIDES }, template: TEMPLATE }),
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
      await expect(proximo.hasAttribute('aria-disabled')).toBe(false);
    });

    await step('O extremo é visível, não só programático', async () => {
      // Duas instâncias do MESMO botão, lado a lado: comparar a seta apagada com
      // a seta viva prova o contraste do estado. Medir só a opacidade da
      // desabilitada passaria numa tela onde todas estivessem apagadas.
      //
      // Aqui a leitura é direta, e no passo espelhado do último slide ela é
      // envolvida por `waitFor` — a diferença é real, não descuido. Neste ponto
      // o botão nasceu desabilitado, e transição não anima valor inicial: não há
      // nada em curso para esperar. Lá, ele ACABOU de mudar de estado.
      const apagada = Number(getComputedStyle(anterior).opacity);
      const viva = Number(getComputedStyle(proximo).opacity);
      await expect(apagada).toBeLessThan(viva);
    });

    await step('O viewport está no início', async () => {
      const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
      await expect(viewport.scrollLeft).toBe(0);
    });
  },
};

// ─── Último slide ─────────────────────────────────────────────────────────────

export const LastSlide: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    docs: {
      description: {
        story:
          'Depois de percorrer todos os slides sem repetição, avançar deixa de ser possível e a seta seguinte fica desabilitada.',
      },
    },
  },
  render: () => ({ props: { slides: SLIDES }, template: TEMPLATE }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
    const proximo = () =>
      canvas.getByRole('button', { name: 'Próximo item' }) as HTMLButtonElement;

    await step('Avançar até onde o carrossel deixa', async () => {
      // Avança ENQUANTO der, em vez de clicar um número fixo de vezes: no replay
      // do painel Interactions o carrossel já está no fim, e o clique cego
      // cairia num botão com `pointer-events: none` — o `userEvent` recusa, e a
      // story quebraria só na segunda rodada.
      const total = canvas.getAllByRole('group').length;
      for (let passo = 0; passo < total; passo++) {
        const botao = proximo();
        if (botao.disabled) break;
        // A rolagem é suave: mede antes, clica, e espera o viewport passar do
        // ponto anterior. Sem a espera o passo seguinte partiria de um retângulo
        // que ainda está em movimento.
        const antes = viewport.scrollLeft;
        await userEvent.click(botao);
        await waitFor(() => expect(viewport.scrollLeft).toBeGreaterThan(antes));
      }
    });

    await step('No fim a seta de avanço desabilita e a de voltar acorda', async () => {
      // functional.item4 — o par importa: só "next desabilitado" também seria
      // verdade num carrossel de um slide só, onde nada nunca avançou.
      await expect(proximo()).toBeDisabled();
      await expect(proximo()).toHaveAttribute('aria-disabled', 'true');

      const anterior = canvas.getByRole('button', { name: 'Item anterior' });
      await expect(anterior).toBeEnabled();
      await expect(anterior.hasAttribute('aria-disabled')).toBe(false);

      // Espelho da comparação do primeiro slide: agora a apagada é a outra.
      //
      // O `waitFor` não é folga: `.nds-carousel-button` declara
      // `transition: … opacity var(--duration-fast)`, e o botão só ficou
      // desabilitado no clique anterior. Ler a opacidade no primeiro quadro
      // pega o valor de PARTIDA — 1 contra 1 — e o teste reprova por corrida,
      // não por defeito. É o mesmo caso do contraste ~1.0 que o axe acusa em
      // elemento a meio do fade.
      await waitFor(async () => {
        const apagada = Number(getComputedStyle(proximo()).opacity);
        const viva = Number(getComputedStyle(anterior).opacity);
        await expect(apagada).toBeLessThan(viva);
      });
    });

    await step('O viewport chegou ao fim do trilho', async () => {
      // A prova de que o fim é real e não só um sinalizador do componente: não
      // sobrou conteúdo à direita para rolar.
      await waitFor(async () => {
        const sobra = viewport.scrollWidth - viewport.clientWidth - viewport.scrollLeft;
        await expect(sobra).toBeLessThan(2);
      });
    });
  },
};
