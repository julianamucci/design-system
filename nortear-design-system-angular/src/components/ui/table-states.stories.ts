import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import {
  NdsTable,
  NdsTableBody,
  NdsTableCaption,
  NdsTableCell,
  NdsTableHead,
  NdsTableHeader,
  NdsTableRow,
  NdsTableWrapper,
} from './table';
import { NdsSkeleton } from './skeleton';
import { animationAtiva, backgroundDistincao } from '@shared/testing/skeleton-probe';
import { INVOICES } from './table.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Table/States',
  tags: ['tables'],
  decorators: [
    moduleMetadata({
      imports: [
        NdsTableWrapper,
        NdsTable,
        NdsTableCaption,
        NdsTableHeader,
        NdsTableBody,
        NdsTableRow,
        NdsTableHead,
        NdsTableCell,
        NdsSkeleton,
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
          'Os três estados que uma tabela de dados atravessa: carregando, sem resultado e com linha selecionada.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const COLUMNS = ['Fatura', 'Status', 'Método', 'Valor'];

// ─── Vazio ────────────────────────────────────────────────────────────────────

export const Empty: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item2'],
    docs: {
      description: {
        story:
          'Sem dados, uma única linha com `colspan` cobrindo todas as colunas. Tabela vazia e muda deixa a pessoa sem saber se é erro ou ausência de resultado.',
      },
    },
  },
  render: () => ({
    props: { colunas: COLUMNS },
    template: `
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption class="nds-sr-only">Lista de faturas recentes</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              @for (coluna of colunas; track coluna) {
                <th ndsTableHead>{{ coluna }}</th>
              }
            </tr>
          </thead>
          <tbody ndsTableBody>
            <tr ndsTableRow>
              <!-- colspan derivado do cabeçalho: com um número escrito à mão,
                   acrescentar uma coluna deixaria a mensagem torta e ninguém
                   veria até a próxima captura visual. -->
              <td
                ndsTableCell
                [attr.colspan]="colunas.length"
                class="nds-text-center nds-text-muted-foreground"
              >
                Nenhuma fatura encontrada.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A mensagem ocupa a largura inteira da tabela', async () => {
      // functional.item2 — sem o colspan a mensagem cairia sob a primeira
      // coluna e as outras três ficariam vazias, como se faltassem dados.
      const celula = canvasElement.querySelector<HTMLTableCellElement>('tbody td')!;
      await expect(celula).toHaveAttribute('colspan', String(COLUMNS.length));
      await expect(celula).toHaveTextContent('Nenhuma fatura encontrada.');
      await expect(canvasElement.querySelectorAll('tbody tr').length).toBe(1);
    });

    await step('A tabela continua nomeada e com os cabeçalhos no lugar', async () => {
      // Estado vazio não é motivo para desmontar a estrutura: quem usa leitor de
      // tela precisa saber que colunas voltarão a existir quando houver dados.
      await expect(canvas.getByRole('table', { name: /faturas recentes/ })).toBeTruthy();
      await expect(canvasElement.querySelectorAll('th').length).toBe(COLUMNS.length);
    });

    await step('A mensagem é discreta e centralizada', async () => {
      // visual.item2 — `nds-text-center` + `nds-text-muted-foreground` são o que
      // diferencia "sem resultado" de um dado real. Em `td` as utilitárias
      // valem: só `th` tem `text-align` próprio no CSS compartilhado.
      const celula = canvasElement.querySelector<HTMLElement>('tbody td')!;
      await expect(getComputedStyle(celula).textAlign).toBe('center');
    });
  },
};

// ─── Linha selecionada ────────────────────────────────────────────────────────

export const SelectedRow: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item5'],
    docs: {
      description: {
        story:
          'A linha marcada recebe `data-state="selected"`. As duas formas de chegar lá convivem: o input `selected` e o atributo escrito à mão.',
      },
    },
  },
  render: () => ({
    props: { faturas: INVOICES },
    template: `
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption class="nds-sr-only">Lista de faturas recentes</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>Fatura</th>
              <th ndsTableHead>Status</th>
              <th ndsTableHead>Método</th>
              <th ndsTableHead class="nds-text-right">Valor</th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            <!-- Duas formas de marcar a mesma coisa, de propósito: as linhas do
                 laço usam o input da diretiva; a última escreve o atributo
                 direto, como as outras stacks fazem nas fixtures. Se o host
                 binding apagasse o atributo escrito, esta story ficaria
                 vermelha em vez de o defeito aparecer só na tela. -->
            @for (fatura of faturas; track fatura.id; let i = $index) {
              <tr ndsTableRow [selected]="i === 1">
                <td ndsTableCell class="nds-font-medium">{{ fatura.id }}</td>
                <td ndsTableCell>{{ fatura.status }}</td>
                <td ndsTableCell>{{ fatura.metodo }}</td>
                <td ndsTableCell class="nds-text-right">{{ fatura.valor }}</td>
              </tr>
            }
            <tr ndsTableRow data-state="selected">
              <td ndsTableCell class="nds-font-medium">#INV-006</td>
              <td ndsTableCell>Pendente</td>
              <td ndsTableCell>Pix</td>
              <td ndsTableCell class="nds-text-right">R$ 90,00</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('As duas formas de marcar produzem o mesmo estado', async () => {
      // functional.item4 — e prova, de quebra, que o input chegou ao template:
      // sob o fallback JIT o binding cai em silêncio e a linha nasceria sem
      // atributo nenhum (armadilha 1 do CLAUDE.md do stack).
      const linhas = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(linhas.length).toBe(INVOICES.length + 1);
      await expect(linhas[1]).toHaveAttribute('data-state', 'selected');
      await expect(linhas[linhas.length - 1]).toHaveAttribute('data-state', 'selected');
      for (const i of [0, 2, 3, 4]) {
        await expect(linhas[i].hasAttribute('data-state')).toBe(false);
      }
    });

    await step('A linha marcada se destaca das demais', async () => {
      // visual.item5 — `.nds-table tbody tr[data-state="selected"]` pinta
      // hsl(var(--muted)). Sem contraste, a seleção existe só no estado interno.
      const linhas = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(getComputedStyle(linhas[1]).backgroundColor).not.toBe(
        getComputedStyle(linhas[0]).backgroundColor,
      );
      await expect(getComputedStyle(linhas[linhas.length - 1]).backgroundColor).toBe(
        getComputedStyle(linhas[1]).backgroundColor,
      );
    });
  },
};

// ─── Carregando ───────────────────────────────────────────────────────────────

const LINES_SKELETON = [1, 2, 3];

export const Loading: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item6'],
    docs: {
      description: {
        story:
          'Durante a busca, as células de dado viram esqueletos com a caixa aproximada do conteúdo esperado. Quem anuncia o carregamento é a região, nunca o esqueleto.',
      },
    },
  },
  render: () => ({
    props: { linhas: LINES_SKELETON, colunas: COLUMNS },
    template: `
      <!-- aria-busy na REGIÃO, não na célula: o esqueleto é aria-hidden, e sem o
           container quem usa leitor de tela ouve uma tabela vazia sem saber que
           os dados estão a caminho. -->
      <div role="status" aria-busy="true" aria-label="Carregando faturas">
        <div ndsTableWrapper>
          <table ndsTable>
            <caption ndsTableCaption class="nds-sr-only">Lista de faturas recentes</caption>
            <thead ndsTableHeader>
              <tr ndsTableRow>
                @for (coluna of colunas; track coluna) {
                  <th ndsTableHead>{{ coluna }}</th>
                }
              </tr>
            </thead>
            <tbody ndsTableBody>
              @for (linha of linhas; track linha) {
                <tr ndsTableRow>
                  @for (coluna of colunas; track coluna) {
                    <td ndsTableCell>
                      <!-- Forma por atributo, nunca altura cravada: o esqueleto
                           de uma linha mede o que a linha vai medir quando o
                           texto chegar, e cresce junto com a fonte do
                           navegador (guideline 12, WCAG 1.4.4). -->
                      <div ndsSkeleton data-shape="text" data-width="3-4"></div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Uma célula de esqueleto por coluna, em cada linha', async () => {
      // visual.item6 — o esqueleto mede a caixa que o dado vai ocupar; a grade
      // não pode encolher enquanto carrega, senão a tabela salta ao chegar.
      const linhas = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(linhas.length).toBe(LINES_SKELETON.length);
      for (const linha of linhas) {
        await expect(linha.querySelectorAll('[data-slot="skeleton"]').length).toBe(
          COLUMNS.length,
        );
      }
      await expect(canvasElement.querySelectorAll('thead th').length).toBe(COLUMNS.length);
    });

    await step('O esqueleto some da árvore de acessibilidade; a região anuncia', async () => {
      // O par é sempre este: esqueleto `aria-hidden` dentro de região com nome e
      // `aria-busy`. Esqueleto anunciado seria ruído; região sem nome não seria
      // anunciada de jeito nenhum.
      const regiao = canvasElement.querySelector<HTMLElement>('[aria-busy="true"]')!;
      await expect(regiao).toHaveAttribute('role', 'status');
      await expect(regiao).toHaveAttribute('aria-label', 'Carregando faturas');
      for (const sk of canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')) {
        await expect(sk).toHaveAttribute('aria-hidden', 'true');
        await expect(sk.getBoundingClientRect().height).toBeGreaterThan(0);
      }
    });

    await step('O esqueleto pinta de verdade dentro da célula', async () => {
      // Ocupar espaço não é aparecer. Um esqueleto que recebe só as classes de
      // MEDIDA desenha um retângulo invisível, e o markup não denuncia — foi o
      // defeito da rodada do sidebar. Quem responde é o computado: fundo
      // distinguível do container e pulso rodando de fato.
      //
      // Mesmo piso e mesmo colhedor do skeleton-estados: dois números para a
      // mesma pergunta divergem na primeira correção.
      const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;
      await expect(backgroundDistincao(sk).ratio).toBeGreaterThan(1.05);
      await expect(animationAtiva(sk)).toBe(true);
    });
  },
};
