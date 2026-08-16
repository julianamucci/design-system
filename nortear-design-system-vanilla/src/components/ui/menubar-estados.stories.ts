import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { createMenubar } from './menubar';

const MENUS_FECHADOS = ['Arquivo', 'Editar', 'Exibir', 'Ajuda'] as const;

const ITENS_COM_BLOQUEIO = [
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
  title: 'UI/Menubar/States',
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Os quatro estados que o conteúdo compartilhado descreve: barra fechada, menu aberto, ' +
          'item bloqueado e item marcado.',
      },
    },
  },
};

/** Só os gatilhos da barra: nesta stack o painel mora DENTRO da raiz, então
 *  procurar por papel na barra devolveria também os itens do menu aberto. */
function gatilhosDe(barra: HTMLElement): HTMLElement[] {
  return Array.from(barra.querySelectorAll<HTMLElement>('[data-slot="menubar-trigger"]'));
}

export default meta;
type Story = StoryObj;

function embrulhar(filho: HTMLElement, alturaMinima = '260px'): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full nds-p-2';
  wrapper.dataset.justify = 'center';
  wrapper.style.alignItems = 'flex-start';
  wrapper.style.minHeight = alturaMinima;
  wrapper.appendChild(filho);
  return wrapper;
}

function painelAberto(canvasElement: HTMLElement): HTMLElement | null {
  return canvasElement.querySelector<HTMLElement>(
    '[data-slot="menubar-content"]:not([hidden])',
  );
}

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
    const gatilhos = gatilhosDe(barra);

    await step('A barra publica o papel e a orientação', async () => {
      await expect(barra.getAttribute('data-slot')).toBe('menubar');
      await expect(barra.getAttribute('aria-orientation')).toBe('horizontal');
      await expect(gatilhos).toHaveLength(MENUS_FECHADOS.length);
    });

    await step('Fechado é ausência: nenhum painel visível e nenhum item alcançável', async () => {
      for (const gatilho of gatilhos) {
        await expect(gatilho.getAttribute('data-state')).toBe('closed');
        await expect(gatilho.getAttribute('aria-expanded')).toBe('false');
      }
      // Painel oculto pelo atributo `hidden`: continua fora da árvore de
      // acessibilidade, então o leitor de tela não o lê nem a busca o acha.
      await expect(painelAberto(canvasElement)).toBeNull();
      await expect(canvas.queryAllByRole('menu')).toHaveLength(0);
    });
  },
};

// ─── Open ─────────────────────────────────────────────────────────────────────

export const Open: Story = {
  parameters: { covers: ['accessibility.item4'] },
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
    const [arquivo, editar] = gatilhosDe(barra);

    const painel = await waitFor(() => {
      const p = painelAberto(canvasElement);
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
      await expect(painel.getAttribute('role')).toBe('menu');
      await expect(painel.getAttribute('data-slot')).toBe('menubar-content');
      await expect(painel.getAttribute('data-side')).toBe('bottom');
      // A âncora é o GATILHO, não a barra: sem lib de posicionamento, o painel
      // é absoluto dentro do wrapper do menu, e o recheio da barra fica entre
      // um e outro. Medir contra a barra acusaria 1,5px de "acima" que ninguém
      // vê — e esconderia um painel realmente nascido para cima.
      await expect(painel.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        arquivo.getBoundingClientRect().bottom,
      );
    });
  },
};

// ─── ItemDisabled ─────────────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  args: { onSelect: fn() },
  argTypes: { onSelect: { control: false, table: { disable: true } } },
  render: (args) =>
    embrulhar(
      createMenubar(
        [
          {
            label: 'Arquivo',
            items: ITENS_COM_BLOQUEIO.map((i) => ({
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
    const painel = await waitFor(() => {
      const p = painelAberto(canvasElement);
      if (!p) throw new Error('painel não abriu');
      return p;
    });
    const itens = within(painel).getAllByRole('menuitem');
    const bloqueado = itens[ITENS_COM_BLOQUEIO.findIndex((i) => i.disabled)];

    await step('O item bloqueado se anuncia como tal', async () => {
      await expect(itens).toHaveLength(ITENS_COM_BLOQUEIO.length);
      await expect(bloqueado.getAttribute('aria-disabled')).toBe('true');
      // `aria-disabled`, e não o atributo `disabled`: o item continua
      // alcançável pela seta, para ser ANUNCIADO como indisponível em vez de
      // sumir sem explicação de quem navega por teclado.
      await expect(bloqueado.hasAttribute('disabled')).toBe(false);
    });

    await step('O bloqueio é visível sem depender de cor', async () => {
      await expect(Number(getComputedStyle(bloqueado).opacity)).toBeLessThan(
        Number(getComputedStyle(itens[0]).opacity),
      );
    });

    await step('Escolher o item bloqueado não executa nada', async () => {
      await userEvent.click(bloqueado, { pointerEventsCheck: 0 });
      await expect(args['onSelect']).not.toHaveBeenCalledWith(bloqueado.textContent?.trim());
    });
  },
};

// ─── CheckboxChecked ──────────────────────────────────────────────────────────

export const CheckboxChecked: Story = {
  parameters: { covers: ['functional.item7'] },
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
    const painel = await waitFor(() => {
      const p = painelAberto(canvasElement);
      if (!p) throw new Error('painel não abriu');
      return p;
    });
    const canvas = within(painel);
    const regua = canvas.getByRole('menuitemcheckbox', { name: 'Régua' });
    const grade = canvas.getByRole('menuitemcheckbox', { name: 'Grade' });

    await step('O estado inicial chega marcado ao markup', async () => {
      await expect(regua.getAttribute('aria-checked')).toBe('true');
      await expect(grade.getAttribute('aria-checked')).toBe('false');
    });

    await step('O marcado mostra o tique; o desmarcado, não', async () => {
      // O visual do estado não pode depender só de cor: o tique é o que a
      // pessoa vê, e o `aria-checked` é o que ela ouve.
      const tique = (item: HTMLElement) =>
        item.querySelector('.nds-dropdown-menu-item-indicator svg') !== null;
      await expect(tique(regua)).toBe(true);
      await expect(tique(grade)).toBe(false);
    });

    await step('Desmarcar o que estava marcado mantém o menu aberto', async () => {
      // Idempotente: o clique só acontece com a caixa ainda marcada.
      if (regua.getAttribute('aria-checked') !== 'false') await userEvent.click(regua);
      await waitFor(async () => {
        await expect(regua.getAttribute('aria-checked')).toBe('false');
      });
      await expect(painelAberto(canvasElement)).not.toBeNull();
    });
  },
};
