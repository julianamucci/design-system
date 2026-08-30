import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import TooltipStory from './TooltipStory.svelte';
import { balaoDe } from './tooltip.fixtures';
import { tooltipOpenSource, tooltipControlledSource, tooltipSource } from './tooltip.source';

// Os estados que o conteúdo compartilhado descreve: fechado (o inicial), aberto,
// aberto por hover (depois do delay do provider) e aberto por foco (na hora). A
// diferença entre os dois últimos é o que a WCAG 1.4.13 cobra: o tooltip não
// pode depender do mouse.

/** Espera em ms que o hover do provider precisa vencer nas stories de delay. */
const LONG_DELAY = 600;

/** Pausa explícita — usada só onde a asserção é "continua assim depois de X". */
function wait(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

const meta: Meta = {
  title: 'Primitives/Overlay/Tooltip/States',
  component: TooltipStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; as duas que ensinam a
      // abertura sobrescrevem com a sua própria marcação logo abaixo.
      source: { transform: tooltipSource },
      description: {
        component:
          'Fechado é o padrão e o balão nem existe no DOM. Aberto pode vir do estado externo, do hover (depois do delay) ou do foco (imediato). Levar o mouse do gatilho até o balão não fecha nada — é a persistência que a WCAG 1.4.13 exige.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const baseArgs = {
  variant: 'default' as const,
  triggerLabel: 'Salvar',
  ariaLabel: 'Salvar',
  contentText: 'Salvar (Ctrl+S)',
};

export const Closed: Story = {
  args: { ...baseArgs, defaultOpen: false, delayDuration: 200 },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /salvar/i });

    await step('O balão não está no DOM, nem no canvas nem no portal', async () => {
      await expect(trigger).toBeVisible();
      await expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull();
      await expect(body.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    await step('Sem balão, não há describedby apontando para o vazio', async () => {
      // Um `aria-describedby` para um id ausente é violação de
      // `aria-valid-attr-value` — o mesmo axe que roda no addon-a11y da story.
      await expect(trigger.getAttribute('aria-describedby')).toBeNull();
    });
  },
};

export const Open: Story = {
  name: 'Open (defaultOpen)',
  args: { ...baseArgs, defaultOpen: true, delayDuration: 0 },
  parameters: { docs: { source: { transform: tooltipOpenSource } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /salvar/i });

    await step('O estado inicial abre o balão sem interação nenhuma', async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveAttribute('role', 'tooltip');
      await expect(balao).toHaveAttribute('data-slot', 'tooltip-content');
      await waitFor(async () => {
        await expect(balao).toBeVisible();
      });
    });

    await step('E o gatilho passa a apontar para ele', async () => {
      const target = document.getElementById(trigger.getAttribute('aria-describedby')!);
      await expect(balaoDe(trigger)!.contains(target)).toBe(true);
    });
  },
};

export const Hover: Story = {
  args: { ...baseArgs, defaultOpen: false, delayDuration: LONG_DELAY },
  parameters: { covers: ['functional.item1'] },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /salvar/i });

    await step('O mouse passando não abre — o delay separa passar de parar', async () => {
      await userEvent.hover(trigger);
      await expect(balaoDe(trigger)).toBeNull();
    });

    await step('Parado sobre o gatilho, o balão abre depois do delay', async () => {
      await waitFor(
        async () => {
          await expect(balaoDe(trigger)).not.toBeNull();
        },
        { timeout: LONG_DELAY * 5 },
      );
      await expect(balaoDe(trigger)).toHaveAttribute('role', 'tooltip');
    });
  },
};

export const KeyboardFocus: Story = {
  name: 'Keyboard focus (no delay)',
  args: { ...baseArgs, defaultOpen: false, delayDuration: LONG_DELAY },
  parameters: { covers: ['functional.item2'] },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /salvar/i });

    await step('O foco abre na hora, mesmo com o provider pedindo espera', async () => {
      // Quem chega por teclado não tem como "parar em cima": esperar o delay
      // aqui seria o mesmo que esconder a informação de quem não usa mouse.
      trigger.blur();
      trigger.focus();
      await expect(trigger).toHaveFocus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)).toHaveAttribute('role', 'tooltip');
    });

    await step('Sair do gatilho fecha o balão', async () => {
      trigger.blur();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).toBeNull();
      });
    });
  },
};

export const PersistenceInBubble: Story = {
  args: {
    ...baseArgs,
    defaultOpen: false,
    delayDuration: 0,
    triggerLabel: 'Compartilhar',
    ariaLabel: 'Compartilhar',
    contentText: 'Cria um link público de leitura',
    variant: 'longText' as const,
  },
  parameters: { covers: ['functional.item4'] },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /compartilhar/i });

    await step('O hover abre o balão', async () => {
      await userEvent.hover(trigger);
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
    });

    await step('Levar o ponteiro até o balão não fecha nada', async () => {
      const balao = balaoDe(trigger)!;
      // `pointerEventsCheck: 0` porque a folha compartilhada deixa o balão
      // `pointer-events: none` — quem segura a abertura é a área de tolerância
      // entre gatilho e balão, calculada por coordenada, não por hover no nó.
      await userEvent.hover(balao, { pointerEventsCheck: 0 });
      await wait(200);
      await expect(balaoDe(trigger)).not.toBeNull();
    });
  },
};

export const Controlled: Story = {
  name: 'Controlled (open prop)',
  args: { ...baseArgs, open: true, delayDuration: 0 },
  parameters: { docs: { source: { transform: tooltipControlledSource } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /salvar/i });

    await step('O estado externo abre o balão sem interação nenhuma', async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)).toHaveAttribute('role', 'tooltip');
    });

    await step('Escape fecha o balão mantendo o foco onde estava', async () => {
      trigger.focus();
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(balaoDe(trigger)).toBeNull();
      });
      await expect(trigger).toHaveFocus();
    });
  },
};
