import { describe, expect, it } from 'vitest';
import {
  calendarDaysBloqueadosSource,
  calendarDoisMonthsSource,
  calendarHojeSource,
  calendarIntervaloSource,
  calendarCaptionWithSelectorsSource,
  calendarSeisWeeksSource,
  dataCalendarSelectorSource,
  calendarSource,
  calendarVariasDatasSource,
} from './calendar.source';

describe('calendarSource', () => {
  it('sem args, entrega o calendário de data única no idioma da documentação', () => {
    expect(calendarSource()).toBe(
      `<script setup lang="ts">
import { ref } from 'vue'
import { CalendarDate } from '@internationalized/date'
import { Calendar } from '@/components/ui/calendar'

const selecionada = ref(new CalendarDate(2026, 4, 12))
</script>

<template>
  <Calendar v-model="selecionada" locale="pt-BR" />
</template>`,
    );
  });

  it('o placeholder das stories não entra — ele é determinismo de screenshot', () => {
    // Sem ele o componente abre no mês corrente, que é o que quem consome quer.
    expect(calendarSource()).not.toContain('placeholder');
  });

  it('o modo múltiplo troca o formato do modelo, e não só a prop', () => {
    const output = calendarSource('', { args: { multiple: true } });
    expect(output).toContain('<Calendar v-model="selecionadas" multiple locale="pt-BR" />');
    expect(output).toContain('const selecionadas = ref([');
    expect(output).not.toContain('const selecionada =');
  });

  it('quebra uma linha por atributo quando a fila fica longa demais', () => {
    const output = calendarSource('', {
      args: { numberOfMonths: 2, fixedWeeks: true, layout: 'month-and-year' },
    });
    expect(output).toContain(`  <Calendar
    v-model="selecionada"
    locale="pt-BR"
    :number-of-months="2"
    fixed-weeks
    layout="month-and-year"
  />`);
  });

  it('não escreve o que já é padrão do componente', () => {
    const output = calendarSource('', {
      args: { multiple: false, numberOfMonths: 1, disabled: false, readonly: false, fixedWeeks: false },
    });
    expect(output).toContain('<Calendar v-model="selecionada" locale="pt-BR" />');
    expect(output).not.toContain('number-of-months');
    expect(output).not.toContain('multiple');
    expect(output).not.toContain('readonly');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = calendarSource('', {
      args: { locale: (() => {}) as never, layout: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    expect(output).not.toContain('locale=');
    expect(output).not.toContain('layout=');
  });
});

describe('transforms das stories de modo', () => {
  it('as várias datas chegam como lista, sem depender de control', () => {
    const output = calendarVariasDatasSource();
    expect(output).toContain('<Calendar v-model="selecionadas" multiple locale="pt-BR" />');
    // Três datas avulsas: uma só não mostraria que a lista soma.
    expect(output.split('new CalendarDate(').length - 1).toBe(3);
  });

  it('o intervalo é outro componente, com um modelo de par', () => {
    const output = calendarIntervaloSource();
    expect(output).toContain(`import { RangeCalendar } from '@/components/ui/range-calendar'`);
    expect(output).toContain('start: new CalendarDate(2026, 4, 10),');
    expect(output).toContain('end: new CalendarDate(2026, 4, 18),');
    expect(output).toContain('<RangeCalendar v-model="periodo" locale="pt-BR" />');
    // Não é o calendário de data única com uma prop a mais.
    expect(output).not.toContain('<Calendar ');
  });
});

describe('transforms das stories de estado', () => {
  it('o bloqueio é uma função por data, e não uma lista de datas', () => {
    const output = calendarDaysBloqueadosSource();
    expect(output).toContain('function bloquear(data: DateValue) {');
    expect(output).toContain('return data.compare(minima) < 0');
    expect(output).toContain(':is-date-disabled="bloquear"');
  });

  it('a story de hoje não tem modelo — a ausência é o assunto', () => {
    const output = calendarHojeSource();
    expect(output).toBe(
      `<script setup lang="ts">
import { Calendar } from '@/components/ui/calendar'
</script>

<template>
  <Calendar locale="pt-BR" />
</template>`,
    );
  });
});

describe('transforms das stories de layout', () => {
  it('cada layout escreve só a prop que o distingue do padrão', () => {
    expect(calendarCaptionWithSelectorsSource()).toContain('layout="month-and-year"');
    expect(calendarDoisMonthsSource()).toContain(':number-of-months="2"');
    expect(calendarSeisWeeksSource()).toContain('fixed-weeks');
    // Nenhum deles arrasta a prop do vizinho.
    expect(calendarDoisMonthsSource()).not.toContain('layout=');
    expect(calendarSeisWeeksSource()).not.toContain('number-of-months');
  });
});

describe('transform da composição', () => {
  it('o calendário mora dentro do popover, atrás do botão que mostra a data', () => {
    const output = dataCalendarSelectorSource();
    expect(output).toContain('<Popover v-model:open="aberto">');
    expect(output).toContain('<PopoverTrigger as-child>');
    expect(output).toContain('<Button variant="outline">{{ rotulo }}</Button>');
    expect(output.indexOf('<PopoverContent>')).toBeLessThan(output.indexOf('<Calendar'));
  });

  it('a escolha faz duas coisas, e por isso não usa o atalho de v-model', () => {
    const output = dataCalendarSelectorSource();
    expect(output).toContain(':model-value="selecionada"');
    expect(output).toContain('@update:model-value="escolher"');
    expect(output).toContain('aberto.value = false');
    expect(output).not.toContain('<Calendar v-model=');
  });

  it('o rótulo é formatado no fuso local', () => {
    const output = dataCalendarSelectorSource();
    // Converter em UTC devolveria o dia anterior a oeste de Greenwich.
    expect(output).toContain('selecionada.value.toDate(getLocalTimeZone())');
  });
});
