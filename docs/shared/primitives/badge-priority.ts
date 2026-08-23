/**
 * Prioridade da tabela de testes → variante do Badge.
 *
 * O trio `-high/-medium/-low` que existia no CSS do badge era cor semântica com
 * nome de uso: quem procurava por "warning" não achava, e o componente não
 * expunha nenhuma das três como variante. A prioridade agora ESCOLHE uma
 * variante que existe por si só.
 *
 * A tabela mora no compartilhado porque as quatro stacks a repetiam inline — e
 * as quatro repetiam junto o mesmo defeito: o mapa listava só os rótulos em
 * português e inglês, então em espanhol "Media" e "Baja" caíam no `outline` e a
 * prioridade sumia da tabela. Normalizar antes de casar resolve os três idiomas
 * de uma vez, e ainda cobre variação de caixa.
 */

export type PrioridadeVariant = 'destructive' | 'warning' | 'info' | 'outline';

/** alta · média · baixa, nos três idiomas do design system. */
const LABEL_VARIANT: Record<string, PrioridadeVariant> = {
  alta: 'destructive',
  high: 'destructive',
  media: 'warning',
  medium: 'warning',
  baixa: 'info',
  baja: 'info',
  low: 'info',
};

/**
 * Sem acento e em caixa baixa: "Média" e "Media" são a mesma prioridade.
 *
 * O intervalo vai escapado — são os diacríticos combinantes que o NFD separa —
 * e não com os caracteres literais: literais ficam invisíveis no editor e sobrevivem
 * mal a uma cópia.
 */
const DIACRITICOS = /[\u0300-\u036f]/g;

function normalizar(label: string): string {
  return label.trim().toLowerCase().normalize('NFD').replace(DIACRITICOS, '');
}

export function prioridadeVariant(label: string): PrioridadeVariant {
  return LABEL_VARIANT[normalizar(label)] ?? 'outline';
}
