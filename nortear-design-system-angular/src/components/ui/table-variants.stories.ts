import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { signal } from '@angular/core';
import { expect, userEvent, within } from 'storybook/test';
import {
  NdsTable,
  NdsTableBody,
  NdsTableCaption,
  NdsTableCell,
  NdsTableFooter,
  NdsTableHead,
  NdsTableHeader,
  NdsTableRow,
  NdsTableWrapper,
} from './table';
import { NdsBadge } from './badge';
import { NdsButton, NdsButtonIcon } from './button';
import { INVOICES, TOTAL, STATUS_VARIANT } from './table.fixtures';
import {
  tableBasicSource,
  tableCaptionSrOnlySource,
  tableExpandableRowsSource,
  tableFooterSource,
  tableHorizontalScrollSource,
  tableRowActionsSource,
} from './table.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Components/Tables/Table/Variants',
  tags: ['tables'],
  decorators: [
    moduleMetadata({
      imports: [
        NdsTableWrapper,
        NdsTable,
        NdsTableCaption,
        NdsTableHeader,
        NdsTableBody,
        NdsTableFooter,
        NdsTableRow,
        NdsTableHead,
        NdsTableCell,
        NdsBadge,
        NdsButton,
        NdsButtonIcon,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    // Sem argTypes: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Padrões de uso do Table: tabela mínima, rodapé de totais, legenda só para leitor de tela, ações por linha e rolagem horizontal.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// O cabeçalho da coluna numérica recebe `nds-text-right` junto com as células.
//
// Este arquivo carregava a nota oposta — que a classe seria inerte no `<th>`,
// porque `.nds-table th` tinha especificidade maior que a utilitária. Era
// verdade até o CSS compartilhado rebaixar o seletor para `:where(.nds-table) th`
// (0,0,1): a utilitária (0,1,0) passou a vencer, e `utilities.css` ainda é o
// último import. A nota sobreviveu à correção e deixou esta stack como a única
// com o rótulo "Valor" à esquerda dos próprios números.

// ─── Básica ───────────────────────────────────────────────────────────────────

export const Basic: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item1'],
    docs: {
      source: { transform: tableBasicSource },
      description: {
        story:
          'Padrão mínimo funcional: legenda, cabeçalho e corpo dentro do container que rola na horizontal.',
      },
    },
  },
  render: () => ({
    props: { faturas: INVOICES },
    template: `
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption>Lista de faturas recentes</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>Fatura</th>
              <th ndsTableHead>Status</th>
              <th ndsTableHead>Método</th>
              <th ndsTableHead class="nds-text-right">Valor</th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            @for (invoice of faturas; track invoice.id) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
                <td ndsTableCell>{{ invoice.status }}</td>
                <td ndsTableCell>{{ invoice.metodo }}</td>
                <td ndsTableCell class="nds-text-right">{{ invoice.value }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Uma linha por registro, quatro colunas por linha', async () => {
      // functional.item1 — a conta sai da fixture, nunca de um número escrito à
      // mão: um dado a menos deixaria a asserção verde e a tabela errada.
      const lines = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(lines.length).toBe(INVOICES.length);
      for (const [i, line] of lines.entries()) {
        await expect(line).toHaveAttribute('data-slot', 'table-row');
        await expect(line.querySelectorAll('td').length).toBe(4);
        await expect(line).toHaveTextContent(INVOICES[i].id);
      }
    });

    await step('A coluna de valores alinha à direita, rótulo junto com os números', async () => {
      // visual.item1 — é o caso de uso central de `nds-text-right`: número se lê
      // pela unidade, alinhado à direita, e o rótulo tem de acompanhar. A
      // asserção é do alinhamento COMPUTADO, não da classe: enquanto o seletor
      // de `th` do CSS compartilhado vencia a utilitária, escrever a classe não
      // pintava nada — e era exatamente isso que estava acontecendo aqui.
      const ths = [...canvasElement.querySelectorAll<HTMLElement>('thead th')];
      await expect(ths[3]).toHaveTextContent('Valor');
      await expect(getComputedStyle(ths[3]).textAlign).toBe('right');
      const valueTd = canvasElement.querySelector<HTMLElement>('tbody tr td:last-child')!;
      await expect(getComputedStyle(valueTd).textAlign).toBe('right');
      // A coluna descritiva continua à esquerda: o alinhamento é escolha por
      // coluna, não estilo da tabela.
      await expect(getComputedStyle(ths[0]).textAlign).toBe('left');
    });

    await step('A legenda visível é o nome acessível da tabela', async () => {
      const table = canvas.getByRole('table', { name: /faturas recentes/ });
      const caption = table.querySelector<HTMLElement>('caption')!;
      await expect(caption.classList.contains('nds-sr-only')).toBe(false);
    });
  },
};

// ─── Com rodapé ───────────────────────────────────────────────────────────────

export const WithFooter: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item3'],
    docs: {
      source: { transform: tableFooterSource },
      description: {
        story:
          'Total no `tfoot`. O rodapé semântico é lido como sumário; a mesma célula no corpo entraria na contagem de registros.',
      },
    },
  },
  render: () => ({
    props: { faturas: INVOICES, total: TOTAL },
    template: `
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption class="nds-sr-only">Faturas recentes com total</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>Fatura</th>
              <th ndsTableHead>Status</th>
              <th ndsTableHead>Método</th>
              <th ndsTableHead class="nds-text-right">Valor</th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            @for (invoice of faturas; track invoice.id) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
                <td ndsTableCell>{{ invoice.status }}</td>
                <td ndsTableCell>{{ invoice.metodo }}</td>
                <td ndsTableCell class="nds-text-right">{{ invoice.value }}</td>
              </tr>
            }
          </tbody>
          <tfoot ndsTableFooter>
            <tr ndsTableRow>
              <td ndsTableCell colspan="3">Total</td>
              <td ndsTableCell class="nds-text-right">{{ total }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O rodapé fica depois do corpo e cobre as três primeiras colunas', async () => {
      // functional.item3 — o `colspan` é o que faz o rótulo "Total" ocupar a
      // largura das colunas descritivas e o valor cair sob a coluna certa.
      const table = canvasElement.querySelector<HTMLElement>('table')!;
      const tfoot = table.querySelector<HTMLElement>('tfoot')!;
      await expect(tfoot).toHaveAttribute('data-slot', 'table-footer');
      const position = table.querySelector('tbody')!.compareDocumentPosition(tfoot);
      await expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      await expect(tfoot.querySelector('td')).toHaveAttribute('colspan', '3');
      await expect(tfoot).toHaveTextContent(TOTAL);
      // O total não é registro: o corpo continua com as mesmas cinco linhas.
      await expect(table.querySelectorAll('tbody tr').length).toBe(INVOICES.length);
    });

    await step('O rodapé se distingue do corpo por fundo próprio', async () => {
      // visual.item3 — `.nds-table tfoot tr` pinta hsl(var(--muted) / 0.5). Sem
      // a distinção o sumário some no meio dos registros.
      const lineFooter = canvasElement.querySelector<HTMLElement>('tfoot tr')!;
      const lineBody = canvasElement.querySelector<HTMLElement>('tbody tr')!;
      await expect(getComputedStyle(lineFooter).backgroundColor).not.toBe(
        getComputedStyle(lineBody).backgroundColor,
      );
    });
  },
};

// ─── Legenda só para leitor de tela ───────────────────────────────────────────

export const CaptionSrOnly: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item2'],
    docs: {
      source: { transform: tableCaptionSrOnlySource },
      description: {
        story:
          'Quando o título já está visível na página, a legenda sai da tela com `nds-sr-only` — mas não do DOM, senão a tabela chega ao leitor sem nome.',
      },
    },
  },
  render: () => ({
    props: { faturas: INVOICES },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <h2 class="nds-text-h3 nds-m-0">Faturas recentes</h2>
        <div ndsTableWrapper>
          <table ndsTable>
            <caption ndsTableCaption class="nds-sr-only">Lista de faturas recentes</caption>
            <thead ndsTableHeader>
              <tr ndsTableRow>
                <th ndsTableHead>Fatura</th>
                <th ndsTableHead>Status</th>
                <th ndsTableHead class="nds-text-right">Valor</th>
              </tr>
            </thead>
            <tbody ndsTableBody>
              @for (invoice of faturas; track invoice.id) {
                <tr ndsTableRow>
                  <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
                  <td ndsTableCell>{{ invoice.status }}</td>
                  <td ndsTableCell class="nds-text-right">{{ invoice.value }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A legenda está no DOM e fora da tela', async () => {
      // functional.item6 — `display: none` tiraria também da árvore de
      // acessibilidade; `nds-sr-only` recorta a caixa e mantém a leitura.
      const caption = canvasElement.querySelector<HTMLElement>('caption')!;
      await expect(caption).toHaveTextContent('Lista de faturas recentes');
      const cs = getComputedStyle(caption);
      await expect(cs.position).toBe('absolute');
      await expect(caption.getBoundingClientRect().height).toBeLessThan(2);
    });

    await step('A tabela continua nomeada para o leitor de tela', async () => {
      // accessibility.item2 — é isto que a legenda invisível existe para
      // garantir; sem ela o leitor anuncia só "tabela".
      await expect(canvas.getByRole('table', { name: /Lista de faturas recentes/ })).toBeTruthy();
    });
  },
};

// ─── Ações por linha ──────────────────────────────────────────────────────────

export const WithRowActions: Story = {
  parameters: {
    covers: ['accessibility.item3', 'visual.item4'],
    docs: {
      source: { transform: tableRowActionsSource },
      description: {
        story:
          'Coluna final com botão ghost por linha. O rótulo acessível carrega o identificador da fatura: fora da linha, "Ações" sozinho não diz de qual registro se trata.',
      },
    },
  },
  render: () => ({
    props: { faturas: INVOICES, variantOf: STATUS_VARIANT },
    template: `
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption class="nds-sr-only">Faturas recentes com ações</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>Fatura</th>
              <th ndsTableHead>Status</th>
              <th ndsTableHead class="nds-text-right">Valor</th>
              <!-- O cabeçalho da coluna de ações não é decorativo: sem ele a
                   coluna existe para quem vê e some para quem navega por
                   cabeçalhos. O rótulo fica só para leitor de tela porque a
                   coluna não tem título visível no desenho. -->
              <th ndsTableHead><span class="nds-sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            @for (invoice of faturas; track invoice.id) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
                <td ndsTableCell>
                  <span ndsBadge [variant]="variantOf[invoice.status]">{{ invoice.status }}</span>
                </td>
                <td ndsTableCell class="nds-text-right">{{ invoice.value }}</td>
                <td ndsTableCell class="nds-text-right">
                  <button
                    ndsButton
                    variant="ghost"
                    size="icon-sm"
                    [attr.aria-label]="'Editar fatura ' + invoice.id"
                  >
                    <svg ndsButtonIcon kind="pencil" class="nds-icon"></svg>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada ação diz a qual fatura pertence', async () => {
      // accessibility.item3 — cinco botões chamados "Editar" seriam cinco
      // controles indistinguíveis na lista de elementos do leitor de tela.
      const buttons = canvas.getAllByRole('button');
      await expect(buttons.length).toBe(INVOICES.length);
      for (const [i, button] of buttons.entries()) {
        await expect(button).toHaveAccessibleName(`Editar fatura ${INVOICES[i].id}`);
        // O botão mora dentro da própria linha do registro que ele edita.
        await expect(button.closest('tr')).toHaveTextContent(INVOICES[i].id);
      }
    });

    await step('O status é um badge, não texto solto', async () => {
      // visual.item4 — o badge é o indicador compacto que o conteúdo
      // compartilhado documenta para status em célula.
      const badges = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="badge"]')];
      await expect(badges.length).toBe(INVOICES.length);
      await expect(badges[0]).toHaveAttribute('data-variant', 'success');
      await expect(badges[2]).toHaveAttribute('data-variant', 'destructive');
    });
  },
};

// ─── Rolagem horizontal ───────────────────────────────────────────────────────

// Dois anos de competência, não um: com doze colunas a tabela ainda cabe num
// canvas largo, e a story provaria a rolagem só nos viewports estreitos.
const MONTHS = ['2025', '2026'].flatMap((year) =>
  ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map(
    (month) => `${month}/${year}`,
  ),
);

export const HorizontalScroll: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: {
      source: { transform: tableHorizontalScrollSource },
      description: {
        story:
          'Tabela mais larga que o container. A rolagem é do wrapper, não da página, e ele é focável para quem navega por teclado.',
      },
    },
  },
  render: () => ({
    props: { months: MONTHS, faturas: INVOICES },
    template: `
      <!-- A legenda nomeia a TABELA; regionLabel nomeia o container que ROLA,
           que é outro elemento e entra sozinho na ordem de tabulação. Sem nome
           o container não recebe papel, e quem chega nele por Tab ouve uma
           parada muda. -->
      <div ndsTableWrapper regionLabel="Faturas por mês de competência">
        <table ndsTable>
          <caption ndsTableCaption class="nds-sr-only">Faturas por mês de competência</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>Fatura</th>
              @for (month of months; track month) {
                <th ndsTableHead>{{ month }}</th>
              }
            </tr>
          </thead>
          <tbody ndsTableBody>
            @for (invoice of faturas; track invoice.id) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
                @for (month of months; track month) {
                  <td ndsTableCell class="nds-text-right">{{ invoice.value }}</td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Quem rola é o container, e ele aceita foco', async () => {
      // functional.item5 — sem o wrapper a tabela empurraria a página inteira
      // para o lado; sem o tabindex a rolagem existiria só para o mouse
      // (axe scrollable-region-focusable, WCAG 2.1.1).
      const wrapper = canvasElement.querySelector<HTMLElement>('[data-slot="table-container"]')!;
      await expect(getComputedStyle(wrapper).overflowX).toBe('auto');
      await expect(wrapper.scrollWidth).toBeGreaterThan(wrapper.clientWidth);
      wrapper.focus();
      await expect(wrapper).toHaveFocus();

      // A parada só é anunciável com PAPEL e NOME: `group` (e não `region`,
      // que viraria marco de página numa tela com várias tabelas) mais o nome
      // do conteúdo, que vem de fora porque o design system não o conhece.
      await expect(wrapper).toHaveAttribute('role', 'group');
      await expect(wrapper).toHaveAccessibleName('Faturas por mês de competência');
    });

    await step('A rolagem chega ao fim da tabela', async () => {
      const wrapper = canvasElement.querySelector<HTMLElement>('[data-slot="table-container"]')!;
      wrapper.scrollLeft = wrapper.scrollWidth;
      await expect(wrapper.scrollLeft).toBeGreaterThan(0);
      // A página não ganhou rolagem própria: o overflow morre no container.
      await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(
        canvasElement.clientWidth + 1,
      );
    });
  },
};

// ─── Linhas expansíveis ───────────────────────────────────────────────────────

// Três registros: cada um vira DUAS linhas irmãs — a de dados e a revelada.
const EXPANDABLE = INVOICES.slice(0, 3);

// A segunda também está MARCADA: aberta e selecionada ao mesmo tempo é o caso
// que o `:not([data-state="selected"])` da folha compartilhada protege.
const SELECTED_ID = EXPANDABLE[1].id;

/** Id da linha revelada, sem o "#": ele quebraria qualquer seletor. */
function detailId(id: string): string {
  return `table-row-detail-${id.replace('#', '')}`;
}

/**
 * Linha expansível, no arquivo de variantes porque ela é FORMA escolhida na
 * montagem — irmã de `WithRowActions`, e não um estado por que a tabela passa.
 *
 * As quatro decisões da forma, e o motivo de cada uma:
 *
 * 1. **`aria-expanded` no BOTÃO, nunca na `<tr>`.** A linha já usa `data-state`
 *    para a SELEÇÃO, e os dois estados coexistem. Quem faz a linha reagir ao
 *    controle é a folha compartilhada, por `tbody tr:has([aria-expanded="true"])`;
 *    o `:has()` existe exatamente para o estado morar no controle e o efeito
 *    acontecer na linha.
 * 2. **A revelada é IRMÃ, sempre no DOM, escondida por `hidden`.** O `id` dela é
 *    o alvo do `aria-controls`, e um alvo que some deixa o atributo apontando
 *    para nada. O `colspan` é das colunas de dado mais a do disclosure.
 * 3. **O leitor de tela anuncia pelo `aria-expanded`.** O nome acessível é do
 *    REGISTRO e não muda: trocar "Mostrar" por "Ocultar" diria a mesma coisa
 *    duas vezes. Nada de live region.
 * 4. **A ordem de foco sai do DOM.** A linha revelada vem imediatamente depois
 *    da linha de dados, então o que ela contém é o próximo ponto de tabulação
 *    depois do controle, sem `tabindex` nenhum.
 */
export const WithExpandableRows: Story = {
  parameters: {
    // Os três itens nasceram nesta mesma rodada, junto com a decisão de que a
    // linha expansível é recurso do Table. O `visual.item7` é o que prova o
    // conserto de cascata: marcada E expandida mantém a cor da seleção.
    covers: ['functional.item8', 'visual.item7', 'accessibility.item5'],
    docs: {
      source: { transform: tableExpandableRowsSource },
      description: {
        story:
          'Cada registro ocupa duas linhas irmãs: a de dados, com o controle de detalhes, e a revelada logo abaixo. O estado mora no botão — `data-state` na linha já é da seleção, e as duas coisas acontecem juntas.',
      },
    },
  },
  render: () => {
    // Signal, e não um Set mutado: o stack é zoneless, e sem sinal a abertura
    // não dispararia detecção nenhuma.
    const expandidas = signal<ReadonlySet<string>>(new Set());
    return {
      props: {
        faturas: EXPANDABLE,
        selectedId: SELECTED_ID,
        expandidas,
        detailId,
        toggle: (id: string) => {
          const next = new Set(expandidas());
          if (next.has(id)) next.delete(id);
          else next.add(id);
          expandidas.set(next);
        },
      },
      template: `
        <div ndsTableWrapper>
          <table ndsTable>
            <caption ndsTableCaption class="nds-sr-only">Faturas recentes com detalhes</caption>
            <thead ndsTableHeader>
              <tr ndsTableRow>
                <!-- A coluna do disclosure vem primeiro e tem cabeçalho: o
                     rótulo sai da tela num span, e não por classe no th, que
                     desmontaria a grade. -->
                <th ndsTableHead><span class="nds-sr-only">Detalhes</span></th>
                <th ndsTableHead>Fatura</th>
                <th ndsTableHead>Status</th>
                <th ndsTableHead>Método</th>
                <th ndsTableHead class="nds-text-right">Valor</th>
              </tr>
            </thead>
            <tbody ndsTableBody>
              @for (invoice of faturas; track invoice.id) {
                <tr ndsTableRow [selected]="invoice.id === selectedId">
                  <td ndsTableCell>
                    <button
                      ndsButton
                      variant="ghost"
                      size="icon-sm"
                      [attr.aria-expanded]="expandidas().has(invoice.id)"
                      [attr.aria-controls]="detailId(invoice.id)"
                      [attr.aria-label]="'Detalhes da fatura ' + invoice.id"
                      (click)="toggle(invoice.id)"
                    >
                      <svg ndsButtonIcon kind="chevron-down" class="nds-chevron"></svg>
                    </button>
                  </td>
                  <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
                  <td ndsTableCell>{{ invoice.status }}</td>
                  <td ndsTableCell>{{ invoice.metodo }}</td>
                  <td ndsTableCell class="nds-text-right">{{ invoice.value }}</td>
                </tr>

                <tr
                  ndsTableRow
                  [attr.id]="detailId(invoice.id)"
                  [hidden]="!expandidas().has(invoice.id)"
                >
                  <td ndsTableCell colspan="5">
                    <div class="nds-stack" data-spacing="sm">
                      <p class="nds-text-muted-foreground">
                        Emitida por {{ invoice.metodo }}, no valor de {{ invoice.value }}.
                      </p>
                      <!-- Um controle dentro do detalhe: é ele que prova que o
                           conteúdo revelado vem depois do disclosure na
                           tabulação — e que some dela quando a linha fecha. -->
                      <button
                        ndsButton
                        variant="outline"
                        size="sm"
                        [attr.aria-label]="'Baixar recibo da fatura ' + invoice.id"
                      >
                        Baixar recibo
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      `,
    };
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const lines = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    const toggles = () => canvas.getAllByRole('button', { name: /^Detalhes da fatura/ });

    // Cada par de linhas é dado + detalhe: 0 dado, 1 detalhe, 2 dado marcado…
    const collapsedBackground = getComputedStyle(lines()[0]).backgroundColor;
    const selectedBackground = getComputedStyle(lines()[2]).backgroundColor;

    await step('Fechada, a linha de detalhe sai da tela e da tabulação', async () => {
      // accessibility.item5 — o controle declara `aria-expanded` e aponta a
      // linha revelada por `aria-controls`.
      await expect(lines().length).toBe(EXPANDABLE.length * 2);
      for (const [i, toggle] of toggles().entries()) {
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle).toHaveAttribute('aria-controls', lines()[i * 2 + 1].id);
        // O detalhe atravessa as colunas de dado MAIS a do disclosure.
        const celula = lines()[i * 2 + 1].querySelector('td')!;
        await expect(celula).toHaveAttribute('colspan', '5');
      }
      // O `hidden` poderia ser apagado por host binding de diretiva, e nenhum
      // compilador alcança isso: quem responde é o computado.
      await expect(getComputedStyle(lines()[1]).display).toBe('none');
      await expect(canvas.queryAllByRole('button', { name: /^Baixar recibo/ }).length).toBe(0);
    });

    await step('Enter no controle abre a linha irmã, e o nome não muda', async () => {
      // Teclado, e não clique: o ponteiro deixaria a linha em `:hover`, que
      // pinta com a MESMA cor da regra que este teste existe para provar — a
      // asserção do fundo passaria com ou sem o recurso.
      toggles()[0].focus();
      await userEvent.keyboard('{Enter}');

      // functional.item8 — o controle troca `aria-expanded` e a irmã entra.
      await expect(toggles()[0]).toHaveAttribute('aria-expanded', 'true');
      await expect(getComputedStyle(lines()[1]).display).not.toBe('none');
      await expect(lines()[1].getBoundingClientRect().height).toBeGreaterThan(0);
      // Quem anuncia o estado é o `aria-expanded`; o nome continua sendo o do
      // registro, nos dois sentidos da alternância.
      await expect(toggles()[0]).toHaveAccessibleName(
        `Detalhes da fatura ${EXPANDABLE[0].id}`,
      );
    });

    await step('O conteúdo revelado é o próximo ponto de tabulação', async () => {
      // A linha irmã vem logo depois da linha de dados no DOM: a ordem de foco
      // sai daí, sem `tabindex` nenhum.
      await userEvent.tab();
      await expect(
        canvas.getByRole('button', { name: `Baixar recibo da fatura ${EXPANDABLE[0].id}` }),
      ).toHaveFocus();
    });

    await step('A linha expandida muda de fundo', async () => {
      // visual.item7 — é o contrato da folha compartilhada
      // (`:has([aria-expanded="true"])`), que até esta rodada não tinha produtor
      // em stack nenhuma.
      const expandedBackground = getComputedStyle(lines()[0]).backgroundColor;
      await expect(expandedBackground).not.toBe(collapsedBackground);
      await expect(expandedBackground).not.toBe('rgba(0, 0, 0, 0)');
      // A terceira continua fechada: a mudança é da linha aberta, não da tabela.
      await expect(getComputedStyle(lines()[4]).backgroundColor).toBe(collapsedBackground);
    });

    await step('Marcada e expandida ao mesmo tempo: a cor da seleção vence', async () => {
      // Os três seletores de fundo são (0,2,2) — sem o `:not([data-state="selected"])`
      // a regra do disclosure é a última do arquivo e rebaixaria a linha marcada
      // ao tom claro do hover.
      toggles()[1].focus();
      await userEvent.keyboard('{Enter}');

      await expect(toggles()[1]).toHaveAttribute('aria-expanded', 'true');
      await expect(getComputedStyle(lines()[3]).display).not.toBe('none');
      await expect(getComputedStyle(lines()[2]).backgroundColor).toBe(selectedBackground);
      await expect(getComputedStyle(lines()[2]).backgroundColor).not.toBe(
        getComputedStyle(lines()[0]).backgroundColor,
      );
    });

    await step('Enter de novo fecha, e tudo volta ao estado anterior', async () => {
      toggles()[0].focus();
      await userEvent.keyboard('{Enter}');

      await expect(toggles()[0]).toHaveAttribute('aria-expanded', 'false');
      await expect(getComputedStyle(lines()[1]).display).toBe('none');
      await expect(getComputedStyle(lines()[0]).backgroundColor).toBe(collapsedBackground);
      await expect(canvas.queryAllByRole('button', { name: /^Baixar recibo/ }).length).toBe(1);
    });
  },
};
