import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { focusIso } from '@shared/testing/calendar-probe';
import { parseDate } from '@internationalized/date';
import { NdsCalendar } from './calendar';
import { calendarPlaygroundSource, type CalendarArgs } from './calendar.source';
import { NdsCalendarDocs } from '@/components/docs/CalendarDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// Data FIXA, e não o relógio: um calendário que abre no mês corrente muda de
// grade toda virada de mês, e a foto do Chromatic passa a divergir sozinha.
// `parseDate` em vez de `new CalendarDate(...)` também mantém a data fora do
// escopo de módulo executável que o auditor cobra.
const DAY_ESCOLHIDO = parseDate('2026-04-12');
const DAYS_ESCOLHIDOS = [parseDate('2026-04-08'), parseDate('2026-04-12'), parseDate('2026-04-16')];

const meta: Meta<CalendarArgs> = {
  title: 'Components/Form/Calendar',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [NdsCalendar] })],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(NdsCalendarDocs) },
  },
  argTypes: {
    mode: {
      control: 'inline-radio',
      options: ['single', 'multiple'],
      description: 'Uma data ou várias datas avulsas.',
    },
    locale: {
      control: 'select',
      options: ['pt-BR', 'en-US', 'es-ES'],
      description: 'Tag BCP 47 — controla nomes de mês, dias da semana e o rótulo de cada dia.',
    },
    captionLayout: {
      control: 'inline-radio',
      options: ['label', 'dropdown'],
      description: 'Legenda em texto ou com seletores de mês e ano.',
    },
    numberOfMonths: { control: 'number', description: 'Quantos meses exibir lado a lado.' },
    showOutsideDays: {
      control: 'boolean',
      description: 'Completa a primeira e a última semana com os dias dos meses vizinhos.',
    },
  },
  args: {
    mode: 'single',
    locale: 'pt-BR',
    captionLayout: 'label',
    numberOfMonths: 1,
    showOutsideDays: true,
  },
};

export default meta;
type Story = StoryObj<CalendarArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: calendarPlaygroundSource } },
    covers: [
      'visual.item1',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item4',
      'accessibility.item6',
    ],
  },
  render: (args) => ({
    props: {
      ...args,
      value: args.mode === 'multiple' ? DAYS_ESCOLHIDOS : DAY_ESCOLHIDO,
    },
    template: `
      <div
        ndsCalendar
        [mode]="mode"
        [value]="value"
        [locale]="locale"
        [captionLayout]="captionLayout"
        [numberOfMonths]="numberOfMonths"
        [showOutsideDays]="showOutsideDays"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O grid e as células têm papel de tabela de datas', async () => {
      // accessibility.item1 — sem o papel, o leitor de tela lê uma tabela
      // qualquer e não oferece a navegação bidimensional.
      await expect(canvas.getByRole('grid')).toBeInTheDocument();
      await expect(canvas.getAllByRole('gridcell').length).toBeGreaterThan(27);
    });

    await step('A grade não se anuncia como aplicação', async () => {
      // O primitivo desta stack marca a própria raiz com role="application", que
      // manda o leitor de tela repassar todas as teclas e sair do modo de
      // leitura — e um aria-label que repete a legenda já visível. Nenhuma das
      // outras quatro stacks emite isso; a raiz aqui volta a ser um <div>.
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="calendar"]')!;
      await expect(root.hasAttribute('role')).toBe(false);
      await expect(root.hasAttribute('aria-label')).toBe(false);

      const meses = root.querySelector<HTMLElement>('.nds-calendar-months')!;
      await expect(meses.hasAttribute('role')).toBe(false);
      await expect(meses.hasAttribute('aria-label')).toBe(false);
    });

    await step('A paginação anuncia em português, e a semana não é lida duas vezes', async () => {
      // Os botões de mês só têm ícone: o que o leitor de tela anuncia é o
      // aria-label. O primitivo traz "Previous page"/"Next page" cravados em
      // inglês — num calendário em português, isso soaria numa língua só.
      await expect(canvas.getByRole('button', { name: 'Ir para o mês anterior' })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: 'Ir para o próximo mês' })).toBeInTheDocument();

      // A linha dos dias da semana fica fora da árvore de acessibilidade: cada
      // dia já anuncia a data por extenso, e repetir a coluna a cada célula só
      // encompridaria a leitura.
      await expect(canvasElement.querySelector('thead')).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Cada dia anuncia a data por extenso, no idioma pedido', async () => {
      // accessibility.item2 — o texto da célula é só o número; sozinho ele não
      // diz de que mês nem de que ano. E o formatador do primitivo nasce em
      // inglês (ele lê o input no construtor), então esta asserção é a que
      // pega a regressão do idioma.
      const dia = canvasElement.querySelector<HTMLElement>(
        '.nds-calendar-day-btn[data-value="2026-04-12"]',
      )!;
      await expect(dia).toHaveTextContent('12');
      await expect(dia.getAttribute('aria-label')).toMatch(/12 de abril de 2026/i);
    });

    await step('A data escolhida é anunciada como escolhida', async () => {
      // `aria-selected` mora na CÉLULA, que é quem tem papel de gridcell — é
      // dela que o leitor lê o estado ao percorrer a grade.
      const selecionadas = canvasElement.querySelectorAll('td[aria-selected="true"]');
      await expect(selecionadas.length).toBe(1);
      await expect(
        selecionadas[0].querySelector('.nds-calendar-day-btn[data-selected]'),
      ).not.toBeNull();
    });

    await step('O grid é uma única parada de tabulação', async () => {
      // Se cada dia fosse uma parada, sair do calendário custaria mais de
      // trinta Tabs.
      //
      // Contar `[tabindex="0"]` NÃO bastava, e foi o que deixou o defeito passar:
      // o primitivo devolve `undefined` para o dia de fora do mês e para o
      // bloqueado, e `<button>` SEM tabindex é tabulável. A conta certa é quantos
      // dias estão na ordem — medido, eram seis nesta grade e quinze na de datas
      // bloqueadas.
      const tabulaveis = Array.from(
        canvasElement.querySelectorAll<HTMLElement>('.nds-calendar-day-btn'),
      ).filter((d) => d.tabIndex >= 0);
      await expect(tabulaveis).toHaveLength(1);
    });

    await step('A grade se nomeia pelo mês em vista', async () => {
      // Sem `aria-label` o grid é anunciado como "tabela" e nada mais — e com
      // dois meses na tela as duas soam iguais.
      const grid = canvasElement.querySelector('table')!;
      await expect(grid.getAttribute('aria-label')).toMatch(/abril 2026/i);
    });

    await step('Home, End e Page Up/Down andam na grade e o foco acompanha', async () => {
      // accessibility.keyboard.homeEnd e .pageUpDown — as duas linhas estavam
      // documentadas e sem asserção nenhuma. Aqui as teclas eram tratadas, a
      // legenda até virava de mês, e o foco ia parar no `body`: a grade era
      // redesenhada DEPOIS do `focus()`, e o botão focado deixava de existir.
      //
      // A precondição é própria e a sequência devolve a grade ao mês de partida,
      // para o replay do painel medir o mesmo.
      const doc = canvasElement.ownerDocument;
      // A partida é o dia que É a parada de tabulação da grade — o mesmo ponto a
      // que um teclado chega por Tab. Pegar um dia qualquer por índice testaria
      // uma entrada que ninguém consegue fazer.
      const partida = Array.from(
        canvasElement.querySelectorAll<HTMLElement>('.nds-calendar-day-btn'),
      ).find((d) => d.tabIndex >= 0)!;
      partida.focus();
      await expect(focusIso(doc)).not.toBeNull();
      const emUtc = (iso: string) => new Date(`${iso}T00:00:00Z`);

      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(emUtc(focusIso(doc)!).getUTCDay()).toBe(0));
      const domingo = focusIso(doc)!;

      await userEvent.keyboard('{End}');
      await waitFor(() => expect(emUtc(focusIso(doc)!).getUTCDay()).toBe(6));
      await expect(
        (emUtc(focusIso(doc)!).getTime() - emUtc(domingo).getTime()) / 86_400_000,
      ).toBe(6);
      const sabado = focusIso(doc)!;

      await userEvent.keyboard('{PageDown}');
      await waitFor(() =>
        expect(emUtc(focusIso(doc)!).getUTCMonth()).toBe((emUtc(sabado).getUTCMonth() + 1) % 12),
      );

      await userEvent.keyboard('{PageUp}');
      await waitFor(() => expect(focusIso(doc)).toBe(sabado));
    });

    await step('O dia é um quadrado de célula, com o número no centro', async () => {
      // Medida computada, e não classe presente: a classe estava lá nas quatro
      // stacks e mesmo assim uma delas desenhava 48×48, porque herdava o padding
      // do botão que compunha por fora.
      const dia = canvasElement.querySelector<HTMLElement>('.nds-calendar-day-btn')!;
      const cs = getComputedStyle(dia);
      const box = dia.getBoundingClientRect();

      await expect(Math.round(box.width)).toBe(Math.round(box.height));
      await expect(Math.round(box.width)).toBeLessThanOrEqual(36);
      await expect(cs.alignItems).toBe('center');
      await expect(cs.justifyContent).toBe('center');
    });

    await step('A paginação de mês é ghost: sem moldura própria', async () => {
      // Emoldurado, o botão de mês competiria com o dia escolhido, que é o único
      // elemento do calendário que deveria ter peso. Medida computada, porque
      // classe presente não é borda ausente.
      const previous = canvas.getByRole('button', { name: 'Ir para o mês anterior' });
      const cs = getComputedStyle(previous);
      await expect(parseFloat(cs.borderTopWidth)).toBe(0);
      await expect(['transparent', 'rgba(0, 0, 0, 0)']).toContain(cs.backgroundColor);
    });

    await step('O calendário encolhe até o conteúdo, e não até o contêiner', async () => {
      // Sem `width: fit-content` as colunas se afastam e as setas vão parar nas
      // bordas do bloco, longe do mês.
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="calendar"]')!;
      await expect(root.getBoundingClientRect().width).toBeLessThan(400);
    });
  },
};
