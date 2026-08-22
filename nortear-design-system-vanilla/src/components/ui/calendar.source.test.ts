import { describe, expect, it } from 'vitest';
import {
  calendarWithPopoverSnippet,
  calendarSnippet,
  calendarSource,
  calendarSourceWith,
} from './calendar.source';

describe('calendarSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = calendarSnippet({ locale: 'pt-BR' });
    expect(código).toContain("import { createCalendar } from '@/components/ui/calendar';");
    expect(código).toContain('createCalendar({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('nds-calendar-day-btn');
    expect(código).not.toContain('<table');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = calendarSnippet({ locale: 'pt-BR' });
    // `single`, um mês, legenda em texto e dias vizinhos visíveis são o padrão.
    expect(código).not.toContain('mode');
    expect(código).not.toContain('numberOfMonths');
    expect(código).not.toContain('captionLayout');
    expect(código).not.toContain('showOutsideDays');
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
    const código = calendarSnippet({ value: 'new Date(2026, 3, 12)' });
    expect(código).toContain('value: new Date(2026, 3, 12)');
    expect(código).not.toContain("value: 'new Date");
  });

  it('não vaza helper de story', () => {
    const código = calendarSnippet({ locale: 'pt-BR', value: 'new Date(2026, 3, 12)' });
    expect(código).not.toContain('isoDoFoco');
    expect(código).not.toContain('medirContrasteDoCalendario');
    expect(código).not.toContain('diaNoBloco');
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
    const código = transform('', { args: { mode: 'multiple', numberOfMonths: 3 } });
    expect(código).toContain("mode: 'range'");
    expect(código).toContain('{ from: new Date(2026, 3, 10) }');
    // O que a story fixa vence; o que ela não fixa continua vindo dos args.
    expect(código).toContain('numberOfMonths: 3');
  });

  it('`value: undefined` apaga o padrão em vez de reintroduzi-lo', () => {
    // É o calendário que abre sem data escolhida — o destaque de hoje.
    const código = calendarSourceWith({ value: undefined })('', {});
    expect(código).not.toContain('value');
    expect(código).toContain("createCalendar({ locale: 'pt-BR' })");
  });
});

describe('calendarComPopoverSnippet', () => {
  it('mostra as três fábricas e a ligação entre elas', () => {
    const código = calendarWithPopoverSnippet();
    expect(código).toContain("import { createButton } from '@/components/ui/button';");
    expect(código).toContain("import { createPopover } from '@/components/ui/popover';");
    expect(código).toContain('createPopover({ trigger: gatilho, content: calendario })');
    expect(código).toContain('gatilho.textContent = formatador.format(valor);');
    expect(código).not.toContain('data-slot=');
  });

  it('não vaza o andaime de espera da story', () => {
    const código = calendarWithPopoverSnippet();
    expect(código).not.toContain('waitForPortal');
    expect(código).not.toContain('onSelect(valor)');
  });
});
