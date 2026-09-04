import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, waitFor, userEvent } from 'storybook/test';
import { NDS_DROPDOWN_MENU } from './dropdown-menu';
import { dropdownMenuPlaygroundSource, type DropdownMenuArgs } from './dropdown-menu.source';
import { NdsButton } from './button';
import { waitForPortal, waitForPortalVanish, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import { NdsDropdownMenuDocs } from '@/components/docs/DropdownMenuDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<DropdownMenuArgs> = {
  title: 'Components/Overlay/DropdownMenu',
  tags: ['autodocs', 'overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_DROPDOWN_MENU, NdsButton] })],
  parameters: {
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
            <div ndsDropdownMenuItem (onSelect)="onSelect('perfil')">Perfil</div>
            <div ndsDropdownMenuItem>Configurações</div>
            <div ndsDropdownMenuSeparator></div>
            <div ndsDropdownMenuItem variant="destructive">Sair</div>
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
  },
};
