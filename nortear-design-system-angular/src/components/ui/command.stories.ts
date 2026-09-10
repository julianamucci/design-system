import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, fn } from 'storybook/test';
import { NDS_COMMAND } from './command';
import { commandPlaygroundSource, type CommandArgs } from './command.source';
import {
  WRAPPER,
  commandItem,
  highlightedOption,
  waitForHighlight,
  waitForOptions,
  emptyRegion,
  visibleSeparators,
  resetSearch,
} from './command.fixtures';
import { NdsCommandDocs } from '@/components/docs/CommandDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta<CommandArgs> = {
  title: 'Components/Overlay/Command',
  tags: ['autodocs', 'overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_COMMAND] })],
  parameters: {
    design: figmaDesign('command'),
    layout: 'centered',
    docs: { page: withAutoDocsTab(NdsCommandDocs) },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Texto do campo de busca. Vira também o nome acessível do campo e da lista.',
    },
    emptyMessage: {
      control: 'text',
      description: 'Frase anunciada quando a busca não encontra nada.',
    },
    showGroups: {
      control: 'boolean',
      description: 'Exibe os itens agrupados, com cabeçalho e divisor entre os grupos.',
    },
    // Espião de output. Sem entrada aqui o renderer Angular não repassa a
    // função em `props` e o `(itemSelect)` fica ligado a nada — sem erro
    // nenhum (armadilha 5).
    onItemSelect: {
      control: false,
      description: 'Emitido a cada comando escolhido, por clique ou por Enter.',
      table: { type: { summary: '(details: CommandSelectDetails) => void' } },
    },
  },
  args: {
    placeholder: 'Buscar componente...',
    emptyMessage: 'Nenhum resultado encontrado.',
    showGroups: true,
    onItemSelect: fn(),
  },
};

export default meta;
type Story = StoryObj<CommandArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: commandPlaygroundSource } },
    // `functional.item1` tem duas metades — o filtro esconder o que não casa, e
    // a frase de vazio aparecer quando nada sobra. As duas são verificadas
    // aqui; `EmptyState` declara o mesmo id porque é a story que TERMINA no
    // quadro sem resultados, que é o que o Chromatic fotografa.
    covers: [
      'functional.item1',
      'functional.item2',
      'accessibility.item1',
      'accessibility.item2',
    ],
  },
  // Sem grupos, a lista vira UM bloco sem cabeçalho e sem traço: traço separa
  // blocos, e com um bloco só não há o que separar.
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="${WRAPPER}">
        <nds-command (itemSelect)="onItemSelect($event)">
          <input ndsCommandInput [placeholder]="placeholder" />

          <div ndsCommandList>
            @if (showGroups) {
              <div ndsCommandGroup heading="Componentes">
                <div ndsCommandItem value="button">Button</div>
                <div ndsCommandItem value="input">Input</div>
                <div ndsCommandItem value="separator">Separator</div>
              </div>

              <div ndsCommandSeparator></div>

              <div ndsCommandGroup heading="Utilitários">
                <div ndsCommandItem value="cn">cn()</div>
                <div ndsCommandItem value="clsx">clsx()</div>
              </div>
            } @else {
              <div ndsCommandGroup>
                <div ndsCommandItem value="button">Button</div>
                <div ndsCommandItem value="input">Input</div>
                <div ndsCommandItem value="separator">Separator</div>
                <div ndsCommandItem value="cn">cn()</div>
                <div ndsCommandItem value="clsx">clsx()</div>
              </div>
            }
          </div>

          <div ndsCommandEmpty>{{ emptyMessage }}</div>
        </nds-command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const field = canvas.getByRole('combobox') as HTMLInputElement;
    const list = canvas.getByRole('listbox');
    const spy = args.onItemSelect as ReturnType<typeof fn>;

    await step('O campo inline não rouba o foco ao montar', async () => {
      // Antes de qualquer gesto da play — o `clear` logo abaixo já focaria o
      // campo. Espera de RELÓGIO, e não `waitFor`: a pergunta é "depois de um
      // tempo, o foco continua fora", e um `waitFor` passaria na primeira
      // leitura, antes de um foco atrasado ter tido chance de chegar. Só a
      // paleta aberta num Dialog foca o campo sozinha (C12).
      await new Promise((resolve) => setTimeout(resolve, 50));
      await expect(field).not.toHaveFocus();
    });

    // A busca começa sempre vazia: a play REEXECUTA no mesmo DOM. Os itens só
    // se registram no render seguinte ao da montagem (é assim que o primitivo
    // lê o texto de cada um do DOM), então até lá a lista está legitimamente
    // vazia — e sem esta espera a contagem adiante passaria por chegar cedo.
    await userEvent.clear(field);
    await waitForOptions(canvasElement, 5);

    await step('Ao montar, o primeiro comando já está em destaque', async () => {
      // PRD, D11: sem seta nenhuma, o Enter já tem o que executar. O destaque
      // é o de sempre — `aria-selected` no item e `aria-activedescendant` no
      // campo apontando para ele.
      await waitForHighlight(field, 'Button');
      await expect(commandItem(root, 'button')).toHaveAttribute('aria-selected', 'true');
      await expect(field.getAttribute('aria-activedescendant')).toBe(commandItem(root, 'button').id);
      // Um destaque por vez.
      await expect(root.querySelectorAll('[aria-selected="true"]')).toHaveLength(1);
    });

    await step('O markup é o mesmo das outras stacks', async () => {
      await expect(root).toHaveClass(/nds-command/);
      await expect(field).toHaveClass(/nds-command-input/);
      await expect(field).toHaveAttribute('data-slot', 'command-input');
      await expect(list).toHaveClass(/nds-command-list/);
      await expect(list).toHaveAttribute('data-slot', 'command-list');
      // A lupa é do componente, não do call site — quem escreve a paleta não
      // pode esquecê-la.
      await expect(root.querySelector('.nds-command-input-wrapper > svg')).not.toBeNull();
    });

    await step('O campo é uma combobox ligada à lista REAL', async () => {
      // Este é o par que separa a paleta de um menu: papel de combobox no
      // campo, papel de listbox na lista, e o `aria-controls` apontando para o
      // id que a lista tem de verdade — id órfão o axe reprova.
      await expect(field).toHaveAttribute('aria-autocomplete', 'list');
      await expect(field).toHaveAttribute('aria-expanded', 'true');
      const controlled = field.getAttribute('aria-controls');
      await expect(controlled).toBeTruthy();
      await expect(document.getElementById(controlled!)).toBe(list);
      // Nome acessível herdado do placeholder, nos dois papéis.
      await expect(field).toHaveAttribute('aria-label', args.placeholder);
      await expect(list).toHaveAttribute('aria-label', args.placeholder);
    });

    await step('Quando o placeholder muda, o nome do campo e da lista muda junto', async () => {
      // É o que a troca de idioma faz: o binding de quem consome reescreve o
      // placeholder, e o nome acessível — que SAI dele — não pode ficar no
      // idioma anterior. A escrita aqui é a mesma que o binding faria.
      const renamed = 'Search component...';
      field.placeholder = renamed;
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-label', renamed);
        await expect(list).toHaveAttribute('aria-label', renamed);
      });

      field.placeholder = args.placeholder;
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-label', args.placeholder);
        await expect(list).toHaveAttribute('aria-label', args.placeholder);
      });
    });

    await step('Cada comando é uma opção; o cabeçalho de grupo não é', async () => {
      const options = canvas.getAllByRole('option');
      await expect(options).toHaveLength(5);
      await expect(options[0]).toHaveClass(/nds-command-item/);
      await expect(options[0]).toHaveAttribute('data-slot', 'command-item');
      // Todo comando carrega o estado; só o primeiro está em destaque (D11).
      await expect(options[0]).toHaveAttribute('aria-selected', 'true');
      await expect(options[1]).toHaveAttribute('aria-selected', 'false');

      // Sob JIT o componente renderiza com o default e `heading` nunca chega
      // (armadilha 1): a contagem é o que prova que o input chegou.
      const headings = root.querySelectorAll<HTMLElement>('.nds-command-group-heading');
      await expect(headings.length).toBe(args.showGroups ? 2 : 0);

      if (args.showGroups) {
        // O grupo é nomeado pelo próprio cabeçalho, e o cabeçalho continua
        // fora da lista de opções — o erro clássico deste componente.
        await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
        await expect(headings[0].getAttribute('role')).toBeNull();
        // O divisor não entra na lista: ARIA só admite `option` e `group`
        // dentro de um listbox.
        await expect(
          root.querySelector('[data-slot="command-separator"]'),
        ).toHaveAttribute('aria-hidden', 'true');
      } else {
        // Sem cabeçalho, o bloco é só respiro: um grupo sem nome seria
        // anunciado como "grupo" e mais nada, na frente de toda a lista.
        await expect(canvas.queryAllByRole('group')).toHaveLength(0);
        const block = root.querySelector<HTMLElement>('[data-slot="command-group"]')!;
        await expect(block).toHaveClass(/nds-command-group/);
        await expect(block).not.toHaveAttribute('role');
      }
    });

    await step('Digitar filtra — buscando "sep" sobra 1 comando', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'sep');
      await waitForOptions(canvasElement, 1);
      await expect(canvas.getByRole('option', { name: 'Separator' })).toBeVisible();
      // Não basta sumir da consulta por papel: o item precisa estar realmente
      // invisível. Quem garante é a regra `[hidden]` da folha (PRD, D6) — sem
      // ela o `display: flex` do item venceria o `hidden` do navegador.
      await expect(commandItem(root, 'button')).not.toBeVisible();
      // O que sobrou é o novo primeiro, e é ele que fica em destaque (D11).
      await waitForHighlight(field, 'Separator');

      if (args.showGroups) {
        // O grupo inteiro se recolhe quando nenhum item dele passa no filtro —
        // sem isso a paleta mostraria "Utilitários" com nada embaixo. E o traço
        // vai junto: sem comando dos dois lados, não há fronteira para marcar.
        const groups = root.querySelectorAll<HTMLElement>('[data-slot="command-group"]');
        await expect(groups[1]).not.toBeVisible();
        await waitFor(async () => {
          await expect(visibleSeparators(root)).toHaveLength(0);
        });
      }
    });

    await step('Sem correspondência, a frase é ANUNCIADA e não só desenhada', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'zzz');
      await waitForOptions(canvasElement, 0);

      const empty = emptyRegion(root);
      await waitFor(async () => {
        await expect(empty).toHaveAttribute('data-empty', '');
      });
      await expect(empty).toHaveTextContent(args.emptyMessage);
      // Sem opção na tela, o campo não aponta para nenhuma: um
      // `aria-activedescendant` órfão faria o leitor anunciar um fantasma.
      await expect(field).not.toHaveAttribute('aria-activedescendant');
      // Região viva montada o tempo todo: é a mudança DENTRO dela que o leitor
      // de tela anuncia. Criá-la só na hora não anunciaria nada.
      await expect(empty).toHaveAttribute('role', 'status');
      await expect(empty).toHaveAttribute('aria-live', 'polite');
      await expect(empty).toHaveAttribute('aria-atomic', 'true');
      await expect(empty).toHaveClass(/nds-command-empty/);
      // E ela mora FORA do listbox: `role="status"` não é filho permitido de
      // `role="listbox"` (axe: aria-required-children).
      await expect(list.contains(empty)).toBe(false);
    });

    await step('Com resultado, a região viva volta a ocupar zero', async () => {
      await userEvent.clear(field);
      await waitForOptions(canvasElement, 5);
      const empty = emptyRegion(root);
      await waitFor(async () => {
        await expect(empty).not.toHaveAttribute('data-empty');
      });
      // Continua no DOM (é o que preserva o anúncio), mas sem a classe que traz
      // 24px de respiro em cima e embaixo.
      await expect(empty).not.toHaveClass(/nds-command-empty/);
      await expect(empty.getBoundingClientRect().height).toBe(0);
      // Os dois lados de volta, o traço de volta (C11) — e o destaque de volta
      // ao primeiro da lista inteira.
      await waitFor(async () => {
        await expect(visibleSeparators(root)).toHaveLength(args.showGroups ? 1 : 0);
      });
      await waitForHighlight(field, 'Button');
    });

    await step('A cada busca, o destaque volta ao PRIMEIRO comando que sobrou', async () => {
      // "s" deixa Separator e clsx(): o primeiro que sobra é o destacado.
      await userEvent.clear(field);
      await userEvent.type(field, 's');
      await waitForOptions(canvasElement, 2);
      await waitForHighlight(field, 'Separator');

      // A seta leva o destaque para baixo, e a busca seguinte o devolve ao
      // topo MESMO com o comando destacado ainda na lista — é a busca que
      // decide, não a sobrevivência do destaque anterior.
      await userEvent.keyboard('{ArrowDown}');
      await waitForHighlight(field, 'clsx()');
      await userEvent.keyboard('{Backspace}');
      await waitForOptions(canvasElement, 5);
      await waitForHighlight(field, 'Button');
    });

    await step('Digitar e apertar Enter, sem seta nenhuma, executa o primeiro', async () => {
      // Sem espera entre a última letra e o Enter: é o gesto de quem conhece o
      // comando e digita de uma vez. O destaque tem de estar pronto no mesmo
      // evento da tecla, e não no ciclo de detecção seguinte.
      await userEvent.clear(field);
      const before = spy.mock.calls.length;
      await userEvent.type(field, 'cls');
      await userEvent.keyboard('{Enter}');

      await waitFor(async () => {
        await expect(spy.mock.calls.length).toBe(before + 1);
      });
      await expect(spy.mock.calls[before][0]).toEqual({ value: 'clsx', label: 'clsx()' });
      await waitFor(async () => {
        await expect(field).toHaveValue('');
      });
      await waitForOptions(canvasElement, 5);
      await waitForHighlight(field, 'Button');
    });

    await step('As setas percorrem TODOS os comandos sem tirar o foco do campo, e param nas pontas', async () => {
      await resetSearch(canvasElement, field, 5);
      field.focus();

      // O item do contrato diz "percorre todos os comandos habilitados em
      // sequência": descer dois e subir um deixaria a travessia entre os dois
      // grupos — que é onde a sequência quebraria — sem verificação nenhuma.
      // A travessia parte do primeiro, que já está em destaque (D11).
      await waitForHighlight(field, 'Button');
      for (const text of ['Input', 'Separator', 'cn()', 'clsx()']) {
        await userEvent.keyboard('{ArrowDown}');
        await waitForHighlight(field, text);
      }

      const last = highlightedOption(field)!;
      await expect(last).toHaveAttribute('role', 'option');
      await expect(last).toHaveAttribute('aria-selected', 'true');
      // O foco NÃO se move: é o que separa a paleta de um menu, e é o que
      // permite continuar digitando enquanto se navega.
      await expect(field).toHaveFocus();

      // Uma seta a mais no último NÃO volta ao primeiro. A prova é a seta de
      // volta: se o destaque tivesse laçado para "Button", subir não chegaria
      // a "cn()".
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowUp}');
      await waitForHighlight(field, 'cn()');

      for (const text of ['Separator', 'Input', 'Button']) {
        await userEvent.keyboard('{ArrowUp}');
        await waitForHighlight(field, text);
      }

      // E no primeiro, a seta para cima também para — descer de novo leva ao
      // segundo, e não ao penúltimo.
      await userEvent.keyboard('{ArrowUp}');
      await userEvent.keyboard('{ArrowDown}');
      await waitForHighlight(field, 'Input');

      // Um destaque por vez: quem estava marcado no fim da descida não está
      // mais.
      await expect(last).toHaveAttribute('aria-selected', 'false');
    });

    await step('O item em destaque mostra o anel', async () => {
      // Aqui o item nunca recebe foco do DOM — quem o mantém é o campo, e o
      // destaque é apontado por `aria-activedescendant`. Por isso o anel é
      // ligado ao ATRIBUTO, e não a `:focus-visible`, que nunca dispararia.
      //
      // O passo estabelece a própria precondição, e não herda o destaque que o
      // anterior deixou: a busca zerada devolve o destaque ao primeiro.
      await resetSearch(canvasElement, field, 5);
      field.focus();
      await waitForHighlight(field, 'Button');
      const highlightedEl = highlightedOption(field)!;
      await expect(getComputedStyle(highlightedEl).outlineStyle).toBe('solid');
      await expect(getComputedStyle(highlightedEl).outlineWidth).toBe('2px');
    });

    await step('O ponteiro também move o destaque', async () => {
      // O item sob o ponteiro é o que o Enter ativa — o desenho e o teclado
      // apontam para o mesmo comando (PRD, D1).
      //
      // O ponteiro passa por outro comando antes de pousar no alvo, como faz
      // quem move o mouse de verdade. Não é enfeite: depois das setas, o
      // primitivo gasta o PRIMEIRO movimento do ponteiro só devolvendo o
      // comando a ele — sem isso um único `hover` não moveria nada, e o passo
      // dependeria de os anteriores terem usado ou não o teclado.
      await resetSearch(canvasElement, field, 5);
      await waitForHighlight(field, 'Button');
      await userEvent.hover(commandItem(root, 'separator'));
      const target = commandItem(root, 'clsx');
      await userEvent.hover(target);
      await waitForHighlight(field, 'clsx()');
      await expect(target).toHaveAttribute('aria-selected', 'true');
      await expect(field.getAttribute('aria-activedescendant')).toBe(target.id);
      await expect(commandItem(root, 'button')).toHaveAttribute('aria-selected', 'false');
    });

    await step('Enter escolhe o comando em destaque e zera a busca', async () => {
      await resetSearch(canvasElement, field, 5);
      field.focus();
      await waitForHighlight(field, 'Button');

      const before = spy.mock.calls.length;
      await userEvent.keyboard('{Enter}');

      await waitFor(async () => {
        await expect(spy.mock.calls.length).toBe(before + 1);
      });
      // O rótulo é o texto do item — o que o filtro compara —, e o valor é o
      // que vai ao analytics.
      await expect(spy.mock.calls[before][0]).toEqual({ value: 'button', label: 'Button' });
      // A busca volta ao zero para o próximo comando — o campo não pode virar
      // o nome do que acabou de rodar.
      await waitFor(async () => {
        await expect(field).toHaveValue('');
      });
      await waitForOptions(canvasElement, 5);
      // E a lista continua aberta: a paleta não tem estado fechado.
      await expect(field).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar num comando também o escolhe', async () => {
      await userEvent.clear(field);
      const before = spy.mock.calls.length;
      await userEvent.click(canvas.getByRole('option', { name: 'cn()' }));

      await waitFor(async () => {
        await expect(spy.mock.calls.length).toBe(before + 1);
      });
      await expect(spy.mock.calls[before][0]).toEqual({ value: 'cn', label: 'cn()' });
      await waitFor(async () => {
        await expect(field).toHaveValue('');
      });
      await waitForOptions(canvasElement, 5);
    });

    await step('Tab sai da paleta: a lista não é parada de Tab', async () => {
      // Quem percorre os comandos são as setas, com o foco no campo. Uma lista
      // com `tabindex="0"` viraria uma segunda parada sem função — dentro dela
      // as setas não fazem nada, porque quem as escuta é o campo.
      await expect(list.tabIndex).toBeLessThan(0);
      field.focus();
      await userEvent.tab();
      await expect(list).not.toHaveFocus();
      await expect(root.contains(document.activeElement)).toBe(false);
    });

    await step('Escape no uso inline não tira o foco do campo', async () => {
      // Sem hospedeiro não há o que fechar: a pessoa continua onde estava, com
      // a busca intacta. O Escape é do Dialog que hospeda a paleta, e quem
      // prova esse lado é a story CommandPalette.
      await userEvent.clear(field);
      await userEvent.type(field, 'in');
      await userEvent.keyboard('{Escape}');
      await expect(field).toHaveFocus();
      await expect(field).toHaveValue('in');

      await userEvent.clear(field);
      await waitForOptions(canvasElement, 5);
    });

    await step('A story termina como nasceu: sem foco, com o primeiro em destaque', async () => {
      // O quadro que o Chromatic fotografa é o da montagem — e a play
      // REEXECUTA no mesmo DOM, onde o primeiro passo cobra o campo sem foco.
      field.blur();
      await expect(field).not.toHaveFocus();
      await waitForHighlight(field, 'Button');
    });
  },
};
