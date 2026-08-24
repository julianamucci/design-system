import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, within, expect } from 'storybook/test';
import { Plus, Trash2, ChevronRight, Download } from 'lucide-vue-next';
import { Button } from './index';
import {
  buttonWithIconFinalSource,
  buttonWithIconInitialSource,
  buttonAsLinkSource,
  buttonDestructiveWithIconSource,
  actionsButtonPairSource,
  buttonSoIconSource,
} from './button.source';

const meta: Meta<any> = {
  title: 'UI/Button/Compositions',
  component: Button,
  tags: ['form'],
  parameters: {
    design: figmaDesign('button'),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: buttonWithIconInitialSource } },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIconLeft: Story = {
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

export const WithIconRight: Story = {
  render: () => ({
    components: { Button, ChevronRight },
    template: `
      <Button variant="outline">
        Próximo
        <ChevronRight aria-hidden="true" />
      </Button>
    `,
  }),
  // A ordem dos filhos é o assunto — e ela não cabe em arg nenhum.
  parameters: {
    docs: {
      source: { transform: buttonWithIconFinalSource },
      description: { story: 'Ícone à direita do label. Use em botões de navegação progressiva.' },
    },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: 'Próximo' });
    const svg = btn.querySelector('svg');
    await expect(svg).toHaveAttribute('aria-hidden', 'true');
    // É o que distingue esta story da anterior: o ícone vem DEPOIS do label.
    await expect(btn.lastElementChild).toBe(svg);
  },
};

export const DestructiveIcon: Story = {
  render: () => ({
    components: { Button, Trash2 },
    template: `
      <Button variant="destructive">
        <Trash2 aria-hidden="true" />
        Excluir
      </Button>
    `,
  }),
  // Outro ícone e outra variante: o import muda junto com a composição.
  parameters: {
    docs: {
      source: { transform: buttonDestructiveWithIconSource },
      description: { story: 'Combinação de variante destrutiva com ícone. Use para ações irreversíveis como excluir.' },
    },
  },
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
  // A ausência de texto é o assunto: sem rótulo acessível a ação fica sem nome.
  parameters: {
    docs: {
      source: { transform: buttonSoIconSource },
      description: { story: 'Botão apenas com ícone. aria-label é obrigatório para acessibilidade.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Botão é acessível por aria-label', async () => {
      const button = canvas.getByRole('button', { name: 'Baixar arquivo' });
      await expect(button).toBeInTheDocument();
    });
  },
};

export const ActionPair: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="nds-cluster" data-spacing="md">
        <Button variant="outline">Cancelar</Button>
        <Button>Confirmar</Button>
      </div>
    `,
  }),
  // São dois botões e o container que os espaça — a do meta mostraria um só.
  parameters: {
    docs: {
      source: { transform: actionsButtonPairSource },
      description: { story: 'Par de ações canônico: outline (cancelar) + default (confirmar). Primária sempre à direita em contexto ocidental.' },
    },
  },
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
    // O botão deixa de renderizar o próprio elemento e veste o <a> do
    // consumidor: sem o filho, a composição não existe no snippet.
    docs: {
      source: { transform: buttonAsLinkSource },
      description: { story: 'Usando asChild com reka-ui Primitive para renderizar um <a> com estilos de botão, preservando semântica de link.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Elemento é um link, não um botão', async () => {
      const link = canvas.getByRole('link', { name: 'Ver documentação' });
      await expect(link).toBeInTheDocument();
      await expect(link).toHaveAttribute('href', '#docs');
    });

    await step('O link entra na ordem de tabulação', async () => {
      // O <a> com aparência de botão precisa ser ALCANÇÁVEL por teclado, e
      // isso nenhuma das cinco stacks verificava: as asserções paravam em
      // papel e destino. Um tabindex negativo herdado, ou a perda do
      // atributo de destino, deixariam papel e destino intactos e a ação
      // inalcançável por teclado.
      const link = canvas.getByRole('link', { name: 'Ver documentação' });
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(link).toHaveFocus();
    });
  },
};

