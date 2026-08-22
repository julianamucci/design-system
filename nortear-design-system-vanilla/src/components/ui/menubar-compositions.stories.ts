import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createMenubar } from './menubar';
import { embrulhar, esperarPainel, gatilhosDe } from './menubar.fixtures';
import { menubarSource, menubarSourceCom } from './menubar.source';

// Listas primeiro: toda contagem do play sai daqui, nunca de um número escrito
// à mão que a próxima edição do markup deixa mentindo.
const ATALHOS = [
  { label: 'Desfazer', shortcut: '⌘Z' },
  { label: 'Refazer', shortcut: '⇧⌘Z' },
  { label: 'Copiar', shortcut: '⌘C' },
] as const;

const EXPORTACOES = ['PDF', 'CSV', 'PNG'] as const;

const EXIBICOES = [
  { label: 'Régua', checked: true },
  { label: 'Barra lateral', checked: false },
  { label: 'Grade', checked: false },
] as const;

const TEMAS = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Do sistema' },
] as const;

const MENUS_EDITOR = ['Arquivo', 'Editar', 'Exibir', 'Ajuda'] as const;

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/Menubar/Compositions',
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: menubarSource },
      description: {
        component:
          'As composições canônicas de um menu da barra: atalhos visíveis, submenu, ' +
          'alternadores independentes, escolha única e a barra completa de um editor.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// A altura da moldura vai explícita em cada chamada de `embrulhar`: o padrão da
// fixture (260px) serve à barra comum, e cada composição aqui pede a sua.

// ─── WithShortcuts ────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      source: {
        transform: menubarSourceCom({
          menus: [
            {
              label: 'Editar',
              items: ATALHOS.map((a) => ({ label: a.label, shortcut: a.shortcut })),
            },
          ],
          defaultOpen: 0,
        }),
      },
    },
  },
  render: () =>
    embrulhar(
      createMenubar(
        [{ label: 'Editar', items: ATALHOS.map((a) => ({ label: a.label, shortcut: a.shortcut })) }],
        { defaultOpen: 0 },
      ),
      '300px',
    ),
  play: async ({ canvasElement, step }) => {
    const painel = await esperarPainel(canvasElement);
    const itens = within(painel).getAllByRole('menuitem');

    await step('Cada item leva o próprio atalho', async () => {
      await expect(itens).toHaveLength(ATALHOS.length);
      const atalhos = painel.querySelectorAll('[data-slot="menubar-shortcut"]');
      await expect(atalhos).toHaveLength(ATALHOS.length);
    });

    await step('O atalho entra no nome do item, e não fica escondido do leitor', async () => {
      // Sem `aria-hidden`: "Desfazer, ⌘Z" é o que dá serventia ao atalho para
      // quem não enxerga a tela. Escondê-lo devolveria só "Desfazer".
      for (const [i, item] of itens.entries()) {
        await expect(item).toHaveAccessibleName(`${ATALHOS[i].label} ${ATALHOS[i].shortcut}`);
      }
    });

    await step('O atalho é secundário — cor esmaecida à direita do rótulo', async () => {
      const atalho = painel.querySelector<HTMLElement>('[data-slot="menubar-shortcut"]')!;
      await expect(atalho.classList.contains('nds-dropdown-menu-shortcut')).toBe(true);
      await expect(getComputedStyle(atalho).color).not.toBe(getComputedStyle(itens[0]).color);
    });
  },
};

// ─── WithSubmenu ──────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  // O submenu é o assunto: o snippet do meta esconderia a sub-lista, que é a
  // única coisa que distingue esta composição de um menu comum.
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: {
      source: {
        transform: menubarSourceCom({
          menus: [
            {
              label: 'Arquivo',
              items: [
                { label: 'Novo' },
                {
                  type: 'submenu',
                  label: 'Exportar',
                  items: EXPORTACOES.map((e) => ({ label: e })),
                },
              ],
            },
          ],
          defaultOpen: 0,
        }),
      },
    },
  },
  render: () =>
    embrulhar(
      createMenubar(
        [
          {
            label: 'Arquivo',
            items: [
              { label: 'Novo' },
              {
                type: 'submenu',
                label: 'Exportar',
                items: EXPORTACOES.map((e) => ({ label: e })),
              },
            ],
          },
        ],
        { defaultOpen: 0 },
      ),
      '340px',
    ),
  play: async ({ canvasElement, step }) => {
    const painel = await esperarPainel(canvasElement);
    const subGatilho = within(painel).getByRole('menuitem', { name: 'Exportar' });

    await step('O sub-gatilho anuncia que abre outro menu', async () => {
      await expect(subGatilho.getAttribute('aria-haspopup')).toBe('menu');
      await expect(subGatilho.getAttribute('data-slot')).toBe('menubar-sub-trigger');
    });

    await step('Seta Baixo alcança o sub-gatilho; Seta Direita abre o submenu', async () => {
      // Idempotente: só navega e abre quando ainda está fechado.
      if (subGatilho.getAttribute('aria-expanded') !== 'true') {
        const primeiro = within(painel).getAllByRole('menuitem')[0];
        primeiro.focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(async () => {
          await expect(document.activeElement).toBe(subGatilho);
        });
        await userEvent.keyboard('{ArrowRight}');
      }

      await waitFor(async () => {
        await expect(subGatilho.getAttribute('aria-expanded')).toBe('true');
        // Dois painéis abertos ao mesmo tempo: o pai continua no lugar, é o que
        // distingue submenu de troca de menu.
        await expect(within(canvasElement).getAllByRole('menu')).toHaveLength(2);
      });
    });

    await step('O submenu traz os próprios itens e abre AO LADO do pai', async () => {
      const submenu = canvasElement.querySelector<HTMLElement>(
        '[data-slot="menubar-sub-content"]:not([hidden])',
      )!;
      await expect(within(submenu).getAllByRole('menuitem')).toHaveLength(EXPORTACOES.length);
      // Um submenu que nascesse embaixo cobriria os irmãos do item que o abriu.
      await expect(submenu.getAttribute('data-side')).toBe('right');
      await expect(submenu.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        painel.getBoundingClientRect().left,
      );
    });
  },
};

// ─── WithCheckboxItems ────────────────────────────────────────────────────────

export const WithCheckboxItems: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item3'],
    docs: {
      source: {
        transform: menubarSourceCom({
          menus: [
            {
              label: 'Exibir',
              items: [
                { type: 'label', label: 'Mostrar na tela' },
                ...EXIBICOES.map((e) => ({
                  type: 'checkbox' as const,
                  label: e.label,
                  checked: e.checked,
                  onCheckedChange: '(marcado) => alternar(marcado)',
                })),
              ],
            },
          ],
          defaultOpen: 0,
        }),
      },
    },
  },
  render: () =>
    embrulhar(
      createMenubar(
        [
          {
            label: 'Exibir',
            items: [
              { type: 'label', label: 'Mostrar na tela' },
              ...EXIBICOES.map((e) => ({
                type: 'checkbox' as const,
                label: e.label,
                checked: e.checked,
              })),
            ],
          },
        ],
        { defaultOpen: 0 },
      ),
      '300px',
    ),
  play: async ({ canvasElement, step }) => {
    const painel = await esperarPainel(canvasElement);
    const caixas = within(painel).getAllByRole('menuitemcheckbox');

    await step('Cada linha é uma caixa de seleção independente', async () => {
      await expect(caixas).toHaveLength(EXIBICOES.length);
      for (const caixa of caixas) {
        await expect(caixa.getAttribute('data-slot')).toBe('menubar-checkbox-item');
        await expect(caixa.getAttribute('aria-checked')).toBeTruthy();
      }
    });

    await step('Alternar reflete no estado anunciado e no marcador visual', async () => {
      const alvo = caixas[EXIBICOES.findIndex((e) => e.label === 'Barra lateral')];
      // Idempotente: o clique só acontece com a caixa desmarcada, então o
      // replay do painel Interactions parte do mesmo estado da primeira rodada.
      if (alvo.getAttribute('aria-checked') !== 'true') await userEvent.click(alvo);
      await waitFor(async () => {
        await expect(alvo.getAttribute('aria-checked')).toBe('true');
        // `aria-checked` é o que a pessoa ouve; o tique é o que ela vê.
        await expect(alvo.querySelector('.nds-dropdown-menu-item-indicator svg')).not.toBeNull();
      });
    });

    await step('Marcar não fecha o menu — quem marca uma quer marcar a próxima', async () => {
      await expect(painel.hidden).toBe(false);
      const outra = caixas[EXIBICOES.findIndex((e) => e.label === 'Grade')];
      await expect(outra.getAttribute('aria-checked')).toBe('false');
    });
  },
};

// ─── WithRadioGroup ───────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  parameters: {
    covers: ['accessibility.item5'],
    docs: {
      source: {
        transform: menubarSourceCom({
          menus: [
            {
              label: 'Aparência',
              items: [
                { type: 'label', label: 'Tema' },
                {
                  type: 'radio-group',
                  value: 'light',
                  options: TEMAS.map((t) => ({ value: t.value, label: t.label })),
                  onValueChange: '(valor) => aplicarTema(valor)',
                },
              ],
            },
          ],
          defaultOpen: 0,
        }),
      },
    },
  },
  render: () =>
    embrulhar(
      createMenubar(
        [
          {
            label: 'Aparência',
            items: [
              { type: 'label', label: 'Tema' },
              {
                type: 'radio-group',
                value: 'light',
                options: TEMAS.map((t) => ({ value: t.value, label: t.label })),
              },
            ],
          },
        ],
        { defaultOpen: 0 },
      ),
      '300px',
    ),
  play: async ({ canvasElement, step }) => {
    const painel = await esperarPainel(canvasElement);
    const opcoes = within(painel).getAllByRole('menuitemradio');

    await step('O grupo publica escolha única, e só uma opção está marcada', async () => {
      await expect(opcoes).toHaveLength(TEMAS.length);
      await expect(opcoes.filter((o) => o.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    });

    await step('Escolher outra opção transfere a marcação', async () => {
      const escuro = opcoes[TEMAS.findIndex((t) => t.value === 'dark')];
      // Idempotente: o clique só acontece com a opção desmarcada — e escolher a
      // MESMA opção duas vezes deixaria o mesmo estado de qualquer forma, que é
      // o que distingue escolha única de alternador.
      if (escuro.getAttribute('aria-checked') !== 'true') await userEvent.click(escuro);
      await waitFor(async () => {
        await expect(escuro.getAttribute('aria-checked')).toBe('true');
      });
      await expect(opcoes.filter((o) => o.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    });
  },
};

// ─── EditorCompleto ───────────────────────────────────────────────────────────

export const EditorCompleto: Story = {
  // A barra inteira é o assunto: as quatro categorias convivendo é o que o
  // snippet do meta, com dois menus, deixaria de fora.
  parameters: {
    docs: {
      source: {
        transform: menubarSourceCom({
          menus: [
            {
              label: 'Arquivo',
              items: [
                { type: 'label', label: 'Documento' },
                { label: 'Novo', shortcut: '⌘N' },
                { label: 'Abrir', shortcut: '⌘O' },
                { type: 'separator' },
                { label: 'Descartar alterações', variant: 'destructive' },
              ],
            },
            {
              label: 'Editar',
              items: [
                { label: 'Desfazer', shortcut: '⌘Z' },
                { label: 'Refazer', shortcut: '⇧⌘Z' },
              ],
            },
            {
              label: 'Exibir',
              items: [
                { type: 'label', label: 'Mostrar na tela' },
                { type: 'checkbox', label: 'Régua', checked: true },
                { type: 'checkbox', label: 'Grade' },
              ],
            },
            {
              label: 'Ajuda',
              items: [{ label: 'Documentação' }, { label: 'Atalhos de teclado' }],
            },
          ],
        }),
      },
    },
  },
  render: () =>
    embrulhar(
      createMenubar([
        {
          label: 'Arquivo',
          items: [
            { type: 'label', label: 'Documento' },
            { label: 'Novo', shortcut: '⌘N' },
            { label: 'Abrir', shortcut: '⌘O' },
            { type: 'separator' },
            { label: 'Descartar alterações', variant: 'destructive' },
          ],
        },
        {
          label: 'Editar',
          items: [
            { label: 'Desfazer', shortcut: '⌘Z' },
            { label: 'Refazer', shortcut: '⇧⌘Z' },
          ],
        },
        {
          label: 'Exibir',
          items: [
            { type: 'label', label: 'Mostrar na tela' },
            { type: 'checkbox', label: 'Régua', checked: true },
            { type: 'checkbox', label: 'Grade' },
          ],
        },
        {
          label: 'Ajuda',
          items: [{ label: 'Documentação' }, { label: 'Atalhos de teclado' }],
        },
      ]),
      '200px',
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const gatilhos = gatilhosDe(barra);

    await step('As quatro categorias clássicas convivem na mesma barra', async () => {
      await expect(gatilhos).toHaveLength(MENUS_EDITOR.length);
      for (const [i, gatilho] of gatilhos.entries()) {
        await expect(gatilho).toHaveAccessibleName(MENUS_EDITOR[i]);
      }
    });

    await step('A barra é uma só parada de tabulação, com todos os menus fechados', async () => {
      await expect(
        gatilhos.filter((g) => g.tabIndex === 0),
      ).toHaveLength(1);
      for (const gatilho of gatilhos) {
        await expect(gatilho.getAttribute('data-state')).toBe('closed');
      }
    });
  },
};
