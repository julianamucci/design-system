/**
 * Transforms do painel Code da Table.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * `scope="col"` não aparece nos snippets: `TableHead` já nasce com ele, e
 * repetir o padrão ensinaria que a acessibilidade da tabela depende de alguém
 * lembrar. A `.nds-table-wrapper` com `tabindex` também fica de fora — quem a
 * monta é o próprio `Table`.
 */
import { svelteSnippet } from '@/lib/story-source';

export type TableArgs = {
  caption: string;
  captionVisivel: boolean;
  showFooter: boolean;
};

/** Recua um bloco inteiro, para quando a tabela vive dentro de outro elemento. */
function recuar(bloco: string, espacos = '  '): string {
  return bloco
    .split('\n')
    .map((line) => (line.trim() ? `${espacos}${line}` : line))
    .join('\n');
}

function imports(names: string[]): string {
  return `import {
${names.map((nome) => `  ${nome},`).join('\n')}
} from "@/components/ui/table";`;
}

const PARTS_BASE = [
  'Table',
  'TableBody',
  'TableCaption',
  'TableCell',
  'TableHead',
  'TableHeader',
  'TableRow',
];

const INVOICES = `const faturas = [
  { id: "#INV-001", status: "Pago",      metodo: "Cartão de crédito", valor: "R$ 250,00" },
  { id: "#INV-002", status: "Pendente",  metodo: "Boleto bancário",   valor: "R$ 150,00" },
  { id: "#INV-003", status: "Cancelado", metodo: "Pix",               valor: "R$ 350,00" },
  { id: "#INV-004", status: "Pago",      metodo: "Cartão de débito",  valor: "R$ 450,00" },
  { id: "#INV-005", status: "Pendente",  metodo: "Transferência",     valor: "R$ 200,00" },
];`;

const INVOICES_CURTAS = `const faturas = [
  { id: "#INV-001", status: "Pago",      metodo: "Cartão de crédito", valor: "R$ 250,00" },
  { id: "#INV-002", status: "Pendente",  metodo: "Boleto bancário",   valor: "R$ 150,00" },
  { id: "#INV-003", status: "Cancelado", metodo: "Pix",               valor: "R$ 350,00" },
];`;

/** Cabeçalho de quatro colunas, com o valor alinhado à direita. */
const HEADER = `  <TableHeader>
    <TableRow>
      <TableHead>Fatura</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Método</TableHead>
      <TableHead class="nds-text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>`;

/** Uma linha por registro; o alinhamento da coluna acompanha o do cabeçalho. */
const BODY = `  <TableBody>
    {#each faturas as fatura (fatura.id)}
      <TableRow>
        <TableCell class="nds-font-medium">{fatura.id}</TableCell>
        <TableCell>{fatura.status}</TableCell>
        <TableCell>{fatura.metodo}</TableCell>
        <TableCell class="nds-text-right">{fatura.valor}</TableCell>
      </TableRow>
    {/each}
  </TableBody>`;

/** Sumário no `tfoot`: o total é a soma das linhas, nunca mais um registro. */
const FOOTER = `  <TableFooter>
    <TableRow>
      <TableCell colspan={3}>Total</TableCell>
      <TableCell class="nds-text-right">R$ 1.400,00</TableCell>
    </TableRow>
  </TableFooter>`;

function legenda(texto: string, visible: boolean): string {
  return visible
    ? `  <TableCaption>${texto}</TableCaption>`
    : `  <TableCaption class="nds-sr-only">${texto}</TableCaption>`;
}

/**
 * Forma canônica: legenda, cabeçalho, corpo e rodapé de sumário. Serve o
 * Playground de `table.stories.ts` e cascateia para as stories sem composição
 * própria.
 */
export function tableSource(_gerado?: string, ctx?: { args?: Partial<TableArgs> }): string {
  const {
    caption = 'Lista de faturas recentes',
    captionVisivel = false,
    showFooter = true,
  } = ctx?.args ?? {};

  const partes = [legenda(caption, captionVisivel), HEADER, BODY];
  if (showFooter) partes.push(FOOTER);

  return svelteSnippet(
    `${imports(showFooter ? [...PARTS_BASE, 'TableFooter'].sort() : PARTS_BASE)}

${INVOICES}`,
    `<Table>
${partes.join('\n')}
</Table>`,
  );
}

/** Variante básica: a tabela mínima — legenda visível, sem rodapé. */
export function tableBasicaSource(): string {
  return svelteSnippet(
    `${imports(PARTS_BASE)}

${INVOICES}`,
    `<Table>
${legenda('Lista de faturas recentes', true)}
${HEADER}
${BODY}
</Table>`,
  );
}

/** Variante com rodapé: o total ocupa três colunas e cai sob a coluna de valor. */
export function tableWithFooterSource(): string {
  return svelteSnippet(
    `${imports([...PARTS_BASE, 'TableFooter'].sort())}

${INVOICES}`,
    `<Table>
${legenda('Lista de faturas recentes', true)}
${HEADER}
${BODY}
${FOOTER}
</Table>`,
  );
}

/** Variante de legenda oculta: o título já está na página, o nome fica no DOM. */
export function tableCaptionOcultaSource(): string {
  return svelteSnippet(
    `${imports(PARTS_BASE)}

${INVOICES_CURTAS}`,
    `<div>
  <h3 class="nds-text-body nds-font-medium nds-mb-2">Faturas recentes</h3>
${recuar(`<Table>
${legenda('Lista de faturas recentes', false)}
${HEADER}
${BODY}
</Table>`)}
</div>`,
  );
}

/** Variante com ações por linha: cada botão diz a qual registro pertence. */
export function tableWithActionsSource(): string {
  return svelteSnippet(
    `${imports(PARTS_BASE)}
import { Button } from "@/components/ui/button";

${INVOICES_CURTAS}`,
    `<Table>
${legenda('Lista de faturas recentes', true)}
  <TableHeader>
    <TableRow>
      <TableHead>Fatura</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Método</TableHead>
      <TableHead class="nds-text-right">Valor</TableHead>
      <TableHead>Ações</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each faturas as fatura (fatura.id)}
      <TableRow>
        <TableCell class="nds-font-medium">{fatura.id}</TableCell>
        <TableCell>{fatura.status}</TableCell>
        <TableCell>{fatura.metodo}</TableCell>
        <TableCell class="nds-text-right">{fatura.valor}</TableCell>
        <TableCell>
          <Button variant="ghost" size="sm" aria-label="Ações para fatura {fatura.id}">
            &hellip;
          </Button>
        </TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>`,
  );
}

/** Variante de rolagem horizontal: muitas colunas, a rolagem fica na tabela. */
export function tableScrollHorizontalSource(): string {
  return svelteSnippet(
    `${imports(PARTS_BASE)}

const meses = ["2025", "2026"].flatMap((ano) =>
  ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map(
    (mes) => \`\${month}/\${year}\`,
  ),
);

const faturas = [
  { id: "#INV-001", valor: "R$ 250,00" },
  { id: "#INV-002", valor: "R$ 150,00" },
  { id: "#INV-003", valor: "R$ 350,00" },
];`,
    `<Table>
  <TableCaption class="nds-sr-only">Faturas por mês de competência</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Fatura</TableHead>
      {#each meses as mes (mes)}
        <TableHead>{mes}</TableHead>
      {/each}
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each faturas as fatura (fatura.id)}
      <TableRow>
        <TableCell class="nds-font-medium">{fatura.id}</TableCell>
        {#each meses as mes (mes)}
          <TableCell class="nds-text-right">{fatura.valor}</TableCell>
        {/each}
      </TableRow>
    {/each}
  </TableBody>
</Table>`,
  );
}

/** Estado vazio: a mensagem ocupa a largura inteira, no lugar dos registros. */
export function tableVaziaSource(): string {
  return svelteSnippet(
    `${imports(PARTS_BASE)}

const faturas: Array<{ id: string; status: string; metodo: string; valor: string }> = [];`,
    `<Table>
${legenda('Lista de faturas recentes', true)}
${HEADER}
  <TableBody>
    {#each faturas as fatura (fatura.id)}
      <TableRow>
        <TableCell class="nds-font-medium">{fatura.id}</TableCell>
        <TableCell>{fatura.status}</TableCell>
        <TableCell>{fatura.metodo}</TableCell>
        <TableCell class="nds-text-right">{fatura.valor}</TableCell>
      </TableRow>
    {:else}
      <TableRow>
        <TableCell colspan={4} class="nds-table-empty">
          Nenhuma fatura encontrada.
        </TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>`,
  );
}

/**
 * Estado de linha selecionada: o `data-state` mora na linha, não na célula — é
 * a linha que o CSS compartilhado pinta.
 *
 * O ramo falso devolve `null` em vez de `undefined`: os dois apagam o atributo
 * em Svelte, e `null` mantém o snippet legível para a guarda transversal, que
 * trata `undefined` no texto como sobra de template mal fechado.
 */
export function tableLineSelecionadaSource(): string {
  return svelteSnippet(
    `${imports(PARTS_BASE)}

const faturas = [
  { id: "#INV-001", status: "Pago",      metodo: "Cartão de crédito", valor: "R$ 250,00", selecionada: false },
  { id: "#INV-002", status: "Pendente",  metodo: "Boleto bancário",   valor: "R$ 150,00", selecionada: true  },
  { id: "#INV-003", status: "Cancelado", metodo: "Pix",               valor: "R$ 350,00", selecionada: false },
];`,
    `<Table>
${legenda('Lista de faturas recentes', true)}
${HEADER}
  <TableBody>
    {#each faturas as fatura (fatura.id)}
      <TableRow data-state={fatura.selecionada ? "selected" : null}>
        <TableCell class="nds-font-medium">{fatura.id}</TableCell>
        <TableCell>{fatura.status}</TableCell>
        <TableCell>{fatura.metodo}</TableCell>
        <TableCell class="nds-text-right">{fatura.valor}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>`,
  );
}

/**
 * Estado de carregamento: o esqueleto some da árvore de acessibilidade e quem
 * anuncia é a região em volta, com nome próprio e `aria-busy`.
 */
export function tableLoadingSource(): string {
  return svelteSnippet(
    `${imports(PARTS_BASE)}
import { Skeleton } from "@/components/ui/skeleton";

const linhas = [1, 2, 3, 4, 5];`,
    `<div role="status" aria-busy="true" aria-label="Carregando faturas">
${recuar(`<Table>
${legenda('Lista de faturas recentes', true)}
${HEADER}
  <TableBody>
    {#each linhas as linha (linha)}
      <TableRow>
        <TableCell><Skeleton data-shape="text" data-width="1-2" /></TableCell>
        <TableCell><Skeleton data-shape="text" data-width="1-3" /></TableCell>
        <TableCell><Skeleton data-shape="text" data-width="3-4" /></TableCell>
        <TableCell class="nds-text-right">
          <Skeleton class="nds-spacer-start" data-shape="text" data-width="1-3" />
        </TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>`)}
</div>`,
  );
}
