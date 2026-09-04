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
import { FOCUS_RULE_GUARDA, waitForPortal } from '@/lib/wait-for-portal';
import {
  sheetEditPerfilSource,
  sheetFiltersAvancadosSource,
  sheetNavigationSecundariaSource,
} from './sheet.source';

const meta = {
  title: 'Components/Overlay/Sheet/Compositions',
  component: Sheet,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    // Painel modal aberto: ver o motivo em wait-for-portal.ts.
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      source: { transform: sheetFiltersAvancadosSource },
      description: {
        component:
          'Composições reais do Sheet em fluxos de produto: filtros avançados, edição de ' +
          'perfil e navegação secundária.',
      },
    },
  },
  decorators: [
    () => ({
      template: '<div class="nds-min-h-80 nds-w-full"><story /></div>',
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
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAccessibleName(/Filtros avançados/i);
    const aplicar = within(panel).getByRole('button', { name: /Aplicar filtros/i });
    await expect(aplicar).toBeVisible();
  },
};

export const ProfileEdit: Story = {
  parameters: {
    docs: {
      // O corpo é um `form` e a confirmação é o `submit` dele — o meta mostra
      // filtros soltos, sem formulário em volta.
      source: { transform: sheetEditPerfilSource },
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
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAccessibleName(/Editar perfil/i);
    const name = within(panel).getByLabelText(/Nome/i);
    await expect(name).toBeVisible();
  },
};

export const SecondaryNavigation: Story = {
  parameters: {
    docs: {
      // Painel esquerdo e SEM rodapé: a ausência do rodapé é deliberada, porque
      // a lista de links já é a ação. O snippet do meta o traria de volta.
      source: { transform: sheetNavigationSecundariaSource },
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
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'left');
    const nav = within(panel).getByRole('navigation');
    await expect(nav).toBeVisible();
  },
};
