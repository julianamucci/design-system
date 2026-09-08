import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, waitFor } from 'storybook/test';
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
} from './drawer.source';

import { figmaDesign } from '@shared/figma/design-links';
const meta = {
  title: 'Components/Overlay/Drawer/Compositions',
  component: Drawer,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('drawer'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: drawerWithFormSource },
      description: {
        component:
          'Combinações canônicas: formulário curto com confirmar/cancelar e confirmação de ação destrutiva.',
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
              <form id="drawer-form" class="nds-grid" data-spacing="sm" @submit.prevent>
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
              <DrawerClose as-child>
                <Button type="button" variant="outline">Cancelar</Button>
              </DrawerClose>
              <Button type="submit" form="drawer-form">Confirmar</Button>
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
          <!--
            A decisão É a tela: o painel abre com o foco no fechador do rodapé,
            como o AlertDialog faz — o Enter por reflexo tem de cair na saída
            segura, nunca na ação que consuma. Na WithForm o padrão FICA, porque
            ali o assunto é editar.

            É prop, e não gancho da lib: a lib desta stack cancela o foco
            automático do diálogo e não repassa o evento. Ver DrawerContent.vue.
          -->
          <DrawerContent initial-focus="close">
            <DrawerHeader>
              <DrawerTitle>Remover anexo?</DrawerTitle>
              <DrawerDescription>O anexo sai desta mensagem. Você pode adicioná-lo novamente depois.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
              <Button variant="destructive">Remover</Button>
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

    await step('O foco abre no cancelar, não na ação destrutiva', async () => {
      // O ELEMENTO, não a mera presença de foco: o padrão desta stack é focar o
      // PAINEL, e painel focado também tem foco dentro — é justamente o que esta
      // story recusa.
      const cancelar = inside.getByRole('button', { name: /^Cancelar$/i });
      const destrutivo = inside.getByRole('button', { name: /^Remover$/i });
      await waitFor(() => expect(cancelar).toHaveFocus());
      await expect(destrutivo).not.toHaveFocus();
    });
  },
};
