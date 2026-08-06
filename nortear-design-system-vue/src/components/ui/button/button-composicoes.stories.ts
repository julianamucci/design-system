import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { Plus, Trash2, ChevronRight, Download } from 'lucide-vue-next';
import { Button } from './index';

const meta: Meta<any> = {
  title: 'UI/Button/Composicoes',
  component: Button,
  tags: ['form'],
  parameters: {
    design: figmaDesign('button'),
    controls: { disable: true },
    actions: { disable: true },
  },
};

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
  parameters: {
    covers: ['visual.item5'],
    docs: { description: { story: 'Ícone à esquerda do label. O SVG deve ter aria-hidden="true" para não poluir leitores de tela.' } },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: 'Adicionar item' });
    // Nome exato: se o ícone deixasse de ser aria-hidden ele entraria no nome.
    await expect(btn.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(btn.firstElementChild).toBe(btn.querySelector('svg'));
  },
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
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: 'Próximo' });
    const svg = btn.querySelector('svg');
    await expect(svg).toHaveAttribute('aria-hidden', 'true');
    // É o que distingue esta story da anterior: o ícone vem DEPOIS do label.
    await expect(btn.lastElementChild).toBe(svg);
  },
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
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: 'Excluir' });
    await expect(btn).toHaveClass('nds-button-destructive');
    await expect(btn.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  },
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
      <div class="nds-cluster" data-spacing="sm">
        <Button variant="outline">Cancelar</Button>
        <Button>Confirmar</Button>
      </div>
    `,
  }),
  parameters: { docs: { description: { story: 'Par de ações canônico: outline (cancelar) + default (confirmar). Primária sempre à direita em contexto ocidental.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cancelar = canvas.getByRole('button', { name: 'Cancelar' });
    const confirmar = canvas.getByRole('button', { name: 'Confirmar' });
    await expect(cancelar).toHaveClass('nds-button-outline');
    await expect(confirmar).toHaveClass('nds-button-default');
    // A regra documentada é a ordem: a primária fica à direita.
    await expect(cancelar.compareDocumentPosition(confirmar)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  },
};

export const AsLink: Story = {
  render: () => ({
    components: { Button },
    template: `
      <Button as-child variant="link">
        <a href="#docs">Ver documentação</a>
      </Button>
    `,
  }),
  parameters: {
    covers: ['functional.item5'],
    docs: { description: { story: 'Usando asChild com reka-ui Primitive para renderizar um <a> com estilos de botão, preservando semântica de link.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Elemento é um link, não um botão', async () => {
      const link = canvas.getByRole('link', { name: 'Ver documentação' });
      await expect(link).toBeInTheDocument();
      await expect(link).toHaveAttribute('href', '#docs');
    });
  },
};

