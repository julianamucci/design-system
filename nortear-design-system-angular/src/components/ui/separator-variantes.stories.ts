import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsSeparator } from './separator';

const meta: Meta = {
  title: 'UI/Separator/Variants',
  decorators: [moduleMetadata({ imports: [NdsSeparator] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes nesta story: o painel Controls ficaria vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Orientações do Separator. A horizontal é uma linha de 1px de altura que ocupa a largura do contêiner; a vertical é uma linha de 1px de largura cuja altura vem do contêiner flex ou de grade, sem medida cravada.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Horizontal: Story = {
  parameters: { covers: ['functional.item1', 'visual.item1'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-md" data-spacing="md">
        <div class="nds-text-body">
          <p class="nds-font-medium">Configurações da conta</p>
          <p class="nds-text-muted-foreground">Gerencie seu nome e e-mail.</p>
        </div>
        <div ndsSeparator orientation="horizontal"></div>
        <div class="nds-text-body">
          <p class="nds-font-medium">Preferências</p>
          <p class="nds-text-muted-foreground">Tema, idioma e notificações.</p>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const wrap = canvasElement.querySelector<HTMLElement>('.nds-stack')!;
    const sep = wrap.querySelector<HTMLElement>('.nds-separator');

    await step('A orientação horizontal chega ao DOM', async () => {
      await expect(sep).toBeInTheDocument();
      await expect(sep).toHaveAttribute('data-orientation', 'horizontal');
    });

    await step('Linha fina na altura e cheia na largura', async () => {
      // O que o horizontal promete é linha cheia e fina. Medir os dois evita
      // que uma troca de folha passe com o atributo certo e o visual errado.
      const caixa = sep!.getBoundingClientRect();
      await expect(caixa.height).toBeCloseTo(1, 1);
      await expect(caixa.width).toBeCloseTo(wrap.getBoundingClientRect().width, 0);
    });
  },
};

export const Vertical: Story = {
  parameters: { covers: ['functional.item2', 'visual.item2'] },
  render: () => ({
    template: `
      <div class="nds-cluster nds-docs-demo-row nds-w-md" data-spacing="md">
        <span class="nds-text-body">Blog</span>
        <div ndsSeparator orientation="vertical"></div>
        <span class="nds-text-body">Documentação</span>
        <div ndsSeparator orientation="vertical"></div>
        <span class="nds-text-body">Contato</span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const seps = canvasElement.querySelectorAll<HTMLElement>('.nds-separator');

    await step('As duas linhas verticais chegam ao DOM', async () => {
      await expect(seps).toHaveLength(2);
      await expect(seps[0]).toHaveAttribute('data-orientation', 'vertical');
    });

    await step('Linha fina na largura e esticada na altura, sem medida cravada', async () => {
      // Este é o caso que a asserção antiga jamais pegaria: o separador vertical
      // colapsa para 0px quando o contêiner não é flex nem grade, e continua
      // presente no DOM com o atributo certo. Medir a altura é o que denuncia.
      const caixa = seps[0].getBoundingClientRect();
      await expect(caixa.width).toBeCloseTo(1, 1);
      await expect(caixa.height).toBeGreaterThan(8);
      await expect(seps[0].style.height).toBe('');
    });
  },
};
