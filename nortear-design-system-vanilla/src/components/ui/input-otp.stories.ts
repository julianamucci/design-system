import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn } from 'storybook/test';
import { createInputOTP } from './input-otp';
import { wrap } from './input-otp.fixtures';
import { inputOtpSource } from './input-otp.source';
import { createInputOTPDocs } from '@/components/docs/InputOTPDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type InputOTPArgs = {
  length: number;
  disabled: boolean;
  invalid: boolean;
  withSeparator: boolean;
  'aria-label': string;
  onComplete: (codigo: string) => void;
};

const meta: Meta<InputOTPArgs> = {
  title: 'UI/InputOTP',
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createInputOTPDocs), source: { transform: inputOtpSource } },
  },
  argTypes: {
    length: {
      control: { type: 'number', min: 4, max: 8, step: 1 },
      description: 'Número total de slots/caracteres do código.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '—' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Bloqueia a interação em todos os slots e esmaece o campo.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description: 'Marca os slots com aria-invalid e pinta a borda de erro.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    withSeparator: {
      control: 'boolean',
      description:
        'Insere um separador no meio do código. Divergência idiomática do factory: os separadores vêm por índice na opção separatorAt, não por subcomponente.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    'aria-label': {
      control: 'text',
      description: 'Nome acessível do conjunto.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'Código de verificação' } },
    },
    onComplete: {
      control: false,
      description: 'Chamado quando todos os slots estão preenchidos.',
      table: { type: { summary: '(value: string) => void' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    length: 6,
    disabled: false,
    invalid: false,
    withSeparator: false,
    'aria-label': 'Código de verificação',
    onComplete: fn(),
  },
};

export default meta;
type Story = StoryObj<InputOTPArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const slotsDe = (raiz: HTMLElement): HTMLInputElement[] => [
  ...raiz.querySelectorAll<HTMLInputElement>('[data-slot="input-otp-slot"]'),
];

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'functional.item4', 'functional.item5',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
    ],
  },
  render: (args) => {
    const el = createInputOTP({
      length: args.length,
      disabled: args.disabled,
      invalid: args.invalid,
      'aria-label': args['aria-label'],
      separatorAt: args.withSeparator ? [Math.floor(args.length / 2)] : [],
      onComplete: (codigo) => args.onComplete(codigo),
    });
    return wrap(el);
  },
  play: async ({ canvasElement, step, args }) => {
    if (args.disabled) return;
    const canvas = within(canvasElement);
    const slots = () => slotsDe(canvasElement);

    await step('O conjunto tem um nome, e cada slot também', async () => {
      // Seis campos anônimos são o defeito clássico deste componente: o leitor
      // anuncia "editar" seis vezes sem dizer de quê. O nome do grupo situa; o
      // do slot diz em qual dígito a pessoa está.
      await expect(canvas.getByRole('group', { name: args['aria-label'] })).toBeTruthy();
      await expect(slots()).toHaveLength(args.length);
      await expect(slots()[2]).toHaveAttribute('aria-label', 'Dígito 3');
    });

    await step('Só o primeiro slot pede o código do SMS', async () => {
      // `one-time-code` nos seis faria o navegador oferecer o mesmo código em
      // cada campo; no primeiro, é o que aciona o autofill nativo.
      await expect(slots()[0]).toHaveAttribute('autocomplete', 'one-time-code');
      await expect(slots()[1]).toHaveAttribute('autocomplete', 'off');
      await expect(slots()[0]).toHaveAttribute('inputmode', 'numeric');
    });

    await step('Digitar avança para o próximo slot', async () => {
      slots()[0].focus();
      await userEvent.keyboard('12');
      await expect(slots()[0].value).toBe('1');
      await expect(slots()[1].value).toBe('2');
      await expect(slots()[2]).toHaveFocus();
    });

    await step('Setas movem o foco sem mexer no valor', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      await expect(slots()[1]).toHaveFocus();
      await expect(slots()[1].value).toBe('2');
      await userEvent.keyboard('{ArrowRight}');
      await expect(slots()[2]).toHaveFocus();
    });

    await step('Backspace apaga o slot preenchido e volta ao anterior', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      await expect(slots()[1].value).toBe('2');
      await userEvent.keyboard('{Backspace}');
      await expect(slots()[1].value).toBe('');
      await expect(slots()[0]).toHaveFocus();
    });

    await step('Colar distribui o código inteiro e dispara onComplete', async () => {
      const codigo = '123456'.slice(0, args.length);
      slots()[0].focus();
      await userEvent.paste(codigo);
      await expect(slots().map((s) => s.value).join('')).toBe(codigo);
      await expect(args.onComplete).toHaveBeenCalledWith(codigo);
    });
  },
};
