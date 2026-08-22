import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
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

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Table/Variants',
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
            @for (fatura of faturas; track fatura.id) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ fatura.id }}</td>
                <td ndsTableCell>{{ fatura.status }}</td>
                <td ndsTableCell>{{ fatura.metodo }}</td>
                <td ndsTableCell class="nds-text-right">{{ fatura.valor }}</td>
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
      const linhas = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(linhas.length).toBe(INVOICES.length);
      for (const [i, linha] of linhas.entries()) {
        await expect(linha).toHaveAttribute('data-slot', 'table-row');
        await expect(linha.querySelectorAll('td').length).toBe(4);
        await expect(linha).toHaveTextContent(INVOICES[i].id);
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
      const tabela = canvas.getByRole('table', { name: /faturas recentes/ });
      const caption = tabela.querySelector<HTMLElement>('caption')!;
      await expect(caption.classList.contains('nds-sr-only')).toBe(false);
    });
  },
};

// ─── Com rodapé ───────────────────────────────────────────────────────────────

export const WithFooter: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item3'],
    docs: {
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
            @for (fatura of faturas; track fatura.id) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ fatura.id }}</td>
                <td ndsTableCell>{{ fatura.status }}</td>
                <td ndsTableCell>{{ fatura.metodo }}</td>
                <td ndsTableCell class="nds-text-right">{{ fatura.valor }}</td>
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
      const tabela = canvasElement.querySelector<HTMLElement>('table')!;
      const tfoot = tabela.querySelector<HTMLElement>('tfoot')!;
      await expect(tfoot).toHaveAttribute('data-slot', 'table-footer');
      const position = tabela.querySelector('tbody')!.compareDocumentPosition(tfoot);
      await expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      await expect(tfoot.querySelector('td')).toHaveAttribute('colspan', '3');
      await expect(tfoot).toHaveTextContent(TOTAL);
      // O total não é registro: o corpo continua com as mesmas cinco linhas.
      await expect(tabela.querySelectorAll('tbody tr').length).toBe(INVOICES.length);
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
              @for (fatura of faturas; track fatura.id) {
                <tr ndsTableRow>
                  <td ndsTableCell class="nds-font-medium">{{ fatura.id }}</td>
                  <td ndsTableCell>{{ fatura.status }}</td>
                  <td ndsTableCell class="nds-text-right">{{ fatura.valor }}</td>
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
      description: {
        story:
          'Coluna final com botão ghost por linha. O rótulo acessível carrega o identificador da fatura: fora da linha, "Ações" sozinho não diz de qual registro se trata.',
      },
    },
  },
  render: () => ({
    props: { faturas: INVOICES, varianteDe: STATUS_VARIANT },
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
            @for (fatura of faturas; track fatura.id) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ fatura.id }}</td>
                <td ndsTableCell>
                  <span ndsBadge [variant]="varianteDe[fatura.status]">{{ fatura.status }}</span>
                </td>
                <td ndsTableCell class="nds-text-right">{{ fatura.valor }}</td>
                <td ndsTableCell class="nds-text-right">
                  <button
                    ndsButton
                    variant="ghost"
                    size="icon-sm"
                    [attr.aria-label]="'Editar fatura ' + fatura.id"
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
      const botoes = canvas.getAllByRole('button');
      await expect(botoes.length).toBe(INVOICES.length);
      for (const [i, botao] of botoes.entries()) {
        await expect(botao).toHaveAccessibleName(`Editar fatura ${INVOICES[i].id}`);
        // O botão mora dentro da própria linha do registro que ele edita.
        await expect(botao.closest('tr')).toHaveTextContent(INVOICES[i].id);
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
const MONTHS = ['2025', '2026'].flatMap((ano) =>
  ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map(
    (mes) => `${mes}/${ano}`,
  ),
);

export const HorizontalScroll: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: {
      description: {
        story:
          'Tabela mais larga que o container. A rolagem é do wrapper, não da página, e ele é focável para quem navega por teclado.',
      },
    },
  },
  render: () => ({
    props: { meses: MONTHS, faturas: INVOICES },
    template: `
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption class="nds-sr-only">Faturas por mês de competência</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>Fatura</th>
              @for (mes of meses; track mes) {
                <th ndsTableHead>{{ mes }}</th>
              }
            </tr>
          </thead>
          <tbody ndsTableBody>
            @for (fatura of faturas; track fatura.id) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ fatura.id }}</td>
                @for (mes of meses; track mes) {
                  <td ndsTableCell class="nds-text-right">{{ fatura.valor }}</td>
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
