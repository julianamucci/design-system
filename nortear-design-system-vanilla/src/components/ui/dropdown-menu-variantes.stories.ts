import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createDropdownMenu, type DropdownMenuItemDef } from './dropdown-menu';
import { createButton } from './button';
import { contrasteDoItem } from '@shared/testing/dropdown-menu-probe';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/DropdownMenu/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.style.minHeight = '180px';
  wrapper.appendChild(child);
  return wrapper;
}

function montar(rotulo: string, items: DropdownMenuItemDef[]): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: rotulo });
  const menu = createDropdownMenu({ trigger, items });
  queueMicrotask(() => trigger.click());
  return wrap(menu);
}

async function fecharNoFim(): Promise<void> {
  const body = within(document.body);
  await userEvent.keyboard('{Escape}');
  await waitFor(() => {
    if (body.queryByRole('menu')) throw new Error('menu ainda aberto');
  });
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: { covers: ['accessibility.item4', 'accessibility.item6'] },
  render: () =>
    montar('Ações', [
      { type: 'item', label: 'Editar', value: 'edit' },
      { type: 'item', label: 'Duplicar', value: 'duplicate' },
      { type: 'item', label: 'Compartilhar', value: 'share' },
    ]),
  play: async ({ step }) => {
    const menu = await within(document.body).findByRole('menu');
    const itens = within(menu).getAllByRole('menuitem');

    await step('A variante default é escrita no markup', async () => {
      await expect(itens).toHaveLength(3);
      for (const item of itens) {
        await expect(item.dataset.variant).toBe('default');
        await expect(item.classList.contains('nds-dropdown-menu-item')).toBe(true);
      }
    });

    await step('O item neutro herda a cor do popup, sem cor semântica', async () => {
      // O item em foco troca de cor de propósito — a comparação tem que ser com
      // um item em repouso, senão mede o realce e não a variante.
      const emRepouso = itens.filter((i) => i !== document.activeElement);
      await expect(emRepouso.length).toBeGreaterThan(0);
      await expect(getComputedStyle(emRepouso[0]).color).toBe(getComputedStyle(menu).color);
    });

    await step('O texto do item atinge 4.5:1 sobre o fundo do popup', async () => {
      // O item de contrato dizia "verificar por axe-core" — verificação que
      // ninguém rodava: o axe do test-runner mede o que está na tela, e comparar
      // nome de token não responde a pergunta. A razão é aritmética. 14px em
      // peso normal é texto normal pela WCAG: o limite é 4.5, não 3.
      const emRepouso = itens.filter((i) => i !== document.activeElement);
      const medida = contrasteDoItem(emRepouso[0]);
      await expect(medida).not.toBeNull();
      await expect(medida!.razao).toBeGreaterThanOrEqual(4.5);
    });

    await step('Limpa via ESC', async () => {
      await fecharNoFim();
    });
  },
};

// ─── Destructive ──────────────────────────────────────────────────────────────

export const Destructive: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () =>
    montar('Mais ações', [
      { type: 'item', label: 'Editar', value: 'edit' },
      { type: 'separator' },
      { type: 'item', label: 'Excluir conta', value: 'delete', variant: 'destructive' },
    ]),
  play: async ({ step }) => {
    const menu = await within(document.body).findByRole('menu');
    const canvas = within(menu);
    const neutro = canvas.getByRole('menuitem', { name: 'Editar' });
    const perigoso = canvas.getByRole('menuitem', { name: 'Excluir conta' });

    await step('A variante chega ao markup', async () => {
      await expect(perigoso.dataset.variant).toBe('destructive');
    });

    await step('A cor do texto distingue a ação irreversível', async () => {
      // O seletor do CSS é `[data-variant="destructive"]`: se o atributo não
      // chegasse, esta asserção pegaria a mesma cor do item neutro. O neutro tem
      // que estar em repouso para a comparação medir a variante, não o realce.
      neutro.blur();
      await expect(getComputedStyle(perigoso).color).not.toBe(getComputedStyle(neutro).color);
    });

    await step('O destaque não depende só da cor: o realce pinta o fundo', async () => {
      // Critério 1.4.1 na prática — quem não distingue matiz precisa do fundo.
      const antes = getComputedStyle(perigoso).backgroundColor;
      perigoso.focus();
      await waitFor(async () => {
        await expect(getComputedStyle(perigoso).backgroundColor).not.toBe(antes);
      });
    });

    await step('Limpa via ESC', async () => {
      await fecharNoFim();
    });
  },
};
