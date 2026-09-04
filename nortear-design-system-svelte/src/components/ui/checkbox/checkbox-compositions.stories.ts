import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { Checkbox } from './index';
import CheckboxStory from './CheckboxStory.svelte';
import CheckboxFormStory from './CheckboxFormStory.svelte';
import {
  checkboxWithDescriptionSource,
  formCheckboxSource,
  checkboxManterSessaoSource,
  checkboxSelectAllSource,
  checkboxNoLabelSource,
  checkboxSource,
} from './checkbox.source';

const meta: Meta = {
  title: 'Components/Form/Checkbox/Compositions',
  component: Checkbox,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: checkboxSource },
      description: {
        component:
          'Composicoes do Checkbox com Label, descrição auxiliar e uso em grupo com fieldset.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    docs: { source: { transform: checkboxNoLabelSource } },
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      withLabel: false,
      id: 'cb-default',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox está presente no DOM', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Checkbox começa desmarcado', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).not.toBeChecked();
    });
  },
};

export const WithLabel: Story = {
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-com-label',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox está associado à label via htmlFor/id', async () => {
      const checkbox = canvas.getByRole('checkbox', { name: 'Aceito os termos e condições' });
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Label está visível', async () => {
      const label = canvas.getByText('Aceito os termos e condições');
      await expect(label).toBeVisible();
    });

    await step('Estado inicial idempotente: garante desmarcado', async () => {
      const checkbox = canvas.getByRole('checkbox');
      const label = canvas.getByText('Aceito os termos e condições');
      if (checkbox.getAttribute('aria-checked') !== 'false') {
        await userEvent.click(label);
      }
      await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'false'));
    });

    await step('Clicar na label alterna o checkbox', async () => {
      const label = canvas.getByText('Aceito os termos e condições');
      await userEvent.click(label);
      const checkbox = canvas.getByRole('checkbox');
      await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));
    });
  },
};

export const WithDescription: Story = {
  parameters: {
    docs: { source: { transform: checkboxWithDescriptionSource } },
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      withLabel: false,
      withDescription: true,
      labelText: 'Receber novidades por email',
      descriptionText: 'Ao marcar esta opção, você concorda em receber comunicações de marketing.',
      id: 'cb-com-descricao',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox está presente no DOM', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Texto de descrição auxiliar está visível', async () => {
      const desc = canvas.getByText('Ao marcar esta opção, você concorda em receber comunicações de marketing.');
      await expect(desc).toBeVisible();
    });

    await step('Label está visível e associada', async () => {
      const label = canvas.getByText('Receber novidades por email');
      await expect(label).toBeVisible();
    });

    await step('Checkbox tem aria-describedby associado à descrição', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toHaveAttribute('aria-describedby', 'cb-com-descricao-description');
    });
  },
};

export const WithLabelChecked: Story = {
  parameters: {
    docs: { source: { transform: checkboxManterSessaoSource } },
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: true,
      withLabel: true,
      labelText: 'Manter sessão ativa',
      id: 'cb-label-checked',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox está presente no DOM', async () => {
      const checkbox = canvas.getByRole('checkbox', { name: 'Manter sessão ativa' });
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Checkbox começa marcado', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeChecked();
    });
  },
};

export const Indeterminate: Story = {
  parameters: {
    docs: { source: { transform: checkboxSelectAllSource } },
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      indeterminate: true,
      withLabel: true,
      labelText: 'Selecionar todos os itens',
      id: 'cb-indeterminate-comp',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox indeterminado está presente no DOM', async () => {
      const checkbox = canvas.getByRole('checkbox', { name: 'Selecionar todos os itens' });
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Checkbox tem aria-checked="mixed"', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    });
  },
};

const inFormOnSubmit = fn();

export const InForm: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: {
      source: { transform: formCheckboxSource },
      description: {
        story:
          'Checkbox marcado dentro de um formulário nativo. O bits-ui renderiza um input escondido quando há `name`, então o valor participa do FormData no submit.',
      },
    },
  },
  render: () => ({
    Component: CheckboxFormStory,
    props: {
      checked: true,
      name: 'termos',
      value: 'aceito',
      labelText: 'Aceito os termos e condições',
      id: 'cb-in-form',
      onSubmit: inFormOnSubmit,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Enviar' });

    await step('Submeter com o checkbox marcado inclui name/value no FormData', async () => {
      inFormOnSubmit.mockClear();
      await userEvent.click(button);
      await waitFor(() => expect(inFormOnSubmit).toHaveBeenCalledTimes(1));
      const formData = inFormOnSubmit.mock.calls[0][0] as FormData;
      await expect(formData.get('termos')).toBe('aceito');
    });
  },
};
