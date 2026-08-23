import { describe, expect, it } from 'vitest';
import {
  calendarWithPopoverSnippet,
  calendarSnippet,
  calendarSource,
  calendarSourceWith,
} from './calendar.source';

describe('calendarSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = calendarSnippet({ locale: 'pt-BR' });
    expect(code).toContain("import { createCalendar } from '@/components/ui/calendar';");
    expect(code).toContain('createCalendar({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('nds-calendar-day-btn');
    expect(code).not.toContain('<table');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = calendarSnippet({ locale: 'pt-BR' });
    // `single`, um mês, legenda em texto e dias vizinhos visíveis são o padrão.
    expect(code).not.toContain('mode');
    expect(code).not.toContain('numberOfMonths');
    expect(code).not.toContain('captionLayout');
    expect(code).not.toContain('showOutsideDays');
    expect(calendarSnippet({ mode: 'single', numberOfMonths: 1, captionLayout: 'label' })).not.toContain(
      'mode',
    );
  });

  it('mostra o modo e a forma do valor que cada um pede', () => {
    const intervalo = calendarSnippet({
      mode: 'range',
      value: '{ from: new Date(2026, 3, 10), to: new Date(2026, 3, 18) }',
    });
    expect(intervalo).toContain("mode: 'range'");
    expect(intervalo).toContain('{ from: new Date(2026, 3, 10), to: new Date(2026, 3, 18) }');

    const multiplo = calendarSnippet({
      mode: 'multiple',
      value: '[new Date(2026, 3, 8), new Date(2026, 3, 12)]',
    });
    expect(multiplo).toContain("mode: 'multiple'");
    expect(multiplo).toContain('value: [new Date(2026, 3, 8), new Date(2026, 3, 12)]');
  });

  it('mostra as opções de layout, a regra de bloqueio e a classe do consumidor', () => {
    expect(calendarSnippet({ captionLayout: 'dropdown' })).toContain("captionLayout: 'dropdown'");
    expect(calendarSnippet({ numberOfMonths: 2 })).toContain('numberOfMonths: 2');
    expect(calendarSnippet({ showOutsideDays: false })).toContain('showOutsideDays: false');
    expect(calendarSnippet({ disabled: '(data) => [0, 6].includes(data.getDay())' })).toContain(
      'disabled: (data) => [0, 6].includes(data.getDay())',
    );
    expect(calendarSnippet({ class: 'nds-border-default' })).toContain(
      "class: 'nds-border-default'",
    );
  });

  it('a data escrita é código, e não uma string entre aspas', () => {
    const code = calendarSnippet({ value: 'new Date(2026, 3, 12)' });
    expect(code).toContain('value: new Date(2026, 3, 12)');
    expect(code).not.toContain("value: 'new Date");
  });

  it('não vaza helper de story', () => {
    const code = calendarSnippet({ locale: 'pt-BR', value: 'new Date(2026, 3, 12)' });
    expect(code).not.toContain('isoDoFoco');
    expect(code).not.toContain('medirContrasteDoCalendario');
    expect(code).not.toContain('diaNoBloco');
  });
});

describe('calendarSource', () => {
  it('parte do uso canônico, e acompanha os args', () => {
    const padrao = calendarSource('<div data-slot="calendar">', {});
    expect(padrao).toContain("locale: 'pt-BR'");
    expect(padrao).toContain('value: new Date(2026, 3, 12)');

    const withArgs = calendarSource('', { args: { numberOfMonths: 2 } });
    expect(padrao).not.toBe(withArgs);
    expect(withArgs).toContain('numberOfMonths: 2');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(calendarSource('<div data-slot="calendar" class="nds-calendar-root">', {})).not.toContain(
      'nds-calendar-root',
    );
  });
});

describe('calendarSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = calendarSourceWith({ mode: 'range', value: '{ from: new Date(2026, 3, 10) }' });
    const code = transform('', { args: { mode: 'multiple', numberOfMonths: 3 } });
    expect(code).toContain("mode: 'range'");
    expect(code).toContain('{ from: new Date(2026, 3, 10) }');
    // O que a story fixa vence; o que ela não fixa continua vindo dos args.
    expect(code).toContain('numberOfMonths: 3');
  });

  it('`value: undefined` apaga o padrão em vez de reintroduzi-lo', () => {
    // É o calendário que abre sem data escolhida — o destaque de hoje.
    const code = calendarSourceWith({ value: undefined })('', {});
    expect(code).not.toContain('value');
    expect(code).toContain("createCalendar({ locale: 'pt-BR' })");
  });
});

describe('calendarComPopoverSnippet', () => {
  it('mostra as três fábricas e a ligação entre elas', () => {
    const code = calendarWithPopoverSnippet();
    expect(code).toContain("import { createButton } from '@/components/ui/button';");
    expect(code).toContain("import { createPopover } from '@/components/ui/popover';");
    expect(code).toContain('createPopover({ trigger: gatilho, content: calendario })');
    expect(code).toContain('gatilho.textContent = formatador.format(valor);');
    expect(code).not.toContain('data-slot=');
  });

  it('não vaza o andaime de espera da story', () => {
    const code = calendarWithPopoverSnippet();
    expect(code).not.toContain('waitForPortal');
    expect(code).not.toContain('onSelect(valor)');
  });
});
