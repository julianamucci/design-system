import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { createDrawer } from './drawer';
import { drawerSource, drawerSourceWith } from './drawer.source';
import { createButton } from './button';
import { drawerClearPortais } from './drawer-portal-cleanup';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';

const meta: Meta = {
  tags: ['disclosure'],
  title: 'UI/Drawer/States',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: drawerSource },
      description: {
        component:
          'Estados canônicos do Drawer: fechado (padrão), aberto, controlado por estado externo e não dispensável.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type BaseOptions = {
  triggerLabel: string;
  title: string;
  description?: string;
  cancelLabel?: string;
  actionLabel?: string;
  dismissible?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function buildBase(opts: BaseOptions): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: opts.triggerLabel });

  // `data-slot="drawer-close"` é o que faz a factory ligar o fechamento ao
  // botão — o equivalente desta stack ao componente DrawerClose das outras.
  const cancel = createButton({ variant: 'outline', label: opts.cancelLabel ?? 'Cancelar' });
  cancel.dataset.slot = 'drawer-close';
  const action = createButton({ variant: 'default', label: opts.actionLabel ?? 'Salvar' });

  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.justify = 'end';
  footer.dataset.spacing = 'md';
  footer.append(cancel, action);

  const content = document.createElement('div');
  content.className = 'nds-text-body nds-text-muted-foreground';
  content.textContent = 'Conteúdo do drawer.';

  const drawer = createDrawer({
    trigger,
    title: opts.title,
    description: opts.description,
    content,
    footer,
    dismissible: opts.dismissible,
    onOpenChange: opts.onOpenChange,
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.appendChild(drawer);
  return wrapper;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Closed: Story = {
  parameters: {
    covers: ['accessibility.item1'],
    docs: {
      description: {
        story:
          'Estado inicial — apenas o gatilho está na tela. O painel não existe no DOM, e o gatilho é o único caminho de entrada.',
      },
    },
  },
  render: () => buildBase({ triggerLabel: 'Abrir drawer', title: 'Editar perfil' }),
  play: async ({ canvasElement, step }) => {
    drawerClearPortais();
    const canvas = within(canvasElement);

    await step('Fechado, o painel não existe no DOM', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(document.querySelector('[data-slot="drawer-content"]')).toBeNull();
      await expect(document.querySelector('[data-slot="drawer-overlay"]')).toBeNull();
    });

    await step('O gatilho é o único caminho de entrada, e está alcançável', async () => {
      const trigger = canvas.getByRole('button', { name: /abrir drawer/i });
      await expect(trigger).toBeVisible();
      await expect(trigger).toBeEnabled();
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['accessibility.item2'],
    docs: {
      description: {
        story:
          'Aberto pelo gatilho. Overlay ativo, foco dentro do painel e contrato de markup completo. A story termina aberta — é este o estado que ela demonstra.',
      },
    },
  },
  render: () =>
    buildBase({
      triggerLabel: 'Abrir drawer',
      title: 'Editar perfil',
      description: 'Atualize seus dados.',
    }),
  play: async ({ canvasElement, step }) => {
    drawerClearPortais();
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /abrir drawer/i });
    if (within(document.body).queryAllByRole('dialog').length === 0) {
      await userEvent.click(trigger);
    }
    const panel = await waitForPortal('dialog');

    await step('Aberto, com o contrato de markup completo', async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('role', 'dialog');
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      await expect(panel).toHaveAttribute('data-slot', 'drawer-content');
      await expect(panel).toHaveAccessibleName('Editar perfil');
      await expect(document.querySelector('[data-slot="drawer-overlay"]')).not.toBeNull();
    });

    await step('O foco está dentro do painel', async () => {
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error('o foco não entrou no painel');
        }
      });
      await expect(panel.contains(document.activeElement)).toBe(true);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item6'],
    // Override de story: o assunto é o callback que devolve cada mudança a quem
    // é dono do estado, e ele não passa por control nenhum neste arquivo.
    docs: {
      source: {
        transform: drawerSourceWith({
          triggerLabel: 'Abrir',
          title: 'Controlado pelo pai',
          description: 'Abertura comandada de fora.',
          bodyText: 'Drawer comandado por estado externo.',
          onOpenChange: '(aberto) => sincronizarEstadoExterno(aberto)',
        }),
      },
      description: {
        story:
          'Estado do lado de fora: um botão externo comanda a abertura e recebe de volta cada mudança pelo callback, que é o que mantém os dois lados em sincronia.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'md';

    const stateExterno = { isOpen: false };
    const externo = createButton({ variant: 'default', label: 'Abrir via estado externo' });

    // Gatilho interno fora do fluxo visual e do fluxo de leitura: quem comanda é
    // o botão externo. `nds-sr-only` é a classe REAL do projeto — antes havia um
    // `sr-only` sem prefixo, que não esconde nada.
    const triggerInterno = createButton({ variant: 'outline', label: 'gatilho interno' });
    triggerInterno.classList.add('nds-sr-only');
    triggerInterno.setAttribute('tabindex', '-1');
    triggerInterno.setAttribute('aria-hidden', 'true');

    const content = document.createElement('div');
    content.className = 'nds-text-body nds-text-muted-foreground';
    content.textContent = 'Drawer comandado por estado externo.';

    const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
    cancel.dataset.slot = 'drawer-close';
    const footer = document.createElement('div');
    footer.className = 'nds-cluster';
    footer.dataset.justify = 'end';
    footer.dataset.spacing = 'md';
    footer.append(cancel, createButton({ variant: 'default', label: 'Confirmar' }));

    const drawer = createDrawer({
      trigger: triggerInterno,
      title: 'Controlado pelo pai',
      description: 'Abertura comandada de fora.',
      content,
      footer,
      onOpenChange: (isOpen) => {
        stateExterno.isOpen = isOpen;
        externo.dataset.open = String(isOpen);
      },
    });

    externo.addEventListener('click', () => {
      if (!stateExterno.isOpen) triggerInterno.click();
    });

    wrapper.append(externo, drawer);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    drawerClearPortais();
    const canvas = within(canvasElement);
    const externo = canvas.getByRole('button', { name: /abrir via estado externo/i });

    await step('O painel nasce fechado, e o estado externo diz o mesmo', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(externo).not.toHaveAttribute('data-open', 'true');
    });

    await step('O estado externo abre o painel', async () => {
      await userEvent.click(externo);
      const panel = await waitForPortal('dialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAccessibleName('Controlado pelo pai');
      // O callback devolveu a mudança a quem é dono do estado.
      await expect(externo).toHaveAttribute('data-open', 'true');
    });

    await step('Fechar por dentro devolve o valor a quem é dono dele', async () => {
      const panel = await waitForPortal('dialog');
      await userEvent.click(within(panel).getByRole('button', { name: /cancelar/i }));
      await waitForPortalGone('dialog');
      await expect(externo).toHaveAttribute('data-open', 'false');
    });

    await step('E o mesmo botão externo reabre — o ciclo fecha', async () => {
      await userEvent.click(externo);
      const panel = await waitForPortal('dialog');
      await expect(panel).toBeVisible();
    });
  },
};

export const NotDismissible: Story = {
  parameters: {
    // Override de story: `dismissible: false` é o assunto, e o snippet do meta
    // mostraria a gaveta que Escape e overlay dispensam — o oposto.
    docs: {
      source: {
        transform: drawerSourceWith({
          triggerLabel: 'Abrir confirmação',
          title: 'Confirmação obrigatória',
          description: 'Use o botão do rodapé para sair deste painel.',
          bodyText: 'Conteúdo do drawer.',
          dismissible: false,
        }),
      },
      description: {
        story:
          'Sem dispensa por gesto: Escape e clique no overlay não fecham. A saída existe e é explícita — o botão do rodapé, alcançável por teclado.',
      },
    },
  },
  render: () =>
    buildBase({
      triggerLabel: 'Abrir confirmação',
      title: 'Confirmação obrigatória',
      description: 'Use o botão do rodapé para sair deste painel.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Confirmar',
      dismissible: false,
    }),
  play: async ({ canvasElement, step }) => {
    drawerClearPortais();
    const canvas = within(canvasElement);
    if (within(document.body).queryAllByRole('dialog').length === 0) {
      await userEvent.click(canvas.getByRole('button', { name: /abrir confirmação/i }));
    }
    const panel = await waitForPortal('dialog');

    await step('Escape não fecha', async () => {
      await userEvent.keyboard('{Escape}');
      // Espera ATIVA por um fechamento que não deve acontecer.
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
      await expect(panel).toBeVisible();
    });

    await step('Clique no overlay não fecha', async () => {
      const overlay = document.querySelector<HTMLElement>('[data-slot="drawer-overlay"]');
      await expect(overlay).not.toBeNull();
      await userEvent.click(overlay!, { pointerEventsCheck: 0 });
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
    });

    await step('A saída explícita do rodapé continua funcionando', async () => {
      await expect(within(panel).getByRole('button', { name: /cancelar/i })).toBeVisible();
      await expect(panel).toHaveAccessibleName(/confirmação obrigatória/i);
    });
  },
};

// ─── Limpeza de ouvintes ──────────────────────────────────────────────────────
//
// A fábrica registra ouvinte em `document`. Quem tira o nó da página com o
// componente nesse estado não passa por caminho de fechamento nenhum, e antes
// não havia o que chamar. A prova aqui NÃO é "`destroy()` rodou" — isso passaria
// com um `destroy()` vazio. É a contagem de ouvintes do livro-caixa fechando em
// zero, confirmada por uma bateria de eventos disparada no documento depois da
// saída. Ver `leak-probe.ts` para o que cada prova cobre e como pode falhar.

export const ListenerCleanup: Story = {
  parameters: {
    controls: { disable: true },
    // A story existe para o que acontece DEPOIS da saída do nó: a foto seria
    // sempre a mesma legenda.
    chromatic: { disable: true },
  },
  render: () => probeHost(
    'Sonda de limpeza: a gaveta é montada, aberta e removida da página pela play.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let probe!: ProbeResult;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      probe = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => {
          const content = document.createElement('p');
          content.textContent = 'Conteúdo da gaveta.';
          return createDrawer({
            trigger: createButton({ variant: 'outline', label: 'Abrir' }),
            title: 'Título',
            description: 'Descrição da gaveta.',
            content: content,
          });
        },
        exercitar: (no) => no.querySelector<HTMLElement>('button')?.click(),
        seletorDePortal: '[data-slot="drawer-content"], [data-slot="drawer-overlay"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(probe);
    });
  },
};
