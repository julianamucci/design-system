import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, fn } from 'storybook/test';
import { Toggle } from './index';
import ToggleStory from './ToggleStory.svelte';
import ToggleDocs from '@/components/docs/ToggleDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { toggleSource } from './toggle.source';

type ToggleArgs = {
  pressed?: boolean;
  disabled?: boolean;
  ariaInvalid?: boolean;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  icon?: 'bold' | 'italic' | 'underline' | 'list' | 'eye' | 'layout';
  label?: string;
  ariaLabel?: string;
  withLabel?: boolean;
  onPressedChange?: (pressed: boolean) => void;
};

const meta: Meta<ToggleArgs> = {
  title: 'UI/Toggle',
  component: Toggle,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: {
      page: withAutoDocsTab(ToggleDocs),
      source: { transform: toggleSource },
    },
    layout: 'centered',
  },
  argTypes: {
    // Neste stack `pressed` é o MESMO prop para estado inicial e controlado —
    // a lib não separa os dois, então o control é vivo e não precisa de
    // re-montagem.
    pressed: {
      control: 'boolean',
      description: 'Estado do toggle. Serve como valor inicial e como estado controlado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o controle.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ariaInvalid: {
      control: 'boolean',
      description: 'Aplica aria-invalid para estado de erro.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    variant: {
      control: 'select',
      options: ['default', 'outline'],
      description: 'Estilo visual. "outline" acrescenta borda.',
      table: { type: { summary: '"default" | "outline"' }, defaultValue: { summary: '"default"' } },
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
      description: 'Degrau de densidade: piso de altura e recuo lateral.',
      table: {
        type: { summary: '"default" | "sm" | "lg"' },
        defaultValue: { summary: '"default"' },
      },
    },
    icon: {
      control: 'select',
      options: ['bold', 'italic', 'underline', 'list', 'eye', 'layout'],
      description: 'Ícone interno, sempre decorativo.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"bold"' } },
    },
    label: {
      control: 'text',
      description: 'Texto do rótulo, visível quando há rótulo.',
      table: { type: { summary: 'string' } },
    },
    ariaLabel: {
      control: 'text',
      description: 'Nome acessível — obrigatório quando não há texto visível.',
      table: { type: { summary: 'string' } },
    },
    withLabel: {
      control: 'boolean',
      description: 'Renderiza texto visível ao lado do ícone.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    onPressedChange: {
      control: false,
      description: 'Disparado ao alternar, com o novo estado.',
      table: { type: { summary: '(pressed: boolean) => void' } },
    },
  },
  args: {
    pressed: false,
    disabled: false,
    ariaInvalid: false,
    variant: 'default',
    size: 'default',
    icon: 'bold',
    label: 'Negrito',
    ariaLabel: 'Negrito',
    withLabel: false,
    onPressedChange: fn(),
  },
};

export default meta;
type Story = StoryObj<ToggleArgs>;

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
  render: (args) => ({
    Component: ToggleStory,
    props: { ...args },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button');

    await step('É um <button> de verdade, com a classe do design system', async () => {
      await expect(toggle.tagName).toBe('BUTTON');
      await expect(toggle).toHaveClass(/nds-toggle/);
      await expect(toggle).toHaveAttribute('data-slot', 'toggle');
    });

    await step('Variante e tamanho viram data-attribute, e "default" é a ausência', async () => {
      await expect(toggle.getAttribute('data-variant')).toBe(
        args.variant === 'default' ? null : args.variant,
      );
      await expect(toggle.getAttribute('data-size')).toBe(
        args.size === 'default' ? null : args.size,
      );
    });

    await step('O nome acessível existe nos dois modos', async () => {
      const name = args.withLabel ? toggle.textContent?.trim() : toggle.getAttribute('aria-label');
      await expect(name).toBeTruthy();
      // Ícone decorativo: quem lê a tela não deve ouvi-lo duas vezes.
      await expect(toggle.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O alvo de toque cabe no mínimo de 24px (WCAG 2.5.8)', async () => {
      const box = toggle.getBoundingClientRect();
      await expect(box.width).toBeGreaterThanOrEqual(24);
      await expect(box.height).toBeGreaterThanOrEqual(24);
    });

    if (!args.disabled) {
      await step('O clique alterna o estado e emite o novo valor', async () => {
        // Lido antes e comparado depois: reexecutar a play no painel
        // Interactions parte do estado que a rodada anterior deixou, e uma
        // asserção absoluta inverteria de rodada em rodada.
        const antes = toggle.getAttribute('aria-pressed');
        await userEvent.click(toggle);
        const depois = toggle.getAttribute('aria-pressed');
        await expect(depois).not.toBe(antes);
        await expect(toggle.getAttribute('data-state')).toBe(depois === 'true' ? 'on' : 'off');
        await expect(args.onPressedChange).toHaveBeenCalledWith(depois === 'true');
      });

      await step('Space alterna, com o mesmo resultado do clique', async () => {
        toggle.focus();
        await expect(toggle).toHaveFocus();
        const antes = toggle.getAttribute('aria-pressed');
        await userEvent.keyboard(' ');
        await expect(toggle.getAttribute('aria-pressed')).not.toBe(antes);
      });

      await step('Enter alterna, idêntico a Space', async () => {
        const antes = toggle.getAttribute('aria-pressed');
        await userEvent.keyboard('{Enter}');
        await expect(toggle.getAttribute('aria-pressed')).not.toBe(antes);
      });
    }
  },
};
