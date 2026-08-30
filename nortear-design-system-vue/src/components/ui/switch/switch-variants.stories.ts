import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { Switch } from './index';
import { Label } from '@/components/ui/label';
import {
  switchWithDescriptionSource,
  switchCompactoSource,
  switchDefaultSource,
} from './switch.source';

const meta = {
  title: 'Primitives/Form/Switch/Variants',
  component: Switch,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: switchDefaultSource },
      description: {
        component:
          'Variantes do Switch: default (Label à direita), withDescription (painel com o texto à esquerda) e sm (compacto).',
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Switch id="var-default" />
        <Label :for="'var-default'">Receber notificações</Label>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Switch padrão — trilho de 36×20px com thumb de 16px, Label à direita.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('O degrau padrão vira data-size', async () => {
      await expect(sw).toHaveAttribute('data-size', 'default');
    });

    await step('O rótulo nomeia o controle', async () => {
      await expect(canvas.getByRole('switch', { name: /Receber notificações/i }))
        .toBe(sw);
    });
  },
};

export const WithDescription: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="nds-cluster nds-w-sm nds-rounded-lg nds-border-default nds-p-4" data-align="center" data-justify="between">
        <div class="nds-stack" data-spacing="xs">
          <Label :for="'var-marketing'">Emails de marketing</Label>
          <p class="nds-text-body">
            Receba novidades e promoções da plataforma.
          </p>
        </div>
        <Switch id="var-marketing" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      // O par vira linha de painel, com um parágrafo de apoio ao lado do rótulo
      // — a do meta mostraria só o par em linha, que é outra estrutura.
      source: { transform: switchWithDescriptionSource },
      description: {
        story: 'Switch em painel de configurações — texto à esquerda, controle à direita.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O controle e a descrição auxiliar estão visíveis', async () => {
      await expect(canvas.getByRole('switch')).toBeVisible();
      await expect(canvas.getByText(/Receba novidades e promoções/)).toBeVisible();
    });

    await step('Só o rótulo nomeia o controle — a descrição não entra no nome', async () => {
      await expect(canvas.getByRole('switch', { name: /Emails de marketing/i })).toBeVisible();
    });
  },
};

export const Sm: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <div class="nds-cluster" data-spacing="sm">
          <Switch id="var-sm-referencia" />
          <Label :for="'var-sm-referencia'">Tamanho padrão</Label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <Switch id="var-sm" size="sm" />
          <Label :for="'var-sm'" class="nds-text-caption">Tamanho compacto</Label>
        </div>
      </div>
    `,
  }),
  parameters: {
    covers: ['visual.item4'],
    docs: {
      // São DOIS switches lado a lado: a comparação entre os degraus é o assunto,
      // e um snippet de um só esconderia justamente isso.
      source: { transform: switchCompactoSource },
      description: {
        story:
          'Degrau compacto — trilho de 24×16px com thumb de 12px, ao lado do padrão para comparação.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const [padrao, compacto] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="switch"]'),
    );

    await step('O degrau de tamanho vira data-size', async () => {
      await expect(padrao).toHaveAttribute('data-size', 'default');
      await expect(compacto).toHaveAttribute('data-size', 'sm');
    });

    await step('O compacto é de fato menor que o padrão', async () => {
      // O atributo sozinho não prova nada: a medida vive no CSS compartilhado,
      // e uma regra ausente deixaria os dois do mesmo tamanho com o data-size
      // certo em ambos.
      await expect(compacto.getBoundingClientRect().width).toBeLessThan(
        padrao.getBoundingClientRect().width,
      );
    });

    await step('O thumb acompanha o degrau do trilho', async () => {
      const thumbDefault = padrao.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
      const thumbCompacto = compacto.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
      await expect(thumbCompacto.getBoundingClientRect().width).toBeLessThan(
        thumbDefault.getBoundingClientRect().width,
      );
    });
  },
};
