import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import { NdsInputOtp, type InputOtpMode } from './input-otp';
import { NdsInputOTPDocs } from '@/components/docs/InputOTPDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type InputOtpArgs = {
  maxLength: number;
  mode: InputOtpMode;
  disabled: boolean;
  invalid: boolean;
  label: string;
  onComplete: (code: string) => void;
};

/**
 * O painel Code imprime o `template` da story literalmente — com o binding de
 * arg e o rótulo de teste. Ver a armadilha 3 do CLAUDE.md deste stack.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<InputOtpArgs> }): string {
  const {
    maxLength = 6,
    mode = 'numeric',
    disabled = false,
    invalid = false,
    label = 'Código de verificação',
  } = ctx.args ?? {};

  const atributos = [
    `[maxLength]="${maxLength}"`,
    mode === 'alphanumeric' ? `mode="alphanumeric"` : '',
    disabled ? '[disabled]="true"' : '',
    invalid ? '[invalid]="true"' : '',
    'aria-labelledby="otp-label"',
    '[(value)]="codigo"',
    '(complete)="verificar($event)"',
  ].filter(Boolean).join('\n      ');

  return `import { Component, signal } from '@angular/core';
import { NdsInputOtp } from '@/components/ui/input-otp';

@Component({
  imports: [NdsInputOtp],
  template: \`
    <span id="otp-label" class="nds-text-label">${label}</span>
    <nds-input-otp
      ${atributos}
    ></nds-input-otp>
  \`,
})
export class Exemplo {
  readonly codigo = signal('');
  verificar(codigo: string): void {
    console.log(codigo);
  }
}`;
}

const meta: Meta<InputOtpArgs> = {
  title: 'UI/InputOTP',
  // Literal, e não `getCategoryTag('input-otp')`: o indexador do CSF lê as tags
  // por análise ESTÁTICA e recusa qualquer coisa que não seja string literal
  // ('CSF: Expected tag to be string literal'). O arquivo inteiro deixa de ser
  // indexado — e com ele a suíte inteira, porque o vitest não sobe.
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [NdsInputOtp] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsInputOTPDocs) },
  },
  argTypes: {
    maxLength: {
      control: { type: 'number', min: 4, max: 8 },
      description: 'Quantidade de caracteres do código.',
    },
    mode: {
      control: 'select',
      options: ['numeric', 'alphanumeric'],
      description: 'Conjunto aceito. Também escolhe o teclado do dispositivo.',
    },
    disabled: { control: 'boolean', description: 'Bloqueia a interação em todos os slots.' },
    invalid: { control: 'boolean', description: 'Marca os slots com aria-invalid.' },
    label: { control: 'text', description: 'Nome acessível do conjunto.' },
    // Função em `args` sem entrada em `argTypes` não chega ao template no
    // renderer Angular — o `(complete)` ficaria ligado a nada e o teste
    // acusaria o componente. Armadilha 5 do CLAUDE.md deste stack.
    onComplete: { control: false, table: { disable: true } },
  },
  args: {
    maxLength: 6,
    mode: 'numeric',
    disabled: false,
    invalid: false,
    label: 'Código de verificação',
    onComplete: fn(),
  },
};

export default meta;
type Story = StoryObj<InputOtpArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'functional.item4', 'functional.item5',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <span id="pg-otp-label" class="nds-text-label">{{ label }}</span>
        <nds-input-otp
          aria-labelledby="pg-otp-label"
          [maxLength]="maxLength"
          [mode]="mode"
          [disabled]="disabled"
          [invalid]="invalid"
          (complete)="onComplete($event)"
        ></nds-input-otp>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const slots = () => [
      ...canvasElement.querySelectorAll<HTMLInputElement>('[data-slot="input-otp-slot"]'),
    ];

    await step('O conjunto tem um nome, e cada slot também', async () => {
      // Seis campos anônimos são o defeito clássico deste componente: o leitor
      // anuncia "editar" seis vezes sem dizer de quê. O nome do grupo é o que
      // situa; o nome do slot é o que diz em qual dígito a pessoa está.
      const grupo = canvas.getByRole('group', { name: args.label });
      await expect(grupo).toBeTruthy();
      await expect(slots()).toHaveLength(args.maxLength);
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
      // Um toque por dígito: apaga o que está sob o cursor e recua. Parar no
      // slot recém-esvaziado custaria dois toques por dígito para refazer o
      // código, que é sempre o que se refaz.
      await userEvent.keyboard('{ArrowLeft}');
      await expect(slots()[1].value).toBe('2');
      await userEvent.keyboard('{Backspace}');
      await expect(slots()[1].value).toBe('');
      await expect(slots()[0]).toHaveFocus();
    });

    await step('Colar distribui o código inteiro e dispara complete', async () => {
      const code = '123456'.slice(0, args.maxLength);
      slots()[0].focus();
      await userEvent.paste(code);
      await waitFor(async () => {
        await expect(slots().map((s) => s.value).join('')).toBe(code);
      });
      await expect(args.onComplete).toHaveBeenCalledWith(code);
    });
  },
};
