import type { Meta, StoryObj } from '@storybook/html-vite';
import { createCalendar } from './calendar';
import { calendarSource, calendarSourceWith } from './calendar.source';
import { userEvent, within, expect } from 'storybook/test';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Layouts alcançáveis pela API da factory: a legenda em texto (com os botões de
// mês) e o enquadramento do bloco, que é responsabilidade de quem monta a tela.

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Calendar/Layouts',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: calendarSource },
      description: {
        component:
          'Legenda do mês e enquadramento do bloco. O calendário não desenha a própria moldura: ela vem das classes de quem o posiciona.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const CaptionLabel: Story = {
  render: () =>
    createCalendar({
      locale: 'pt-BR',
      value: new Date(2026, 3, 12),
    }),
  parameters: {
    covers: ['functional.item6', 'visual.item3'],
    docs: {
      description: {
        story:
          'Legenda em texto com mês e ano no idioma configurado, entre os botões de mês anterior e próximo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const legenda = () => canvasElement.querySelector('.nds-calendar-caption');

    await step('A legenda traz mês e ano no idioma pedido', async () => {
      // functional.item6 — o idioma vale para a legenda E para o cabeçalho da
      // semana; verificar só um dos dois deixaria metade da tradução solta.
      await expect(legenda()).toHaveTextContent(/abril 2026/i);
      const diasDaSemana = Array.from(canvasElement.querySelectorAll('th[scope="col"]')).map((th) =>
        th.textContent?.trim().toLowerCase(),
      );
      // A forma curta, e a mesma nas quatro: 'narrow' dá "D S T Q Q S S", com
      // duas quartas e duas quintas indistinguíveis, e o ponto de "dom." é
      // ruído numa coluna de uma palavra. Conferir só a inicial aceitava tudo.
      await expect(diasDaSemana).toEqual(['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']);
    });

    await step('Os botões de mês trocam a legenda', async () => {
      // Cada passo estabelece a própria precondição: volta ao mês de partida
      // antes de medir, porque o painel reexecuta a play no mesmo DOM.
      const inicial = legenda()?.textContent;
      await userEvent.click(canvas.getByRole('button', { name: 'Ir para o próximo mês' }));
      await expect(legenda()).toHaveTextContent(/maio 2026/i);
      await userEvent.click(canvas.getByRole('button', { name: 'Ir para o mês anterior' }));
      await expect(legenda()?.textContent).toBe(inicial);
    });

    await step('Voltar antes de janeiro vira o ano', async () => {
      // O mês é um contador de 0 a 11: sem a virada, voltar de janeiro daria
      // um mês inexistente e o ano ficaria parado. É o caminho que nenhuma
      // navegação de um mês só alcança.
      const anterior = canvas.getByRole('button', { name: 'Ir para o mês anterior' });
      for (let i = 0; i < 4; i += 1) await userEvent.click(anterior);
      await expect(legenda()).toHaveTextContent(/dezembro 2025/i);

      // Cada passo estabelece a própria precondição: volta para abril de 2026.
      const proximo = canvas.getByRole('button', { name: 'Ir para o próximo mês' });
      for (let i = 0; i < 4; i += 1) await userEvent.click(proximo);
      await expect(legenda()).toHaveTextContent(/abril 2026/i);
    });
  },
};

export const Bordered: Story = {
  render: () =>
    createCalendar({
      locale: 'pt-BR',
      value: new Date(2026, 3, 12),
      class: 'nds-rounded-md nds-border-default nds-shadow-sm',
    }),
  parameters: {
    docs: {
      // Override de story: a moldura é o assunto, e ela entra por `class`.
      source: {
        transform: calendarSourceWith({
          class: 'nds-rounded-md nds-border-default nds-shadow-sm',
        }),
      },
      description: {
        story:
          'Com borda e sombra — isola o calendário de um fundo uniforme, quando ele aparece direto na página.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('As classes do consumidor somam às do componente', async () => {
      // O ponto da story é a composição de classes: a moldura entra sem
      // apagar a classe base, senão o calendário perderia o próprio estilo.
      const raiz = canvasElement.querySelector('[data-slot="calendar"]')!;
      await expect(raiz).toHaveClass('nds-calendar-root');
      await expect(raiz).toHaveClass('nds-border-default');
      await expect(raiz).toHaveClass('nds-shadow-sm');
    });

    await step('A borda é visível de fato', async () => {
      // Classe presente não é borda desenhada: a utilitária poderia ter sido
      // renomeada no CSS e a asserção de classe continuaria passando.
      const raiz = canvasElement.querySelector('[data-slot="calendar"]')!;
      const borda = getComputedStyle(raiz).borderTopWidth;
      await expect(parseFloat(borda)).toBeGreaterThan(0);
    });
  },
};

export const Bare: Story = {
  render: () => createCalendar({ locale: 'pt-BR', value: new Date(2026, 3, 12) }),
  parameters: {
    docs: {
      description: {
        story:
          'Sem classes adicionais — para encaixar dentro de um contêiner que já tem borda e sombra, como um popover.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Sem moldura própria quando nada é passado', async () => {
      const raiz = canvasElement.querySelector('[data-slot="calendar"]')!;
      await expect(raiz).toHaveClass('nds-calendar-root');
      await expect(raiz.className.trim()).toBe('nds-calendar-root');
      await expect(parseFloat(getComputedStyle(raiz).borderTopWidth)).toBe(0);
    });
  },
};

export const CaptionDropdown: Story = {
  render: () =>
    createCalendar({
      locale: 'pt-BR',
      captionLayout: 'dropdown',
      value: new Date(2026, 3, 12),
    }),
  parameters: {
    covers: ['functional.item7'],
    docs: {
      // Override de story: a legenda com seletores é o assunto.
      source: { transform: calendarSourceWith({ captionLayout: 'dropdown' }) },
      description: {
        story: 'Mês e ano viram seletores, para saltar de período sem passar mês a mês.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Mês e ano viram controles operáveis', async () => {
      // functional.item7 — a story existe pelo salto de período: verificar que
      // o calendário renderizou não a distingue da legenda de texto.
      await expect(canvas.getByRole('combobox', { name: 'Selecionar mês' })).toBeInTheDocument();
      await expect(canvas.getByRole('combobox', { name: 'Selecionar ano' })).toBeInTheDocument();
    });

    await step('O clique chega aos seletores', async () => {
      // `selectOptions` escolhe a opção por API e passa mesmo com o controle
      // coberto — foi assim que o seletor ficou inerte na tela com a suíte
      // verde. A faixa que posiciona os botões de mês é absoluta e cobre a
      // legenda inteira; `elementFromPoint` devolve QUEM está no topo do ponto,
      // e é a única coisa aqui que enxerga isso.
      const doc = canvasElement.ownerDocument;
      for (const seletor of canvasElement.querySelectorAll<HTMLElement>('.nds-calendar-select')) {
        const r = seletor.getBoundingClientRect();
        const noTopo = doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        await expect(seletor === noTopo || seletor.contains(noTopo)).toBe(true);
      }
    });

    await step('A lista de anos corre livre para os dois lados', async () => {
      // Uma janela curta em torno do ano em vista prendia a rolagem: para
      // passar do último ano da lista era preciso escolhê-lo e reabrir o
      // seletor. A lista agora é completa e simétrica — o que limita o que
      // aparece é a altura do painel, onze itens no CSS, com o ano corrente no
      // meio. O teto em si é desenhado pelo navegador e não é alcançável por
      // getComputedStyle daqui; o que dá para medir é a lista.
      const anos = Array.from(
        canvasElement.querySelectorAll<HTMLOptionElement>('.nds-calendar-select:last-of-type option'),
      ).map((o) => Number(o.value));
      await expect(anos.length).toBe(201);
      await expect(Math.max(...anos) - Math.min(...anos)).toBe(200);
      await expect(anos).toContain(2026);
      // Simétrico: a lib abria cem anos para trás e dez para frente, e uma data
      // no ano que vem ficava fora do alcance do seletor.
      await expect(2026 - Math.min(...anos)).toBe(Math.max(...anos) - 2026);
    });

    await step('Trocar o mês no seletor leva o grid junto', async () => {
      // Busca a cada vez: a legenda é reconstruída na troca, e uma referência
      // guardada agiria num nó fora da tela, sem erro e sem efeito.
      const seletorDeMes = () => canvas.getByRole('combobox', { name: 'Selecionar mês' });
      await userEvent.selectOptions(seletorDeMes(), '5');
      await expect(canvasElement.querySelector('[data-day="2026-06-01"]')).not.toBeNull();

      // Cada passo estabelece a própria precondição: volta para abril, porque o
      // painel reexecuta a play no mesmo DOM.
      await userEvent.selectOptions(seletorDeMes(), '3');
      await expect(canvasElement.querySelector('[data-day="2026-04-01"]')).not.toBeNull();
    });

    await step('Trocar o ano no seletor leva o grid junto', async () => {
      const seletorDeAno = () => canvas.getByRole('combobox', { name: 'Selecionar ano' });
      await userEvent.selectOptions(seletorDeAno(), '2028');
      await expect(canvasElement.querySelector('[data-day^="2028-04-"]')).not.toBeNull();
      await userEvent.selectOptions(seletorDeAno(), '2026');
      await expect(canvasElement.querySelector('[data-day="2026-04-01"]')).not.toBeNull();
    });
  },
};

export const TwoMonths: Story = {
  render: () =>
    createCalendar({
      locale: 'pt-BR',
      numberOfMonths: 2,
      value: new Date(2026, 3, 28),
    }),
  parameters: {
    docs: {
      // Override de story: a janela de dois meses é o assunto.
      source: {
        transform: calendarSourceWith({
          numberOfMonths: 2,
          value: 'new Date(2026, 3, 28)',
        }),
      },
      description: {
        story: 'Dois meses lado a lado, para escolher datas que atravessam a virada.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('São dois grids, de meses consecutivos', async () => {
      // Contar células passaria com dois meses iguais; o que a story mostra é a
      // virada, então a asserção é sobre QUAIS meses aparecem.
      await expect(canvasElement.querySelectorAll('[role="grid"]').length).toBe(2);
      await expect(canvasElement.querySelector('[data-day="2026-04-30"]')).not.toBeNull();
      await expect(canvasElement.querySelector('[data-day="2026-05-01"]')).not.toBeNull();
    });

    await step('Cada mês diz o próprio nome, e a legenda diz a janela', async () => {
      // Sem o rótulo por mês, a segunda grade fica sem identificação e a pessoa
      // tem que contar os dias para descobrir de que mês ela é.
      const rotulos = Array.from(
        canvasElement.querySelectorAll('.nds-calendar-month .nds-calendar-caption'),
      ).map((el) => el.textContent?.trim().toLowerCase() ?? '');
      await expect(rotulos).toEqual(['abril 2026', 'maio 2026']);
      // A faixa de navegação não repete a janela: ela só prende os dois botões
      // nas pontas, como nas outras três stacks. O rótulo "abril – maio 2026"
      // que morava ali era invenção do Vanilla, e dizia em terceiro lugar o que
      // as duas legendas já dizem.
      await expect(
        canvasElement.querySelectorAll('.nds-calendar-nav-overlay .nds-calendar-caption').length,
      ).toBe(0);
    });

    await step('Escolher no segundo mês não move a janela', async () => {
      // Com um mês só, escolher um dia vizinho traz a visão junto — senão a
      // escolha sumiria da tela. Com dois, o dia já está visível, e mover faria
      // o grid pular embaixo do cursor. Cada passo estabelece a própria
      // precondição: o clique final devolve a escolha para 28 de abril.
      const rotulos = () =>
        Array.from(
          canvasElement.querySelectorAll('.nds-calendar-month .nds-calendar-caption'),
        ).map((el) => el.textContent?.trim().toLowerCase() ?? '');
      // Busca dentro do bloco do mês, e não no canvas: um dia da virada aparece
      // nos DOIS grids — 28 de abril é dia real em abril e vizinho em maio.
      const bloco = (i: number) =>
        canvasElement.querySelectorAll<HTMLElement>('.nds-calendar-month')[i];
      const blockDay = (i: number, iso: string) =>
        bloco(i).querySelector<HTMLButtonElement>(`.nds-calendar-day-btn[data-day="${iso}"]`)!;

      await userEvent.click(blockDay(1, '2026-05-05'));
      await expect(rotulos()).toEqual(['abril 2026', 'maio 2026']);
      await expect(blockDay(1, '2026-05-05')).toHaveAttribute('data-selected');

      await userEvent.click(blockDay(0, '2026-04-28'));
      await expect(rotulos()).toEqual(['abril 2026', 'maio 2026']);
    });
  },
};
