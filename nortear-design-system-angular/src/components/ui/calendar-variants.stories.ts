import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { parseDate } from '@internationalized/date';
import {
  STATES_WITH_TEXT_LEGIVEL,
  describeContrast,
  calendarMeasureContrast,
} from '@shared/testing/calendar-probe';
import { NdsCalendar } from './calendar';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que varia no Calendar é a COMPOSIÇÃO, não um `variant`: o modo de seleção
// (uma data ou várias avulsas), a forma da legenda (texto ou seletores) e
// quantos meses aparecem lado a lado.
//
// Datas fixas em todas: a grade do mês corrente muda toda virada de mês, e a
// foto do Chromatic passaria a divergir sozinha.

const meta: Meta = {
  title: 'UI/Calendar/Variants',
  decorators: [moduleMetadata({ imports: [NdsCalendar] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Modo de seleção, forma da legenda e número de meses em vista. Nenhum deles muda a paleta — o que muda é o que a grade oferece.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Datas marcadas na grade, em ordem de leitura. */
function marcadas(raiz: HTMLElement): string[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>('.nds-calendar-day-btn[data-selected]')).map(
    (el) => el.getAttribute('data-value') ?? '',
  );
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Single: Story = {
  parameters: {
    covers: ['functional.item2', 'accessibility.item3', 'visual.item2'],
    docs: {
      description: {
        story:
          'Seleção de uma única data. O valor inicial marca a célula; cada clique numa célula habilitada troca a marcação.',
      },
    },
  },
  render: () => ({
    props: { valor: parseDate('2026-04-12') },
    template: `<div ndsCalendar locale="pt-BR" [value]="valor"></div>`,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const dia = (n: number) =>
      canvas.getByRole('button', { name: new RegExp(`${n} de abril de 2026`, 'i') });

    await step('A data inicial chega marcada, e sozinha', async () => {
      // accessibility.item3 — a marcação é exclusiva no modo único.
      await expect(marcadas(canvasElement)).toEqual(['2026-04-12']);
      await expect(canvasElement.querySelectorAll('td[aria-selected="true"]').length).toBe(1);
    });

    await step('Clicar em outro dia move a marcação', async () => {
      // functional.item2 — o dia velho tem que PERDER o estado, senão a tela
      // mostra duas seleções num modo que só admite uma. Cada passo estabelece a
      // própria precondição: o clique final devolve o grid ao estado inicial,
      // porque o painel Interactions reexecuta a play no mesmo DOM.
      await userEvent.click(dia(20));
      await expect(marcadas(canvasElement)).toEqual(['2026-04-20']);

      await userEvent.click(dia(12));
      await expect(marcadas(canvasElement)).toEqual(['2026-04-12']);
    });

    await step('O dia escolhido passa em contraste nos três temas e nos dois modos', async () => {
      // accessibility.item6 — o item prometia 4.5:1 e a verificação declarada era
      // "axe-core / Lighthouse", que só enxerga o tema claro da marca default: um
      // sexto do produto. O escuro é a outra metade, e nunca era medido.
      const measurements = calendarMeasureContrast(canvasElement).filter(
        (m) => m.presente && (STATES_WITH_TEXT_LEGIVEL as readonly string[]).includes(m.estado),
      );
      await expect(measurements.length).toBeGreaterThan(0);
      const reprovadas = measurements.filter((m) => (m.ratio ?? 0) < 4.5).map(describeContrast);
      await expect(reprovadas).toEqual([]);
    });
  },
};

export const Multiple: Story = {
  parameters: {
    // Intervalo (`range`) não existe nesta stack: o primitivo de calendário do
    // Radix NG expõe uma data ou uma lista de datas avulsas, e não um par
    // início/fim. Uma story de intervalo aqui fotografaria o nome de um recurso
    // ao lado da imagem de outro.
    coversNotApplicable: {
      'functional.item3': 'o primitivo desta stack não tem modo de intervalo — expõe uma data ou uma lista de datas avulsas',
    },
    docs: {
      description: {
        story: 'Várias datas avulsas: cada escolha soma à lista, e escolher de novo remove.',
      },
    },
  },
  render: () => ({
    props: {
      valor: [parseDate('2026-04-08'), parseDate('2026-04-12'), parseDate('2026-04-16')],
    },
    template: `<div ndsCalendar mode="multiple" locale="pt-BR" [value]="valor"></div>`,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const dia29 = () => canvas.getByRole('button', { name: /29 de abril de 2026/i });

    await step('As três datas iniciais chegam marcadas', async () => {
      await expect(marcadas(canvasElement)).toEqual(['2026-04-08', '2026-04-12', '2026-04-16']);
      await expect(canvasElement.querySelectorAll('td[aria-selected="true"]').length).toBe(3);
    });

    await step('Uma nova escolha soma, e repetir remove', async () => {
      // É esta a diferença para o modo único, e é a única asserção que a pega.
      // O segundo clique devolve o grid ao estado inicial, para o replay no
      // painel medir o mesmo.
      await userEvent.click(dia29());
      await expect(marcadas(canvasElement)).toEqual([
        '2026-04-08', '2026-04-12', '2026-04-16', '2026-04-29',
      ]);

      await userEvent.click(dia29());
      await expect(marcadas(canvasElement)).toEqual(['2026-04-08', '2026-04-12', '2026-04-16']);
    });
  },
};

export const CaptionLabel: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item3'],
    docs: {
      description: {
        story:
          'Legenda em texto com mês e ano no idioma configurado, entre os botões de mês anterior e próximo.',
      },
    },
  },
  render: () => ({
    props: { valor: parseDate('2026-04-12') },
    template: `<div ndsCalendar locale="pt-BR" [value]="valor"></div>`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('A legenda traz mês e ano no idioma pedido', async () => {
      // functional.item6 — o idioma vale para a legenda E para o cabeçalho da
      // semana; verificar só um dos dois deixaria metade da tradução solta.
      await expect(canvasElement.querySelector('.nds-calendar-caption')).toHaveTextContent(
        /abril 2026/i,
      );

      const weekDays = Array.from(canvasElement.querySelectorAll('th[scope="col"]')).map((th) =>
        th.textContent?.trim().toLowerCase(),
      );
      // A forma curta, e a mesma nas cinco: 'narrow' dá "D S T Q Q S S", com duas
      // quartas e duas quintas indistinguíveis, e o ponto de "dom." é ruído numa
      // coluna de uma palavra. Conferir só a inicial aceitaria tudo.
      await expect(weekDays).toEqual(['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']);
    });

    await step('A semana começa no domingo, e não no que o locale mandar', async () => {
      // O primitivo começa na segunda por padrão. Uma grade que muda de forma na
      // troca de idioma tiraria a coluna do fim de semana das pontas.
      const primeiro = canvasElement.querySelector('th[scope="col"]');
      await expect(primeiro?.textContent?.trim().toLowerCase()).toBe('dom');
    });
  },
};

export const CaptionDropdown: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: {
      description: {
        story: 'Mês e ano viram seletores, para saltar de período sem passar mês a mês.',
      },
    },
  },
  render: () => ({
    props: { valor: parseDate('2026-04-12') },
    template: `
      <div ndsCalendar locale="pt-BR" captionLayout="dropdown" [value]="valor"></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const monthSelector = () => canvas.getByRole('combobox', { name: 'Selecionar mês' });
    const yearSelector = () => canvas.getByRole('combobox', { name: 'Selecionar ano' });

    await step('Mês e ano viram controles operáveis', async () => {
      // functional.item7 — a story existe pelo salto de período: verificar que o
      // calendário renderizou não a distingue da legenda de texto.
      await expect(monthSelector()).toBeInTheDocument();
      await expect(yearSelector()).toBeInTheDocument();
    });

    await step('O clique chega aos seletores', async () => {
      // `selectOptions` escolhe a opção por API e passa mesmo com o controle
      // coberto. A faixa que posiciona os botões de mês é absoluta e cobre a
      // legenda inteira; `elementFromPoint` devolve QUEM está no topo do ponto, e
      // é a única coisa aqui que enxerga isso.
      const doc = canvasElement.ownerDocument;
      for (const selector of canvasElement.querySelectorAll<HTMLElement>('.nds-calendar-select')) {
        const r = selector.getBoundingClientRect();
        const noTopo = doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        await expect(selector === noTopo || selector.contains(noTopo)).toBe(true);
      }
    });

    await step('A lista de anos corre livre para os dois lados', async () => {
      // Uma janela curta em torno do ano em vista prendia a rolagem: para passar
      // do último ano era preciso escolhê-lo e reabrir o seletor. Quem limita o
      // que aparece é a altura do painel — onze itens, no CSS.
      const anos = Array.from(yearSelector().querySelectorAll('option')).map((o) => Number(o.value));
      await expect(anos.length).toBe(201);
      await expect(anos).toContain(2026);
      await expect(2026 - Math.min(...anos)).toBe(Math.max(...anos) - 2026);
    });

    await step('Trocar o mês no seletor leva o grid junto', async () => {
      // Busca a cada vez: a legenda é reconstruída na troca, e uma referência
      // guardada agiria num nó fora da tela, sem erro e sem efeito. Volta para
      // abril no fim, porque o painel reexecuta a play no mesmo DOM.
      await userEvent.selectOptions(monthSelector(), '5');
      await expect(canvasElement.querySelector('[data-value="2026-06-01"]')).not.toBeNull();

      await userEvent.selectOptions(monthSelector(), '3');
      await expect(canvasElement.querySelector('[data-value="2026-04-01"]')).not.toBeNull();
    });

    await step('Trocar o ano no seletor leva o grid junto', async () => {
      await userEvent.selectOptions(yearSelector(), '2028');
      await expect(canvasElement.querySelector('[data-value^="2028-04-"]')).not.toBeNull();

      await userEvent.selectOptions(yearSelector(), '2026');
      await expect(canvasElement.querySelector('[data-value="2026-04-01"]')).not.toBeNull();
    });
  },
};

export const TwoMonths: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Dois meses lado a lado, com uma navegação só. Reduz o número de cliques quando a escolha costuma cair no mês seguinte.',
      },
    },
  },
  render: () => ({
    props: { valor: parseDate('2026-04-12') },
    template: `
      <div ndsCalendar locale="pt-BR" [numberOfMonths]="2" [value]="valor"></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Dois meses consecutivos, cada um com a própria legenda', async () => {
      const legendas = Array.from(canvasElement.querySelectorAll('.nds-calendar-caption')).map(
        (el) => el.textContent?.trim().toLowerCase(),
      );
      await expect(legendas).toEqual(['abril 2026', 'maio 2026']);
      await expect(canvasElement.querySelectorAll('table[role="grid"]').length).toBe(2);
    });

    await step('A navegação é uma só, e move a janela inteira', async () => {
      // Duas grades e dois pares de setas seriam dois controles para o mesmo
      // movimento — e a pessoa não saberia qual mexe em qual.
      await expect(canvasElement.querySelectorAll('.nds-calendar-nav-btn').length).toBe(2);

      await userEvent.click(canvas.getByRole('button', { name: 'Ir para o próximo mês' }));
      await expect(
        Array.from(canvasElement.querySelectorAll('.nds-calendar-caption')).map((el) =>
          el.textContent?.trim().toLowerCase(),
        ),
      ).toEqual(['maio 2026', 'junho 2026']);

      // Devolve a janela para abril: o painel reexecuta a play no mesmo DOM.
      await userEvent.click(canvas.getByRole('button', { name: 'Ir para o mês anterior' }));
      await expect(canvasElement.querySelector('.nds-calendar-caption')).toHaveTextContent(
        /abril 2026/i,
      );
    });
  },
};
