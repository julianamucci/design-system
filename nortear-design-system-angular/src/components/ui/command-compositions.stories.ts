import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, screen } from 'storybook/test';
import { NDS_COMMAND, type CommandSelectDetails } from './command';
import { NDS_POPOVER } from './popover';
import { NDS_DIALOG } from './dialog';
import { NdsButton } from './button';
import { waitForPortal, waitForPortalVanish, REGRA_GUARDA_DE_FOCO } from '@/lib/wait-for-portal';

// ─── Combobox ─────────────────────────────────────────────────────────────────

/**
 * Command dentro de um Popover — o substituto do Select quando a lista é longa
 * o bastante para precisar de busca.
 *
 * Componente de verdade (e não `props` num template solto) porque o padrão tem
 * estado: o gatilho mostra o que foi escolhido e o popover fecha na escolha.
 * Não é exportado — só a story o renderiza.
 */
@Component({
  selector: 'demo-command-combobox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [...NDS_COMMAND, ...NDS_POPOVER],
  template: `
    <div ndsPopover [open]="aberto()" (openChange)="aberto.set($event)">
      <!--
        O papel de combobox é escrito à mão: o gatilho do Popover é um botão
        comum para o primitivo, e sem ele o leitor de tela anuncia "botão" — a
        pessoa não sabe que ali dentro há uma lista para escolher. Os atributos
        aria-expanded, aria-controls e aria-haspopup o primitivo já mantém.

        Botão puro com as classes do design system, e não ndsButton: o
        NdsButton liga [attr.role] no host para devolver o papel de link a um
        <a href>, e esse binding APAGA o role escrito aqui (armadilha 11 — duas
        diretivas disputando o mesmo atributo). A aparência é idêntica; o que
        muda é quem manda no papel.
      -->
      <!--
        O papel combobox NÃO tira o nome do conteúdo, ao contrário de button:
        o texto visível deixa de nomear o gatilho no instante em que o papel
        muda, e o axe reprova por button-name. O aria-labelledby costura o
        rótulo invisível (a finalidade) com o valor escolhido (o texto que está
        na tela), que é o que WCAG 2.5.3 pede: o nome contém o rótulo visível.
      -->
      <span id="demo-combobox-rotulo" class="nds-sr-only">Componente</span>
      <button
        ndsPopoverTrigger
        type="button"
        class="nds-button nds-button-outline"
        role="combobox"
        aria-labelledby="demo-combobox-rotulo demo-combobox-valor"
      >
        <span id="demo-combobox-valor">{{ selecionado() || 'Selecione um item...' }}</span>
      </button>

      <ng-template ndsPopoverContent>
        <nds-command (itemSelect)="escolher($event)">
          <input ndsCommandInput placeholder="Buscar item..." />

          <div ndsCommandList>
            <div ndsCommandGroup>
              <div ndsCommandItem value="button">Button</div>
              <div ndsCommandItem value="input">Input</div>
              <div ndsCommandItem value="separator">Separator</div>
            </div>
          </div>

          <div ndsCommandEmpty>Nenhum resultado encontrado.</div>
        </nds-command>
      </ng-template>
    </div>
  `,
})
class DemoCommandCombobox {
  protected readonly aberto = signal(false);
  protected readonly selecionado = signal('');

  protected escolher(detalhe: CommandSelectDetails): void {
    this.selecionado.set(detalhe.label);
    // Fechar aqui é a guideline: sem isso o popover fica aberto por cima do
    // valor que a pessoa acabou de escolher.
    this.aberto.set(false);
  }
}

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
    '(window:keydown)': 'aoTeclar($event)',
  },
  template: `
    <div ndsDialog [open]="aberto()" (openChange)="aberto.set($event)">
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

    <p data-testid="executado">{{ ultimo() }}</p>
  `,
})
class DemoCommandPalette {
  protected readonly aberto = signal(false);
  protected readonly ultimo = signal('');

  protected aoTeclar(evento: KeyboardEvent): void {
    if (evento.key.toLowerCase() !== 'k' || !(evento.metaKey || evento.ctrlKey)) return;
    // Sem isto o navegador leva o Cmd+K para a barra de endereço.
    evento.preventDefault();
    this.aberto.set(true);
  }

  protected executar(detalhe: CommandSelectDetails): void {
    this.ultimo.set(detalhe.value);
    this.aberto.set(false);
  }
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Command/Compositions',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [DemoCommandCombobox, DemoCommandPalette] })],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    docs: {
      description: {
        component:
          'Os dois arranjos flutuantes. A paleta em si não flutua — quem flutua é o ' +
          'Popover (padrão combobox) e o Dialog (padrão command palette), e os dois já ' +
          'existem no sistema. Nenhuma peça nova entra aqui: é composição de call site.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Combobox ─────────────────────────────────────────────────────────────────

export const AsCombobox: Story = {
  parameters: { covers: ['functional.item7', 'accessibility.item5', 'visual.item3'] },
  render: () => ({ template: '<demo-command-combobox />' }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('combobox');

    // Par idempotente nos DOIS sentidos: a play REEXECUTA no mesmo DOM e esta
    // story termina com o popover aberto, então nem "abrir" nem "fechar" pode
    // ser clique cego — na segunda rodada ele inverteria o resultado.
    const abrir = async (): Promise<HTMLElement> => {
      if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
      return await waitForPortal('dialog');
    };
    const fechar = async (): Promise<void> => {
      if (gatilho.getAttribute('aria-expanded') === 'true') await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('dialog');
    };

    await step('Fechado, o gatilho anuncia que abre uma lista para escolher', async () => {
      await fechar();
      // É o que o conteúdo compartilhado cobra: o primitivo do Popover trata o
      // gatilho como botão comum, e sem estes dois atributos o leitor de tela
      // não diz que há uma escolha do outro lado.
      await expect(gatilho).toHaveAttribute('role', 'combobox');
      await expect(gatilho).toHaveAttribute('aria-haspopup', 'dialog');
      // O estado fechado é metade do item visual — e o `aria-expanded` tem de
      // dizer "false", não apenas existir.
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Abrir revela a paleta dentro do popover', async () => {
      const painel = await abrir();
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');

      const dentro = within(painel);
      await expect(dentro.getByRole('listbox')).toBeVisible();
      const busca = painel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      // O foco entra no campo de busca: um combobox que abre e deixa o foco no
      // gatilho obriga a pessoa a caçar o campo com Tab.
      await waitFor(async () => {
        await expect(busca).toHaveFocus();
      });
    });

    await step('Escolher fecha o popover e leva o valor para o gatilho', async () => {
      const painel = await abrir();
      await userEvent.click(within(painel).getByRole('option', { name: 'Input' }));

      await waitForPortalVanish('dialog');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      await expect(gatilho).toHaveTextContent('Input');
    });

    await step('E a story termina ABERTA — é o quadro que o Chromatic tira', async () => {
      // O item visual pede o gatilho "fechado e aberto". Terminar depois da
      // escolha fotografava só o fechado, e o quadro aberto — a paleta dentro
      // do popover, que é o que este padrão tem de próprio — nunca era
      // capturado. O gatilho segue visível no quadro, já com o valor escolhido.
      const painel = await abrir();
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
      await expect(gatilho).toHaveTextContent('Input');
      await expect(within(painel).getByRole('listbox')).toBeVisible();
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
      'visual.item4',
    ],
  },
  render: () => ({ template: '<demo-command-palette />' }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Buscar/ });

    const abrirPorBotao = async (): Promise<HTMLElement> => {
      if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
      return await waitForPortal('dialog');
    };

    await step('A dica do atalho fica visível no gatilho', async () => {
      // Atalho escondido é atalho que ninguém descobre — é a metade "do" do
      // par de Do & Don't deste componente.
      const dica = gatilho.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(dica).toHaveTextContent('⌘K');
      await expect(dica).toBeVisible();
    });

    await step('O diálogo é nomeado por um título que só o leitor de tela vê', async () => {
      const painel = await abrirPorBotao();
      const idTitulo = painel.getAttribute('aria-labelledby');
      await expect(idTitulo).toBeTruthy();

      const titulo = document.getElementById(idTitulo!)!;
      await expect(titulo).toHaveTextContent('Command Palette');
      await expect(titulo).toHaveClass(/nds-sr-only/);
      // Fora da tela, mas dentro da árvore de acessibilidade: `display: none`
      // apagaria o nome do diálogo.
      await expect(titulo.getBoundingClientRect().width).toBeLessThan(4);
    });

    await step('O foco vai direto para a busca', async () => {
      const painel = await abrirPorBotao();
      const busca = painel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(busca).toHaveFocus();
      });
      await expect(within(painel).getAllByRole('option')).toHaveLength(3);
    });

    await step('Escape fecha o diálogo e devolve o foco ao gatilho', async () => {
      await abrirPorBotao();
      await userEvent.keyboard('{Escape}');

      await waitForPortalVanish('dialog');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      await waitFor(async () => {
        await expect(gatilho).toHaveFocus();
      });
    });

    await step('Cmd+K abre a paleta de qualquer lugar da página', async () => {
      await userEvent.keyboard('{Meta>}k{/Meta}');

      const painel = await waitForPortal('dialog');
      const busca = painel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(busca).toHaveFocus();
      });
      // Os atalhos de cada comando aparecem à direita, encostados na borda.
      const atalho = painel.querySelector<HTMLElement>(
        '[data-value="button"] [data-slot="command-shortcut"]',
      )!;
      await expect(atalho).toHaveTextContent('⌘B');
      const caixaItem = atalho.closest<HTMLElement>('[data-slot="command-item"]')!
        .getBoundingClientRect();
      const caixaAtalho = atalho.getBoundingClientRect();
      await expect(caixaItem.right - caixaAtalho.right).toBeLessThan(
        caixaAtalho.left - caixaItem.left,
      );
    });

    await step('Escolher um comando executa e fecha', async () => {
      const painel = await waitForPortal('dialog');
      await userEvent.click(within(painel).getByRole('option', { name: 'Input ⌘I' }));

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
