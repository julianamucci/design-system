import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, userEvent, expect, waitFor } from 'storybook/test';
import { Root as ContextMenu } from './index';
import ContextMenuEstadoStory from './ContextMenuEstadoStory.svelte';
import { FOCUS_RULE_GUARDA, waitForPortal } from '@/lib/wait-for-portal';
import { gestoOpen, brilho } from '@shared/testing/context-menu-area';
import { formaDoIndicador, ehTraco, ehTique } from '@shared/testing/menu-checkbox-indicator';
import {
  contextMenuItemDisabledSource,
  contextMenuItemDestructiveSource,
  contextMenuItemRecuadoSource,
  contextMenuMarkupMistaSource,
  contextMenuPaletteDarkSource,
  contextMenuSource,
} from './context-menu.source';

const meta: Meta = {
  title: 'UI/ContextMenu/States',
  component: ContextMenu,
  tags: ['overlay'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: contextMenuSource },
      description: {
        component:
          'Estados do Context Menu: item desabilitado, item recuado, item destrutivo e a paleta escura.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const alvo = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

// ── Item desabilitado ─────────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  parameters: {
    covers: ['functional.item9', 'accessibility.item6', 'visual.item5'],
    docs: { source: { transform: contextMenuItemDisabledSource } },
  },
  render: () => ({ Component: ContextMenuEstadoStory, props: { state: 'disabled' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O item desabilitado é anunciado como tal', async () => {
      await gestoOpen(area());
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
  parameters: {
    docs: { source: { transform: contextMenuItemRecuadoSource } },
  },
  render: () => ({ Component: ContextMenuEstadoStory, props: { state: 'inset' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O recuo é geometria, não classe', async () => {
      // O que o recuo entrega é o alinhamento com itens que têm indicador à
      // esquerda. Afirmar o nome da classe não protegeria isso: a classe pode
      // continuar aplicada com a regra vazia.
      await gestoOpen(area());
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
    docs: { source: { transform: contextMenuItemDestructiveSource } },
  },
  render: () => ({ Component: ContextMenuEstadoStory, props: { state: 'destructive' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O item destrutivo se declara pelo atributo, não só pela cor', async () => {
      // `data-variant` é o que o CSS lê e o que a auditoria compara entre
      // stacks; a cor é consequência dele.
      await gestoOpen(area());
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

// ── Item de marcação em estado misto ──────────────────────────────────────────
//
// Story SEM interação, de propósito. O que ela declara vale na montagem, e o
// primeiro clique num item misto o resolve para marcado — uma play que clicasse
// aqui mediria outro estado no REPLAY do painel Interactions, que reexecuta no
// mesmo DOM. Abrir o menu é idempotente: `gestoOpen` parte da área, não do
// estado anterior.

export const CheckboxIndeterminate: Story = {
  parameters: {
    covers: ['functional.item11'],
    docs: { source: { transform: contextMenuMarkupMistaSource } },
  },
  render: () => ({ Component: ContextMenuEstadoStory, props: { state: 'indeterminate' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');
    const menu = await gestoOpen(area());
    const canvas = within(menu);
    const misto = canvas.getByRole('menuitemcheckbox', { name: 'Colunas' });
    const marcado = canvas.getByRole('menuitemcheckbox', { name: 'Régua' });
    const desmarcado = canvas.getByRole('menuitemcheckbox', { name: 'Grade' });

    await step('O estado misto é anunciado como misto, e não como marcado', async () => {
      // Uma comparação frouxa leria o misto como verdadeiro; o que a pessoa ouve
      // tem que separar os três estados.
      await expect(misto.getAttribute('aria-checked')).toBe('mixed');
      await expect(marcado.getAttribute('aria-checked')).toBe('true');
      await expect(desmarcado.getAttribute('aria-checked')).toBe('false');
    });

    await step('O misto desenha traço; o marcado, tique', async () => {
      // A medida é a GEOMETRIA do glifo, não o nome da classe nem o do ícone:
      // traço é largo e sem altura, tique tem a diagonal. O snippet descartava o
      // estado misto e desenhava tique nos dois — é isso que esta asserção pega.
      const formaMista = formaDoIndicador(misto);
      const formaMarcada = formaDoIndicador(marcado);
      await expect(ehTraco(formaMista)).toBe(true);
      await expect(ehTique(formaMista)).toBe(false);
      await expect(ehTique(formaMarcada)).toBe(true);
    });

    await step('O desmarcado continua sem glifo nenhum', async () => {
      await expect(formaDoIndicador(desmarcado)).toBeNull();
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
    docs: { source: { transform: contextMenuPaletteDarkSource } },
  },
  render: () => ({ Component: ContextMenuEstadoStory, props: { state: 'dark' } }),
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
      const menu = await gestoOpen(area());
      const cs = getComputedStyle(menu);
      await expect(brilho(cs.backgroundColor)).toBeLessThan(brilho(cs.color));
    });
  },
};
