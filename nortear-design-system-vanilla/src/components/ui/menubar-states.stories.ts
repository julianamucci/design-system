import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { createMenubar } from './menubar';
import { embrulhar, triggersOf, panelOpen } from './menubar.fixtures';
import { menubarSource, menubarSourceWith } from './menubar.source';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';
import { formaDoIndicador, ehTraco, ehTique } from '@shared/testing/menu-checkbox-indicator';

const MENUS_FECHADOS = ['Arquivo', 'Editar', 'Exibir', 'Ajuda'] as const;

const ITEMS_WITH_BLOCK = [
  { label: 'Novo', disabled: false },
  { label: 'Salvar', disabled: false },
  { label: 'Enviar para revisão', disabled: true },
] as const;

const EXIBICOES = [
  { label: 'Régua', checked: true },
  { label: 'Grade', checked: false },
] as const;

const meta: Meta = {
  tags: ['navigation'],
  title: 'Primitives/Navigation/Menubar/States',
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: menubarSource },
      description: {
        component:
          'Os quatro estados que o conteúdo compartilhado descreve: barra fechada, menu aberto, ' +
          'item bloqueado e item marcado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Closed ───────────────────────────────────────────────────────────────────
//
// A única story que termina sem painel algum aberto — e é aqui que "sem
// violações no estado padrão" vale de verdade.

export const Closed: Story = {
  parameters: { covers: ['accessibility.item1', 'accessibility.item2', 'visual.item1'] },
  render: () =>
    embrulhar(
      createMenubar(
        MENUS_FECHADOS.map((m) => ({
          label: m,
          items: [{ label: `${m} — primeira ação` }, { label: `${m} — segunda ação` }],
        })),
      ),
      '160px',
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const triggers = triggersOf(barra);

    await step('A barra publica o papel e a orientação', async () => {
      await expect(barra.getAttribute('data-slot')).toBe('menubar');
      await expect(barra.getAttribute('aria-orientation')).toBe('horizontal');
      await expect(triggers).toHaveLength(MENUS_FECHADOS.length);
    });

    await step('Fechado é ausência: nenhum painel visível e nenhum item alcançável', async () => {
      for (const trigger of triggers) {
        await expect(trigger.getAttribute('data-state')).toBe('closed');
        await expect(trigger.getAttribute('aria-expanded')).toBe('false');
      }
      // Painel oculto pelo atributo `hidden`: continua fora da árvore de
      // acessibilidade, então o leitor de tela não o lê nem a busca o acha.
      await expect(panelOpen(canvasElement)).toBeNull();
      await expect(canvas.queryAllByRole('menu')).toHaveLength(0);
    });
  },
};

// ─── Open ─────────────────────────────────────────────────────────────────────

export const Open: Story = {
  parameters: {
    covers: ['accessibility.item4'],
    // `defaultOpen` é o que faz o menu nascer aberto — é o assunto da story.
    docs: {
      source: {
        transform: menubarSourceWith({
          menus: [
            { label: 'Arquivo', items: [{ label: 'Novo' }, { label: 'Abrir' }] },
            { label: 'Editar', items: [{ label: 'Desfazer' }] },
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
          { label: 'Arquivo', items: [{ label: 'Novo' }, { label: 'Abrir' }] },
          { label: 'Editar', items: [{ label: 'Desfazer' }] },
        ],
        { defaultOpen: 0 },
      ),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const [arquivo, editar] = triggersOf(barra);

    const panel = await waitFor(() => {
      const p = panelOpen(canvasElement);
      if (!p) throw new Error('painel não abriu');
      return p;
    });

    await step('O gatilho aberto se distingue dos vizinhos', async () => {
      await expect(arquivo.getAttribute('data-state')).toBe('open');
      await expect(arquivo.getAttribute('aria-expanded')).toBe('true');
      await expect(editar.getAttribute('data-state')).toBe('closed');
      // O realce do gatilho aberto é fundo, não só cor de texto: o CSS
      // compartilhado casa por `[data-state="open"]`.
      await expect(getComputedStyle(arquivo).backgroundColor).not.toBe(
        getComputedStyle(editar).backgroundColor,
      );
    });

    await step('O painel é um menu de verdade, ancorado abaixo do gatilho', async () => {
      await expect(panel.getAttribute('role')).toBe('menu');
      await expect(panel.getAttribute('data-slot')).toBe('menubar-content');
      await expect(panel.getAttribute('data-side')).toBe('bottom');
      // A âncora é o GATILHO, não a barra: sem lib de posicionamento, o painel
      // é absoluto dentro do wrapper do menu, e o recheio da barra fica entre
      // um e outro. Medir contra a barra acusaria 1,5px de "acima" que ninguém
      // vê — e esconderia um painel realmente nascido para cima.
      await expect(panel.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        arquivo.getBoundingClientRect().bottom,
      );
    });
  },
};

// ─── ItemDisabled ─────────────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  parameters: {
    covers: ['accessibility.item8'],
    docs: {
      source: {
        transform: menubarSourceWith({
          menus: [
            {
              label: 'Arquivo',
              items: ITEMS_WITH_BLOCK.map((i) => ({
                label: i.label,
                disabled: i.disabled || undefined,
                onClick: '() => executar()',
              })),
            },
          ],
          defaultOpen: 0,
        }),
      },
    },
  },
  args: { onSelect: fn() },
  argTypes: { onSelect: { control: false, table: { disable: true } } },
  render: (args) =>
    embrulhar(
      createMenubar(
        [
          {
            label: 'Arquivo',
            items: ITEMS_WITH_BLOCK.map((i) => ({
              label: i.label,
              disabled: i.disabled,
              onClick: () => (args as { onSelect: (l: string) => void }).onSelect(i.label),
            })),
          },
        ],
        { defaultOpen: 0 },
      ),
    ),
  play: async ({ canvasElement, step, args }) => {
    const panel = await waitFor(() => {
      const p = panelOpen(canvasElement);
      if (!p) throw new Error('painel não abriu');
      return p;
    });
    const items = within(panel).getAllByRole('menuitem');
    const bloqueado = items[ITEMS_WITH_BLOCK.findIndex((i) => i.disabled)];

    await step('O item bloqueado se anuncia como tal', async () => {
      await expect(items).toHaveLength(ITEMS_WITH_BLOCK.length);
      await expect(bloqueado.getAttribute('aria-disabled')).toBe('true');
      // `aria-disabled`, e não o atributo `disabled`: o item continua
      // alcançável pela seta, para ser ANUNCIADO como indisponível em vez de
      // sumir sem explicação de quem navega por teclado.
      await expect(bloqueado.hasAttribute('disabled')).toBe(false);
    });

    await step('O bloqueio é visível sem depender de cor', async () => {
      await expect(Number(getComputedStyle(bloqueado).opacity)).toBeLessThan(
        Number(getComputedStyle(items[0]).opacity),
      );
    });

    await step('A seta POUSA no item bloqueado', async () => {
      // Decisão de 2026-09-02, nas cinco stacks: o item desabilitado continua no
      // percurso das setas para ser ANUNCIADO como indisponível. Some-lo da roda
      // esconderia de quem navega de ouvido que a opção existe.
      //
      // O comentário do primeiro passo já dizia "continua alcançável pela seta",
      // e nada aqui apertava tecla nenhuma — `aria-disabled` sozinho não prova
      // percurso. Este passo é quem cobra a promessa.
      const previous = items[ITEMS_WITH_BLOCK.findIndex((i) => i.disabled) - 1];
      previous.focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(bloqueado);
    });

    await step('Escolher o item bloqueado não executa nada', async () => {
      await userEvent.click(bloqueado, { pointerEventsCheck: 0 });
      await expect(args['onSelect']).not.toHaveBeenCalledWith(bloqueado.textContent?.trim());
    });
  },
};

// ─── CheckboxChecked ──────────────────────────────────────────────────────────

export const CheckboxChecked: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: {
      source: {
        transform: menubarSourceWith({
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
    ),
  play: async ({ canvasElement, step }) => {
    const panel = await waitFor(() => {
      const p = panelOpen(canvasElement);
      if (!p) throw new Error('painel não abriu');
      return p;
    });
    const canvas = within(panel);
    const regua = canvas.getByRole('menuitemcheckbox', { name: 'Régua' });
    const grid = canvas.getByRole('menuitemcheckbox', { name: 'Grade' });

    await step('O estado inicial chega marcado ao markup', async () => {
      await expect(regua.getAttribute('aria-checked')).toBe('true');
      await expect(grid.getAttribute('aria-checked')).toBe('false');
    });

    await step('O marcado mostra o tique; o desmarcado, não', async () => {
      // O visual do estado não pode depender só de cor: o tique é o que a
      // pessoa vê, e o `aria-checked` é o que ela ouve.
      const tique = (item: HTMLElement) =>
        item.querySelector('.nds-dropdown-menu-item-indicator svg') !== null;
      await expect(tique(regua)).toBe(true);
      await expect(tique(grid)).toBe(false);
    });

    await step('Desmarcar o que estava marcado mantém o menu aberto', async () => {
      // Idempotente: o clique só acontece com a caixa ainda marcada.
      if (regua.getAttribute('aria-checked') !== 'false') await userEvent.click(regua);
      await waitFor(async () => {
        await expect(regua.getAttribute('aria-checked')).toBe('false');
      });
      await expect(panelOpen(canvasElement)).not.toBeNull();
    });
  },
};

// ─── CheckboxIndeterminate ────────────────────────────────────────────────────
//
// Story SEM interação, de propósito. O que ela declara vale na montagem, e o
// primeiro clique num item misto o resolve para marcado — uma play que clicasse
// aqui mediria outro estado no REPLAY do painel Interactions, que reexecuta no
// mesmo DOM. Sem clique, cada rodada mede exatamente o mesmo.

export const CheckboxIndeterminate: Story = {
  parameters: {
    covers: ['functional.item9'],
    // O estado misto é o assunto, e ele vale SOBRE o marcado: mostrar os dois
    // juntos ensinaria um estado que a fábrica resolve por conta própria.
    docs: {
      source: {
        transform: menubarSourceWith({
          menus: [
            {
              label: 'Exibir',
              items: [
                { type: 'label', label: 'Mostrar na tela' },
                { type: 'checkbox', label: 'Colunas', indeterminate: true },
                { type: 'checkbox', label: 'Régua', checked: true },
                { type: 'checkbox', label: 'Grade' },
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
              { type: 'checkbox', label: 'Colunas', indeterminate: true },
              { type: 'checkbox', label: 'Régua', checked: true },
              { type: 'checkbox', label: 'Grade', checked: false },
            ],
          },
        ],
        { defaultOpen: 0 },
      ),
    ),
  play: async ({ canvasElement, step }) => {
    const panel = await waitFor(() => {
      const p = panelOpen(canvasElement);
      if (!p) throw new Error('painel não abriu');
      return p;
    });
    const canvas = within(panel);
    const misto = canvas.getByRole('menuitemcheckbox', { name: 'Colunas' });
    const checked = canvas.getByRole('menuitemcheckbox', { name: 'Régua' });
    const desmarcado = canvas.getByRole('menuitemcheckbox', { name: 'Grade' });

    await step('O estado misto é anunciado como misto, e não como marcado', async () => {
      // Uma comparação frouxa leria o misto como verdadeiro; o que a pessoa ouve
      // tem que separar os três estados.
      await expect(misto.getAttribute('aria-checked')).toBe('mixed');
      await expect(checked.getAttribute('aria-checked')).toBe('true');
      await expect(desmarcado.getAttribute('aria-checked')).toBe('false');
    });

    await step('O misto desenha traço; o marcado, tique', async () => {
      // A medida é a GEOMETRIA do glifo, não o nome da classe nem o do ícone:
      // traço é largo e sem altura, tique tem a diagonal. Com o mesmo símbolo
      // nos dois estados — o defeito — esta asserção fica vermelha.
      const formaMista = formaDoIndicador(misto);
      const formaMarcada = formaDoIndicador(checked);
      await expect(ehTraco(formaMista)).toBe(true);
      await expect(ehTique(formaMista)).toBe(false);
      await expect(ehTique(formaMarcada)).toBe(true);
    });

    await step('O desmarcado continua sem glifo nenhum', async () => {
      await expect(formaDoIndicador(desmarcado)).toBeNull();
    });
  },
};

// ─── Limpeza de ouvintes ──────────────────────────────────────────────────────
//
// A fábrica registra ouvinte em `document`. Quem tira o nó da página com o
// componente nesse estado não passa por caminho de fechamento nenhum, e antes
// não havia o que chamar. A prova aqui NÃO é "`destroy()` rodou" — isso passaria
// com um `destroy()` vazio. É a contagem de ouvintes do livro-caixa fechando em
// zero, confirmada por uma bateria de eventos disparada no documento depois da
// saída. Ver `leak-probe.ts` para o que cada prova cobre e como pode falhar.

export const ListenerCleanup: Story = {
  parameters: {
    controls: { disable: true },
    // A story existe para o que acontece DEPOIS da saída do nó: a foto seria
    // sempre a mesma legenda.
    chromatic: { disable: true },
    // O assunto é a limpeza: o snippet do meta pararia antes da única linha
    // que a story existe para mostrar.
    docs: {
      source: {
        transform: menubarSourceWith({
          menus: [
            { label: 'Arquivo', items: [{ label: 'Novo' }, { label: 'Salvar' }] },
            { label: 'Editar', items: [{ label: 'Desfazer' }] },
          ],
          destroy: true,
        }),
      },
    },
  },
  render: () => probeHost(
    'Sonda de limpeza: a barra é montada, um menu é aberto e a barra sai da página.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let probe!: ProbeResult;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      probe = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => createMenubar([
          { label: 'Arquivo', items: [{ label: 'Novo' }, { label: 'Salvar' }] },
          { label: 'Editar', items: [{ label: 'Desfazer' }] },
        ]),
        exercitar: (no) => no.querySelector<HTMLElement>('[data-slot="menubar-trigger"]')?.click(),
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(probe);
    });
  },
};
