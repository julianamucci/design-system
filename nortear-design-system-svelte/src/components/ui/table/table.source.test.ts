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
  tableWithExpandableRowsSource,
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
    expect(tableSource('', { args: { captionVisible: true } })).toContain(
      '<TableCaption>Lista de faturas recentes</TableCaption>',
    );
  });

  it('sem rodapé, o TableFooter sai também do import', () => {
    const output = tableSource('', { args: { showFooter: false } });
    expect(output).not.toContain('TableFooter');
    expect(output).not.toContain('R$ 1.400,00');
  });
});

describe('transforms das stories de variação e estado', () => {
  it('a variante básica mostra a legenda e dispensa o rodapé', () => {
    const output = tableBasicaSource();
    expect(output).toContain('<TableCaption>Lista de faturas recentes</TableCaption>');
    expect(output).not.toContain('TableFooter');
  });

  it('a variante com rodapé fecha o total das cinco linhas', () => {
    const output = tableWithFooterSource();
    expect(output).toContain('<TableCell colspan={3}>Total</TableCell>');
    expect(output).toContain('R$ 1.400,00');
  });

  it('a legenda oculta convive com um título visível acima da tabela', () => {
    const output = tableCaptionOcultaSource();
    expect(output).toContain('<h3 class="nds-text-body nds-font-medium nds-mb-2">Faturas recentes');
    expect(output).toContain('<TableCaption class="nds-sr-only">');
    // A tabela recuada mora dentro do bloco do título.
    expect(output).toContain('  <Table>');
  });

  it('a coluna de ações nomeia o botão pela fatura da linha', () => {
    const output = tableWithActionsSource();
    expect(output).toContain('from "@/components/ui/button"');
    expect(output).toContain('aria-label="Ações para fatura {fatura.id}"');
    expect(output).toContain('variant="ghost"');
  });

  it('a rolagem horizontal nasce de muitas colunas, não de uma classe', () => {
    const output = tableScrollHorizontalSource();
    expect(output).toContain('{#each months as month (month)}');
    expect(output).not.toContain('overflow');
  });

  it('a tabela larga ensina o NOME da região rolável junto com a rolagem', () => {
    const output = tableScrollHorizontalSource();
    // Foco sem nome faz uma parada que o leitor de tela não sabe anunciar, e o
    // nome é do conteúdo — o design system não tem como cravá-lo.
    expect(output).toContain('<Table regionLabel="Faturas por mês de competência">');
    // A legenda nomeia a TABELA; `regionLabel` nomeia o contêiner. São dois
    // elementos, e o snippet mostra os dois nomes.
    expect(output).toContain(
      '<TableCaption class="nds-sr-only">Faturas por mês de competência</TableCaption>',
    );
    // O papel sai do componente quando o nome chega: escrevê-lo aqui ensinaria a
    // duplicar o que a peça já faz.
    expect(output).not.toContain('role="group"');
  });

  it('a linha expansível põe o estado no BOTÃO e esconde a irmã por hidden', () => {
    const output = tableWithExpandableRowsSource();
    expect(output).toContain('aria-expanded={abertas[fatura.id] ? "true" : "false"}');
    expect(output).toContain('aria-controls={idDoDetalhe(fatura.id)}');
    // O `data-state` da `<tr>` é da SELEÇÃO: o disclosure não pode disputá-lo.
    expect(output).not.toContain('data-state');
    // A irmã fica sempre no DOM — alvo de `aria-controls` que some deixa o
    // atributo apontando para nada.
    expect(output).toContain('hidden={!abertas[fatura.id]}');
    expect(output).not.toContain('{#if');
    // O colspan sai da lista de colunas mais a do disclosure, nunca à mão.
    expect(output).toContain('colspan={colunas.length + 1}');
    expect(output).not.toContain('colspan={5}');
    // O rótulo da coluna de disclosure existe para quem navega por cabeçalhos.
    expect(output).toContain('<span class="nds-sr-only">Detalhes</span>');
    // O nome é do REGISTRO e não muda ao abrir: quem anuncia o estado é o
    // atributo, e "Mostrar"/"Ocultar" diria a mesma coisa duas vezes.
    expect(output).toContain('aria-label={`Detalhes da fatura ${fatura.id}`}');
    expect(output).not.toContain('Ocultar');
    expect(output).not.toContain('aria-live');
    // Sem `tabindex`: a ordem de foco sai da posição da irmã no DOM.
    expect(output).not.toContain('tabindex');
    expect(output).toContain('import ChevronDown from "@lucide/svelte/icons/chevron-down";');
  });

  it('o estado vazio ocupa as quatro colunas com a mensagem', () => {
    const output = tableVaziaSource();
    expect(output).toContain('<TableCell colspan={4} class="nds-table-empty">');
    expect(output).toContain('Nenhuma fatura encontrada.');
    // O ramo vazio é o `:else` do próprio each — sem lista, sem linha.
    expect(output).toContain('{:else}');
  });

  it('a linha selecionada carrega o data-state, e as outras não', () => {
    const output = tableLineSelecionadaSource();
    expect(output).toContain('<TableRow data-state={fatura.selecionada ? "selected" : null}>');
    expect(output).toContain('selecionada: true');
  });

  it('o carregamento anuncia pela região e esconde o esqueleto', () => {
    const output = tableLoadingSource();
    expect(output).toContain('role="status" aria-busy="true" aria-label="Carregando faturas"');
    expect(output).toContain('from "@/components/ui/skeleton"');
    expect(output.match(/<Skeleton/g)).toHaveLength(4);
  });
});
