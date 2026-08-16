import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { reactive } from 'vue';
import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarTrigger,
} from './index';
import { waitForPortal, REGRA_GUARDA_DE_FOCO } from '@/lib/wait-for-portal';

const MENUS_FECHADOS = ['Arquivo', 'Editar', 'Exibir', 'Ajuda'];

const ITENS_COM_BLOQUEIO = [
  { label: 'Novo', disabled: false },
  { label: 'Salvar', disabled: false },
  { label: 'Enviar para revisão', disabled: true },
];

// Espião de escopo de MÓDULO: criado dentro do `render` ele seria inalcançável
// pelo `play`, e a aba Actions abriria vazia.
const espiaoDeSelecao = fn();

const meta = {
  title: 'UI/Menubar/States',
  component: Menubar,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Os quatro estados que o conteúdo compartilhado descreve: barra fechada, menu aberto, item bloqueado e item marcado.',
      },
    },
  },
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

const pecas = {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarTrigger,
};

// ─── Closed ───────────────────────────────────────────────────────────────────
//
// A única story que termina sem nada portalizado — e por isso a única em que o
// axe roda com TODAS as regras. É aqui que "sem violações no estado padrão"
// vale de verdade.

export const Closed: Story = {
  parameters: { covers: ['accessibility.item1', 'accessibility.item2', 'visual.item1'] },
  render: () => ({
    components: pecas,
    setup: () => ({ menus: MENUS_FECHADOS }),
    template: `
      <div style="contain: layout; min-height: 120px;">
        <Menubar>
          <MenubarMenu v-for="m in menus" :key="m" :value="m">
            <MenubarTrigger>{{ m }}</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>{{ m }} — primeira ação</MenubarItem>
              <MenubarItem>{{ m }} — segunda ação</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const gatilhos = within(barra).getAllByRole('menuitem');

    await step('A barra publica o papel e o marcador de composição', async () => {
      await expect(barra.getAttribute('data-slot')).toBe('menubar');
      await expect(gatilhos).toHaveLength(MENUS_FECHADOS.length);
    });

    await step('Fechado é ausência: nenhum painel existe no DOM', async () => {
      for (const gatilho of gatilhos) {
        await expect(gatilho.getAttribute('data-state')).toBe('closed');
        await expect(gatilho.getAttribute('aria-expanded')).toBe('false');
      }
      // Portal desmontado, não escondido: um painel só oculto continuaria
      // sendo lido por leitor de tela e encontrável pela busca da página.
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(0);
    });
  },
};

// ─── Open ─────────────────────────────────────────────────────────────────────

export const Open: Story = {
  parameters: {
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    covers: ['accessibility.item4'],
  },
  render: () => ({
    components: pecas,
    template: `
      <div style="contain: layout; min-height: 260px;">
        <Menubar default-value="file">
          <MenubarMenu value="file">
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Novo</MenubarItem>
              <MenubarItem>Abrir</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu value="edit">
            <MenubarTrigger>Editar</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Desfazer</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const [arquivo, editar] = within(barra).getAllByRole('menuitem');
    const menu = await waitForPortal('menu');

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
      await expect(menu.getAttribute('data-slot')).toBe('menubar-content');
      await waitFor(async () => {
        // O positioner mede DEPOIS de o painel entrar no DOM: no primeiro
        // quadro o retângulo ainda é (0,0), e ler daí é corrida.
        const barraRect = barra.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        await expect(menuRect.top).toBeGreaterThanOrEqual(barraRect.bottom - 1);
      });
    });
  },
};

// ─── ItemDisabled ─────────────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  parameters: {
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
  },
  render: () => ({
    components: pecas,
    setup: () => ({ itens: ITENS_COM_BLOQUEIO, aoEscolher: espiaoDeSelecao }),
    template: `
      <div style="contain: layout; min-height: 240px;">
        <Menubar default-value="file">
          <MenubarMenu value="file">
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem
                v-for="i in itens"
                :key="i.label"
                :disabled="i.disabled"
                @select="aoEscolher(i.label)"
              >{{ i.label }}</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const itens = within(menu).getAllByRole('menuitem');
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
      await expect(espiaoDeSelecao).not.toHaveBeenCalledWith(bloqueado.textContent?.trim());
    });
  },
};

// ─── CheckboxChecked ──────────────────────────────────────────────────────────

export const CheckboxChecked: Story = {
  parameters: {
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    covers: ['functional.item7'],
  },
  render: () => ({
    components: pecas,
    setup() {
      // Reativo de verdade: com um objeto solto o clique emitiria a mudança e
      // nada re-renderizaria — o item ficaria preso no estado inicial.
      return { estado: reactive<Record<string, boolean>>({ 'Régua': true, Grade: false }) };
    },
    template: `
      <div style="contain: layout; min-height: 240px;">
        <Menubar default-value="view">
          <MenubarMenu value="view">
            <MenubarTrigger>Exibir</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel>Mostrar na tela</MenubarLabel>
              <MenubarCheckboxItem
                v-for="(marcado, nome) in estado"
                :key="nome"
                :checked="marcado"
                @update:checked="estado[nome] = $event"
              >{{ nome }}</MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const regua = canvas.getByRole('menuitemcheckbox', { name: 'Régua' });
    const grade = canvas.getByRole('menuitemcheckbox', { name: 'Grade' });

    await step('O estado inicial chega marcado ao markup', async () => {
      // Afirmar o resultado do input é o que impede o defeito silencioso da
      // prop ignorada: a lib aceita nome desconhecido sem erro nenhum.
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
      await expect(document.body.contains(menu)).toBe(true);
    });
  },
};
