import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, fn, userEvent, expect, waitFor } from 'storybook/test';
import { RadioGroup, RadioGroupItem } from './index';
import { Label } from '@/components/ui/label';
import RadioGroupDocs from '@/components/docs/RadioGroupDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(RadioGroupDocs) },
  },
  argTypes: {
    // Prop CONTROLADA: quem manda no valor é o v-model de quem compõe, e o
    // render não a encaminha. Documenta-se, não se controla.
    modelValue: {
      control: false,
      description: 'Valor selecionado (controlado). Use junto com o evento de mudança.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    // Prop de MONTAGEM: a lib só a lê ao montar, então o control precisa do
    // `:key` no render para remontar — sem isso trocar o control não muda nada.
    defaultValue: {
      control: 'select',
      options: ['', 'cartao', 'pix', 'boleto'],
      description: 'Valor inicial não-controlado, lido só na montagem.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita todos os itens do grupo.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Direção da navegação por setas — vira `aria-orientation` no grupo.',
      table: { type: { summary: '"vertical" | "horizontal"' }, defaultValue: { summary: '"vertical"' } },
    },
    name: {
      control: 'text',
      description: 'Nome do campo no formulário HTML.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    onUpdateModelValue: {
      control: false,
      description: 'Disparado ao trocar a seleção.',
      table: { type: { summary: '(value: string) => void' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    defaultValue: '',
    disabled: false,
    orientation: 'vertical',
    name: 'payment',
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Idempotente: só clica quando o item ainda não está marcado. Rádio é seleção
 * exclusiva — no replay do painel Interactions o DOM não remonta, então um
 * clique cego partiria do estado que a rodada anterior deixou.
 */
const escolher = async (alvo: HTMLElement): Promise<void> => {
  if (alvo.getAttribute('aria-checked') !== 'true') await userEvent.click(alvo);
  await waitFor(() => expect(alvo).toHaveAttribute('aria-checked', 'true'));
};

export const Playground: Story = {
  args: {
    'onUpdate:modelValue': fn(),
  } as never,
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'accessibility.item1',
      'accessibility.item4',
      'accessibility.item5',
    ],
  },
  render: (args) => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() { return { args }; },
    template: `
      <RadioGroup
        v-bind="args"
        :key="String(args.defaultValue)"
        aria-label="Forma de pagamento"
      >
        <div class="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="cartao" id="pg-cartao" />
          <Label :for="'pg-cartao'">Cartão de crédito</Label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="pix" id="pg-pix" />
          <Label :for="'pg-pix'">Pix</Label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="boleto" id="pg-boleto" />
          <Label :for="'pg-boleto'">Boleto bancário</Label>
        </div>
      </RadioGroup>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio') as HTMLElement[];

    await step('O grupo é um radiogroup com nome acessível', async () => {
      await expect(
        canvas.getByRole('radiogroup', { name: 'Forma de pagamento' }),
      ).toBeInTheDocument();
      await expect(radios).toHaveLength(3);
    });

    await step('Cada item é alcançável pelo rótulo', async () => {
      // `getByRole` com nome prova que o <Label for> chega ao item: se a
      // associação quebrar, o nome acessível some e a busca falha.
      await expect(canvas.getByRole('radio', { name: 'Cartão de crédito' })).toBeVisible();
      await expect(canvas.getByRole('radio', { name: 'Pix' })).toBeVisible();
      await expect(canvas.getByRole('radio', { name: 'Boleto bancário' })).toBeVisible();
    });

    if (args.disabled) {
      await step('Grupo desabilitado bloqueia todos os itens', async () => {
        for (const r of radios) await expect(r).toHaveAttribute('data-disabled');
      });
      return;
    }

    await step('Escolher Pix e depois Cartão prova o clique e a exclusão mútua', async () => {
      // O par garante um clique REAL nesta rodada, venha o DOM de onde vier — é
      // o que mantém a aba Actions honesta no replay.
      await escolher(radios[1]);
      await escolher(radios[0]);
      await expect(radios[1]).toHaveAttribute('aria-checked', 'false');
    });

    await step('ArrowDown move o foco E seleciona o próximo item', async () => {
      // A tecla fica PRESSIONADA durante as asserções (`{ArrowDown>}`): a lib
      // marca o item no `focus`, mas dentro de um `setTimeout(0)` guardado por
      // "a seta ainda está em curso". Com `{ArrowDown}` — pressiona e solta no
      // mesmo sopro — o keyup sintético às vezes chega antes desse timeout, e o
      // teste reprovava por corrida um comportamento que no teclado de verdade
      // funciona. Era um teste intermitente, não um defeito do componente.
      radios[0].focus();
      await userEvent.keyboard('{ArrowDown>}');
      await waitFor(() => expect(radios[1]).toHaveAttribute('aria-checked', 'true'));
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
      await userEvent.keyboard('{/ArrowDown}');
    });

    await step('ArrowUp circula do primeiro para o último', async () => {
      radios[0].focus();
      await userEvent.keyboard('{ArrowUp>}');
      await waitFor(() => expect(radios[2]).toHaveAttribute('aria-checked', 'true'));
      await userEvent.keyboard('{/ArrowUp}');
    });

    await step('Roving tabindex: o Tab tem UMA parada no grupo inteiro', async () => {
      // Asserção sobre o CONJUNTO, não só sobre o ativo: exatamente um item na
      // ordem de tabulação, e é o escolhido. Sem isso o Tab percorreria opção
      // por opção em vez de sair do grupo.
      const ordem = radios.map((r) => r.tabIndex);
      await expect(ordem.filter((t) => t === 0)).toHaveLength(1);
      const marcado = radios.findIndex((r) => r.getAttribute('aria-checked') === 'true');
      await expect(ordem[marcado]).toBe(0);
    });
  },
};
