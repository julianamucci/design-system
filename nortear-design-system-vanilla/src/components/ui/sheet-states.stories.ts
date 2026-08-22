import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { createSheet } from './sheet';
import { sheetSource, sheetSourceWith, sheetSourceControlled } from './sheet.source';
import { createButton } from './button';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';

// ─── Meta ─────────────────────────────────────────────────────────────────────

// Fechado e aberto são os dois extremos do ciclo. Fechado o painel nem existe
// no DOM; aberto, o foco entra e fica preso até o fechamento.

const meta: Meta = {
  tags: ['disclosure'],
  title: 'UI/Sheet/States',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: sheetSource },
      description: {
        component:
          'Estados canônicos do Sheet: Closed (inicial), Open (aberto programaticamente) e ' +
          'Controlled (abertura externa — a factory não expõe uma prop open).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSheet(opts: {
  triggerLabel: string;
  title: string;
  description: string;
  openInitially?: boolean;
}): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: opts.triggerLabel });
  const body = document.createElement('div');
  body.className = 'nds-text-body nds-text-muted-foreground';
  body.textContent = 'Conteúdo do painel.';

  const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
  const action = createButton({ variant: 'default', label: 'Aplicar filtros' });
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.spacing = 'sm';
  footer.append(cancel, action);

  const sheet = createSheet({
    trigger,
    side: 'right',
    title: opts.title,
    description: opts.description,
    content: body,
    footer,
  });
  if (opts.openInitially) queueMicrotask(() => trigger.click());
  return sheet;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado inicial. O painel não está no DOM, e o gatilho anuncia que existe um ' +
          'diálogo por trás dele sem prometer que já está aberto.',
      },
    },
  },
  render: () => buildSheet({
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros.',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir filtros/i });

    await step('Fechado, o painel não existe no DOM', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
    });

    await step('O gatilho anuncia o diálogo sem afirmar que está aberto', async () => {
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('data-slot', 'sheet-trigger');
    });
  },
};

export const Open: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Aberto na montagem, sem interação nenhuma. O foco entra no painel e o restante ' +
          'da página fica inerte enquanto ele durar.',
      },
    },
  },
  render: () => buildSheet({
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros para refinar os resultados.',
    openInitially: true,
  }),
  play: async ({ step }) => {
    const painel = await waitForPortal('dialog');

    await step('Monta já aberto, com o contrato de markup completo', async () => {
      await expect(painel).toBeVisible();
      await expect(painel).toHaveAttribute('aria-modal', 'true');
      await expect(painel).toHaveAccessibleName(/Filtros avançados/i);
      await expect(painel).toHaveAccessibleDescription();
      await expect(document.querySelector('[data-slot="sheet-overlay"]')).not.toBeNull();
    });

    await step('O foco está dentro do painel', async () => {
      await waitFor(() => {
        if (!painel.contains(document.activeElement)) {
          throw new Error('o foco não entrou no painel');
        }
      });
    });
  },
};

export const Controlled: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      // A fábrica não expõe prop de estado: quem abre por código aciona o
      // gatilho interno. Um snippet com o gatilho visível esconderia isso.
      source: { transform: sheetSourceControlled() },
      description: {
        story:
          'Abertura comandada de fora. A factory não expõe uma prop de estado — o pai ' +
          'aciona o gatilho interno e acompanha o painel por onOpenChange.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';

    // Gatilho interno oculto: permite reusar a factory sem expor um open()
    // público, que nenhuma das outras stacks tem.
    const hiddenTrigger = createButton({ variant: 'outline', label: 'internal-trigger' });
    hiddenTrigger.classList.add('nds-sr-only');
    hiddenTrigger.setAttribute('tabindex', '-1');
    hiddenTrigger.setAttribute('aria-hidden', 'true');

    const body = document.createElement('div');
    body.className = 'nds-text-body nds-text-muted-foreground';
    body.textContent = 'Este painel é comandado por estado externo.';

    const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
    const action = createButton({ variant: 'default', label: 'Confirmar' });
    const footer = document.createElement('div');
    footer.className = 'nds-cluster';
    footer.dataset.spacing = 'sm';
    footer.append(cancel, action);

    let aberto = false;
    const sheet = createSheet({
      trigger: hiddenTrigger,
      side: 'right',
      title: 'Controlado pelo pai',
      description: 'Abertura programática pelo gatilho interno.',
      content: body,
      footer,
      onOpenChange: (open) => {
        aberto = open;
        externalBtn.dataset.open = String(open);
      },
    });

    const externalBtn = createButton({ variant: 'default', label: 'Abrir pelo estado externo' });
    externalBtn.addEventListener('click', () => {
      if (!aberto) hiddenTrigger.click();
    });

    wrapper.appendChild(externalBtn);
    wrapper.appendChild(sheet);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const externo = canvas.getByRole('button', { name: /Abrir pelo estado externo/i });

    await step('Sem gatilho visível, o painel nasce fechado', async () => {
      if (within(document.body).queryAllByRole('dialog').length > 0) {
        await userEvent.keyboard('{Escape}');
        await waitForPortalGone('dialog');
      }
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('O comando externo abre o painel', async () => {
      await userEvent.click(externo);
      const painel = await waitForPortal('dialog');
      await expect(painel).toBeVisible();
      await expect(painel).toHaveAttribute('data-slot', 'sheet-content');
      // O callback devolveu o estado a quem é dono dele.
      await expect(externo).toHaveAttribute('data-open', 'true');
    });

    await step('Escape fecha e devolve o estado', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      await expect(externo).toHaveAttribute('data-open', 'false');
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
    // O assunto é a limpeza: o snippet mostra a chamada que quem tira o painel
    // da página precisa fazer.
    docs: {
      source: {
        transform: sheetSourceWith({
          triggerLabel: 'Abrir',
          title: 'Título',
          description: 'Descrição do painel.',
          cancelLabel: false,
          applyLabel: false,
          mostrarDestroy: true,
        }),
      },
    },
  },
  render: () => probeHost(
    'Sonda de limpeza: o painel lateral é montado, aberto e removido da página pela play.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let sonda!: ProbeResult;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      sonda = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => {
          const conteudo = document.createElement('p');
          conteudo.textContent = 'Conteúdo do painel.';
          return createSheet({
            trigger: createButton({ variant: 'outline', label: 'Abrir' }),
            title: 'Título',
            description: 'Descrição do painel.',
            content: conteudo,
          });
        },
        exercitar: (no) => no.querySelector<HTMLElement>('button')?.click(),
        seletorDePortal: '[data-slot="sheet-content"], [data-slot="sheet-overlay"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(sonda);
    });
  },
};
