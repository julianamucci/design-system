import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { Checkbox } from './index';
import CheckboxStory from './CheckboxStory.svelte';
import CheckboxDocs from '@/components/docs/CheckboxDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(CheckboxDocs) },
    layout: 'centered',
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Estado controlado do checkbox.',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Estado indeterminado — seleção parcial de grupo (aria-checked="mixed").',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o componente.',
    },
    ariaInvalid: {
      control: 'boolean',
      description: 'Aplica aria-invalid para estado de erro.',
    },
    withLabel: {
      control: 'boolean',
      description: 'Renderiza com Label associada.',
    },
    withDescription: {
      control: 'boolean',
      description: 'Renderiza com Label e texto descritivo.',
    },
    labelText: {
      control: 'text',
      description: 'Texto da label associada.',
    },
    onCheckedChange: {
      control: false,
      description: 'Callback disparado quando o estado marcado muda.',
      table: { type: { summary: '(checked: boolean) => void' } },
    },
  },
  args: {
    checked: false,
    indeterminate: false,
    disabled: false,
    ariaInvalid: false,
    withLabel: true,
    withDescription: false,
    labelText: 'Aceito os termos e condições',
    onCheckedChange: fn(),
  },
};

export default meta;
type Story = StoryObj;

const marcar = async (cb: HTMLElement) => {
  if (cb.getAttribute('aria-checked') !== 'true') await userEvent.click(cb);
  await waitFor(() => expect(cb).toHaveAttribute('aria-checked', 'true'));
};
const desmarcar = async (cb: HTMLElement) => {
  if (cb.getAttribute('aria-checked') !== 'false') await userEvent.click(cb);
  await waitFor(() => expect(cb).toHaveAttribute('aria-checked', 'false'));
};

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'functional.item7',
      'accessibility.item1',
      'accessibility.item3',
      'accessibility.item5',
    ],
  },
  render: (args) => ({
    Component: CheckboxStory,
    props: { ...args },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('getByRole("checkbox") devolve o elemento', async () => {
      await expect(canvas.getByRole('checkbox')).toBeInTheDocument();
    });

    await step('getByRole("checkbox", { name }) devolve o elemento', async () => {
      await expect(
        canvas.getByRole('checkbox', { name: 'Aceito os termos e condições' }),
      ).toBeInTheDocument();
    });

    const checkbox = canvas.getByRole('checkbox');

    await desmarcar(checkbox);

    await step('Clicar em desmarcado marca e dispara o callback com true', async () => {
      await marcar(checkbox);
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
    });

    await step('Clicar em marcado desmarca e dispara o callback com false', async () => {
      await desmarcar(checkbox);
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(false);
    });

    // functional.item7 — os DOIS eixos do par rótulo+caixa. A caixa é um
    // <button>, controle rotulável do HTML: o clique no texto move o foco para
    // ela E dispara a ativação, sem nenhum ouvinte escrito na story.
    await step('Clicar no texto do rótulo foca a caixa E alterna o estado', async () => {
      const rotulo = canvas.getByText('Aceito os termos e condições');
      await desmarcar(checkbox);                  // precondição própria
      checkbox.blur();
      await expect(checkbox).not.toHaveFocus();   // o foco tem que VIR do clique
      await userEvent.click(rotulo);
      await expect(checkbox).toHaveFocus();
      await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
    });

    await step('Space com foco alterna o estado e dispara o callback', async () => {
      await desmarcar(checkbox);                  // precondição própria
      checkbox.focus();
      await userEvent.keyboard(' ');
      await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
      await userEvent.keyboard(' ');
      await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'false'));
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(false);
    });
  },
};
