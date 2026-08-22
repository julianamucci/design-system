import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import SwitchStory from './SwitchStory.svelte';
import { definir } from './switch.fixtures';
import { switchSource } from './switch.source';

const meta: Meta = {
  title: 'UI/Switch/Compositions',
  component: SwitchStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // As composições deste arquivo são args do MESMO controle — a cascata já
      // entrega o snippet certo em cada uma, sem override.
      source: { transform: switchSource },
      description: {
        component:
          'Composicoes do Switch com Label, descrição auxiliar e padrões de uso em painel de configurações.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithoutLabel: Story = {
  args: {
    checked: false,
    withLabel: false,
    id: 'comp-no-label',
    ariaLabel: 'Ativar modo escuro',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Sem rótulo visível, o nome acessível vem do aria-label', async () => {
      // Anti-padrão didático: sem rótulo visível, o controle continua tendo de
      // ser anunciado com o mesmo texto que o rótulo traria.
      await expect(canvas.getByRole('switch', { name: 'Ativar modo escuro' })).toBe(sw);
    });

    await step('O controle continua operável', async () => {
      await definir(sw, true);
      await definir(sw, false);
    });
  },
};

export const WithLabel: Story = {
  args: {
    checked: false,
    withLabel: true,
    labelText: 'Receber notificações por email',
    id: 'comp-with-label',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    const rotulo = canvas.getByText('Receber notificações por email');

    await step('O rótulo nomeia o controle e está visível', async () => {
      await expect(canvas.getByRole('switch', { name: 'Receber notificações por email' }))
        .toBe(sw);
      await expect(rotulo).toBeVisible();
    });

    await step('Clicar no rótulo liga e desliga o controle', async () => {
      // O par (liga e depois desliga) garante DOIS cliques reais em qualquer
      // rodada e devolve a story ao estado que o Chromatic fotografa.
      await definir(sw, true, rotulo);
      await definir(sw, false, rotulo);
    });
  },
};

export const WithDescription: Story = {
  args: {
    checked: false,
    withDescription: true,
    labelText: 'Emails de marketing',
    descriptionText: 'Receba novidades e promoções da plataforma.',
    id: 'comp-with-desc',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Rótulo e descrição auxiliar estão visíveis', async () => {
      await expect(canvas.getByText('Emails de marketing')).toBeVisible();
      await expect(
        canvas.getByText('Receba novidades e promoções da plataforma.'),
      ).toBeVisible();
    });

    await step('Só o rótulo nomeia; a descrição entra como texto auxiliar', async () => {
      await expect(canvas.getByRole('switch', { name: 'Emails de marketing' })).toBe(sw);
      await expect(sw).toHaveAttribute('aria-describedby', 'comp-with-desc-description');
    });
  },
};

export const Activated: Story = {
  args: {
    checked: true,
    withLabel: true,
    labelText: 'Modo escuro',
    id: 'comp-darkmode',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch', { name: 'Modo escuro' });
    const thumb = canvasElement.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;

    await step('O controle nasce ligado', async () => {
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    });

    await step('E o desenho acompanha: o thumb parte do fim do trilho', async () => {
      const deslocamento = thumb.getBoundingClientRect().left - sw.getBoundingClientRect().left;
      await expect(deslocamento).toBeGreaterThan(sw.getBoundingClientRect().width / 3);
    });
  },
};

export const SizeSm: Story = {
  args: {
    checked: false,
    size: 'sm',
    withLabel: true,
    labelText: 'Notificações push',
    id: 'comp-sm-list',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('O degrau compacto continua operável e nomeado', async () => {
      await expect(sw).toHaveAttribute('data-size', 'sm');
      await expect(canvas.getByRole('switch', { name: 'Notificações push' })).toBe(sw);
    });
  },
};
