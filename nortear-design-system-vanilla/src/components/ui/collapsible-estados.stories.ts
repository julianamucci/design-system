import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, waitFor, within, expect } from 'storybook/test';
import { createCollapsible } from './collapsible';

const meta: Meta = {
  tags: ['disclosure'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Collapsible/States',
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAINEL_CLASSES =
  'nds-stack nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-mt-2';

function makeContent(items: string[]): HTMLElement {
  const div = document.createElement('div');
  div.className = PAINEL_CLASSES;
  div.dataset.spacing = 'sm';
  for (const text of items) {
    const p = document.createElement('p');
    p.textContent = text;
    div.appendChild(p);
  }
  return div;
}

// Idempotentes — ver a nota em collapsible.stories.ts.
const abrir = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
};
const fechar = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'false') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'false'));
};

const painelDe = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="collapsible-content"]')!;

// ─── Uncontrolled ─────────────────────────────────────────────────────────────

export const Uncontrolled: Story = {
  render: () =>
    createCollapsible({
      trigger: 'Exibir filtros avançados',
      content: makeContent(['Filtro avançado 1', 'Filtro avançado 2']),
      defaultOpen: false,
      class: 'nds-w-full nds-max-w-sm',
    }),
  parameters: {
    docs: {
      description: {
        story: 'Modo não-controlado. O estado é gerenciado internamente pelo componente. Use quando não há necessidade de compartilhar o estado com outros elementos.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    const painel = painelDe(canvasElement);

    await step('O estado nasce e vive dentro do componente', async () => {
      await fechar(trigger);
      await expect(painel).not.toBeVisible();
      await abrir(trigger);
      await expect(painel).toBeVisible();
      await expect(canvas.getByText('Filtro avançado 1')).toBeVisible();
    });

    await step('E continua alternando sem controle externo', async () => {
      await fechar(trigger);
      await expect(painel).not.toBeVisible();
    });
  },
};

// ─── OpenByDefault ────────────────────────────────────────────────────────────

export const OpenByDefault: Story = {
  render: () =>
    createCollapsible({
      trigger: 'Ocultar filtros avançados',
      content: makeContent(['Filtro avançado 1', 'Filtro avançado 2']),
      defaultOpen: true,
      class: 'nds-w-full nds-max-w-sm',
    }),
  parameters: {
    covers: ['functional.item3', 'accessibility.item5', 'visual.item2'],
    docs: {
      description: {
        story: 'Modo não-controlado com <code>defaultOpen: true</code>. O painel renderiza expandido na montagem sem controle externo de estado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    const painel = painelDe(canvasElement);

    await step('Monta já expandido, sem estado externo nenhum', async () => {
      // Asserção de MONTAGEM: por isso o passo anterior não interage. No replay
      // o DOM não remonta, e o passo seguinte devolve o estado aberto.
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(painel).toBeVisible();
      await expect(canvas.getByText('Filtro avançado 1')).toBeVisible();
    });

    await step('defaultOpen é ponto de partida, não trava', async () => {
      await fechar(trigger);
      await abrir(trigger);
      // Termina aberto de propósito: é o quadro que o Chromatic fotografa e o
      // estado que o axe varre nesta story (visual.item2).
      await expect(painel).toBeVisible();
    });
  },
};

// ─── Controlled ───────────────────────────────────────────────────────────────

export const Controlled: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack nds-w-full nds-max-w-sm';
    wrapper.dataset.spacing = 'sm';

    const indicador = document.createElement('p');
    indicador.className = 'nds-text-caption nds-text-muted-foreground';

    // A fonte da verdade mora AQUI, fora do componente — é isso que distingue o
    // modo controlado. O clique no trigger só propõe o novo valor; quem escreve
    // é este bloco, via `setOpen`.
    let aberto = false;
    const pintar = () => {
      indicador.textContent = `Estado externo: ${aberto ? 'aberto' : 'fechado'}`;
    };

    const collapsible = createCollapsible({
      trigger: 'Exibir filtros avançados',
      content: makeContent(['Filtro avançado 1', 'Filtro avançado 2']),
      open: false,
      onOpenChange: (valor) => definir(valor),
      class: 'nds-w-full',
    });

    function definir(valor: boolean) {
      aberto = valor;
      collapsible.setOpen(valor);
      pintar();
    }
    pintar();

    const botoes = document.createElement('div');
    botoes.className = 'nds-cluster';
    botoes.dataset.spacing = 'sm';
    // Nomes próprios, diferentes do trigger: dois botões com o mesmo nome
    // acessível são ambíguos na lista de controles do leitor de tela.
    for (const [rotulo, valor] of [
      ['Abrir pelo estado externo', true],
      ['Fechar pelo estado externo', false],
    ] as const) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'nds-button nds-button-outline nds-button-sm';
      b.textContent = rotulo;
      b.addEventListener('click', () => definir(valor));
      botoes.appendChild(b);
    }

    wrapper.append(indicador, botoes, collapsible);
    return wrapper;
  },
  parameters: {
    covers: ['functional.item4', 'visual.item3'],
    docs: {
      description: {
        story: 'Modo controlado: a factory recebe <code>open</code> e devolve <code>setOpen</code>. O clique no trigger apenas emite o novo valor — quem escreve no DOM é o estado externo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvasElement.querySelector<HTMLButtonElement>(
      '[data-slot="collapsible-trigger"]',
    )!;
    const painel = painelDe(canvasElement);

    await step('O painel obedece ao estado externo', async () => {
      // Nenhum clique no trigger: quem manda é o estado de fora.
      if (trigger.getAttribute('aria-expanded') !== 'true') {
        await userEvent.click(canvas.getByRole('button', { name: 'Abrir pelo estado externo' }));
      }
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
      await expect(painel).toBeVisible();
      await expect(canvas.getByText('Estado externo: aberto')).toBeInTheDocument();
    });

    await step('O trigger devolve a mudança para o estado externo', async () => {
      await fechar(trigger);
      await expect(painel).not.toBeVisible();
      await expect(canvas.getByText('Estado externo: fechado')).toBeInTheDocument();
    });

    await step('E o botão externo fecha de volta', async () => {
      if (trigger.getAttribute('aria-expanded') !== 'false') {
        await userEvent.click(canvas.getByRole('button', { name: 'Fechar pelo estado externo' }));
      }
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () =>
    createCollapsible({
      trigger: 'Filtros avançados (desabilitado)',
      content: makeContent(['Filtro avançado 1', 'Filtro avançado 2']),
      disabled: true,
      class: 'nds-w-full nds-max-w-sm',
    }),
  parameters: {
    covers: ['functional.item6', 'visual.item5'],
    docs: {
      description: {
        story: 'Estado desabilitado. O trigger não responde a cliques nem a interações de teclado. Aparência visual de opacidade reduzida.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    const painel = painelDe(canvasElement);

    await step('O botão é desabilitado de verdade, não só na aparência', async () => {
      await expect(trigger).toBeDisabled();
      await expect(trigger).toHaveAttribute('aria-disabled', 'true');
    });

    await step('Clique não altera o estado do painel', async () => {
      // Exceção legítima à idempotência: elemento desabilitado não muda de
      // estado em rodada nenhuma.
      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(painel).not.toBeVisible();
    });

    await step('Teclado também não', async () => {
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

