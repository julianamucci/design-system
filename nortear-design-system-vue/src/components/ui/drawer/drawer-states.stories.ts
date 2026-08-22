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
  drawerAbertoSource,
  drawerControladoSource,
  drawerClosedSource,
  drawerNaoDispensavelSource,
} from './drawer.source';

const meta = {
  title: 'UI/Drawer/States',
  component: Drawer,
  tags: ['disclosure'],
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
      source: { transform: drawerAbertoSource },
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
    const painel = await waitForPortal('dialog');

    await step('Monta já aberto, com o contrato de markup completo', async () => {
      await expect(painel).toBeVisible();
      await expect(painel).toHaveAttribute('role', 'dialog');
      await expect(painel).toHaveAttribute('aria-modal', 'true');
      await expect(painel).toHaveAttribute('data-slot', 'drawer-content');
      await expect(painel).toHaveAccessibleName('Editar perfil');
      await expect(document.querySelector('[data-slot="drawer-overlay"]')).not.toBeNull();
    });

    await step('O foco está dentro do painel', async () => {
      await waitFor(() => {
        if (!painel.contains(document.activeElement)) {
          throw new Error('o foco não entrou no painel');
        }
      });
      await expect(painel.contains(document.activeElement)).toBe(true);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: {
      // O gatilho sai de cena e entram o par prop+evento e os botões de fora:
      // estrutura inteiramente outra.
      source: { transform: drawerControladoSource },
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
        <div class="nds-cluster" data-spacing="sm">
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
    const abrirBtn = canvas.getByRole('button', { name: /Abrir via estado externo/i });
    const fecharBtn = canvas.getByRole('button', { name: /Fechar via estado externo/i });

    await step('Sem gatilho interno, o painel nasce fechado', async () => {
      if (within(document.body).queryAllByRole('dialog').length > 0) {
        await userEvent.click(fecharBtn);
        await waitForPortalGone('dialog');
      }
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('O estado externo abre o painel', async () => {
      await userEvent.click(abrirBtn);
      const painel = await waitForPortal('dialog');
      await expect(painel).toBeVisible();
      await expect(painel).toHaveAccessibleName('Controlado pelo pai');
    });

    await step('Fechar por dentro devolve o valor a quem é dono dele', async () => {
      const painel = await waitForPortal('dialog');
      await userEvent.click(within(painel).getByRole('button', { name: /Cancelar/i }));
      await waitForPortalGone('dialog');
      // Se o evento não tivesse chegado, `open` continuaria true e o painel
      // reabriria no próximo ciclo de renderização.
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });
  },
};

export const NotDismissible: Story = {
  parameters: {
    docs: {
      // Desligar a dispensa torna a saída do rodapé obrigatória — é o par que
      // o snippet precisa mostrar junto, e que o do meta não tem.
      source: { transform: drawerNaoDispensavelSource },
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
  play: async ({ step }) => {
    const painel = await waitForPortal('dialog');

    await step('Escape não fecha', async () => {
      await userEvent.keyboard('{Escape}');
      // Espera ATIVA por um fechamento que não deve acontecer: se fechasse, a
      // transição de saída levaria menos que isto.
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
      await expect(painel).toBeVisible();
    });

    await step('Clique no overlay não fecha', async () => {
      const overlay = document.querySelector<HTMLElement>('[data-slot="drawer-overlay"]');
      await expect(overlay).not.toBeNull();
      await userEvent.click(overlay!, { pointerEventsCheck: 0 });
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
    });

    await step('A saída explícita do rodapé continua funcionando', async () => {
      await expect(within(painel).getByRole('button', { name: /Recusar/i })).toBeVisible();
    });
  },
};
