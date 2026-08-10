import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsInput } from './input';
import { NdsLabel } from './label';
import { NdsInputDocs } from '@/components/docs/InputDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type InputArgs = {
  type: string;
  placeholder: string;
  label: string;
  disabled: boolean;
  invalid: boolean;
};

/** Ver a nota em separator.stories.ts. */
function playgroundSource(_gerado: string, ctx: { args?: Partial<InputArgs> }): string {
  const {
    type = 'email',
    placeholder = 'ex: joao@empresa.com',
    label = 'Email profissional',
    disabled = false,
    invalid = false,
  } = ctx.args ?? {};

  const attrs = [
    'id="email"',
    `type="${type}"`,
    `placeholder="${placeholder}"`,
    disabled ? 'disabled' : '',
    invalid ? 'aria-invalid="true"' : '',
  ].filter(Boolean).join(' ');

  return `import { NdsInput } from '@/components/ui/input';
import { NdsLabel } from '@/components/ui/label';

@Component({
  imports: [NdsInput, NdsLabel],
  template: \`
    <label ndsLabel for="email">${label}</label>
    <input ndsInput ${attrs} />
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<InputArgs> = {
  title: 'UI/Input',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [NdsInput, NdsLabel] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsInputDocs) },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
      description: 'Tipo HTML do campo. Atributo nativo — não há input dedicado.',
    },
    placeholder: { control: 'text', description: 'Texto de exemplo. Nunca substitui o rótulo.' },
    label: { control: 'text', description: 'Texto do rótulo associado.' },
    disabled: { control: 'boolean', description: 'Desabilita o campo.' },
    invalid: { control: 'boolean', description: 'Marca o campo como inválido via aria-invalid.' },
  },
  args: {
    type: 'email',
    placeholder: 'ex: joao@empresa.com',
    label: 'Email profissional',
    disabled: false,
    invalid: false,
  },
};

export default meta;
type Story = StoryObj<InputArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    // visual.item1 e item2 (default e o trio focus/disabled/error) saem desta
    // story e da Estados; accessibility.item5 é contraste, medido pelo axe em
    // toda story — o audit só o enxerga se alguma declarar.
    covers: [
      'functional.item1', 'functional.item2',
      'accessibility.item1', 'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="nds-stack nds-max-w-sm" data-spacing="sm">
        <label ndsLabel for="pg-input">{{ label }}</label>
        <input
          ndsInput
          id="pg-input"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [attr.aria-invalid]="invalid ? 'true' : null"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('É um <input> nativo com a classe do design system', async () => {
      const input = canvasElement.querySelector<HTMLInputElement>('[data-slot="input"]')!;
      await expect(input.tagName).toBe('INPUT');
      await expect(input).toHaveClass(/nds-input/);
    });

    await step('O tipo escolhido chega ao DOM', async () => {
      // `type` é atributo nativo, não input do componente — se alguém
      // transformar em signal input um dia, isto acusa a mudança de contrato.
      const input = canvasElement.querySelector<HTMLInputElement>('[data-slot="input"]')!;
      await expect(input.type).toBe(args.type);
    });

    await step('O rótulo está associado ao campo', async () => {
      // Buscar por role+name é o que prova a associação: `for` apontando para
      // id inexistente passaria numa checagem de atributo.
      const input = canvas.getByLabelText(args.label);
      await expect(input).toBeTruthy();
    });

    if (!args.disabled) {
      await step('O campo aceita digitação', async () => {
        const input = canvasElement.querySelector<HTMLInputElement>('[data-slot="input"]')!;
        await userEvent.type(input, 'teste');
        await expect(input.value).toContain('teste');
      });
    }
  },
};
