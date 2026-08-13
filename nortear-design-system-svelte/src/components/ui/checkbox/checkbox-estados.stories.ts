import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { Checkbox } from './index';
import CheckboxStory from './CheckboxStory.svelte';

const meta: Meta = {
  title: 'UI/Checkbox/States',
  component: Checkbox,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados do Checkbox: unchecked, checked, indeterminate (seleção parcial de grupo), disabled, foco visível via teclado e error (aria-invalid).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Unchecked: Story = {
  parameters: {
    covers: ['visual.item1', 'accessibility.item2'],
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-unchecked',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox está desmarcado', async () => {
      await expect(checkbox).not.toBeChecked();
    });

    await step('aria-checked é false', async () => {
      await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const Checked: Story = {
  parameters: {
    covers: ['visual.item2', 'functional.item6'],
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: true,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-checked',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox renderiza marcado sem controle externo', async () => {
      await expect(checkbox).toBeChecked();
    });

    await step('aria-checked é true', async () => {
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const Indeterminate: Story = {
  parameters: {
    covers: ['visual.item3'],
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      indeterminate: true,
      withLabel: true,
      labelText: 'Selecionar todos os itens',
      id: 'cb-indeterminate',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox tem aria-checked mixed', async () => {
      await expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    });
  },
};

const disabledOnCheckedChange = fn();

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item4'],
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      disabled: true,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-disabled',
      onCheckedChange: disabledOnCheckedChange,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox está desabilitado', async () => {
      await expect(checkbox).toBeDisabled();
    });

    await step('Clicar não altera o estado nem dispara o callback', async () => {
      disabledOnCheckedChange.mockClear();
      await userEvent.click(checkbox, { pointerEventsCheck: 0 });
      await expect(checkbox).not.toBeChecked();
      await expect(disabledOnCheckedChange).not.toHaveBeenCalled();
    });
  },
};

export const DisabledChecked: Story = {
  parameters: {
    covers: ['visual.item4'],
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: true,
      disabled: true,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-disabled-checked',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox desabilitado e marcado', async () => {
      await expect(checkbox).toBeDisabled();
      await expect(checkbox).toBeChecked();
    });
  },
};

export const FocusVisible: Story = {
  parameters: {
    covers: ['accessibility.item4'],
    docs: {
      description: {
        story: 'Foco via teclado exibe o anel de foco (--ring) no elemento com role="checkbox".',
      },
    },
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-focus-visible',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Tab move o foco para o checkbox', async () => {
      // Reseta o foco antes de tabular: no replay o checkbox já pode estar
      // focado da rodada anterior, e um Tab a partir dele sairia do elemento
      // em vez de confirmar que ele é alcançável.
      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await waitFor(() => expect(checkbox).toHaveFocus());
    });

    await step('Anel de foco visível (outline ou box-shadow)', async () => {
      const style = getComputedStyle(checkbox);
      await expect(style.outlineStyle !== 'none' || style.boxShadow !== 'none').toBe(true);
    });
  },
};

export const Error: Story = {
  parameters: {
    covers: ['visual.item5'],
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      ariaInvalid: true,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-error',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox tem aria-invalid true', async () => {
      await expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    });

    await step('Checkbox não está desabilitado', async () => {
      await expect(checkbox).not.toBeDisabled();
    });
  },
};
