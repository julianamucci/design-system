import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, waitFor, userEvent } from 'storybook/test';
import { NDS_SELECT, type SelectSide, type SelectAlign, type SelectSize } from './select';
import { waitForPortal, waitForPortalVanish, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import { NdsSelectDocs } from '@/components/docs/SelectDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Dados ────────────────────────────────────────────────────────────────────
//
// Uma lista só, exportada, para que as asserções derivem dela em vez de contar
// itens à mão: acrescentar um estado à lista não deve fazer um teste mentir.

export const STATES = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Minas Gerais' },
] as const;

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SelectArgs = {
  size: SelectSize;
  side: SelectSide;
  align: SelectAlign;
  placeholder: string;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  onValueChange: (value: unknown) => void;
};

/**
 * O painel Code imprime o `template` da story como está escrito — com o `@for`
 * que monta os itens e com `[side]="side"` ligado ao arg. Isso é o andaime da
 * story, não o que alguém escreve para usar o campo. O `transform` devolve o uso
 * real, com os valores atuais dos controls já resolvidos (ver a nota em
 * `separator.stories.ts`).
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<SelectArgs> }): string {
  const {
    size = 'default',
    side = 'bottom',
    align = 'start',
    placeholder = 'Selecione...',
    disabled = false,
    required = false,
    invalid = false,
  } = ctx.args ?? {};

  // Só o que difere do padrão entra: snippet que repete valor default ensina
  // ruído a quem copia.
  const root =
    ['<nds-select [(value)]="estado"']
      .concat(disabled ? ['disabled'] : [])
      .concat(required ? ['required'] : [])
      .concat(invalid ? ['invalid'] : [])
      .join(' ') + '>';

  const trigger =
    ['<button ndsSelectTrigger aria-label="Estado"']
      .concat(size === 'default' ? [] : [`size="${size}"`])
      .join(' ') + '>';

  const content =
    ['<ng-template ndsSelectContent']
      .concat(side === 'bottom' ? [] : [`side="${side}"`])
      .concat(align === 'start' ? [] : [`align="${align}"`])
      .join(' ') + '>';

  return `import { NDS_SELECT } from '@/components/ui/select';

@Component({
  imports: [...NDS_SELECT],
  template: \`
    ${root}
      ${trigger}
        <span ndsSelectValue placeholder="${placeholder}"></span>
      </button>

      ${content}
        <div ndsSelectItem value="sp">São Paulo</div>
        <div ndsSelectItem value="rj">Rio de Janeiro</div>
        <div ndsSelectItem value="mg">Minas Gerais</div>
      </ng-template>
    </nds-select>
  \`,
})
export class Exemplo {
  readonly estado = signal<string | undefined>(undefined);
}`;
}

const meta: Meta<SelectArgs> = {
  title: 'Primitives/Form/Select',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [...NDS_SELECT] })],
  parameters: {
    layout: 'centered',
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: { page: withAutoDocsTab(NdsSelectDocs) },
  },
  argTypes: {
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'sm'],
      description: 'Altura do gatilho — resultado de padding, nunca de altura fixa.',
    },
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado preferido de abertura da lista em relação ao gatilho.',
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento da lista no eixo perpendicular ao lado.',
    },
    placeholder: {
      control: 'text',
      description: 'Texto exibido enquanto nenhuma opção está escolhida.',
    },
    disabled: { control: 'boolean', description: 'Bloqueia o gatilho e impede a abertura.' },
    required: {
      control: 'boolean',
      description: 'Marca o campo como obrigatório (aria-required no gatilho).',
    },
    invalid: {
      control: 'boolean',
      description: 'Marca o campo como inválido (aria-invalid no gatilho).',
    },
    // Função em `args` sem entrada aqui NÃO chega ao template no renderer
    // Angular — o `(valueChange)` ficaria ligado a nada, sem erro nenhum.
    onValueChange: { control: false, table: { disable: true } },
  },
  args: {
    size: 'default',
    side: 'bottom',
    align: 'start',
    placeholder: 'Selecione...',
    disabled: false,
    required: false,
    invalid: false,
    onValueChange: fn(),
  },
};

export default meta;
type Story = StoryObj<SelectArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item5',
    ],
  },
  render: (args) => ({
    props: { ...args, states: STATES },
    template: `
      <nds-select
        [disabled]="disabled"
        [required]="required"
        [invalid]="invalid"
        (valueChange)="onValueChange($event)"
      >
        <button ndsSelectTrigger aria-label="Estado" [size]="size">
          <span ndsSelectValue [placeholder]="placeholder"></span>
        </button>

        <ng-template ndsSelectContent [side]="side" [align]="align">
          @for (state of states; track state.value) {
            <div ndsSelectItem [value]="state.value">{{ state.label }}</div>
          }
        </ng-template>
      </nds-select>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Estado' });

    await step('O gatilho é um combobox que anuncia a lista e o estado fechado', async () => {
      await expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
      await expect(trigger.getAttribute('aria-expanded')).toBe('false');
      // Fechado, a lista não existe no DOM — não é um painel escondido.
      await expect(within(document.body).queryAllByRole('listbox')).toHaveLength(0);
      await expect(trigger).toHaveTextContent('Selecione...');
    });

    await step('Clicar abre a lista com o primeiro item destacado', async () => {
      // Idempotente: o clique só acontece com a lista fechada, então o replay do
      // painel Interactions parte do mesmo estado da primeira rodada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);

      const list = await waitForPortal('listbox', { name: 'Estado' });
      await expect(trigger.getAttribute('aria-expanded')).toBe('true');

      const options = within(list).getAllByRole('option');
      await expect(options).toHaveLength(STATES.length);

      // Num listbox o teclado é do POPUP: os itens não recebem foco um a um, o
      // destaque anda por `aria-activedescendant`. Afirmar `document.activeElement`
      // aqui seria afirmar o padrão de MENU, que é outro.
      await waitFor(async () => {
        await expect(list.getAttribute('aria-activedescendant')).toBe(options[0].id);
      });
    });

    await step('Enter escolhe a opção destacada, fecha e devolve o foco', async () => {
      await userEvent.keyboard('{Enter}');
      await waitForPortalVanish('listbox');

      await expect(args.onValueChange).toHaveBeenCalledWith(STATES[0].value);
      // O gatilho passa a anunciar o rótulo escolhido, não mais o placeholder.
      await expect(trigger).toHaveTextContent(STATES[0].label);
      await expect(trigger.getAttribute('aria-expanded')).toBe('false');
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step('Escape fecha sem trocar a escolha e devolve o foco', async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      await waitForPortal('listbox', { name: 'Estado' });

      const callsBefore = (args.onValueChange as unknown as { mock: { calls: unknown[] } }).mock
        .calls.length;

      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('listbox');

      await expect(
        (args.onValueChange as unknown as { mock: { calls: unknown[] } }).mock.calls.length,
      ).toBe(callsBefore);
      await expect(trigger).toHaveTextContent(STATES[0].label);
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step('O gatilho tem anel de foco visível', async () => {
      // `outline: 0` na folha é intencional — o anel é `box-shadow`, e é sob
      // `:focus-visible` que ele existe. Medir a sombra computada prova que a
      // regra do CSS compartilhado chegou ao elemento, e não só que o foco chegou.
      trigger.blur();
      trigger.focus();
      await expect(trigger).toHaveFocus();
      await expect(trigger.matches(':focus-visible')).toBe(true);
      await expect(getComputedStyle(trigger).boxShadow).not.toBe('none');
    });
  },
};
