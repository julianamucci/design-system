import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, userEvent, expect, waitFor } from 'storybook/test';
import { Root as ContextMenu } from './index';
import ContextMenuComposicaoStory from './ContextMenuComposicaoStory.svelte';
import { FOCUS_RULE_GUARDA, waitForPortal } from '@/lib/wait-for-portal';
import { gestoOpen } from '@shared/testing/context-menu-area';
import {
  contextMenuWithShortcutsSource,
  contextMenuWithChoiceUnicaSource,
  contextMenuWithMarkupSource,
  contextMenuWithSubmenuSource,
  contextMenuCompletoSource,
  contextMenuSource,
} from './context-menu.source';

const meta: Meta = {
  title: 'UI/ContextMenu/Compositions',
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
          'Composições do Context Menu: atalhos, marcação, escolha única, submenu e o menu completo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const alvo = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

// ── Com atalhos ───────────────────────────────────────────────────────────────

export const WithShortcut: Story = {
  parameters: {
    docs: { source: { transform: contextMenuWithShortcutsSource } },
  },
  render: () => ({ Component: ContextMenuComposicaoStory, props: { composition: 'shortcut' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O atalho vive dentro do item e é lido junto dele', async () => {
      const menu = await gestoOpen(area());
      const shortcuts = menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-shortcut"]');
      await expect(shortcuts.length).toBe(3);
      for (const atalho of shortcuts) {
        await expect(atalho.hasAttribute('aria-hidden')).toBe(false);
        await expect(atalho.closest('[data-slot="context-menu-item"]')).not.toBeNull();
      }
    });

    await step('O atalho fica encostado à direita do rótulo', async () => {
      // É o alinhamento que faz a coluna de atalhos existir; sem ele o texto
      // sai colado no rótulo e a leitura visual se perde.
      const item = alvo('editar').getBoundingClientRect();
      const atalho = alvo('editar')
        .querySelector<HTMLElement>('[data-slot="context-menu-shortcut"]')!
        .getBoundingClientRect();
      await expect(item.right - atalho.right).toBeLessThan(16);
    });
  },
};

// ── Com marcação ──────────────────────────────────────────────────────────────

export const WithCheckbox: Story = {
  parameters: {
    covers: ['functional.item7', 'accessibility.item4'],
    docs: { source: { transform: contextMenuWithMarkupSource } },
  },
  render: () => ({ Component: ContextMenuComposicaoStory, props: { composition: 'checkbox' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O papel diz que tipo de escolha o item é', async () => {
      await gestoOpen(area());
      await expect(alvo('grade').getAttribute('role')).toBe('menuitemcheckbox');
      await expect(alvo('reguas').getAttribute('aria-checked')).toBe('true');
    });

    await step('O indicador publica o data-slot do seu tipo de item', async () => {
      // `data-slot` é o endereço de markup que as cinco stacks compartilham, e
      // o do indicador é por TIPO de item. Aqui ele não existia.
      await gestoOpen(area());
      for (const id of ['grade', 'reguas']) {
        await expect(
          alvo(id).querySelector('[data-slot="context-menu-checkbox-item-indicator"]'),
        ).not.toBeNull();
      }
      // O tique mora DENTRO do indicador — prova que o atributo ficou no
      // invólucro, e não no item nem no nó que a lib injeta.
      await expect(
        alvo('reguas').querySelector(
          '[data-slot="context-menu-checkbox-item-indicator"] svg',
        ),
      ).not.toBeNull();
    });

    await step('Marcar alterna o estado anunciado e o indicador', async () => {
      // Lê o estado ANTES de clicar: no replay a story parte do que a rodada
      // anterior deixou, e um valor esperado fixo inverteria o resultado.
      const antes = alvo('grade').getAttribute('aria-checked');
      const esperado = antes === 'true' ? 'false' : 'true';
      await userEvent.click(alvo('grade'));
      // Algumas libs fecham o menu ao escolher; reabrir é o que torna o passo
      // igual nas cinco stacks.
      await gestoOpen(area());
      await waitFor(() =>
        expect(alvo('grade').getAttribute('aria-checked')).toBe(esperado),
      );
      await expect(!!alvo('grade').querySelector('svg')).toBe(esperado === 'true');
    });
  },
};

// ── Com escolha única ─────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  parameters: {
    covers: ['functional.item8', 'accessibility.item5'],
    docs: { source: { transform: contextMenuWithChoiceUnicaSource } },
  },
  render: () => ({ Component: ContextMenuComposicaoStory, props: { composition: 'radio' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O papel diz que a escolha é única', async () => {
      await gestoOpen(area());
      await expect(alvo('grid').getAttribute('role')).toBe('menuitemradio');
      await expect(alvo('list').getAttribute('role')).toBe('menuitemradio');
    });

    await step('O indicador publica o data-slot do seu tipo de item', async () => {
      // Endereço por TIPO de item: escolha única e marcação não compartilham
      // slot, como nas outras stacks.
      await gestoOpen(area());
      const opcoes = ['grid', 'list', 'columns'].map(alvo);
      for (const opcao of opcoes) {
        await expect(
          opcao.querySelector('[data-slot="context-menu-radio-item-indicator"]'),
        ).not.toBeNull();
      }
      // O tique mora DENTRO do indicador — prova que o atributo ficou no
      // invólucro. Qual opção está marcada varia entre rodadas, então ela é
      // procurada, nunca fixada.
      const marcada = opcoes.find((o) => o.getAttribute('aria-checked') === 'true')!;
      await expect(
        marcada.querySelector('[data-slot="context-menu-radio-item-indicator"] svg'),
      ).not.toBeNull();
    });

    await step('Escolher uma opção limpa a anterior', async () => {
      // Alterna entre dois valores conhecidos e afirma o PAR: assim o passo vale
      // igual em qualquer rodada, não importa de onde parta.
      const partiuDeGrid = alvo('grid').getAttribute('aria-checked') === 'true';
      const click = partiuDeGrid ? 'columns' : 'grid';
      const other = partiuDeGrid ? 'grid' : 'columns';
      await userEvent.click(alvo(click));
      await gestoOpen(area());
      await waitFor(() => expect(alvo(click).getAttribute('aria-checked')).toBe('true'));
      await expect(alvo(other).getAttribute('aria-checked')).toBe('false');
    });
  },
};

// ── Com submenu ───────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  parameters: {
    covers: ['functional.item5', 'functional.item6', 'visual.item3'],
    docs: { source: { transform: contextMenuWithSubmenuSource } },
  },
  render: () => ({ Component: ContextMenuComposicaoStory, props: { composition: 'submenu' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');
    const submenu = () =>
      document.querySelector<HTMLElement>('[data-slot="context-menu-sub-content"]');

    await step('O sub-gatilho diz que abre um menu', async () => {
      await gestoOpen(area());
      await expect(alvo('sub').getAttribute('aria-haspopup')).toBe('menu');
      await expect(alvo('sub').getAttribute('aria-expanded')).toBe('false');
    });

    await step('Seta direita abre o submenu ao lado do item que o dispara', async () => {
      alvo('sub').focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(alvo('sub').getAttribute('aria-expanded')).toBe('true'));
      await expect(
        submenu()!.querySelectorAll('[data-slot="context-menu-item"]').length,
      ).toBe(2);

      // "À direita" é medida, não atributo: é o que o conteúdo promete e o que
      // um `side` errado quebraria sem nenhum aviso. O `waitFor` não é folga —
      // o popup entra no DOM ANTES de o posicionador medir, e até lá fica em
      // (0,0).
      await waitFor(() =>
        expect(submenu()!.getBoundingClientRect().left).toBeGreaterThanOrEqual(
          alvo('sub').getBoundingClientRect().left,
        ),
      );
    });

    await step('Seta esquerda fecha o submenu e devolve o foco ao sub-gatilho', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(() => expect(alvo('sub').getAttribute('aria-expanded')).toBe('false'));
      await expect(document.activeElement).toBe(alvo('sub'));
    });

    await step('A story termina com o submenu ABERTO', async () => {
      // `visual.item3` descreve o submenu aberto — é o que o Chromatic precisa
      // fotografar.
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(submenu()).not.toBeNull());
    });
  },
};

// ── Composição completa ───────────────────────────────────────────────────────

export const CompleteComposition: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: { source: { transform: contextMenuCompletoSource } },
  },
  render: () => ({ Component: ContextMenuComposicaoStory, props: { composition: 'complete' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('Marcação e escolha única convivem no mesmo menu', async () => {
      // `visual.item4` descreve exatamente esta convivência — é o que precisa
      // estar na tela quando o Chromatic fotografa.
      const menu = await gestoOpen(area());
      await expect(alvo('grade').getAttribute('role')).toBe('menuitemcheckbox');
      await expect(alvo('grid').getAttribute('role')).toBe('menuitemradio');
      await expect(
        menu.querySelectorAll('[data-slot="context-menu-separator"]').length,
      ).toBe(3);
    });

    await step('Cada grupo tem nome, e o nome não é um item escolhível', async () => {
      // O cabeçalho vira o `aria-labelledby` do grupo: é o que faz o leitor de
      // tela anunciar "Ações, grupo" em vez de um bloco anônimo.
      const menu = await waitForPortal('menu');
      const grupos = menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-group"]');
      await expect(grupos.length).toBe(3);
      for (const grupo of grupos) {
        const id = grupo.getAttribute('aria-labelledby');
        await expect(id && document.getElementById(id)?.textContent?.trim()).toBeTruthy();
      }
    });
  },
};
