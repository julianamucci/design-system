import { describe, expect, it } from 'vitest';
import {
  calendarBloqueadoSource,
  calendarWithPopoverSource,
  outsideCalendarDaysSource,
  calendarDoisMonthsSource,
  calendarHojeSource,
  calendarIntervaloWithMioloSource,
  calendarIntervaloSource,
  calendarCaptionSelectorsSource,
  calendarCaptionTextSource,
  calendarMultiplasSource,
  calendarNumberWeekSource,
  calendarSource,
  type CalendarArgs,
} from './calendar.source';

/** Toda transform é chamável sem argumento — é o que a guarda transversal exige. */
const TODOS: Array<() => string> = [
  calendarSource,
  calendarMultiplasSource,
  calendarIntervaloSource,
  calendarBloqueadoSource,
  calendarHojeSource,
  outsideCalendarDaysSource,
  calendarIntervaloWithMioloSource,
  calendarCaptionTextSource,
  calendarCaptionSelectorsSource,
  calendarDoisMonthsSource,
  calendarNumberWeekSource,
  calendarWithPopoverSource,
];

describe('calendarSource', () => {
  it('ensina a importação do design system, não a da lib de datas', () => {
    const saida = calendarSource();
    expect(saida).toContain('import { Calendar } from "@/components/ui/calendar";');
    // O locale vem da lib de datas, que é dependência declarada; o COMPONENTE
    // vem do design system.
    expect(saida).toContain('import { ptBR } from "react-day-picker/locale";');
    expect(saida).not.toContain('<DayPicker');
  });

  it('sem control algum cai no calendário controlado de uma data só', () => {
    const saida = calendarSource();
    expect(saida).toContain('const [data, setData] = useState(new Date());');
    expect(saida).toContain('mode="single"');
    expect(saida).toContain('selected={data}');
    expect(saida).toContain('setData(escolhida)');
  });

  it('o modo troca o FORMATO do estado, e não só o atributo', () => {
    // Uma data, uma lista e um intervalo não são conversíveis entre si: um
    // snippet que trocasse só o `mode` ensinaria o estado de um modo sendo lido
    // por outro, que é o defeito real.
    const varias = calendarSource(undefined, { args: { mode: 'multiple' } });
    expect(varias).toContain('const [datas, setDatas] = useState([new Date()]);');
    expect(varias).toContain('mode="multiple"');

    const intervalo = calendarSource(undefined, { args: { mode: 'range' } });
    expect(intervalo).toContain('import type { DateRange } from "react-day-picker";');
    expect(intervalo).toContain(
      'const [intervalo, setIntervalo] = useState<DateRange>({ from: new Date() });',
    );
    expect(intervalo).toContain('mode="range"');
  });

  it('o handler trata a seleção vazia, que é como o componente desmarca', () => {
    // Clicar no dia já escolhido devolve seleção VAZIA. Passar o setter cru
    // ensinaria um estado que aceita ficar sem nada sem dizer isso — e no modo
    // de lista o valor viraria um buraco no lugar de um array.
    expect(calendarSource()).toContain('escolhida && setData(escolhida)');
    expect(calendarSource(undefined, { args: { mode: 'multiple' } })).toContain(
      'setDatas(escolhidas ?? [])',
    );
  });

  it('não inventa modo fora da união quando o control é adulterado', () => {
    const saida = calendarSource(undefined, { args: { mode: 'agenda' as never } });
    expect(saida).toContain('mode="single"');
  });

  it('só escreve a prop que difere do padrão do componente', () => {
    const padrao = calendarSource(undefined, {
      args: {
        captionLayout: 'label',
        showOutsideDays: true,
        showWeekNumber: false,
        numberOfMonths: 1,
      },
    });
    expect(padrao).not.toContain('captionLayout');
    expect(padrao).not.toContain('showOutsideDays');
    expect(padrao).not.toContain('showWeekNumber');
    expect(padrao).not.toContain('numberOfMonths');

    const alterado = calendarSource(undefined, {
      args: {
        captionLayout: 'dropdown',
        showOutsideDays: false,
        showWeekNumber: true,
        numberOfMonths: 2,
      },
    });
    expect(alterado).toContain('captionLayout="dropdown"');
    expect(alterado).toContain('showOutsideDays={false}');
    expect(alterado).toContain('showWeekNumber');
    expect(alterado).toContain('numberOfMonths={2}');
  });

  it('não deixa o espião de onSelect virar código no painel', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const args = { onSelect: spy } as unknown as Partial<CalendarArgs>;
    const saida = calendarSource(undefined, { args });
    expect(saida).toContain('setData(escolhida)');
    expect(saida).not.toContain('CORPO_DO_MOCK');
  });
});

describe('modos', () => {
  it('várias datas guardam uma lista', () => {
    expect(calendarMultiplasSource()).toContain('useState([new Date()])');
    expect(calendarMultiplasSource()).toContain('mode="multiple"');
  });

  it('o intervalo guarda extremos, e abre dois meses para a travessia', () => {
    const saida = calendarIntervaloSource();
    expect(saida).toContain('useState<DateRange>({ from: new Date() })');
    expect(saida).toContain('numberOfMonths={2}');
  });
});

describe('estados', () => {
  it('o bloqueio é uma regra de intervalo, não uma lista de datas', () => {
    const saida = calendarBloqueadoSource();
    expect(saida).toContain('disabled={{ before: new Date() }}');
  });

  it('hoje é a AUSÊNCIA de seleção — destacar não é escolher', () => {
    const saida = calendarHojeSource();
    expect(saida).toContain('mode="single"');
    expect(saida).not.toContain('selected=');
    expect(saida).not.toContain('onSelect=');
    expect(saida).not.toContain('useState');
  });

  it('a prop de dias de fora aparece porque é o assunto da story', () => {
    expect(outsideCalendarDaysSource()).toContain('showOutsideDays');
  });

  it('o intervalo com miolo cabe num mês só', () => {
    const saida = calendarIntervaloWithMioloSource();
    expect(saida).toContain('mode="range"');
    expect(saida).not.toContain('numberOfMonths');
  });
});

describe('layouts', () => {
  it('as duas formas de legenda são escritas por extenso, e se contrastam', () => {
    expect(calendarCaptionTextSource()).toContain('captionLayout="label"');
    expect(calendarCaptionSelectorsSource()).toContain('captionLayout="dropdown"');
  });

  it('dois meses só fazem sentido com o modo de intervalo', () => {
    const saida = calendarDoisMonthsSource();
    expect(saida).toContain('numberOfMonths={2}');
    expect(saida).toContain('mode="range"');
  });

  it('a coluna de semana precisa ser pedida — vem desligada', () => {
    expect(calendarNumberWeekSource()).toContain('showWeekNumber');
  });
});

describe('composição com popover', () => {
  it('as três peças vêm do design system, e nenhuma é andaime da story', () => {
    const saida = calendarWithPopoverSource();
    expect(saida).toContain('from "@/components/ui/popover"');
    expect(saida).toContain('from "@/components/ui/button"');
    expect(saida).toContain('from "@/components/ui/calendar"');
    // Era exatamente isto que o painel imprimia: um componente que só existe no
    // arquivo de story.
    expect(saida).not.toContain('DatePicker');
  });

  it('o rótulo do gatilho acompanha a escolha, e escolher fecha o painel', () => {
    const saida = calendarWithPopoverSource();
    expect(saida).toContain('const [aberto, setAberto] = useState(false);');
    expect(saida).toContain('open={aberto}');
    expect(saida).toContain('onOpenChange={setAberto}');
    // Sem o rótulo derivado do estado, a pessoa fecha o popover sem saber o que
    // escolheu; sem o fechamento, precisa fechá-lo à mão para ver o resultado.
    expect(saida).toContain('formatador.format(data)');
    expect(saida).toContain('setAberto(false);');
  });
});

describe('regras que valem para todo snippet de calendário', () => {
  it('nenhum ensina o andaime do arquivo de story', () => {
    for (const fn of TODOS) {
      const saida = fn();
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('{...args}');
      expect(saida).not.toContain('undefined');
      // O wrapper de estado e o mês fixo existem para os controls e para a foto
      // do Chromatic; nenhum dos dois é API do design system.
      expect(saida).not.toContain('Playground');
      expect(saida).not.toContain('defaultMonth');
    }
  });

  it('todo snippet com seleção é controlado de ponta a ponta', () => {
    const controlados = TODOS.filter((fn) => fn !== calendarHojeSource);
    for (const fn of controlados) {
      const saida = fn();
      expect(saida).toContain('import { useState } from "react";');
      expect(saida).toContain('selected={');
      expect(saida).toContain('onSelect={');
    }
  });
});
