import { Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_COMMAND } from './command';
import {
  commandCheckedItemSource,
  commandEmptyStateSource,
  commandItemDisabledSource,
  commandLongListSource,
} from './command.source';
import {
  WRAPPER,
  NO_RESULT,
  commandItem,
  waitForHighlight,
  waitForOptions,
  emptyRegion,
  resetSearch,
} from './command.fixtures';

import { figmaDesign } from '@shared/figma/design-links';

/**
 * Faz o campo NASCER com uma busca digitada.
 *
 * Escrever o `value` não basta: o primitivo só filtra o que a pessoa digitou
 * (um valor que chegou por binding é tratado como seleção já feita, e a lista
 * fica inteira). O evento `input` é o mesmo caminho de uma tecla, e é depois do
 * primeiro render porque antes dele o campo ainda não está ligado ao primitivo.
 *
 * Diretiva local, e não export do fixtures: é andaime de UMA story, e um
 * `EmptyState` que nasce vazio fotografaria a lista cheia no Chromatic se a
 * play não rodasse.
 */
@Directive({ selector: 'input[ndsInitialSearch]', standalone: true })
class NdsInitialSearch {
  readonly ndsInitialSearch = input('');

  constructor() {
    const field = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      const query = this.ndsInitialSearch();
      if (!query) return;
      field.value = query;
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
}

const meta: Meta = {
  title: 'Components/Overlay/Command/States',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_COMMAND, NdsInitialSearch] })],
  parameters: {
    design: figmaDesign('command'),
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Os estados que a paleta assume sozinha (sem resultados, lista longa) e os que ' +
          'cada comando assume (marcado, desabilitado).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Sem resultados ───────────────────────────────────────────────────────────

export const EmptyState: Story = {
  // `functional.item1` também é daqui: a metade "a frase de vazio aparece
  // quando nada sobra" é a que esta story fotografa.
  parameters: {
    covers: ['functional.item1', 'visual.item2'],
    docs: { source: { transform: commandEmptyStateSource } },
  },
  // A busca já nasce sem correspondência: é o estado que esta story documenta,
  // e o quadro que o Chromatic captura.
  render: () => ({
    template: `
      <div class="${WRAPPER}">
        <nds-command>
          <input ndsCommandInput placeholder="Buscar componente..." ndsInitialSearch="xyznotfound" />

          <div ndsCommandList>
            <div ndsCommandGroup>
              <div ndsCommandItem value="button">Button</div>
              <div ndsCommandItem value="input">Input</div>
              <div ndsCommandItem value="separator">Separator</div>
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
    const list = canvas.getByRole('listbox');
    const empty = emptyRegion(canvasElement);

    await step('Buscando "xyznotfound" não sobra nenhum comando', async () => {
      // Idempotente: a play REEXECUTA no mesmo DOM, e a busca parte do zero.
      await userEvent.clear(field);
      await userEvent.type(field, 'xyznotfound');
      await waitForOptions(canvasElement, 0);
    });

    await step('A frase é anunciada, não só desenhada', async () => {
      await waitFor(async () => {
        await expect(empty).toBeVisible();
      });
      await expect(empty).toHaveTextContent(NO_RESULT);
      await expect(empty).toHaveClass(/nds-command-empty/);
      await expect(empty).toHaveAttribute('data-empty', '');
      // Sem a região viva, quem usa leitor de tela digitaria no vazio sem nunca
      // saber que a busca não achou nada.
      await expect(empty).toHaveAttribute('role', 'status');
      await expect(empty).toHaveAttribute('aria-live', 'polite');
      await expect(empty).toHaveAttribute('aria-atomic', 'true');
      // `role="status"` dentro de `role="listbox"` é filho não permitido, e o
      // axe reprova por aria-required-children.
      await expect(list.contains(empty)).toBe(false);
      // Sem opção na tela não há destaque: o campo não aponta para nada.
      await expect(field).not.toHaveAttribute('aria-activedescendant');
    });

    await step('Apagar a busca traz os 3 comandos de volta, com o primeiro em destaque', async () => {
      await userEvent.clear(field);
      await waitForOptions(canvasElement, 3);
      await waitFor(async () => {
        await expect(empty).not.toHaveAttribute('data-empty');
      });
      // A busca nova põe o primeiro comando em destaque (D11) — Enter aqui já
      // executaria "Button".
      await waitForHighlight(field, 'Button');
      // Continua no DOM (é o que preserva o anúncio), mas sem a classe que
      // traz 24px de respiro em cima e embaixo.
      await expect(empty).not.toHaveClass(/nds-command-empty/);
      await expect(empty.getBoundingClientRect().height).toBe(0);
    });

    await step('A story termina SEM resultados', async () => {
      // O Chromatic fotografa o estado final: terminar com a lista cheia
      // capturaria outra story.
      await userEvent.type(field, 'xyznotfound');
      await waitForOptions(canvasElement, 0);
      await waitFor(async () => {
        await expect(empty).toHaveAttribute('data-empty', '');
      });
    });
  },
};

// ─── Comando desabilitado ─────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item4', 'visual.item4'],
    docs: { source: { transform: commandItemDisabledSource } },
  },
  render: () => ({
    props: { last: '' },
    template: `
      <div class="${WRAPPER}">
        <nds-command (itemSelect)="last = $event.value">
          <input ndsCommandInput placeholder="Buscar comando..." />

          <div ndsCommandList>
            <div ndsCommandGroup>
              <div ndsCommandItem value="novo">Novo</div>
              <div ndsCommandItem value="arquivar" [disabled]="true">Arquivar</div>
              <div ndsCommandItem value="renomear">Renomear</div>
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
    await waitForOptions(canvasElement, 3);
    const archive = commandItem(canvasElement, 'arquivar');

    await step('O estado chega ao markup e ao desenho', async () => {
      // Sob JIT o componente renderiza no default e `[disabled]="true"` nunca
      // chegaria (armadilha 1) — a asserção é o que impede isso de voltar.
      await expect(archive).toHaveAttribute('aria-disabled', 'true');
      await expect(archive).toHaveAttribute('data-disabled', '');
      // O que a pessoa percebe é o item apagado e não reagir ao ponteiro. Um
      // `cursor` declarado aqui nunca apareceria: com `pointer-events: none` o
      // ponteiro não pousa no item, e é por isso que a folha não o declara.
      const computedStyle = getComputedStyle(archive);
      await expect(computedStyle.pointerEvents).toBe('none');
      await expect(Number.parseFloat(computedStyle.opacity)).toBeLessThan(1);
    });

    await step('Clicar não executa o comando', async () => {
      // `pointerEventsCheck: 0` porque a folha bloqueia o ponteiro: sem isso o
      // user-event recusa o clique antes de o componente ter chance de errar.
      await userEvent.click(archive, { pointerEventsCheck: 0 });
      await expect(chosen).toHaveTextContent('');
    });

    await step('As setas pulam o comando desabilitado', async () => {
      await resetSearch(canvasElement, field, 3);
      field.focus();
      // O primeiro já está em destaque (D11); a travessia parte dele.
      await waitForHighlight(field, 'Novo');

      await userEvent.keyboard('{ArrowDown}');
      // "Arquivar" não é destino de navegação — quem usa teclado nunca para
      // num comando que não pode executar.
      await waitForHighlight(field, 'Renomear');
      await expect(archive).toHaveAttribute('aria-selected', 'false');
    });

    await step('Enter no comando habilitado seguinte executa normalmente', async () => {
      await userEvent.keyboard('{Enter}');
      await waitFor(async () => {
        await expect(chosen).toHaveTextContent('renomear');
      });
    });

    await step('Busca que começa num desabilitado destaca o primeiro HABILITADO', async () => {
      // "ar" deixa Arquivar (desabilitado) e Renomear, nessa ordem. O destaque
      // automático (D11) é do primeiro que o Enter consegue executar — nunca
      // de um comando que não roda.
      await userEvent.clear(field);
      await userEvent.type(field, 'ar');
      await waitForOptions(canvasElement, 2);
      await waitForHighlight(field, 'Renomear');
      await expect(archive).toHaveAttribute('aria-selected', 'false');

      await userEvent.clear(field);
      await waitForOptions(canvasElement, 3);
    });
  },
};

// ─── Comando marcado ──────────────────────────────────────────────────────────

export const CheckedItem: Story = {
  // `visual.item4` é "estado disabled E estado checked": o quadro do
  // desabilitado está em `ItemDisabled`, o do marcado é este. Declarar só lá
  // deixava metade do item sem story declarada — e esta não interage, então o
  // Chromatic fotografa exatamente a marca acesa.
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: { source: { transform: commandCheckedItemSource } },
  },
  render: () => ({
    template: `
      <div class="${WRAPPER}">
        <nds-command>
          <input ndsCommandInput placeholder="Buscar tema..." />

          <div ndsCommandList>
            <div ndsCommandGroup heading="Aparência">
              <div ndsCommandItem value="claro" [checked]="true">Claro</div>
              <div ndsCommandItem value="escuro" [checked]="false">Escuro</div>
              <div ndsCommandItem value="sistema" [checked]="true">Sistema <span ndsCommandShortcut>Ctrl+S</span></div>
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

    const light = commandItem(canvasElement, 'claro');
    const dark = commandItem(canvasElement, 'escuro');
    const system = commandItem(canvasElement, 'sistema');
    const checkOf = (item: HTMLElement) =>
      getComputedStyle(item.querySelector<HTMLElement>('.nds-command-item-check')!);

    await step('O estado chega ao markup', async () => {
      await expect(light).toHaveAttribute('data-checked', 'true');
      await expect(dark).toHaveAttribute('data-checked', 'false');
    });

    await step('A marca aparece só no comando marcado', async () => {
      // O ícone fica no DOM nos dois casos — é a opacidade que muda, para a
      // largura do item não pular a cada troca.
      await expect(checkOf(light).opacity).toBe('1');
      await expect(checkOf(dark).opacity).toBe('0');
    });

    await step('Com atalho no item, a marca some', async () => {
      // Os dois disputariam a borda direita. A folha resolve por `:has()`, e a
      // guideline é escolher um dos dois por item.
      await expect(system).toHaveAttribute('data-checked', 'true');
      await expect(checkOf(system).display).toBe('none');
    });

    await step('O atalho faz parte do nome do comando', async () => {
      // Sem isso o leitor anunciaria "Sistema" e a pessoa nunca saberia que há
      // uma tecla — o atalho é informação, não decoração.
      const shortcut = system.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(shortcut).toHaveClass(/nds-command-shortcut/);
      await expect(shortcut.getAttribute('aria-hidden')).toBeNull();
      await expect(system).toHaveAccessibleName(/Ctrl\+S/);
    });
  },
};

// ─── Lista longa ──────────────────────────────────────────────────────────────

const LONG_COMPONENT_NAMES = [
  'Accordion', 'Alert', 'AlertDialog', 'AspectRatio', 'Avatar',
  'Badge', 'Breadcrumb', 'Button', 'Calendar', 'Card',
  'Carousel', 'Chart', 'Checkbox', 'Collapsible', 'Command',
  'ContextMenu', 'DataTable', 'DatePicker', 'Dialog', 'Drawer',
  'DropdownMenu', 'Form', 'HoverCard', 'Input', 'InputOTP',
  'Label', 'Menubar', 'NavigationMenu', 'Pagination', 'Popover',
];

export const LongList: Story = {
  parameters: { docs: { source: { transform: commandLongListSource } } },
  render: () => ({
    props: {
      components: LONG_COMPONENT_NAMES.map((label) => ({ value: label.toLowerCase(), label })),
    },
    template: `
      <div class="${WRAPPER}">
        <nds-command>
          <input ndsCommandInput placeholder="Buscar componente..." />

          <div ndsCommandList>
            <div ndsCommandGroup heading="Componentes">
              @for (c of components; track c.value) {
                <div ndsCommandItem [value]="c.value">{{ c.label }}</div>
              }
            </div>
          </div>

          <div ndsCommandEmpty>${NO_RESULT}</div>
        </nds-command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('listbox');
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitForOptions(canvasElement, 30);

    await step('A lista rola em vez de esticar a paleta', async () => {
      // 300px de teto na folha: sem ele a paleta cresceria para fora da tela e
      // o campo de busca sairia do alcance.
      await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
      await expect(getComputedStyle(list).overflowY).toBe('auto');
    });

    await step('Buscando "dialog" sobram 2 — Dialog e AlertDialog', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'dialog');
      await waitForOptions(canvasElement, 2);
      await expect(commandItem(canvasElement, 'dialog')).toBeVisible();
      await expect(commandItem(canvasElement, 'alertdialog')).toBeVisible();
    });

    await step('A story termina com a lista inteira', async () => {
      await userEvent.clear(field);
      await waitForOptions(canvasElement, 30);
    });
  },
};
