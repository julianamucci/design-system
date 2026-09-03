import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import DrawerStory from './DrawerStory.svelte';
import { drawerSource } from './drawer.source';

const meta: Meta = {
  title: 'Primitives/Overlay/Drawer/States',
  component: DrawerStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Os quatro estados diferem no valor inicial do estado ligado e em
      // `dismissible` — os dois já saem dos args que a transform lê.
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

export const Closed: Story = {
  args: {
    defaultOpen: false,
    triggerLabel: 'Abrir drawer',
    title: 'Editar perfil',
    description: 'Atualize seus dados pessoais.',
  },
  parameters: {
    covers: ['accessibility.item1'],
    docs: {
      description: {
        story:
          'Estado inicial — apenas o gatilho está na tela. O painel não existe no DOM, e o gatilho é o único caminho de entrada.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Fechado, o painel não existe no DOM', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(document.querySelector('[data-slot="drawer-content"]')).toBeNull();
      await expect(document.querySelector('[data-slot="drawer-overlay"]')).toBeNull();
    });

    await step('O gatilho é o único caminho de entrada, e está alcançável', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir drawer/i });
      await expect(trigger).toBeVisible();
      await expect(trigger).toBeEnabled();
    });
  },
};

export const Open: Story = {
  args: {
    defaultOpen: true,
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize seus dados pessoais e foto.',
    actionLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    covers: ['accessibility.item2'],
    docs: {
      description: {
        story:
          'Aberto ao montar, sem estado externo. Overlay ativo, foco dentro do painel e contrato de markup completo.',
      },
    },
  },
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('Monta já aberto, com o contrato de markup completo', async () => {
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
  args: {
    open: false,
    triggerLabel: 'Abrir via estado externo',
    title: 'Controlado pelo pai',
    description: 'Este drawer é comandado por estado externo.',
    actionLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    onAction: fn(),
    onCancel: fn(),
  },
  parameters: {
    covers: ['functional.item6'],
    docs: {
      description: {
        story:
          'Estado do lado de fora: o componente não decide nada sozinho — abre quando o valor ligado diz que sim e avisa a cada mudança para que o dono do estado acompanhe.',
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });

    await step('O painel nasce fechado', async () => {
      if (within(document.body).queryAllByRole('dialog').length > 0) {
        await userEvent.keyboard('{Escape}');
        await waitForPortalGone('dialog');
      }
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('O estado ligado abre o painel', async () => {
      await userEvent.click(trigger);
      const panel = await waitForPortal('dialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAccessibleName('Controlado pelo pai');
    });

    await step('Fechar por dentro devolve o valor a quem é dono dele', async () => {
      const panel = await waitForPortal('dialog');
      const spy = args.onCancel as ReturnType<typeof fn>;
      const callsBefore = spy.mock.calls.length;
      await userEvent.click(within(panel).getByRole('button', { name: /Cancelar/i }));
      await waitForPortalGone('dialog');
      await expect(spy.mock.calls.length).toBe(callsBefore + 1);
      // Se o valor não tivesse voltado ao pai, o painel reabriria no próximo
      // ciclo de renderização.
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });
  },
};

export const NotDismissible: Story = {
  args: {
    defaultOpen: true,
    dismissible: false,
    triggerLabel: 'Confirmar termos',
    title: 'Aceitar termos',
    description: 'É necessário confirmar antes de continuar.',
    actionLabel: 'Aceitar',
    cancelLabel: 'Recusar',
  },
  parameters: {
    covers: ['functional.item7'],
    docs: {
      description: {
        story:
          'Sem dispensa por gesto: Escape e clique no overlay não fecham. A saída existe e é explícita — o botão do rodapé, alcançável por teclado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Confirmar termos/i });
    // A play é reexecutável no painel Interactions, e o último passo FECHA o
    // painel de verdade. Sem restabelecer a precondição, a segunda rodada
    // começaria com a tela vazia e os dois primeiros passos afirmariam nada.
    if (within(document.body).queryAllByRole('dialog').length === 0) {
      await userEvent.click(trigger);
    }
    const panel = await waitForPortal('dialog');

    await step('Escape não fecha', async () => {
      await userEvent.keyboard('{Escape}');
      // Espera ATIVA por um fechamento que não deve acontecer: se fechasse, a
      // transição de saída levaria menos que isto.
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
    // única saída. Agora o passo CLICA, e a asserção é o painel sumindo.
    await step('A saída explícita do rodapé fecha de verdade', async () => {
      const sair = within(panel).getByRole('button', { name: /Recusar/i });
      await expect(sair).toBeVisible();
      await userEvent.click(sair);
      await waitForPortalGone('dialog');
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    // Volta a abrir: a foto do Chromatic é do painel aberto, e a próxima rodada
    // da play precisa do mesmo ponto de partida desta.
    await userEvent.click(trigger);
    await waitForPortal('dialog');
  },
};

// ─── Arraste para dispensar ───────────────────────────────────────────────────
//
// O gesto existe nas CINCO stacks. Aqui ele vem da lib de gaveta; em duas
// stacks vem de um motor de pointer escrito à mão sobre a leitura desta lib.
// Os limiares são os mesmos — 25% do tamanho do panel, ou 0,4 px/ms —, e é
// isso que esta play mede.
//
// Os eventos são despachados à mão porque `userEvent.pointer` não entrega a
// soltura no mesmo elemento quando há captura de pointer. E toda espera é de
// RELÓGIO: `pointermove` mexe no DOM, e um `waitFor` em volta de condição que
// provoca mutação se reagenda sozinho até a aba morrer sem reportar.

/** Um quadro — o intervalo que separa dois passos de um gesto real. */
function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function wait(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Um passo de pointer, com o evento que o gesto assina. */
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

/** O panel está parado na posição de repouso? */
function atRest(panel: HTMLElement): boolean {
  const t = getComputedStyle(panel).transform;
  return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
}

export const DragToDismiss: Story = {
  args: {
    defaultOpen: false,
    triggerLabel: 'Abrir drawer',
    title: 'Arraste para dispensar',
    description: 'Puxe o panel para baixo, ou use Escape.',
  },
  parameters: {
    covers: ['functional.item8', 'functional.item9', 'accessibility.item8'],
    // A foto seria a mesma da story Open: o que esta story mede é o gesto, e
    // gesto não aparece em imagem parada.
    chromatic: { disable: true },
    docs: {
      description: {
        story:
          'Arrastar o panel na direção de entrada o dispensa; soltar antes de um quarto do seu tamanho o traz de volta. O gesto é extra de pointer: Escape, véu e o botão do rodapé fecham o mesmo panel sem trajeto nenhum (WCAG 2.5.7).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir drawer/i });

    async function openPanel(): Promise<HTMLElement> {
      if (within(document.body).queryAllByRole('dialog').length === 0) {
        await userEvent.click(trigger);
      }
      const panel = await waitForPortal('dialog');
      // A carência de 500 ms depois da abertura é do gesto, não do teste: nela
      // o panel ainda está entrando, e a lib recusa arrastar de propósito.
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
      // quarto de panel nenhum.
      await wait(150);
      pointer(panel, 'pointermove', x, y + 6);
      await nextFrame();
      pointer(panel, 'pointerup', x, y + 6);

      await wait(700);
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
      await expect(panel).toBeVisible();
      await expect(atRest(panel)).toBe(true);
    });

    await step('Arraste além de um quarto do panel dispensa, e o foco volta', async () => {
      const panel = await openPanel();
      const box = panel.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + 10;
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

    await step('Nada depende do arraste: Escape fecha o mesmo panel', async () => {
      // É esta a asserção da WCAG 2.5.7. O gesto só dispensa, e dispensar tem
      // caminho sem trajeto de pointer — este passo prova que o caminho existe
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
      // Afordância visual: o arraste vale no panel inteiro, não nela. Foco ali
      // seria uma parada de tabulação que não faz nada.
      await expect(handle!.getAttribute('aria-hidden')).toBe('true');
      await expect(handle!.hasAttribute('tabindex')).toBe(false);
    });
  },
};
