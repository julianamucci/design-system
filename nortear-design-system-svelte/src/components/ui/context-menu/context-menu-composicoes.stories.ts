import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, userEvent, expect, waitFor } from 'storybook/test';
import { Root as ContextMenu } from './index';
import ContextMenuComposicaoStory from './ContextMenuComposicaoStory.svelte';
import { REGRA_GUARDA_DE_FOCO, waitForPortal } from '@/lib/wait-for-portal';
import { abrirPorGesto } from '@shared/testing/context-menu-area';

const meta: Meta = {
  title: 'UI/ContextMenu/Compositions',
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
  render: () => ({ Component: ContextMenuComposicaoStory, props: { composition: 'shortcut' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O atalho vive dentro do item e é lido junto dele', async () => {
      const menu = await abrirPorGesto(area());
      const atalhos = menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-shortcut"]');
      await expect(atalhos.length).toBe(3);
      for (const atalho of atalhos) {
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
  parameters: { covers: ['functional.item7', 'accessibility.item4'] },
  render: () => ({ Component: ContextMenuComposicaoStory, props: { composition: 'checkbox' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O papel diz que tipo de escolha o item é', async () => {
      await abrirPorGesto(area());
      await expect(alvo('grade').getAttribute('role')).toBe('menuitemcheckbox');
      await expect(alvo('reguas').getAttribute('aria-checked')).toBe('true');
    });

    await step('Marcar alterna o estado anunciado e o indicador', async () => {
      // Lê o estado ANTES de clicar: no replay a story parte do que a rodada
      // anterior deixou, e um valor esperado fixo inverteria o resultado.
      const antes = alvo('grade').getAttribute('aria-checked');
      const esperado = antes === 'true' ? 'false' : 'true';
      await userEvent.click(alvo('grade'));
      // Algumas libs fecham o menu ao escolher; reabrir é o que torna o passo
      // igual nas cinco stacks.
      await abrirPorGesto(area());
      await waitFor(() =>
        expect(alvo('grade').getAttribute('aria-checked')).toBe(esperado),
      );
      await expect(!!alvo('grade').querySelector('svg')).toBe(esperado === 'true');
    });
  },
};

// ── Com escolha única ─────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  parameters: { covers: ['functional.item8', 'accessibility.item5'] },
  render: () => ({ Component: ContextMenuComposicaoStory, props: { composition: 'radio' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O papel diz que a escolha é única', async () => {
      await abrirPorGesto(area());
      await expect(alvo('grid').getAttribute('role')).toBe('menuitemradio');
      await expect(alvo('list').getAttribute('role')).toBe('menuitemradio');
    });

    await step('Escolher uma opção limpa a anterior', async () => {
      // Alterna entre dois valores conhecidos e afirma o PAR: assim o passo vale
      // igual em qualquer rodada, não importa de onde parta.
      const partiuDeGrid = alvo('grid').getAttribute('aria-checked') === 'true';
      const clicar = partiuDeGrid ? 'columns' : 'grid';
      const outro = partiuDeGrid ? 'grid' : 'columns';
      await userEvent.click(alvo(clicar));
      await abrirPorGesto(area());
      await waitFor(() => expect(alvo(clicar).getAttribute('aria-checked')).toBe('true'));
      await expect(alvo(outro).getAttribute('aria-checked')).toBe('false');
    });
  },
};

// ── Com submenu ───────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  parameters: { covers: ['functional.item5', 'functional.item6', 'visual.item3'] },
  render: () => ({ Component: ContextMenuComposicaoStory, props: { composition: 'submenu' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');
    const submenu = () =>
      document.querySelector<HTMLElement>('[data-slot="context-menu-sub-content"]');

    await step('O sub-gatilho diz que abre um menu', async () => {
      await abrirPorGesto(area());
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
  parameters: { covers: ['visual.item4'] },
  render: () => ({ Component: ContextMenuComposicaoStory, props: { composition: 'complete' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('Marcação e escolha única convivem no mesmo menu', async () => {
      // `visual.item4` descreve exatamente esta convivência — é o que precisa
      // estar na tela quando o Chromatic fotografa.
      const menu = await abrirPorGesto(area());
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
