import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsLabel } from './label';
import { NdsLabelDocs } from '@/components/docs/LabelDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type LabelArgs = {
  text: string;
  htmlFor: string;
  required: boolean;
  disabled: boolean;
};

/**
 * Ver a nota em separator.stories.ts: o painel Code mostra o `template` da
 * story, com o `@if` do asterisco e os bindings ligados aos args. O transform
 * devolve o uso real com os valores atuais dos controls.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<LabelArgs> }): string {
  const { text = 'Nome completo', htmlFor = 'nome', required = false, disabled = false } =
    ctx.args ?? {};

  const marcador = required
    ? `\n      <span class="nds-text-destructive" aria-hidden="true">*</span>`
    : '';
  const inputAttrs = [
    `id="${htmlFor}"`,
    required ? 'aria-required="true"' : '',
    disabled ? 'disabled' : '',
  ].filter(Boolean).join(' ');

  return `import { NdsLabel } from '@/components/ui/label';

@Component({
  imports: [NdsLabel],
  template: \`
    <label ndsLabel for="${htmlFor}">
      ${text}${marcador}
    </label>
    <input ${inputAttrs} />
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<LabelArgs> = {
  title: 'UI/Label',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [NdsLabel] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsLabelDocs) },
  },
  argTypes: {
    text: { control: 'text', description: 'Texto visível do rótulo.' },
    htmlFor: {
      control: 'text',
      description:
        'Id do controle associado. Vai no atributo nativo `for` do <label> — não há input dedicado.',
    },
    required: {
      control: 'boolean',
      description: 'Acrescenta o marcador visual de obrigatório e aria-required no controle.',
    },
    disabled: { control: 'boolean', description: 'Desabilita o controle associado.' },
  },
  args: {
    text: 'Nome completo',
    htmlFor: 'nome',
    required: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<LabelArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: ['functional.item1', 'functional.item2', 'accessibility.item1', 'accessibility.item2'],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="nds-stack nds-max-w-sm" data-spacing="sm">
        <label ndsLabel [attr.for]="htmlFor">
          {{ text }}
          @if (required) {
            <span class="nds-text-destructive" aria-hidden="true">*</span>
          }
        </label>
        <input
          class="nds-input"
          [id]="htmlFor"
          type="text"
          [attr.aria-required]="required ? 'true' : null"
          [disabled]="disabled"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('Renderiza um <label> com .nds-label', async () => {
      const label = canvasElement.querySelector<HTMLLabelElement>('label.nds-label');
      await expect(label).toBeTruthy();
      await expect(label).toHaveAttribute('data-slot', 'label');
    });

    await step('Clicar no rótulo move o foco para o controle', async () => {
      // É o que o `for` promete e a única prova de que a associação existe —
      // conferir só o atributo passaria com um id que não aponta para nada.
      const label = canvas.getByText(args.text, { exact: false });
      const input = canvasElement.querySelector<HTMLInputElement>('input')!;
      if (args.disabled) return; // controle desabilitado não recebe foco
      await userEvent.click(label);
      await expect(input).toHaveFocus();
    });
  },
};
