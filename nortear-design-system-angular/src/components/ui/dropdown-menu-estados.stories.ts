import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, userEvent } from 'storybook/test';
import { NDS_DROPDOWN_MENU } from './dropdown-menu';
import { NdsButton } from './button';
import { esperarPortal, esperarPortalSumir, REGRA_GUARDA_DE_FOCO } from '@/lib/wait-for-portal';

const meta: Meta = {
  title: 'UI/DropdownMenu/States',
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
          'Fechado, aberto, controlado por fora e item desabilitado. Teclado, foco e ' +
          'bloqueio vêm do primitivo — o que estas stories provam é que a composição não ' +
          'desfaz nada disso.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Fechado ──────────────────────────────────────────────────────────────────

export const Closed: Story = {
  parameters: { covers: ['accessibility.item2'] },
  render: () => ({
    template: `
      <nds-dropdown-menu>
        <button ndsDropdownMenuTrigger ndsButton variant="outline">Abrir menu</button>

        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuItem>Perfil</div>
          <div ndsDropdownMenuItem>Configurações</div>
        </ng-template>
      </nds-dropdown-menu>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('button', { name: 'Abrir menu' });

    await step('Só o gatilho está na tela', async () => {
      await expect(gatilho.getAttribute('aria-expanded')).toBe('false');
      // O portal desmonta o popup ao fechar: fechado não é "escondido com
      // display:none", é ausente do DOM. Um popup só escondido continuaria no
      // percurso do leitor de tela.
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(0);
      await expect(within(document.body).queryAllByRole('menuitem')).toHaveLength(0);
    });
  },
};

// ─── Aberto ───────────────────────────────────────────────────────────────────

export const Open: Story = {
  parameters: { covers: ['functional.item2'] },
  render: () => ({
    template: `
      <nds-dropdown-menu [defaultOpen]="true" [modal]="false">
        <button ndsDropdownMenuTrigger ndsButton variant="outline">Abrir menu</button>

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

    await step('Só o item destacado está no percurso do Tab', async () => {
      // Roving tabindex: os demais saem do percurso para que o Tab escape do
      // menu inteiro de uma vez, e não item por item.
      const noPercurso = itens.filter((i) => i.getAttribute('tabindex') === '0');
      await expect(noPercurso.length).toBeLessThanOrEqual(1);
    });

    await step('A seta para baixo desce um item por vez', async () => {
      itens[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(itens[1]);
      await expect(itens[1].getAttribute('data-highlighted')).toBe('');
    });

    await step('Home e End vão ao primeiro e ao último', async () => {
      await userEvent.keyboard('{End}');
      await expect(document.activeElement).toBe(itens[2]);
      await userEvent.keyboard('{Home}');
      await expect(document.activeElement).toBe(itens[0]);
    });

    await step('Digitar uma letra salta para o item que começa com ela', async () => {
      // Typeahead: numa lista de ações longa é o que evita percorrer item por
      // item. Vem do popup do primitivo, e some se a lista de itens não for
      // encontrada — daí valer a pena afirmar.
      await userEvent.keyboard('e');
      await expect(document.activeElement).toBe(itens[2]);
    });
  },
};

// ─── Controlado ───────────────────────────────────────────────────────────────

/**
 * Abertura decidida por fora, com `[open]` ligado ao estado de quem consome.
 * O menu continua fechando sozinho no Escape e no clique fora — o `openChange`
 * é o que mantém os dois lados em acordo.
 */
export const Controlled: Story = {
  render: () => ({
    props: { aberto: false },
    template: `
      <div class="nds-cluster" data-gap="sm">
        <button ndsButton variant="secondary" (click)="aberto = !aberto">
          {{ aberto ? 'Fechar pelo estado' : 'Abrir pelo estado' }}
        </button>

        <nds-dropdown-menu [open]="aberto" [modal]="false" (openChange)="aberto = $event">
          <button ndsDropdownMenuTrigger ndsButton variant="outline">Ações</button>

          <ng-template ndsDropdownMenuContent>
            <div ndsDropdownMenuItem>Duplicar</div>
            <div ndsDropdownMenuItem>Arquivar</div>
          </ng-template>
        </nds-dropdown-menu>
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
      await esperarPortal('menu');
      await expect(gatilho.getAttribute('aria-expanded')).toBe('true');
    });

    await step('Escape fecha e o estado de fora acompanha', async () => {
      await userEvent.keyboard('{Escape}');
      await esperarPortalSumir('menu');
      // O rótulo do botão externo é lido do mesmo estado: se o `openChange` não
      // tivesse voltado, ele continuaria dizendo "Fechar pelo estado".
      await expect(canvas.getByRole('button', { name: 'Abrir pelo estado' })).toBeTruthy();
    });
  },
};

// ─── Item desabilitado ────────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  render: () => ({
    props: { onSelect: fn() },
    template: `
      <nds-dropdown-menu [defaultOpen]="true" [modal]="false">
        <button ndsDropdownMenuTrigger ndsButton variant="outline">Ações</button>

        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuItem (onSelect)="onSelect('duplicar')">Duplicar</div>
          <div ndsDropdownMenuItem disabled (onSelect)="onSelect('arquivar')">Arquivar</div>
        </ng-template>
      </nds-dropdown-menu>
    `,
  }),
  play: async ({ step }) => {
    const menu = await esperarPortal('menu');
    const desabilitado = within(menu).getByRole('menuitem', { name: 'Arquivar' });

    await step('O item se anuncia desabilitado', async () => {
      await expect(desabilitado.getAttribute('aria-disabled')).toBe('true');
      await expect(desabilitado.hasAttribute('data-disabled')).toBe(true);
    });

    await step('O item desabilitado continua alcançável pela seta', async () => {
      // Padrão WAI-ARIA de menu: a seta PODE pousar no item desabilitado, para
      // que ele seja anunciado. O que ele não pode é executar.
      await expect(desabilitado.getAttribute('tabindex')).not.toBe(null);
    });

    await step('O clique é bloqueado pelo CSS, não só pelo callback', async () => {
      // `pointer-events: none` é o que impede o clique de chegar; sem ele o
      // item continuaria clicável e o bloqueio dependeria de cada consumidor.
      await expect(getComputedStyle(desabilitado).pointerEvents).toBe('none');
    });
  },
};
