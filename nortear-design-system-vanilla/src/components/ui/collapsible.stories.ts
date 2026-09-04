import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, waitFor, within, expect, fn } from 'storybook/test';
import { createCollapsible } from './collapsible';
import { collapsibleSource } from './collapsible.source';
import { createCollapsibleDocs } from '@/components/docs/CollapsibleDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type CollapsibleArgs = {
  defaultOpen: boolean;
  disabled: boolean;
  onOpenChange: (open: boolean) => void;
};

// Não exportar: o indexer do Storybook publica todo export nomeado de um
// .stories.* como story.
const PANEL_CLASSES =
  'nds-stack nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-mt-2';

const meta: Meta<CollapsibleArgs> = {
  title: 'Components/Disclosure/Collapsible',
  tags: ['autodocs', 'disclosure'],
  parameters: {
    docs: {
      page: withAutoDocsTab(createCollapsibleDocs),
      // O painel Code mostra a chamada da fábrica, e não o `outerHTML` do
      // wrapper. A transform cascateia para todas as stories deste arquivo.
      source: { transform: collapsibleSource },
    },
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial aberto (modo não-controlado)',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o trigger impedindo interação',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    // Sem entrada aqui o callback fica fora da aba API Reference, mesmo estando
    // em args e alimentando a aba Actions.
    onOpenChange: {
      control: false,
      description: 'Chamado a cada alternância, com o novo estado',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    defaultOpen: false,
    disabled: false,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<CollapsibleArgs>;

// Idempotentes: o painel Interactions reexecuta a play no MESMO DOM, então o
// estado de partida é o que a rodada anterior deixou. Um clique cego ALTERNA —
// a partir do estado errado ele inverte o resultado e a asserção seguinte falha.
const open = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
};
const close = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'false') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'false'));
};

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => {
    const content = document.createElement('div');
    content.className = PANEL_CLASSES;
    content.dataset.spacing = 'sm';
    for (const text of ['Filtro avançado 1', 'Filtro avançado 2']) {
      const p = document.createElement('p');
      p.textContent = text;
      content.appendChild(p);
    }

    return createCollapsible({
      trigger: 'Exibir filtros avançados',
      content,
      defaultOpen: args.defaultOpen,
      disabled: args.disabled,
      onOpenChange: args.onOpenChange,
      class: 'nds-w-sm',
    });
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    const panel = canvasElement.querySelector<HTMLElement>(
      '[data-slot="collapsible-content"]',
    )!;

    await step('Trigger está presente e visível', async () => {
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toBeVisible();
    });

    if (args.disabled) {
      await step('Desabilitado, o trigger não responde ao clique', async () => {
        const antes = trigger.getAttribute('aria-expanded');
        await userEvent.click(trigger, { pointerEventsCheck: 0 });
        await expect(trigger.getAttribute('aria-expanded')).toBe(antes);
      });
      return;
    }

    await step('Clicar no trigger abre o painel', async () => {
      // fechar/abrir e não só abrir: o par garante um clique REAL nesta rodada,
      // que é o que a contagem do spy abaixo mede.
      await close(trigger);
      const spy = args.onOpenChange as unknown as ReturnType<typeof fn>;
      const antes = spy.mock.calls.length;
      await open(trigger);
      // Nesta stack o painel NÃO sai do DOM: alterna `hidden` + `aria-hidden`.
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('aria-hidden', 'false');
      await expect(spy.mock.calls.length).toBe(antes + 1);
    });

    await step('Aberto, aria-controls aponta para o id real do painel', async () => {
      const id = trigger.getAttribute('aria-controls');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(panel);
    });

    await step('Enter alterna o painel', async () => {
      await close(trigger);
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Space alterna o painel, idêntico a Enter', async () => {
      await close(trigger);
      trigger.focus();
      await userEvent.keyboard(' ');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar novamente fecha o painel', async () => {
      // Último passo de propósito: a story declara visual.item1 (fechado por
      // padrão), e é o quadro final que o Chromatic fotografa e o axe varre.
      await open(trigger);
      await close(trigger);
      await expect(panel).not.toBeVisible();
    });
  },
};
