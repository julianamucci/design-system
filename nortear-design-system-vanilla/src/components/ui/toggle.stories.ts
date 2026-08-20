import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn } from 'storybook/test';
import { Bold, Eye } from 'lucide';
import { createToggle } from './toggle';
import { createToggleDocs } from '@/components/docs/ToggleDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Lucide → SVG (vanilla) ───────────────────────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

function buildLucideSvg(icon: unknown, className?: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  // O ícone reforça o rótulo, nunca o substitui: quem compõe dá o nome
  // acessível no `aria-label` do botão ou no texto visível.
  svg.setAttribute('aria-hidden', 'true');
  // Sem classe por padrão: a medida do ícone já vive em `.nds-toggle > svg`, e
  // uma classe aqui competiria com ela.
  if (className) svg.setAttribute('class', className);
  for (const [tag, attrs] of icon as unknown as LucideIconNode[]) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ToggleArgs = {
  pressed: boolean;
  disabled: boolean;
  variant: 'default' | 'outline';
  size: 'default' | 'sm' | 'lg';
  label: string;
  ariaLabel: string;
  onClick?: (pressed: boolean) => void;
};

const meta: Meta<ToggleArgs> = {
  title: 'UI/Toggle',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createToggleDocs) },
  },
  argTypes: {
    // A factory re-executa a cada mudança de control, então este é ao mesmo
    // tempo o estado inicial e o único jeito de partir ligado — não há prop
    // controlada separada aqui.
    pressed: {
      control: 'boolean',
      description: 'Estado inicial pressionado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o controle.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    variant: {
      control: { type: 'inline-radio' },
      options: ['default', 'outline'],
      description: 'Estilo visual. "outline" acrescenta borda.',
      table: { type: { summary: '"default" | "outline"' }, defaultValue: { summary: '"default"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'sm', 'lg'],
      description: 'Degrau de densidade: piso de altura e recuo lateral.',
      table: {
        type: { summary: '"default" | "sm" | "lg"' },
        defaultValue: { summary: '"default"' },
      },
    },
    label: {
      control: 'text',
      description: 'Texto visível ao lado do ícone. Vazio = toggle icon-only.',
      table: { type: { summary: 'string' } },
    },
    ariaLabel: {
      control: 'text',
      description: 'Nome acessível — obrigatório em toggles sem texto visível.',
      table: { type: { summary: 'string' } },
    },
    onClick: {
      control: false,
      description: 'Disparado ao alternar, com o novo estado.',
      table: { type: { summary: '(pressed: boolean) => void' } },
    },
  },
  args: {
    pressed: false,
    disabled: false,
    variant: 'default',
    size: 'default',
    label: '',
    ariaLabel: 'Negrito',
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<ToggleArgs>;

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildPlaygroundToggle(args: ToggleArgs): HTMLElement {
  // Ícone e texto são filhos DIRETOS, como nas outras stacks: o espaço entre
  // eles é o `gap` do próprio `.nds-toggle`.
  const children = args.label ? [buildLucideSvg(Eye), args.label] : [buildLucideSvg(Bold)];

  const btn = createToggle({
    pressed: args.pressed,
    disabled: args.disabled,
    variant: args.variant,
    size: args.size,
    onClick: args.onClick,
    children,
    // Nome acessível vem do rótulo quando não há texto visível — opção da
    // factory, e não um `setAttribute` depois de construir.
    'aria-label': args.label ? undefined : args.ariaLabel || undefined,
  });

  return btn;
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'accessibility.item1',
      'accessibility.item4',
    ],
  },
  render: (args) => buildPlaygroundToggle(args),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button');

    await step('É um <button> de verdade, com a classe do design system', async () => {
      await expect(btn.tagName).toBe('BUTTON');
      await expect(btn).toHaveClass(/nds-toggle/);
      await expect(btn).toHaveAttribute('data-slot', 'toggle');
    });

    await step('Variante e tamanho viram data-attribute, e "default" é a ausência', async () => {
      await expect(btn.getAttribute('data-variant')).toBe(
        args.variant === 'default' ? null : args.variant,
      );
      await expect(btn.getAttribute('data-size')).toBe(
        args.size === 'default' ? null : args.size,
      );
    });

    await step('O nome acessível existe nos dois modos', async () => {
      const nome = args.label ? btn.textContent?.trim() : btn.getAttribute('aria-label');
      await expect(nome).toBeTruthy();
      // Sem texto visível, o nome só pode vir da OPÇÃO `aria-label`: é ela que
      // tem de produzir o atributo, e não um retoque no elemento retornado.
      if (!args.label) await expect(btn).toHaveAttribute('aria-label', args.ariaLabel);
      // Ícone decorativo: quem lê a tela não deve ouvi-lo duas vezes.
      await expect(btn.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O alvo de toque cabe no mínimo de 24px (WCAG 2.5.8)', async () => {
      const caixa = btn.getBoundingClientRect();
      await expect(caixa.width).toBeGreaterThanOrEqual(24);
      await expect(caixa.height).toBeGreaterThanOrEqual(24);
    });

    if (!args.disabled) {
      await step('O clique alterna o estado e emite o novo valor', async () => {
        // Lido antes e comparado depois: reexecutar a play no painel
        // Interactions parte do estado que a rodada anterior deixou, e uma
        // asserção absoluta inverteria de rodada em rodada.
        const antes = btn.getAttribute('aria-pressed');
        await userEvent.click(btn);
        const depois = btn.getAttribute('aria-pressed');
        await expect(depois).not.toBe(antes);
        await expect(btn.getAttribute('data-state')).toBe(depois === 'true' ? 'on' : 'off');
        await expect(args.onClick).toHaveBeenCalledWith(depois === 'true');
      });

      await step('Space alterna, com o mesmo resultado do clique', async () => {
        (btn as HTMLElement).focus();
        await expect(btn).toHaveFocus();
        const antes = btn.getAttribute('aria-pressed');
        await userEvent.keyboard(' ');
        await expect(btn.getAttribute('aria-pressed')).not.toBe(antes);
      });

      await step('Enter alterna, idêntico a Space', async () => {
        const antes = btn.getAttribute('aria-pressed');
        await userEvent.keyboard('{Enter}');
        await expect(btn.getAttribute('aria-pressed')).not.toBe(antes);
      });
    }
  },
};
