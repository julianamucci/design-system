import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, screen } from 'storybook/test';
import { NDS_COMMAND, type CommandSelectDetails } from './command';
import { NDS_DIALOG } from './dialog';
import { NdsButton } from './button';
import { waitForPortal, waitForPortalVanish, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

// ─── Command Palette ──────────────────────────────────────────────────────────

/**
 * Command dentro de um Dialog, aberto por atalho global.
 *
 * O Cmd+K não é nativo de componente nenhum — é um listener de janela, e é o
 * consumidor que o registra. Aqui ele vive no `host` deste componente, que é
 * exatamente o que a página de quem usa faria.
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
        Buscar <span ndsCommandShortcut>⌘K</span>
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

          <nds-command (itemSelect)="executar($event)">
            <input ndsCommandInput placeholder="Buscar componente..." />

            <div ndsCommandList>
              <div ndsCommandGroup heading="Componentes">
                <div ndsCommandItem value="button" textValue="Button">Button <span ndsCommandShortcut>⌘B</span></div>
                <div ndsCommandItem value="input" textValue="Input">Input <span ndsCommandShortcut>⌘I</span></div>
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

    <p data-testid="executado">{{ last() }}</p>
  `,
})
class DemoCommandPalette {
  protected readonly isOpen = signal(false);
  protected readonly last = signal('');

  protected onKeyDown(evento: KeyboardEvent): void {
    if (evento.key.toLowerCase() !== 'k' || !(evento.metaKey || evento.ctrlKey)) return;
    // Sem isto o navegador leva o Cmd+K para a barra de endereço.
    evento.preventDefault();
    this.isOpen.set(true);
  }

  protected executar(detalhe: CommandSelectDetails): void {
    this.last.set(detalhe.value);
    this.isOpen.set(false);
  }
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Primitives/Overlay/Command/Compositions',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [DemoCommandPalette] })],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      description: {
        component:
          'A paleta dentro de um Dialog (padrão command palette). A paleta em si não ' +
          'flutua — quem flutua é o Dialog, que já existe no sistema. Nenhuma peça nova ' +
          'entra aqui: é composição de call site.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

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
  },
  render: () => ({ template: '<demo-command-palette />' }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Buscar/ });

    const buttonOpen = async (): Promise<HTMLElement> => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('dialog');
    };

    await step('A dica do atalho fica visível no gatilho', async () => {
      // Atalho escondido é atalho que ninguém descobre — é a metade "do" do
      // par de Do & Don't deste componente.
      const dica = trigger.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(dica).toHaveTextContent('⌘K');
      await expect(dica).toBeVisible();
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
    });

    await step('O foco vai direto para a busca', async () => {
      const panel = await buttonOpen();
      const search = panel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      await expect(within(panel).getAllByRole('option')).toHaveLength(3);
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

    await step('Cmd+K abre a paleta de qualquer lugar da página', async () => {
      await userEvent.keyboard('{Meta>}k{/Meta}');

      const panel = await waitForPortal('dialog');
      const search = panel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      // Os atalhos de cada comando aparecem à direita, encostados na borda.
      const atalho = panel.querySelector<HTMLElement>(
        '[data-value="button"] [data-slot="command-shortcut"]',
      )!;
      await expect(atalho).toHaveTextContent('⌘B');
      const boxItem = atalho.closest<HTMLElement>('[data-slot="command-item"]')!
        .getBoundingClientRect();
      const boxShortcut = atalho.getBoundingClientRect();
      await expect(boxItem.right - boxShortcut.right).toBeLessThan(
        boxShortcut.left - boxItem.left,
      );
    });

    await step('Escolher um comando executa e fecha', async () => {
      const panel = await waitForPortal('dialog');
      await userEvent.click(within(panel).getByRole('option', { name: 'Input ⌘I' }));

      await waitForPortalVanish('dialog');
      await expect(canvas.getByTestId('executado')).toHaveTextContent('input');

      // A story termina com a paleta ABERTA: é o quadro que o Chromatic
      // captura, e é o estado que a documentação descreve.
      await userEvent.keyboard('{Meta>}k{/Meta}');
      const reaberto = await waitForPortal('dialog');
      await waitFor(async () => {
        await expect(
          reaberto.querySelector<HTMLElement>('[data-slot="command-input"]'),
        ).toHaveFocus();
      });
      await expect(screen.getByRole('dialog')).toBeVisible();
    });
  },
};
