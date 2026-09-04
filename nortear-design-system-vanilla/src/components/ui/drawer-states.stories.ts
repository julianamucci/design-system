import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { createDrawer } from './drawer';
import { drawerSource, drawerSourceWith } from './drawer.source';
import { createButton } from './button';
import { drawerClearPortais } from './drawer-portal-cleanup';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Drawer/States',
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
    covers: ['functional.item7'],
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

    // O passo dizia "continua funcionando" e só olhava se o botão estava
    // VISÍVEL. Botão visível e inerte é exatamente o defeito que o rodapé de uma
    // gaveta não dispensável não pode ter: com Escape e véu desligados, ele é a
    // única saída — e nesta stack quem liga o clique ao fechamento é o
    // `data-slot="drawer-close"`, que é fácil de esquecer no rodapé.
    await step('A saída explícita do rodapé fecha de verdade', async () => {
      await expect(panel).toHaveAccessibleName(/confirmação obrigatória/i);
      const sair = within(panel).getByRole('button', { name: /cancelar/i });
      await expect(sair).toBeVisible();
      await userEvent.click(sair);
      await waitForPortalGone('dialog');
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    // Volta a abrir: a foto do Chromatic é do painel aberto, e a próxima rodada
    // da play precisa do mesmo ponto de partida desta.
    await userEvent.click(canvas.getByRole('button', { name: /abrir confirmação/i }));
    await waitForPortal('dialog');
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

// ─── Arraste para dispensar ───────────────────────────────────────────────────
//
// O gesto existe nas CINCO stacks. Nesta e na do Angular ele vem do motor de
// pointer compartilhado (`@shared/primitives/drawer-swipe`); nas outras três,
// da lib de gaveta. Os limiares são os mesmos, e é isso que esta play mede.
//
// ─── Por que os eventos são despachados à mão ────────────────────────────────
//
// `userEvent.pointer` entrega o começo do gesto e não entrega a soltura no
// mesmo elemento quando há captura de ponteiro — o mesmo motivo já registrado
// no arraste do Carousel desta stack. O motor assina `pointerdown` /
// `pointermove` / `pointerup` no painel, então despachar os três direto é o que
// entrega o gesto inteiro.
//
// ─── Por que a espera é de relógio, e não `waitFor` ──────────────────────────
//
// `pointermove` MEXE no DOM (escreve `transform` e `data-swiping`). Um `waitFor`
// em volta de uma condição que dispara mutação se reagenda sozinho: o prazo
// nunca chega, o navegador crava um núcleo e a aba morre sem reportar. Aqui todo
// intervalo é `setTimeout`.

/** Um quadro — o intervalo que separa dois passos de um gesto real. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Um passo de ponteiro, com o evento que o motor assina. */
function pointer(
  target: HTMLElement,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  x: number,
  y: number,
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/** O painel está parado na posição de repouso? */
function atRest(panel: HTMLElement): boolean {
  const t = getComputedStyle(panel).transform;
  return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
}

export const DragToDismiss: Story = {
  parameters: {
    covers: ['functional.item8', 'functional.item9', 'accessibility.item8'],
    controls: { disable: true },
    // A foto seria a mesma da story `Open`: o que esta story mede é o gesto, e
    // gesto não aparece em imagem parada.
    chromatic: { disable: true },
    docs: {
      description: {
        story:
          'Arrastar o painel na direção de entrada o dispensa; soltar antes de um quarto do seu tamanho o traz de volta. O gesto é extra de ponteiro: Escape, véu e o botão do rodapé fecham o mesmo painel sem trajeto nenhum (WCAG 2.5.7).',
      },
    },
  },
  render: () =>
    buildBase({
      triggerLabel: 'Abrir drawer',
      title: 'Arraste para dispensar',
      description: 'Puxe o painel para baixo, ou use Escape.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Salvar',
    }),
  play: async ({ canvasElement, step }) => {
    drawerClearPortais();
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /abrir drawer/i });

    async function openPanel(): Promise<HTMLElement> {
      if (within(document.body).queryAllByRole('dialog').length === 0) {
        await userEvent.click(trigger);
      }
      const panel = await waitForPortal('dialog');
      // A carência de 500 ms depois da abertura é do gesto, não do teste: nela
      // o painel ainda está entrando, e a lib de gaveta recusa arrastar pelo
      // mesmo motivo. Sem esperar, o primeiro `pointermove` seria descartado.
      await wait(600);
      return panel;
    }

    await step('Arraste curto volta ao repouso, sem fechar', async () => {
      const panel = await openPanel();
      const box = panel.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + 10;

      pointer(panel, 'pointerdown', x, y);
      await nextFrame();
      pointer(panel, 'pointermove', x, y + 6);
      await nextFrame();
      // Devagar de propósito: 6px em ~150ms dá 0,04 px/ms, um décimo do limiar
      // de velocidade. O que decide aqui é a distância, e 6px não chega a um
      // quarto de painel nenhum.
      await wait(150);
      pointer(panel, 'pointermove', x, y + 6);
      await nextFrame();
      pointer(panel, 'pointerup', x, y + 6);

      // A volta ao repouso é uma transição de `--duration-base`; o teto aqui é
      // de relógio porque a condição não pode ser observada sem tocar o DOM.
      await wait(700);
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
      await expect(panel).toBeVisible();
      await expect(panel.dataset.swiping).toBeUndefined();
      await expect(atRest(panel)).toBe(true);
    });

    await step('Arraste além de um quarto do painel dispensa, e o foco volta', async () => {
      const panel = await openPanel();
      const box = panel.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + 10;
      // Sessenta por cento da altura: bem além do limiar de 25%, e em passos,
      // como um gesto real.
      const target = Math.max(box.height * 0.6, 80);

      pointer(panel, 'pointerdown', x, y);
      await nextFrame();
      for (const fraction of [0.25, 0.5, 0.75, 1]) {
        pointer(panel, 'pointermove', x, y + target * fraction);
        await nextFrame();
      }
      pointer(panel, 'pointerup', x, y + target);

      await waitForPortalGone('dialog');
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(document.activeElement).toBe(trigger);
    });

    await step('Nada depende do arraste: Escape fecha o mesmo painel', async () => {
      // É esta a asserção da WCAG 2.5.7. O gesto só dispensa, e dispensar tem
      // caminho sem trajeto de ponteiro — este passo prova que o caminho existe
      // e leva ao mesmo lugar.
      const panel = await openPanel();
      await expect(panel).toBeVisible();
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('A alça não é parada de teclado', async () => {
      const panel = await openPanel();
      const handle = panel.querySelector<HTMLElement>('.nds-drawer-handle');
      await expect(handle).not.toBeNull();
      // Afordância visual: o arraste vale no painel inteiro, não nela. Foco ali
      // seria uma parada de tabulação que não faz nada.
      await expect(handle!.getAttribute('aria-hidden')).toBe('true');
      await expect(handle!.hasAttribute('tabindex')).toBe(false);
    });
  },
};
