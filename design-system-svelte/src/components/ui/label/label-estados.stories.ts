import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import LabelStory from './LabelStory.svelte';
import LabelDisabledPeerStory from './LabelDisabledPeerStory.svelte';
import LabelDisabledGroupStory from './LabelDisabledGroupStory.svelte';

/**
 * Estados do Label:
 *
 * - **Padrão** — Label simples com htmlFor associado.
 * - **Required** — asterisco em text-destructive adicionado pelo código consumidor.
 * - **Disabled** — Label com opacity reduzida via peer-disabled (campo irmão disabled).
 *
 * Nota: `disabled` NÃO é uma prop direta do Label. O estado visual é aplicado
 * automaticamente via CSS `peer-disabled:opacity-50` quando o Input irmão
 * está disabled, ou via `group-data-[disabled=true]:opacity-50` em um container
 * com `data-disabled="true"`.
 */
const meta = {
  title: 'UI/Label/Estados',
  component: LabelStory,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados visuais do Label: padrão, required (com asterisco) e disabled (via peer-disabled ou group-data-[disabled=true]).',
      },
    },
  },
} satisfies Meta<typeof LabelStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    Component: LabelStory,
    props: {
      children: 'Nome completo',
      for: 'nome-default',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label padrão está visível', async () => {
      const label = canvas.getByText('Nome completo');
      await expect(label).toBeVisible();
    });

    await step('Label possui data-slot="label"', async () => {
      const label = canvasElement.querySelector('[data-slot="label"]');
      await expect(label).toBeInTheDocument();
    });
  },
};

export const Required: Story = {
  render: () => ({
    Component: LabelStory,
    props: {
      children: 'Email profissional',
      for: 'email-required',
      required: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label required está visível', async () => {
      const label = canvas.getByText('Email profissional');
      await expect(label).toBeVisible();
    });

    await step('Asterisco de required está presente com aria-hidden', async () => {
      const asterisk = canvasElement.querySelector('[aria-hidden="true"]');
      await expect(asterisk).toBeInTheDocument();
      await expect(asterisk?.textContent).toBe('*');
    });
  },
};

export const DisabledViaGrupo: Story = {
  name: 'Disabled (via group)',
  render: () => ({
    Component: LabelDisabledGroupStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Grupo pai tem data-disabled="true"', async () => {
      const group = canvasElement.querySelector('[data-disabled="true"]');
      await expect(group).toBeInTheDocument();
    });

    await step('Label está presente no grupo', async () => {
      const label = canvas.getByText('Documento');
      await expect(label).toBeInTheDocument();
    });
  },
};

/**
 * Disabled via `peer-disabled`:
 * O Input com `disabled` e a classe `peer` ativa `peer-disabled:opacity-50`
 * e `peer-disabled:cursor-not-allowed` no Label que vem logo após.
 * Label e Input devem ser siblings no DOM.
 */
export const Disabled: Story = {
  render: () => ({
    Component: LabelDisabledPeerStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Input está desabilitado', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toBeDisabled();
    });

    await step('Label está presente no DOM', async () => {
      const label = canvasElement.querySelector('[data-slot="label"]');
      await expect(label).toBeInTheDocument();
    });
  },
};
