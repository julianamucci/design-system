import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { createSheet } from './sheet';
import { sheetSource, sheetSourceWith, sheetSourceControlled } from './sheet.source';
import { createButton } from './button';
import { makeFooter } from './sheet.fixtures';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';

// ─── Meta ─────────────────────────────────────────────────────────────────────

// Fechado e aberto são os dois extremos do ciclo. Fechado o painel nem existe
// no DOM; aberto, o foco entra e fica preso até o fechamento.

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Sheet/States',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: sheetSource },
      description: {
        component:
          'Estados canônicos do Sheet: Closed (inicial), Open (aberto programaticamente), ' +
          'LongScrollBody (corpo mais alto que o painel), WithCloseButtonHidden (sem o X ' +
          'do canto) e Controlled (abertura externa — a factory não expõe uma prop open).',
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
  footer.dataset.spacing = 'md';
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
    const panel = await waitForPortal('dialog');

    await step('Monta já aberto, com o contrato de markup completo', async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      await expect(panel).toHaveAccessibleName(/Filtros avançados/i);
      await expect(panel).toHaveAccessibleDescription();
      await expect(document.querySelector('[data-slot="sheet-overlay"]')).not.toBeNull();
    });

    await step('O foco está dentro do painel', async () => {
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error('o foco não entrou no painel');
        }
      });
    });
  },
};

export const LongScrollBody: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      // O corpo alto é o assunto: quem rola é `.nds-sheet-body`, e o rodapé fica
      // onde está sem nenhuma opção extra.
      source: {
        transform: sheetSourceWith({
          body: 'paragrafos',
          triggerLabel: 'Ler termos',
          title: 'Termos de uso',
          description: 'Leia atentamente antes de aceitar.',
          applyLabel: 'Aceitar termos',
        }),
      },
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho e o rodapé continua visível — ' +
          'é o que separa "conteúdo longo" de "ação fora de alcance".',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Ler termos' });

    const long = document.createElement('div');
    long.className = 'nds-stack nds-text-body nds-text-muted-foreground';
    long.dataset.spacing = 'sm';
    for (let i = 1; i <= 24; i++) {
      const p = document.createElement('p');
      p.textContent = `Parágrafo ${i}: termos longos o bastante para o corpo precisar rolar dentro do painel, sem empurrar o rodapé para fora da tela.`;
      long.appendChild(p);
    }

    const sheet = createSheet({
      trigger,
      side: 'right',
      title: 'Termos de uso',
      description: 'Leia atentamente antes de aceitar.',
      content: long,
      footer: makeFooter('Cancelar', 'Aceitar termos', true),
    });
    queueMicrotask(() => trigger.click());
    return sheet;
  },
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');
    const body = panel.querySelector<HTMLElement>('[data-slot="sheet-body"]')!;
    const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]')!;

    await step('O corpo é quem rola, não o painel', async () => {
      await expect(body).not.toBeNull();
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      // O painel em si não rola: o `flex: 1 1 auto` do corpo é o que segura o rodapé.
      await expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight + 1);
    });

    await step('A região rolável é alcançável por teclado', async () => {
      // WCAG 2.1.1 — sem o tabindex quem navega por teclado não consegue rolar
      // o corpo (é a regra scrollable-region-focusable do axe).
      await expect(body).toHaveAttribute('tabindex', '0');
    });

    await step('O rodapé continua visível com o corpo cheio', async () => {
      const boxFooter = footer.getBoundingClientRect();
      const boxPanel = panel.getBoundingClientRect();
      await expect(boxFooter.bottom).toBeLessThanOrEqual(boxPanel.bottom + 1);
      await expect(boxFooter.height).toBeGreaterThan(0);
    });
  },
};

export const WithCloseButtonHidden: Story = {
  parameters: {
    docs: {
      // A AUSÊNCIA do X é o assunto, e ela só se sustenta com o rodapé
      // oferecendo a outra saída.
      source: {
        transform: sheetSourceWith({
          triggerLabel: 'Abrir filtros',
          title: 'Filtros avançados',
          description: 'Configure os filtros para refinar os resultados.',
          applyLabel: 'Aplicar filtros',
          showCloseButton: false,
        }),
      },
      description: {
        story:
          'Sem o botão do canto. Só faz sentido quando o rodapé já oferece uma saída ' +
          'explícita — Escape continua fechando de qualquer forma.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir filtros' });
    const body = document.createElement('div');
    body.className = 'nds-text-body nds-text-muted-foreground';
    body.textContent = 'Conteúdo do painel.';

    const sheet = createSheet({
      trigger,
      side: 'right',
      title: 'Filtros avançados',
      description: 'Configure os filtros para refinar os resultados.',
      content: body,
      footer: makeFooter('Cancelar', 'Aplicar filtros', true),
      showCloseButton: false,
    });
    queueMicrotask(() => trigger.click());
    return sheet;
  },
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('O botão do canto não é renderizado', async () => {
      await expect(panel).toBeVisible();
      await expect(
        within(panel).queryByRole('button', { name: /^Fechar$/i }),
      ).toBeNull();
      // O seletor da própria folha, e não só o papel: o X é o único elemento
      // que carrega esta classe, então zero dele é a prova direta.
      await expect(panel.querySelector('.nds-sheet-close')).toBeNull();
    });

    await step('E ainda assim existe uma saída — o rodapé', async () => {
      const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]');
      await expect(footer).not.toBeNull();
      await expect(within(footer!).getAllByRole('button').length).toBeGreaterThan(0);
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
    footer.dataset.spacing = 'md';
    footer.append(cancel, action);

    let isOpen = false;
    const sheet = createSheet({
      trigger: hiddenTrigger,
      side: 'right',
      title: 'Controlado pelo pai',
      description: 'Abertura programática pelo gatilho interno.',
      content: body,
      footer,
      onOpenChange: (open) => {
        isOpen = open;
        externalBtn.dataset.open = String(open);
      },
    });

    const externalBtn = createButton({ variant: 'default', label: 'Abrir pelo estado externo' });
    externalBtn.addEventListener('click', () => {
      if (!isOpen) hiddenTrigger.click();
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

    // Lido ANTES de abrir: o que o fechamento tem de devolver é isto, e não a
    // string vazia — outro painel pode estar segurando a trava.
    const overflowAntes = document.body.style.overflow;

    await step('O comando externo abre o painel', async () => {
      await userEvent.click(externo);
      const panel = await waitForPortal('dialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('data-slot', 'sheet-content');
      // O callback devolveu o estado a quem é dono dele.
      await expect(externo).toHaveAttribute('data-open', 'true');
    });

    await step('Com o painel aberto, a página atrás não rola', async () => {
      // `aria-modal="true"` promete que o resto da página está fora de alcance.
      // Sem a trava a promessa é falsa: o leitor de tela não alcança o que está
      // atrás, mas o mouse e a roda alcançam.
      await expect(document.body.style.overflow).toBe('hidden');
    });

    await step('Escape fecha, devolve o estado e solta a rolagem', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      await expect(externo).toHaveAttribute('data-open', 'false');
      await expect(document.body.style.overflow).toBe(overflowAntes);
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

    let probe!: ProbeResult;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      probe = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => {
          const content = document.createElement('p');
          content.textContent = 'Conteúdo do painel.';
          return createSheet({
            trigger: createButton({ variant: 'outline', label: 'Abrir' }),
            title: 'Título',
            description: 'Descrição do painel.',
            content: content,
          });
        },
        exercitar: (no) => no.querySelector<HTMLElement>('button')?.click(),
        seletorDePortal: '[data-slot="sheet-content"], [data-slot="sheet-overlay"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(probe);
    });
  },
};
