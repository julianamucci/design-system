/**
 * Transforms do painel Code do Table.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * O Table é composição pura — a tag `<Table>` sozinha não é exemplo de nada. O
 * que o leitor precisa copiar é a tabela inteira: legenda, cabeçalho, corpo
 * iterado e, quando houver, rodapé de sumário.
 */
import { indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type TableArgs = {
  captionVisivel: boolean;
  withFooter: boolean;
};

/**
 * A lista de import sai da MARCAÇÃO, e não de um rol escrito à mão: um exemplo
 * que importa peça que não usa ensina a copiar import morto, e a lista escrita à
 * mão desencontra da marcação na primeira edição.
 */
function importTable(markup: string): string {
  const usados = [...new Set([...markup.matchAll(/<(Table[A-Za-z]*)\b/g)].map((m) => m[1]))].sort();
  return `import {\n${usados.map((nome) => `  ${nome},`).join('\n')}\n} from '@/components/ui/table'`;
}

/**
 * Massa de exemplo. Sai do `script setup` como dado literal: quem consome tem os
 * próprios registros, e o que o exemplo ensina é a forma da tabela em volta.
 */
const INVOICES = `const faturas = [
  { id: '#INV-001', status: 'Pago', metodo: 'Cartão de crédito', valor: 'R$ 250,00' },
  { id: '#INV-002', status: 'Pendente', metodo: 'Boleto bancário', valor: 'R$ 150,00' },
  { id: '#INV-003', status: 'Cancelado', metodo: 'Pix', valor: 'R$ 350,00' },
  { id: '#INV-004', status: 'Pago', metodo: 'Cartão de débito', valor: 'R$ 450,00' },
  { id: '#INV-005', status: 'Pendente', metodo: 'Transferência', valor: 'R$ 200,00' },
]`;

const COLUMNS = `const colunas = ['Fatura', 'Status', 'Método', 'Valor']`;

/**
 * O cabeçalho não recebe `scope`: ele nasce em `col` no próprio componente. A
 * coluna numérica leva `nds-text-right` junto com as células — número se lê pela
 * unidade, e o rótulo tem de acompanhar.
 */
const HEADER = `<TableHeader>
  <TableRow>
    <TableHead>Fatura</TableHead>
    <TableHead>Status</TableHead>
    <TableHead>Método</TableHead>
    <TableHead class="nds-text-right">Valor</TableHead>
  </TableRow>
</TableHeader>`;

/** Cabeçalho derivado da lista de colunas, para as stories que iteram. */
const HEADER_ITERADO = `<TableHeader>
  <TableRow>
    <TableHead v-for="coluna in colunas" :key="coluna">{{ coluna }}</TableHead>
  </TableRow>
</TableHeader>`;

const BODY = `<TableBody>
  <TableRow v-for="fatura in faturas" :key="fatura.id">
    <TableCell class="nds-font-medium">{{ fatura.id }}</TableCell>
    <TableCell>{{ fatura.status }}</TableCell>
    <TableCell>{{ fatura.metodo }}</TableCell>
    <TableCell class="nds-text-right">{{ fatura.valor }}</TableCell>
  </TableRow>
</TableBody>`;

/**
 * Rodapé de sumário. O `colspan` é o que faz o rótulo cobrir as três colunas
 * descritivas e o valor cair sob a coluna certa — escrito como ATRIBUTO, e não
 * como binding com hífen, porque `col-span` não existe em HTML e a célula
 * ficaria com uma coluna só, sem erro nenhum.
 */
const FOOTER = `<TableFooter>
  <TableRow>
    <TableCell colspan="3">Total</TableCell>
    <TableCell class="nds-text-right">{{ total }}</TableCell>
  </TableRow>
</TableFooter>`;

const TOTAL = `const total = 'R$ 1.400,00'`;

/** A legenda nunca sai do DOM: é ela que dá nome à tabela para o leitor de tela. */
function legenda(texto: string, visible = false): string {
  return `<TableCaption${visible ? '' : ' class="nds-sr-only"'}>${texto}</TableCaption>`;
}

/** Envolve as seções na raiz, cada uma um nível para dentro. */
function tabela(...sections: string[]): string {
  return `<Table>\n${sections.map((section) => indentar(section)).join('\n')}\n</Table>`;
}

/** Monta o SFC já com o import derivado da marcação. */
function snippet(state: string, markup: string, importsExtra = ''): string {
  const imports = [importTable(markup), importsExtra].filter(Boolean).join('\n');
  return vueSnippet(state ? `${imports}\n\n${state}` : imports, markup);
}

/**
 * Forma canônica: legenda, cabeçalho, corpo iterado e rodapé de sumário. Os dois
 * controles do painel decidem se a legenda fica visível e se o rodapé existe.
 */
export const tableSource: SourceTransform<TableArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const withFooter = args.withFooter !== false;
  const sections = [
    legenda('Lista de faturas recentes', args.captionVisivel === true),
    HEADER,
    BODY,
  ];
  if (withFooter) sections.push(FOOTER);
  return snippet(withFooter ? `${INVOICES}\n${TOTAL}` : INVOICES, tabela(...sections));
};

/**
 * Variante básica: a tabela mínima honesta — sem rodapé, com a legenda visível
 * fazendo as vezes de título.
 */
export function tableBasicaSource(): string {
  return snippet(INVOICES, tabela(legenda('Lista de faturas recentes', true), HEADER, BODY));
}

/**
 * Com rodapé: o total mora no `tfoot`. A mesma célula dentro do corpo entraria
 * na contagem de registros e viraria mais uma fatura.
 */
export function tableWithFooterSource(): string {
  return snippet(
    `${INVOICES}\n${TOTAL}`,
    tabela(legenda('Faturas recentes com total'), HEADER, BODY, FOOTER),
  );
}

/**
 * Legenda só para leitor de tela: quando já existe título visível na página, a
 * legenda visível duplicaria. `nds-sr-only` tira da tela sem tirar do DOM —
 * `display: none` tiraria também da árvore de acessibilidade.
 */
export function tableCaptionInvisivelSource(): string {
  const header = `<TableHeader>
  <TableRow>
    <TableHead>Fatura</TableHead>
    <TableHead>Status</TableHead>
    <TableHead class="nds-text-right">Valor</TableHead>
  </TableRow>
</TableHeader>`;
  const corpo = `<TableBody>
  <TableRow v-for="fatura in faturas" :key="fatura.id">
    <TableCell class="nds-font-medium">{{ fatura.id }}</TableCell>
    <TableCell>{{ fatura.status }}</TableCell>
    <TableCell class="nds-text-right">{{ fatura.valor }}</TableCell>
  </TableRow>
</TableBody>`;
  const markup = `<div class="nds-stack" data-spacing="sm">
  <h2 class="nds-text-h3 nds-m-0">Faturas recentes</h2>
${indentar(tabela(legenda('Lista de faturas recentes'), header, corpo))}
</div>`;
  return snippet(INVOICES, markup);
}

/**
 * Ação por linha: a coluna extra precisa de cabeçalho mesmo sem rótulo visível —
 * sem ele a coluna existe para quem vê e some para quem navega por cabeçalhos. E
 * cada botão diz a QUAL registro pertence: cinco botões "Ações" seriam cinco
 * controles indistinguíveis na lista do leitor de tela.
 */
export function tableWithActionsSource(): string {
  const header = `<TableHeader>
  <TableRow>
    <TableHead>Fatura</TableHead>
    <TableHead>Status</TableHead>
    <TableHead>Método</TableHead>
    <TableHead class="nds-text-right">Valor</TableHead>
    <TableHead><span class="nds-sr-only">Ações</span></TableHead>
  </TableRow>
</TableHeader>`;
  const corpo = `<TableBody>
  <TableRow v-for="fatura in faturas" :key="fatura.id">
    <TableCell class="nds-font-medium">{{ fatura.id }}</TableCell>
    <TableCell>{{ fatura.status }}</TableCell>
    <TableCell>{{ fatura.metodo }}</TableCell>
    <TableCell class="nds-text-right">{{ fatura.valor }}</TableCell>
    <TableCell class="nds-text-right">
      <Button variant="ghost" size="sm" :aria-label="'Ações para fatura ' + fatura.id">
        Ações
      </Button>
    </TableCell>
  </TableRow>
</TableBody>`;
  return snippet(
    INVOICES,
    tabela(legenda('Faturas recentes com ações'), header, corpo),
    `import { Button } from '@/components/ui/button'`,
  );
}

/**
 * Muitas colunas: nada a configurar. O contêiner do próprio componente rola em X
 * e já aceita foco, então a tabela larga não empurra a página para o lado e a
 * rolagem também existe para quem navega sem mouse (WCAG 2.1.1).
 */
export function tableScrollHorizontalSource(): string {
  const header = `<TableHeader>
  <TableRow>
    <TableHead>Fatura</TableHead>
    <TableHead v-for="mes in meses" :key="mes">{{ mes }}</TableHead>
  </TableRow>
</TableHeader>`;
  const corpo = `<TableBody>
  <TableRow v-for="fatura in faturas" :key="fatura.id">
    <TableCell class="nds-font-medium">{{ fatura.id }}</TableCell>
    <TableCell v-for="mes in meses" :key="mes" class="nds-text-right">
      {{ fatura.valor }}
    </TableCell>
  </TableRow>
</TableBody>`;
  const meses = `const meses = [2025, 2026].flatMap((ano) =>
  ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map(
    (mes) => mes + '/' + ano,
  ),
)`;
  return snippet(
    `${INVOICES}\n\n${meses}`,
    tabela(legenda('Faturas por mês de competência'), header, corpo),
  );
}

/**
 * Sem registros: `TableEmpty` é peça do próprio design system, e o `colspan` sai
 * do número de colunas — cravado à mão, acrescentar uma coluna deixaria a
 * mensagem torta sem nenhum erro visível.
 *
 * A estrutura fica de pé: quem usa leitor de tela precisa saber que colunas
 * voltarão a existir quando houver dados.
 */
export function tableVaziaSource(): string {
  const corpo = `<TableBody>
  <TableEmpty :colspan="colunas.length">Nenhuma fatura encontrada.</TableEmpty>
</TableBody>`;
  return snippet(
    COLUMNS,
    tabela(legenda('Lista de faturas recentes'), HEADER_ITERADO, corpo),
  );
}

/**
 * Linha marcada: o estado é do `<tr>`, e é ele que o CSS compartilhado pinta —
 * marcar a célula não pintaria a linha. Fora da seleção o atributo sai por
 * `null`; a string "false" ainda casaria com um seletor de presença.
 */
export function tableLineSelecionadaSource(): string {
  const corpo = `<TableBody>
  <TableRow
    v-for="fatura in faturas"
    :key="fatura.id"
    :data-state="fatura.id === selecionada ? 'selected' : null"
  >
    <TableCell class="nds-font-medium">{{ fatura.id }}</TableCell>
    <TableCell>{{ fatura.status }}</TableCell>
    <TableCell>{{ fatura.metodo }}</TableCell>
    <TableCell class="nds-text-right">{{ fatura.valor }}</TableCell>
  </TableRow>
</TableBody>`;
  return snippet(
    `${INVOICES}\nconst selecionada = ref('#INV-002')`,
    tabela(legenda('Lista de faturas recentes'), HEADER, corpo),
    `import { ref } from 'vue'`,
  );
}

/**
 * Carregando: o par é sempre este — esqueleto `aria-hidden` (o componente já o
 * marca) dentro de uma região com nome e `aria-busy`. Esqueleto anunciado seria
 * ruído; região sem nome não seria anunciada de jeito nenhum.
 *
 * A forma do esqueleto vem por atributo, nunca por altura cravada: ele mede o
 * que a linha vai medir quando o texto chegar, e cresce junto com a fonte do
 * navegador (WCAG 1.4.4).
 */
export function tableLoadingSource(): string {
  const corpo = `<TableBody>
  <TableRow v-for="linha in 3" :key="linha">
    <TableCell v-for="coluna in colunas" :key="coluna">
      <Skeleton data-shape="text" data-width="3-4" />
    </TableCell>
  </TableRow>
</TableBody>`;
  const markup = `<div role="status" aria-busy="true" aria-label="Carregando faturas">
${indentar(tabela(legenda('Lista de faturas recentes'), HEADER_ITERADO, corpo))}
</div>`;
  return snippet(COLUMNS, markup, `import { Skeleton } from '@/components/ui/skeleton'`);
}
