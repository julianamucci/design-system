import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import { NDS_SHEET } from './sheet';
import { NdsButton } from './button';
import { NdsInput } from './input';
import { NdsLabel } from './label';
import { waitForPortal } from '@/lib/wait-for-portal';
import {
  sheetAdvancedFiltersSource,
  sheetBottomPanelSource,
  sheetProfileEditSource,
  sheetSecondaryNavigationSource,
} from './sheet.source';

// As QUATRO composições que o conteúdo compartilhado documenta
// (`variants.compositions`): filtros avançados à direita, navegação secundária à
// esquerda, edição de perfil à direita e painel de ações embaixo. Este arquivo
// NÃO existia — a stack tinha as quatro direções e os estados, e as composições
// viviam só na docs page. Nada acusava: o `story_group_divergent` compara story
// pelo NOME, e uma story que não existe em lugar nenhum não tem nome para
// comparar. Edição de perfil e painel inferior chegaram depois das outras duas,
// pelo mesmo caminho e pelo mesmo motivo.
//
// As quatro nascem ABERTAS: é o estado que a regressão visual captura e o que o
// axe tem para examinar — fechado, o painel nem está no DOM.

const meta: Meta = {
  title: 'Components/Overlay/Sheet/Compositions',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_SHEET, NdsButton, NdsInput, NdsLabel] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composições reais do Sheet em fluxos de produto: filtros avançados, navegação ' +
          'secundária, edição de perfil e painel inferior.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const AdvancedFilters: Story = {
  parameters: {
    docs: {
      source: { transform: sheetAdvancedFiltersSource },
      description: {
        story:
          'Sheet à direita com filtros avançados em formulário. O título nomeia a ação, a ' +
          'descrição orienta o uso e o rodapé traz a saída mais a ação primária.',
      },
    },
  },
  render: () => ({
    template: `
      <nds-sheet [defaultOpen]="true">
        <button ndsSheetTrigger ndsButton variant="outline">Abrir filtros</button>

        <ng-template ndsSheetContent side="right">
          <div ndsSheetHeader>
            <h2 ndsSheetTitle>Filtros avançados</h2>
            <p ndsSheetDescription>Configure os filtros para refinar os resultados.</p>
          </div>

          <div ndsSheetBody>
            <form class="nds-grid" data-spacing="md">
              <div class="nds-grid" data-spacing="xs">
                <label ndsLabel for="comp-categoria">Categoria</label>
                <input ndsInput id="comp-categoria" value="Eletrônicos" />
              </div>
              <div class="nds-grid" data-spacing="xs">
                <label ndsLabel for="comp-minimo">Preço mínimo</label>
                <input ndsInput id="comp-minimo" type="number" value="100" />
              </div>
            </form>
          </div>

          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">Cancelar</button>
            <button ndsButton>Aplicar filtros</button>
          </div>
        </ng-template>
      </nds-sheet>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('O painel abre à direita, nomeado pelo próprio título', async () => {
      await expect(panel).toHaveAttribute('data-side', 'right');
      await expect(panel).toHaveAccessibleName(/Filtros avançados/i);
    });

    await step('O formulário mora no corpo, e o rodapé fica fora dele', async () => {
      const body = panel.querySelector<HTMLElement>('[data-slot="sheet-body"]');
      const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]');
      await expect(body).not.toBeNull();
      await expect(footer).not.toBeNull();
      // É o que mantém as ações visíveis quando o formulário cresce.
      await expect(body!.contains(footer!)).toBe(false);
      await expect(within(panel).getByLabelText(/Categoria/i)).toBeVisible();
    });
  },
};

export const SecondaryNavigation: Story = {
  parameters: {
    docs: {
      source: { transform: sheetSecondaryNavigationSource },
      description: {
        story:
          'Sheet à esquerda como menu de navegação secundária — itens clicáveis dentro do ' +
          'painel, sem rodapé.',
      },
    },
  },
  render: () => ({
    template: `
      <nds-sheet [defaultOpen]="true">
        <button ndsSheetTrigger ndsButton variant="outline">Abrir menu</button>

        <ng-template ndsSheetContent side="left">
          <div ndsSheetHeader>
            <h2 ndsSheetTitle>Menu</h2>
            <p ndsSheetDescription>Navegue entre as áreas do sistema.</p>
          </div>

          <div ndsSheetBody>
            <!-- Marco de navegação com nome próprio: a página já tem um <nav>, e
                 dois sem nome distinto ficam indistinguíveis para quem navega
                 por marcos. -->
            <nav aria-label="Navegação secundária" class="nds-stack" data-spacing="xs">
              <a href="#dashboard" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Dashboard</a>
              <a href="#projetos" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Projetos</a>
              <a href="#equipe" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Equipe</a>
              <a href="#configuracoes" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Configurações</a>
              <a href="#faturas" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Faturas</a>
            </nav>
          </div>
        </ng-template>
      </nds-sheet>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('O menu abre à esquerda, com o marco nomeado', async () => {
      await expect(panel).toHaveAttribute('data-side', 'left');
      const nav = within(panel).getByRole('navigation', { name: /Navegação secundária/i });
      await expect(nav).toBeVisible();
      // CINCO seções: é a lista que o conteúdo compartilhado descreve. Esta
      // asserção já cobrou quatro, guardando verde um menu incompleto.
      await expect(within(nav).getAllByRole('link')).toHaveLength(5);
      await expect(within(nav).getByRole('link', { name: 'Faturas' })).toBeVisible();
    });

    await step('Sem rodapé: a saída é o X do canto', async () => {
      await expect(panel.querySelector('[data-slot="sheet-footer"]')).toBeNull();
      await expect(within(panel).getByRole('button', { name: 'Fechar' })).toBeVisible();
    });
  },
};

export const ProfileEdit: Story = {
  parameters: {
    docs: {
      source: { transform: sheetProfileEditSource },
      description: {
        story:
          'Sheet à direita para editar poucos campos relacionados sem tirar a pessoa da ' +
          'listagem. Passando de um punhado de campos, a edição merece página própria.',
      },
    },
  },
  render: () => ({
    template: `
      <nds-sheet [defaultOpen]="true">
        <button ndsSheetTrigger ndsButton variant="outline">Editar perfil</button>

        <ng-template ndsSheetContent>
          <div ndsSheetHeader>
            <h2 ndsSheetTitle>Editar perfil</h2>
            <p ndsSheetDescription>Atualize suas informações pessoais. As mudanças são salvas ao confirmar.</p>
          </div>

          <div ndsSheetBody>
            <form id="perfil-form" class="nds-grid" data-spacing="md">
              <div class="nds-grid" data-spacing="xs">
                <label ndsLabel for="perfil-nome">Nome</label>
                <input ndsInput id="perfil-nome" value="Juliana Mucci" />
              </div>
              <div class="nds-grid" data-spacing="xs">
                <label ndsLabel for="perfil-usuario">Nome de usuário</label>
                <input ndsInput id="perfil-usuario" value="@julianamucci" />
              </div>
              <div class="nds-grid" data-spacing="xs">
                <label ndsLabel for="perfil-bio">Bio</label>
                <input ndsInput id="perfil-bio" value="Designer de sistemas em São Paulo" />
              </div>
            </form>
          </div>

          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">Cancelar</button>
            <button ndsButton type="submit" form="perfil-form">Salvar alterações</button>
          </div>
        </ng-template>
      </nds-sheet>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('O painel abre à direita, nomeado pelo próprio título', async () => {
      await expect(panel).toHaveAttribute('data-side', 'right');
      await expect(panel).toHaveAccessibleName(/Editar perfil/i);
    });

    await step('Os três campos saem na ordem do conteúdo compartilhado', async () => {
      // Por ÍNDICE, e não por presença: o campo do meio já sumiu uma vez, e uma
      // busca solta o aceitaria de volta em qualquer posição — ou casaria dois
      // rótulos, já que um deles começa pelo outro.
      const rotulos = [...panel.querySelectorAll('label')].map((el) => el.textContent?.trim());
      await expect(rotulos).toEqual(['Nome', 'Nome de usuário', 'Bio']);
    });

    await step('A confirmação é o ENVIO do formulário, ligado pelo id', async () => {
      // O rodapé mora fora do corpo rolável: o botão não está dentro do `form`,
      // e sem o atributo nem o clique nem o Enter no campo enviariam.
      const form = panel.querySelector<HTMLFormElement>('form');
      await expect(form).not.toBeNull();
      const submit = panel.querySelector<HTMLButtonElement>('button[type="submit"]');
      await expect(submit).not.toBeNull();
      await expect(submit).toHaveAttribute('form', form!.id);
    });
  },
};

export const BottomPanel: Story = {
  parameters: {
    docs: {
      source: { transform: sheetBottomPanelSource },
      description: {
        story:
          'Sheet inferior — o mesmo desenho do Drawer mobile, sem o gesto de arrastar. ' +
          'Quando o gesto importa, o componente é o Drawer.',
      },
    },
  },
  render: () => ({
    template: `
      <nds-sheet [defaultOpen]="true">
        <button ndsSheetTrigger ndsButton variant="outline">Abrir ações</button>

        <ng-template ndsSheetContent side="bottom">
          <div ndsSheetHeader>
            <h2 ndsSheetTitle>Ações rápidas</h2>
            <p ndsSheetDescription>Escolha uma das ações disponíveis para este item.</p>
          </div>

          <div ndsSheetBody>
            <!-- A destrutiva é a ÚLTIMA e a única com a variante que a anuncia:
                 três botões destrutivos lado a lado tirariam o peso justamente
                 de quem precisa dele. -->
            <div class="nds-cluster" data-spacing="md">
              <button ndsButton variant="outline">Compartilhar</button>
              <button ndsButton variant="outline">Duplicar</button>
              <button ndsButton variant="destructive">Excluir</button>
            </div>
          </div>

          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">Fechar</button>
          </div>
        </ng-template>
      </nds-sheet>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('O painel entra por baixo, nomeado pelo próprio título', async () => {
      await expect(panel).toHaveAttribute('data-side', 'bottom');
      await expect(panel).toHaveAccessibleName(/Ações rápidas/i);
    });

    await step('As três ações moram no corpo; o rodapé só oferece a saída', async () => {
      const body = panel.querySelector<HTMLElement>('[data-slot="sheet-body"]');
      const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]');
      await expect(body).not.toBeNull();
      await expect(footer).not.toBeNull();
      await expect(within(body!).getAllByRole('button')).toHaveLength(3);
      // A busca é DENTRO do rodapé porque o X do canto também se chama
      // "Fechar" — no painel inteiro haveria dois.
      await expect(within(footer!).getAllByRole('button')).toHaveLength(1);
      await expect(within(footer!).getByRole('button', { name: 'Fechar' })).toBeVisible();
    });
  },
};
