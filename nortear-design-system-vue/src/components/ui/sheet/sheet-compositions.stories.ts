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
  sheetBottomPanelSource,
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
          'perfil, navegação secundária e painel de ações na base.',
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
            <div class="nds-stack" data-spacing="sm">
              <div class="nds-stack" data-spacing="xs">
                <Label for="cat">Categoria</Label>
                <Input id="cat" defaultValue="Componentes" />
              </div>
              <div class="nds-stack" data-spacing="xs">
                <Label for="status">Status</Label>
                <Input id="status" defaultValue="Estável" />
              </div>
              <div class="nds-stack" data-spacing="xs">
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
            <form class="nds-stack" data-spacing="sm">
              <div class="nds-stack" data-spacing="xs">
                <Label for="profile-name">Nome</Label>
                <Input id="profile-name" defaultValue="Juliana Mucci" />
              </div>
              <div class="nds-stack" data-spacing="xs">
                <Label for="profile-handle">Nome de usuário</Label>
                <Input id="profile-handle" defaultValue="@julianamucci" />
              </div>
              <div class="nds-stack" data-spacing="xs">
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
    // Ordem conferida por ÍNDICE, e não por presença: o campo do meio já sumiu
    // uma vez, e um `getByLabelText` solto o aceitaria de volta em qualquer
    // posição — ou casaria dois rótulos, já que um deles começa pelo outro.
    const rotulos = [...panel.querySelectorAll('label')].map((el) => el.textContent?.trim());
    await expect(rotulos).toEqual(['Nome', 'Nome de usuário', 'Bio']);
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
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Navegue entre as áreas do sistema.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <nav class="nds-stack" data-spacing="xs" aria-label="Navegação secundária">
              <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Dashboard</a>
              <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Projetos</a>
              <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Equipe</a>
              <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Configurações</a>
              <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Faturas</a>
            </nav>
          </SheetBody>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async () => {
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'left');
    const nav = within(panel).getByRole('navigation', { name: /Navegação secundária/i });
    await expect(nav).toBeVisible();
    // As CINCO seções: o conteúdo compartilhado descreve a lista, e uma stack
    // com quatro documentava uma composição que não existe.
    await expect(within(nav).getAllByRole('link')).toHaveLength(5);
    await expect(within(nav).getByRole('link', { name: 'Faturas' })).toBeVisible();
  },
};

export const BottomPanel: Story = {
  parameters: {
    docs: {
      // Painel de baixo e SEM confirmação: a decisão é a própria ação clicada, e
      // o rodapé só oferece a saída. O snippet do meta traria o par
      // cancelar/aplicar, que nesta composição não existe.
      source: { transform: sheetBottomPanelSource },
      description: {
        story: 'Fileira de ações no painel inferior — o desenho do Drawer sem o gesto de arrastar.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Ações rápidas</SheetTitle>
            <SheetDescription>Escolha uma das ações disponíveis para este item.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <div class="nds-cluster" data-spacing="md">
              <Button variant="outline">Compartilhar</Button>
              <Button variant="outline">Duplicar</Button>
              <Button variant="destructive">Excluir</Button>
            </div>
          </SheetBody>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Fechar</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async () => {
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'bottom');
    await expect(panel).toHaveAccessibleName(/Ações rápidas/i);
    await expect(within(panel).getByRole('button', { name: 'Compartilhar' })).toBeVisible();
    // Sem confirmação: o rodapé oferece apenas a saída.
    await expect(within(panel).queryByRole('button', { name: /Aplicar/i })).toBeNull();
  },
};
