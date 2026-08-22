import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, fn } from 'storybook/test';
import { NdsCheckbox } from './checkbox';
import { NdsLabel } from './label';
import { NdsCheckboxDocs } from '@/components/docs/CheckboxDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type CheckboxArgs = {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
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
    // Espião de output. Sem entrada aqui o renderer Angular não repassa a
    // função em `props` e o `(checkedChange)` do template fica ligado a nada —
    // sem erro nenhum (armadilha 5 do CLAUDE.md deste stack).
    onCheckedChange: { control: false, table: { disable: true } },
  },
  args: {
    checked: false,
    indeterminate: false,
    disabled: false,
    label: 'Aceito os termos',
    onCheckedChange: fn(),
  },
};

export default meta;
type Story = StoryObj<CheckboxArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item7',
      'accessibility.item1', 'accessibility.item3', 'accessibility.item5',
    ],
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
          (checkedChange)="onCheckedChange($event)"
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
      // getByRole com `name` é o método que o critério de a11y pede
      // literalmente — não getByLabelText, que passaria mesmo sem o `role`.
      await expect(canvas.getByRole('checkbox', { name: args.label })).toBeTruthy();
    });

    if (!args.disabled) {
      const cb = canvasElement.querySelector<HTMLElement>('[data-slot="checkbox"]')!;
      const spy = args.onCheckedChange as ReturnType<typeof fn>;

      // Idempotentes por design (`!==`, não `===`): o painel Interactions
      // reexecuta esta play no mesmo DOM sem remontar, então cada helper só
      // clica quando o estado atual ainda não é o alvo.
      const marcar = async () => {
        if (cb.getAttribute('aria-checked') !== 'true') await userEvent.click(cb);
        await waitFor(async () => {
          await expect(cb).toHaveAttribute('aria-checked', 'true');
        });
      };
      const desmarcar = async () => {
        if (cb.getAttribute('aria-checked') !== 'false') await userEvent.click(cb);
        await waitFor(async () => {
          await expect(cb).toHaveAttribute('aria-checked', 'false');
        });
      };

      await step('Clicar em Checkbox desmarcado marca, e o callback dispara com true', async () => {
        // `desmarcar` primeiro normaliza o estado de entrada (que o replay
        // pode herdar marcado); o clique que prova o item é o de `marcar`.
        await desmarcar();
        await marcar();
        await expect(cb).toHaveAttribute('data-state', 'checked');
        await expect(spy).toHaveBeenLastCalledWith(true);
      });

      await step('Clicar em Checkbox marcado desmarca, e o callback dispara com false', async () => {
        await marcar();
        await desmarcar();
        await expect(cb).toHaveAttribute('data-state', 'unchecked');
        await expect(spy).toHaveBeenLastCalledWith(false);
      });

      // functional.item7 — os DOIS eixos do par rótulo+caixa. A caixa é um
      // <button>, controle rotulável do HTML: o clique no texto move o foco
      // para ela E dispara a ativação, sem nenhum ouvinte escrito na story.
      await step('Clicar no texto do rótulo foca a caixa E alterna o estado', async () => {
        const rotulo = canvas.getByText(args.label);
        await desmarcar();                        // precondição própria
        cb.blur();
        await expect(cb).not.toHaveFocus();       // o foco tem que VIR do clique
        await userEvent.click(rotulo);
        await expect(cb).toHaveFocus();
        await waitFor(async () => {
          await expect(cb).toHaveAttribute('aria-checked', 'true');
        });
        await expect(spy).toHaveBeenLastCalledWith(true);
      });

      await step('Space alterna o estado e também dispara o callback', async () => {
        // É o teclado que o primitivo entrega e que o Vanilla precisa
        // reimplementar — a asserção confirma que a composição funcionou.
        const antes = cb.getAttribute('aria-checked');
        const callsBefore = spy.mock.calls.length;
        cb.focus();
        await userEvent.keyboard(' ');
        await expect(cb.getAttribute('aria-checked')).not.toBe(antes);
        await expect(spy.mock.calls.length).toBe(callsBefore + 1);
      });
    }
  },
};
