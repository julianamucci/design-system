import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import {
  drawerOpenSource,
  drawerControlledSource,
  drawerClosedSource,
  drawerNotDispensavelSource,
} from './drawer.source';

const meta = {
  title: 'Primitives/Overlay/Drawer/States',
  component: Drawer,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: drawerClosedSource },
      description: {
        component:
          'Estados canônicos do Drawer: fechado (padrão), aberto, controlado por estado externo e não dispensável.',
      },
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Button,
};

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
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer>
          <DrawerTrigger as-child>
            <Button variant="outline">Abrir drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Editar perfil</DrawerTitle>
              <DrawerDescription>Atualize seus dados.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
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
      await expect(trigger).toHaveAttribute('data-slot', 'drawer-trigger');
      await expect(trigger).toBeEnabled();
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['accessibility.item2'],
    docs: {
      // Aqui a montagem já aberta É o assunto, e não há gatilho a clicar — nas
      // outras stories a prop é só andaime da foto do Chromatic.
      source: { transform: drawerOpenSource },
      description: {
        story:
          'Aberto ao montar, sem estado externo. Overlay ativo, foco dentro do painel e contrato de markup completo.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Editar perfil</DrawerTitle>
              <DrawerDescription>Atualize seus dados pessoais. As mudanças são salvas ao confirmar.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>Confirmar</Button>
              <DrawerClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
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
  parameters: {
    covers: ['functional.item6'],
    docs: {
      // O gatilho sai de cena e entram o par prop+evento e os botões de fora:
      // estrutura inteiramente outra.
      source: { transform: drawerControlledSource },
      description: {
        story:
          'Estado do lado de fora: o componente não decide nada sozinho — abre quando o valor ligado diz que sim e avisa a cada mudança para que o dono do estado acompanhe.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const open = ref(false);
      return { open };
    },
    template: `
      <div class="nds-stack" data-spacing="sm" style="contain: layout">
        <div class="nds-cluster" data-spacing="md">
          <Button @click="open = true">Abrir via estado externo</Button>
          <Button variant="outline" @click="open = false">Fechar via estado externo</Button>
        </div>
        <Drawer :open="open" @update:open="(v) => open = v">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Controlado pelo pai</DrawerTitle>
              <DrawerDescription>Este drawer é comandado por estado externo.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const openBtn = canvas.getByRole('button', { name: /Abrir via estado externo/i });
    const closeBtn = canvas.getByRole('button', { name: /Fechar via estado externo/i });

    await step('Sem gatilho interno, o painel nasce fechado', async () => {
      if (within(document.body).queryAllByRole('dialog').length > 0) {
        await userEvent.click(closeBtn);
        await waitForPortalGone('dialog');
      }
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('O estado externo abre o painel', async () => {
      await userEvent.click(openBtn);
      const panel = await waitForPortal('dialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAccessibleName('Controlado pelo pai');
    });

    await step('Fechar por dentro devolve o valor a quem é dono dele', async () => {
      const panel = await waitForPortal('dialog');
      await userEvent.click(within(panel).getByRole('button', { name: /Cancelar/i }));
      await waitForPortalGone('dialog');
      // Se o evento não tivesse chegado, `open` continuaria true e o painel
      // reabriria no próximo ciclo de renderização.
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });
  },
};

export const NotDismissible: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: {
      // Desligar a dispensa torna a saída do rodapé obrigatória — é o par que
      // o snippet precisa mostrar junto, e que o do meta não tem.
      source: { transform: drawerNotDispensavelSource },
      description: {
        story:
          'Sem dispensa por gesto: Escape e clique no overlay não fecham. A saída existe e é explícita — o botão do rodapé, alcançável por teclado.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" :dismissible="false">
          <DrawerTrigger as-child>
            <Button variant="outline">Abrir</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Aceitar termos</DrawerTitle>
              <DrawerDescription>Você precisa aceitar os termos para continuar.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>Aceitar</Button>
              <DrawerClose as-child>
                <Button variant="outline">Recusar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    // `hidden: true` porque esta story nasce ABERTA (`default-open`): com o
    // painel modal de pé, a reka marca todo o fundo com `aria-hidden`, e o
    // gatilho sai da árvore de acessibilidade. Sem a opção, a consulta não acha
    // nada e a play morre na PRIMEIRA linha — antes de medir Escape, overlay ou
    // a saída pelo rodapé, que é o que esta story existe para provar.
    const trigger = canvas.getByRole('button', { name: /^Abrir$/i, hidden: true });
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
  parameters: {
    covers: ['functional.item8', 'functional.item9', 'accessibility.item8'],
    // A foto seria a mesma da story Open: o que esta story mede é o gesto, e
    // gesto não aparece em imagem parada.
    chromatic: { disable: true },
    docs: {
      source: { transform: drawerOpenSource },
      description: {
        story:
          'Arrastar o panel na direção de entrada o dispensa; soltar antes de um quarto do seu tamanho o traz de volta. O gesto é extra de pointer: Escape, véu e o botão do rodapé fecham o mesmo panel sem trajeto nenhum (WCAG 2.5.7).',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer>
          <DrawerTrigger as-child>
            <Button variant="outline">Abrir</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Arraste para dispensar</DrawerTitle>
              <DrawerDescription>Puxe o panel para baixo, ou use Escape.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /^Abrir$/i });

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
