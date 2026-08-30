import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { createPopover } from './popover';
import { open, panel } from './popover.fixtures';
import { popoverSource } from './popover.source';
import { createButton } from './button';
import { createPopoverDocs } from '@/components/docs/PopoverDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type PopoverArgs = {
  triggerLabel: string;
  title: string;
  description: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  defaultOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const meta: Meta<PopoverArgs> = {
  title: 'Primitives/Overlay/Popover',
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createPopoverDocs), source: { transform: popoverSource } },
  },
  argTypes: {
    triggerLabel: {
      control: 'text',
      description: 'Texto do PopoverTrigger.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'Abrir popover' } },
    },
    title: {
      control: 'text',
      description: 'Título exibido no header. Vira o nome acessível do painel.',
      table: { type: { summary: 'string' } },
    },
    description: {
      control: 'text',
      description: 'Descrição opcional abaixo do título.',
      table: { type: { summary: 'string' } },
    },
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado de abertura do Content.',
      table: { type: { summary: '"top" | "bottom" | "left" | "right"' }, defaultValue: { summary: '"bottom"' } },
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento ao longo do eixo de side.',
      table: { type: { summary: '"start" | "center" | "end"' }, defaultValue: { summary: '"center"' } },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Abre o popover ao montar.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    onOpenChange: {
      control: false,
      description: 'Callback disparado a cada abertura e fechamento, com o novo estado.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    triggerLabel: 'Abrir popover',
    title: 'Configuracoes de exibição',
    description: 'Ajuste a aparência do conteúdo da página.',
    side: 'bottom',
    align: 'center',
    defaultOpen: false,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<PopoverArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildContent(args: PopoverArgs): HTMLElement {
  const content = document.createElement('div');
  content.className = 'nds-stack';
  content.dataset.spacing = 'sm';

  const header = document.createElement('div');
  header.className = 'nds-stack';
  header.dataset.spacing = 'xs';

  const title = document.createElement('h4');
  title.className = 'nds-popover-title';
  title.dataset.slot = 'popover-title';
  title.textContent = args.title;

  const desc = document.createElement('p');
  desc.className = 'nds-popover-description';
  desc.dataset.slot = 'popover-description';
  desc.textContent = args.description;

  header.append(title, desc);

  const actions = document.createElement('div');
  actions.className = 'nds-cluster';
  actions.dataset.spacing = 'sm';
  actions.dataset.justify = 'end';
  actions.append(
    createButton({ variant: 'ghost', size: 'sm', label: 'Cancelar' }),
    createButton({ variant: 'default', size: 'sm', label: 'Salvar' }),
  );

  content.append(header, actions);
  return content;
}

/** Fecha só se estiver aberto. */
async function close(trigger: HTMLElement): Promise<void> {
  if (trigger.getAttribute('aria-expanded') === 'true') await userEvent.click(trigger);
  await waitFor(() => {
    if (panel()) throw new Error('popover ainda aberto');
  }, { timeout: 1000 });
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'accessibility.item4',
    ],
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.contain = 'layout';
    container.className = 'nds-stack nds-w-full';
    container.dataset.spacing = 'md';
    container.dataset.align = 'center';
    container.style.minHeight = '300px';

    const trigger = createButton({ variant: 'outline', label: args.triggerLabel });
    const el = createPopover({
      trigger,
      content: buildContent(args),
      side: args.side,
      align: args.align,
      onOpenChange: args.onOpenChange,
    });

    // Alvo inerte para o teste de dispensa: clicar em `document.body` depende
    // da geometria da página e do ponto exato do clique sintético — clicar num
    // elemento real fora do painel é o que prova a regra.
    const externo = document.createElement('p');
    externo.className = 'nds-text-body nds-text-muted-foreground';
    externo.dataset.testid = 'area-externa';
    externo.textContent = 'Área externa';

    container.append(el, externo);

    if (args.defaultOpen) {
      queueMicrotask(() => trigger.click());
    }
    return container;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const triggerRe = new RegExp(args.triggerLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const trigger = canvas.getByRole('button', { name: triggerRe });

    await step('O gatilho anuncia que abre um diálogo', async () => {
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('data-slot', 'popover-trigger');
    });

    await step('Clicar no gatilho abre o painel com role=dialog', async () => {
      await close(trigger);
      const callsBefore = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      const p = await open(trigger);
      await expect(p).toHaveAttribute('role', 'dialog');
      await expect(p).toHaveClass(/nds-popover-content/);
      await expect(p).toHaveAttribute('data-state', 'open');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBe(callsBefore + 1);
    });

    await step('Aberto, aria-controls aponta para o id real do painel', async () => {
      const id = trigger.getAttribute('aria-controls');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(panel());
    });

    await step('A folha governa o layout do painel, não o posicionador', async () => {
      // O posicionador media o painel forçando `display: block` inline e DEIXAVA
      // a declaração. Inline vence a folha, então `.nds-popover-content` perdia
      // o `display: flex` e, com ele, o `gap` de 10px entre os filhos diretos —
      // esta stack ficava sem o respiro que as outras quatro têm, sem erro
      // nenhum e sem nada no DOM denunciando.
      //
      // A medição é do valor COMPUTADO, não da classe: classe presente com
      // declaração inline por cima é exatamente o caso que passava despercebido.
      const estilo = getComputedStyle(panel()!);
      await expect(estilo.display).toBe('flex');
      await expect(estilo.flexDirection).toBe('column');
      await expect(parseFloat(estilo.rowGap)).toBeGreaterThan(0);
    });

    await step('O painel não é modal', async () => {
      // Popover não bloqueia o resto da página: `aria-modal` faria o leitor de
      // tela esconder tudo o que está fora dele, que é contrato de Dialog.
      await expect(panel()).not.toHaveAttribute('aria-modal');
    });

    await step('O foco entra no painel ao abrir', async () => {
      await waitFor(() => {
        if (!panel()!.contains(document.activeElement)) {
          throw new Error('foco não entrou no painel');
        }
      });
      // Primeiro focável, não um qualquer: é o que a tabela de estados promete.
      await expect(document.activeElement).toBe(
        within(panel()!).getByRole('button', { name: /cancelar/i }),
      );
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      await open(trigger);
      await userEvent.keyboard('{Escape}');
      await waitFor(() => {
        if (panel()) throw new Error('popover ainda aberto');
      });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('data-state', 'closed');
      // Sem painel não há id para apontar, e o atributo some junto.
      await expect(trigger.getAttribute('aria-controls')).toBeNull();
      await expect(trigger).toHaveFocus();
    });

    await step('Clicar fora fecha o painel', async () => {
      await open(trigger);
      await userEvent.click(canvas.getByTestId('area-externa'));
      await waitFor(() => {
        if (panel()) throw new Error('popover ainda aberto');
      });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    // A story termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      const p = await open(trigger);
      await expect(p).toBeVisible();
    });
  },
};
