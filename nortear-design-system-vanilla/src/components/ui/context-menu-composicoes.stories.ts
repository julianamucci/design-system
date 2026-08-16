import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import { createContextMenu } from './context-menu';
import {
  abrirPorGesto,
  criarAreaDeClique,
  menuAberto,
} from '@shared/testing/context-menu-area';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/ContextMenu/Compositions',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composições do ContextMenu: atalhos, marcação, escolha única, submenu e o menu completo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const item = (valor: string) =>
  document.querySelector<HTMLElement>(`[data-value="${valor}"]`)!;

// ─── Com atalhos ──────────────────────────────────────────────────────────────

export const WithShortcut: Story = {
  render: () =>
    createContextMenu({
      trigger: criarAreaDeClique('Clique com o botão direito aqui'),
      items: [
        { type: 'item', label: 'Editar', value: 'editar', shortcut: '⌘E', onClick: fn() },
        { type: 'item', label: 'Desfazer', value: 'undo', shortcut: '⌘Z', onClick: fn() },
        { type: 'separator' },
        { type: 'item', label: 'Excluir', value: 'delete', shortcut: '⌫', variant: 'destructive' },
      ],
    }),
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
      const caixaItem = item('editar').getBoundingClientRect();
      const caixaAtalho = item('editar')
        .querySelector<HTMLElement>('[data-slot="context-menu-shortcut"]')!
        .getBoundingClientRect();
      await expect(caixaItem.right - caixaAtalho.right).toBeLessThan(16);
    });
  },
};

// ─── Com marcação ─────────────────────────────────────────────────────────────

export const WithCheckbox: Story = {
  parameters: { covers: ['functional.item7', 'accessibility.item4'] },
  render: () =>
    createContextMenu({
      trigger: criarAreaDeClique('Clique com o botão direito aqui'),
      items: [
        { type: 'label', label: 'Visualização' },
        { type: 'checkbox', label: 'Mostrar grade', value: 'grade', checked: false },
        { type: 'checkbox', label: 'Mostrar réguas', value: 'reguas', checked: true },
      ],
    }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O papel diz que tipo de escolha o item é', async () => {
      await abrirPorGesto(area());
      await expect(item('grade').getAttribute('role')).toBe('menuitemcheckbox');
      await expect(item('reguas').getAttribute('aria-checked')).toBe('true');
    });

    await step('Marcar alterna o estado anunciado e o indicador', async () => {
      // Lê o estado ANTES de clicar: no replay a story parte do que a rodada
      // anterior deixou, e um valor esperado fixo inverteria o resultado.
      const antes = item('grade').getAttribute('aria-checked');
      const esperado = antes === 'true' ? 'false' : 'true';
      await userEvent.click(item('grade'));
      await waitFor(() => expect(item('grade').getAttribute('aria-checked')).toBe(esperado));
      await expect(!!item('grade').querySelector('svg')).toBe(esperado === 'true');
    });
  },
};

// ─── Com escolha única ────────────────────────────────────────────────────────

export const WithRadio: Story = {
  parameters: { covers: ['functional.item8', 'accessibility.item5'] },
  render: () =>
    createContextMenu({
      trigger: criarAreaDeClique('Clique com o botão direito aqui'),
      radioValue: 'grid',
      items: [
        { type: 'label', label: 'Layout' },
        { type: 'radio', label: 'Grade', value: 'grid' },
        { type: 'radio', label: 'Lista', value: 'list' },
        { type: 'radio', label: 'Colunas', value: 'columns' },
      ],
    }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O papel diz que a escolha é única', async () => {
      await abrirPorGesto(area());
      await expect(item('grid').getAttribute('role')).toBe('menuitemradio');
      await expect(item('list').getAttribute('role')).toBe('menuitemradio');
    });

    await step('Escolher uma opção limpa a anterior', async () => {
      // Alterna entre dois valores conhecidos e afirma o PAR: assim o passo vale
      // igual em qualquer rodada, não importa de onde parta.
      const partiuDeGrid = item('grid').getAttribute('aria-checked') === 'true';
      const clicar = partiuDeGrid ? 'columns' : 'grid';
      const outro = partiuDeGrid ? 'grid' : 'columns';
      await userEvent.click(item(clicar));
      await waitFor(() => expect(item(clicar).getAttribute('aria-checked')).toBe('true'));
      await expect(item(outro).getAttribute('aria-checked')).toBe('false');
    });
  },
};

// ─── Com submenu ──────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  parameters: { covers: ['functional.item5', 'functional.item6', 'visual.item3'] },
  render: () =>
    createContextMenu({
      trigger: criarAreaDeClique('Clique com o botão direito aqui'),
      items: [
        { type: 'item', label: 'Editar', value: 'edit', onClick: fn() },
        { type: 'item', label: 'Duplicar', value: 'duplicate', onClick: fn() },
        {
          type: 'submenu',
          label: 'Compartilhar',
          value: 'sub',
          items: [
            { type: 'item', label: 'Por e-mail', value: 'por-email', onClick: fn() },
            { type: 'item', label: 'Por link', value: 'por-link', onClick: fn() },
          ],
        },
      ],
    }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');
    const subGatilho = () =>
      document.querySelector<HTMLElement>('[data-slot="context-menu-sub-trigger"]')!;
    const submenu = () =>
      document.querySelector<HTMLElement>('[data-slot="context-menu-sub-content"]');

    await step('O sub-gatilho diz que abre um menu', async () => {
      await abrirPorGesto(area());
      await expect(subGatilho().getAttribute('aria-haspopup')).toBe('menu');
      await expect(subGatilho().getAttribute('aria-expanded')).toBe('false');
    });

    await step('Seta direita abre o submenu ao lado do item que o dispara', async () => {
      subGatilho().focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(subGatilho().getAttribute('aria-expanded')).toBe('true'));
      await expect(
        submenu()!.querySelectorAll('[data-slot="context-menu-item"]').length,
      ).toBe(2);

      // "À direita" é medida, não atributo: é o que o conteúdo promete e o que
      // uma posição errada quebraria sem nenhum aviso.
      await waitFor(() =>
        expect(submenu()!.getBoundingClientRect().left).toBeGreaterThanOrEqual(
          subGatilho().getBoundingClientRect().left,
        ),
      );
    });

    await step('Seta esquerda fecha o submenu e devolve o foco ao sub-gatilho', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(() => expect(subGatilho().getAttribute('aria-expanded')).toBe('false'));
      await expect(document.activeElement).toBe(subGatilho());
    });

    await step('A story termina com o submenu ABERTO', async () => {
      // `visual.item3` descreve o submenu aberto — é o que o Chromatic precisa
      // fotografar.
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(submenu()).not.toBeNull());
    });
  },
};

// ─── Composição completa ──────────────────────────────────────────────────────

export const CompleteComposition: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () =>
    createContextMenu({
      trigger: criarAreaDeClique('Clique com o botão direito aqui'),
      radioValue: 'grid',
      items: [
        { type: 'label', label: 'Ações' },
        { type: 'item', label: 'Editar', value: 'edit', shortcut: '⌘E', onClick: fn() },
        {
          type: 'submenu',
          label: 'Compartilhar',
          value: 'sub',
          items: [
            { type: 'item', label: 'Por e-mail', value: 'por-email', onClick: fn() },
            { type: 'item', label: 'Por link', value: 'por-link', onClick: fn() },
          ],
        },
        { type: 'separator' },
        { type: 'label', label: 'Visualização' },
        { type: 'checkbox', label: 'Mostrar grade', value: 'grade', checked: true },
        { type: 'separator' },
        { type: 'label', label: 'Layout' },
        { type: 'radio', label: 'Grade', value: 'grid' },
        { type: 'radio', label: 'Lista', value: 'list' },
        { type: 'separator' },
        { type: 'item', label: 'Excluir', value: 'delete', shortcut: '⌫', variant: 'destructive' },
      ],
    }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('Marcação e escolha única convivem no mesmo menu', async () => {
      // `visual.item4` descreve exatamente esta convivência — é o que precisa
      // estar na tela quando o Chromatic fotografa.
      const menu = await abrirPorGesto(area());
      await expect(item('grade').getAttribute('role')).toBe('menuitemcheckbox');
      await expect(item('grid').getAttribute('role')).toBe('menuitemradio');
      await expect(
        menu.querySelectorAll('[data-slot="context-menu-separator"]').length,
      ).toBe(3);
    });

    await step('Os rótulos de grupo não são itens escolhíveis', async () => {
      const rotulos = menuAberto()!.querySelectorAll<HTMLElement>(
        '[data-slot="context-menu-label"]',
      );
      await expect(rotulos.length).toBe(3);
      for (const rotulo of rotulos) {
        await expect(rotulo.getAttribute('role')).not.toBe('menuitem');
      }
    });
  },
};
