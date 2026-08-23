import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { waitForPortal, waitForPortalGone, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import { formaDoIndicador, ehTraco, ehTique } from '@shared/testing/menu-checkbox-indicator';
import {
  dropdownMenuOpenSource,
  dropdownMenuControlledSource,
  dropdownMenuClosedSource,
  dropdownMenuItemDisabledSource,
  dropdownMenuMarkupMistaSource,
} from './dropdown-menu.source';

const meta = {
  title: 'UI/DropdownMenu/States',
  component: DropdownMenu,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      source: { transform: dropdownMenuClosedSource },
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
  DropdownMenuCheckboxItem,
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
    const trigger = canvas.getByRole('button', { name: /Abrir menu/i });

    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // O portal desmonta o popup ao fechar: fechado não é "escondido com
    // display:none", é ausente do DOM. Um popup só escondido continuaria no
    // percurso do leitor de tela.
    await expect(body.queryAllByRole('menu')).toHaveLength(0);
    await expect(body.queryAllByRole('menuitem')).toHaveLength(0);
  },
};

export const Open: Story = {
  parameters: {
    covers: ['functional.item2', 'accessibility.item3', 'accessibility.item4'],
    // Aqui a montagem já aberta É o assunto — nas outras stories a prop é só
    // andaime da foto do Chromatic.
    docs: { source: { transform: dropdownMenuOpenSource } },
  },
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
    const items = within(menu).getAllByRole('menuitem');

    await step('O menu abre com os três itens', async () => {
      await expect(items).toHaveLength(3);
      for (const item of items) await expect(item).toHaveAttribute('role', 'menuitem');
    });

    await step('As setas descem e sobem um item por vez', async () => {
      items[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(items[1]);
      await userEvent.keyboard('{ArrowUp}');
      await expect(document.activeElement).toBe(items[0]);
    });

    await step('Home e End vão ao primeiro e ao último', async () => {
      await userEvent.keyboard('{End}');
      await expect(document.activeElement).toBe(items[2]);
      await userEvent.keyboard('{Home}');
      await expect(document.activeElement).toBe(items[0]);
    });

    await step('Digitar uma letra salta para o item que começa com ela', async () => {
      // Typeahead: numa lista de ações longa é o que evita percorrer item por
      // item. Sem ele a letra não faz nada e o foco fica onde estava — por isso
      // a asserção compara com OUTRO item, e não com "mudou de lugar".
      await userEvent.keyboard('e');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[2]);
      });
    });

    await step('O item em foco é o único destacado', async () => {
      // O realce é o que diz onde o teclado está: sem ele a navegação por setas
      // é invisível para quem enxerga.
      const destacados = items.filter((i) => i.hasAttribute('data-highlighted'));
      await expect(destacados).toHaveLength(1);
      await expect(destacados[0]).toBe(document.activeElement);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    // Entram o par prop+evento e o botão de fora que lê o mesmo estado — nada
    // disso está no snippet do meta.
    docs: { source: { transform: dropdownMenuControlledSource } },
  },
  render: () => ({
    components: componentes,
    setup() {
      const isOpen = ref(false);
      return { isOpen };
    },
    template: `
      <div class="nds-stack nds-min-h-70" data-spacing="sm" style="contain: layout">
        <Button @click="isOpen = !isOpen">
          {{ isOpen ? 'Fechar pelo estado' : 'Abrir pelo estado' }}
        </Button>
        <DropdownMenu :open="isOpen" @update:open="(v) => isOpen = v" :modal="false">
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
    const trigger = canvas.getByRole('button', { name: 'Ações' });

    await step('O botão externo abre o menu', async () => {
      // Idempotente: só clica quando o estado atual não é o desejado, então o
      // replay do painel Interactions chega ao mesmo lugar.
      if (trigger.getAttribute('aria-expanded') !== 'true') {
        await userEvent.click(canvas.getByRole('button', { name: 'Abrir pelo estado' }));
      }
      await waitForPortal('menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
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
  parameters: {
    // A prop que tira o item da navegação não aparece no snippet do meta.
    docs: { source: { transform: dropdownMenuItemDisabledSource } },
  },
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
    const items = within(menu).getAllByRole('menuitem');
    const disabled = within(menu).getByRole('menuitem', { name: 'Arquivar' });

    await step('O item se anuncia desabilitado', async () => {
      await expect(disabled).toHaveAttribute('aria-disabled', 'true');
      await expect(disabled.hasAttribute('data-disabled')).toBe(true);
    });

    await step('O clique é bloqueado pelo CSS, não só pelo callback', async () => {
      // `pointer-events: none` é o que impede o clique de chegar; sem ele o item
      // continuaria clicável e o bloqueio dependeria de cada consumidor.
      await expect(getComputedStyle(disabled).pointerEvents).toBe('none');
    });

    await step('A seta pula o item desabilitado', async () => {
      items[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).not.toBe(disabled);
      await expect(document.activeElement).toBe(items[2]);
    });
  },
};

// ─── CheckboxIndeterminate ────────────────────────────────────────────────────
//
// Story SEM interação, de propósito. O que ela declara vale na montagem, e o
// primeiro clique num item misto o resolve para marcado — uma play que clicasse
// aqui mediria outro estado no REPLAY do painel Interactions, que reexecuta no
// mesmo DOM. Sem clique, cada rodada mede exatamente o mesmo.

export const CheckboxIndeterminate: Story = {
  parameters: {
    covers: ['functional.item8'],
    // Itens de MARCAÇÃO nos três estados, e não itens de ação: outra peça e
    // outra prop.
    docs: { source: { transform: dropdownMenuMarkupMistaSource } },
  },
  render: () => ({
    components: componentes,
    template: `
      <div style="contain: layout; min-height: 260px;">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Colunas</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuCheckboxItem model-value="indeterminate">Nome</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem :model-value="true">E-mail</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem :model-value="false">Telefone</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const misto = canvas.getByRole('menuitemcheckbox', { name: 'Nome' });
    const checked = canvas.getByRole('menuitemcheckbox', { name: 'E-mail' });
    const desmarcado = canvas.getByRole('menuitemcheckbox', { name: 'Telefone' });

    await step('O estado misto é anunciado como misto, e não como marcado', async () => {
      await expect(misto.getAttribute('aria-checked')).toBe('mixed');
      await expect(checked.getAttribute('aria-checked')).toBe('true');
      await expect(desmarcado.getAttribute('aria-checked')).toBe('false');
    });

    await step('O misto desenha traço; o marcado, tique', async () => {
      // A medida é a GEOMETRIA do glifo, não o nome da classe nem o do ícone:
      // traço é largo e sem altura, tique tem a diagonal.
      const formaMista = formaDoIndicador(misto);
      const formaMarcada = formaDoIndicador(checked);
      await expect(ehTraco(formaMista)).toBe(true);
      await expect(ehTique(formaMista)).toBe(false);
      await expect(ehTique(formaMarcada)).toBe(true);
    });

    await step('O desmarcado continua sem glifo nenhum', async () => {
      await expect(formaDoIndicador(desmarcado)).toBeNull();
    });
  },
};
