import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';
import { NdsCalendar } from './calendar';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Estados da GRADE: como ela nasce sem escolha nenhuma, o que acontece com um
// dia bloqueado e o que o teclado faz.
//
// Datas fixas onde a foto importa. A única exceção é a story `Default`, cujo
// assunto é justamente "o mês corrente" — ela não pode fixar data sem deixar de
// documentar o que promete.

const meta: Meta = {
  title: 'UI/Calendar/States',
  decorators: [moduleMetadata({ imports: [NdsCalendar] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'A grade sem escolha, com dias bloqueados e sob navegação por teclado. Um dia bloqueado continua na grade e continua sendo anunciado — some-lo esconderia a informação de que a data existe e está indisponível.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Botão do dia com o valor ISO pedido, dentro da raiz da story. */
function dia(raiz: HTMLElement, iso: string): HTMLElement {
  const el = raiz.querySelector<HTMLElement>(`.nds-calendar-day-btn[data-value="${iso}"]`);
  if (!el) throw new Error(`dia ${iso} não está na grade`);
  return el;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    covers: ['functional.item1'],
    // A grade desta story É o mês corrente — é isso que ela documenta. Fotografá-la
    // no Chromatic criaria uma diferença nova toda virada de mês, todo mês, para
    // sempre: ruído que ensina a aprovar diff sem olhar. O que há de visual aqui
    // já está coberto por `DisabledDates`, que fixa o mês.
    chromatic: { disableSnapshot: true },
    docs: {
      description: {
        story:
          'Sem data escolhida e sem mês inicial. A grade abre no mês corrente, o dia de hoje aparece marcado como tal e nenhuma célula está selecionada — marcar hoje seria confundir "onde estamos" com "o que você escolheu".',
      },
    },
  },
  render: () => ({
    template: `<div ndsCalendar locale="pt-BR"></div>`,
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = canvasElement.querySelector<HTMLElement>('.nds-calendar-root')!;

    await step('A grade abre no mês corrente', async () => {
      // A expectativa sai do MESMO relógio que o componente lê, em vez de uma
      // data escrita à mão: assim a asserção continua verdadeira amanhã, e ainda
      // reprova se a visão abrir em outro mês.
      const hoje = today(getLocalTimeZone());
      await waitFor(() => expect(raiz.querySelector('.nds-calendar-day-btn')).not.toBeNull());
      await expect(dia(raiz, hoje.toString())).toBeInTheDocument();
    });

    await step('O dia de hoje se declara, e não por cor', async () => {
      const hoje = today(getLocalTimeZone());
      await expect(dia(raiz, hoje.toString()).getAttribute('data-today')).not.toBeNull();
    });

    await step('Nada está selecionado', async () => {
      // `data-selected` no botão e `aria-selected` na célula: o primeiro é o que
      // o CSS lê, o segundo é o que o leitor de tela anuncia. Uma grade recém
      // aberta não pode ter nenhum dos dois.
      await expect(raiz.querySelectorAll('.nds-calendar-day-btn[data-selected]')).toHaveLength(0);
      await expect(raiz.querySelectorAll('[aria-selected="true"]')).toHaveLength(0);
    });
  },
};

export const DisabledDates: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    docs: {
      description: {
        story:
          'Dias anteriores a uma data de corte ficam bloqueados, e as pontas da grade mostram os dias dos meses vizinhos. O dia bloqueado continua visível e continua sendo anunciado como indisponível: escondê-lo faria a pessoa procurar uma data que não existe mais.',
      },
    },
  },
  render: () => ({
    props: {
      month: parseDate('2026-04-01'),
      valor: undefined as DateValue | undefined,
      // Corte fixo: com `new Date()` a fronteira andaria um dia por dia e a
      // asserção de "10 está bloqueado, 20 não" viraria falsa sozinha.
      bloqueia: (d: DateValue) => d.compare(parseDate('2026-04-15')) < 0,
    },
    template: `
      <div
        ndsCalendar
        locale="pt-BR"
        [defaultMonth]="month"
        [(value)]="valor"
        [disabled]="bloqueia"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = canvasElement.querySelector<HTMLElement>('.nds-calendar-root')!;
    await waitFor(() => expect(raiz.querySelector('.nds-calendar-day-btn')).not.toBeNull());

    await step('O dia bloqueado é anunciado como indisponível', async () => {
      const bloqueado = dia(raiz, '2026-04-10');
      await expect(bloqueado.getAttribute('data-disabled')).not.toBeNull();
      // `data-disabled` é o que o CSS lê; `aria-disabled` é o que chega a quem
      // não vê a opacidade. Os dois precisam estar lá.
      await expect(bloqueado.getAttribute('aria-disabled')).toBe('true');
    });

    await step('O dia bloqueado não é alcançável pelo ponteiro', async () => {
      // `userEvent.click` aqui não passa — e é essa a prova. Ele se recusa a
      // interagir com elemento sob `pointer-events: none`, imitando o navegador:
      // o clique não chega ao botão porque o teste de acerto não o encontra.
      //
      // Afirmar a propriedade diz o mesmo e diz melhor. Um clique programático
      // por `dispatchEvent` passaria por cima do teste de acerto e provaria algo
      // que nenhum usuário consegue fazer.
      const bloqueado = dia(raiz, '2026-04-10');
      await expect(getComputedStyle(bloqueado).pointerEvents).toBe('none');
      await expect(raiz.querySelectorAll('.nds-calendar-day-btn[data-selected]')).toHaveLength(0);
    });

    await step('O dia liberado continua escolhível', async () => {
      // Sem este passo o anterior provaria pouco: uma grade inteiramente inerte
      // também passaria. Aqui a diferença entre bloqueado e livre fica afirmada.
      const livre = dia(raiz, '2026-04-20');
      await expect(livre.getAttribute('aria-disabled')).not.toBe('true');
      await userEvent.click(livre);
      await waitFor(() =>
        expect(raiz.querySelectorAll('.nds-calendar-day-btn[data-selected]')).toHaveLength(1),
      );
    });

    await step('As pontas mostram os dias dos meses vizinhos', async () => {
      // Abril de 2026 começa numa quarta: a primeira semana da grade traz o fim
      // de março. Sem esses dias a linha abriria com buracos, e a semana
      // deixaria de se ler como semana.
      const neighbours = raiz.querySelectorAll('.nds-calendar-day-btn[data-outside-view]');
      await expect(neighbours.length).toBeGreaterThan(0);
    });

    await step('Dia bloqueado e dia vizinho ficam fora da tabulação', async () => {
      // accessibility.item2 — o primitivo devolvia tabindex NENHUM para os dois
      // casos, e `<button>` sem tabindex é tabulável: medido, esta grade tinha
      // quinze paradas de tabulação em vez de uma.
      const fora = Array.from(
        raiz.querySelectorAll<HTMLElement>(
          '.nds-calendar-day-btn[data-disabled], .nds-calendar-day-btn[data-outside-view]',
        ),
      );
      await expect(fora.length).toBeGreaterThan(0);
      await expect(fora.filter((b) => b.tabIndex >= 0)).toEqual([]);
    });
  },
};

export const KeyboardNavigation: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item5'],
    docs: {
      description: {
        story:
          'As setas percorrem a grade dia a dia e semana a semana, e cada dia anuncia a data por extenso. O dia em foco recebe anel visível — sem ele, quem navega por teclado não sabe onde está.',
      },
    },
  },
  render: () => ({
    props: { month: parseDate('2026-04-01'), valor: parseDate('2026-04-15') },
    template: `<div ndsCalendar locale="pt-BR" [defaultMonth]="month" [value]="valor"></div>`,
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = canvasElement.querySelector<HTMLElement>('.nds-calendar-root')!;
    await waitFor(() => expect(raiz.querySelector('.nds-calendar-day-btn')).not.toBeNull());

    await step('Cada dia anuncia a data por extenso, no idioma da grade', async () => {
      // O número sozinho ("15") não diz de que mês nem de que ano — e é só isso
      // que o texto do botão traz. O `aria-label` é o que torna a grade legível
      // sem a coluna de cabeçalho e sem a legenda.
      const rotulo = dia(raiz, '2026-04-15').getAttribute('aria-label') ?? '';
      await expect(rotulo).toMatch(/abril/i);
      await expect(rotulo).toContain('2026');
    });

    await step('A seta direita anda um dia', async () => {
      dia(raiz, '2026-04-15').focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(document.activeElement).toBe(dia(raiz, '2026-04-16')));
    });

    await step('A seta para baixo anda uma semana', async () => {
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(document.activeElement).toBe(dia(raiz, '2026-04-23')));
    });

    await step('O dia em foco tem anel, e o vizinho não', async () => {
      // Comparação, e não leitura solta: `boxShadow !== 'none'` sozinho passaria
      // numa grade em que TODO dia tem sombra, que é o mesmo que nenhum ter
      // marca de foco. O par é o que torna a asserção falsificável.
      //
      // O `outline: 0` da base mata o anel nativo, então este realce é a única
      // coisa que diz onde o teclado está (WCAG 2.4.7).
      const inFocus = dia(raiz, '2026-04-23');
      const neighbour = dia(raiz, '2026-04-24');
      await expect(document.activeElement).toBe(inFocus);

      const focusRing = getComputedStyle(inFocus).boxShadow;
      const neighbourRing = getComputedStyle(neighbour).boxShadow;
      await expect(focusRing).not.toBe('none');
      await expect(focusRing).not.toBe(neighbourRing);
    });

    await step('Os botões de navegação também recebem anel', async () => {
      // Mesma comparação, agora entre os dois botões de mês: o que tem foco
      // contra o que não tem.
      const [anterior, proximo] = Array.from(
        raiz.querySelectorAll<HTMLElement>('.nds-calendar-nav-btn'),
      );
      // Chega ao botão por teclado, não por `.focus()`: `:focus-visible` depende
      // da modalidade de entrada, e foco programático nem sempre a satisfaz.
      await userEvent.tab({ shift: true });
      await waitFor(() => expect(document.activeElement).not.toBe(dia(raiz, '2026-04-23')));
      anterior!.focus();

      await expect(getComputedStyle(anterior!).boxShadow).not.toBe(
        getComputedStyle(proximo!).boxShadow,
      );
    });
  },
};
