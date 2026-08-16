import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, waitFor, userEvent } from 'storybook/test';
import { NDS_DROPDOWN_MENU, type DropdownMenuSide, type DropdownMenuAlign } from './dropdown-menu';
import { NdsButton } from './button';
import { esperarPortal, esperarPortalSumir, REGRA_GUARDA_DE_FOCO } from '@/lib/wait-for-portal';
import { NdsDropdownMenuDocs } from '@/components/docs/DropdownMenuDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type DropdownMenuArgs = {
  side: DropdownMenuSide;
  align: DropdownMenuAlign;
  modal: boolean;
  defaultOpen: boolean;
  onOpenChange: (aberto: boolean) => void;
};

/**
 * O painel Code imprime o `template` da story como está escrito — com os
 * bindings ligados aos args (`[side]="side"`). Isso é o andaime da story, não o
 * que alguém escreve para usar o menu. O `transform` devolve o uso real, com os
 * valores atuais dos controls já resolvidos (ver a nota em `separator.stories.ts`).
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<DropdownMenuArgs> }): string {
  const { side = 'bottom', align = 'start', modal = true } = ctx.args ?? {};

  // Só o que difere do padrão entra: snippet que repete valor default ensina
  // ruído a quem copia.
  const raiz = ['<nds-dropdown-menu'].concat(modal ? [] : ['[modal]="false"']).join(' ') + '>';
  const content = ['<ng-template ndsDropdownMenuContent']
    .concat(side === 'bottom' ? [] : [`side="${side}"`])
    .concat(align === 'start' ? [] : [`align="${align}"`])
    .join(' ') + '>';

  return `import { NDS_DROPDOWN_MENU } from '@/components/ui/dropdown-menu';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_DROPDOWN_MENU, NdsButton],
  template: \`
    ${raiz}
      <button ndsDropdownMenuTrigger ndsButton variant="outline">Abrir menu</button>

      ${content}
        <div ndsDropdownMenuLabel>Conta</div>
        <div ndsDropdownMenuItem>Perfil</div>
        <div ndsDropdownMenuItem>Configurações</div>
        <div ndsDropdownMenuSeparator></div>
        <div ndsDropdownMenuItem variant="destructive">Sair</div>
      </ng-template>
    </nds-dropdown-menu>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<DropdownMenuArgs> = {
  title: 'UI/DropdownMenu',
  tags: ['autodocs', 'overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_DROPDOWN_MENU, NdsButton] })],
  parameters: {
    layout: 'centered',
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
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
const escolhaDeItem = fn();

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
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
    props: { ...args, onSelect: escolhaDeItem },
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
    const gatilho = canvas.getByRole('button', { name: 'Abrir menu' });

    await step('O gatilho anuncia que abre um menu, e que está fechado', async () => {
      await expect(gatilho.getAttribute('aria-haspopup')).toBe('menu');
      await expect(gatilho.getAttribute('aria-expanded')).toBe('false');
    });

    await step('Clicar abre o menu com papel de menu e foco no primeiro item', async () => {
      // Idempotente: o clique só acontece com o menu fechado, então o replay do
      // painel Interactions parte do mesmo estado da primeira rodada.
      if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);

      const menu = await esperarPortal('menu');
      await expect(gatilho.getAttribute('aria-expanded')).toBe('true');
      await expect(args.onOpenChange).toHaveBeenCalledWith(true);

      const itens = within(menu).getAllByRole('menuitem');
      await expect(itens).toHaveLength(3);
      await waitFor(async () => {
        await expect(document.activeElement).toBe(itens[0]);
      });
    });

    await step('Enter escolhe o item, fecha o menu e devolve o foco ao gatilho', async () => {
      // "Item é ativado" era a metade não verificada deste item de contrato: o
      // menu fechar não prova que a ação disparou — o Escape também fecha.
      escolhaDeItem.mockClear();
      await userEvent.keyboard('{Enter}');
      await expect(escolhaDeItem).toHaveBeenCalledTimes(1);
      await esperarPortalSumir('menu');
      await expect(gatilho.getAttribute('aria-expanded')).toBe('false');
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(gatilho);
      });
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
      await esperarPortal('menu');

      await userEvent.keyboard('{Escape}');
      await esperarPortalSumir('menu');
      await expect(gatilho.getAttribute('aria-expanded')).toBe('false');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(gatilho);
      });
    });
  },
};
