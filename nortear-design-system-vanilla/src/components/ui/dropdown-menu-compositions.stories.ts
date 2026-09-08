import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { dropdownMenuSource, dropdownMenuSourceWith } from './dropdown-menu.source';
import { endClose, montar } from './dropdown-menu.fixtures';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/DropdownMenu/Compositions',
  parameters: {
    design: figmaDesign('dropdownMenu'),
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: dropdownMenuSource },
      description: {
        component:
          'As composições canônicas: grupos com rótulo, alternadores, escolha única, submenu e ' +
          'atalhos. Todas partem das mesmas peças — o que muda é o papel ARIA do item e o ' +
          'indicador que o acompanha.',
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
        { type: 'item', label: 'Configurações', value: 'settings' },
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

    await step('O rótulo dá nome ao grupo que ele encabeça', async () => {
      // É o que o rótulo entrega além do texto: sem o `aria-labelledby`, o
      // leitor anuncia "grupo" e a pessoa não sabe de qual bloco se trata.
      await expect(canvas.getByRole('group', { name: 'Conta' })).toBeTruthy();
      await expect(canvas.getByRole('group', { name: 'Suporte' })).toBeTruthy();
      await expect(canvas.getAllByRole('group')).toHaveLength(2);
    });

    await step('O grupo fica FORA do percurso do teclado', async () => {
      // O grupo é embrulho, não parada: se ele entrasse na roda das setas, a
      // navegação ganharia um passo que não ativa nada.
      const groups = canvas.getAllByRole('group');
      for (const g of groups) await expect(g.getAttribute('tabindex')).toBeNull();

      // Uma volta inteira: são quatro itens, e toda parada tem de ser um deles.
      // Sem espera de relógio — o foco muda dentro do próprio `keydown`.
      for (let i = 0; i < 4; i++) {
        await userEvent.keyboard('{ArrowDown}');
        await expect((document.activeElement as HTMLElement).getAttribute('role')).toBe('menuitem');
      }
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
    const name = canvas.getByRole('menuitemcheckbox', { name: 'Nome' });
    const email = canvas.getByRole('menuitemcheckbox', { name: 'E-mail' });

    await step('O papel e o estado inicial chegam ao markup', async () => {
      await expect(canvas.getAllByRole('menuitemcheckbox')).toHaveLength(3);
      await expect(name.getAttribute('aria-checked')).toBe('true');
      await expect(email.getAttribute('aria-checked')).toBe('false');
    });

    await step('O indicador só aparece no item marcado', async () => {
      // O estado não pode depender só do texto: o Check é o que a pessoa vê e o
      // `aria-checked` é o que ela ouve.
      const marca = (item: HTMLElement) =>
        item.querySelector('.nds-dropdown-menu-item-indicator svg') !== null;
      await expect(marca(name)).toBe(true);
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
      await expect(name.getAttribute('aria-checked')).toBe('true');
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
    const light = canvas.getByRole('menuitemradio', { name: 'Claro' });
    const escuro = canvas.getByRole('menuitemradio', { name: 'Escuro' });

    await step('Um item por vez se anuncia escolhido', async () => {
      await expect(canvas.getAllByRole('menuitemradio')).toHaveLength(3);
      await expect(light.getAttribute('aria-checked')).toBe('true');
      await expect(escuro.getAttribute('aria-checked')).toBe('false');
    });

    await step('Escolher outro desmarca o anterior', async () => {
      // Idempotente: só clica se "Escuro" ainda não for o escolhido.
      if (escuro.getAttribute('aria-checked') !== 'true') await userEvent.click(escuro);

      await waitFor(async () => {
        await expect(escuro.getAttribute('aria-checked')).toBe('true');
        await expect(light.getAttribute('aria-checked')).toBe('false');
      });
      // O indicador acompanha a troca, senão o estado só existiria para o leitor.
      await expect(escuro.querySelector('.nds-dropdown-menu-item-indicator svg')).not.toBeNull();
      await expect(light.querySelector('.nds-dropdown-menu-item-indicator svg')).toBeNull();
    });

    await step('Limpa via ESC', async () => {
      await endClose();
    });
  },
};

// ─── Com submenu ──────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item4'],
    // Override de story: o item de submenu leva a própria lista aninhada, e o
    // snippet do meta mostraria uma lista plana.
    docs: {
      source: {
        transform: dropdownMenuSourceWith({
          triggerLabel: 'Arquivo',
          items: [
            { label: 'Renomear', value: 'rename' },
            {
              type: 'submenu',
              label: 'Exportar',
              value: 'export',
              items: [
                { label: 'PDF', value: 'pdf' },
                { label: 'CSV', value: 'csv' },
              ],
            },
          ],
        }),
      },
    },
  },
  render: () =>
    montar(
      'Arquivo',
      [
        { type: 'item', label: 'Renomear', value: 'rename' },
        {
          type: 'submenu',
          label: 'Exportar',
          value: 'export',
          items: [
            { type: 'item', label: 'PDF', value: 'pdf' },
            { type: 'item', label: 'CSV', value: 'csv' },
          ],
        },
      ],
      FRAME_HEIGHT,
    ),
  play: async ({ step }) => {
    const body = within(document.body);
    const menu = await body.findByRole('menu');
    const subTrigger = within(menu).getByRole('menuitem', { name: 'Exportar' });

    await step('O sub-gatilho anuncia que abre um menu, e que está fechado', async () => {
      await expect(subTrigger.getAttribute('aria-haspopup')).toBe('menu');
      await expect(subTrigger.getAttribute('aria-expanded')).toBe('false');
      // Fechado, não há painel para apontar — `aria-owns` só existe enquanto o
      // menu filho existe.
      await expect(subTrigger.getAttribute('aria-owns')).toBe(null);
    });

    await step('A seta para a direita abre o submenu e entra nele', async () => {
      // Idempotente: a seta só é enviada com o submenu fechado, então o replay
      // do painel Interactions parte do mesmo estado.
      if (subTrigger.getAttribute('aria-expanded') !== 'true') {
        subTrigger.focus();
        await userEvent.keyboard('{ArrowRight}');
      }
      await expect(subTrigger.getAttribute('aria-expanded')).toBe('true');
      await expect(body.getAllByRole('menu')).toHaveLength(2);
      // Abrir sem entrar deixaria a pessoa vendo um painel que a seta seguinte
      // não percorre: o percurso do teclado sai do painel que tem o foco.
      await expect((document.activeElement as HTMLElement).textContent).toBe('PDF');
    });

    await step('O painel do submenu está ligado ao item que o abriu', async () => {
      // O painel mora no `body`, fora da árvore do menu pai — é `aria-owns` que
      // repõe a ligação. Sem ele o submenu é um menu solto para quem lê a tela.
      const submenu = body.getAllByRole('menu')[1];
      await expect(submenu.dataset.slot).toBe('dropdown-menu-sub-content');
      await expect(subTrigger.getAttribute('aria-owns')).toBe(submenu.id);
      await expect(submenu.id).not.toBe('');
      // Fora da árvore do pai também para o teclado: se o painel fosse aninhado,
      // a seta do menu pai passaria a percorrer os itens do filho.
      await expect(menu.contains(submenu)).toBe(false);
    });

    await step('O submenu abre AO LADO, não por cima do menu pai', async () => {
      const submenu = body.getAllByRole('menu')[1];
      // Dois formatos de exportação, que é o que o painel filho lista.
      await expect(within(submenu).getAllByRole('menuitem')).toHaveLength(2);
      // Um submenu que nasce sobre o pai cobre os irmãos do item que o abriu. A
      // comparação é com a borda DIREITA do pai — comparar com a esquerda
      // passaria com os dois painéis empilhados.
      await expect(submenu.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        menu.getBoundingClientRect().right - 8,
      );
    });

    await step('A seta para a esquerda fecha o submenu e devolve o foco', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      await expect(body.getAllByRole('menu')).toHaveLength(1);
      await expect(subTrigger.getAttribute('aria-expanded')).toBe('false');
      // A ligação sai junto: apontar para um painel que já não está no documento
      // é pior que não apontar para nada.
      await expect(subTrigger.getAttribute('aria-owns')).toBe(null);
      await expect(document.activeElement).toBe(subTrigger);
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
            { label: 'Desfazer', value: 'undo', shortcut: 'Ctrl+Z' },
            { label: 'Copiar', value: 'copy', shortcut: 'Ctrl+C' },
            { type: 'separator' },
            { label: 'Colar', value: 'paste', shortcut: 'Ctrl+V' },
          ],
        }),
      },
    },
  },
  render: () =>
    montar(
      'Editar',
      [
        { type: 'item', label: 'Desfazer', value: 'undo', shortcut: 'Ctrl+Z' },
        { type: 'item', label: 'Copiar', value: 'copy', shortcut: 'Ctrl+C' },
        { type: 'separator' },
        { type: 'item', label: 'Colar', value: 'paste', shortcut: 'Ctrl+V' },
      ],
      FRAME_HEIGHT,
    ),
  play: async ({ step }) => {
    const menu = await within(document.body).findByRole('menu');
    const canvas = within(menu);

    await step('O atalho faz parte do nome do item', async () => {
      // Sem isso o leitor de tela anunciaria "Copiar" e a pessoa nunca saberia
      // que existe uma tecla — o atalho é informação, não decoração.
      await expect(canvas.getByRole('menuitem', { name: 'Copiar Ctrl+C' })).toBeTruthy();
    });

    await step('O texto do atalho não some para o leitor de tela', async () => {
      const atalho = menu.querySelector('[data-slot="dropdown-menu-shortcut"]')!;
      await expect(atalho.getAttribute('aria-hidden')).toBe(null);
    });

    await step('O atalho fica encostado na borda direita do item', async () => {
      // `margin-left: auto` é o mecanismo, mas num item flex o valor computado
      // já vem resolvido em pixels — o que dá para afirmar é o resultado.
      const item = canvas.getByRole('menuitem', { name: 'Colar Ctrl+V' });
      const atalho = item.querySelector<HTMLElement>('[data-slot="dropdown-menu-shortcut"]')!;
      const itemBox = item.getBoundingClientRect();
      const shortcutBox = atalho.getBoundingClientRect();
      await expect(itemBox.right - shortcutBox.right).toBeLessThan(
        shortcutBox.left - itemBox.left,
      );
    });

    await step('Limpa via ESC', async () => {
      await endClose();
    });
  },
};
