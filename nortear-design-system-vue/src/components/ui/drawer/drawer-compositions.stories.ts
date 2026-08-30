import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { waitForPortal } from '@/lib/wait-for-portal';
import {
  drawerWithConfirmSource,
  drawerWithFormSource,
  drawerWithScrollSource,
} from './drawer.source';

const meta = {
  title: 'Primitives/Overlay/Drawer/Compositions',
  component: Drawer,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: drawerWithFormSource },
      description: {
        component:
          'Combinações canônicas: formulário curto com confirmar/cancelar, confirmação de ação destrutiva e corpo mais alto que o painel.',
      },
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Button,
  Input,
  Label,
};

export const WithForm: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      description: {
        story:
          'Formulário curto no corpo e par de ações no rodapé. Título e descrição dizem o que está sendo editado — juntos formam o nome e a descrição acessíveis do painel.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" direction="bottom">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Editar perfil</DrawerTitle>
              <DrawerDescription>Atualize seu nome e e-mail.</DrawerDescription>
            </DrawerHeader>
            <DrawerBody>
              <form class="nds-grid" data-spacing="sm">
                <div class="nds-grid" data-spacing="xs">
                  <Label for="drawer-name">Nome</Label>
                  <Input id="drawer-name" model-value="Juliana Mucci" />
                </div>
                <div class="nds-grid" data-spacing="xs">
                  <Label for="drawer-email">E-mail</Label>
                  <Input id="drawer-email" type="email" model-value="juliana@example.com" />
                </div>
              </form>
            </DrawerBody>
            <DrawerFooter>
              <Button type="submit">Confirmar</Button>
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
    const inside = within(panel);

    await step('O painel carrega nome, descrição e os campos do formulário', async () => {
      await expect(panel).toHaveAccessibleName('Editar perfil');
      await expect(panel).toHaveAccessibleDescription('Atualize seu nome e e-mail.');
      // Os campos são achados pelo RÓTULO: se `for`/`id` não casassem, o input
      // ficaria sem nome acessível e a busca falharia.
      await expect(inside.getByLabelText(/Nome/i)).toBeInTheDocument();
      await expect(inside.getByLabelText(/E-mail/i)).toBeInTheDocument();
    });

    await step('O rodapé oferece confirmar e cancelar', async () => {
      const footer = panel.querySelector<HTMLElement>('[data-slot="drawer-footer"]')!;
      await expect(footer).not.toBeNull();
      const names = within(footer).getAllByRole('button').map((b) => b.textContent?.trim());
      await expect(names).toContain('Confirmar');
      await expect(names).toContain('Cancelar');
    });
  },
};

export const WithConfirmation: Story = {
  parameters: {
    docs: {
      // Sem corpo e com a ação principal na variante de perigo: o snippet do
      // meta mostra o oposto dos dois.
      source: { transform: drawerWithConfirmSource },
      description: {
        story:
          'Mensagem curta e par de ações, com a principal na variante destrutiva. Vale para confirmação reversível; se a ação for realmente bloqueante, o componente é o AlertDialog.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" direction="bottom">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Remover anexo?</DrawerTitle>
              <DrawerDescription>O anexo sai desta mensagem. Você pode adicioná-lo novamente depois.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button variant="destructive">Remover</Button>
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
    const inside = within(panel);

    await step('A consequência está escrita, não subentendida', async () => {
      await expect(panel).toHaveAccessibleName('Remover anexo?');
      await expect(panel).toHaveAccessibleDescription(/adicioná-lo novamente depois/i);
    });

    await step('A ação principal carrega a variante destrutiva', async () => {
      const destrutivo = inside.getByRole('button', { name: /^Remover$/i });
      await expect(destrutivo).toHaveClass('nds-button-destructive');
      const cancelar = inside.getByRole('button', { name: /Cancelar/i });
      await expect(cancelar).toHaveClass('nds-button-outline');
    });
  },
};

export const WithScroll: Story = {
  parameters: {
    docs: {
      // O corpo passa a receber uma lista, e é ele quem rola: outro miolo e
      // outro estado no script.
      source: { transform: drawerWithScrollSource },
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho dentro do teto de altura e o rodapé continua visível — é o que separa "conteúdo longo" de "ação fora de alcance".',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" direction="bottom">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Termos de serviço</DrawerTitle>
              <DrawerDescription>Leia atentamente os termos antes de aceitar.</DrawerDescription>
            </DrawerHeader>
            <DrawerBody class="nds-text-body nds-text-muted-foreground">
              <p v-for="i in 30" :key="i">
                Parágrafo {{ i }} — conteúdo extenso para demonstrar a rolagem interna do painel
                sem que o rodapé com as ações saia da tela.
              </p>
            </DrawerBody>
            <DrawerFooter>
              <Button>Aceitar termos</Button>
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
    const panel = await waitForPortal('dialog');
    const body = panel.querySelector<HTMLElement>('[data-slot="drawer-body"]')!;
    const footer = panel.querySelector<HTMLElement>('[data-slot="drawer-footer"]')!;

    await step('O corpo é quem rola, não o painel', async () => {
      await expect(body).not.toBeNull();
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      // O painel em si não rola: o mínimo automático zero de um item com
      // overflow é o que faz o corpo ceder altura em vez de esticar a caixa.
      // O painel NÃO é contêiner de rolagem, e é isso que prova o contrato.
      // Medir `scrollHeight <= clientHeight` nele não provava nada: sem
      // `overflow` declarado o computado é `visible`, e elemento visível não
      // rola por maior que seja o `scrollHeight`. Sonda no navegador com o
      // corpo já correto: painel client 719 / scroll 2157, corpo client 559 /
      // scroll 1524 — ou seja, o corpo cede altura e rola, e o número do painel
      // era só a caixa de conteúdo não recortada.
      await expect(['auto', 'scroll']).not.toContain(
        getComputedStyle(panel).overflowY,
      );
    });

    await step('A região rolável é alcançável por teclado', async () => {
      // WCAG 2.1.1 — sem o tabindex, quem navega por teclado não consegue rolar
      // o corpo. É a regra scrollable-region-focusable do axe.
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
