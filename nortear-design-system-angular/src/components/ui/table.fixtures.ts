// Fixture compartilhada pelas stories do Table.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado é lido como
// story: `export const FATURAS` dentro de um `*.stories.ts` viraria uma story
// "Faturas" que não renderiza nada.
//
// São as mesmas cinco faturas das outras stacks de propósito: a regressão
// visual do Chromatic compara a mesma tabela em cinco portas, e um dado
// diferente viraria diff sem que nada tivesse mudado.

export interface Fatura {
  id: string;
  status: string;
  metodo: string;
  valor: string;
}

export const FATURAS: Fatura[] = [
  { id: '#INV-001', status: 'Pago',      metodo: 'Cartão de crédito',      valor: 'R$ 250,00' },
  { id: '#INV-002', status: 'Pendente',  metodo: 'Transferência bancária', valor: 'R$ 150,00' },
  { id: '#INV-003', status: 'Cancelado', metodo: 'Pix',                    valor: 'R$ 350,00' },
  { id: '#INV-004', status: 'Pago',      metodo: 'Cartão de crédito',      valor: 'R$ 450,00' },
  { id: '#INV-005', status: 'Pendente',  metodo: 'Pix',                    valor: 'R$ 50,00'  },
];

export const TOTAL = 'R$ 1.250,00';

/** Variante do badge por status — a mesma tabela de mapeamento do Vanilla. */
export const VARIANTE_POR_STATUS: Record<string, 'success' | 'warning' | 'destructive'> = {
  Pago: 'success',
  Pendente: 'warning',
  Cancelado: 'destructive',
};
