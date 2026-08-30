import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { NDS_CARD } from './card';
import { NdsButton } from './button';

/**
 * Espião em escopo de MÓDULO: criado dentro do `render` seria inalcançável pela
 * `play`. O passo limpa antes de agir, para a contagem valer na segunda
 * execução do painel Interactions.
 */
const onSave = fn();

const meta: Meta = {
  title: 'Primitives/Layout/Card/Variants',
  tags: ['layout'],
  decorators: [moduleMetadata({ imports: [...NDS_CARD, NdsButton] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const WithFooter: Story = {
  parameters: { covers: ['functional.item5'] },
  render: () => ({
    props: { onSave: () => onSave() },
    template: `
      <div ndsCard class="nds-w-sm">
        <div ndsCardHeader>
          <h3 ndsCardTitle>Cadeira Gamer Pro</h3>
          <p ndsCardDescription>Produto atualizado em 12/04.</p>
        </div>
        <div ndsCardContent>R$ 1.299,00</div>
        <div ndsCardFooter class="nds-cluster" data-justify="end" data-spacing="md">
          <button ndsButton variant="outline" aria-label="Cancelar edição de Cadeira Gamer Pro">Cancelar</button>
          <button ndsButton aria-label="Salvar alterações em Cadeira Gamer Pro" (click)="onSave()">Salvar</button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
    const footer = card.querySelector<HTMLElement>('[data-slot="card-footer"]')!;

    await step('O rodapé é filho DIRETO do card e vem depois do conteúdo', async () => {
      // O CSS zera o padding-bottom do card quando o rodapé é filho direto. Um
      // wrapper entre os dois quebraria a regra sem quebrar nada visível aqui.
      await expect(footer.parentElement).toBe(card);
      await expect(card.lastElementChild).toBe(footer);
    });

    await step('O rodapé se separa do conteúdo por uma borda superior', async () => {
      await expect(Number.parseFloat(getComputedStyle(footer).borderTopWidth)).toBeGreaterThan(0);
    });

    await step('Clicar no botão do rodapé chama o handler uma única vez', async () => {
      onSave.mockClear();
      await userEvent.click(
        canvas.getByRole('button', { name: 'Salvar alterações em Cadeira Gamer Pro' }),
      );
      await expect(onSave).toHaveBeenCalledTimes(1);
    });

    await step('O Card raiz não intercepta o clique — segue passivo', async () => {
      // Container: nenhum handler próprio e nenhuma entrada na ordem de foco.
      // É o que garante que o clique termina no botão e não em duas ações.
      await expect(card.onclick).toBeNull();
      await expect(card).not.toHaveAttribute('tabindex');
    });
  },
};

export const WithAction: Story = {
  parameters: { covers: ['functional.item3', 'accessibility.item5', 'visual.item3'] },
  render: () => ({
    template: `
      <div ndsCard class="nds-w-sm">
        <div ndsCardHeader>
          <h3 ndsCardTitle>Cadeira Gamer Pro</h3>
          <p ndsCardDescription>Em estoque</p>
          <div ndsCardAction>
            <button ndsButton variant="ghost" size="sm" aria-label="Editar produto Cadeira Gamer Pro">Editar</button>
          </div>
        </div>
        <div ndsCardContent>R$ 1.299,00</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const header = canvasElement.querySelector<HTMLElement>('[data-slot="card-header"]')!;

    await step('A ação vive DENTRO do header, não solta no card', async () => {
      // Fora do header a ação cairia no fluxo normal e o alinhamento à direita
      // sumiria — a posição vem da grid do header, não de uma classe própria.
      await expect(header.querySelector('[data-slot="card-action"]')).toBeTruthy();
    });

    await step('O header passa a ter duas colunas', async () => {
      const colunas = getComputedStyle(header).gridTemplateColumns.trim().split(/\s+/);
      await expect(colunas).toHaveLength(2);
    });

    await step('A ordem do DOM é título → descrição → ação', async () => {
      const slots = [...header.children].map((el) => el.getAttribute('data-slot'));
      await expect(slots).toEqual(['card-title', 'card-description', 'card-action']);
    });
  },
};

export const WithImage: Story = {
  parameters: { covers: ['functional.item4', 'visual.item5'] },
  render: () => ({
    template: `
      <div ndsCard class="nds-w-sm">
        <img
          src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='160'%3E%3Crect width='400' height='160' fill='%23cbd5e1'/%3E%3C/svg%3E"
          alt="Cadeira Gamer Pro vista de frente, em fundo neutro"
          class="nds-w-full nds-aspect-16-9" style="object-fit: cover"
        />
        <div ndsCardHeader>
          <h3 ndsCardTitle>Cadeira Gamer Pro</h3>
          <p ndsCardDescription>Estrutura ergonômica com ajuste de altura e apoio lombar.</p>
        </div>
        <div ndsCardContent>R$ 1.299,00</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
    const img = card.querySelector<HTMLImageElement>('img')!;

    await step('A imagem é o primeiro filho DIRETO do card', async () => {
      // `> img:first-child` é o seletor que arredonda o canto e cola a imagem
      // na borda. Só vale se a img for filha direta e vier primeiro.
      await expect(card.firstElementChild).toBe(img);
    });

    await step('O card cede o padding superior e o raio para a imagem', async () => {
      await expect(Number.parseFloat(getComputedStyle(card).paddingTop)).toBe(0);
      await expect(
        Number.parseFloat(getComputedStyle(img).borderTopLeftRadius),
      ).toBeGreaterThan(0);
    });

    await step('A imagem tem alternativa textual descritiva', async () => {
      // Imagem informativa: `alt` vazio a esconderia de quem usa leitor de tela,
      // e é ela que mostra o produto.
      await expect(img.alt.trim().length).toBeGreaterThan(0);
    });
  },
};
