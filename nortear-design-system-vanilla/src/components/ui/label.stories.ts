import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createLabel } from './label';
import { createInput } from './input';
import { labelSource } from './label.source';
import { createLabelDocs } from '@/components/docs/LabelDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type LabelArgs = {
  text: string;
  className: string;
};

const meta: Meta<LabelArgs> = {
  title: 'Primitives/Form/Label',
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(createLabelDocs), source: { transform: labelSource } },
  },
  argTypes: {
    text: {
      control: 'text',
      description: 'Texto do rótulo exibido ao usuário.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '""' } },
    },
    className: {
      control: 'text',
      description: 'Classes utilitárias .nds-* adicionais para personalização.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    text: 'Nome completo',
    className: '',
  },
};

export default meta;
type Story = StoryObj<LabelArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: ['functional.item1', 'accessibility.item2'],
  },
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack nds-w-xs';
    wrapper.dataset.spacing = 'xs';

    const inputId = 'playground-label';
    const label = createLabel({ text: args.text, htmlFor: inputId, className: args.className });
    const input = createInput({ id: inputId, placeholder: 'ex: João da Silva' });

    wrapper.append(label, input);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvasElement.querySelector<HTMLLabelElement>('label[data-slot="label"]')!;

    await step('O rótulo é um <label> com a classe do design system', async () => {
      await expect(label.tagName.toLowerCase()).toBe('label');
      await expect(label).toHaveClass('nds-label');
    });

    await step('O campo é alcançável pelo texto do rótulo', async () => {
      // É o que `accessibility.item2` promete: `getByLabelText` só encontra o
      // campo se a associação `for`/`id` estiver de pé. Conferir o atributo
      // sozinho passaria com um id que não aponta para nada.
      const field = canvas.getByLabelText('Nome completo');
      await expect(field).toBe(canvasElement.querySelector('#playground-label'));
    });

    await step('Clicar no rótulo move o foco para o campo', async () => {
      // Precondição própria: o replay reexecuta no mesmo DOM, e sem tirar o
      // foco daqui a asserção passaria pelo estado que a rodada anterior deixou.
      const field = canvasElement.querySelector<HTMLInputElement>('#playground-label')!;
      field.blur();
      await expect(field).not.toHaveFocus();
      await userEvent.click(label);
      await expect(field).toHaveFocus();
    });
  },
};
