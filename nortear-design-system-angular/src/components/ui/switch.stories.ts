import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, fn } from 'storybook/test';
import { NdsSwitch, type SwitchSize } from './switch';
import { NdsLabel } from './label';
import { NdsSwitchDocs } from '@/components/docs/SwitchDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type SwitchArgs = {
  checked: boolean;
  size: SwitchSize;
  disabled: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
};

/** Ver a nota em separator.stories.ts. */
function playgroundSource(_gerado: string, ctx: { args?: Partial<SwitchArgs> }): string {
  const {
    checked = false,
    size = 'default',
    disabled = false,
    label = 'Receber notificações por email',
  } = ctx.args ?? {};

  const attrs = [
    'id="notificacoes"',
    checked ? '[checked]="true"' : '',
    size === 'default' ? '' : `size="${size}"`,
    disabled ? '[disabled]="true"' : '',
  ].filter(Boolean).join(' ');

  return `import { NdsSwitch } from '@/components/ui/switch';
import { NdsLabel } from '@/components/ui/label';

@Component({
  imports: [NdsSwitch, NdsLabel],
  template: \`
    <div class="nds-cluster" data-spacing="sm">
      <button ndsSwitch ${attrs}></button>
      <label ndsLabel for="notificacoes">${label}</label>
    </div>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<SwitchArgs> = {
  title: 'UI/Switch',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [NdsSwitch, NdsLabel] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsSwitchDocs) },
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Estado ligado. É um model — aceita a forma de duas vias [(checked)].',
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'sm'],
      description: 'Degrau de tamanho. Vira data-size, que é onde o CSS guarda a medida.',
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
    size: 'default',
    disabled: false,
    label: 'Receber notificações por email',
    onCheckedChange: fn(),
  },
};

export default meta;
type Story = StoryObj<SwitchArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: [
      'functional.item1', 'functional.item2',
      'accessibility.item1', 'accessibility.item4', 'accessibility.item5',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button
          ndsSwitch
          id="pg-switch"
          [checked]="checked"
          [size]="size"
          [disabled]="disabled"
          (checkedChange)="onCheckedChange($event)"
        ></button>
        <label ndsLabel for="pg-switch">{{ label }}</label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const sw = canvasElement.querySelector<HTMLButtonElement>('[data-slot="switch"]')!;

    await step('É um <button> com semântica de switch', async () => {
      await expect(sw.tagName).toBe('BUTTON');
      await expect(sw.getAttribute('role')).toBe('switch');
    });

    await step('O id escrito no elemento chega ao primitivo', async () => {
      // O RdxSwitchRoot liga `[id]="id()"` no host e gera um id próprio por
      // default. Sem repassar `id` pelo hostDirectives, o valor abaixo seria
      // trocado por "rdx-switch-N" na primeira detecção e o <label for>
      // deixaria de alcançar o controle — em silêncio, com o rótulo na tela.
      await expect(sw.id).toBe('pg-switch');
      await expect(canvas.getByLabelText(args.label)).toBe(sw);
    });

    await step('O estado aparece em aria-checked E em data-state', async () => {
      // `aria-checked` vem do primitivo; `data-state` é o contrato de markup
      // das outras quatro stacks, que este componente emite de propósito.
      await expect(sw.getAttribute('aria-checked')).toBe(String(args.checked));
      await expect(sw).toHaveAttribute('data-state', args.checked ? 'checked' : 'unchecked');
    });

    await step('O degrau de tamanho vira data-size', async () => {
      // A medida mora no CSS compartilhado, indexada por este atributo. Se o
      // input `size` não chegasse ao componente (NG0303), aqui viria "default"
      // com o control em "sm" e nada mais denunciaria.
      await expect(sw).toHaveAttribute('data-size', args.size);
    });

    if (!args.disabled) {
      await step('Clicar no controle alterna o estado e dispara o callback', async () => {
        // Este passo faltava, e a story declarava `functional.item1` — o item
        // do clique — cobrindo-o com um teste de Space. Idempotente: compara
        // com o estado imediatamente anterior em vez de um valor absoluto, e
        // volta ao ponto de partida, então o replay do painel Interactions dá
        // o mesmo resultado saindo de qualquer estado.
        const antes = sw.getAttribute('aria-checked');
        const callsBefore = (args.onCheckedChange as ReturnType<typeof fn>).mock.calls.length;

        await userEvent.click(sw);
        await expect(sw.getAttribute('aria-checked')).not.toBe(antes);
        await expect(sw.getAttribute('data-state')).toBe(
          sw.getAttribute('aria-checked') === 'true' ? 'checked' : 'unchecked',
        );

        await userEvent.click(sw);
        await expect(sw.getAttribute('aria-checked')).toBe(antes);
        await expect(
          (args.onCheckedChange as ReturnType<typeof fn>).mock.calls.length,
        ).toBe(callsBefore + 2);
      });

      await step('Space alterna o estado e dispara o callback de mudança', async () => {
        const antes = sw.getAttribute('aria-checked');
        const callsBefore = (args.onCheckedChange as ReturnType<typeof fn>).mock.calls.length;
        sw.focus();
        await userEvent.keyboard(' ');
        await expect(sw.getAttribute('aria-checked')).not.toBe(antes);
        await expect(sw.getAttribute('data-state')).toBe(
          sw.getAttribute('aria-checked') === 'true' ? 'checked' : 'unchecked',
        );
        await expect(
          (args.onCheckedChange as ReturnType<typeof fn>).mock.calls.length,
        ).toBe(callsBefore + 1);
      });
    }
  },
};
