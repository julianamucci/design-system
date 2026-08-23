import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import { NdsRadioGroup, NdsRadioGroupItem } from './radio-group';
import { NdsLabel } from './label';
import { NdsRadioGroupDocs } from '@/components/docs/RadioGroupDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type RadioGroupArgs = {
  groupLabel: string;
  name: string;
  value: string;
  disabled: boolean;
  onValueChange: (value: string | null) => void;
};

/** Ver a nota em separator.stories.ts. */
function playgroundSource(_gerado: string, ctx: { args?: Partial<RadioGroupArgs> }): string {
  const { groupLabel = 'Forma de pagamento', name = 'payment', value = '', disabled = false } =
    ctx.args ?? {};

  // Só o que difere do default entra: snippet que repete valor padrão ensina ruído.
  const attrs = [
    `name="${name}"`,
    value ? `value="${value}"` : '',
    disabled ? '[disabled]="true"' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `import { NdsRadioGroup, NdsRadioGroupItem } from '@/components/ui/radio-group';
import { NdsLabel } from '@/components/ui/label';

@Component({
  imports: [NdsRadioGroup, NdsRadioGroupItem, NdsLabel],
  template: \`
    <p id="pagamento-titulo" class="nds-text-body nds-font-semibold">${groupLabel}</p>
    <fieldset ndsRadioGroup aria-labelledby="pagamento-titulo" ${attrs}>
      <div class="nds-radio-row">
        <button ndsRadioGroupItem value="cartao" id="cartao"></button>
        <label ndsLabel class="nds-radio-label" for="cartao">Cartão de crédito</label>
      </div>
      <div class="nds-radio-row">
        <button ndsRadioGroupItem value="pix" id="pix"></button>
        <label ndsLabel class="nds-radio-label" for="pix">Pix</label>
      </div>
    </fieldset>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<RadioGroupArgs> = {
  title: 'UI/RadioGroup',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [NdsRadioGroup, NdsRadioGroupItem, NdsLabel] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsRadioGroupDocs) },
  },
  argTypes: {
    groupLabel: {
      control: 'text',
      description: 'Texto que nomeia o grupo — associado por aria-labelledby.',
    },
    name: {
      control: 'text',
      description: 'Nome do campo no formulário HTML.',
    },
    value: {
      control: 'select',
      options: ['', 'cartao', 'pix', 'boleto'],
      description: 'Valor selecionado. É um model — aceita [(value)].',
    },
    disabled: { control: 'boolean', description: 'Desabilita todos os itens do grupo.' },
    // Função em `args` sem entrada aqui NÃO chega ao template no renderer
    // Angular — o `(valueChange)` ficaria ligado a nada, sem erro nenhum.
    onValueChange: { control: false, table: { disable: true } },
  },
  args: {
    groupLabel: 'Forma de pagamento',
    name: 'payment',
    value: '',
    disabled: false,
    onValueChange: fn(),
  },
};

export default meta;
type Story = StoryObj<RadioGroupArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'accessibility.item1',
      'accessibility.item4',
      'accessibility.item5',
    ],
    docs: { source: { transform: playgroundSource } },
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="nds-stack" data-spacing="xs">
        <p id="pg-titulo" class="nds-text-body nds-font-semibold">{{ groupLabel }}</p>
        <fieldset
          ndsRadioGroup
          aria-labelledby="pg-titulo"
          [name]="name"
          [value]="value"
          [disabled]="disabled"
          (valueChange)="onValueChange($event)"
        >
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="cartao" id="pg-cartao"></button>
            <label ndsLabel class="nds-radio-label" for="pg-cartao">Cartão de crédito</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="pix" id="pg-pix"></button>
            <label ndsLabel class="nds-radio-label" for="pg-pix">Pix</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="boleto" id="pg-boleto"></button>
            <label ndsLabel class="nds-radio-label" for="pg-boleto">Boleto bancário</label>
          </div>
        </fieldset>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const items = (): HTMLElement[] =>
      Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="radio-group-item"]'));

    await step('O grupo é um radiogroup com nome acessível', async () => {
      // O `role` vem do primitivo; o nome vem do <p> apontado por
      // aria-labelledby. Sem nome, o leitor de tela anuncia "grupo" e pronto.
      await expect(canvas.getByRole('radiogroup', { name: args.groupLabel })).toBeTruthy();
    });

    await step('Cada opção é um radio alcançável pelo rótulo', async () => {
      // getByRole com name prova que o <label for> chega ao <button>: se a
      // associação quebrar, o nome acessível some e esta busca falha.
      await expect(canvas.getAllByRole('radio')).toHaveLength(3);
      await expect(canvas.getByRole('radio', { name: 'Pix' })).toBeTruthy();
    });

    if (args.disabled) {
      await step('Grupo desabilitado bloqueia todos os itens', async () => {
        for (const r of canvas.getAllByRole('radio')) await expect(r).toBeDisabled();
      });
      return;
    }

    await step('Selecionar "Pix" marca só ele e avisa quem escuta', async () => {
      // Idempotente: selecionar um radio já marcado o mantém marcado, então o
      // replay do painel Interactions chega ao mesmo estado.
      const pix = canvas.getByRole('radio', { name: 'Pix' });
      await userEvent.click(pix);
      await expect(pix.getAttribute('aria-checked')).toBe('true');
      await expect(pix.getAttribute('data-state')).toBe('checked');
      const cartao = canvas.getByRole('radio', { name: 'Cartão de crédito' });
      await expect(cartao.getAttribute('aria-checked')).toBe('false');
      await expect(args.onValueChange).toHaveBeenCalledWith('pix');
    });

    await step('A escolha seguinte desmarca a anterior', async () => {
      // Exclusão mútua é a razão de existir do componente: sem ela, isto seria
      // um grupo de checkboxes. O par (Pix, depois Cartão) ainda garante um
      // clique real nesta rodada, venha o DOM de onde vier.
      const cartao = canvas.getByRole('radio', { name: 'Cartão de crédito' });
      await userEvent.click(cartao);
      await expect(cartao.getAttribute('aria-checked')).toBe('true');
      await expect(
        canvas.getByRole('radio', { name: 'Pix' }).getAttribute('aria-checked'),
      ).toBe('false');
    });

    await step('ArrowDown move o foco E seleciona o próximo item', async () => {
      // A tecla fica PRESSIONADA durante as asserções: o primitivo só seleciona
      // no foco enquanto a seta está em curso (ver a nota em
      // `radio-group-variantes.stories.ts`).
      const list = items();
      list[0].focus();
      await userEvent.keyboard('{ArrowDown>}');
      await waitFor(async () => {
        await expect(canvasElement.ownerDocument.activeElement).toBe(list[1]);
      });
      await waitFor(async () => {
        await expect(list[1].getAttribute('aria-checked')).toBe('true');
      });
      await userEvent.keyboard('{/ArrowDown}');
    });

    await step('ArrowUp circula do primeiro para o último', async () => {
      const list = items();
      list[0].focus();
      await userEvent.keyboard('{ArrowUp>}');
      await waitFor(async () => {
        await expect(canvasElement.ownerDocument.activeElement).toBe(list[2]);
      });
      await userEvent.keyboard('{/ArrowUp}');
    });

    await step('Roving tabindex: o Tab tem UMA parada no grupo inteiro', async () => {
      // Asserção sobre o CONJUNTO, não só sobre o ativo: exatamente um item na
      // ordem de tabulação, e é o escolhido. Sem isso o Tab percorreria opção
      // por opção em vez de sair do grupo.
      const order = items().map((el) => el.tabIndex);
      await expect(order.filter((t) => t === 0)).toHaveLength(1);
      const checked = items().findIndex((el) => el.getAttribute('aria-checked') === 'true');
      await expect(order[checked]).toBe(0);
    });
  },
};
