import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { createDialog } from './dialog';
import { dialogSource, dialogSourceWith } from './dialog.source';
import { createButton } from './button';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';
import {
  open,
  cantoButtonClose,
  checkNameEDescricao,
  waitForOpen,
  waitForClosed,
  trigger,
  overlay,
  panel,
} from './dialog.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'Primitives/Overlay/Dialog/States',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: dialogSource },
      description: {
        component:
          'Configuracoes canônicas do Dialog: closed, open, sem botão Close e controlled (abertura programática via referência ao triggerEl).',
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
      createButton({ variant: 'outline', label: 'Cancelar' }),
      createButton({ variant: 'default', label: 'Salvar alterações' }),
    ],
    showCloseButton: opts.showCloseButton,
  });
  if (opts.openInitially) queueMicrotask(() => trigger.click());
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
      triggerLabel: 'Editar perfil',
      title: 'Editar perfil',
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
      await expect(triggerEl).toHaveAccessibleName('Editar perfil');
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
      triggerLabel: 'Editar perfil',
      title: 'Editar perfil',
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
      await checkNameEDescricao(p);
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
        transform: dialogSourceWith({
          triggerLabel: 'Abrir',
          title: 'Controlado pelo pai',
          description: 'Abertura programática via referência ao triggerEl.',
          bodyText: 'Este diálogo é comandado por estado externo.',
          footer: [{ label: 'Cancelar', variant: 'outline' }, { label: 'Confirmar' }],
          onOpenChange: '(aberto) => sincronizarEstadoExterno(aberto)',
        }),
      },
      description: {
        story:
          'Abertura controlada externamente. O triggerEl interno do dialog fica escondido e a abertura acontece via `triggerEl.click()` a partir de um botão externo. `onOpenChange` rastreia o estado para o pai.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'md';

    // Trigger interno do dialog (oculto): permite reuso da factory createDialog
    // sem expor um método open() público — o pai controla via .click().
    // `nds-sr-only` e não `sr-only`: a classe sem prefixo não existe mais no
    // CSS, e o gatilho "escondido" aparecia na tela ao lado do externo.
    const hiddenTrigger = createButton({ variant: 'outline', label: 'internal-trigger' });
    hiddenTrigger.classList.add('nds-sr-only');
    hiddenTrigger.setAttribute('tabindex', '-1');
    hiddenTrigger.setAttribute('aria-hidden', 'true');

    const content = document.createElement('div');
    content.className = 'nds-text-body nds-text-muted-foreground';
    content.textContent = 'Este diálogo é comandado por estado externo.';

    let isOpen = false;
    const dialog = createDialog({
      trigger: hiddenTrigger,
      title: 'Controlado pelo pai',
      description: 'Abertura programática via referência ao triggerEl.',
      content,
      footer: [
        createButton({ variant: 'outline', label: 'Cancelar' }),
        createButton({ variant: 'default', label: 'Confirmar' }),
      ],
      onOpenChange: (open) => {
        isOpen = open;
        externalBtn.dataset.open = String(open);
        spyControlled(open);
      },
    });

    const externalBtn = createButton({ variant: 'default', label: 'Open programmatically' });
    externalBtn.dataset.open = 'false';
    externalBtn.addEventListener('click', () => {
      if (!isOpen) hiddenTrigger.click();
    });

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

    await step('O gatilho interno está fora da tela e fora do teclado', async () => {
      // Ele existe só para a factory ter um alvo: visível ou tabulável, seria
      // um segundo botão sem sentido para quem usa.
      const interno = canvasElement.querySelector<HTMLElement>('[data-slot="dialog"] > button')!;
      await expect(interno).toHaveClass('nds-sr-only');
      await expect(interno).toHaveAttribute('tabindex', '-1');
      await expect(interno).toHaveAttribute('aria-hidden', 'true');
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
          });
        },
        exercitar: (no) => no.querySelector<HTMLElement>('button')?.click(),
        seletorDePortal: '[data-slot="dialog-content"], [data-slot="dialog-overlay"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(probe);
    });
  },
};
