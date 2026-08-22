import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { dropdownMenuSource, dropdownMenuSourceWith } from './dropdown-menu.source';
import { endClose, montar } from './dropdown-menu.fixtures';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/DropdownMenu/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: dropdownMenuSource },
      description: {
        component:
          'As composições canônicas: grupos com rótulo, alternadores, escolha única e atalhos. ' +
          'Todas partem das mesmas peças — o que muda é o papel ARIA do item e o indicador que o ' +
          'acompanha. NOTA: a fábrica não tem submenu aninhado, e a composição "ComSubmenu" é ' +
          'omitida de propósito; para hierarquia, prefira menus planos.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** As listas daqui são as mais longas do componente — a moldura acompanha. */
const FRAME_HEIGHT = '220px';

// ─── Com Label ────────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  parameters: {
    covers: ['visual.item1'],
    // Override de story: são DOIS grupos rotulados, e a composição da lista é o
    // assunto — o snippet do meta traria um só.
    docs: {
      source: {
        transform: dropdownMenuSourceWith({
          triggerLabel: 'Conta',
          items: [
            { type: 'label', label: 'Conta' },
            { label: 'Perfil', value: 'profile' },
            { label: 'Configurações', value: 'settings' },
            { type: 'separator' },
            { type: 'label', label: 'Suporte' },
            { label: 'Documentação', value: 'docs' },
            { label: 'Sair', value: 'logout' },
          ],
        }),
      },
    },
  },
  render: () =>
    montar(
      'Conta',
      [
        { type: 'label', label: 'Conta' },
        { type: 'item', label: 'Perfil', value: 'profile' },
        { type: 'item', label: 'Configuracoes', value: 'settings' },
        { type: 'separator' },
        { type: 'label', label: 'Suporte' },
        { type: 'item', label: 'Documentação', value: 'docs' },
        { type: 'item', label: 'Sair', value: 'logout' },
      ],
      FRAME_HEIGHT,
    ),
  play: async ({ step }) => {
    const menu = await within(document.body).findByRole('menu');
    const canvas = within(menu);

    await step('O rótulo não é item de menu', async () => {
      // Rótulo dentro de `role="menu"` não pode ser navegável: a seta o pousaria
      // como se fosse ação, e o typeahead o traria como resultado.
      await expect(canvas.getAllByRole('menuitem')).toHaveLength(4);
      const rotulos = menu.querySelectorAll('.nds-dropdown-menu-label');
      await expect(rotulos).toHaveLength(2);
      for (const r of rotulos) await expect(r.getAttribute('role')).toBe('presentation');
    });

    await step('O separador divide os grupos', async () => {
      await expect(canvas.getAllByRole('separator')).toHaveLength(1);
    });

    await step('Limpa via ESC', async () => {
      await endClose();
    });
  },
};

// ─── Com CheckboxItems ────────────────────────────────────────────────────────

export const WithCheckboxItems: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item4', 'visual.item2'],
    // Override de story: o item alternador tem papel ARIA e indicador próprios,
    // e o snippet do meta mostraria itens de ação simples.
    docs: {
      source: {
        transform: dropdownMenuSourceWith({
          triggerLabel: 'Colunas',
          items: [
            { type: 'label', label: 'Colunas visíveis' },
            { type: 'checkbox', label: 'Nome', value: 'nome', checked: true },
            { type: 'checkbox', label: 'E-mail', value: 'email', checked: false },
            { type: 'checkbox', label: 'Função', value: 'funcao', checked: false },
          ],
        }),
      },
    },
  },
  render: () =>
    montar(
      'Colunas',
      [
        { type: 'label', label: 'Colunas visíveis' },
        { type: 'checkbox', label: 'Nome', value: 'nome', checked: true },
        { type: 'checkbox', label: 'E-mail', value: 'email', checked: false },
        { type: 'checkbox', label: 'Função', value: 'funcao', checked: false },
      ],
      FRAME_HEIGHT,
    ),
  play: async ({ step }) => {
    const menu = await within(document.body).findByRole('menu');
    const canvas = within(menu);
    const nome = canvas.getByRole('menuitemcheckbox', { name: 'Nome' });
    const email = canvas.getByRole('menuitemcheckbox', { name: 'E-mail' });

    await step('O papel e o estado inicial chegam ao markup', async () => {
      await expect(canvas.getAllByRole('menuitemcheckbox')).toHaveLength(3);
      await expect(nome.getAttribute('aria-checked')).toBe('true');
      await expect(email.getAttribute('aria-checked')).toBe('false');
    });

    await step('O indicador só aparece no item marcado', async () => {
      // O estado não pode depender só do texto: o Check é o que a pessoa vê e o
      // `aria-checked` é o que ela ouve.
      const marca = (item: HTMLElement) =>
        item.querySelector('.nds-dropdown-menu-item-indicator svg') !== null;
      await expect(marca(nome)).toBe(true);
      await expect(marca(email)).toBe(false);
    });

    await step('Clicar alterna o item e mantém o menu aberto', async () => {
      // Idempotente: leva o e-mail a marcado só se ainda não estiver, então o
      // replay do painel Interactions termina no mesmo estado.
      if (email.getAttribute('aria-checked') !== 'true') await userEvent.click(email);

      await waitFor(async () => {
        await expect(email.getAttribute('aria-checked')).toBe('true');
      });
      // Alternar não fecha: quem marca uma coluna costuma marcar a próxima.
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(1);
      // Independentes entre si — é o que separa checkbox de escolha única.
      await expect(nome.getAttribute('aria-checked')).toBe('true');
    });

    await step('Limpa via ESC', async () => {
      await endClose();
    });
  },
};

// ─── Com RadioGroup ───────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item3'],
    // Override de story: a escolha única depende do `group`, que é o que faz os
    // irmãos desmarcarem juntos — sem ele a lista viraria um punhado de
    // alternadores independentes.
    docs: {
      source: {
        transform: dropdownMenuSourceWith({
          triggerLabel: 'Tema',
          items: [
            { type: 'label', label: 'Aparência' },
            { type: 'radio', label: 'Claro', value: 'light', group: 'tema', checked: true },
            { type: 'radio', label: 'Escuro', value: 'dark', group: 'tema' },
            { type: 'radio', label: 'Sistema', value: 'system', group: 'tema' },
          ],
        }),
      },
    },
  },
  render: () =>
    montar(
      'Tema',
      [
        { type: 'label', label: 'Aparência' },
        { type: 'radio', label: 'Claro', value: 'light', group: 'tema', checked: true },
        { type: 'radio', label: 'Escuro', value: 'dark', group: 'tema' },
        { type: 'radio', label: 'Sistema', value: 'system', group: 'tema' },
      ],
      FRAME_HEIGHT,
    ),
  play: async ({ step }) => {
    const menu = await within(document.body).findByRole('menu');
    const canvas = within(menu);
    const claro = canvas.getByRole('menuitemradio', { name: 'Claro' });
    const escuro = canvas.getByRole('menuitemradio', { name: 'Escuro' });

    await step('Um item por vez se anuncia escolhido', async () => {
      await expect(canvas.getAllByRole('menuitemradio')).toHaveLength(3);
      await expect(claro.getAttribute('aria-checked')).toBe('true');
      await expect(escuro.getAttribute('aria-checked')).toBe('false');
    });

    await step('Escolher outro desmarca o anterior', async () => {
      // Idempotente: só clica se "Escuro" ainda não for o escolhido.
      if (escuro.getAttribute('aria-checked') !== 'true') await userEvent.click(escuro);

      await waitFor(async () => {
        await expect(escuro.getAttribute('aria-checked')).toBe('true');
        await expect(claro.getAttribute('aria-checked')).toBe('false');
      });
      // O indicador acompanha a troca, senão o estado só existiria para o leitor.
      await expect(escuro.querySelector('.nds-dropdown-menu-item-indicator svg')).not.toBeNull();
      await expect(claro.querySelector('.nds-dropdown-menu-item-indicator svg')).toBeNull();
    });

    await step('Limpa via ESC', async () => {
      await endClose();
    });
  },
};

// ─── Com atalhos ──────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  parameters: {
    // Override de story: o atalho é uma chave do item e integra o nome
    // acessível — o snippet do meta mostraria itens sem tecla nenhuma.
    docs: {
      source: {
        transform: dropdownMenuSourceWith({
          triggerLabel: 'Editar',
          items: [
            { label: 'Desfazer', value: 'undo', shortcut: 'Ctrl Z' },
            { label: 'Copiar', value: 'copy', shortcut: 'Ctrl C' },
            { type: 'separator' },
            { label: 'Colar', value: 'paste', shortcut: 'Ctrl V' },
          ],
        }),
      },
    },
  },
  render: () =>
    montar(
      'Editar',
      [
        { type: 'item', label: 'Desfazer', value: 'undo', shortcut: 'Ctrl Z' },
        { type: 'item', label: 'Copiar', value: 'copy', shortcut: 'Ctrl C' },
        { type: 'separator' },
        { type: 'item', label: 'Colar', value: 'paste', shortcut: 'Ctrl V' },
      ],
      FRAME_HEIGHT,
    ),
  play: async ({ step }) => {
    const menu = await within(document.body).findByRole('menu');
    const canvas = within(menu);

    await step('O atalho faz parte do nome do item', async () => {
      // Sem isso o leitor de tela anunciaria "Copiar" e a pessoa nunca saberia
      // que existe uma tecla — o atalho é informação, não decoração.
      await expect(canvas.getByRole('menuitem', { name: 'Copiar Ctrl C' })).toBeTruthy();
    });

    await step('O texto do atalho não some para o leitor de tela', async () => {
      const atalho = menu.querySelector('[data-slot="dropdown-menu-shortcut"]')!;
      await expect(atalho.getAttribute('aria-hidden')).toBe(null);
    });

    await step('O atalho fica encostado na borda direita do item', async () => {
      // `margin-left: auto` é o mecanismo, mas num item flex o valor computado
      // já vem resolvido em pixels — o que dá para afirmar é o resultado.
      const item = canvas.getByRole('menuitem', { name: 'Colar Ctrl V' });
      const atalho = item.querySelector<HTMLElement>('[data-slot="dropdown-menu-shortcut"]')!;
      const caixaDoItem = item.getBoundingClientRect();
      const caixaDoAtalho = atalho.getBoundingClientRect();
      await expect(caixaDoItem.right - caixaDoAtalho.right).toBeLessThan(
        caixaDoAtalho.left - caixaDoItem.left,
      );
    });

    await step('Limpa via ESC', async () => {
      await endClose();
    });
  },
};
