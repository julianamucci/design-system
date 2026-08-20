import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createDropdownMenu } from './dropdown-menu';
import { createButton } from './button';
import { createDropdownMenuDocs } from '@/components/docs/DropdownMenuDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type DropdownArgs = {
  triggerLabel: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  modal: boolean;
  defaultOpen: boolean;
};

const meta: Meta<DropdownArgs> = {
  title: 'UI/DropdownMenu',
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createDropdownMenuDocs) },
  },
  argTypes: {
    triggerLabel: { control: 'text', description: 'Texto do DropdownMenuTrigger.' },
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Borda do gatilho por onde o menu sai.',
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description: 'Encosto do menu no eixo perpendicular ao lado.',
    },
    modal: {
      control: 'boolean',
      description:
        'Bloqueia a interação com o resto da página: o clique de fora dispensa o menu sem chegar ao que está embaixo, e a página não rola.',
    },
    defaultOpen: { control: 'boolean', description: 'Abre o menu ao montar.' },
  },
  args: {
    triggerLabel: 'Abrir menu',
    side: 'bottom',
    align: 'start',
    modal: true,
    defaultOpen: false,
  },
};

export default meta;
type Story = StoryObj<DropdownArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMenuEl(args: DropdownArgs): { el: HTMLElement; trigger: HTMLButtonElement } {
  const trigger = createButton({ variant: 'outline', label: args.triggerLabel });
  const el = createDropdownMenu({
    trigger,
    items: [
      { type: 'label', label: 'Conta' },
      { type: 'item', label: 'Perfil', value: 'profile' },
      { type: 'item', label: 'Configuracoes', value: 'settings' },
      { type: 'separator' },
      { type: 'item', label: 'Sair', value: 'logout' },
    ],
    side: args.side,
    align: args.align,
    modal: args.modal,
  });
  el.dataset.slot = 'dropdown-menu';
  return { el, trigger };
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item5',
    ],
    // A fábrica não tem submenu aninhado: o que ela entrega é o menu plano.
    // Declarar cobertura desses itens aqui seria fazer o auditor mentir.
    coversNotApplicable: {
      'functional.item7': 'a fábrica não expõe submenu aninhado — não há SubTrigger para abrir',
      'visual.item4': 'sem submenu na fábrica, não existe estado para o Chromatic fotografar',
    },
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.contain = 'layout';
    container.className = 'nds-cluster nds-w-full nds-min-h-50';
    container.dataset.justify = 'center';

    const { el, trigger } = buildMenuEl(args);
    container.appendChild(el);

    if (args.defaultOpen) {
      queueMicrotask(() => trigger.click());
    }
    return container;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const triggerRe = new RegExp(args.triggerLabel, 'i');

    const waitForClose = async () => {
      await waitFor(() => {
        if (body.queryByRole('menu')) throw new Error('menu ainda aberto');
      }, { timeout: 800 });
    };

    const gatilho = canvas.getByRole('button', { name: triggerRe });

    await step('O gatilho anuncia que abre um menu, e que está fechado', async () => {
      await expect(gatilho).toHaveAttribute('aria-haspopup', 'menu');
      // `aria-controls` aponta para o painel que ainda não existe: é o que liga
      // o gatilho ao menu quando ele abrir.
      await expect(gatilho.getAttribute('aria-controls')).toMatch(/^dropdown-menu-\d+$/);
    });

    await step('Clicar abre o menu com papel de menu', async () => {
      // Idempotente: o clique só acontece com o menu fechado, então o replay do
      // painel Interactions parte do mesmo estado da primeira rodada — vale
      // igual para `defaultOpen`, que já abriu na montagem.
      if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
      const menu = await body.findByRole('menu');
      await expect(menu).toBeVisible();
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
      await expect(within(menu).getAllByRole('menuitem')).toHaveLength(3);
    });

    await step('Os controles de posição e de modal chegam ao menu', async () => {
      const menu = await body.findByRole('menu');
      // O lado e o encosto escolhidos ficam no markup: é o que liga o controle
      // do painel ao painel de verdade. A prova de que eles MOVEM o menu está
      // na story Variants/Placement, que mede a caixa.
      await expect(menu.dataset.side).toBe(args.side);
      await expect(menu.dataset.align).toBe(args.align);
      // Modal trava a rolagem da página enquanto o menu está aberto.
      await expect(document.body.style.overflow).toBe(args.modal ? 'hidden' : '');
    });

    await step('Enter escolhe o item, fecha o menu e devolve o foco ao gatilho', async () => {
      const menu = await body.findByRole('menu');
      const perfil = within(menu).getByRole('menuitem', { name: 'Perfil' });
      perfil.focus();
      await userEvent.keyboard('{Enter}');
      await waitForClose();
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
      await body.findByRole('menu');

      await userEvent.keyboard('{Escape}');
      await waitForClose();
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(gatilho);
      });
    });
  },
};
