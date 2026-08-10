import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor, userEvent } from 'storybook/test';
import { NDS_DROPDOWN_MENU } from './dropdown-menu';
import { NdsButton } from './button';
import { esperarPortal, REGRA_GUARDA_DE_FOCO } from '@/lib/wait-for-portal';

const meta: Meta = {
  title: 'UI/DropdownMenu/Variants',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_DROPDOWN_MENU, NdsButton] })],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    docs: {
      description: {
        component:
          'As duas ênfases de item. `default` é o item neutro; `destructive` marca a ação ' +
          'irreversível com a cor de perigo, e existe para que "Excluir conta" não pareça ' +
          '"Editar perfil".',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: { covers: ['accessibility.item4', 'accessibility.item6'] },
  render: () => ({
    template: `
      <nds-dropdown-menu [defaultOpen]="true" [modal]="false">
        <button ndsDropdownMenuTrigger ndsButton variant="outline">Conta</button>

        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuItem>Perfil</div>
          <div ndsDropdownMenuItem>Configurações</div>
          <div ndsDropdownMenuItem>Equipe</div>
        </ng-template>
      </nds-dropdown-menu>
    `,
  }),
  play: async ({ step }) => {
    const menu = await esperarPortal('menu');
    const itens = within(menu).getAllByRole('menuitem');

    await step('A variante default é escrita no markup', async () => {
      // Afirmar o atributo resultante é o que impede o defeito silencioso do
      // fallback JIT: sob JIT os `input()` não são vistos e o componente
      // renderiza com os valores padrão, sem erro nenhum na tela.
      await expect(itens).toHaveLength(3);
      for (const item of itens) {
        await expect(item.getAttribute('data-variant')).toBe('default');
        await expect(item.classList.contains('nds-dropdown-menu-item')).toBe(true);
      }
    });

    await step('O item neutro herda a cor do popup, sem cor semântica', async () => {
      // O item destacado (o primeiro, que recebe o foco ao abrir) troca de cor
      // de propósito — a comparação tem que ser com um item em repouso, senão
      // ela mede o realce e não a variante.
      const emRepouso = itens.filter((i) => !i.hasAttribute('data-highlighted'));
      await expect(emRepouso.length).toBeGreaterThan(0);
      await expect(getComputedStyle(emRepouso[0]).color).toBe(getComputedStyle(menu).color);
    });

    await step('O popup é opaco', async () => {
      // O contraste de 4.5:1 que o axe mede entre o texto do item e o fundo do
      // popup só significa alguma coisa se o fundo for opaco: sobre um painel
      // translúcido a razão medida é a do que estiver por baixo.
      const fundo = getComputedStyle(menu).backgroundColor;
      await expect(fundo).not.toBe('rgba(0, 0, 0, 0)');
      await expect(fundo).not.toBe('transparent');
      await expect(fundo.startsWith('rgba(')).toBe(false);
    });
  },
};

// ─── Destructive ──────────────────────────────────────────────────────────────

export const Destructive: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => ({
    template: `
      <nds-dropdown-menu [defaultOpen]="true" [modal]="false">
        <button ndsDropdownMenuTrigger ndsButton variant="outline">Conta</button>

        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuItem>Perfil</div>
          <div ndsDropdownMenuSeparator></div>
          <div ndsDropdownMenuItem variant="destructive">Excluir conta</div>
        </ng-template>
      </nds-dropdown-menu>
    `,
  }),
  play: async ({ step }) => {
    const menu = await esperarPortal('menu');
    const canvas = within(menu);
    const neutro = canvas.getByRole('menuitem', { name: 'Perfil' });
    const perigoso = canvas.getByRole('menuitem', { name: 'Excluir conta' });

    await step('A variante chega ao markup', async () => {
      await expect(perigoso.getAttribute('data-variant')).toBe('destructive');
    });

    await step('A cor do texto distingue a ação irreversível', async () => {
      // O seletor do CSS é `[data-variant="destructive"]`: se o atributo não
      // chegasse, esta asserção pegaria a mesma cor do item neutro.
      await expect(getComputedStyle(perigoso).color).not.toBe(getComputedStyle(neutro).color);
    });

    await step('O destaque não depende só da cor: o realce pinta o fundo', async () => {
      // Critério 1.4.1 na prática — quem não distingue matiz precisa do fundo.
      // O ponteiro é o que realça: o primitivo marca `data-highlighted` no
      // `pointermove`, e é esse atributo (não `:hover`) que o CSS usa.
      const antes = getComputedStyle(perigoso).backgroundColor;
      await userEvent.hover(perigoso);
      await waitFor(async () => {
        await expect(perigoso.hasAttribute('data-highlighted')).toBe(true);
        await expect(getComputedStyle(perigoso).backgroundColor).not.toBe(antes);
      });
    });
  },
};
