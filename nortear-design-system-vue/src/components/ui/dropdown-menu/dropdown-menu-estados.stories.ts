import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { waitForPortal, waitForPortalGone, REGRA_GUARDA_DE_FOCO } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/DropdownMenu/States',
  component: DropdownMenu,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    docs: {
      description: {
        component:
          'Fechado, aberto, controlado por fora e item desabilitado. Teclado, foco e bloqueio ' +
          'vêm do primitivo — o que estas stories provam é que a composição não desfaz nada disso.',
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const componentes = {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
};

export const Closed: Story = {
  parameters: { covers: ['accessibility.item2'] },
  render: () => ({
    components: componentes,
    template: `
      <div style="contain: layout; min-height: 200px;">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Abrir menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const gatilho = canvas.getByRole('button', { name: /Abrir menu/i });

    await expect(gatilho).toBeVisible();
    await expect(gatilho).toHaveAttribute('aria-haspopup', 'menu');
    await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
    // O portal desmonta o popup ao fechar: fechado não é "escondido com
    // display:none", é ausente do DOM. Um popup só escondido continuaria no
    // percurso do leitor de tela.
    await expect(body.queryAllByRole('menu')).toHaveLength(0);
    await expect(body.queryAllByRole('menuitem')).toHaveLength(0);
  },
};

export const Open: Story = {
  parameters: { covers: ['functional.item2', 'accessibility.item3', 'accessibility.item4'] },
  render: () => ({
    components: componentes,
    template: `
      <div style="contain: layout; min-height: 260px;">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Abrir menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configuracoes</DropdownMenuItem>
            <DropdownMenuItem>Equipe</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const itens = within(menu).getAllByRole('menuitem');

    await step('O menu abre com os três itens', async () => {
      await expect(itens).toHaveLength(3);
      for (const item of itens) await expect(item).toHaveAttribute('role', 'menuitem');
    });

    await step('As setas descem e sobem um item por vez', async () => {
      itens[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(itens[1]);
      await userEvent.keyboard('{ArrowUp}');
      await expect(document.activeElement).toBe(itens[0]);
    });

    await step('Home e End vão ao primeiro e ao último', async () => {
      await userEvent.keyboard('{End}');
      await expect(document.activeElement).toBe(itens[2]);
      await userEvent.keyboard('{Home}');
      await expect(document.activeElement).toBe(itens[0]);
    });

    await step('Digitar uma letra salta para o item que começa com ela', async () => {
      // Typeahead: numa lista de ações longa é o que evita percorrer item por
      // item. Sem ele a letra não faz nada e o foco fica onde estava — por isso
      // a asserção compara com OUTRO item, e não com "mudou de lugar".
      await userEvent.keyboard('e');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(itens[2]);
      });
    });

    await step('O item em foco é o único destacado', async () => {
      // O realce é o que diz onde o teclado está: sem ele a navegação por setas
      // é invisível para quem enxerga.
      const destacados = itens.filter((i) => i.hasAttribute('data-highlighted'));
      await expect(destacados).toHaveLength(1);
      await expect(destacados[0]).toBe(document.activeElement);
    });
  },
};

export const Controlled: Story = {
  render: () => ({
    components: componentes,
    setup() {
      const aberto = ref(false);
      return { aberto };
    },
    template: `
      <div class="nds-stack" data-spacing="sm" style="contain: layout; min-height: 280px;">
        <Button @click="aberto = !aberto">
          {{ aberto ? 'Fechar pelo estado' : 'Abrir pelo estado' }}
        </Button>
        <DropdownMenu :open="aberto" @update:open="(v) => aberto = v" :modal="false">
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Ações</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
            <DropdownMenuItem>Arquivar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: 'Ações' });

    await step('O botão externo abre o menu', async () => {
      // Idempotente: só clica quando o estado atual não é o desejado, então o
      // replay do painel Interactions chega ao mesmo lugar.
      if (gatilho.getAttribute('aria-expanded') !== 'true') {
        await userEvent.click(canvas.getByRole('button', { name: 'Abrir pelo estado' }));
      }
      await waitForPortal('menu');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Escape fecha e o estado de fora acompanha', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('menu');
      // O rótulo do botão externo é lido do mesmo estado: se o `update:open` não
      // tivesse voltado, ele continuaria dizendo "Fechar pelo estado".
      await waitFor(async () => {
        await expect(canvas.getByRole('button', { name: 'Abrir pelo estado' })).toBeTruthy();
      });
    });
  },
};

export const ItemDisabled: Story = {
  render: () => ({
    components: componentes,
    template: `
      <div style="contain: layout; min-height: 260px;">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Ações</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem disabled>Arquivar</DropdownMenuItem>
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const itens = within(menu).getAllByRole('menuitem');
    const desabilitado = within(menu).getByRole('menuitem', { name: 'Arquivar' });

    await step('O item se anuncia desabilitado', async () => {
      await expect(desabilitado).toHaveAttribute('aria-disabled', 'true');
      await expect(desabilitado.hasAttribute('data-disabled')).toBe(true);
    });

    await step('O clique é bloqueado pelo CSS, não só pelo callback', async () => {
      // `pointer-events: none` é o que impede o clique de chegar; sem ele o item
      // continuaria clicável e o bloqueio dependeria de cada consumidor.
      await expect(getComputedStyle(desabilitado).pointerEvents).toBe('none');
    });

    await step('A seta pula o item desabilitado', async () => {
      itens[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).not.toBe(desabilitado);
      await expect(document.activeElement).toBe(itens[2]);
    });
  },
};
