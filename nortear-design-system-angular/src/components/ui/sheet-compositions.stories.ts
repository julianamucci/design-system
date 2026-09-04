import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import { NDS_SHEET } from './sheet';
import { NdsButton } from './button';
import { NdsInput } from './input';
import { NdsLabel } from './label';
import { waitForPortal } from '@/lib/wait-for-portal';

// As duas composições que o conteúdo compartilhado documenta
// (`variants.compositions`): filtros avançados à direita e navegação secundária
// à esquerda. Este arquivo NÃO existia — a stack tinha as quatro direções e os
// estados, e as composições viviam só na docs page. Nada acusava: o
// `story_group_divergent` compara story pelo NOME, e uma story que não existe
// em lugar nenhum não tem nome para comparar.
//
// As duas nascem ABERTAS: é o estado que a regressão visual captura e o que o
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
          'Composições reais do Sheet em fluxos de produto: filtros avançados à direita e ' +
          'navegação secundária à esquerda.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const AdvancedFilters: Story = {
  parameters: {
    docs: {
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
      await expect(within(nav).getAllByRole('link')).toHaveLength(4);
    });

    await step('Sem rodapé: a saída é o X do canto', async () => {
      await expect(panel.querySelector('[data-slot="sheet-footer"]')).toBeNull();
      await expect(within(panel).getByRole('button', { name: 'Fechar' })).toBeVisible();
    });
  },
};
