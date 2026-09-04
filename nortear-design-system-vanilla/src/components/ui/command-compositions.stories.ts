import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { createCommand, type CommandEntry, type CommandItem } from './command';
import {
  commandEmDialogSource,
  commandSource,
  commandSourceWith,
} from './command.source';
import {
  NO_RESULT,
  comando,
  separadores,
  searchOf,
  zerarSearch,
  mountInline,
} from './command.fixtures';
import { createDialog } from './dialog';
import { createButton } from './button';
import { open as abrirDialog, waitForClosed, panel } from './dialog.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Command/Compositions',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: commandSource },
      description: {
        component:
          'As composições da paleta: com traço declarado, com atalhos, com itens ' +
          'desabilitados e a paleta dentro de um Dialog (padrão command palette). A ' +
          'paleta em si não flutua — quem flutua é o Dialog, que já existe no sistema. ' +
          'A lista dividida em grupos é VARIANTE (variants.items.withGroups) e mora em ' +
          'Variants; a lista longa é ESTADO (states.longList) e mora em States.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);

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
      await userEvent.type(field, 'sair');
      await expect(canvas.getAllByRole('option')).toHaveLength(1);
      await expect(separadores(canvasElement)).toHaveLength(0);
    });

    await step('A story termina no estado padrão', async () => {
      await userEvent.clear(field);
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
            { value: 'novo', label: 'Novo arquivo', group: 'Arquivo', shortcut: 'Ctrl+N' },
            { value: 'salvar', label: 'Salvar', group: 'Arquivo', shortcut: 'Ctrl+S' },
            { value: 'preferencias', label: 'Preferências', group: 'Aplicativo' },
          ],
        }),
      },
    },
  },
  render: () =>
    mountInline(
      [
        { value: 'novo',     label: 'Novo arquivo', group: 'Arquivo', shortcut: 'Ctrl+N' },
        { value: 'abrir',    label: 'Abrir',        group: 'Arquivo', shortcut: 'Ctrl+O' },
        { value: 'salvar',   label: 'Salvar',       group: 'Arquivo', shortcut: 'Ctrl+S' },
        { value: 'preferencias', label: 'Preferências', group: 'Aplicativo' },
      ],
      'Buscar comando...'
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await expect(canvas.getAllByRole('option')).toHaveLength(4);

    await step('O atalho aparece à direita do comando', async () => {
      const salvar = comando(canvasElement, 'salvar');
      const atalho = salvar.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(atalho).toHaveTextContent('Ctrl+S');
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
      await expect(salvar).toHaveAccessibleName(/Ctrl\+S/);
    });

    await step('Comando sem atalho não ganha um espaço vazio', async () => {
      const preferencias = comando(canvasElement, 'preferencias');
      await expect(
        preferencias.querySelector('[data-slot="command-shortcut"]'),
      ).toBeNull();
    });

    await step('Buscando "sal" sobra 1 comando, com o atalho junto', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'sal');
      await expect(canvas.getAllByRole('option')).toHaveLength(1);
      await expect(
        comando(canvasElement, 'salvar').querySelector('[data-slot="command-shortcut"]'),
      ).not.toBeNull();
      await userEvent.clear(field);
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
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
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
      await zerarSearch(field);
      field.focus();
      const inHighlight = () =>
        document.getElementById(field.getAttribute('aria-activedescendant')!);

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

// ─── Command Palette (Command dentro de Dialog) ───────────────────────────────

const ITEMS_PALETTE: CommandItem[] = [
  { value: 'button', label: 'Button', group: 'Componentes', shortcut: 'Ctrl+B' },
  { value: 'input',  label: 'Input',  group: 'Componentes', shortcut: 'Ctrl+I' },
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
    covers: ['functional.item3', 'functional.item6', 'accessibility.item3', 'visual.item3'],
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
    dica.textContent = 'Ctrl+K';
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

    let isOpen = false;

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
      onOpenChange: (state) => {
        isOpen = state;
      },
    });

    // Fechar de fora é o mesmo caminho que a Playground do Dialog usa: a
    // factory não expõe `close()`, e o overlay é o controle de dispensa que já
    // existe no markup.
    function closePalette(): void {
      if (isOpen) document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')?.click();
    }

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key.toLowerCase() !== 'k' || !(e.metaKey || e.ctrlKey)) return;
      // Sem isto o navegador leva o Cmd+K para a barra de endereço.
      e.preventDefault();
      if (!isOpen) trigger.click();
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
    const trigger = canvas.getByRole('button', { name: /Buscar/ });

    await step('A dica do atalho fica visível no gatilho', async () => {
      // Atalho escondido é atalho que ninguém descobre — é a metade "do" do par
      // de Do & Don't deste componente.
      const dica = trigger.querySelector<HTMLElement>('kbd')!;
      await expect(dica).toHaveClass(/nds-kbd/);
      await expect(dica).toHaveTextContent('Ctrl+K');
      await expect(dica).toBeVisible();
    });

    await step('O diálogo é nomeado por um título que só o leitor de tela vê', async () => {
      const p = await abrirDialog(canvasElement);
      const idTitle = p.getAttribute('aria-labelledby');
      await expect(idTitle).toBeTruthy();

      const title = document.getElementById(idTitle!)!;
      await expect(title).toHaveTextContent('Command Palette');
      await expect(title.closest('[data-slot="dialog-header"]')).toHaveClass(/nds-sr-only/);
      // Fora da tela, mas dentro da árvore de acessibilidade: `display: none`
      // apagaria o nome do diálogo.
      await expect(title.getBoundingClientRect().width).toBeLessThan(4);
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
      await expect(document.activeElement).toBe(trigger);
    });

    await step('Cmd+K abre a paleta de qualquer lugar da página', async () => {
      await userEvent.keyboard('{Meta>}k{/Meta}');
      await waitFor(() => {
        if (!panel()) throw new Error('paleta ainda fechada');
      });
      const p = panel()!;
      await waitFor(async () => {
        await expect(searchOf(p)).toHaveFocus();
      });

      // Os atalhos de cada comando aparecem à direita, encostados na borda.
      const atalho = comando(p, 'button')
        .querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(atalho).toHaveTextContent('Ctrl+B');
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
        const el = panel();
        if (!el) throw new Error('paleta ainda fechada');
        if (Number.parseFloat(getComputedStyle(el).opacity) === 0) {
          throw new Error('paleta ainda em transição de entrada');
        }
      });
      const p = panel()!;
      await expect(p).toBeVisible();
      await expect(within(p).getAllByRole('option')).toHaveLength(3);
    });
  },
};
