/**
 * Transforms do painel Code do Calendar.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. O snippet importa do design system, com os nomes
 * que `calendar/index.ts` exporta de verdade.
 *
 * O `placeholder` que as stories passam NÃO entra em snippet nenhum: ele existe
 * para o Chromatic fotografar sempre o mesmo mês. Sem ele o componente abre no
 * mês corrente, que é o que quem consome quer.
 */
import { attr, attrBool, attrNum, attrsMultilinha, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type CalendarArgs = {
  locale: string;
  multiple: boolean;
  numberOfMonths: number;
  disabled: boolean;
  readonly: boolean;
  fixedWeeks: boolean;
  layout: 'month-and-year' | undefined;
};

const IMPORT_REF = `import { ref } from 'vue'`;
const IMPORT_DATA = `import { CalendarDate } from '@internationalized/date'`;
const IMPORT_CALENDAR = `import { Calendar } from '@/components/ui/calendar'`;

/** Data escolhida dos exemplos — um dia concreto, para o exemplo ser copiável. */
const UMA_DATA = `const selecionada = ref(new CalendarDate(2026, 4, 12))`;

/** Estado do modo múltiplo: o modelo vira lista, e não uma data só. */
const VARIAS_DATAS = `const selecionadas = ref([
  new CalendarDate(2026, 4, 8),
  new CalendarDate(2026, 4, 15),
  new CalendarDate(2026, 4, 22),
])`;

/**
 * Fecha a tag do calendário com a fila de atributos.
 *
 * `attrsMultilinha` quebra uma linha por atributo quando a fila fica longa —
 * e aí a tag já vem com a quebra antes do fecho. Em linha, o espaço antes de
 * `/>` é por conta daqui.
 */
function tag(nome: string, partes: Array<string | ''>): string {
  const fila = attrsMultilinha(partes);
  return fila.startsWith('\n') ? `<${nome}${fila}/>` : `<${nome}${fila} />`;
}

/** Calendário de data única com os imports que todo exemplo dele repete. */
function calendar(...partes: Array<string | ''>): string {
  return vueSnippet(
    `${IMPORT_REF}\n${IMPORT_DATA}\n${IMPORT_CALENDAR}\n\n${UMA_DATA}`,
    tag('Calendar', ['v-model="selecionada"', 'locale="pt-BR"', ...partes]),
  );
}

/**
 * Forma canônica, e a base dos arquivos de modos, de estados e de layouts: uma
 * data em `v-model` e o idioma, que é o que muda os nomes de mês e de semana.
 *
 * Todo control passa por `attr`/`attrBool`/`attrNum`, que descartam o valor
 * padrão e o que não é do tipo esperado — o painel entrega arg de ação como
 * função, e interpolada ela apareceria como o corpo do mock.
 */
export const calendarSource: SourceTransform<CalendarArgs> = (_gerado, ctx) => {
  const {
    locale = 'pt-BR',
    multiple,
    numberOfMonths,
    disabled,
    readonly,
    fixedWeeks,
    layout,
  } = ctx?.args ?? {};

  const varias = multiple === true;
  const partes = [
    `v-model="${varias ? 'selecionadas' : 'selecionada'}"`,
    attrBool('multiple', multiple, false),
    attr('locale', locale),
    attrNum('number-of-months', numberOfMonths, 1),
    attrBool('disabled', disabled, false),
    attrBool('readonly', readonly, false),
    attrBool('fixed-weeks', fixedWeeks, false),
    attr('layout', layout),
  ];

  return vueSnippet(
    `${IMPORT_REF}\n${IMPORT_DATA}\n${IMPORT_CALENDAR}\n\n${varias ? VARIAS_DATAS : UMA_DATA}`,
    tag('Calendar', partes),
  );
};

/* -------------------------------------------------------------------- modos */

/**
 * Várias datas avulsas: o modelo passa a ser uma LISTA, e é essa troca de
 * formato que o exemplo precisa mostrar — a prop sozinha não conta a história.
 */
export function calendarVariasDatasSource(): string {
  return vueSnippet(
    `${IMPORT_REF}\n${IMPORT_DATA}\n${IMPORT_CALENDAR}\n\n${VARIAS_DATAS}`,
    tag('Calendar', ['v-model="selecionadas"', 'multiple', 'locale="pt-BR"']),
  );
}

/**
 * Intervalo contínuo: é OUTRO componente, porque seleciona um par — início e
 * fim — e não uma lista de datas soltas.
 */
export function calendarIntervaloSource(): string {
  return vueSnippet(
    `${IMPORT_REF}
${IMPORT_DATA}
import { RangeCalendar } from '@/components/ui/range-calendar'

const periodo = ref({
  start: new CalendarDate(2026, 4, 10),
  end: new CalendarDate(2026, 4, 18),
})`,
    tag('RangeCalendar', ['v-model="periodo"', 'locale="pt-BR"']),
  );
}

/* ------------------------------------------------------------------ estados */

/**
 * Dias bloqueados: quem decide é uma função por data, e não uma lista de datas.
 * Um limite inferior é a regra mais comum, e o componente aplica o resultado
 * dela à célula — sem clique, e fora da ordem de tabulação.
 */
export function calendarDaysBloqueadosSource(): string {
  return vueSnippet(
    `${IMPORT_REF}
import { CalendarDate, type DateValue } from '@internationalized/date'
${IMPORT_CALENDAR}

${UMA_DATA}
const minima = new CalendarDate(2026, 4, 10)

function bloquear(data: DateValue) {
  return data.compare(minima) < 0
}`,
    tag('Calendar', ['v-model="selecionada"', 'locale="pt-BR"', ':is-date-disabled="bloquear"']),
  );
}

/**
 * Sem data escolhida: a ausência do `v-model` É o assunto. O calendário abre no
 * mês corrente e destaca o dia de hoje — destacar não é escolher.
 */
export function calendarHojeSource(): string {
  return vueSnippet(IMPORT_CALENDAR, tag('Calendar', ['locale="pt-BR"']));
}

/* ------------------------------------------------------------------ layouts */

/** Legenda operável: mês e ano viram seletores, para saltar de período. */
export function calendarCaptionWithSelectorsSource(): string {
  return calendar('layout="month-and-year"');
}

/** Dois meses lado a lado, para datas que atravessam a virada do mês. */
export function calendarDoisMonthsSource(): string {
  return calendar(':number-of-months="2"');
}

/**
 * Seis linhas de semana sempre: a altura do bloco para de mudar ao virar o mês,
 * e nada abaixo dele salta.
 */
export function calendarSeisWeeksSource(): string {
  return calendar('fixed-weeks');
}

/* --------------------------------------------------------------- composição */

/**
 * A composição canônica: o calendário quase nunca aparece solto na página. Mora
 * dentro de um popover, atrás de um botão que mostra a data escolhida.
 *
 * `:model-value` mais `@update:model-value` no lugar de `v-model` porque a
 * escolha faz duas coisas — guarda a data e fecha o popover — e isso não cabe
 * na atribuição direta do atalho.
 */
export function dataCalendarSelectorSource(): string {
  return vueSnippet(
    `import { computed, ref } from 'vue'
import { CalendarDate, getLocalTimeZone, type DateValue } from '@internationalized/date'
${IMPORT_CALENDAR}
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const aberto = ref(false)
const selecionada = ref<DateValue>(new CalendarDate(2026, 4, 12))

const formatador = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

// Fuso local, e não UTC: converter em UTC e formatar no fuso de quem lê devolve
// o dia anterior em qualquer fuso a oeste de Greenwich.
const rotulo = computed(() =>
  formatador.format(selecionada.value.toDate(getLocalTimeZone())),
)

function escolher(valor?: DateValue) {
  // Clicar de novo na data escolhida a desmarca, e o evento vem sem valor.
  if (!valor) return
  selecionada.value = valor
  // Escolhida a data, o popover não tem mais o que oferecer.
  aberto.value = false
}`,
    `<Popover v-model:open="aberto">
  <PopoverTrigger as-child>
    <Button variant="outline">{{ rotulo }}</Button>
  </PopoverTrigger>
  <PopoverContent>
    <Calendar
      :model-value="selecionada"
      locale="pt-BR"
      @update:model-value="escolher"
    />
  </PopoverContent>
</Popover>`,
  );
}
