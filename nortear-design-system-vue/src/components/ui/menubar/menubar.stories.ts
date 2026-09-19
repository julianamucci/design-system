import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, fn, waitFor } from 'storybook/test';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import MenubarDocs from '@/components/docs/MenubarDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { expectOndeDiz, waitForAncorado } from '@shared/testing/ancoragem';
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
  'onUpdate:modelValue': (value: string, reason?: 'escape' | 'overlay' | 'api') => void;
};

const meta = {
  title: 'Components/Navigation/Menubar',
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

/**
 * Espião dos itens do Playground: é ele que prova que o clique fora fecha SEM
 * executar item nenhum (F14). Fica fora dos `args` porque não é controle — é
 * instrumento da play.
 */
const itemSelected = fn();

/**
 * Um clique fora da barra e de qualquer painel: `pointerdown`, `mousedown` e
 * `click` no `<body>` — é o `pointerdown` no documento que a camada dispensável
 * da lib escuta. Não exportado: toda exportação de um `*.stories.ts` vira story.
 */
function clickOutside(): void {
  for (const type of ['pointerdown', 'mousedown', 'click'] as const) {
    document.body.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }));
  }
}

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
      'functional.item12',
      'functional.item14',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item6',
    ],
  },
  render: (args) => ({
    components: { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarShortcut, MenubarTrigger },
    setup() {
      return { args, menus: MENUS, itemSelected };
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
              <MenubarItem v-for="i in m.items" :key="i.label" @select="itemSelected">
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
    const [file, editar] = triggers;

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

      await expect(document.activeElement).toBe(file);
      await expect(triggers.filter((g) => g.tabIndex === 0)).toHaveLength(1);
    });

    await step('Enter no gatilho abre o menu com foco no primeiro item', async () => {
      // Idempotente: só digita com o menu fechado, então o replay parte do
      // mesmo estado da primeira rodada.
      if (file.getAttribute('aria-expanded') !== 'true') {
        file.focus();
        await userEvent.keyboard('{Enter}');
      }

      const menu = await waitForPortal('menu');
      await expect(file.getAttribute('aria-expanded')).toBe('true');
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

    await step('E o painel está ANCORADO no lado que publicou', async () => {
      // O passo acima mede a AFIRMAÇÃO da lib (`data-side`), e ela continua certa
      // mesmo com o painel fora do fluxo pela folha: o invólucro que a lib
      // posiciona colapsa para 0×0 e ela calcula tudo contra uma caixa sem
      // tamanho — publicando o lado certo e pousando o painel do lado errado.
      // A folga cobrada é 8, que é o `sideOffset` que `MenubarContent` declara.
      // Ver `ancoragem.ts`.
      const panel = document.querySelector<HTMLElement>('.nds-dropdown-menu-content')!;
      await waitForAncorado(panel);
      expectOndeDiz(file, panel, 8);
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

    await step('Space também abre o gatilho, e não só Enter', async () => {
      // Fecha ANTES de digitar: o passo estabelece a própria precondição, senão
      // o replay do painel Interactions parte do menu já aberto.
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(file.getAttribute('aria-expanded')).toBe('false');
      });

      file.focus();
      await userEvent.keyboard(' ');
      await waitFor(async () => {
        await expect(file.getAttribute('aria-expanded')).toBe('true');
      });

      // A REABERTURA por teclado também tem de levar o foco para dentro.
      const openedBySpace = await waitForPortal('menu');
      await waitFor(async () => {
        await expect(openedBySpace.contains(document.activeElement)).toBe(true);
      });
    });

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
      await expect(file.getAttribute('aria-expanded')).toBe('false');

      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(async () => {
        await expect(file.getAttribute('aria-expanded')).toBe('true');
      });
      await expect(editar.getAttribute('aria-expanded')).toBe('false');
    });

    await step('Escape fecha o menu e devolve o foco ao gatilho', async () => {
      // Precondição própria: reabre pelo gatilho de Arquivo em vez de herdar
      // o que o passo das setas deixou. Qual gatilho fica com o realce depois
      // de uma troca de menu é decisão de cada lib — herdar isso faria este
      // passo medir a lib, e não a devolução do foco que o contrato promete.
      if (file.getAttribute('aria-expanded') !== 'true') {
        await userEvent.click(file);
        await waitForPortal('menu');
      }
      file.focus();
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('menu');
      await expect(file.getAttribute('aria-expanded')).toBe('false');
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(file);
      });
      // O motivo viaja com o valor novo: a barra fechou pelo Escape.
      await expect(args['onUpdate:modelValue']).toHaveBeenLastCalledWith('', 'escape');
    });

    await step('Clicar no gatilho de um menu aberto fecha o menu', async () => {
      if (file.getAttribute('aria-expanded') !== 'true') {
        await userEvent.click(file);
      }
      await waitForPortal('menu');

      await userEvent.click(file);
      await waitForPortalGone('menu');
      await expect(file.getAttribute('aria-expanded')).toBe('false');
    });

    await step('Clicar fora da barra fecha o menu sem executar item nenhum', async () => {
      // F14: o clique fora é "saí sem decidir" — o menu some e nenhuma ação
      // roda. O espião zera aqui para medir só este gesto.
      itemSelected.mockClear();
      if (file.getAttribute('aria-expanded') !== 'true') await userEvent.click(file);
      await waitForPortal('menu');

      clickOutside();
      await waitForPortalGone('menu');
      await expect(file.getAttribute('aria-expanded')).toBe('false');
      await expect(itemSelected).not.toHaveBeenCalled();
      // E o motivo diz que foi fora: `overlay`, a mesma palavra do Tab.
      await expect(args['onUpdate:modelValue']).toHaveBeenLastCalledWith('', 'overlay');
    });
  },
};

/**
 * Um `Tab` de teclado, DESPACHADO À MÃO no elemento em foco.
 *
 * `userEvent.keyboard('{Tab}')` e `userEvent.tab()` MOVEM O FOCO primeiro e só
 * então anunciam a tecla — medido no popover do svelte, e registrado no menu de
 * contexto de lá. Aqui isso mediria outra coisa: quem decide o Tab é o `keydown`
 * do PAINEL, e com o foco já fora dele a tecla nunca chega. Despachar reproduz a
 * ordem do teclado real — `keydown` no item em foco primeiro.
 */
function pressTab(shift = false): void {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true }),
  );
}

/** Espião do `update:modelValue` da `TabLeavesMenubar` — prova o motivo do fechamento. */
const tabValueChange = fn();

export const TabLeavesMenubar: Story = {
  parameters: { covers: ['functional.item13'], controls: { disable: true } },
  render: () => ({
    components: {
      Menubar,
      MenubarContent,
      MenubarItem,
      MenubarMenu,
      MenubarSub,
      MenubarSubContent,
      MenubarSubTrigger,
      MenubarTrigger,
      Button,
    },
    setup() {
      return { menus: MENUS.slice(0, 2), tabValueChange };
    },
    // O primeiro menu ganha um submenu: é de dentro dele que partem os dois
    // últimos passos.
    template: `
      <div class="nds-cluster nds-min-h-80" data-spacing="md" style="contain: layout">
        <Button variant="ghost">Antes</Button>
        <Menubar @update:model-value="tabValueChange">
          <MenubarMenu v-for="m in menus" :key="m.value" :value="m.value">
            <MenubarTrigger>{{ m.label }}</MenubarTrigger>
            <MenubarContent>
              <MenubarItem v-for="i in m.items" :key="i.label">{{ i.label }}</MenubarItem>
              <MenubarSub v-if="m.value === 'file'">
                <MenubarSubTrigger>Exportar</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                  <MenubarItem>CSV</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <Button variant="ghost">Depois</Button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole('menubar');
    const [fileTrigger] = within(bar).getAllByRole('menuitem');
    const before = canvas.getByRole('button', { name: 'Antes' });
    const after = canvas.getByRole('button', { name: 'Depois' });
    const body = within(document.body);

    const openWithItemFocused = async () => {
      if (fileTrigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(fileTrigger);
      const menu = await waitForPortal('menu');
      within(menu).getAllByRole('menuitem')[0].focus();
      await expect(menu.contains(document.activeElement)).toBe(true);
    };

    // O submenu aberto pela seta, com o foco num item DELE.
    const openSubmenuWithItemFocused = async () => {
      await openWithItemFocused();
      const subTrigger = within(await waitForPortal('menu')).getByRole('menuitem', { name: 'Exportar' });
      subTrigger.focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(body.getAllByRole('menu')).toHaveLength(2);
      });
      const submenu = document.querySelector<HTMLElement>('[data-slot="menubar-sub-content"]')!;
      within(submenu).getAllByRole('menuitem')[0].focus();
      await expect(submenu.contains(document.activeElement)).toBe(true);
    };

    await step('Tab sai da barra inteira e fecha o menu aberto', async () => {
      await openWithItemFocused();
      pressTab();
      await waitForPortalGone('menu');
      await expect(fileTrigger.getAttribute('aria-expanded')).toBe('false');
      // O próximo ponto é o vizinho da BARRA — e não o `<body>`, que é onde o
      // foco caía partindo do painel em portal no fim do documento.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(after);
      });
      // Saiu sem decidir nada: `overlay`, a mesma palavra do clique fora.
      await expect(tabValueChange).toHaveBeenLastCalledWith('', 'overlay');
    });

    await step('Shift+Tab sai para o ponto ANTERIOR à barra', async () => {
      // Sem o ouvinte, Shift+Tab caía no botão DEPOIS da barra: a ordem de
      // tabulação partia do panel, que vive no fim do documento.
      await openWithItemFocused();
      pressTab(true);
      await waitForPortalGone('menu');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(before);
      });
    });

    await step('Tab dentro do submenu fecha o menu INTEIRO e sai da barra', async () => {
      // O painel do submenu vive em outro portal: a tecla apertada nele nunca
      // chega ao ouvinte do raiz. Fechar só o submenu deixaria o menu aberto
      // com o foco fora dele.
      await openSubmenuWithItemFocused();
      pressTab();
      await waitForPortalGone('menu');
      await expect(fileTrigger.getAttribute('aria-expanded')).toBe('false');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(after);
      });
      await expect(tabValueChange).toHaveBeenLastCalledWith('', 'overlay');
    });

    await step('Shift+Tab dentro do submenu também fecha tudo, e volta ao anterior', async () => {
      await openSubmenuWithItemFocused();
      pressTab(true);
      await waitForPortalGone('menu');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(before);
      });
    });

    await step('Tab com o foco no GATILHO do menu aberto também sai como `overlay`', async () => {
      // §7 #20 do PRD, medido em navegador em 2026-09-18: este era o único
      // ponto da família em que esta stack saía do contrato. Os passos acima
      // partem do PAINEL, e quem decide o Tab ali é o ouvinte de captura do
      // conteúdo; uma tecla apertada no gatilho nunca chega a um painel que
      // vive em portal. A barra fechava por focus-out sem anotação, e o motivo
      // caía no `api` que sobra — "o código fechou" para um gesto que é saída
      // sem decisão.
      //
      // A precondição é CONFERIDA e não suposta, como a medição da D18 fez: o
      // estado é alcançável pelo ponteiro (um clique abre e deixa o foco no
      // gatilho), e uma asserção escrita para um estado inalcançável não pode
      // reprovar.
      if (fileTrigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(fileTrigger);
      await waitForPortal('menu');
      fileTrigger.focus();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(fileTrigger);
      });
      await expect(fileTrigger.getAttribute('aria-expanded')).toBe('true');

      pressTab();
      await waitForPortalGone('menu');
      await expect(fileTrigger.getAttribute('aria-expanded')).toBe('false');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(after);
      });
      await expect(tabValueChange).toHaveBeenLastCalledWith('', 'overlay');
    });
  },
};

/**
 * O gatilho do menu aberto como ÚLTIMA parada da página: não há vizinho para
 * onde levar o foco. O Tab tem de fechar do mesmo jeito, e o foco volta ao
 * gatilho pelo caminho da lib.
 */
export const TabAtPageEnd: Story = {
  parameters: { covers: ['functional.item13'], controls: { disable: true } },
  render: () => ({
    components: { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger, Button },
    setup() {
      return { menus: MENUS.slice(0, 2) };
    },
    template: `
      <div class="nds-cluster nds-min-h-80" data-spacing="md" style="contain: layout">
        <Button variant="ghost">Antes</Button>
        <Menubar>
          <MenubarMenu v-for="m in menus" :key="m.value" :value="m.value">
            <MenubarTrigger>{{ m.label }}</MenubarTrigger>
            <MenubarContent>
              <MenubarItem v-for="i in m.items" :key="i.label">{{ i.label }}</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const bar = within(canvasElement).getByRole('menubar');
    const [fileTrigger] = within(bar).getAllByRole('menuitem');

    await step('Sem próxima parada, Tab ainda fecha o menu e o foco volta ao gatilho', async () => {
      if (fileTrigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(fileTrigger);
      const menu = await waitForPortal('menu');
      within(menu).getAllByRole('menuitem')[0].focus();

      pressTab();
      await waitForPortalGone('menu');
      await expect(fileTrigger.getAttribute('aria-expanded')).toBe('false');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(fileTrigger);
      });
    });
  },
};
