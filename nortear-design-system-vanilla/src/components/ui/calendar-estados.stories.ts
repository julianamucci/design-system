import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn, userEvent, within, expect } from 'storybook/test';
import { createCalendar } from './calendar';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Estados de célula que a factory produz: escolhida, bloqueada, hoje, os dias
// dos meses vizinhos e o miolo de um intervalo.
//
// `WithOutsideDays` e `RangeWithMiddle` já existiram aqui como stories que
// renderizavam um calendário comum e explicavam, no texto, que o recurso não
// existia — o Chromatic fotografava o nome de um recurso ao lado da imagem de
// outro. Saíram e voltaram agora, com o recurso no lugar.

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Calendar/Estados',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component: 'Estados de célula: selecionada, bloqueada e o dia de hoje.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onSelect = fn();

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Selected: Story = {
  render: () =>
    createCalendar({
      locale: 'pt-BR',
      value: new Date(2026, 3, 12),
      class: 'nds-rounded-md nds-border-default',
    }),
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item2', 'accessibility.item3'],
    docs: {
      description: {
        story:
          'Data escolhida. A célula fica marcada visualmente e anuncia o estado de seleção para o leitor de tela.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O grid e as células têm papel de tabela de datas', async () => {
      // accessibility.item1 — sem o papel, o leitor de tela lê uma tabela
      // qualquer e não oferece a navegação bidimensional.
      await expect(canvas.getByRole('grid')).toBeInTheDocument();
      await expect(canvas.getAllByRole('gridcell').length).toBeGreaterThan(27);
    });

    await step('Cada dia anuncia a data por extenso', async () => {
      // accessibility.item2 — o texto da célula é só o número; sozinho ele não
      // diz de que mês nem de que ano.
      const selecionado = canvasElement.querySelector('.nds-calendar-day[aria-pressed="true"]')!;
      await expect(selecionado).toHaveTextContent('12');
      await expect(selecionado.getAttribute('aria-label')).toMatch(/12 de abril de 2026/i);
    });

    await step('Só a data escolhida está marcada', async () => {
      // accessibility.item3
      const marcados = canvasElement.querySelectorAll('.nds-calendar-day[aria-pressed="true"]');
      await expect(marcados.length).toBe(1);
      await expect(marcados[0]).toHaveAttribute('data-selected', 'true');
    });
  },
};

export const Disabled: Story = {
  render: () =>
    createCalendar({
      locale: 'pt-BR',
      // Quarta-feira: a data de partida precisa ser um dia livre, senão a
      // story abre já marcando uma célula que a própria regra bloqueia.
      value: new Date(2026, 3, 15),
      onSelect,
      disabled: (date) => {
        const d = date.getDay();
        return d === 0 || d === 6; // bloqueia finais de semana
      },
      class: 'nds-rounded-md nds-border-default',
    }),
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    docs: {
      description: {
        story:
          'Datas bloqueadas por uma regra — aqui, fins de semana. A célula bloqueada não recebe foco nem reporta seleção.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A regra bloqueia exatamente os dias que ela descreve', async () => {
      // functional.item4 — contar "há algum desabilitado" passaria com um só, e
      // com a regra invertida. Abril de 2026 tem 8 dias de fim de semana.
      const bloqueados = Array.from(
        canvasElement.querySelectorAll<HTMLButtonElement>(
          '.nds-calendar-day[disabled]:not([data-outside])',
        ),
      );
      await expect(bloqueados.length).toBe(8);
      for (const b of bloqueados) {
        const dia = Number(b.dataset.day!.slice(-2));
        const diaDaSemana = new Date(2026, 3, dia).getDay();
        await expect([0, 6]).toContain(diaDaSemana);
      }
    });

    await step('Clicar num dia bloqueado não seleciona nem reporta', async () => {
      const bloqueado = canvasElement.querySelector<HTMLButtonElement>('.nds-calendar-day[disabled]')!;
      onSelect.mockClear();
      await userEvent.click(bloqueado, { pointerEventsCheck: 0 });
      await expect(onSelect).not.toHaveBeenCalled();
      await expect(bloqueado).toHaveAttribute('aria-pressed', 'false');
      // A seleção de partida continua onde estava.
      await expect(
        canvasElement.querySelector('.nds-calendar-day[aria-pressed="true"]'),
      ).toHaveTextContent('15');
    });

    await step('Um dia livre continua selecionável', async () => {
      // Sem este passo, a story passaria com o calendário inteiro bloqueado.
      onSelect.mockClear();
      await userEvent.click(canvas.getByRole('button', { name: /16 de abril de 2026/i }));
      await expect(onSelect).toHaveBeenCalledTimes(1);
    });
  },
};

export const Today: Story = {
  render: () => createCalendar({ locale: 'pt-BR', class: 'nds-rounded-md nds-border-default' }),
  parameters: {
    covers: ['functional.item1'],
    docs: {
      description: {
        story:
          'Sem data escolhida: o calendário abre no mês corrente e destaca o dia de hoje, sem marcá-lo como selecionado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('O dia de hoje é destacado, e é o de hoje mesmo', async () => {
      // functional.item1 — `data-today` em alguma célula não basta: a regra é
      // que ele caia na data certa, e é isso que um erro de fuso quebraria.
      const hoje = canvasElement.querySelector<HTMLElement>('.nds-calendar-day[data-today="true"]')!;
      await expect(hoje).not.toBeNull();
      await expect(hoje.textContent).toBe(String(new Date().getDate()));
    });

    await step('Destacar hoje não é selecioná-lo', async () => {
      await expect(
        canvasElement.querySelectorAll('.nds-calendar-day[aria-pressed="true"]').length,
      ).toBe(0);
    });
  },
};

export const NavegacaoPorTeclado: Story = {
  render: () =>
    createCalendar({
      locale: 'pt-BR',
      value: new Date(2026, 3, 12),
      class: 'nds-rounded-md nds-border-default',
    }),
  parameters: {
    covers: ['functional.item5', 'accessibility.item5'],
    docs: {
      description: {
        story:
          'O grid é uma única parada de tabulação: o Tab pousa no dia corrente e as setas percorrem o mês, entrando no mês seguinte quando passam do fim.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const doc = canvasElement.ownerDocument;
    const focado = () => (doc.activeElement as HTMLElement | null)?.dataset.day ?? null;

    await step('Tab entra no grid uma vez só, no dia corrente', async () => {
      // accessibility.item5 — tabulação móvel: se cada dia fosse uma parada,
      // sair do calendário custaria mais de trinta Tabs.
      (doc.activeElement as HTMLElement | null)?.blur();
      for (let i = 0; i < 10 && !focado(); i += 1) await userEvent.tab();
      await expect(focado()).toBe('2026-04-12');
      await expect(
        canvasElement.querySelectorAll('.nds-calendar-day[tabindex="0"]').length,
      ).toBe(1);
    });

    await step('As setas percorrem o grid nas duas direções', async () => {
      // functional.item5 — horizontal anda um dia, vertical anda uma semana.
      await userEvent.keyboard('{ArrowRight}');
      await expect(focado()).toBe('2026-04-13');
      await userEvent.keyboard('{ArrowDown}');
      await expect(focado()).toBe('2026-04-20');
      await userEvent.keyboard('{ArrowUp}{ArrowLeft}');
      await expect(focado()).toBe('2026-04-12');
    });

    await step('Passar do fim do mês vira a página', async () => {
      // O limite do mês não é o limite da navegação: quem chega em 30 de abril
      // e aperta a seta espera 1º de maio, não um beco.
      for (let i = 0; i < 18; i += 1) await userEvent.keyboard('{ArrowRight}');
      await expect(focado()).toBe('2026-04-30');
      await userEvent.keyboard('{ArrowRight}');
      await expect(focado()).toBe('2026-05-01');
      await expect(canvasElement.querySelector('.nds-calendar-month-label')).toHaveTextContent(
        /maio 2026/i,
      );
    });

    await step('Home e End vão às pontas da semana', async () => {
      // Semana começa no domingo: de 1º de maio (sexta), Home leva ao domingo
      // 26 de abril e End ao sábado 2 de maio. Sem eles, atravessar uma semana
      // custa seis setas.
      await userEvent.keyboard('{Home}');
      await expect(focado()).toBe('2026-04-26');
      await userEvent.keyboard('{End}');
      await expect(focado()).toBe('2026-05-02');

      // Tecla sem mapeamento não mexe no foco nem engole o evento.
      await userEvent.keyboard('{a}');
      await expect(focado()).toBe('2026-05-02');
    });
  },
};

export const WithOutsideDays: Story = {
  render: () =>
    createCalendar({
      locale: 'pt-BR',
      value: new Date(2026, 3, 12),
      class: 'nds-rounded-md nds-border-default',
    }),
  parameters: {
    docs: {
      description: {
        story:
          'Dias do mês anterior e do próximo completam a primeira e a última semana, apagados para não competirem com o mês em foco.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const diasCom = (seletor: string) =>
      Array.from(canvasElement.querySelectorAll<HTMLElement>(`.nds-calendar-day${seletor}`)).map(
        (el) => el.dataset.day ?? '',
      );

    await step('As bordas do grid trazem dias de fora do mês', async () => {
      // Abril de 2026 começa numa quarta: as três primeiras casas vêm de março.
      const fora = diasCom('[data-outside="true"]');
      await expect(fora).toContain('2026-03-30');
      await expect(fora.length).toBeGreaterThan(0);
    });

    await step('Dia de fora do mês não conta como do mês', async () => {
      // O contraste é o ponto da story: sem a marcação de externo, o mês
      // pareceria ter mais dias do que tem.
      await expect(diasCom(':not([data-outside])').length).toBe(30);
    });

    await step('Escolher um dia vizinho leva a visão para o mês dele', async () => {
      // Sem isso a escolha some da tela no instante em que é feita: o dia fica
      // marcado num mês que não está mais visível. Cada passo estabelece a
      // própria precondição — o clique final devolve a visão para abril.
      const canvas = within(canvasElement);
      const legenda = () => canvasElement.querySelector('.nds-calendar-month-label');

      await userEvent.click(canvas.getByRole('button', { name: /30 de março de 2026/i }));
      await expect(legenda()).toHaveTextContent(/março 2026/i);
      await expect(
        canvasElement.querySelector('.nds-calendar-day[data-day="2026-03-30"][data-selected]'),
      ).not.toBeNull();

      // A volta é por 1º de abril, que março mostra como dia vizinho: 12 de
      // abril não está mais na grade — é justamente esse o ponto do passo.
      // Nome completo: "1 de abril" sozinho também casaria com "21 de abril".
      await userEvent.click(
        canvas.getByRole('button', { name: /quarta-feira, 1 de abril de 2026/i }),
      );
      await expect(legenda()).toHaveTextContent(/abril 2026/i);
    });

    await step('Sem eles, a casa fica vazia em vez de emprestar um dia', async () => {
      // A alternativa é explícita na API, e é o que o grid fazia antes de
      // existirem: buraco no começo e no fim, sem dia nenhum.
      const semVizinhos = createCalendar({
        locale: 'pt-BR',
        value: new Date(2026, 3, 12),
        showOutsideDays: false,
      });
      await expect(semVizinhos.querySelectorAll('.nds-calendar-day').length).toBe(30);
      await expect(semVizinhos.querySelectorAll('td:empty').length).toBeGreaterThan(0);
    });
  },
};

export const RangeWithMiddle: Story = {
  render: () =>
    createCalendar({
      mode: 'range',
      locale: 'pt-BR',
      value: { from: new Date(2026, 3, 10), to: new Date(2026, 3, 18) },
      class: 'nds-rounded-md nds-border-default',
    }),
  parameters: {
    docs: {
      description: {
        story: 'Intervalo com miolo: os dias entre início e fim também ficam marcados.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('O intervalo é contínuo do início ao fim', async () => {
      // Verificar só os extremos passaria com o meio vazio, que é exatamente o
      // que esta story existe para mostrar.
      const marcados = Array.from(
        canvasElement.querySelectorAll<HTMLElement>('.nds-calendar-day[data-selected="true"]'),
      ).map((el) => el.dataset.day ?? '');
      await expect(marcados).toEqual([
        '2026-04-10', '2026-04-11', '2026-04-12', '2026-04-13', '2026-04-14',
        '2026-04-15', '2026-04-16', '2026-04-17', '2026-04-18',
      ]);
    });

    await step('O miolo se distingue dos extremos', async () => {
      const dia = (iso: string) =>
        canvasElement.querySelector<HTMLElement>(`.nds-calendar-day[data-day="${iso}"]`)!;
      await expect(dia('2026-04-10').dataset.range).toBe('start');
      await expect(dia('2026-04-14').dataset.range).toBe('middle');
      await expect(dia('2026-04-18').dataset.range).toBe('end');
    });
  },
};
