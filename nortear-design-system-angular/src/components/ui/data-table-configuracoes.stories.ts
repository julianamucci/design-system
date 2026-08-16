import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NdsDataTable } from './data-table';
import { COLUNAS_FATURAS, FATURAS_DT, ROTULOS_DT, type FaturaDT } from './data-table.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/DataTable/Settings',
  tags: ['tables'],
  decorators: [moduleMetadata({ imports: [NdsDataTable] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Ajustes que mudam quanta tabela cabe na tela de uma vez — hoje, o recorte por página e a navegação entre elas.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Doze faturas em páginas de cinco: três páginas, a última incompleta. */
const TAMANHO_DE_PAGINA = 5;
const TOTAL_DE_PAGINAS = Math.ceil(FATURAS_DT.length / TAMANHO_DE_PAGINA);

// ─── Paginação ────────────────────────────────────────────────────────────────

export const Paginated: Story = {
  parameters: {
    covers: ['functional.item8'],
    docs: {
      description: {
        story:
          'Quatro botões no rodapé: primeira, anterior, próxima e última. Nos extremos os dois do lado sem saída desabilitam — um botão que continua vivo e não leva a lugar nenhum é uma promessa quebrada.',
      },
    },
  },
  render: () => ({
    props: {
      colunas: COLUNAS_FATURAS,
      faturas: FATURAS_DT,
      rotulos: ROTULOS_DT,
      tamanho: TAMANHO_DE_PAGINA,
    },
    template: `
      <div
        ndsDataTable
        caption="Faturas recentes"
        [columns]="colunas"
        [data]="faturas"
        [labels]="rotulos"
        [enableGlobalFilter]="false"
        [pageSize]="tamanho"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const linhas = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    /** Identificador da primeira linha da página — o que prova qual fatia está na tela. */
    const primeiraFatura = () => linhas()[0].textContent!.trim();

    const primeira = () => canvas.getByRole('button', { name: 'Primeira página' }) as HTMLButtonElement;
    const anterior = () => canvas.getByRole('button', { name: 'Página anterior' }) as HTMLButtonElement;
    const proxima = () => canvas.getByRole('button', { name: 'Próxima página' }) as HTMLButtonElement;
    const ultima = () => canvas.getByRole('button', { name: 'Última página' }) as HTMLButtonElement;

    await step('A tabela abre na primeira página, com os dois botões de volta apagados', async () => {
      // Clicar num botão desabilitado é impossível para quem usa — o CSS lhe
      // tira o `pointer-events`. Então o teste AFIRMA a propriedade em vez de
      // tentar o clique: um clique forçado provaria algo que ninguém consegue.
      await expect(linhas().length).toBe(TAMANHO_DE_PAGINA);
      await expect(primeiraFatura()).toContain('#INV-001');
      await expect(canvas.getByText(`Página 1 de ${TOTAL_DE_PAGINAS}`)).toBeInTheDocument();

      await expect(primeira()).toBeDisabled();
      await expect(anterior()).toBeDisabled();
      await expect(proxima()).toBeEnabled();
      await expect(ultima()).toBeEnabled();
    });

    await step('Avançar uma página troca a fatia de linhas', async () => {
      // functional.item8 — o número da página mudar não bastaria: um rodapé
      // pode contar errado e mostrar sempre as mesmas linhas. A prova é a
      // primeira fatura da página ser outra.
      const botao = proxima();
      await userEvent.click(botao);

      await waitFor(async () => {
        await expect(primeiraFatura()).toContain('#INV-006');
      });
      await expect(canvas.getByText(`Página 2 de ${TOTAL_DE_PAGINAS}`)).toBeInTheDocument();
      // No meio do caminho os quatro estão vivos: há para onde ir dos dois lados.
      await expect(primeira()).toBeEnabled();
      await expect(anterior()).toBeEnabled();
      await expect(ultima()).toBeEnabled();
    });

    await step('O salto para a última página respeita a fatia incompleta', async () => {
      const botao = ultima();
      await userEvent.click(botao);

      await waitFor(async () => {
        await expect(primeiraFatura()).toContain('#INV-011');
      });
      // Doze faturas em páginas de cinco deixam duas na última — número
      // derivado da fixture, nunca escrito à mão.
      await expect(linhas().length).toBe(FATURAS_DT.length % TAMANHO_DE_PAGINA);
      await expect(canvas.getByText(`Página ${TOTAL_DE_PAGINAS} de ${TOTAL_DE_PAGINAS}`))
        .toBeInTheDocument();

      await expect(proxima()).toBeDisabled();
      await expect(ultima()).toBeDisabled();
      await expect(anterior()).toBeEnabled();
    });

    await step('Retroceder uma página é o caminho inverso do avanço', async () => {
      const botao = anterior();
      await userEvent.click(botao);

      await waitFor(async () => {
        await expect(primeiraFatura()).toContain('#INV-006');
      });
      await expect(canvas.getByText(`Página 2 de ${TOTAL_DE_PAGINAS}`)).toBeInTheDocument();
    });

    await step('O salto para a primeira página devolve o estado de entrada', async () => {
      // Fecha o ciclo e deixa a tela como a encontrou: a rodada seguinte — e a
      // captura de regressão visual — partem da página 1.
      const botao = primeira();
      await userEvent.click(botao);

      await waitFor(async () => {
        await expect(primeiraFatura()).toContain('#INV-001');
      });
      await expect(primeira()).toBeDisabled();
      await expect(anterior()).toBeDisabled();
    });
  },
};

// ─── Rótulo de linha explícito ───────────────────────────────────────────────

/**
 * O primeiro degrau do fallback: quem monta a tabela diz qual campo identifica a
 * linha. O Playground prova o degrau do meio (o identificador sai da primeira
 * coluna); aqui a escolha é explícita e vence a primeira coluna.
 */
export const ExplicitRowLabel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Quando a coluna que identifica a linha para quem enxerga não é a primeira, o rótulo do controle de seleção passa a sair do campo escolhido — e continua sendo um nome por linha, nunca um nome repetido.',
      },
    },
  },
  render: () => ({
    props: {
      colunas: COLUNAS_FATURAS,
      faturas: FATURAS_DT,
      rotulos: ROTULOS_DT,
      chaveDaFatura: (f: FaturaDT) => f.id,
      rotuloDaFatura: (f: FaturaDT) => f.cliente,
    },
    template: `
      <div
        ndsDataTable
        caption="Faturas recentes"
        [columns]="colunas"
        [data]="faturas"
        [labels]="rotulos"
        [rowKey]="chaveDaFatura"
        [rowLabel]="rotuloDaFatura"
        [enableRowSelection]="true"
        [enableGlobalFilter]="false"
        [enablePagination]="false"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const linhas = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    const caixaDaLinha = (linha: HTMLElement) =>
      linha.querySelector<HTMLElement>('button[role="checkbox"]')!;
    /** Terceira célula: a coluna "Cliente", de onde `rowLabel` tira o texto. */
    const cliente = (linha: HTMLElement) =>
      linha.querySelectorAll('td')[2]!.textContent!.trim();

    await step('O nome do controle sai de rowLabel, e não da primeira coluna', async () => {
      // A prova precisa do CONTRASTE: se `rowLabel` fosse ignorado, o nome
      // cairia no identificador da primeira coluna ("#INV-001") e a asserção
      // seguinte reprovaria.
      for (const linha of linhas()) {
        await expect(caixaDaLinha(linha)).toHaveAttribute(
          'aria-label',
          `Selecionar fatura ${cliente(linha)}`,
        );
      }
    });

    await step('Nenhuma linha repete o nome de outra', async () => {
      const nomes = linhas().map((l) => caixaDaLinha(l).getAttribute('aria-label') ?? '');
      await expect(nomes.length).toBe(FATURAS_DT.length);
      await expect(new Set(nomes).size).toBe(nomes.length);
    });
  },
};
