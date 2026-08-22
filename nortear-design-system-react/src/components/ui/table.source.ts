/**
 * Transforms do painel Code do Table.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories leem de fora é andaime e não entra no snippet: `INVOICES` e
 * `TOTAL` moram no módulo de fixtures (o total é DERIVADO ali para não mentir
 * quando alguém acrescenta uma linha), e o painel imprimia `{INVOICES.map(...)}`
 * sem declarar `INVOICES` em lugar nenhum — quem copiava recebia um erro de
 * compilação. Aqui os dados são declarados DENTRO do snippet, e o total é
 * escrito por extenso porque o snippet mostra três registros, não os cinco da
 * fixture.
 *
 * A decisão de composição é a tabela nativa inteira: `caption`, `thead`,
 * `tbody` e, quando há sumário, `tfoot`. Nenhum desses pedaços é decorativo —
 * é a tag que faz o leitor de tela anunciar "tabela, 4 colunas", e o
 * `.nds-table-wrapper` com `tabIndex` já vem do próprio componente `Table`.
 */
import type { SourceTransform } from '@/lib/story-source';

export type TableArgs = {
  captionVisivel: boolean;
  comRodape: boolean;
};

const LEGENDA = 'Lista de faturas recentes';

/** Bloco de import do componente, em ordem alfabética das peças usadas. */
function importingTable(...pecas: string[]): string {
  const lista = [...pecas].sort();
  return `import {\n${lista.map((peca) => `  ${peca},`).join('\n')}\n} from "@/components/ui/table";`;
}

/**
 * Os dados vêm de fora — aqui um recorte, só para a tabela ter o que mostrar.
 * O valor é string formatada de propósito: o snippet ensina a montagem da
 * tabela, e uma conversão de moeda no meio dela roubaria a atenção do assunto.
 */
const DADOS = `const invoices = [
  { id: "#INV-001", status: "Pago", method: "Cartão de crédito", amount: "R$ 250,00" },
  { id: "#INV-002", status: "Pendente", method: "Boleto bancário", amount: "R$ 150,00" },
  { id: "#INV-003", status: "Cancelado", method: "Pix", amount: "R$ 350,00" },
];`;

/** Soma dos três registros acima, na grafia pt-BR do resto do conteúdo. */
const TOTAL = 'R$ 750,00';

/** Cabeçalho de quatro colunas, com a numérica alinhada à direita. */
const CABECALHO = `  <TableHeader>
    <TableRow>
      <TableHead>Fatura</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Método</TableHead>
      <TableHead className="nds-text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>`;

/**
 * Corpo mapeado sobre os dados — é assim que a tabela é escrita de verdade.
 *
 * A `key` é o identificador do registro, e não o índice: reordenar a lista com
 * `key={i}` faz o React reaproveitar a linha errada.
 */
const CORPO = `  <TableBody>
    {invoices.map((invoice) => (
      <TableRow key={invoice.id}>
        <TableCell className="nds-font-medium">{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell>{invoice.method}</TableCell>
        <TableCell className="nds-text-right">{invoice.amount}</TableCell>
      </TableRow>
    ))}
  </TableBody>`;

/**
 * Rodapé de sumário. O `colSpan` é o que faz o rótulo ocupar as colunas
 * descritivas e o valor cair exatamente sob a coluna que ele soma.
 */
const RODAPE = `  <TableFooter>
    <TableRow>
      <TableCell colSpan={3}>Total</TableCell>
      <TableCell className="nds-text-right">${TOTAL}</TableCell>
    </TableRow>
  </TableFooter>`;

/**
 * A legenda NUNCA sai do DOM: é ela que dá nome à tabela para o leitor de tela.
 * O que muda é ficar ou não visível, e `nds-sr-only` recorta a caixa sem tirar
 * da árvore de acessibilidade — `display: none` tiraria das duas.
 */
function legenda(visivel: boolean, texto = LEGENDA): string {
  const classe = visivel ? '' : ' className="nds-sr-only"';
  return `  <TableCaption${classe}>${texto}</TableCaption>`;
}

/** Junta as seções dentro de uma `<Table>`, descartando as ausentes. */
function tabela(...secoes: Array<string | false | null | undefined>): string {
  const corpo = secoes.filter((secao): secao is string => Boolean(secao)).join('\n');
  return `<Table>\n${corpo}\n</Table>`;
}

const IMPORT_COMPLETO = importingTable(
  'Table',
  'TableBody',
  'TableCaption',
  'TableCell',
  'TableFooter',
  'TableHead',
  'TableHeader',
  'TableRow',
);

const IMPORT_SEM_RODAPE = importingTable(
  'Table',
  'TableBody',
  'TableCaption',
  'TableCell',
  'TableHead',
  'TableHeader',
  'TableRow',
);

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os dois
 * controls do Playground: a legenda visível ou só para leitor de tela, e a
 * presença do rodapé de sumário.
 *
 * Sem args (as stories de variantes e estados não têm nenhum) cai na tabela
 * completa com legenda invisível, que é o caso mais comum: a tabela já tem um
 * título na página, e repetir o texto acima dela duplicaria a informação para
 * quem vê sem acrescentar nada para quem ouve.
 */
export const tableSource: SourceTransform<TableArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const comRodape = args.comRodape !== false;
  return `${comRodape ? IMPORT_COMPLETO : IMPORT_SEM_RODAPE}

${DADOS}

${tabela(legenda(args.captionVisivel === true), CABECALHO, CORPO, comRodape && RODAPE)}`;
};

/**
 * Tabela básica: legenda visível e nenhum sumário. É a forma mínima que ainda
 * cumpre o contrato — sem `caption` a tabela chega ao leitor de tela sem nome,
 * e "tabela, 4 colunas" não diz de quê.
 */
export function tableBasicaSource(): string {
  return `${IMPORT_SEM_RODAPE}

${DADOS}

${tabela(legenda(true), CABECALHO, CORPO)}`;
}

/**
 * Legenda só para leitor de tela, ao lado de um título visível na página.
 *
 * É o par que justifica a classe: o `<h2>` nomeia a seção para quem vê e a
 * legenda nomeia a TABELA para quem ouve. Sem o título por perto, esconder a
 * legenda é só esconder informação.
 */
export function tableLegendaOcultaSource(): string {
  const dados = `const invoices = [
  { id: "#INV-001", status: "Pago", amount: "R$ 250,00" },
  { id: "#INV-002", status: "Pendente", amount: "R$ 150,00" },
  { id: "#INV-003", status: "Cancelado", amount: "R$ 350,00" },
];`;

  return `${IMPORT_SEM_RODAPE}

${dados}

<div className="nds-stack" data-spacing="sm">
  <h2 className="nds-text-h3 nds-m-0">Faturas recentes</h2>
  <Table>
    <TableCaption className="nds-sr-only">${LEGENDA}</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead>Fatura</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="nds-text-right">Valor</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {invoices.map((invoice) => (
        <TableRow key={invoice.id}>
          <TableCell className="nds-font-medium">{invoice.id}</TableCell>
          <TableCell>{invoice.status}</TableCell>
          <TableCell className="nds-text-right">{invoice.amount}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>`;
}

/**
 * Coluna de ações por linha.
 *
 * Duas decisões que o desenho não mostra: o cabeçalho da coluna existe e é
 * apenas invisível — sem ele a coluna some para quem navega por cabeçalhos —, e
 * cada botão diz A QUAL registro pertence. Cinco botões chamados "Ações" seriam
 * cinco controles indistinguíveis na lista do leitor de tela, e o ícone não
 * nomeia nada: ele é `aria-hidden`.
 */
export function lineSourceTableActions(): string {
  return `${IMPORT_SEM_RODAPE}
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

${DADOS}

<Table>
  <TableCaption className="nds-sr-only">Faturas recentes com ações</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Fatura</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Método</TableHead>
      <TableHead className="nds-text-right">Valor</TableHead>
      <TableHead>
        <span className="nds-sr-only">Ações</span>
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {invoices.map((invoice) => (
      <TableRow key={invoice.id}>
        <TableCell className="nds-font-medium">{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell>{invoice.method}</TableCell>
        <TableCell className="nds-text-right">{invoice.amount}</TableCell>
        <TableCell className="nds-text-right">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={"Ações para fatura " + invoice.id}
          >
            <MoreHorizontal className="nds-icon" aria-hidden="true" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`;
}

/**
 * Tabela larga demais para a caixa. Não há prop nenhuma a escrever: quem rola é
 * o contêiner que o próprio `Table` monta, já com `tabIndex` para que a rolagem
 * exista também para quem navega sem mouse (WCAG 2.1.1). O que o snippet mostra
 * é o que PROVOCA a rolagem — muitas colunas —, e não um ajuste a fazer.
 */
export function tableRolagemHorizontalSource(): string {
  return `${IMPORT_SEM_RODAPE}

${DADOS}

const meses = ["2025", "2026"].flatMap((ano) =>
  ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map(
    (mes) => mes + "/" + ano,
  ),
);

<Table>
  <TableCaption className="nds-sr-only">Faturas por mês de competência</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Fatura</TableHead>
      {meses.map((mes) => (
        <TableHead key={mes}>{mes}</TableHead>
      ))}
    </TableRow>
  </TableHeader>
  <TableBody>
    {invoices.map((invoice) => (
      <TableRow key={invoice.id}>
        <TableCell className="nds-font-medium">{invoice.id}</TableCell>
        {meses.map((mes) => (
          <TableCell key={mes} className="nds-text-right">
            {invoice.amount}
          </TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
</Table>`;
}

/**
 * Conjunto vazio.
 *
 * A estrutura NÃO é desmontada: cabeçalho e legenda continuam ali, porque quem
 * usa leitor de tela precisa saber que colunas voltarão a existir quando houver
 * dados. O `colSpan` sai do tamanho da lista de colunas — escrito à mão, ele
 * deixaria a mensagem torta na próxima coluna acrescentada.
 */
export function tableVaziaSource(): string {
  return `${IMPORT_SEM_RODAPE}

const colunas = ["Fatura", "Status", "Método", "Valor"];

<Table>
  <TableCaption className="nds-sr-only">${LEGENDA}</TableCaption>
  <TableHeader>
    <TableRow>
      {colunas.map((coluna) => (
        <TableHead key={coluna}>{coluna}</TableHead>
      ))}
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell colSpan={colunas.length} className="nds-table-empty">
        Nenhuma fatura encontrada.
      </TableCell>
    </TableRow>
  </TableBody>
</Table>`;
}

/**
 * Linha selecionada. O estado é do `<tr>`, e é ele que o CSS compartilhado
 * pinta — marcar a célula não pintaria a linha. O atributo só existe quando é
 * verdade: `null` apaga o atributo no React, e escrever `data-state="none"`
 * faria o seletor `[data-state]` casar a linha errada.
 */
export function tableLinhaSelecionadaSource(): string {
  return `${IMPORT_SEM_RODAPE}

${DADOS}

const selecionada = "#INV-002";

<Table>
  <TableCaption className="nds-sr-only">${LEGENDA}</TableCaption>
${CABECALHO}
  <TableBody>
    {invoices.map((invoice) => (
      <TableRow
        key={invoice.id}
        data-state={invoice.id === selecionada ? "selected" : null}
      >
        <TableCell className="nds-font-medium">{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell>{invoice.method}</TableCell>
        <TableCell className="nds-text-right">{invoice.amount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`;
}

/**
 * Carregando.
 *
 * O par é sempre este: esqueleto `aria-hidden` dentro de uma região com nome e
 * `aria-busy`. Esqueleto anunciado seria ruído; região sem nome não seria
 * anunciada de jeito nenhum, e quem ouve teria só uma tabela vazia.
 *
 * A forma do esqueleto vem por atributo, nunca por altura cravada: assim a
 * linha mede o que vai medir quando o texto chegar, e cresce junto com a fonte
 * do navegador (WCAG 1.4.4).
 */
export function tableCarregandoSource(): string {
  return `${IMPORT_SEM_RODAPE}
import { Skeleton } from "@/components/ui/skeleton";

const colunas = ["Fatura", "Status", "Método", "Valor"];
const linhas = [1, 2, 3];

<div role="status" aria-busy="true" aria-label="Carregando faturas">
  <Table>
    <TableCaption className="nds-sr-only">${LEGENDA}</TableCaption>
    <TableHeader>
      <TableRow>
        {colunas.map((coluna) => (
          <TableHead key={coluna}>{coluna}</TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {linhas.map((linha) => (
        <TableRow key={linha}>
          {colunas.map((coluna) => (
            <TableCell key={coluna}>
              <Skeleton data-shape="text" data-width="3-4" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>`;
}
