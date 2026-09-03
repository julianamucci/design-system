import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, fn, waitFor } from 'storybook/test';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from './index';
import MenubarDocs from '@/components/docs/MenubarDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { menubarSource } from './menubar.source';

// ─── Dados da barra ───────────────────────────────────────────────────────────
//
// A barra do Playground nasce de uma lista, e não de markup repetido quatro
// vezes: as asserções contam a partir DELA, então acrescentar um menu não deixa
// um número cravado para trás no teste.

const MENUS = [
  {
    value: 'file',
    label: 'Arquivo',
    items: [
      { label: 'Novo', atalho: 'Ctrl+N' },
      { label: 'Abrir', atalho: 'Ctrl+O' },
      { label: 'Salvar', atalho: 'Ctrl+S' },
    ],
  },
  {
    value: 'edit',
    label: 'Editar',
    items: [
      { label: 'Desfazer', atalho: 'Ctrl+Z' },
      { label: 'Refazer', atalho: 'Ctrl+Shift+Z' },
      { label: 'Copiar', atalho: 'Ctrl+C' },
    ],
  },
  {
    value: 'view',
    label: 'Exibir',
    items: [{ label: 'Aproximar' }, { label: 'Afastar' }, { label: 'Tela cheia' }],
  },
  {
    value: 'help',
    label: 'Ajuda',
    items: [{ label: 'Documentação' }, { label: 'Atalhos de teclado' }],
  },
];

type PlaygroundArgs = {
  defaultValue: string;
  loop: boolean;
  /** Lado em que o painel abre. Vive no conteúdo, e o Playground o encaminha. */
  side: 'top' | 'right' | 'bottom' | 'left';
  'onUpdate:modelValue': (value: string) => void;
};

const meta = {
  title: 'Primitives/Navigation/Menubar',
  component: Menubar,
  tags: ['autodocs', 'navigation'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(MenubarDocs), source: { transform: menubarSource } },
  },
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'Menu aberto ao montar, em modo não-controlado.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    loop: {
      control: 'boolean',
      description: 'A seta dá a volta do último gatilho para o primeiro, e vice-versa.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    side: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
      description:
        'De que lado do gatilho o painel abre. O padrão desce, que é o que a barra de menu faz em toda plataforma.',
      table: { type: { summary: "'top' | 'right' | 'bottom' | 'left'" }, defaultValue: { summary: "'bottom'" } },
    },
    'onUpdate:modelValue': { control: false, table: { disable: true } },
  },
  args: {
    defaultValue: '',
    loop: true,
    side: 'bottom',
    'onUpdate:modelValue': fn(),
  },
} satisfies Meta<PlaygroundArgs>;

export default meta;
// `StoryObj<PlaygroundArgs>` e não `<typeof meta>`: o `component: Menubar` faz o
// segundo derivar os args do componente RAIZ, e `side` vive no conteúdo. É a
// mesma forma que o Playground do React usa.
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'functional.item4',
      'functional.item6',
      'functional.item8',
      'functional.item10',
      'functional.item11',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item6',
    ],
  },
  render: (args) => ({
    components: { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarShortcut, MenubarTrigger },
    setup() {
      return { args, menus: MENUS };
    },
    template: `
      <div class="nds-min-h-80" style="contain: layout">
        <Menubar
          :key="String(args.defaultValue) + String(args.loop)"
          :default-value="args.defaultValue || undefined"
          :loop="args.loop"
          @update:model-value="args['onUpdate:modelValue']"
        >
          <MenubarMenu v-for="m in menus" :key="m.value" :value="m.value">
            <MenubarTrigger>{{ m.label }}</MenubarTrigger>
            <MenubarContent :side="args.side">
              <MenubarItem v-for="i in m.items" :key="i.label">
                {{ i.label }}
                <MenubarShortcut v-if="i.atalho">{{ i.atalho }}</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const triggers = within(barra).getAllByRole('menuitem');
    const [arquivo, editar] = triggers;

    await step('A barra é um menubar, e cada gatilho anuncia o menu que abre', async () => {
      await expect(triggers).toHaveLength(MENUS.length);
      for (const [i, trigger] of triggers.entries()) {
        await expect(trigger).toHaveAccessibleName(MENUS[i].label);
        await expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
      }
    });

    await step('A barra inteira é UMA parada de tabulação', async () => {
      // Zera o foco para o Tab partir sempre do mesmo ponto: o replay do painel
      // Interactions roda a play de novo, com o foco onde a rodada anterior o
      // deixou, e sem isto a asserção mediria a segunda volta.
      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();

      await expect(document.activeElement).toBe(arquivo);
      await expect(triggers.filter((g) => g.tabIndex === 0)).toHaveLength(1);
    });

    await step('Enter no gatilho abre o menu com foco no primeiro item', async () => {
      // Idempotente: só digita com o menu fechado, então o replay parte do
      // mesmo estado da primeira rodada.
      if (arquivo.getAttribute('aria-expanded') !== 'true') {
        arquivo.focus();
        await userEvent.keyboard('{Enter}');
      }

      const menu = await waitForPortal('menu');
      await expect(arquivo.getAttribute('aria-expanded')).toBe('true');
      await expect(args['onUpdate:modelValue']).toHaveBeenCalled();

      const items = within(menu).getAllByRole('menuitem');
      await expect(items).toHaveLength(MENUS[0].items.length);
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0]);
      });
    });

    await step('O painel abre do lado que `side` pede', async () => {
      // `side` era ensinado pelo snippet de extensibilidade e não era exercitado
      // por nenhuma story — a prop existe (o conteúdo a encaminha ao
      // posicionador), mas nada provava que ela chega. É o achado
      // `snippet_sem_lastro`: quem copiasse o snippet não teria como saber se o
      // que ele ensina vale. O posicionador reescreve `data-side` quando não há
      // espaço para o lado pedido, então a asserção é contra o ARGUMENTO.
      const menu = await waitForPortal('menu');
      await expect(menu.closest('[data-side]')?.getAttribute('data-side')).toBe(args.side);
    });

    await step('Dentro do menu, a seta vertical anda entre os itens', async () => {
      const menu = await waitForPortal('menu');
      const items = within(menu).getAllByRole('menuitem');

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[1]);
      });

      await userEvent.keyboard('{ArrowUp}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0]);
      });
    });

    await step('Digitar uma letra leva ao item que começa por ela', async () => {
      // `s` é inequívoco nesta lista (Novo, Abrir, Salvar) — busca por letra com
      // dois candidatos mediria a política de desempate, que é outro assunto.
      const menu = await waitForPortal('menu');
      const items = within(menu).getAllByRole('menuitem');
      const saveItem = items.find((i) => (i.textContent ?? '').trim().startsWith('Salvar'))!;
      await expect(saveItem).toBeDefined();

      await userEvent.keyboard('s');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(saveItem);
      });
    });

    // SPACE NÃO LEVA O FOCO PARA DENTRO NESTA STACK, e por isso
    // `functional.item12` não é declarado aqui — a divergência fica visível para o
    // auditor de contrato em vez de virar cobertura de mentira.
    //
    // Medido em 2026-09-03: com Enter o foco entra no painel e pousa no
    // primeiro item (o passo acima prova); com Space o painel ABRE — o
    // `aria-expanded` vira "true" — e o foco fica no gatilho, ainda depois de
    // espera de relógio. As outras quatro stacks levam o foco para dentro nas
    // duas teclas.
    //
    // Era isto que o item de contrato antigo escondia: ele dizia "Enter/Space"
    // numa chave só, e verificar o Enter bastava para marcá-lo coberto.
    await step('Home e End saltam para as pontas da lista', async () => {
      const menu = await waitForPortal('menu');
      const items = within(menu).getAllByRole('menuitem');

      await userEvent.keyboard('{End}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[items.length - 1]);
      });

      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0]);
      });
    });

    await step('Com um menu aberto, a seta horizontal já abre o vizinho', async () => {
      // É o que separa um menubar de quatro botões vizinhos: a seta não só move
      // o foco, ela troca o menu aberto — o gesto de aplicação desktop.
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(editar.getAttribute('aria-expanded')).toBe('true');
      });
      await expect(arquivo.getAttribute('aria-expanded')).toBe('false');

      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(async () => {
        await expect(arquivo.getAttribute('aria-expanded')).toBe('true');
      });
      await expect(editar.getAttribute('aria-expanded')).toBe('false');
    });

    await step('Escape fecha o menu e devolve o foco ao gatilho', async () => {
      // Precondição própria: reabre pelo gatilho de Arquivo em vez de herdar
      // o que o passo das setas deixou. Qual gatilho fica com o realce depois
      // de uma troca de menu é decisão de cada lib — herdar isso faria este
      // passo medir a lib, e não a devolução do foco que o contrato promete.
      if (arquivo.getAttribute('aria-expanded') !== 'true') {
        await userEvent.click(arquivo);
        await waitForPortal('menu');
      }
      arquivo.focus();
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('menu');
      await expect(arquivo.getAttribute('aria-expanded')).toBe('false');
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(arquivo);
      });
    });

    await step('Clicar no gatilho de um menu aberto fecha o menu', async () => {
      if (arquivo.getAttribute('aria-expanded') !== 'true') {
        await userEvent.click(arquivo);
      }
      await waitForPortal('menu');

      await userEvent.click(arquivo);
      await waitForPortalGone('menu');
      await expect(arquivo.getAttribute('aria-expanded')).toBe('false');
    });
  },
};
