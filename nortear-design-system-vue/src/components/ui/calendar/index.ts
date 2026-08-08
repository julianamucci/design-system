export { default as Calendar } from './Calendar.vue'
export { default as CalendarCell } from './CalendarCell.vue'
export { default as CalendarCellTrigger } from './CalendarCellTrigger.vue'
export { default as CalendarGrid } from './CalendarGrid.vue'
export { default as CalendarGridBody } from './CalendarGridBody.vue'
export { default as CalendarGridHead } from './CalendarGridHead.vue'
export { default as CalendarGridRow } from './CalendarGridRow.vue'
export { default as CalendarHeadCell } from './CalendarHeadCell.vue'
export { default as CalendarHeader } from './CalendarHeader.vue'
export { default as CalendarHeading } from './CalendarHeading.vue'
export { default as CalendarNextButton } from './CalendarNextButton.vue'
export { default as CalendarPrevButton } from './CalendarPrevButton.vue'

// Só os dois que o design system entrega: o conteúdo compartilhado documenta
// legenda em texto ou com seletores, e o Vanilla faz esses dois. As variantes
// parciais da lib ('month-only', 'year-only') não eram documentadas, nenhuma
// story as exercitava e nenhuma outra stack as tinha — sobra, não contrato.
export type LayoutTypes = 'month-and-year' | undefined
