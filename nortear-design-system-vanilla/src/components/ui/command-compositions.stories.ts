import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { createCommand, type CommandEntry, type CommandItem } from './command';
import {
  commandEmDialogSource,
  commandEmPopoverSource,
  commandSource,
  commandSourceWith,
} from './command.source';
import { createPopover } from './popover';
import { createDialog } from './dialog';
import { createButton } from './button';
import { abrir as abrirDialog, waitForClosed, painel } from './dialog.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/Command/Compositions',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: commandSource },
      description: {
        component:
          'As composições da paleta: com grupos, com atalhos, com itens desabilitados, ' +
          'lista longa e os dois arranjos flutuantes. A paleta em si não flutua — quem ' +
          'flutua é o Popover (padrão combobox) e o Dialog (padrão command palette), e os ' +
          'dois já existem no sistema.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WRAPPER = 'nds-w-sm nds-border-default nds-rounded-md nds-shadow-md';

const NO_RESULT = 'Nenhum resultado encontrado.';

/** O item pelo `value`, e não pelo nome acessível: atalho e marca entram no nome. */
const comando = (raiz: ParentNode, value: string): HTMLElement =>
  raiz.querySelector<HTMLElement>(`[data-slot="command-item"][data-value="${value}"]`)!;

const separadores = (raiz: ParentNode): NodeListOf<HTMLElement> =>
  raiz.querySelectorAll<HTMLElement>('[data-slot="command-separator"]');

const searchOf = (raiz: ParentNode): HTMLInputElement =>
  raiz.querySelector<HTMLInputElement>('[data-slot="command-input"]')!;

/**
 * Deixa a busca vazia E o destaque zerado.
 *
 * O item em destaque só volta a "nenhum" num re-render do filtro, e
 * `userEvent.clear` num campo JÁ vazio não dispara `input`. No REPLAY (a play
 * reexecuta no mesmo DOM) o destaque da rodada anterior sobreviveria, e a
 * primeira seta partiria do meio da lista.
 */
async function zerarSearch(campo: HTMLElement): Promise<void> {
  await userEvent.type(campo, 'zzz');
  await userEvent.clear(campo);
}

function mountInline(items: CommandEntry[], placeholder: string, onSelect?: (v: string) => void) {
  const wrap = document.createElement('div');
  wrap.className = WRAPPER;
  wrap.appendChild(
    createCommand({ placeholder, emptyMessage: NO_RESULT, items, onSelect })
  );
  return wrap;
}

// ─── Com grupos ───────────────────────────────────────────────────────────────

const ITEMS_AGRUPADOS: CommandItem[] = [
  { value: 'button',    label: 'Button',    group: 'Componentes' },
  { value: 'input',     label: 'Input',     group: 'Componentes' },
  { value: 'badge',     label: 'Badge',     group: 'Componentes' },
  { value: 'separator', label: 'Separator', group: 'Componentes' },
  { value: 'cn',        label: 'cn()',      group: 'Utilitários' },
  { value: 'clsx',      label: 'clsx()',    group: 'Utilitários' },
  { value: 'twmerge',   label: 'twMerge()', group: 'Utilitários' },
];

export const WithGroups: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => mountInline(ITEMS_AGRUPADOS, 'Buscar componente...'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const campo = canvas.getByRole('combobox');

    await userEvent.clear(campo);
    await expect(canvas.getAllByRole('option')).toHaveLength(7);

    await step('Cada grupo é nomeado pelo próprio cabeçalho', async () => {
      const cabecalhos = canvasElement.querySelectorAll<HTMLElement>('.nds-command-group-heading');
      await expect(cabecalhos).toHaveLength(2);
      await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
      await expect(canvas.getByRole('group', { name: 'Utilitários' })).toBeVisible();
      // O cabeçalho NÃO é uma opção — o erro clássico deste componente é
      // deixá-lo entrar na lista e virar destino de navegação.
      await expect(cabecalhos[0].getAttribute('role')).toBeNull();
      const names = canvas.getAllByRole('option').map((o) => o.textContent);
      await expect(names).not.toContain('Componentes');
    });

    await step('Um divisor separa os dois grupos, fora da árvore', async () => {
      await expect(separadores(canvasElement)).toHaveLength(1);
      await expect(separadores(canvasElement)[0]).toHaveAttribute('aria-hidden', 'true');
      // Só `option` e `group` são filhos permitidos de um listbox.
      await expect(canvas.queryAllByRole('separator')).toHaveLength(0);
    });

    await step('Buscando "n" o filtro atravessa os dois grupos — sobram 3', async () => {
      await userEvent.clear(campo);
      await userEvent.type(campo, 'n');
      // Button e Input (Componentes) + cn() (Utilitários).
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
      await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
      await expect(canvas.getByRole('group', { name: 'Utilitários' })).toBeVisible();
      await expect(separadores(canvasElement)).toHaveLength(1);
    });

    await step('Buscando "badge" sobra 1 comando e nenhum divisor', async () => {
      await userEvent.clear(campo);
      await userEvent.type(campo, 'badge');
      await expect(canvas.getAllByRole('option')).toHaveLength(1);
      // Um grupo só na tela: divisor sem nada de um dos lados seria ruído.
      await expect(separadores(canvasElement)).toHaveLength(0);
      await expect(canvas.queryAllByRole('group')).toHaveLength(1);
    });

    await step('A story termina no estado padrão, com os 7 comandos', async () => {
      await userEvent.clear(campo);
      await expect(canvas.getAllByRole('option')).toHaveLength(7);
    });
  },
};

// ─── Com traço declarado ──────────────────────────────────────────────────────
//
// Até aqui o traço só aparecia entre GRUPOS, e uma lista plana não tinha como
// separar "o que se faz com o arquivo" de "o que encerra a sessão" sem inventar
// um nome de grupo para cada bloco. O traço agora é uma entrada da lista, na
// mesma forma discriminada que o Select desta stack já usava.

const ITEMS_WITH_TRACO: CommandEntry[] = [
  { value: 'novo', label: 'Novo arquivo' },
  { value: 'abrir', label: 'Abrir recente' },
  { type: 'separator' },
  { value: 'sair', label: 'Sair' },
];

export const WithSeparator: Story = {
  parameters: {
    docs: {
      // O traço declarado é uma ENTRADA da lista, e a lista canônica do meta
      // não o tem: sem override o snippet esconderia o assunto da story.
      source: {
        transform: commandSourceWith({
          placeholder: 'Buscar comando...',
          emptyMessage: NO_RESULT,
          items: [
            { value: 'novo', label: 'Novo arquivo' },
            { value: 'abrir', label: 'Abrir recente' },
            { type: 'separator' },
            { value: 'sair', label: 'Sair' },
          ],
        }),
      },
      description: {
        story:
          'Traço entre dois blocos de uma lista sem grupos. Ele é uma QUEBRA na sequência: ' +
          'some junto com os comandos quando o filtro esvazia um dos lados, porque não sobra ' +
          'fronteira para marcar.',
      },
    },
  },
  render: () => mountInline(ITEMS_WITH_TRACO, 'Buscar comando...'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const campo = canvas.getByRole('combobox');

    await userEvent.clear(campo);

    await step('O traço declarado divide a lista plana em dois blocos', async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
      await expect(separadores(canvasElement)).toHaveLength(1);
      // Dentro de um listbox a linha é decorativa: só `option` e `group` são
      // filhos permitidos.
      await expect(separadores(canvasElement)[0]).toHaveAttribute('aria-hidden', 'true');
      await expect(canvas.queryAllByRole('separator')).toHaveLength(0);
      // Nenhum cabeçalho: a divisão aqui não veio de grupo nomeado.
      await expect(canvasElement.querySelectorAll('.nds-command-group-heading')).toHaveLength(0);
    });

    await step('Filtrando até sobrar um lado só, o traço vai junto', async () => {
      await userEvent.type(campo, 'sair');
      await expect(canvas.getAllByRole('option')).toHaveLength(1);
      await expect(separadores(canvasElement)).toHaveLength(0);
    });

    await step('A story termina no estado padrão', async () => {
      await userEvent.clear(campo);
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
      await expect(separadores(canvasElement)).toHaveLength(1);
    });
  },
};

// ─── Com atalhos ──────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  parameters: {
    docs: {
      source: {
        transform: commandSourceWith({
          placeholder: 'Buscar comando...',
          emptyMessage: NO_RESULT,
          items: [
            { value: 'novo', label: 'Novo arquivo', group: 'Arquivo', shortcut: '⌘N' },
            { value: 'salvar', label: 'Salvar', group: 'Arquivo', shortcut: '⌘S' },
            { value: 'preferencias', label: 'Preferências', group: 'Aplicativo' },
          ],
        }),
      },
    },
  },
  render: () =>
    mountInline(
      [
        { value: 'novo',     label: 'Novo arquivo', group: 'Arquivo', shortcut: '⌘N' },
        { value: 'abrir',    label: 'Abrir',        group: 'Arquivo', shortcut: '⌘O' },
        { value: 'salvar',   label: 'Salvar',       group: 'Arquivo', shortcut: '⌘S' },
        { value: 'preferencias', label: 'Preferências', group: 'Aplicativo' },
      ],
      'Buscar comando...'
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const campo = canvas.getByRole('combobox');

    await userEvent.clear(campo);
    await expect(canvas.getAllByRole('option')).toHaveLength(4);

    await step('O atalho aparece à direita do comando', async () => {
      const salvar = comando(canvasElement, 'salvar');
      const atalho = salvar.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(atalho).toHaveTextContent('⌘S');
      await expect(atalho).toHaveClass(/nds-command-shortcut/);

      const boxItem = salvar.getBoundingClientRect();
      const boxShortcut = atalho.getBoundingClientRect();
      await expect(boxItem.right - boxShortcut.right).toBeLessThan(
        boxShortcut.left - boxItem.left,
      );
    });

    await step('O atalho faz parte do nome do comando', async () => {
      // Sem isso o leitor anunciaria "Salvar" e a pessoa nunca saberia que há
      // uma tecla — o atalho é informação, não decoração.
      const salvar = comando(canvasElement, 'salvar');
      const atalho = salvar.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(atalho.getAttribute('aria-hidden')).toBeNull();
      await expect(salvar).toHaveAccessibleName(/⌘S/);
    });

    await step('Comando sem atalho não ganha um espaço vazio', async () => {
      const preferencias = comando(canvasElement, 'preferencias');
      await expect(
        preferencias.querySelector('[data-slot="command-shortcut"]'),
      ).toBeNull();
    });

    await step('Buscando "sal" sobra 1 comando, com o atalho junto', async () => {
      await userEvent.clear(campo);
      await userEvent.type(campo, 'sal');
      await expect(canvas.getAllByRole('option')).toHaveLength(1);
      await expect(
        comando(canvasElement, 'salvar').querySelector('[data-slot="command-shortcut"]'),
      ).not.toBeNull();
      await userEvent.clear(campo);
      await expect(canvas.getAllByRole('option')).toHaveLength(4);
    });
  },
};

// ─── Com itens desabilitados ──────────────────────────────────────────────────

const onListSelect = fn();

export const WithDisabledItems: Story = {
  parameters: {
    docs: {
      source: {
        transform: commandSourceWith({
          placeholder: 'Buscar...',
          emptyMessage: NO_RESULT,
          items: [
            { value: 'button', label: 'Button', group: 'Componentes' },
            { value: 'input', label: 'Input', group: 'Componentes', disabled: true },
            { value: 'cn', label: 'cn()', group: 'Utilitários' },
          ],
        }),
      },
    },
  },
  render: () =>
    mountInline(
      [
        { value: 'button', label: 'Button',      group: 'Componentes' },
        { value: 'input',  label: 'Input',       group: 'Componentes', disabled: true },
        { value: 'badge',  label: 'Badge',       group: 'Componentes' },
        { value: 'select', label: 'Select',      group: 'Componentes', disabled: true },
        { value: 'cn',     label: 'cn()',        group: 'Utilitários' },
        { value: 'clsx',   label: 'clsx()',      group: 'Utilitários', disabled: true },
      ],
      'Buscar...',
      (value) => onListSelect(value),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const campo = canvas.getByRole('combobox');

    await userEvent.clear(campo);
    await expect(canvas.getAllByRole('option')).toHaveLength(6);

    await step('Os três desabilitados se declaram no markup', async () => {
      for (const value of ['input', 'select', 'clsx']) {
        await expect(comando(canvasElement, value)).toHaveAttribute('aria-disabled', 'true');
      }
      for (const value of ['button', 'badge', 'cn']) {
        await expect(comando(canvasElement, value)).not.toHaveAttribute('aria-disabled');
      }
    });

    await step('As setas percorrem só os 3 habilitados, em sequência', async () => {
      await zerarSearch(campo);
      campo.focus();
      const inHighlight = () =>
        document.getElementById(campo.getAttribute('aria-activedescendant')!);

      for (const esperado of ['Button', 'Badge', 'cn()']) {
        await userEvent.keyboard('{ArrowDown}');
        await expect(inHighlight()).toHaveTextContent(esperado);
      }
      // Fim da lista: a seta não empurra o destaque para fora nem cai num
      // comando desabilitado.
      await userEvent.keyboard('{ArrowDown}');
      await expect(inHighlight()).toHaveTextContent('cn()');
    });

    await step('Clicar num desabilitado não executa nada', async () => {
      const antes = onListSelect.mock.calls.length;
      await userEvent.click(comando(canvasElement, 'select'), { pointerEventsCheck: 0 });
      await expect(onListSelect.mock.calls.length).toBe(antes);
    });
  },
};

// ─── Lista longa ──────────────────────────────────────────────────────────────

const COMPONENTES_LONGOS = [
  'Accordion', 'Alert', 'AlertDialog', 'AspectRatio', 'Avatar',
  'Badge', 'Breadcrumb', 'Button', 'Calendar', 'Card',
  'Carousel', 'Chart', 'Checkbox', 'Collapsible', 'Command',
  'ContextMenu', 'DataTable', 'DatePicker', 'Dialog', 'Drawer',
  'DropdownMenu', 'Form', 'HoverCard', 'Input', 'InputOTP',
  'Label', 'Menubar', 'NavigationMenu', 'Pagination', 'Popover',
];

export const LongList: Story = {
  render: () =>
    mountInline(
      COMPONENTES_LONGOS.map((label) => ({
        value: label.toLowerCase(),
        label,
        group: 'Componentes',
      })),
      'Buscar componente...'
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const campo = canvas.getByRole('combobox');
    const lista = canvas.getByRole('listbox');

    await userEvent.clear(campo);
    await expect(canvas.getAllByRole('option')).toHaveLength(30);

    await step('A lista rola em vez de esticar a paleta', async () => {
      // 300px de teto na folha: sem ele a paleta cresceria para fora da tela e
      // o campo de busca sairia do alcance.
      await expect(lista.scrollHeight).toBeGreaterThan(lista.clientHeight);
      await expect(getComputedStyle(lista).overflowY).toBe('auto');
    });

    await step('Buscando "dialog" sobram 2 — Dialog e AlertDialog', async () => {
      await userEvent.clear(campo);
      await userEvent.type(campo, 'dialog');
      await expect(canvas.getAllByRole('option')).toHaveLength(2);
      await expect(comando(canvasElement, 'dialog')).toBeVisible();
      await expect(comando(canvasElement, 'alertdialog')).toBeVisible();
    });

    await step('A story termina com a lista inteira', async () => {
      await userEvent.clear(campo);
      await expect(canvas.getAllByRole('option')).toHaveLength(30);
    });
  },
};

// ─── Combobox (Command dentro de Popover) ─────────────────────────────────────

const ITEMS_COMBOBOX: CommandItem[] = [
  { value: 'button',    label: 'Button'    },
  { value: 'input',     label: 'Input'     },
  { value: 'separator', label: 'Separator' },
];

const LABEL_COMBOBOX = 'demo-combobox-rotulo';
const VALUE_COMBOBOX = 'demo-combobox-valor';

/**
 * Command dentro de um Popover — o substituto do Select quando a lista é longa
 * o bastante para precisar de busca.
 *
 * O papel de combobox é escrito no call site: para o Popover o gatilho é um
 * botão comum, e sem `role="combobox"` o leitor de tela anuncia "botão" — a
 * pessoa não sabe que ali dentro há uma lista para escolher. O nome sai de
 * `aria-labelledby` costurando o rótulo invisível (a finalidade) com o valor
 * escolhido (o texto que está na tela), que é o que a WCAG 2.5.3 pede: o nome
 * contém o rótulo visível. Papel de combobox NÃO tira nome do conteúdo, ao
 * contrário de `button`.
 */
export const AsCombobox: Story = {
  parameters: {
    covers: ['functional.item7', 'accessibility.item5', 'visual.item3'],
    // Forma própria de snippet: a sub-fábrica que faz a paleta flutuar É o
    // assunto, e a chamada sozinha a esconderia.
    docs: {
      source: {
        transform: commandEmPopoverSource({
          placeholder: 'Buscar item...',
          emptyMessage: NO_RESULT,
          items: ITEMS_COMBOBOX,
        }),
      },
    },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-stack';
    outer.dataset.spacing = 'xs';

    const rotulo = document.createElement('span');
    rotulo.id = LABEL_COMBOBOX;
    rotulo.className = 'nds-sr-only';
    rotulo.textContent = 'Componente';

    const valor = document.createElement('span');
    valor.id = VALUE_COMBOBOX;
    valor.textContent = 'Selecione um item...';

    const trigger = createButton({ variant: 'outline', class: 'nds-w-xs', children: valor });
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-labelledby', `${LABEL_COMBOBOX} ${VALUE_COMBOBOX}`);

    const cmd = createCommand({
      placeholder: 'Buscar item...',
      emptyMessage: NO_RESULT,
      items: ITEMS_COMBOBOX,
      onSelect: (value) => {
        valor.textContent = ITEMS_COMBOBOX.find((i) => i.value === value)?.label ?? value;
        // Fechar aqui é a guideline: sem isso o popover fica aberto por cima do
        // valor que a pessoa acabou de escolher. A factory de Popover alterna
        // pelo próprio gatilho — é o mesmo caminho do clique de quem usa.
        if (trigger.getAttribute('aria-expanded') === 'true') trigger.click();
      },
    });

    const popover = createPopover({
      trigger,
      content: cmd,
      side: 'bottom',
      align: 'start',
      onOpenChange: (aberto) => {
        // Um combobox que abre e deixa o foco no gatilho obriga a pessoa a
        // caçar o campo com Tab.
        if (aberto) searchOf(cmd).focus();
      },
    });

    outer.append(rotulo, popover);
    return outer;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('combobox');

    const popoverPanel = () =>
      document.querySelector<HTMLElement>('[data-slot="popover-content"]');

    // Idempotente: a play REEXECUTA no mesmo DOM, e um clique cego alternaria o
    // popover a partir do estado que a rodada anterior deixou.
    const abrir = async (): Promise<HTMLElement> => {
      if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
      await waitFor(() => {
        if (!popoverPanel()) throw new Error('popover ainda fechado');
      });
      return popoverPanel()!;
    };

    const fechar = async (): Promise<void> => {
      if (gatilho.getAttribute('aria-expanded') === 'true') await userEvent.click(gatilho);
      await waitFor(() => {
        if (popoverPanel()) throw new Error('popover ainda aberto');
      });
    };

    await step('O gatilho anuncia que abre uma lista para escolher', async () => {
      await fechar();
      await expect(gatilho).toHaveAttribute('role', 'combobox');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      await expect(gatilho).toHaveAttribute('aria-haspopup', 'dialog');
      // O nome contém o rótulo visível (WCAG 2.5.3).
      await expect(gatilho).toHaveAccessibleName(/Componente/);
    });

    await step('Abrir revela a paleta e o foco entra na busca', async () => {
      const panelPop = await abrir();
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
      // `aria-controls` só existe enquanto há painel — id órfão o axe reprova.
      await expect(document.getElementById(gatilho.getAttribute('aria-controls')!))
        .toBe(panelPop);

      const inside = within(panelPop);
      await expect(inside.getByRole('listbox')).toBeVisible();
      await expect(inside.getAllByRole('option')).toHaveLength(3);
      await expect(searchOf(panelPop)).toHaveFocus();
    });

    await step('A busca dentro do popover filtra — buscando "inp" sobra 1', async () => {
      const panelPop = await abrir();
      const search = searchOf(panelPop);
      await userEvent.clear(search);
      await userEvent.type(search, 'inp');
      await expect(within(panelPop).getAllByRole('option')).toHaveLength(1);
      await userEvent.clear(search);
      await expect(within(panelPop).getAllByRole('option')).toHaveLength(3);
    });

    await step('Escolher fecha o popover e leva o valor para o gatilho', async () => {
      const panelPop = await abrir();
      await userEvent.click(within(panelPop).getByRole('option', { name: 'Input' }));

      await waitFor(() => {
        if (popoverPanel()) throw new Error('popover ainda aberto');
      });
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      await expect(gatilho).toHaveTextContent('Input');
      await expect(gatilho).toHaveAccessibleName(/Input/);
    });
  },
};

// ─── Command Palette (Command dentro de Dialog) ───────────────────────────────

const ITEMS_PALETTE: CommandItem[] = [
  { value: 'button', label: 'Button', group: 'Componentes', shortcut: '⌘B' },
  { value: 'input',  label: 'Input',  group: 'Componentes', shortcut: '⌘I' },
  { value: 'cn',     label: 'cn()',   group: 'Utilitários'  },
];

const aoExecutarComando = fn();

/**
 * Command dentro de um Dialog, aberto por atalho global.
 *
 * O Cmd+K não é nativo de componente nenhum — é um listener de janela, e é o
 * consumidor que o registra. Aqui ele nasce com a story e MORRE com ela: um
 * listener de janela que sobrevive à troca de story vira flake em qualquer
 * teste que use a mesma tecla.
 */
export const CommandPalette: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item6', 'accessibility.item3', 'visual.item4'],
    // Forma própria de snippet: o Dialog e o atalho global são o assunto, e
    // nenhum dos dois aparece na chamada da paleta sozinha.
    docs: {
      source: {
        transform: commandEmDialogSource({
          placeholder: 'Buscar componente...',
          emptyMessage: NO_RESULT,
          items: ITEMS_PALETTE,
        }),
      },
    },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-stack';
    outer.dataset.spacing = 'xs';

    const trigger = createButton({ variant: 'outline', label: 'Buscar' });
    const dica = document.createElement('kbd');
    dica.className = 'nds-kbd';
    dica.textContent = '⌘K';
    trigger.appendChild(dica);

    const cmd = createCommand({
      placeholder: 'Buscar componente...',
      emptyMessage: NO_RESULT,
      items: ITEMS_PALETTE,
      onSelect: (value) => {
        aoExecutarComando(value);
        closePalette();
      },
    });

    let aberto = false;

    const dialog = createDialog({
      trigger,
      // Título e descrição existem para o leitor de tela: o diálogo precisa de
      // nome, e "Command Palette" desenhado em cima da busca seria redundante
      // para quem enxerga.
      title: 'Command Palette',
      description: 'Busque por um comando ou ação...',
      headerHidden: true,
      showCloseButton: false,
      class: 'nds-command-dialog-content',
      content: cmd,
      onOpenChange: (estado) => {
        aberto = estado;
      },
    });

    // Fechar de fora é o mesmo caminho que a Playground do Dialog usa: a
    // factory não expõe `close()`, e o overlay é o controle de dispensa que já
    // existe no markup.
    function closePalette(): void {
      if (aberto) document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')?.click();
    }

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key.toLowerCase() !== 'k' || !(e.metaKey || e.ctrlKey)) return;
      // Sem isto o navegador leva o Cmd+K para a barra de endereço.
      e.preventDefault();
      if (!aberto) trigger.click();
    };
    window.addEventListener('keydown', onKeyDown);

    // O listener sai junto com a story: o Storybook não remonta nada ao trocar
    // de exemplo, e um atalho global órfão dispararia na story seguinte.
    const observador = new MutationObserver(() => {
      if (!outer.isConnected) {
        window.removeEventListener('keydown', onKeyDown);
        observador.disconnect();
      }
    });
    observador.observe(document.body, { childList: true, subtree: true });

    outer.appendChild(dialog);
    return outer;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Buscar/ });

    await step('A dica do atalho fica visível no gatilho', async () => {
      // Atalho escondido é atalho que ninguém descobre — é a metade "do" do par
      // de Do & Don't deste componente.
      const dica = gatilho.querySelector<HTMLElement>('kbd')!;
      await expect(dica).toHaveClass(/nds-kbd/);
      await expect(dica).toHaveTextContent('⌘K');
      await expect(dica).toBeVisible();
    });

    await step('O diálogo é nomeado por um título que só o leitor de tela vê', async () => {
      const p = await abrirDialog(canvasElement);
      const idTitle = p.getAttribute('aria-labelledby');
      await expect(idTitle).toBeTruthy();

      const titulo = document.getElementById(idTitle!)!;
      await expect(titulo).toHaveTextContent('Command Palette');
      await expect(titulo.closest('[data-slot="dialog-header"]')).toHaveClass(/nds-sr-only/);
      // Fora da tela, mas dentro da árvore de acessibilidade: `display: none`
      // apagaria o nome do diálogo.
      await expect(titulo.getBoundingClientRect().width).toBeLessThan(4);
      await expect(p).toHaveAccessibleName('Command Palette');
    });

    await step('O foco vai direto para a busca, com os 3 comandos na lista', async () => {
      const p = await abrirDialog(canvasElement);
      await waitFor(async () => {
        await expect(searchOf(p)).toHaveFocus();
      });
      await expect(within(p).getAllByRole('option')).toHaveLength(3);
    });

    await step('Escape fecha o diálogo e devolve o foco ao gatilho', async () => {
      await abrirDialog(canvasElement);
      await userEvent.keyboard('{Escape}');
      await waitForClosed();
      // Sem `waitFor`: a factory devolve o foco de forma síncrona, e envolver a
      // asserção mascararia um bug de foco real.
      await expect(document.activeElement).toBe(gatilho);
    });

    await step('Cmd+K abre a paleta de qualquer lugar da página', async () => {
      await userEvent.keyboard('{Meta>}k{/Meta}');
      await waitFor(() => {
        if (!painel()) throw new Error('paleta ainda fechada');
      });
      const p = painel()!;
      await waitFor(async () => {
        await expect(searchOf(p)).toHaveFocus();
      });

      // Os atalhos de cada comando aparecem à direita, encostados na borda.
      const atalho = comando(p, 'button')
        .querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(atalho).toHaveTextContent('⌘B');
      const boxItem = comando(p, 'button').getBoundingClientRect();
      const boxShortcut = atalho.getBoundingClientRect();
      await expect(boxItem.right - boxShortcut.right).toBeLessThan(
        boxShortcut.left - boxItem.left,
      );
    });

    await step('Escolher um comando executa e fecha', async () => {
      const p = await abrirDialog(canvasElement);
      const antes = aoExecutarComando.mock.calls.length;
      await userEvent.click(within(p).getByRole('option', { name: /Input/ }));

      await waitForClosed();
      await expect(aoExecutarComando.mock.calls.length).toBe(antes + 1);
      await expect(aoExecutarComando.mock.calls[antes][0]).toBe('input');
    });

    await step('A story termina com a paleta ABERTA', async () => {
      // O Chromatic fotografa o estado final e o axe roda depois da play:
      // terminar fechada capturaria só o gatilho, e o conteúdo compartilhado
      // declara `visual.item4` sobre o diálogo ABERTO.
      await userEvent.keyboard('{Meta>}k{/Meta}');
      // A espera gateia na OPACIDADE, não só na existência do nó: o painel entra
      // no DOM com `data-state="open"` e opacidade 0, e a animação de entrada a
      // levanta um quadro depois. `toBeVisible()` só reprova em opacidade
      // exatamente 0 — que é justamente o instante logo após a montagem.
      await waitFor(() => {
        const el = painel();
        if (!el) throw new Error('paleta ainda fechada');
        if (Number.parseFloat(getComputedStyle(el).opacity) === 0) {
          throw new Error('paleta ainda em transição de entrada');
        }
      });
      const p = painel()!;
      await expect(p).toBeVisible();
      await expect(within(p).getAllByRole('option')).toHaveLength(3);
    });
  },
};
