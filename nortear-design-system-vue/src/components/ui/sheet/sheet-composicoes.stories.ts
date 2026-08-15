import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { REGRA_GUARDA_DE_FOCO, waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Sheet/Compositions',
  component: Sheet,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    // Painel modal aberto: ver o motivo em wait-for-portal.ts.
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    docs: {
      description: {
        component:
          'Composições reais do Sheet em fluxos de produto: filtros avançados, edição de ' +
          'perfil, navegação secundária e formulário longo com rolagem interna.',
      },
    },
  },
  decorators: [
    () => ({
      template: '<div style="min-height: 520px; width: 100%;"><story /></div>',
    }),
  ],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Button,
  Input,
  Label,
};

export const AdvancedFilters: Story = {
  parameters: {
    docs: {
      description: { story: 'Painel direito com filtros avançados — caso de uso clássico em desktop.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
            <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <div class="nds-grid" data-spacing="md">
              <div class="nds-grid" data-spacing="xs">
                <Label for="cat">Categoria</Label>
                <Input id="cat" defaultValue="Componentes" />
              </div>
              <div class="nds-grid" data-spacing="xs">
                <Label for="status">Status</Label>
                <Input id="status" defaultValue="Estável" />
              </div>
              <div class="nds-grid" data-spacing="xs">
                <Label for="lang">Idioma</Label>
                <Input id="lang" defaultValue="Português" />
              </div>
            </div>
          </SheetBody>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button>Aplicar filtros</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async () => {
    const painel = await waitForPortal('dialog');
    await expect(painel).toHaveAccessibleName(/Filtros avançados/i);
    const aplicar = within(painel).getByRole('button', { name: /Aplicar filtros/i });
    await expect(aplicar).toBeVisible();
  },
};

export const ProfileEdit: Story = {
  parameters: {
    docs: {
      description: { story: 'Edição de perfil com múltiplos campos no painel direito.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Editar perfil</SheetTitle>
            <SheetDescription>Atualize suas informações pessoais. As mudanças são salvas ao confirmar.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <form class="nds-grid" data-spacing="sm">
              <div class="nds-grid" data-spacing="xs">
                <Label for="profile-name">Nome</Label>
                <Input id="profile-name" defaultValue="Juliana Mucci" />
              </div>
              <div class="nds-grid" data-spacing="xs">
                <Label for="profile-handle">Username</Label>
                <Input id="profile-handle" defaultValue="@julianamucci" />
              </div>
              <div class="nds-grid" data-spacing="xs">
                <Label for="profile-bio">Bio</Label>
                <Input id="profile-bio" defaultValue="Designer de sistemas em São Paulo" />
              </div>
            </form>
          </SheetBody>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button type="submit">Salvar alterações</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async () => {
    const painel = await waitForPortal('dialog');
    await expect(painel).toHaveAccessibleName(/Editar perfil/i);
    const nome = within(painel).getByLabelText(/Nome/i);
    await expect(nome).toBeVisible();
  },
};

export const SecondaryNavigation: Story = {
  parameters: {
    docs: {
      description: { story: 'Menu de navegação secundária no painel esquerdo.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Navegação</SheetTitle>
            <SheetDescription>Acesse as seções principais da aplicação.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <nav class="nds-stack" data-spacing="xs" aria-label="Seções">
              <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-muted-soft">Dashboard</a>
              <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-muted-soft">Componentes</a>
              <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-muted-soft">Tokens</a>
              <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-muted-soft">Documentação</a>
              <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-muted-soft">Configurações</a>
            </nav>
          </SheetBody>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async () => {
    const painel = await waitForPortal('dialog');
    await expect(painel).toHaveAttribute('data-side', 'left');
    const nav = within(painel).getByRole('navigation');
    await expect(nav).toBeVisible();
  },
};

export const LongFormScroll: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho e o rodapé continua visível — ' +
          "é o que separa 'conteúdo longo' de 'ação fora de alcance'.",
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Preferências de notificação</SheetTitle>
            <SheetDescription>Configure cada tipo de notificação individualmente.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <div class="nds-grid" data-spacing="sm">
              <div v-for="i in 12" :key="i" class="nds-grid" data-spacing="xs">
                <Label :for="'notif-' + i">Categoria {{ i }}</Label>
                <Input :id="'notif-' + i" :defaultValue="'Configuração ' + i" />
              </div>
            </div>
          </SheetBody>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button>Salvar preferências</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async ({ step }) => {
    const painel = await waitForPortal('dialog');
    const corpo = painel.querySelector<HTMLElement>('[data-slot="sheet-body"]')!;
    const rodape = painel.querySelector<HTMLElement>('[data-slot="sheet-footer"]')!;

    await step('O corpo é quem rola, não o painel', async () => {
      await expect(corpo).not.toBeNull();
      await expect(corpo.scrollHeight).toBeGreaterThan(corpo.clientHeight);
      // O painel em si não rola: o `flex` do corpo é o que segura o rodapé.
      await expect(painel.scrollHeight).toBeLessThanOrEqual(painel.clientHeight + 1);
    });

    await step('A região rolável é alcançável por teclado', async () => {
      // WCAG 2.1.1 — sem o tabindex quem navega por teclado não consegue rolar
      // o corpo (é a regra scrollable-region-focusable do axe).
      await expect(corpo).toHaveAttribute('tabindex', '0');
    });

    await step('O rodapé continua visível com o corpo cheio', async () => {
      const caixaRodape = rodape.getBoundingClientRect();
      const caixaPainel = painel.getBoundingClientRect();
      await expect(caixaRodape.bottom).toBeLessThanOrEqual(caixaPainel.bottom + 1);
      await expect(caixaRodape.height).toBeGreaterThan(0);
    });
  },
};
