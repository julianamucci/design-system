import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { createInputOTP } from './input-otp';
import { wrap } from './input-otp.fixtures';
import { inputOtpSource, inputOtpSourceWith } from './input-otp.source';

/**
 * Formatos de código. Cada story afirma o RESULTADO do que a diferencia —
 * número de slots, teclado, separador —, e não a aparência: o factory renderiza
 * com os defaults quando a opção não chega, e uma story que só olha a tela
 * passaria do mesmo jeito.
 */
const meta: Meta = {
  tags: ['form'],
  title: 'UI/InputOTP/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: inputOtpSource },
      description: {
        component:
          'Variantes do InputOTP: SixDigits (padrão SMS), FourDigits (PIN), WithSeparator (3+3) e Alphanumeric (código de autenticação). Divergência idiomática deste stack: o conjunto aceito vem da opção mode, e não de uma expressão regular passada de fora.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function withLabel(label: string, child: HTMLElement): HTMLElement {
  const col = document.createElement('div');
  col.className = 'nds-stack';
  col.dataset.spacing = 'sm';
  col.style.alignItems = 'center';
  const span = document.createElement('p');
  span.className = 'nds-text-caption nds-text-muted-foreground';
  span.textContent = label;
  col.append(span, child);
  return col;
}

const slotsDe = (raiz: HTMLElement): HTMLInputElement[] => [
  ...raiz.querySelectorAll<HTMLInputElement>('[data-slot="input-otp-slot"]'),
];

// ─── Stories ──────────────────────────────────────────────────────────────────

export const SixDigits: Story = {
  name: 'Six digits (SMS)',
  render: () =>
    wrap(withLabel('Código enviado por SMS', createInputOTP({ length: 6 }))),
  play: async ({ canvasElement, step }) => {
    await step('Seis slots, teclado numérico', async () => {
      const slots = slotsDe(canvasElement);
      await expect(slots).toHaveLength(6);
      await expect(slots[0]).toHaveAttribute('inputmode', 'numeric');
    });

    await step('Letra não entra no modo numérico', async () => {
      const slots = slotsDe(canvasElement);
      slots[0].focus();
      await userEvent.keyboard('a');
      await expect(slots[0].value).toBe('');
      await userEvent.keyboard('7');
      await expect(slots[0].value).toBe('7');
    });
  },
};

export const FourDigits: Story = {
  name: 'Four digits (PIN)',
  // `length` é o assunto da story: sem override o painel mostraria seis slots.
  parameters: { docs: { source: { transform: inputOtpSourceWith({ length: 4 }) } } },
  render: () => wrap(withLabel('PIN do aplicativo', createInputOTP({ length: 4 }))),
  play: async ({ canvasElement, step }) => {
    await step('O comprimento pedido chega ao componente', async () => {
      // Quatro e não seis: se a opção não chegasse, o default renderizaria seis
      // slots e nada no visual denunciaria.
      await expect(slotsDe(canvasElement)).toHaveLength(4);
    });

    await step('O quinto caractere não estoura o comprimento', async () => {
      // Um `<input maxlength="1">` por dígito: chegado ao fim, o foco fica no
      // último slot e o toque seguinte é ignorado — o código para em quatro
      // caracteres em vez de crescer ou de sobrescrever o que já estava lá.
      const slots = slotsDe(canvasElement);
      slots[0].focus();
      await userEvent.keyboard('12345');
      await expect(slots.map((s) => s.value).join('')).toBe('1234');
    });
  },
};

export const WithSeparator: Story = {
  name: 'With separator (3+3)',
  parameters: {
    covers: ['accessibility.item4', 'visual.item5'],
    docs: { source: { transform: inputOtpSourceWith({ separatorAt: [3] }) } },
  },
  render: () =>
    wrap(
      withLabel(
        'Código de recuperação',
        createInputOTP({ length: 6, separatorAt: [3] }),
      ),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O separador tem papel próprio, não é enfeite escondido', async () => {
      // `role="separator"` é o que informa ao leitor que o código vem em dois
      // blocos de três — seis dígitos ditos de enfiada são mais difíceis de
      // conferir contra a mensagem recebida.
      const separadores = canvas.getAllByRole('separator');
      await expect(separadores).toHaveLength(1);
    });

    await step('O separador fica entre o terceiro e o quarto slot', async () => {
      const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="input-otp"]')!;
      const filhos = [...raiz.children];
      const position = filhos.findIndex((el) => el.matches('[data-slot="input-otp-separator"]'));
      await expect(position).toBe(3);
      await expect(slotsDe(canvasElement)).toHaveLength(6);
    });

    await step('O separador afasta os dois blocos, e só eles', async () => {
      // Efeito computado, não nome de classe: o respiro é margem do separador.
      // Enquanto era `gap` do contêiner, ele caía também entre cada par de
      // slots e abria as caixas do meio, que não têm borda esquerda.
      const slots = slotsDe(canvasElement);
      const separator = canvasElement.querySelector<HTMLElement>(
        '[data-slot="input-otp-separator"]',
      )!;
      const folga = (a: Element, b: Element) =>
        Math.round(b.getBoundingClientRect().left - a.getBoundingClientRect().right);
      await expect(folga(slots[0], slots[1])).toBe(0);
      await expect(folga(slots[2], separator)).toBeGreaterThan(0);
      await expect(folga(separator, slots[3])).toBeGreaterThan(0);
    });
  },
};

export const Alphanumeric: Story = {
  parameters: { docs: { source: { transform: inputOtpSourceWith({ mode: 'alphanumeric' }) } } },
  render: () =>
    wrap(
      withLabel(
        'Código de autenticação',
        createInputOTP({ length: 6, mode: 'alphanumeric' }),
      ),
    ),
  play: async ({ canvasElement, step }) => {
    await step('O teclado do dispositivo passa a ser de texto', async () => {
      await expect(slotsDe(canvasElement)[0]).toHaveAttribute('inputmode', 'text');
    });

    await step('Letra e dígito são aceitos', async () => {
      const slots = slotsDe(canvasElement);
      slots[0].focus();
      await userEvent.keyboard('a9');
      await expect(slots[0].value).toBe('a');
      await expect(slots[1].value).toBe('9');
    });
  },
};
