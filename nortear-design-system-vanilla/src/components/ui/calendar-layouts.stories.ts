import type { Meta, StoryObj } from '@storybook/html-vite';
import { createCalendar } from './calendar';
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
      class: 'nds-rounded-md nds-border-default',
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
    const legenda = () => canvasElement.querySelector('.nds-calendar-month-label');

    await step('A legenda traz mês e ano no idioma pedido', async () => {
      // functional.item6 — o idioma vale para a legenda E para o cabeçalho da
      // semana; verificar só um dos dois deixaria metade da tradução solta.
      await expect(legenda()).toHaveTextContent(/abril 2026/i);
      const diasDaSemana = Array.from(canvasElement.querySelectorAll('th[scope="col"]')).map((th) =>
        th.textContent?.trim().toLowerCase(),
      );
      await expect(diasDaSemana[0]).toMatch(/^dom/);
      await expect(diasDaSemana[6]).toMatch(/^s[áa]b/);
    });

    await step('Os botões de mês trocam a legenda', async () => {
      // Cada passo estabelece a própria precondição: volta ao mês de partida
      // antes de medir, porque o painel reexecuta a play no mesmo DOM.
      const inicial = legenda()?.textContent;
      await userEvent.click(canvas.getByRole('button', { name: 'Go to next month' }));
      await expect(legenda()).toHaveTextContent(/maio 2026/i);
      await userEvent.click(canvas.getByRole('button', { name: 'Go to previous month' }));
      await expect(legenda()?.textContent).toBe(inicial);
    });

    await step('Voltar antes de janeiro vira o ano', async () => {
      // O mês é um contador de 0 a 11: sem a virada, voltar de janeiro daria
      // um mês inexistente e o ano ficaria parado. É o caminho que nenhuma
      // navegação de um mês só alcança.
      const anterior = canvas.getByRole('button', { name: 'Go to previous month' });
      for (let i = 0; i < 4; i += 1) await userEvent.click(anterior);
      await expect(legenda()).toHaveTextContent(/dezembro 2025/i);

      // Cada passo estabelece a própria precondição: volta para abril de 2026.
      const proximo = canvas.getByRole('button', { name: 'Go to next month' });
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
      await expect(raiz).toHaveClass('nds-calendar');
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
      await expect(raiz).toHaveClass('nds-calendar');
      await expect(raiz.className.trim()).toBe('nds-calendar');
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
      class: 'nds-rounded-md nds-border-default',
    }),
  parameters: {
    covers: ['functional.item7'],
    docs: {
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
