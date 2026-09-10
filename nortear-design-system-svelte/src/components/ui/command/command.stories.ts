import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, waitFor, expect, fn } from 'storybook/test';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import CommandDocs from '@/components/docs/CommandDocs.svelte';
import { Root as Command } from '@/components/ui/command';
import CommandInlineStory from './CommandInlineStory.svelte';
import { commandSource, PLAYGROUND_ITEMS } from './command.source';
import { highlightedOf, separatorsOf } from './command.fixtures';

import { figmaDesign } from '@shared/figma/design-links';

/** Espera de relógio: para provar que algo NÃO aconteceu, sem `waitFor`. */
const settle = (ms = 50) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const meta: Meta = {
  title: 'Components/Overlay/Command',
  component: Command,
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('command'),
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(CommandDocs),
      source: { transform: commandSource },
      description: {
        component:
          'Interface de busca e seleção rápida com filtro por texto integrado. Suporta uso inline e command palette.',
      },
    },
  },
  // O docgen está desligado nesta stack: este bloco é a ÚNICA fonte da aba
  // API Reference.
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Texto do campo de busca. Vira também o nome acessível do campo.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    emptyMessage: {
      control: 'text',
      description: 'Frase exibida quando a busca não encontra nada.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    loop: {
      control: 'boolean',
      description: 'Navegação por teclado cicla do último para o primeiro item.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    shouldFilter: {
      control: 'boolean',
      description: 'Habilita o filtro interno por texto (desative para filtro externo).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    onItemSelect: {
      control: false,
      description: 'Chamado a cada comando escolhido, por clique ou por Enter.',
      table: { type: { summary: '(value: string) => void' } },
    },
  },
  args: {
    placeholder: 'Buscar componente...',
    emptyMessage: 'Nenhum resultado encontrado.',
    loop: false,
    shouldFilter: true,
    onItemSelect: fn(),
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: ['functional.item1', 'functional.item2', 'accessibility.item1', 'accessibility.item2'],
  },
  render: (args) => ({
    Component: CommandInlineStory,
    // A lista é a mesma que `commandSource` escreve no painel Code.
    props: { ...args, items: PLAYGROUND_ITEMS },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const field = canvas.getByRole('combobox');
    const list = canvas.getByRole('listbox');
    const spy = args.onItemSelect as unknown as ReturnType<typeof fn>;
    const options = () => canvas.getAllByRole('option');

    await step('O campo inline não rouba o foco ao montar', async () => {
      // Antes de qualquer gesto da play — o `clear` abaixo foca o campo. Espera
      // de relógio, e não `waitFor`: o que se prova é que o foco NÃO chegou, e
      // uma espera por condição passaria na primeira leitura. Só a paleta
      // aberta num Dialog foca o campo sozinha (C12).
      await settle();
      await expect(field).not.toHaveFocus();
    });

    // A play REEXECUTA no mesmo DOM: a busca parte sempre do zero.
    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(options()).toHaveLength(5);
    });

    await step('Ao montar, o primeiro comando já está em destaque', async () => {
      // Sem seta nenhuma: o destaque nasce no primeiro comando habilitado, e é
      // ele que um Enter imediato executa (D11).
      await waitFor(async () => {
        await expect(options()[0]).toHaveAttribute('aria-selected', 'true');
      });
      await expect(highlightedOf(field)).toBe(options()[0]);
      // Um destaque por vez.
      await expect(
        canvasElement.querySelectorAll('[role="option"][aria-selected="true"]'),
      ).toHaveLength(1);
    });

    await step('O markup é o mesmo das outras stacks', async () => {
      await expect(root).toHaveClass(/nds-command/);
      await expect(field).toHaveClass(/nds-command-input/);
      await expect(field).toHaveAttribute('data-slot', 'command-input');
      await expect(list).toHaveClass(/nds-command-list/);
      await expect(list).toHaveAttribute('data-slot', 'command-list');
    });

    await step('A lupa é do componente e o invólucro dela existe de fato', async () => {
      const involucro = root.querySelector<HTMLElement>('[data-slot="command-input-wrapper"]')!;
      await expect(involucro).toHaveClass(/nds-command-input-wrapper/);
      const lupa = involucro.querySelector('svg')!;
      // Filha DIRETA: o seletor da folha é `.nds-command-input-wrapper > svg`, e
      // enquanto o campo era montado por dentro do InputGroup a lupa vivia
      // dentro de um addon — fora do alcance da regra, com o tamanho do lucide.
      await expect(lupa.parentElement).toBe(involucro);
      // Prova que a regra casou: a opacidade de 50% só vem dela.
      await expect(getComputedStyle(lupa).opacity).toBe('0.5');
      // E uma borda só: `.nds-input-group` desenhava a moldura completa por cima
      // da borda de baixo do invólucro.
      await expect(root.querySelector('.nds-input-group')).toBeNull();
    });

    await step('O campo é uma combobox ligada à lista REAL', async () => {
      await expect(field).toHaveAttribute('aria-autocomplete', 'list');
      await expect(field).toHaveAttribute('aria-expanded', 'true');
      const controlled = field.getAttribute('aria-controls');
      await expect(controlled).toBeTruthy();
      // Id órfão o axe reprova, e era o que acontecia quando o `aria-controls`
      // vinha do wrapper da story em vez do componente.
      await expect(document.getElementById(controlled!)).toBe(list);
      // A lista se chama como o campo: o placeholder, que é a frase que a
      // pessoa acabou de ler em cima dela. O default da lib é "Suggestions...",
      // em inglês em qualquer idioma — e o desta stack era um texto cravado em
      // português, também em qualquer idioma.
      await expect(list).toHaveAttribute('aria-label', args.placeholder as string);
    });

    await step('A raiz não tem papel nem parada de foco', async () => {
      // A lib põe `role="application"` e `tabindex="-1"` na raiz, e o
      // componente os remove (ver `command.svelte`). O primeiro desliga os
      // atalhos do leitor de tela na região inteira; o segundo fazia um clique
      // no cabeçalho do grupo levar o foco do campo para um `<div>` sem nome.
      await expect(root.getAttribute('role')).toBeNull();
      await expect(root.getAttribute('tabindex')).toBeNull();
      // É a raiz DA LIB, com o ouvinte de teclado dela: a tecla sobe do campo
      // por bolha até aqui, e as setas dos passos abaixo provam que chega.
      await expect(root).toHaveAttribute('data-command-root');
    });

    await step('Cada comando é uma opção, e o divisor não é', async () => {
      // Por NOME e não por posição: o filtro reordena os grupos pelo melhor
      // resultado, e a ordem de DOM não volta sozinha depois de uma busca.
      const button = canvas.getByRole('option', { name: 'Button' });
      await expect(button).toHaveClass(/nds-command-item/);
      await expect(button).toHaveAttribute('data-slot', 'command-item');
      await expect(button).toHaveAttribute('data-value', 'button');
      const divisor = root.querySelector<HTMLElement>('[data-slot="command-separator"]')!;
      await expect(divisor).toHaveClass(/nds-command-separator/);
      // ARIA só admite `option` e `group` dentro de um listbox.
      await expect(divisor).toHaveAttribute('aria-hidden', 'true');
      await expect(canvas.queryAllByRole('separator')).toHaveLength(0);
      // Comando não marcável não carrega marca — ela roubaria 16px à direita.
      await expect(button.querySelector('.nds-command-item-check')).toBeNull();
    });

    await step('Digitar filtra, e o que não casa sai da árvore', async () => {
      await userEvent.type(field, 'sep');

      await waitFor(async () => {
        // Buscando "sep": só o comando de value "separator" pontua.
        await expect(canvas.getAllByRole('option')).toHaveLength(1);
      });
      await expect(canvas.getByRole('option', { name: 'Separator' })).toBeVisible();
      await expect(canvas.queryByText('Button')).toBeNull();
      // O grupo inteiro se recolhe quando nenhum item dele passa — sem isso a
      // paleta mostraria "Utilitários" com nada embaixo.
      const utilitarios = root.querySelector<HTMLElement>(
        '[data-slot="command-group"][data-value="Utilitários"]',
      )!;
      await expect(utilitarios).not.toBeVisible();
      // E o traço vai junto: com um dos lados vazio não sobra fronteira para
      // marcar (C11). Nesta lib ele sai em qualquer busca — padrão aceito.
      await expect(separatorsOf(root)).toHaveLength(0);
    });

    await step('Depois de uma busca, o primeiro comando que sobrou fica em destaque', async () => {
      // "t" deixa três comandos, e a lib os reordena pela pontuação: o
      // destaque vai para o primeiro da lista NOVA, não fica no que estava
      // (D11). Por posição de DOM, e não por nome, porque a ordem é da lib.
      await userEvent.clear(field);
      await userEvent.type(field, 't');
      await waitFor(async () => {
        await expect(options()).toHaveLength(3);
      });
      await waitFor(async () => {
        await expect(options()[0]).toHaveAttribute('aria-selected', 'true');
      });
      await expect(highlightedOf(field)).toBe(options()[0]);
    });

    await step('Digitar e apertar Enter executa, sem passar pelas setas', async () => {
      // É o gesto inteiro da paleta para quem sabe o nome do comando (D11).
      await userEvent.clear(field);
      const before = spy.mock.calls.length;
      await userEvent.type(field, 'inp{Enter}');
      await waitFor(async () => {
        await expect(spy.mock.calls.length).toBe(before + 1);
      });
      await expect(spy.mock.calls[before][0]).toBe('input');
    });

    await step('Sem correspondência, a frase é ANUNCIADA e não só desenhada', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'zzz');

      const vazio = root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
      await waitFor(async () => {
        await expect(vazio).toHaveAttribute('data-empty', '');
      });
      await expect(vazio).toBeVisible();
      await expect(vazio).toHaveTextContent(args.emptyMessage as string);
      await expect(vazio).toHaveClass(/nds-command-empty/);
      // Região viva montada o tempo todo: é a mudança DENTRO dela que o leitor
      // de tela anuncia. Criá-la só na hora não anunciaria nada — e é o único
      // ponto da paleta em que a mudança acontece fora do foco e sem outro
      // canal, porque não sobra item nenhum para onde navegar.
      await expect(vazio).toHaveAttribute('role', 'status');
      await expect(vazio).toHaveAttribute('aria-live', 'polite');
      await expect(vazio).toHaveAttribute('aria-atomic', 'true');
      // E ela mora FORA do listbox: `role="status"` não é filho permitido de
      // `role="listbox"` (axe: aria-required-children). Nenhum comando sobra e
      // a mensagem NÃO se disfarça de opção para caber ali dentro.
      await expect(list.contains(vazio)).toBe(false);
      await expect(canvas.queryAllByRole('option')).toHaveLength(0);
    });

    await step('Apagar a busca traz os comandos de volta', async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(5);
      });
      const vazio = root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
      await expect(vazio).not.toHaveAttribute('data-empty');
      // Continua no DOM (é o que preserva o anúncio da próxima busca vazia),
      // mas sem a classe que traz 24px de respiro em cima e embaixo.
      await expect(vazio).not.toHaveClass(/nds-command-empty/);
      await expect(vazio.getBoundingClientRect().height).toBe(0);
      // Os dois grupos de volta, e o traço entre eles (C11).
      await expect(separatorsOf(root)).toHaveLength(1);
    });

    await step('As setas percorrem a lista sem tirar o foco do campo', async () => {
      field.focus();
      // Precondição própria: Home fixa o destaque no primeiro comando da ordem
      // de DOM, seja qual for o estado que a rodada anterior deixou.
      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(options()[0]).toHaveAttribute('aria-selected', 'true');
      });
      const first = options()[0];
      const segundo = options()[1];

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(segundo).toHaveAttribute('aria-selected', 'true');
      });
      // O foco NÃO se move: é o que separa a paleta de um menu, e é o que
      // permite continuar digitando enquanto se navega.
      await expect(field).toHaveFocus();
      // E o leitor de tela sabe onde está o destaque — sem este apontamento a
      // seta não anuncia nada.
      const active = canvasElement.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')!;
      await expect(active).toBe(segundo);
      await expect(active).toHaveAttribute('role', 'option');
      // Um destaque por vez.
      await expect(first).toHaveAttribute('aria-selected', 'false');

      await userEvent.keyboard('{ArrowUp}');
      await waitFor(async () => {
        await expect(first).toHaveAttribute('aria-selected', 'true');
      });
    });

    await step('Ctrl+K no campo não move o destaque', async () => {
      // A lib liga por padrão atalhos de estilo vim — Ctrl+K sobe, Ctrl+J e
      // Ctrl+N descem — e Ctrl+K é o atalho que abre a paleta na docs page: a
      // mesma tecla subia o destaque E abria a paleta. O componente os
      // desliga (ver `command.svelte`).
      field.focus();
      await userEvent.keyboard('{ArrowDown}');
      const second = options()[1];
      await waitFor(async () => {
        await expect(second).toHaveAttribute('aria-selected', 'true');
      });

      await userEvent.keyboard('{Control>}k{/Control}');
      // Espera de relógio: prova que o destaque NÃO se moveu.
      await settle();
      await expect(second).toHaveAttribute('aria-selected', 'true');

      await userEvent.keyboard('{Control>}j{/Control}');
      await settle();
      await expect(second).toHaveAttribute('aria-selected', 'true');

      // De volta ao primeiro, que é de onde os passos seguintes partem.
      await userEvent.keyboard('{ArrowUp}');
      await waitFor(async () => {
        await expect(options()[0]).toHaveAttribute('aria-selected', 'true');
      });
    });

    await step('O item em destaque mostra o anel', async () => {
      // Aqui o item nunca recebe foco do DOM — quem o mantém é o campo, e o
      // destaque é apontado por `aria-activedescendant`. Por isso o anel é
      // ligado ao ATRIBUTO, e não a `:focus-visible`, que nunca dispararia.
      const emDestaque = canvasElement.querySelector<HTMLElement>(
        '[role="option"][aria-selected="true"], [role="option"][data-selected="true"]',
      )!;
      await expect(getComputedStyle(emDestaque).outlineStyle).toBe('solid');
      await expect(getComputedStyle(emDestaque).outlineWidth).toBe('2px');
    });

    await step('Enter escolhe o comando em destaque', async () => {
      const inHighlight = canvas.getAllByRole('option')[0];
      const valueEsperado = inHighlight.getAttribute('data-value');
      const antes = spy.mock.calls.length;
      await userEvent.keyboard('{Enter}');

      await waitFor(async () => {
        await expect(spy.mock.calls.length).toBe(antes + 1);
      });
      await expect(spy.mock.calls[antes][0]).toBe(valueEsperado);
      // A lista continua aberta: a paleta inline não tem estado fechado.
      await expect(field).toHaveAttribute('aria-expanded', 'true');
    });

    await step('O ponteiro também move o destaque', async () => {
      // O comando sob o ponteiro é o que o Enter ativa — o desenho e o teclado
      // apontam para o mesmo comando, e o anel acende pelo mesmo atributo (D1).
      const target = canvas.getByRole('option', { name: 'clsx()' });
      await userEvent.hover(target);
      await waitFor(async () => {
        await expect(target).toHaveAttribute('aria-selected', 'true');
      });
      await expect(highlightedOf(field)).toBe(target);
      // Pousar o ponteiro não tira o foco do campo.
      await expect(field).toHaveFocus();
    });

    await step('Clicar num comando também o escolhe', async () => {
      const antes = spy.mock.calls.length;
      await userEvent.click(canvas.getByRole('option', { name: 'cn()' }));

      await waitFor(async () => {
        await expect(spy.mock.calls.length).toBe(antes + 1);
      });
      await expect(spy.mock.calls[antes][0]).toBe('cn');
      // O clique não tira o foco do campo: a lista cancela o `mousedown`, e a
      // próxima seta continua valendo.
      await expect(field).toHaveFocus();
    });

    await step('Tab sai da paleta: a lista não é parada de Tab', async () => {
      // Quem percorre os comandos são as setas, com o foco no campo. Uma lista
      // parada de Tab seria uma segunda parada sem função — dentro dela as
      // setas não fazem nada, porque quem as escuta é o campo (C4).
      await expect(list.tabIndex).toBeLessThan(0);
      field.focus();
      await userEvent.tab();
      await expect(list).not.toHaveFocus();
      await expect(root.contains(document.activeElement)).toBe(false);
    });

    await step('Escape no uso inline não tira o foco do campo', async () => {
      // Sem hospedeiro não há o que fechar: a pessoa continua onde estava. O
      // Escape é do Dialog que hospeda a paleta, e quem prova esse lado é a
      // story CommandPalette (C3).
      await userEvent.clear(field);
      await userEvent.type(field, 'in');
      await userEvent.keyboard('{Escape}');
      await expect(field).toHaveFocus();

      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(5);
      });
    });
  },
};
