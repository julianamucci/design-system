import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { waitForPortal, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import MenubarStory from './MenubarStory.svelte';
import { menubarSource } from './menubar.source';

// Listas primeiro: toda contagem do play sai daqui, nunca de um número escrito
// à mão que a próxima edição do markup deixa mentindo.
const SHORTCUTS = [
  { label: 'Desfazer', atalho: 'Ctrl+Z' },
  { label: 'Refazer', atalho: 'Ctrl+Shift+Z' },
  { label: 'Copiar', atalho: 'Ctrl+C' },
];

const EXPORTACOES = ['PDF', 'CSV', 'PNG'];

const EXIBICOES = ['Régua', 'Barra lateral', 'Grade'];

const THEMES = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Do sistema' },
];

const MENUS_EDITOR = ['Arquivo', 'Editar', 'Exibir', 'Ajuda'];

const meta: Meta = {
  title: 'Components/Navigation/Menubar/Compositions',
  component: MenubarStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      // Cascateia para todas as stories do arquivo; a composição de cada uma
      // sai dos próprios `args`, que são os mesmos que a demonstração usa.
      source: { transform: menubarSource },
      description: {
        component:
          'As composições canônicas de um menu da barra: atalhos visíveis, submenu, alternadores independentes, escolha única e a barra completa de um editor.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── WithShortcuts ────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  args: { defaultValue: 'edit', demonstration: 'shortcuts' },
  parameters: { covers: ['visual.item2'] },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const items = within(menu).getAllByRole('menuitem');

    await step('Cada item leva o próprio atalho', async () => {
      await expect(items).toHaveLength(SHORTCUTS.length);
      const shortcuts = menu.querySelectorAll('[data-slot="menubar-shortcut"]');
      await expect(shortcuts).toHaveLength(SHORTCUTS.length);
    });

    await step('O atalho entra no nome do item, e não fica escondido do leitor', async () => {
      // Sem `aria-hidden`: "Desfazer, Ctrl+Z" é o que dá serventia ao atalho para
      // quem não enxerga a tela. Escondê-lo devolveria só "Desfazer".
      for (const [i, item] of items.entries()) {
        await expect(item).toHaveAccessibleName(`${SHORTCUTS[i].label} ${SHORTCUTS[i].atalho}`);
      }
    });

    await step('O atalho é secundário — cor esmaecida à direita do rótulo', async () => {
      const atalho = menu.querySelector<HTMLElement>('[data-slot="menubar-shortcut"]')!;
      await expect(atalho.classList.contains('nds-dropdown-menu-shortcut')).toBe(true);
      await expect(getComputedStyle(atalho).color).not.toBe(getComputedStyle(items[0]).color);
    });
  },
};

// ─── WithSubmenu ──────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  args: { defaultValue: 'file', demonstration: 'submenu' },
  parameters: { covers: ['functional.item5', 'visual.item4'] },
  play: async ({ step }) => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    const subTrigger = within(menu).getByRole('menuitem', { name: 'Exportar' });

    await step('O sub-gatilho anuncia que abre outro menu', async () => {
      await expect(subTrigger.getAttribute('aria-haspopup')).toBe('menu');
      await expect(subTrigger.getAttribute('data-slot')).toBe('menubar-sub-trigger');
    });

    await step('Seta Baixo alcança o sub-gatilho; Seta Direita abre o submenu', async () => {
      // Idempotente: só navega e abre quando ainda está fechado.
      if (subTrigger.getAttribute('aria-expanded') !== 'true') {
        // Quantas setas até o sub-gatilho depende de onde a lib deixou o realce
        // ao abrir — cravar o número é o que quebra quando um item muda de
        // lugar. Anda até chegar, e falha se não chegar.
        const items = menu.querySelectorAll('[role="menuitem"]');
        for (let i = 0; i < items.length + 1; i++) {
          if (document.activeElement === subTrigger) break;
          await userEvent.keyboard('{ArrowDown}');
        }
        await waitFor(async () => {
          await expect(document.activeElement).toBe(subTrigger);
        });
        await userEvent.keyboard('{ArrowRight}');
      }

      await waitFor(async () => {
        await expect(subTrigger.getAttribute('aria-expanded')).toBe('true');
        // Dois painéis abertos ao mesmo tempo: o pai continua no lugar, é o que
        // distingue submenu de troca de menu.
        await expect(body.getAllByRole('menu')).toHaveLength(2);
      });
    });

    await step('O submenu traz os próprios itens, com o painel desenhado', async () => {
      const submenu = body.getAllByRole('menu').find((m) => m !== menu)!;
      await expect(within(submenu).getAllByRole('menuitem')).toHaveLength(EXPORTACOES.length);
      await expect(submenu.getAttribute('data-slot')).toBe('menubar-sub-content');
      // O painel do submenu tem que ser um painel: sem a classe compartilhada
      // ele saía transparente, flutuando sobre a página como texto solto — e
      // sem portal nascia DENTRO do painel do menu raiz, que rola.
      await expect(submenu.classList.contains('nds-dropdown-menu-content')).toBe(true);
      await expect(getComputedStyle(submenu).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      await expect(menu.contains(submenu)).toBe(false);
    });
  },
};

// ─── WithCheckboxItems ────────────────────────────────────────────────────────

export const WithCheckboxItems: Story = {
  args: { defaultValue: 'view', demonstration: 'checkbox' },
  parameters: { covers: ['functional.item7', 'visual.item3'] },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const boxes = within(menu).getAllByRole('menuitemcheckbox');

    await step('Cada linha é uma caixa de seleção independente', async () => {
      await expect(boxes).toHaveLength(EXIBICOES.length);
      for (const box of boxes) {
        await expect(box.getAttribute('data-slot')).toBe('menubar-checkbox-item');
        await expect(box.getAttribute('aria-checked')).toBeTruthy();
      }
    });

    await step('O grupo tem nome, dado pelo próprio cabeçalho', async () => {
      // Nesta lib o cabeçalho vira o `aria-labelledby` do grupo — é o que faz o
      // leitor de tela anunciar "Mostrar na tela" antes das três caixas.
      const group = menu.querySelector<HTMLElement>('[data-slot="menubar-group"]')!;
      const labelledBy = group.getAttribute('aria-labelledby');
      await expect(labelledBy).toBeTruthy();
      await expect(document.getElementById(labelledBy!)?.textContent).toContain(
        'Mostrar na tela'
      );
    });

    await step('O indicador publica o data-slot do seu tipo de item', async () => {
      // `data-slot` é o endereço de markup que as cinco stacks compartilham, e
      // o do indicador é por TIPO de item. Aqui ele não existia: o menubar era,
      // com o context-menu, o único indicador do sistema sem endereço próprio.
      for (const box of boxes) {
        await expect(
          box.querySelector('[data-slot="menubar-checkbox-item-indicator"]')
        ).not.toBeNull();
      }
    });

    await step('Alternar reflete no estado anunciado e no marcador visual', async () => {
      const target = boxes[EXIBICOES.indexOf('Barra lateral')];
      // Idempotente: o clique só acontece com a caixa desmarcada, então o
      // replay do painel Interactions parte do mesmo estado da primeira rodada.
      if (target.getAttribute('aria-checked') !== 'true') await userEvent.click(target);
      await waitFor(async () => {
        await expect(target.getAttribute('aria-checked')).toBe('true');
        // `aria-checked` é o que a pessoa ouve; o tique é o que ela vê. Buscar
        // pelo `data-slot` prova de quebra que o atributo ficou no INVÓLUCRO do
        // marcador — se caísse no item ou no nó interno da lib, o tique não
        // estaria dentro dele.
        await expect(
          target.querySelector('[data-slot="menubar-checkbox-item-indicator"] svg')
        ).not.toBeNull();
      });
    });

    await step('Marcar não fecha o menu — quem marca uma quer marcar a próxima', async () => {
      await expect(document.body.contains(menu)).toBe(true);
      const other = boxes[EXIBICOES.indexOf('Grade')];
      await expect(other.getAttribute('aria-checked')).toBe('false');
    });
  },
};

// ─── WithRadioGroup ───────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  args: { defaultValue: 'theme', demonstration: 'radio' },
  parameters: { covers: ['accessibility.item5'] },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const options = within(menu).getAllByRole('menuitemradio');

    await step('O grupo publica escolha única, e só uma opção está marcada', async () => {
      await expect(options).toHaveLength(THEMES.length);
      await expect(options.filter((o) => o.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    });

    await step('O indicador publica o data-slot do seu tipo de item', async () => {
      // Endereço por TIPO de item: escolha única e marcação não compartilham
      // slot, como nas outras stacks.
      for (const opcao of options) {
        await expect(
          opcao.querySelector('[data-slot="menubar-radio-item-indicator"]')
        ).not.toBeNull();
      }
      // O tique mora DENTRO do indicador — prova que o atributo ficou no
      // invólucro, e não no item nem no nó que a lib injeta.
      const marcada = options.find((o) => o.getAttribute('aria-checked') === 'true')!;
      await expect(
        marcada.querySelector('[data-slot="menubar-radio-item-indicator"] svg')
      ).not.toBeNull();
    });

    await step('Escolher outra opção transfere a marcação', async () => {
      const escuro = options[THEMES.findIndex((t) => t.value === 'dark')];
      // Idempotente: o clique só acontece com a opção desmarcada — e escolher a
      // MESMA opção duas vezes deixaria o mesmo estado de qualquer forma, que é
      // o que distingue escolha única de alternador.
      if (escuro.getAttribute('aria-checked') !== 'true') await userEvent.click(escuro);
      await waitFor(async () => {
        await expect(escuro.getAttribute('aria-checked')).toBe('true');
      });
      await expect(options.filter((o) => o.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    });
  },
};

// ─── EditorCompleto ───────────────────────────────────────────────────────────

export const EditorCompleto: Story = {
  args: { defaultValue: undefined, demonstration: 'editor' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const triggers = within(barra).getAllByRole('menuitem');

    await step('As quatro categorias clássicas convivem na mesma barra', async () => {
      await expect(triggers).toHaveLength(MENUS_EDITOR.length);
      for (const [i, trigger] of triggers.entries()) {
        await expect(trigger).toHaveAccessibleName(MENUS_EDITOR[i]);
      }
    });

    await step('A barra é uma só parada de tabulação, com todos os menus fechados', async () => {
      await expect(triggers.filter((g) => g.tabIndex === 0)).toHaveLength(1);
      for (const trigger of triggers) {
        await expect(trigger.getAttribute('data-state')).toBe('closed');
      }
    });
  },
};
