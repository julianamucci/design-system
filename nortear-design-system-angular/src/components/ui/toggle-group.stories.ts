import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, fn } from 'storybook/test';
import { NdsToggle } from './toggle';
import {
  NdsToggleGroup,
  NdsToggleGroupIcon,
} from './toggle-group';
import { NdsToggleGroupDocs } from '@/components/docs/ToggleGroupDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { LABELS } from './toggle-group.fixtures';
import { toggleGroupPlaygroundSource, type ToggleGroupArgs } from './toggle-group.source';

const meta: Meta<ToggleGroupArgs> = {
  title: 'Primitives/Form/ToggleGroup',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [NdsToggleGroup, NdsToggleGroupIcon, NdsToggle] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsToggleGroupDocs) },
  },
  argTypes: {
    type: {
      control: 'inline-radio',
      options: ['single', 'multiple'],
      description: 'Modo de seleção. Exclusivo devolve string; combinado devolve lista.',
    },
    variant: {
      control: 'inline-radio',
      options: ['default', 'outline'],
      description: 'Estilo do conjunto. "outline" emenda os itens num container só.',
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      description: 'Direção do empilhamento e das setas de navegação.',
    },
    disabled: { control: 'boolean', description: 'Desabilita o grupo inteiro.' },
    ariaLabel: {
      control: 'text',
      description: 'Nome acessível do grupo — obrigatório, descreve a categoria.',
    },
    // Sem entrada em argTypes o renderer Angular não repassa a função em
    // `props`, e o `(valueChange)` do template fica ligado a nada — sem erro.
    onValueChange: {
      control: false,
      description: 'Emitido ao trocar a seleção, com o novo valor.',
      table: { type: { summary: '(value: string | string[]) => void' } },
    },
  },
  args: {
    type: 'single',
    variant: 'outline',
    orientation: 'horizontal',
    disabled: false,
    ariaLabel: 'Alinhamento do texto',
    onValueChange: fn(),
  },
};

export default meta;
type Story = StoryObj<ToggleGroupArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: toggleGroupPlaygroundSource } },
    covers: [
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item4',
      'accessibility.item5',
    ],
  },
  render: (args) => ({
    props: {
      ...args,
      rotulos: LABELS,
      // A forma do valor inicial acompanha o modo: string no exclusivo, lista
      // no combinado. É a mesma regra que o componente aplica ao emitir.
      valueInitial: args.type === 'single' ? 'left' : ['left'],
    },
    template: `
      <div
        ndsToggleGroup
        [type]="type"
        [variant]="variant"
        [orientation]="orientation"
        [disabled]="disabled"
        [defaultValue]="valueInitial"
        [attr.aria-label]="ariaLabel"
        (valueChange)="onValueChange($event)"
      >
        <button ndsToggle [variant]="variant" value="left" [attr.aria-label]="rotulos.left">
          <svg ndsToggleGroupIcon kind="align-left"></svg>
        </button>
        <button ndsToggle [variant]="variant" value="center" [attr.aria-label]="rotulos.center">
          <svg ndsToggleGroupIcon kind="align-center"></svg>
        </button>
        <button ndsToggle [variant]="variant" value="right" [attr.aria-label]="rotulos.right">
          <svg ndsToggleGroupIcon kind="align-right"></svg>
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('toolbar');
    const esquerda = canvas.getByRole('button', { name: LABELS.left });
    const center = canvas.getByRole('button', { name: LABELS.center });
    const direita = canvas.getByRole('button', { name: LABELS.right });

    await step('O grupo é uma barra de ferramentas nomeada', async () => {
      await expect(group.tagName).toBe('DIV');
      await expect(group).toHaveClass(/nds-toggle-group/);
      await expect(group).toHaveAttribute('data-slot', 'toggle-group');
      // accessibility.item5 — sem nome, o leitor anuncia só "barra de ferramentas".
      await expect(group).toHaveAttribute('aria-label', args.ariaLabel);
    });

    await step('Orientação e variante viram atributo, e "default" é a ausência', async () => {
      // Esta é a asserção que prova o binding de input: sob JIT o componente
      // renderiza nos defaults e nenhum destes atributos acompanharia o control.
      await expect(group).toHaveAttribute('data-orientation', args.orientation);
      await expect(group).toHaveAttribute('aria-orientation', args.orientation);
      await expect(group.getAttribute('data-variant')).toBe(
        args.variant === 'default' ? null : args.variant,
      );
    });

    await step('Cada item tem nome próprio, e o ícone não é lido', async () => {
      for (const [button, name] of [
        [esquerda, LABELS.left],
        [center, LABELS.center],
        [direita, LABELS.right],
      ] as const) {
        await expect(button).toHaveAttribute('aria-label', name);
        await expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      }
    });

    await step('accessibility.item4 — aria-pressed e data-state contam a mesma história', async () => {
      // `aria-pressed` vem do primitivo; `data-state` é o contrato de markup das
      // outras stacks. Ler o par junto é o que impede os dois de divergirem.
      for (const button of [esquerda, center, direita]) {
        const ligado = button.getAttribute('aria-pressed') === 'true';
        await expect(button).toHaveAttribute('data-state', ligado ? 'on' : 'off');
      }
      // O valor inicial do grupo chega ao item: exatamente um pressionado.
      const pressionados = [esquerda, center, direita].filter(
        (b) => b.getAttribute('aria-pressed') === 'true',
      );
      await expect(pressionados).toHaveLength(1);
    });

    if (args.disabled) {
      await step('Grupo desabilitado propaga o estado a cada item', async () => {
        await expect(group).toHaveAttribute('data-disabled', '');
        for (const button of [esquerda, center, direita]) {
          await expect(button).toBeDisabled();
        }
      });
      return;
    }

    await step('Um único item na ordem de tabulação (roving tabindex)', async () => {
      const inOrder = [esquerda, center, direita].filter((b) => b.tabIndex === 0);
      await expect(inOrder).toHaveLength(1);
    });

    await step('functional.item3 — a seta move o foco sem ativar nada', async () => {
      const antes = [esquerda, center, direita].map((b) => b.getAttribute('aria-pressed'));
      esquerda.focus();
      // Vertical navega por ↓/↑; horizontal por →/←. É a orientação que o
      // composite recebeu — testar a tecla errada passaria por acidente.
      await userEvent.keyboard(args.orientation === 'vertical' ? '{ArrowDown}' : '{ArrowRight}');
      await expect(center).toHaveFocus();
      const depois = [esquerda, center, direita].map((b) => b.getAttribute('aria-pressed'));
      await expect(depois).toEqual(antes);
    });

    await step('Home e End alcançam as pontas', async () => {
      await userEvent.keyboard('{End}');
      await expect(direita).toHaveFocus();
      await userEvent.keyboard('{Home}');
      await expect(esquerda).toHaveFocus();
    });

    await step('functional.item4 — Space alterna o item focado', async () => {
      // Lido antes e comparado depois: reexecutar a play no painel Interactions
      // parte do estado que a rodada anterior deixou, e uma asserção absoluta
      // inverteria de rodada em rodada.
      center.focus();
      const antes = center.getAttribute('aria-pressed');
      await userEvent.keyboard(' ');
      const depois = center.getAttribute('aria-pressed');
      await expect(depois).not.toBe(antes);
      await expect(center.getAttribute('data-state')).toBe(depois === 'true' ? 'on' : 'off');
      await expect(args.onValueChange).toHaveBeenCalled();
    });

    await step('Enter alterna, idêntico a Space', async () => {
      const antes = center.getAttribute('aria-pressed');
      await userEvent.keyboard('{Enter}');
      await expect(center.getAttribute('aria-pressed')).not.toBe(antes);
    });

    await step('Seleção devolvida ao estado inicial', async () => {
      // O painel Interactions reexecuta a play no MESMO DOM. No modo exclusivo
      // o par Space+Enter termina sem nenhum item ativo, e a asserção de
      // "exatamente um pressionado" (accessibility.item4) mediria a sobra da
      // rodada anterior.
      if (esquerda.getAttribute('aria-pressed') !== 'true') await userEvent.click(esquerda);
      await expect(esquerda).toHaveAttribute('aria-pressed', 'true');
    });
  },
};
