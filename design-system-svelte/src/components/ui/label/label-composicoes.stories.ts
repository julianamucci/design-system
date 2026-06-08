import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import LabelWithInputStory from './LabelWithInputStory.svelte';
import LabelWithCheckboxStory from './LabelWithCheckboxStory.svelte';
import LabelCampoObrigatorioStory from './LabelCampoObrigatorioStory.svelte';

/**
 * Composicoes do Label com outros componentes de formulário.
 *
 * O Label é sempre associado ao campo via `for`/`id`.
 * Estas stories demonstram os pares mais comuns.
 */
const meta = {
  title: 'UI/Label/Composicoes',
  component: LabelWithInputStory,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes do Label com Input e Checkbox. O Label deve ser associado ao campo via `for` correspondente ao `id` do controle.',
      },
    },
  },
} satisfies Meta<typeof LabelWithInputStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComInput: Story = {
  name: 'Com Input',
  render: () => ({
    Component: LabelWithInputStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label está associado ao Input via for/id', async () => {
      const label = canvasElement.querySelector('label[for="telefone"]');
      const input = canvasElement.querySelector('input#telefone');
      await expect(label).toBeInTheDocument();
      await expect(input).toBeInTheDocument();
    });

    await step('Input está visível e interativo', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toBeVisible();
      await expect(input).not.toBeDisabled();
    });
  },
};

export const ComCheckbox: Story = {
  name: 'Com Checkbox',
  render: () => ({
    Component: LabelWithCheckboxStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label está associado ao Checkbox via for/id', async () => {
      const label = canvasElement.querySelector('label[for="termos"]');
      await expect(label).toBeInTheDocument();
    });

    await step('Checkbox está presente e visível', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeInTheDocument();
      await expect(checkbox).toBeVisible();
    });

    await step('Label texto está correto', async () => {
      const label = canvas.getByText('Aceito os termos de uso');
      await expect(label).toBeVisible();
    });
  },
};

export const CampoObrigatorio: Story = {
  name: 'Com Input obrigatório',
  render: () => ({
    Component: LabelCampoObrigatorioStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label com marcador required está visível', async () => {
      await expect(canvas.getByText('Email profissional')).toBeInTheDocument();
    });

    await step('Asterisco tem aria-hidden="true"', async () => {
      const asterisk = canvasElement.querySelector('span[aria-hidden="true"]');
      await expect(asterisk).toBeInTheDocument();
      await expect(asterisk?.textContent).toBe('*');
    });

    await step('Input tem aria-required="true"', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toHaveAttribute('aria-required', 'true');
    });
  },
};
