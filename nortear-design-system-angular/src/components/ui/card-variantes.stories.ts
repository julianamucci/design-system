import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NDS_CARD } from './card';
import { NdsButton } from './button';

const meta: Meta = {
  title: 'UI/Card/Variantes',
  decorators: [moduleMetadata({ imports: [...NDS_CARD, NdsButton] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const ComRodape: Story = {
  parameters: { covers: ['functional.item3', 'visual.item3'] },
  render: () => ({
    template: `
      <div ndsCard class="nds-max-w-md">
        <div ndsCardHeader>
          <h3 ndsCardTitle>Excluir projeto</h3>
          <p ndsCardDescription>Esta ação não pode ser desfeita.</p>
        </div>
        <div ndsCardContent>Todos os arquivos e histórico serão removidos.</div>
        <div ndsCardFooter>
          <button ndsButton variant="outline">Cancelar</button>
          <button ndsButton variant="destructive">Excluir</button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O rodapé é filho DIRETO do card', async () => {
      // O CSS zera o padding-bottom do card com `has-[> .nds-card-footer]`.
      // Um wrapper entre os dois quebraria a regra sem quebrar nada visível
      // aqui — daí medir a relação de parentesco, não só a presença.
      const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
      const footer = card.querySelector<HTMLElement>('[data-slot="card-footer"]')!;
      await expect(footer.parentElement).toBe(card);
    });
  },
};

export const ComAcao: Story = {
  parameters: { covers: ['functional.item4', 'visual.item4'] },
  render: () => ({
    template: `
      <div ndsCard class="nds-max-w-md">
        <div ndsCardHeader>
          <h3 ndsCardTitle>Assinatura Pro</h3>
          <p ndsCardDescription>Renova em 12 de setembro</p>
          <div ndsCardAction>
            <button ndsButton variant="ghost" size="sm">Gerenciar</button>
          </div>
        </div>
        <div ndsCardContent>R$ 49,90 por mês</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('A ação vive dentro do header, não solta no card', async () => {
      // O `.nds-card-action` se posiciona pela grid do header; fora dele o
      // botão cairia no fluxo normal e o alinhamento à direita sumiria.
      const header = canvasElement.querySelector<HTMLElement>('[data-slot="card-header"]')!;
      const acao = header.querySelector<HTMLElement>('[data-slot="card-action"]');
      await expect(acao).toBeTruthy();
    });
  },
};

export const ComImagem: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => ({
    template: `
      <div ndsCard class="nds-max-w-md">
        <img
          src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='160'%3E%3Crect width='400' height='160' fill='%23cbd5e1'/%3E%3C/svg%3E"
          alt="Prévia do produto"
        />
        <div ndsCardHeader>
          <h3 ndsCardTitle>Cadeira Ergonômica</h3>
          <p ndsCardDescription>Apoio lombar ajustável</p>
        </div>
        <div ndsCardContent>R$ 1.299,00</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('A imagem é o primeiro filho e perde o padding do topo', async () => {
      // `> img:first-child` é o seletor que arredonda o canto e cola a imagem
      // na borda. Só vale se a img for filha direta e vier primeiro.
      const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
      await expect(card.firstElementChild?.tagName).toBe('IMG');
      await expect(Number.parseFloat(getComputedStyle(card).paddingTop)).toBe(0);
    });

    await step('A imagem tem alternativa textual', async () => {
      const img = canvasElement.querySelector<HTMLImageElement>('img')!;
      await expect(img.alt.length).toBeGreaterThan(0);
    });
  },
};
