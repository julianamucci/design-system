import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import SwitchStory from './SwitchStory.svelte';

const meta: Meta = {
  title: 'UI/Switch/Variants',
  component: SwitchStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Switch: default (Label à direita), withDescription (painel com o texto à esquerda) e sm (compacto).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: {
    checked: false,
    withLabel: true,
    labelText: 'Receber notificações por email',
    id: 'var-default',
  },
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

    await step('O controle nasce desligado e nomeado pelo rótulo', async () => {
      await expect(sw).toHaveAttribute('aria-checked', 'false');
      await expect(canvas.getByRole('switch', { name: /Receber notificações por email/i }))
        .toBe(sw);
    });
  },
};

export const WithDescription: Story = {
  args: {
    checked: false,
    withDescription: true,
    labelText: 'Emails de marketing',
    descriptionText: 'Receba novidades e promoções da plataforma.',
    id: 'var-with-desc',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Switch em painel de configurações — texto à esquerda, controle à direita.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('O controle e a descrição auxiliar estão visíveis', async () => {
      await expect(sw).toBeInTheDocument();
      await expect(
        canvas.getByText('Receba novidades e promoções da plataforma.'),
      ).toBeVisible();
    });

    await step('Só o rótulo nomeia; a descrição entra como texto auxiliar', async () => {
      await expect(canvas.getByRole('switch', { name: 'Emails de marketing' })).toBe(sw);
      await expect(sw).toHaveAttribute('aria-describedby', 'var-with-desc-description');
    });
  },
};

export const Sm: Story = {
  args: {
    checked: false,
    size: 'sm',
    withLabel: true,
    labelText: 'Tamanho compacto',
    id: 'var-sm',
  },
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story: 'Degrau compacto — trilho de 24×16px com thumb de 12px.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    const thumb = canvasElement.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;

    await step('O degrau de tamanho vira data-size', async () => {
      await expect(sw).toHaveAttribute('data-size', 'sm');
    });

    await step('A medida do trilho encolhe de fato', async () => {
      // O atributo sozinho não prova nada: a medida vive no CSS compartilhado,
      // e uma regra ausente deixaria o compacto do tamanho do padrão com o
      // data-size certo. 36px é a largura do degrau `default` no CSS — o
      // compacto tem de ficar estritamente abaixo dela.
      await expect(sw.getBoundingClientRect().width).toBeLessThan(36);
    });

    await step('O thumb acompanha o degrau do trilho', async () => {
      await expect(thumb.getBoundingClientRect().width).toBeLessThan(
        sw.getBoundingClientRect().width,
      );
    });
  },
};
