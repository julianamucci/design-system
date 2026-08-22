// Fixture compartilhada pelas stories do Table.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado é lido como
// story: `export const INVOICES` dentro de um `*.stories.ts` viraria uma story
// "Invoices" que não renderiza nada.
//
// O total é derivado, nunca escrito à mão: um número fixo continua verde depois
// de alguém acrescentar uma linha, e o rodapé passa a mentir em silêncio.

export interface Invoice {
  id: string;
  status: string;
  method: string;
  amount: string;
}

export const INVOICES: Invoice[] = [
  { id: '#INV-001', status: 'Pago',      method: 'Cartão de crédito', amount: 'R$ 250,00' },
  { id: '#INV-002', status: 'Pendente',  method: 'Boleto bancário',   amount: 'R$ 150,00' },
  { id: '#INV-003', status: 'Cancelado', method: 'Pix',               amount: 'R$ 350,00' },
  { id: '#INV-004', status: 'Pago',      method: 'Cartão de débito',  amount: 'R$ 450,00' },
  { id: '#INV-005', status: 'Pendente',  method: 'Transferência',     amount: 'R$ 200,00' },
];

/** "R$ 250,00" → 25000 (centavos, para somar sem ponto flutuante). */
function centavos(amount: string): number {
  return Number(amount.replace(/\D/g, ''));
}

/** 140000 → "R$ 1.400,00" — a mesma grafia do resto do conteúdo em pt-BR. */
function formatar(total: number): string {
  const inteiros = String(Math.floor(total / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${inteiros},${String(total % 100).padStart(2, '0')}`;
}

/** Total das linhas passadas — o rodapé nunca traz número escrito à mão. */
export function totalOf(rows: Invoice[]): string {
  return formatar(rows.reduce((soma, i) => soma + centavos(i.amount), 0));
}

export const TOTAL = totalOf(INVOICES);

export const COLUMNS = ['Fatura', 'Status', 'Método', 'Valor'];

/** Doze meses de dois anos — a tabela larga da story de rolagem horizontal. */
export const MONTHS: string[] = ['2025', '2026'].flatMap((ano) =>
  ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map(
    (mes) => `${mes}/${ano}`,
  ),
);
