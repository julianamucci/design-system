import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, screen } from 'storybook/test';
import { NDS_COMMAND, type CommandSelectDetails } from './command';
import { NDS_DIALOG } from './dialog';
import { NdsButton } from './button';
import {
  commandPaletteSource,
  commandWithDisabledItemsSource,
  commandWithSeparatorSource,
  commandWithShortcutsSource,
} from './command.source';
import {
  WRAPPER,
  NO_RESULT,
  commandItem,
  waitForHighlight,
  waitForOptions,
  visibleSeparators,
  resetSearch,
} from './command.fixtures';
import { waitForPortal, waitForPortalVanish, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

import { figmaDesign } from '@shared/figma/design-links';
// ─── Command Palette ──────────────────────────────────────────────────────────

/**
 * Command dentro de um Dialog, aberto por atalho global.
 *
 * O Ctrl+K não é nativo de componente nenhum — é um listener de janela, e é o
 * consumidor que o registra. Aqui ele vive no `host` deste componente, que é
 * exatamente o que a página de quem usa faria, e sai junto com ele.
 *
 * A dica do atalho fica DENTRO do gatilho, num `<kbd>`: o nome acessível do
 * botão sai do texto visível (WCAG 2.5.3), então não há `aria-label` por cima.
 */
@Component({
  selector: 'demo-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [...NDS_COMMAND, ...NDS_DIALOG, NdsButton],
  host: {
    '(window:keydown)': 'onKeyDown($event)',
  },
  template: `
    <div ndsDialog [open]="isOpen()" (openChange)="isOpen.set($event)">
      <button ndsDialogTrigger ndsButton variant="outline">
        Buscar <kbd class="nds-kbd">Ctrl+K</kbd>
      </button>

      <ng-template ndsDialogPortal>
        <div ndsDialogOverlay></div>

        <div ndsDialogContent class="nds-command-dialog-content" [showCloseButton]="false">
          <!--
            Título e descrição existem para o leitor de tela: o diálogo precisa
            de nome, e "Command Palette" desenhado em cima da busca seria
            redundante para quem enxerga.
          -->
          <h2 ndsDialogTitle class="nds-sr-only">Command Palette</h2>
          <p ndsDialogDescription class="nds-sr-only">Busque por um comando ou ação...</p>

          <nds-command (itemSelect)="run($event)">
            <input ndsCommandInput placeholder="Buscar componente..." />

            <div ndsCommandList>
              <div ndsCommandGroup heading="Componentes">
                <div ndsCommandItem value="button">Button <span ndsCommandShortcut>Ctrl+B</span></div>
                <div ndsCommandItem value="input">Input <span ndsCommandShortcut>Ctrl+I</span></div>
              </div>

              <div ndsCommandSeparator></div>

              <div ndsCommandGroup heading="Utilitários">
                <div ndsCommandItem value="cn">cn()</div>
              </div>
            </div>

            <div ndsCommandEmpty>Nenhum resultado encontrado.</div>
          </nds-command>
        </div>
      </ng-template>
    </div>

    <p data-testid="ran">{{ last() }}</p>
    <p data-testid="ran-label">{{ lastLabel() }}</p>
  `,
})
class DemoCommandPalette {
  protected readonly isOpen = signal(false);
  protected readonly last = signal('');
  protected readonly lastLabel = signal('');

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return;
    // Sem isto o navegador leva o Ctrl+K para a barra de endereço.
    event.preventDefault();
    this.isOpen.set(true);
  }

  protected run(details: CommandSelectDetails): void {
    this.last.set(details.value);
    this.lastLabel.set(details.label);
    this.isOpen.set(false);
  }
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Components/Overlay/Command/Compositions',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_COMMAND, DemoCommandPalette] })],
  parameters: {
    design: figmaDesign('command'),
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      description: {
        component:
          'As composições da paleta: com traço declarado, com atalhos, com itens ' +
          'desabilitados e a paleta dentro de um Dialog (padrão command palette). A ' +
          'paleta em si não flutua — quem flutua é o Dialog, que já existe no sistema. ' +
          'A lista dividida em grupos é VARIANTE e mora em Variants; a lista longa é ' +
          'ESTADO e mora em States.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Com traço declarado ──────────────────────────────────────────────────────

export const WithSeparator: Story = {
  parameters: {
    docs: {
      source: { transform: commandWithSeparatorSource },
      description: {
        story:
          'Traço entre dois blocos de uma lista sem cabeçalhos. Ele é uma QUEBRA na sequência: ' +
          'some junto com os comandos quando o filtro esvazia um dos lados, porque não sobra ' +
          'fronteira para marcar.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="${WRAPPER}">
        <nds-command>
          <input ndsCommandInput placeholder="Buscar comando..." />

          <div ndsCommandList>
            <div ndsCommandGroup>
              <div ndsCommandItem value="novo">Novo arquivo</div>
              <div ndsCommandItem value="abrir">Abrir recente</div>
            </div>

            <div ndsCommandSeparator></div>

            <div ndsCommandGroup>
              <div ndsCommandItem value="sair">Sair</div>
            </div>
          </div>

          <div ndsCommandEmpty>${NO_RESULT}</div>
        </nds-command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitForOptions(canvasElement, 3);

    await step('O traço declarado divide a lista em dois blocos', async () => {
      await waitFor(async () => {
        await expect(visibleSeparators(canvasElement)).toHaveLength(1);
      });
      // Dentro de um listbox a linha é decorativa: só `option` e `group` são
      // filhos permitidos.
      await expect(visibleSeparators(canvasElement)[0]).toHaveAttribute('aria-hidden', 'true');
      await expect(canvas.queryAllByRole('separator')).toHaveLength(0);
      // Nenhum cabeçalho: a divisão aqui não veio de grupo nomeado.
      await expect(canvasElement.querySelectorAll('.nds-command-group-heading')).toHaveLength(0);
      // E bloco sem cabeçalho não é grupo para o leitor de tela: o primitivo
      // escreve `role="group"` fixo, e um grupo sem nome só anunciaria
      // "grupo". Os dois blocos continuam lá, com a classe que dá o respiro.
      await expect(canvas.queryAllByRole('group')).toHaveLength(0);
      const blocks = canvasElement.querySelectorAll<HTMLElement>('.nds-command-group');
      await expect(blocks).toHaveLength(2);
      for (const block of blocks) await expect(block).not.toHaveAttribute('role');
    });

    await step('Filtrando até sobrar um lado só, o traço vai junto', async () => {
      await userEvent.type(field, 'sair');
      await waitForOptions(canvasElement, 1);
      await waitFor(async () => {
        await expect(visibleSeparators(canvasElement)).toHaveLength(0);
      });
    });

    await step('A story termina no estado padrão', async () => {
      await userEvent.clear(field);
      await waitForOptions(canvasElement, 3);
      await waitFor(async () => {
        await expect(visibleSeparators(canvasElement)).toHaveLength(1);
      });
    });
  },
};

// ─── Com atalhos ──────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  parameters: { docs: { source: { transform: commandWithShortcutsSource } } },
  render: () => ({
    template: `
      <div class="${WRAPPER}">
        <nds-command>
          <input ndsCommandInput placeholder="Buscar comando..." />

          <div ndsCommandList>
            <div ndsCommandGroup heading="Arquivo">
              <div ndsCommandItem value="novo">Novo arquivo <span ndsCommandShortcut>Ctrl+N</span></div>
              <div ndsCommandItem value="abrir">Abrir <span ndsCommandShortcut>Ctrl+O</span></div>
              <div ndsCommandItem value="salvar">Salvar <span ndsCommandShortcut>Ctrl+S</span></div>
            </div>

            <div ndsCommandSeparator></div>

            <div ndsCommandGroup heading="Aplicativo">
              <div ndsCommandItem value="preferencias">Preferências</div>
            </div>
          </div>

          <div ndsCommandEmpty>${NO_RESULT}</div>
        </nds-command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitForOptions(canvasElement, 4);

    await step('O atalho aparece à direita do comando', async () => {
      const save = commandItem(canvasElement, 'salvar');
      const shortcut = save.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(shortcut).toHaveTextContent('Ctrl+S');
      await expect(shortcut).toHaveClass(/nds-command-shortcut/);

      const boxItem = save.getBoundingClientRect();
      const boxShortcut = shortcut.getBoundingClientRect();
      await expect(boxItem.right - boxShortcut.right).toBeLessThan(
        boxShortcut.left - boxItem.left,
      );
    });

    await step('O atalho faz parte do nome do comando', async () => {
      // Sem isso o leitor anunciaria "Salvar" e a pessoa nunca saberia que há
      // uma tecla — o atalho é informação, não decoração.
      const save = commandItem(canvasElement, 'salvar');
      const shortcut = save.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(shortcut.getAttribute('aria-hidden')).toBeNull();
      await expect(save).toHaveAccessibleName(/Ctrl\+S/);
    });

    await step('Comando sem atalho não ganha um espaço vazio', async () => {
      const preferences = commandItem(canvasElement, 'preferencias');
      await expect(preferences.querySelector('[data-slot="command-shortcut"]')).toBeNull();
    });

    await step('Buscando "ctrl" nenhum comando casa — o atalho não entra no filtro', async () => {
      // O atalho está no nome acessível, mas NÃO no texto que o filtro compara:
      // se entrasse, buscar "ctrl" traria todo comando que tem tecla, e buscar
      // "s" traria "Novo arquivo" por causa do "Ctrl+N".
      await userEvent.clear(field);
      await userEvent.type(field, 'ctrl');
      await waitForOptions(canvasElement, 0);
    });

    await step('Buscando "sal" sobra 1 comando, com o atalho junto', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'sal');
      await waitForOptions(canvasElement, 1);
      await expect(
        commandItem(canvasElement, 'salvar').querySelector('[data-slot="command-shortcut"]'),
      ).not.toBeNull();
      await userEvent.clear(field);
      await waitForOptions(canvasElement, 4);
    });
  },
};

// ─── Com itens desabilitados ──────────────────────────────────────────────────

export const WithDisabledItems: Story = {
  parameters: { docs: { source: { transform: commandWithDisabledItemsSource } } },
  render: () => ({
    props: { last: '' },
    template: `
      <div class="${WRAPPER}">
        <nds-command (itemSelect)="last = $event.value">
          <input ndsCommandInput placeholder="Buscar..." />

          <div ndsCommandList>
            <div ndsCommandGroup heading="Componentes">
              <div ndsCommandItem value="button">Button</div>
              <div ndsCommandItem value="input" [disabled]="true">Input</div>
              <div ndsCommandItem value="badge">Badge</div>
              <div ndsCommandItem value="select" [disabled]="true">Select</div>
            </div>

            <div ndsCommandSeparator></div>

            <div ndsCommandGroup heading="Utilitários">
              <div ndsCommandItem value="cn">cn()</div>
              <div ndsCommandItem value="clsx" [disabled]="true">clsx()</div>
            </div>
          </div>

          <div ndsCommandEmpty>${NO_RESULT}</div>
        </nds-command>
      </div>

      <p data-testid="chosen">{{ last }}</p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    const chosen = canvas.getByTestId('chosen');

    await userEvent.clear(field);
    await waitForOptions(canvasElement, 6);

    await step('Os três desabilitados se declaram no markup', async () => {
      for (const value of ['input', 'select', 'clsx']) {
        await expect(commandItem(canvasElement, value)).toHaveAttribute('aria-disabled', 'true');
      }
      for (const value of ['button', 'badge', 'cn']) {
        await expect(commandItem(canvasElement, value)).not.toHaveAttribute('aria-disabled');
      }
    });

    await step('As setas percorrem só os 3 habilitados, e param no último', async () => {
      await resetSearch(canvasElement, field, 6);
      field.focus();

      // A travessia parte do primeiro, que já está em destaque (D11).
      await waitForHighlight(field, 'Button');
      for (const expected of ['Badge', 'cn()']) {
        await userEvent.keyboard('{ArrowDown}');
        await waitForHighlight(field, expected);
      }
      // Fim da lista: a seta não empurra o destaque para fora, nem cai num
      // comando desabilitado, nem volta ao primeiro. A prova é a seta de volta:
      // se tivesse laçado para "Button", subir não chegaria a "Badge".
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowUp}');
      await waitForHighlight(field, 'Badge');
    });

    await step('Clicar num desabilitado não executa nada', async () => {
      await userEvent.click(commandItem(canvasElement, 'select'), { pointerEventsCheck: 0 });
      await expect(chosen).toHaveTextContent('');
    });
  },
};

// ─── Command Palette ──────────────────────────────────────────────────────────

export const CommandPalette: Story = {
  parameters: {
    // `accessibility.item1` pede "sem violações axe no estado padrão (inline e
    // dialog)". O Playground cobre o inline; o dialog é aqui — a story termina
    // com a paleta aberta e o axe roda sobre ela. A única regra desligada no
    // `meta` é `aria-hidden-focus`, que reprova as âncoras de foco do próprio
    // primitivo (defeito de lib, documentado em `wait-for-portal.ts`); as
    // outras noventa e tantas valem, inclusive as do padrão de diálogo.
    covers: [
      'functional.item3',
      'functional.item6',
      'accessibility.item1',
      'accessibility.item3',
      'visual.item3',
    ],
    // Forma própria de snippet: o Dialog e o atalho global são o assunto, e
    // nenhum dos dois aparece na paleta sozinha.
    docs: { source: { transform: commandPaletteSource } },
  },
  render: () => ({ template: '<demo-command-palette />' }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Buscar/ });

    const buttonOpen = async (): Promise<HTMLElement> => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('dialog');
    };

    await step('A dica do atalho fica visível DENTRO do gatilho', async () => {
      // Atalho escondido é atalho que ninguém descobre — é a metade "do" do
      // par de Do & Don't deste componente. E é `<kbd>`, a tecla do sistema,
      // e não o atalho de item: aquele mora dentro de um comando.
      const hint = trigger.querySelector<HTMLElement>('kbd')!;
      await expect(hint).toHaveClass(/nds-kbd/);
      await expect(hint).toHaveTextContent('Ctrl+K');
      await expect(hint).toBeVisible();
      // O nome do botão sai do texto visível — nada de `aria-label` por cima.
      await expect(trigger.getAttribute('aria-label')).toBeNull();
      // É um gatilho que ABRE um diálogo, e diz isso: o leitor anuncia o que o
      // botão vai fazer e se o diálogo já está aberto.
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('aria-expanded');
    });

    await step('O diálogo é nomeado por um título que só o leitor de tela vê', async () => {
      const panel = await buttonOpen();
      const idTitle = panel.getAttribute('aria-labelledby');
      await expect(idTitle).toBeTruthy();

      const title = document.getElementById(idTitle!)!;
      await expect(title).toHaveTextContent('Command Palette');
      await expect(title).toHaveClass(/nds-sr-only/);
      // Fora da tela, mas dentro da árvore de acessibilidade: `display: none`
      // apagaria o nome do diálogo.
      await expect(title.getBoundingClientRect().width).toBeLessThan(4);
      await expect(panel).toHaveAccessibleName('Command Palette');
    });

    await step('O foco vai direto para a busca, com os 3 comandos e o primeiro em destaque', async () => {
      const panel = await buttonOpen();
      const search = panel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      await waitFor(async () => {
        await expect(within(panel).getAllByRole('option')).toHaveLength(3);
      });
      // Ao abrir, o primeiro comando já está em destaque (D11): quem abre a
      // paleta pelo atalho e aperta Enter executa sem tocar numa seta.
      await waitForHighlight(search, 'Button');
    });

    await step('Escape fecha o diálogo e devolve o foco ao gatilho', async () => {
      await buttonOpen();
      await userEvent.keyboard('{Escape}');

      await waitForPortalVanish('dialog');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await waitFor(async () => {
        await expect(trigger).toHaveFocus();
      });
    });

    await step('Ctrl+K abre a paleta de qualquer lugar da página', async () => {
      await userEvent.keyboard('{Control>}k{/Control}');

      const panel = await waitForPortal('dialog');
      const search = panel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      // Os atalhos de cada comando aparecem à direita, encostados na borda.
      const shortcut = commandItem(panel, 'button').querySelector<HTMLElement>(
        '[data-slot="command-shortcut"]',
      )!;
      await expect(shortcut).toHaveTextContent('Ctrl+B');
      const boxItem = commandItem(panel, 'button').getBoundingClientRect();
      const boxShortcut = shortcut.getBoundingClientRect();
      await expect(boxItem.right - boxShortcut.right).toBeLessThan(
        boxShortcut.left - boxItem.left,
      );
    });

    await step('Escolher um comando executa e fecha', async () => {
      const panel = await waitForPortal('dialog');
      await userEvent.click(within(panel).getByRole('option', { name: /Input/ }));

      await waitForPortalVanish('dialog');
      await expect(canvas.getByTestId('ran')).toHaveTextContent('input');
      // O rótulo que sai na escolha é o do comando, sem a tecla: o atalho é
      // desenho e nome acessível, não parte do texto que o filtro compara.
      await expect(canvas.getByTestId('ran-label').textContent?.trim()).toBe('Input');
    });

    await step('A story termina com a paleta ABERTA', async () => {
      // É o quadro que o Chromatic captura, e é o estado que a documentação
      // descreve: terminar fechada fotografaria só o gatilho.
      await userEvent.keyboard('{Control>}k{/Control}');
      const reopened = await waitForPortal('dialog');
      await waitFor(async () => {
        await expect(
          reopened.querySelector<HTMLElement>('[data-slot="command-input"]'),
        ).toHaveFocus();
      });
      await expect(screen.getByRole('dialog')).toBeVisible();
      await waitFor(async () => {
        await expect(within(reopened).getAllByRole('option')).toHaveLength(3);
      });
    });
  },
};
