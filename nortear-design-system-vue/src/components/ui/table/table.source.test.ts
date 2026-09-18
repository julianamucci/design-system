import { describe, expect, it } from 'vitest';
import {
  tableBasicaSource,
  tableLoadingSource,
  tableWithActionsSource,
  tableWithFooterSource,
  tableCaptionInvisivelSource,
  tableLineSelecionadaSource,
  tableScrollHorizontalSource,
  tableSource,
  tableVaziaSource,
} from './table.source';

describe('tableSource', () => {
  it('sem args, entrega a tabela inteira: legenda, cabeçalho, corpo e rodapé', () => {
    expect(tableSource()).toBe(
      `<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const faturas = [
  { id: '#INV-001', status: 'Pago', metodo: 'Cartão de crédito', valor: 'R$ 250,00' },
  { id: '#INV-002', status: 'Pendente', metodo: 'Boleto bancário', valor: 'R$ 150,00' },
  { id: '#INV-003', status: 'Cancelado', metodo: 'Pix', valor: 'R$ 350,00' },
  { id: '#INV-004', status: 'Pago', metodo: 'Cartão de débito', valor: 'R$ 450,00' },
  { id: '#INV-005', status: 'Pendente', metodo: 'Transferência', valor: 'R$ 200,00' },
]
const total = 'R$ 1.400,00'
</script>

<template>
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
      <TableRow v-for="fatura in faturas" :key="fatura.id">
        <TableCell class="nds-font-medium">{{ fatura.id }}</TableCell>
        <TableCell>{{ fatura.status }}</TableCell>
        <TableCell>{{ fatura.metodo }}</TableCell>
        <TableCell class="nds-text-right">{{ fatura.valor }}</TableCell>
      </TableRow>
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableCell colspan="3">Total</TableCell>
        <TableCell class="nds-text-right">{{ total }}</TableCell>
      </TableRow>
    </TableFooter>
  </Table>
</template>`,
    );
  });

  it('a legenda visível perde a classe de leitor de tela, mas nunca a tag', () => {
    const visible = tableSource('', { args: { captionVisible: true } });
    expect(visible).toContain('<TableCaption>Lista de faturas recentes</TableCaption>');
    expect(visible).not.toContain('nds-sr-only');
  });

  it('sem rodapé, some a seção, o total e o import da peça', () => {
    const output = tableSource('', { args: { withFooter: false } });
    expect(output).not.toContain('TableFooter');
    expect(output).not.toContain('colspan');
    expect(output).not.toContain('const total');
  });

  it('o cabeçalho não escreve `scope` — o componente já nasce em col', () => {
    expect(tableSource()).not.toContain('scope=');
  });

  it('ignora control que não é booleano — o espião de ação vira ruído no painel', () => {
    const output = tableSource('', { args: { captionVisible: (() => {}) as never } });
    expect(output).not.toContain('function');
    // Control não-booleano cai no padrão: a legenda continua só para leitor de tela.
    expect(output).toContain('<TableCaption class="nds-sr-only">');
  });
});

describe('o import sai da marcação, nunca de um rol escrito à mão', () => {
  it('a tabela vazia importa TableEmpty e não importa TableCell', () => {
    const output = tableVaziaSource();
    expect(output).toContain('  TableEmpty,');
    // Nenhuma célula é escrita à mão no estado vazio: importá-la seria import morto.
    expect(output).not.toContain('  TableCell,');
  });

  it('a básica não importa TableFooter', () => {
    expect(tableBasicaSource()).not.toContain('TableFooter');
  });
});

describe('transforms das stories de variante', () => {
  it('a básica mostra a legenda visível e nenhum rodapé', () => {
    const output = tableBasicaSource();
    expect(output).toContain('<TableCaption>Lista de faturas recentes</TableCaption>');
    expect(output).not.toContain('nds-sr-only');
    expect(output).not.toContain('tfoot');
  });

  it('o rodapé cobre as três colunas descritivas por atributo, não por binding', () => {
    const output = tableWithFooterSource();
    expect(output).toContain('<TableCell colspan="3">Total</TableCell>');
    // `:col-span` viraria o atributo `col-span`, que não existe em HTML: a
    // célula ficaria com uma coluna só, sem erro nenhum.
    expect(output).not.toContain('col-span');
  });

  it('a legenda invisível vem acompanhada do título visível que a justifica', () => {
    const output = tableCaptionInvisivelSource();
    expect(output).toContain('<h2 class="nds-text-h3 nds-m-0">Faturas recentes</h2>');
    expect(output).toContain('<TableCaption class="nds-sr-only">');
  });

  it('a coluna de ações tem cabeçalho, e cada botão nomeia o próprio registro', () => {
    const output = tableWithActionsSource();
    expect(output).toContain('<TableHead><span class="nds-sr-only">Ações</span></TableHead>');
    expect(output).toContain(`:aria-label="'Ações para fatura ' + fatura.id"`);
    // O ghost é o que o conteúdo compartilhado documenta para ação por linha.
    expect(output).toContain('variant="ghost"');
  });

  it('a tabela larga não configura rolagem: o contêiner do componente já rola', () => {
    const output = tableScrollHorizontalSource();
    expect(output).toContain('<TableHead v-for="mes in meses" :key="mes">');
    expect(output).not.toContain('overflow');
    expect(output).not.toContain('tabindex');
  });
});

describe('transforms das stories de estado', () => {
  it('o vazio deriva o colspan das colunas, e mantém o cabeçalho de pé', () => {
    const output = tableVaziaSource();
    expect(output).toContain('<TableEmpty :colspan="colunas.length">');
    // Cravado à mão, acrescentar uma coluna deixaria a mensagem torta.
    expect(output).not.toContain('colspan="4"');
    expect(output).toContain('<TableHead v-for="coluna in colunas" :key="coluna">');
  });

  it('a seleção mora no `<tr>`, e some por null fora dela', () => {
    const output = tableLineSelecionadaSource();
    expect(output).toContain(`:data-state="fatura.id === selecionada ? 'selected' : null"`);
    // A string "false" ainda casaria com um seletor de presença.
    expect(output).not.toContain(`'false'`);
    expect(output).toContain(`const selecionada = ref('#INV-002')`);
  });

  it('o carregando põe a tabela dentro da região que anuncia a espera', () => {
    const output = tableLoadingSource();
    expect(output).toContain(
      '<div role="status" aria-busy="true" aria-label="Carregando faturas">',
    );
    // A forma vem por atributo: altura cravada não cresceria com a fonte do
    // navegador (WCAG 1.4.4).
    expect(output).toContain('<Skeleton data-shape="text" data-width="3-4" />');
    expect(output).not.toContain('aria-hidden');
  });
});
