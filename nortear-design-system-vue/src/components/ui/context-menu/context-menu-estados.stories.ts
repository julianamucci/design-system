import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import { REGRA_GUARDA_DE_FOCO, waitForPortal } from '@/lib/wait-for-portal';
import { AREA_CLICK_DIREITO, abrirPorGesto, brilho } from '@shared/testing/context-menu-area';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuLabel,
} from '@/components/ui/context-menu';

const meta: Meta = {
  title: 'UI/ContextMenu/States',
  component: ContextMenu,
  tags: ['overlay'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    docs: {
      description: {
        component:
          'Estados do Context Menu: item desabilitado, item recuado, item destrutivo e a paleta escura.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const componentes = {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
};

const alvo = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

// ── Item desabilitado ─────────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  parameters: {
    covers: ['functional.item9', 'accessibility.item6', 'visual.item5'],
  },
  render: () => ({
    components: componentes,
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="${AREA_CLICK_DIREITO}" data-align="center" data-justify="center" data-testid="area">
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuItem data-testid="primeiro">
              Editar
              <ContextMenuShortcut>⌘E</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem disabled data-testid="off">Duplicar</ContextMenuItem>
            <ContextMenuItem data-testid="ultimo">Renomear</ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" disabled data-testid="perigo-off">
            Excluir
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O item desabilitado é anunciado como tal', async () => {
      await abrirPorGesto(area());
      await expect(alvo('off').getAttribute('aria-disabled')).toBe('true');
      await expect(alvo('perigo-off').getAttribute('aria-disabled')).toBe('true');
    });

    await step('Ele está atenuado, e não só marcado', async () => {
      // A cor sozinha não chega a quem não a distingue; a opacidade é o sinal
      // que sobra quando o contraste falha.
      await expect(Number(getComputedStyle(alvo('off')).opacity)).toBeLessThan(1);
    });

    await step('Enter nele não escolhe nada e o menu segue aberto', async () => {
      // Ativar um item desabilitado é o caso raro em que a play pode repetir sem
      // preparo: ele não muda de estado em rodada nenhuma.
      alvo('off').focus();
      await userEvent.keyboard('{Enter}');
      await expect(await waitForPortal('menu')).toBeVisible();
    });

    await step('O ponteiro também não o alcança', async () => {
      // Aqui a asserção é a folha de estilo, e não um clique: `userEvent` se
      // recusa a clicar em elemento com `pointer-events: none` e derruba a play
      // com erro em vez de falha — o que provaria o mesmo, mas sem dizer o quê.
      await expect(getComputedStyle(alvo('off')).pointerEvents).toBe('none');
    });
  },
};

// ── Item recuado ──────────────────────────────────────────────────────────────

export const ItemInset: Story = {
  name: 'Item with inset',
  render: () => ({
    components: componentes,
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="${AREA_CLICK_DIREITO}" data-align="center" data-justify="center" data-testid="area">
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuLabel inset>Arquivo</ContextMenuLabel>
            <ContextMenuItem data-testid="normal">Editar</ContextMenuItem>
            <ContextMenuItem inset data-testid="recuado">Duplicar</ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuItem inset variant="destructive">Excluir</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O recuo é geometria, não classe', async () => {
      // O que o recuo entrega é o alinhamento com itens que têm indicador à
      // esquerda. Afirmar o nome da classe não protegeria isso: a classe pode
      // continuar aplicada com a regra vazia.
      await abrirPorGesto(area());
      const recuo = parseFloat(getComputedStyle(alvo('recuado')).paddingLeft);
      const normal = parseFloat(getComputedStyle(alvo('normal')).paddingLeft);
      await expect(recuo).toBeGreaterThan(normal);
    });

    await step('Os dois itens continuam alinhados à direita', async () => {
      // O recuo empurra só a borda esquerda: se empurrasse a caixa inteira, o
      // menu ganharia um degrau à direita.
      const recuo = alvo('recuado').getBoundingClientRect();
      const normal = alvo('normal').getBoundingClientRect();
      await expect(Math.abs(recuo.right - normal.right)).toBeLessThan(2);
    });
  },
};

// ── Item destrutivo ───────────────────────────────────────────────────────────

export const ItemDestructive: Story = {
  name: 'Destructive item',
  parameters: {
    covers: ['functional.item10', 'visual.item2'],
  },
  render: () => ({
    components: componentes,
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="${AREA_CLICK_DIREITO}" data-align="center" data-justify="center" data-testid="area">
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuItem data-testid="normal">
              Editar
              <ContextMenuShortcut>⌘E</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>Duplicar</ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" data-testid="perigo">
            Excluir permanentemente
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O item destrutivo se declara pelo atributo, não só pela cor', async () => {
      // `data-variant` é o que o CSS lê e o que a auditoria compara entre
      // stacks; a cor é consequência dele.
      await abrirPorGesto(area());
      await expect(alvo('perigo').getAttribute('data-variant')).toBe('destructive');
      await expect(alvo('normal').getAttribute('data-variant')).toBe('default');
    });

    await step('E a cor do texto realmente muda', async () => {
      await expect(getComputedStyle(alvo('perigo')).color).not.toBe(
        getComputedStyle(alvo('normal')).color,
      );
    });
  },
};

// ── Paleta escura ─────────────────────────────────────────────────────────────

export const DarkPalette: Story = {
  parameters: {
    covers: ['visual.item6'],
    // `themeOverride` é o canal do addon-themes: a classe volta sozinha na story
    // seguinte, sem precisar de limpeza manual que envenenaria a foto vizinha.
    themes: { themeOverride: 'dark' },
  },
  render: () => ({
    components: componentes,
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="${AREA_CLICK_DIREITO}" data-align="center" data-justify="center" data-testid="area">
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Editar</ContextMenuItem>
          <ContextMenuItem disabled>Duplicar</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">Excluir</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('A paleta escura está aplicada no documento', async () => {
      await waitFor(() =>
        expect(document.documentElement.classList.contains('dark')).toBe(true),
      );
    });

    await step('O menu é mais escuro que o texto que ele recebe', async () => {
      // Prova que a paleta trocou de verdade: com os tokens do claro esta
      // relação se inverte, e a asserção acusa.
      const menu = await abrirPorGesto(area());
      const cs = getComputedStyle(menu);
      await expect(brilho(cs.backgroundColor)).toBeLessThan(brilho(cs.color));
    });
  },
};
