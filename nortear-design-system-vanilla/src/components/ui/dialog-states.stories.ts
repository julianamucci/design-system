import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { createDialog } from './dialog';
import { dialogSource, dialogSourceWith, dialogSourceControlled } from './dialog.source';
import { createButton } from './button';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';
import {
  t,
  open,
  clicarQuandoMontado,
  cantoButtonClose,
  checkNameAndDescription,
  waitForOpen,
  waitForClosed,
  trigger,
  overlay,
  panel,
} from './dialog.fixtures';

import { figmaDesign } from '@shared/figma/design-links';
// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Dialog/States',
  parameters: {
    design: figmaDesign('dialog'),
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: dialogSource },
      description: {
        component:
          'Configurações canônicas do Dialog: closed, open, sem botão Close e controlled (abertura programática por open(), sem gatilho).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDialog(opts: {
  triggerLabel: string;
  title: string;
  description?: string;
  showCloseButton?: boolean;
  openInitially?: boolean;
}): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: opts.triggerLabel });
  const content = document.createElement('div');
  content.className = 'nds-text-body nds-text-muted-foreground';
  content.textContent = 'Conteúdo do diálogo.';

  const dialog = createDialog({
    trigger,
    title: opts.title,
    description: opts.description,
    content,
    // Lista, e não um `<div>` de embrulho: as ações precisam ser filhas diretas
    // de `.nds-dialog-footer` para o arranjo do CSS valer.
    footer: [
      createButton({ variant: 'outline', label: t('demonstration.labels.cancel') }),
      createButton({ variant: 'default', label: t('demonstration.labels.action') }),
    ],
    showCloseButton: opts.showCloseButton,
  });
  if (opts.openInitially) clicarQuandoMontado(trigger);
  return dialog;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Closed: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { description: { story: 'Estado inicial — apenas o trigger é visível, Content não está no DOM.' } },
  },
  render: () =>
    buildDialog({
      triggerLabel: t('demonstration.labels.triggerLabel'),
      title: t('demonstration.labels.title'),
      description: 'Atualize suas informações pessoais.',
    }),
  // Esta story não interage com nada: é aqui que a leitura do estado de
  // MONTAGEM vale, porque nenhum replay pode ter mudado o que ela observa.
  play: async ({ canvasElement, step }) => {
    const triggerEl = trigger(canvasElement)!;

    await step('Fechado, nada do conteúdo existe no DOM', async () => {
      // O portal é estrutural: fechado, nem o overlay nem o painel estão no
      // DOM. Um painel escondido por CSS continuaria na ordem de tabulação e
      // seria lido pelo leitor de tela.
      await expect(panel()).toBeNull();
      await expect(overlay()).toBeNull();
      await expect(triggerEl).toBeVisible();
    });

    await step('E o gatilho é um botão de verdade, pronto para o teclado', async () => {
      await expect(triggerEl.tagName).toBe('BUTTON');
      await expect(triggerEl).toHaveAttribute('type', 'button');
      await expect(triggerEl).toHaveAccessibleName(t('demonstration.labels.triggerLabel'));
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      description: {
        story: 'Diálogo aberto programaticamente. Captura visual no Chromatic.',
      },
    },
  },
  render: () =>
    buildDialog({
      triggerLabel: t('demonstration.labels.triggerLabel'),
      title: t('demonstration.labels.title'),
      description: 'Atualize suas informações pessoais.',
      openInitially: true,
    }),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('Aberto, o painel se anuncia como diálogo modal', async () => {
      await expect(p).toBeVisible();
      await expect(p).toHaveAttribute('role', 'dialog');
      await expect(p).toHaveAttribute('aria-modal', 'true');
      await expect(p).toHaveAttribute('data-state', 'open');
      await expect(overlay()).toBeVisible();
      await checkNameAndDescription(p);
    });

    await step('E o foco já está dentro do painel', async () => {
      await waitFor(async () => {
        await expect(p.contains(document.activeElement)).toBe(true);
      });
    });
  },
};

export const WithCloseButtonHidden: Story = {
  parameters: {
    covers: ['visual.item3'],
    // Override de story: o snippet do meta mostraria o X ligado, e é a AUSÊNCIA
    // dele que esta configuração existe para mostrar.
    docs: {
      source: {
        transform: dialogSourceWith({
          triggerLabel: 'Visualizar guia',
          title: 'Próximos passos',
          description: 'Acompanhe o fluxo de onboarding.',
          bodyText: 'Conteúdo do diálogo.',
          showCloseButton: false,
        }),
      },
      description: {
        story:
          'showCloseButton=false. Sem X no canto. Fechamento apenas por Escape, overlay ou ações do Footer.',
      },
    },
  },
  render: () =>
    buildDialog({
      triggerLabel: 'Visualizar guia',
      title: 'Próximos passos',
      description: 'Acompanhe o fluxo de onboarding.',
      showCloseButton: false,
      openInitially: true,
    }),
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    await step('Sem X no canto', async () => {
      await expect(cantoButtonClose(p)).toBeNull();
    });

    await step('Escape continua fechando — nunca se tira toda saída', async () => {
      // Sem o X, Escape, o overlay e o Cancelar do rodapé são as saídas que
      // restam. Retirar todas de uma vez deixaria o diálogo sem fechamento
      // acessível.
      await userEvent.keyboard('{Escape}');
      await waitForClosed();
      // Reabre: o Chromatic fotografa o estado final, e o que esta story existe
      // para mostrar é o painel SEM o X no canto.
      await expect(await open(canvasElement)).toBeVisible();
    });
  },
};

// Espião do modo controlado. Vive fora do `render` para que a play alcance as
// chamadas — spy criado dentro do render é inalcançável e deixa a aba Actions
// vazia. `mockClear()` no início da play zera o que a execução anterior deixou.
const spyControlled = fn();

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item7'],
    // Override de story: o assunto é o callback que devolve cada mudança a quem
    // é dono do estado, e ele não passa por control nenhum — sem isto o snippet
    // mostraria um diálogo que ninguém acompanha de fora.
    docs: {
      source: {
        transform: dialogSourceControlled({
          triggerLabel: 'Open programmatically',
          title: 'Controlado pelo pai',
          description: 'Abertura programática por open().',
          bodyText: 'Este diálogo é comandado por estado externo.',
          footer: [{ label: 'Cancelar', variant: 'outline' }, { label: 'Confirmar' }],
        }),
      },
      description: {
        story:
          'Abertura controlada externamente. A factory não expõe prop de estado — o botão de fora chama `open()` no que ela devolve, e `onOpenChange` rastreia o estado para o pai.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'md';

    // SEM gatilho. Era um `<button>` com `.nds-sr-only`, `tabindex="-1"` e
    // `aria-hidden="true"` — um botão que existia para não ser visto, só porque
    // `trigger` era obrigatório e `open()` não existia.
    const content = document.createElement('div');
    content.className = 'nds-text-body nds-text-muted-foreground';
    content.textContent = 'Este diálogo é comandado por estado externo.';

    const dialog = createDialog({
      title: 'Controlado pelo pai',
      description: 'Abertura programática por open().',
      content,
      footer: [
        createButton({ variant: 'outline', label: 'Cancelar' }),
        createButton({ variant: 'default', label: 'Confirmar' }),
      ],
      onOpenChange: (open) => {
        externalBtn.dataset.open = String(open);
        spyControlled(open);
      },
    });

    const externalBtn = createButton({ variant: 'default', label: 'Open programmatically' });
    externalBtn.dataset.open = 'false';
    // O botão que comanda o diálogo não é o gatilho da fábrica: o anúncio é de
    // quem o montou.
    externalBtn.setAttribute('aria-haspopup', 'dialog');
    // Sem espelho de estado: a guarda de "já aberto" mora em `open()`.
    externalBtn.addEventListener('click', () => dialog.open());

    wrapper.appendChild(externalBtn);
    wrapper.appendChild(dialog);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const externo = canvas.getByRole('button', { name: /Open programmatically/i });
    spyControlled.mockClear();

    await step('Nasce fechado, porque o valor externo diz que sim', async () => {
      await expect(panel()).toBeNull();
      await expect(externo).toHaveAttribute('data-open', 'false');
    });

    await step('NÃO existe gatilho escondido — a forma que `open()` aposentou', async () => {
      // Era um `<button>` com `.nds-sr-only`, `tabindex="-1"` e `aria-hidden`,
      // que existia só para a factory ter um alvo em que clicar. A prova é que
      // o wrapper da fábrica não tem filho nenhum.
      const dialogEl = canvasElement.querySelector<HTMLElement>('[data-slot="dialog"]')!;
      await expect(dialogEl.children).toHaveLength(0);
      await expect(dialogEl.querySelector('.nds-sr-only')).toBeNull();
      await expect(canvasElement.querySelector('[data-slot="dialog-trigger"]')).toBeNull();
    });

    await step('Interagir avisa o dono do estado, e o painel segue o valor', async () => {
      if (!panel()) await userEvent.click(externo);
      await expect(await waitForOpen()).toBeVisible();
      await expect(spyControlled).toHaveBeenLastCalledWith(true);
      await expect(externo).toHaveAttribute('data-open', 'true');
    });

    await step('Escape também passa pelo dono do estado', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClosed();
      await expect(spyControlled).toHaveBeenLastCalledWith(false);
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
  },
  render: () => probeHost(
    'Sonda de limpeza: o diálogo é montado, aberto e removido da página pela play.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let probe!: ProbeResult;
    const teardownReasons: unknown[] = [];
    const openStates: unknown[] = [];

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      probe = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => {
          const content = document.createElement('p');
          content.textContent = 'Conteúdo do diálogo.';
          return createDialog({
            trigger: createButton({ variant: 'outline', label: 'Abrir' }),
            title: 'Título',
            description: 'Descrição do diálogo.',
            content: content,
            onOpenChange: (isOpen) => {
              openStates.push(isOpen);
            },
            onClose: (reason) => {
              teardownReasons.push(reason);
            },
          });
        },
        exercitar: (no) => no.querySelector<HTMLElement>('button')?.click(),
        seletorDePortal: '[data-slot="dialog-content"], [data-slot="dialog-overlay"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(probe);
    });

    await step('Desmontar NÃO é fechar: o estado muda, o motivo não é relatado', async () => {
      // A sonda monta o diálogo, ABRE e tira o nó da página. Até 2026-09-11 esse
      // caminho chamava `closeWithReason('api')` — o MESMO motivo do `close()`
      // público —, então uma troca de idioma numa docs page com o painel aberto
      // virava um `dialog_close` que ninguém provocou, indistinguível de uma
      // decisão real do programa.
      await expect(teardownReasons).toEqual([]);
      // `onOpenChange` FICA: quem espelha o estado do painel precisa saber que
      // ele saiu da tela. O que some é só o motivo, que é o que vira analytics.
      await expect(openStates).toEqual([true, false]);
    });
  },
};
