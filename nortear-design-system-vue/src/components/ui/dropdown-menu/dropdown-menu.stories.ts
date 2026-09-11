import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, fn, waitFor } from 'storybook/test';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import DropdownMenuDocs from '@/components/docs/DropdownMenuDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal, waitForPortalGone, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import { dropdownMenuSource } from './dropdown-menu.source';

import { figmaDesign } from '@shared/figma/design-links';
const meta = {
  title: 'Components/Overlay/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('dropdownMenu'),
    layout: 'centered',
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      page: withAutoDocsTab(DropdownMenuDocs),
      source: { transform: dropdownMenuSource },
      description: {
        component:
          'Menu suspenso acionado por botão. Renderiza em portal com role=menu, recebe o foco ' +
          'ao abrir e é navegado pelas setas; Tab sai do menu e o fecha. Suporta items, checkbox-items, radio-groups, ' +
          'submenus, separators, labels e shortcuts.',
      },
    },
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    modal: {
      control: 'boolean',
      description: 'Bloqueia a interação com o resto da página enquanto o menu está aberto.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    'onUpdate:open': { control: false, table: { disable: true } },
  },
  args: {
    defaultOpen: false,
    modal: true,
    'onUpdate:open': fn(),
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item5',
    ],
  },
  render: (args) => ({
    components: {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuGroup,
      DropdownMenuItem,
      DropdownMenuLabel,
      DropdownMenuSeparator,
      DropdownMenuTrigger,
      Button,
    },
    setup() {
      return { args };
    },
    template: `
      <div class="nds-min-h-80" style="contain: layout">
        <DropdownMenu :key="String(args.defaultOpen)" v-bind="args">
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Abrir menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Conta</DropdownMenuLabel>
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir menu/i });

    await step('O gatilho anuncia que abre um menu, e que está fechado', async () => {
      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar abre o menu com papel de menu e o foco entra nele', async () => {
      // Idempotente: o clique só acontece com o menu fechado, então o replay do
      // painel Interactions parte do mesmo estado da primeira rodada. Antes daqui
      // o clique era cego e a segunda rodada FECHAVA o menu que ia afirmar aberto.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);

      const menu = await waitForPortal('menu');
      await expect(menu).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(within(menu).getAllByRole('menuitem')).toHaveLength(3);
      // O foco tem que ENTRAR no menu: se ficasse no gatilho, a seta seguinte
      // não acharia item nenhum e o menu seria inoperável por teclado.
      await waitFor(async () => {
        await expect(menu.contains(document.activeElement)).toBe(true);
      });
    });

    await step('Enter escolhe o item, fecha o menu e devolve o foco ao gatilho', async () => {
      const menu = await waitForPortal('menu');
      within(menu).getAllByRole('menuitem')[0].focus();
      await userEvent.keyboard('{Enter}');
      await waitForPortalGone('menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      await waitForPortal('menu');

      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });
  },
};

/**
 * Um `Tab` de teclado, DESPACHADO À MÃO no elemento em foco.
 *
 * `userEvent.keyboard('{Tab}')` e `userEvent.tab()` MOVEM O FOCO primeiro e só
 * então anunciam a tecla — medido no popover do svelte, e registrado no menu de
 * contexto de lá. Aqui isso mediria outra coisa: quem decide o Tab é o `keydown`
 * do PAINEL, e com o foco já fora dele a tecla nunca chega. Despachar reproduz a
 * ordem do teclado real — `keydown` no item em foco primeiro.
 */
function pressTab(shift = false): void {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true }),
  );
}

export const TabLeavesMenu: Story = {
  parameters: {
    // O menu é MODAL aqui, que é o padrão: é no modal que a lib prende o Tab.
    controls: { disable: true },
  },
  render: () => ({
    components: { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Button },
    template: `
      <div class="nds-cluster nds-min-h-80" data-spacing="md" style="contain: layout">
        <Button variant="ghost">Antes</Button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Abrir menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost">Depois</Button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir menu' });
    const before = canvas.getByRole('button', { name: 'Antes' });
    const after = canvas.getByRole('button', { name: 'Depois' });

    const openWithItemFocused = async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const menu = await waitForPortal('menu');
      within(menu).getAllByRole('menuitem')[0].focus();
      await expect(menu.contains(document.activeElement)).toBe(true);
    };

    await step('Aberto, o menu segue modal: véu de interação e trava de rolagem (D1)', async () => {
      await openWithItemFocused();
      // É o que `modal` quer dizer neste componente — e é o que se perderia se o
      // Tab fosse consertado desligando `modal`.
      await expect(document.body.style.pointerEvents).toBe('none');
      await expect(getComputedStyle(document.body).overflow).toBe('hidden');
    });

    await step('Tab sai do menu, fecha e segue para o próximo ponto da página', async () => {
      pressTab();
      await waitForPortalGone('menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      // O próximo ponto é o vizinho do GATILHO, não o fim do documento, onde o
      // painel vive em portal.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(after);
      });
      await expect(getComputedStyle(document.body).overflow).not.toBe('hidden');
    });

    await step('Shift+Tab sai para o ponto ANTERIOR ao gatilho', async () => {
      await openWithItemFocused();
      pressTab(true);
      await waitForPortalGone('menu');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(before);
      });
    });
  },
};

/**
 * O gatilho como ÚLTIMA parada da página: não há vizinho para onde levar o foco.
 * O Tab tem de fechar do mesmo jeito — preso, ele seria a armadilha que C2 proíbe
 * —, e o foco volta ao gatilho pelo caminho da lib.
 */
export const TabAtPageEnd: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Button },
    template: `
      <div class="nds-cluster nds-min-h-80" data-spacing="md" style="contain: layout">
        <Button variant="ghost">Antes</Button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Abrir menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Abrir menu' });

    await step('Sem próxima parada, Tab ainda fecha o menu e o foco volta ao gatilho', async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const menu = await waitForPortal('menu');
      within(menu).getAllByRole('menuitem')[0].focus();

      pressTab();
      await waitForPortalGone('menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });
  },
};
