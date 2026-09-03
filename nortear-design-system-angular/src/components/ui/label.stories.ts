import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsLabel } from './label';
import { NdsInput } from './input';
import { labelPlaygroundSource, type LabelArgs } from './label.source';
import { NdsLabelDocs } from '@/components/docs/LabelDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<LabelArgs> = {
  title: 'Primitives/Form/Label',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [NdsLabel, NdsInput] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsLabelDocs) },
  },
  argTypes: {
    text: {
      control: 'text',
      description: 'Texto visível do rótulo.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'Nome completo' } },
    },
    htmlFor: {
      control: 'text',
      description:
        'Id do controle associado. Vai no atributo nativo `for` do <label> — não há input dedicado.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    required: {
      control: 'boolean',
      description: 'Acrescenta o marcador visual de obrigatório e aria-required no controle.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o controle associado, que por sua vez esmaece o rótulo.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: {
    text: 'Nome completo',
    htmlFor: 'playground-label',
    required: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<LabelArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: labelPlaygroundSource } },
    covers: ['functional.item1', 'accessibility.item2'],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="nds-stack nds-w-xs" data-spacing="xs">
        <label ndsLabel [attr.for]="htmlFor">
          {{ text }}
          @if (required) {
            <span class="nds-text-destructive" aria-hidden="true">*</span>
          }
        </label>
        <input
          class="nds-input nds-peer"
          [id]="htmlFor"
          type="text"
          placeholder="ex: João da Silva"
          [attr.aria-required]="required ? 'true' : null"
          [disabled]="disabled"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('O rótulo é um <label> com a classe do design system', async () => {
      const label = canvasElement.querySelector<HTMLLabelElement>('label.nds-label')!;
      await expect(label.tagName.toLowerCase()).toBe('label');
      await expect(label).toHaveAttribute('data-slot', 'label');
    });

    await step('O campo é alcançável pelo texto do rótulo', async () => {
      // É o que `accessibility.item2` promete: `getByLabelText` só encontra o
      // campo se a associação `for`/`id` estiver de pé. Conferir o atributo
      // sozinho passaria com um id que não aponta para nada.
      const field = canvas.getByLabelText(args.text, { exact: false });
      await expect(field).toBe(canvasElement.querySelector('input'));
    });

    await step('Clicar no rótulo move o foco para o campo', async () => {
      // Precondição própria: o replay reexecuta no mesmo DOM, e sem tirar o
      // foco daqui a asserção passaria pelo estado que a rodada anterior deixou.
      const label = canvas.getByText(args.text, { exact: false });
      const field = canvasElement.querySelector<HTMLInputElement>('input')!;
      if (args.disabled) return; // controle desabilitado não recebe foco
      field.blur();
      await expect(field).not.toHaveFocus();
      await userEvent.click(label);
      await expect(field).toHaveFocus();
    });
  },
};
