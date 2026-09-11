import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, waitFor, userEvent } from 'storybook/test';
import { NDS_DROPDOWN_MENU } from './dropdown-menu';
import { dropdownMenuPlaygroundSource, type DropdownMenuArgs } from './dropdown-menu.source';
import { NdsButton } from './button';
import { waitForPortal, waitForPortalVanish, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import { pressTab } from '@/lib/press-tab';
import { clickOutside } from '@shared/testing/context-menu-area';
import { NdsDropdownMenuDocs } from '@/components/docs/DropdownMenuDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

import { figmaDesign } from '@shared/figma/design-links';
// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<DropdownMenuArgs> = {
  title: 'Components/Overlay/DropdownMenu',
  tags: ['autodocs', 'overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_DROPDOWN_MENU, NdsButton] })],
  parameters: {
    design: figmaDesign('dropdownMenu'),
    layout: 'centered',
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: { page: withAutoDocsTab(NdsDropdownMenuDocs) },
  },
  argTypes: {
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado preferido de abertura do popup em relação ao gatilho.',
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento do popup no eixo perpendicular ao lado.',
    },
    modal: {
      control: 'boolean',
      description: 'Bloqueia a interação com o resto da página enquanto o menu está aberto.',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Abre o menu já na montagem, em modo não-controlado.',
    },
    // Função em `args` sem entrada aqui NÃO chega ao template no renderer
    // Angular — o `(openChange)` ficaria ligado a nada, sem erro nenhum.
    onOpenChange: { control: false, table: { disable: true } },
  },
  args: {
    side: 'bottom',
    align: 'start',
    modal: true,
    defaultOpen: false,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<DropdownMenuArgs>;

/** Spy de escopo de módulo — dentro do `render` a `play` não o alcançaria. */
const itemChoice = fn();

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: dropdownMenuPlaygroundSource } },
    covers: [
      'functional.item1',
      'functional.item3',
      'functional.item4',
      'functional.item13',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item5',
    ],
  },
  render: (args) => ({
    // O spy do item é de escopo de módulo: criado aqui dentro, seria inalcançável
    // pela `play` e a aba Actions ficaria vazia.
    props: { ...args, onSelect: itemChoice },
    template: `
      <nds-dropdown-menu
        [modal]="modal"
        [defaultOpen]="defaultOpen"
        (openChange)="onOpenChange($event)"
      >
        <button ndsDropdownMenuTrigger ndsButton variant="outline">Abrir menu</button>

        <ng-template ndsDropdownMenuContent [side]="side" [align]="align">
          <div ndsDropdownMenuGroup>
            <div ndsDropdownMenuLabel>Conta</div>
            <!-- Os TRÊS itens ligados ao espião, como no ContextMenu e no
                 Menubar: "clicar fora não executa item nenhum" (F13) só se
                 prova com todos escutados — um item sem espião poderia
                 disparar e a asserção não veria. -->
            <div ndsDropdownMenuItem (onSelect)="onSelect('perfil')">Perfil</div>
            <div ndsDropdownMenuItem (onSelect)="onSelect('configuracoes')">Configurações</div>
            <div ndsDropdownMenuSeparator></div>
            <div ndsDropdownMenuItem variant="destructive" (onSelect)="onSelect('sair')">Sair</div>
          </div>
        </ng-template>
      </nds-dropdown-menu>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir menu' });

    await step('O gatilho anuncia que abre um menu, e que está fechado', async () => {
      await expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
      await expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    await step('Clicar abre o menu com papel de menu e foco no primeiro item', async () => {
      // Idempotente: o clique só acontece com o menu fechado, então o replay do
      // painel Interactions parte do mesmo estado da primeira rodada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);

      const menu = await waitForPortal('menu');
      await expect(trigger.getAttribute('aria-expanded')).toBe('true');
      await expect(args.onOpenChange).toHaveBeenCalledWith(true);

      const items = within(menu).getAllByRole('menuitem');
      await expect(items).toHaveLength(3);
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0]);
      });
    });

    await step('Enter escolhe o item, fecha o menu e devolve o foco ao gatilho', async () => {
      // "Item é ativado" era a metade não verificada deste item de contrato: o
      // menu fechar não prova que a ação disparou — o Escape também fecha.
      itemChoice.mockClear();
      await userEvent.keyboard('{Enter}');
      await expect(itemChoice).toHaveBeenCalledTimes(1);
      await expect(itemChoice).toHaveBeenCalledWith('perfil');
      await waitForPortalVanish('menu');
      await expect(trigger.getAttribute('aria-expanded')).toBe('false');
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
      await waitForPortalVanish('menu');
      await expect(trigger.getAttribute('aria-expanded')).toBe('false');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step('Clicar fora fecha o menu sem executar nenhum item', async () => {
      // `clickOutside` despacha `pointerdown`, `mousedown` e `click` no `<body>`
      // em vez de `userEvent.click(document.body)`: com `modal` (o padrão) a lib
      // põe `pointer-events: none` no resto da página, e o `userEvent` se RECUSA
      // a clicar ali — a play morreria com erro em vez de falha. É o mesmo
      // despacho que o ContextMenu desta stack já usa para o mesmo item.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      await waitForPortal('menu');
      itemChoice.mockClear();

      await clickOutside();
      await waitForPortalVanish('menu');
      await expect(trigger.getAttribute('aria-expanded')).toBe('false');
      // "Sem executar": o clique fora não é escolha — nenhum item ativou, e quem
      // escuta a abertura ficou sabendo que o menu fechou.
      await expect(itemChoice).not.toHaveBeenCalled();
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    });
  },
};

// ─── Tab sai do menu ──────────────────────────────────────────────────────────

/**
 * Menu não prende o foco (C2 e D1 do PRD): Tab fecha o menu e o foco segue a
 * página a partir do GATILHO — o próximo ponto de tabulação depois dele, ou o
 * anterior no Shift+Tab. Dentro do submenu, fecha o menu INTEIRO.
 *
 * Antes da correção (medido com teclado real em 2026-09-10), a lib fechava o
 * menu e o foco VOLTAVA ao gatilho: Tab e Shift+Tab davam no mesmo lugar, e no
 * submenu só o submenu fechava. O Tab é despachado à mão (`@/lib/press-tab`),
 * então o foco só chega ao vizinho se o menu o levar.
 *
 * Modal, que é o padrão: o que se prova aqui vale com o véu de interação e a
 * trava de rolagem ligados — `modal` não quer dizer armadilha de foco (D1).
 */
export const TabLeavesMenu: Story = {
  parameters: {
    // Tab e Shift+Tab a partir do menu, e Tab de DENTRO do submenu fechando o
    // menu inteiro; a última parada da página está em `TabAtPageEnd`.
    covers: ['functional.item9'],
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="md">
        <button ndsButton variant="ghost">Antes</button>
        <nds-dropdown-menu>
          <button ndsDropdownMenuTrigger ndsButton variant="outline">Abrir menu</button>

          <ng-template ndsDropdownMenuContent>
            <div ndsDropdownMenuItem>Perfil</div>
            <div ndsDropdownMenuItem>Configurações</div>

            <nds-dropdown-menu-sub>
              <div ndsDropdownMenuSubTrigger>Exportar</div>

              <ng-template ndsDropdownMenuSubContent>
                <div ndsDropdownMenuItem>PDF</div>
                <div ndsDropdownMenuItem>CSV</div>
              </ng-template>
            </nds-dropdown-menu-sub>
          </ng-template>
        </nds-dropdown-menu>
        <button ndsButton variant="ghost">Depois</button>
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
      return menu;
    };

    await step('Tab fecha o menu e o foco vai ao ponto DEPOIS do gatilho', async () => {
      await openWithItemFocused();
      pressTab();
      await waitForPortalVanish('menu');
      await expect(trigger.getAttribute('aria-expanded')).toBe('false');
      // O próximo ponto é o vizinho do GATILHO, não o fim do documento, onde o
      // painel vive em portal — e não o próprio gatilho, que era onde a lib
      // devolvia o foco.
      await waitFor(() => expect(document.activeElement).toBe(after));
    });

    await step('Shift+Tab fecha o menu e o foco vai ao ponto ANTES do gatilho', async () => {
      await openWithItemFocused();
      pressTab(true);
      await waitForPortalVanish('menu');
      await waitFor(() => expect(document.activeElement).toBe(before));
    });

    await step('Tab dentro do submenu fecha o menu INTEIRO e segue do gatilho', async () => {
      const menu = await openWithItemFocused();
      within(menu).getByRole('menuitem', { name: 'Exportar' }).focus();
      await userEvent.keyboard('{ArrowRight}');
      const submenu = () =>
        document.querySelector<HTMLElement>('[data-slot="dropdown-menu-sub-content"]');
      await waitFor(() => expect(submenu()?.contains(document.activeElement)).toBe(true));

      pressTab();
      // Os DOIS painéis: fechar só o submenu deixaria o foco num menu que a
      // pessoa quis deixar para trás.
      await waitForPortalVanish('menu');
      await expect(trigger.getAttribute('aria-expanded')).toBe('false');
      await waitFor(() => expect(document.activeElement).toBe(after));
    });
  },
};

/**
 * O gatilho como ÚLTIMA parada da página: não há vizinho para onde levar o foco.
 * O Tab tem de fechar do mesmo jeito — preso, ele seria a armadilha que C2
 * proíbe —, e o foco volta ao gatilho, nunca ao `<body>`.
 */
export const TabAtPageEnd: Story = {
  parameters: {
    covers: ['functional.item9'],
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="md">
        <button ndsButton variant="ghost">Antes</button>
        <nds-dropdown-menu>
          <button ndsDropdownMenuTrigger ndsButton variant="outline">Abrir menu</button>

          <ng-template ndsDropdownMenuContent>
            <div ndsDropdownMenuItem>Perfil</div>
            <div ndsDropdownMenuItem>Configurações</div>
          </ng-template>
        </nds-dropdown-menu>
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
      await waitForPortalVanish('menu');
      await expect(trigger.getAttribute('aria-expanded')).toBe('false');
      await waitFor(() => expect(document.activeElement).toBe(trigger));
    });
  },
};
