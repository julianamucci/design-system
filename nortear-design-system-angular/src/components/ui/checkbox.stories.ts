import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsCheckbox } from './checkbox';
import { NdsLabel } from './label';
import { NdsCheckboxDocs } from '@/components/docs/CheckboxDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type CheckboxArgs = {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  label: string;
};

/** Ver a nota em separator.stories.ts. */
function playgroundSource(_gerado: string, ctx: { args?: Partial<CheckboxArgs> }): string {
  const {
    checked = false,
    indeterminate = false,
    disabled = false,
    label = 'Aceito os termos',
  } = ctx.args ?? {};

  const attrs = [
    'id="termos"',
    checked ? '[checked]="true"' : '',
    indeterminate ? '[indeterminate]="true"' : '',
    disabled ? '[disabled]="true"' : '',
  ].filter(Boolean).join(' ');

  return `import { NdsCheckbox } from '@/components/ui/checkbox';
import { NdsLabel } from '@/components/ui/label';

@Component({
  imports: [NdsCheckbox, NdsLabel],
  template: \`
    <button ndsCheckbox ${attrs}></button>
    <label ndsLabel for="termos">${label}</label>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<CheckboxArgs> = {
  title: 'UI/Checkbox',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [NdsCheckbox, NdsLabel] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsCheckboxDocs) },
  },
  argTypes: {
    checked: { control: 'boolean', description: 'Estado marcado. É um model — aceita [(checked)].' },
    indeterminate: {
      control: 'boolean',
      description: 'Estado misto, para "selecionar todos" com seleção parcial.',
    },
    disabled: { control: 'boolean', description: 'Desabilita o controle.' },
    label: { control: 'text', description: 'Texto do rótulo associado.' },
  },
  args: { checked: false, indeterminate: false, disabled: false, label: 'Aceito os termos' },
};

export default meta;
type Story = StoryObj<CheckboxArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: ['functional.item1', 'functional.item2', 'accessibility.item1'],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button
          ndsCheckbox
          id="pg-check"
          [checked]="checked"
          [indeterminate]="indeterminate"
          [disabled]="disabled"
        ></button>
        <label ndsLabel for="pg-check">{{ label }}</label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('É um <button> com semântica de checkbox', async () => {
      // O Vanilla usa <div role="checkbox"> + input irmão para não aninhar
      // elementos interativos. O primitivo do Radix NG já nasce num <button>,
      // que é interativo de verdade — markup mais simples e mais correto.
      const cb = canvasElement.querySelector<HTMLButtonElement>('[data-slot="checkbox"]')!;
      await expect(cb.tagName).toBe('BUTTON');
      await expect(cb.getAttribute('role')).toBe('checkbox');
    });

    await step('O estado aparece em aria-checked E em data-state', async () => {
      // `aria-checked` vem do primitivo; `data-state` é o contrato de markup
      // das outras quatro stacks, que este componente emite de propósito.
      const cb = canvasElement.querySelector<HTMLElement>('[data-slot="checkbox"]')!;
      const esperado = args.indeterminate ? 'mixed' : String(args.checked);
      await expect(cb.getAttribute('aria-checked')).toBe(esperado);
      await expect(cb.getAttribute('data-state')).toBe(
        args.indeterminate ? 'indeterminate' : args.checked ? 'checked' : 'unchecked',
      );
    });

    await step('O rótulo alcança o controle', async () => {
      await expect(canvas.getByLabelText(args.label)).toBeTruthy();
    });

    if (!args.disabled) {
      await step('Space alterna o estado', async () => {
        // É o teclado que o primitivo entrega e que o Vanilla precisa
        // reimplementar — a asserção confirma que a composição funcionou.
        const cb = canvasElement.querySelector<HTMLElement>('[data-slot="checkbox"]')!;
        const antes = cb.getAttribute('aria-checked');
        cb.focus();
        await userEvent.keyboard(' ');
        await expect(cb.getAttribute('aria-checked')).not.toBe(antes);
      });
    }
  },
};
