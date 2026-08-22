import { describe, expect, it } from 'vitest';
import {
  tableBasicaSource,
  tableLoadingSource,
  tableWithActionsSource,
  tableWithFooterSource,
  tableCaptionOcultaSource,
  tableLineSelecionadaSource,
  tableScrollHorizontalSource,
  tableSource,
  tableVaziaSource,
} from './table.source';

describe('tableSource', () => {
  it('sem args, entrega legenda oculta, cabeçalho, corpo e rodapé', () => {
    expect(tableSource()).toBe(
      `<script lang="ts">
  import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";

  const faturas = [
    { id: "#INV-001", status: "Pago",      metodo: "Cartão de crédito", valor: "R$ 250,00" },
    { id: "#INV-002", status: "Pendente",  metodo: "Boleto bancário",   valor: "R$ 150,00" },
    { id: "#INV-003", status: "Cancelado", metodo: "Pix",               valor: "R$ 350,00" },
    { id: "#INV-004", status: "Pago",      metodo: "Cartão de débito",  valor: "R$ 450,00" },
    { id: "#INV-005", status: "Pendente",  metodo: "Transferência",     valor: "R$ 200,00" },
  ];
</script>

<Table>
  <TableCaption class="nds-sr-only">Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Fatura</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Método</TableHead>
      <TableHead class="nds-text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each faturas as fatura (fatura.id)}
      <TableRow>
        <TableCell class="nds-font-medium">{fatura.id}</TableCell>
        <TableCell>{fatura.status}</TableCell>
        <TableCell>{fatura.metodo}</TableCell>
        <TableCell class="nds-text-right">{fatura.valor}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colspan={3}>Total</TableCell>
      <TableCell class="nds-text-right">R$ 1.400,00</TableCell>
    </TableRow>
  </TableFooter>
</Table>`,
    );
  });

  it('não repete o scope padrão do cabeçalho', () => {
    // `TableHead` já nasce com scope="col"; repetir ensinaria que a
    // acessibilidade depende de alguém lembrar.
    expect(tableSource()).not.toContain('scope=');
  });

  it('não mostra o contêiner de rolagem — quem o monta é o próprio Table', () => {
    expect(tableSource()).not.toContain('nds-table-wrapper');
    expect(tableSource()).not.toContain('tabindex');
  });

  it('o control da legenda troca o texto e a visibilidade', () => {
    expect(tableSource('', { args: { caption: 'Faturas de maio' } })).toContain(
      '<TableCaption class="nds-sr-only">Faturas de maio</TableCaption>',
    );
    expect(tableSource('', { args: { captionVisivel: true } })).toContain(
      '<TableCaption>Lista de faturas recentes</TableCaption>',
    );
  });

  it('sem rodapé, o TableFooter sai também do import', () => {
    const saida = tableSource('', { args: { showFooter: false } });
    expect(saida).not.toContain('TableFooter');
    expect(saida).not.toContain('R$ 1.400,00');
  });
});

describe('transforms das stories de variação e estado', () => {
  it('a variante básica mostra a legenda e dispensa o rodapé', () => {
    const saida = tableBasicaSource();
    expect(saida).toContain('<TableCaption>Lista de faturas recentes</TableCaption>');
    expect(saida).not.toContain('TableFooter');
  });

  it('a variante com rodapé fecha o total das cinco linhas', () => {
    const saida = tableWithFooterSource();
    expect(saida).toContain('<TableCell colspan={3}>Total</TableCell>');
    expect(saida).toContain('R$ 1.400,00');
  });

  it('a legenda oculta convive com um título visível acima da tabela', () => {
    const saida = tableCaptionOcultaSource();
    expect(saida).toContain('<h3 class="nds-text-body nds-font-medium nds-mb-2">Faturas recentes');
    expect(saida).toContain('<TableCaption class="nds-sr-only">');
    // A tabela recuada mora dentro do bloco do título.
    expect(saida).toContain('  <Table>');
  });

  it('a coluna de ações nomeia o botão pela fatura da linha', () => {
    const saida = tableWithActionsSource();
    expect(saida).toContain('from "@/components/ui/button"');
    expect(saida).toContain('aria-label="Ações para fatura {fatura.id}"');
    expect(saida).toContain('variant="ghost"');
  });

  it('a rolagem horizontal nasce de muitas colunas, não de uma classe', () => {
    const saida = tableScrollHorizontalSource();
    expect(saida).toContain('{#each meses as mes (mes)}');
    expect(saida).not.toContain('overflow');
  });

  it('o estado vazio ocupa as quatro colunas com a mensagem', () => {
    const saida = tableVaziaSource();
    expect(saida).toContain('<TableCell colspan={4} class="nds-table-empty">');
    expect(saida).toContain('Nenhuma fatura encontrada.');
    // O ramo vazio é o `:else` do próprio each — sem lista, sem linha.
    expect(saida).toContain('{:else}');
  });

  it('a linha selecionada carrega o data-state, e as outras não', () => {
    const saida = tableLineSelecionadaSource();
    expect(saida).toContain('<TableRow data-state={fatura.selecionada ? "selected" : null}>');
    expect(saida).toContain('selecionada: true');
  });

  it('o carregamento anuncia pela região e esconde o esqueleto', () => {
    const saida = tableLoadingSource();
    expect(saida).toContain('role="status" aria-busy="true" aria-label="Carregando faturas"');
    expect(saida).toContain('from "@/components/ui/skeleton"');
    expect(saida.match(/<Skeleton/g)).toHaveLength(4);
  });
});
