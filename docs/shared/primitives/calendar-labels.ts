/**
 * Rótulos acessíveis do Calendar, por idioma.
 *
 * Existem porque o botão de mês anterior não tem texto: só o ícone. Quem usa
 * leitor de tela ouve o `aria-label`, e ele estava em três estados diferentes —
 * "Go to previous month" cravado no Vanilla, "Previous page" vindo da lib no
 * Vue (que nem descreve o que o botão faz) e "Previous" no Svelte. Num
 * calendário em português, três dos quatro anunciavam em inglês.
 *
 * O React não precisa desta tabela: a lib dele traz os rótulos traduzidos junto
 * do locale, e as strings daqui são as mesmas dela, de propósito — as quatro
 * stacks devem anunciar a mesma coisa.
 *
 * Mora no compartilhado, e não copiado em cada stack, porque é texto que o
 * usuário final ouve: três cópias divergem na primeira revisão de conteúdo.
 */

export interface CalendarLabels {
  previousMonth: string;
  nextMonth: string;
  selectMonth: string;
  selectYear: string;
}

const LABELS: Record<string, CalendarLabels> = {
  'pt-BR': {
    previousMonth: 'Ir para o mês anterior',
    nextMonth: 'Ir para o próximo mês',
    selectMonth: 'Selecionar mês',
    selectYear: 'Selecionar ano',
  },
  en: {
    previousMonth: 'Go to the Previous Month',
    nextMonth: 'Go to the Next Month',
    selectMonth: 'Choose the Month',
    selectYear: 'Choose the Year',
  },
  es: {
    previousMonth: 'Ir al mes anterior',
    nextMonth: 'Ir al mes siguiente',
    selectMonth: 'Seleccionar mes',
    selectYear: 'Seleccionar año',
  },
};

/**
 * Aceita a tag BCP-47 inteira ("pt-BR", "es-ES") e cai na língua base quando a
 * região não tem entrada própria. Idioma desconhecido usa inglês, que é o
 * padrão das libs.
 */
export function calendarLabels(locale: string | undefined): CalendarLabels {
  if (!locale) return LABELS.en;
  return LABELS[locale] ?? LABELS[locale.split('-')[0]] ?? LABELS.en;
}
