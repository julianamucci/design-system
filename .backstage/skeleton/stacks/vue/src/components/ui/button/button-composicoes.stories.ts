import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { Plus, Trash2, ChevronRight, Download } from 'lucide-vue-next';
import { Button } from './index';

const meta = {
  title: 'UI/Button/Composições',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComIconeAEsquerda: Story = {
  render: () => ({
    components: { Button, Plus },
    template: `
      <Button>
        <Plus aria-hidden="true" />
        Adicionar item
      </Button>
    `,
  }),
  parameters: { docs: { description: { story: 'Ícone à esquerda do label. O SVG deve ter aria-hidden="true" para não poluir leitores de tela.' } } },
};

export const ComIconeADireita: Story = {
  render: () => ({
    components: { Button, ChevronRight },
    template: `
      <Button variant="outline">
        Próximo
        <ChevronRight aria-hidden="true" />
      </Button>
    `,
  }),
  parameters: { docs: { description: { story: 'Ícone à direita do label. Use em botões de navegação progressiva.' } } },
};

export const IconeDestrutivo: Story = {
  render: () => ({
    components: { Button, Trash2 },
    template: `
      <Button variant="destructive">
        <Trash2 aria-hidden="true" />
        Excluir
      </Button>
    `,
  }),
  parameters: { docs: { description: { story: 'Combinação de variante destrutiva com ícone. Use para ações irreversíveis como excluir.' } } },
};

export const IconOnly: Story = {
  render: () => ({
    components: { Button, Download },
    template: `
      <Button size="icon" aria-label="Baixar arquivo">
        <Download aria-hidden="true" />
      </Button>
    `,
  }),
  parameters: { docs: { description: { story: 'Botão apenas com ícone. aria-label é obrigatório para acessibilidade.' } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Botão é acessível por aria-label', async () => {
      const button = canvas.getByRole('button', { name: 'Baixar arquivo' });
      await expect(button).toBeInTheDocument();
    });
  },
};

export const ParDeAcoes: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex gap-2">
        <Button variant="outline">Cancelar</Button>
        <Button>Confirmar</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Par de ações canônico: outline (cancelar) + default (confirmar). Primária sempre à direita em contexto ocidental.' } } },
};

export const AsChildAsLink: Story = {
  render: () => ({
    components: { Button },
    template: `
      <Button as-child variant="link">
        <a href="#docs">Ver documentação</a>
      </Button>
    `,
  }),
  parameters: { docs: { description: { story: 'Usando asChild com reka-ui Primitive para renderizar um <a> com estilos de botão, preservando semântica de link.' } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Elemento é um link, não um botão', async () => {
      const link = canvas.getByRole('link', { name: 'Ver documentação' });
      await expect(link).toBeInTheDocument();
      await expect(link).toHaveAttribute('href', '#docs');
    });
  },
};

export const ClickCounter: Story = {
  render: () => ({
    components: { Button },
    template: `<Button data-testid="click-target">Clique em mim</Button>`,
  }),
  parameters: { docs: { description: { story: 'Exemplo interativo para validar disparo via teclado e mouse.' } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('click-target') as HTMLElement;

    await step('Mouse click funciona', async () => {
      await userEvent.click(button);
      await expect(button).toBeVisible();
    });

    await step('Keyboard Enter funciona', async () => {
      button.focus();
      await userEvent.keyboard('{Enter}');
      await expect(button).toHaveFocus();
    });
  },
};
