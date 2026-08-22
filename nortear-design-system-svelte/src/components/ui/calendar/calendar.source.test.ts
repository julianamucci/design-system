import { describe, expect, it } from 'vitest';
import {
  calendarBloqueadoSource,
  calendarDoisMesesSource,
  calendarEmPopoverSource,
  calendarHojeSource,
  calendarIntervaloSource,
  calendarLegendaSeletoresSource,
  calendarLegendaTextoSource,
  calendarMultiploSource,
  calendarWeeksFixasSource,
  calendarSource,
} from './calendar.source';

describe('calendarSource', () => {
  it('entrega a forma canônica: uma data por vez, no idioma pedido', () => {
    expect(calendarSource()).toBe(
      `<script lang="ts">
  import { Calendar } from "@/components/ui/calendar";
  import { CalendarDate } from "@internationalized/date";

  let data = $state(new CalendarDate(2026, 4, 12));
</script>

<Calendar type="single" bind:value={data} locale="pt-BR" />`,
    );
  });

  it('a data é um DateValue, e não o Date nativo', () => {
    // É a divergência de API que a stack tem: o componente recebe e devolve o
    // tipo da biblioteca de datas, e um snippet com `new Date()` não compilaria.
    const saida = calendarSource();
    expect(saida).toContain('from "@internationalized/date"');
    expect(saida).not.toContain('new Date(');
  });
});

describe('transforms das stories de modo', () => {
  it('o modo múltiplo guarda uma LISTA de datas', () => {
    const saida = calendarMultiploSource();
    expect(saida).toContain('type="multiple"');
    expect(saida).toContain('bind:value={datas}');
    expect(saida.match(/new CalendarDate\(/g)).toHaveLength(3);
  });

  it('o intervalo é outro componente, com valor de duas pontas', () => {
    const saida = calendarIntervaloSource();
    expect(saida).toContain('from "@/components/ui/range-calendar"');
    expect(saida).toContain('<RangeCalendar bind:value={periodo} locale="pt-BR" />');
    expect(saida).toContain('start:');
    expect(saida).toContain('end:');
    // `type` é do calendário de data única; o de intervalo não o recebe.
    expect(saida).not.toContain('type="');
  });
});

describe('transforms das stories de estado', () => {
  it('o estado bloqueado passa a regra que decide dia a dia', () => {
    const saida = calendarBloqueadoSource();
    expect(saida).toContain('isDateDisabled={antesDoLimite}');
    expect(saida).toContain('dia.compare(limite) < 0');
  });

  it('a story de hoje abre sem data escolhida', () => {
    const saida = calendarHojeSource();
    expect(saida).toContain('let data = $state<DateValue>();');
    expect(saida).not.toContain('new CalendarDate(');
  });

  it('as semanas fixas entram como flag, sem valor', () => {
    expect(calendarWeeksFixasSource()).toContain(
      '<Calendar type="single" bind:value={data} locale="pt-BR" fixedWeeks />',
    );
  });
});

describe('transforms das stories de layout', () => {
  it('a legenda de texto e a de seletores escrevem layouts opostos', () => {
    expect(calendarLegendaTextoSource()).toContain('captionLayout="label"');
    expect(calendarLegendaSeletoresSource()).toContain('captionLayout="dropdown"');
  });

  it('dois meses lado a lado vêm de uma quantidade, não de duas instâncias', () => {
    const saida = calendarDoisMesesSource();
    expect(saida).toContain('numberOfMonths={2}');
    expect(saida.match(/<Calendar\b/g)).toHaveLength(1);
  });
});

describe('a composição em popover', () => {
  it('o botão carrega o rótulo da data e o painel guarda o calendário', () => {
    const saida = calendarEmPopoverSource();
    expect(saida).toContain('from "@/components/ui/popover"');
    expect(saida).toContain('<Button {...props} variant="outline">{rotulo}</Button>');
    expect(saida.indexOf('<Calendar')).toBeGreaterThan(saida.indexOf('<PopoverContent>'));
  });

  it('escolher a data fecha o painel, que já não tem o que oferecer', () => {
    expect(calendarEmPopoverSource()).toContain('onValueChange={() => (aberto = false)}');
  });

  it('a data é formatada no fuso local, nunca em UTC', () => {
    // Em qualquer fuso a oeste de Greenwich, converter em UTC devolve o dia
    // anterior — e o botão passaria a mostrar uma data que ninguém escolheu.
    expect(calendarEmPopoverSource()).toContain('getLocalTimeZone()');
  });
});
