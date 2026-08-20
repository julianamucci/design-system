import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import { isoDoFoco } from '@shared/testing/calendar-probe';
import { Calendar } from './index';
import CalendarStory from './CalendarStory.svelte';
import CalendarDocs from '@/components/docs/CalendarDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { calendarSource } from './calendar.source';

const meta: Meta = {
  title: 'UI/Calendar',
  component: Calendar,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: {
      page: withAutoDocsTab(CalendarDocs),
      source: { transform: calendarSource },
      description: {
        component:
          'Calendar é um seletor visual de datas baseado em bits-ui. Aceita type="single" ou type="multiple", locale para rótulos traduzidos, captionLayout label/dropdown e datas desabilitadas via isDateDisabled. Na stack Svelte a API usa @internationalized/date (DateValue) em vez do Date nativo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item2', 'accessibility.item3', 'accessibility.item5', 'functional.item5', 'visual.item1', 'accessibility.item4', 'accessibility.item6'],
  },
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'single', locale: 'pt-BR' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const focado = () =>
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.getAttribute('data-value') ??
      null;

    await step('O mês é uma tabela de datas', async () => {
      // accessibility.item1 — `gridcell` só existe dentro de um `grid`; sem o
      // papel na tabela o leitor de tela não oferece navegação bidimensional.
      await expect(canvas.getByRole('grid')).toBeInTheDocument();
      await expect(canvas.getAllByRole('gridcell').length).toBeGreaterThan(27);
      await expect(canvasElement.querySelectorAll('.nds-calendar-weekday').length).toBe(7);
    });

    await step('A data escolhida está marcada e anuncia a data por extenso', async () => {
      // accessibility.item2 e item3 — o texto visível da célula é só "12".
      const escolhida = canvasElement.querySelector('.nds-calendar-day-btn[data-selected]')!;
      await expect(escolhida).toHaveAttribute('data-value', '2026-04-12');
      await expect(escolhida.getAttribute('aria-label')).toMatch(/12 de abril de 2026/i);
    });

    await step('A paginação anuncia em português, e a semana não é lida duas vezes', async () => {
      // Os botões de mês só têm ícone: o que o leitor de tela anuncia é o
      // aria-label, e ele estava em três formas — "Go to previous month" cravado
      // no Vanilla, "Previous page" vindo da lib no Vue (que nem fala de mês) e
      // "Previous" no Svelte. Num calendário em português, três das quatro
      // anunciavam em inglês. Nome exato, e não regex frouxa: era a regex que
      // aceitava os dois idiomas e deixava a divergência passar.
      await expect(canvas.getByRole('button', { name: 'Ir para o mês anterior' })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: 'Ir para o próximo mês' })).toBeInTheDocument();

      // A linha dos dias da semana fica fora da árvore de acessibilidade: cada
      // dia já anuncia a data por extenso, e repetir a coluna a cada célula só
      // encompridaria a leitura. Duas stacks faziam, duas não.
      await expect(canvasElement.querySelector('thead')).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O dia é um quadrado de célula, com o número no centro', async () => {
      // Medida computada, e não classe presente: a classe estava lá nas quatro
      // e mesmo assim o Vue desenhava 48×48, porque herdava o padding do botão
      // que ele compõe por fora. E o Svelte, que não compõe botão nenhum,
      // deixava o número no canto superior esquerdo.
      const dia = canvasElement.querySelector<HTMLElement>('.nds-calendar-day-btn')!;
      const cs = getComputedStyle(dia);
      const caixa = dia.getBoundingClientRect();

      await expect(Math.round(caixa.width)).toBe(Math.round(caixa.height));
      await expect(Math.round(caixa.width)).toBeLessThanOrEqual(36);
      await expect(cs.alignItems).toBe('center');
      await expect(cs.justifyContent).toBe('center');
    });

    await step('A paginação de mês é ghost: sem moldura própria', async () => {
      // O Vue e o Vanilla desenhavam esses botões com borda e fundo, enquanto o
      // React e o Svelte usavam ghost — o mesmo controle com dois pesos
      // diferentes. Emoldurado, ele competia com o dia escolhido, que é o único
      // elemento do calendário que deveria ter peso. Medida computada, porque
      // classe presente não é borda ausente.
      const anterior = canvas.getByRole('button', { name: /previous|anterior/i });
      const cs = getComputedStyle(anterior);
      await expect(parseFloat(cs.borderTopWidth)).toBe(0);
      await expect(['transparent', 'rgba(0, 0, 0, 0)']).toContain(cs.backgroundColor);
    });

    await step('A semana respira longe da legenda, e o dia vizinho é apagado', async () => {
      // Os dois eram divergência entre stacks: o respiro era 16px no React e no
      // Svelte, 8 no Vanilla e ZERO no Vue (lá o cabeçalho é irmão dos meses,
      // então o gap interno não o alcançava). E o dia de fora do mês só ficava
      // apagado no Vue e no Vanilla — no React a regra mirava a célula, e o
      // botão dentro dela repunha a própria cor; no Svelte não havia regra.
      const legenda = canvasElement.querySelector<HTMLElement>('.nds-calendar-caption')!;
      const semana = canvasElement.querySelector<HTMLElement>('thead')!;
      const respiro = semana.getBoundingClientRect().top - legenda.getBoundingClientRect().bottom;
      await expect(Math.round(respiro)).toBe(16);

      const vizinho = canvasElement.querySelector<HTMLElement>('.nds-calendar-day-btn[data-outside-month]')!;
      const doMes = canvasElement.querySelector<HTMLElement>('.nds-calendar-day-btn:not([data-outside-month])')!;
      await expect(getComputedStyle(vizinho).color).not.toBe(getComputedStyle(doMes).color);
    });

    await step('O clique nos botões de mês chega neles', async () => {
      // `userEvent.click` acerta o elemento mesmo com outra coisa pintada
      // por cima: ele verifica `pointer-events`, não oclusão. Foi assim que a nav
      // ficou morta na tela com a suíte verde — a legenda, posicionada, pintava
      // por cima e engolia o clique. `elementFromPoint` devolve QUEM está no
      // topo naquele ponto, e é a única coisa aqui que enxerga isso.
      const doc = canvasElement.ownerDocument;
      for (const nome of [/previous|anterior/i, /next|próximo|proximo/i]) {
        const btn = canvas.getByRole('button', { name: nome });
        const r = btn.getBoundingClientRect();
        const noTopo = doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        await expect(btn.contains(noTopo)).toBe(true);
      }
    });

    await step('Os botões de mês trocam o mês exibido', async () => {
      // Cada passo estabelece a própria precondição: volta ao mês de partida no
      // fim, porque o painel reexecuta a play no mesmo DOM.
      await userEvent.click(canvas.getByRole('button', { name: /next|próximo|proximo/i }));
      await expect(canvasElement.querySelector('.nds-calendar-day-btn[data-value="2026-05-15"]')).not.toBeNull();
      await userEvent.click(canvas.getByRole('button', { name: /previous|anterior/i }));
      await expect(canvasElement.querySelector('.nds-calendar-day-btn[data-value="2026-04-15"]')).not.toBeNull();
    });

    await step('Tab entra no grid uma vez só e as setas percorrem o mês', async () => {
      // functional.item5 e accessibility.item5 — o grid é uma parada de
      // tabulação, não trinta: quem entra anda com as setas e sai com um Tab.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      for (let i = 0; i < 12 && !focado(); i += 1) await userEvent.tab();
      const origem = focado();
      await expect(origem).not.toBeNull();
      await userEvent.keyboard('{ArrowRight}');
      const destino = focado();
      const umDia = 24 * 60 * 60 * 1000;
      await expect(new Date(destino!).getTime() - new Date(origem!).getTime()).toBe(umDia);
    });

    await step('A grade é UMA parada de tabulação', async () => {
      // accessibility.item2 — o item promete "só o dia corrente entra na ordem
      // do Tab" desde sempre, e nenhuma asserção o cobrava: medido, duas stacks
      // tinham dezenas de paradas. Aqui está certo, e a contagem é o que impede
      // de deixar de estar.
      const tabulaveis = Array.from(
        canvasElement.querySelectorAll<HTMLElement>('.nds-calendar-day-btn'),
      ).filter((d) => d.tabIndex >= 0);
      await expect(tabulaveis).toHaveLength(1);
    });

    await step('A grade se nomeia pelo mês em vista', async () => {
      // Sem `aria-label` o grid é anunciado como "tabela" e nada mais — e com
      // dois meses na tela as duas soam iguais.
      const grade = canvasElement.querySelector('table')!;
      await expect(grade.getAttribute('aria-label')).toMatch(/abril 2026/i);
    });

    await step('Home, End e Page Up/Down andam na grade e o foco acompanha', async () => {
      // accessibility.keyboard.homeEnd e .pageUpDown — as duas linhas estavam
      // documentadas e sem asserção nenhuma; medido, aqui as quatro teclas não
      // faziam absolutamente nada.
      const doc = canvasElement.ownerDocument;
      // A partida é o dia que É a parada de tabulação da grade — o mesmo ponto a
      // que um teclado chega por Tab. Pegar um dia qualquer por índice testaria
      // uma entrada que ninguém consegue fazer.
      const partida = Array.from(
        canvasElement.querySelectorAll<HTMLElement>('.nds-calendar-day-btn'),
      ).find((d) => d.tabIndex >= 0)!;
      partida.focus();
      await expect(isoDoFoco(doc)).not.toBeNull();
      const emUtc = (iso: string) => new Date(`${iso}T00:00:00Z`);

      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(emUtc(isoDoFoco(doc)!).getUTCDay()).toBe(0));
      const domingo = isoDoFoco(doc)!;

      await userEvent.keyboard('{End}');
      await waitFor(() => expect(emUtc(isoDoFoco(doc)!).getUTCDay()).toBe(6));
      await expect(
        (emUtc(isoDoFoco(doc)!).getTime() - emUtc(domingo).getTime()) / 86_400_000,
      ).toBe(6);
      const sabado = isoDoFoco(doc)!;

      await userEvent.keyboard('{PageDown}');
      await waitFor(() =>
        expect(emUtc(isoDoFoco(doc)!).getUTCMonth()).toBe((emUtc(sabado).getUTCMonth() + 1) % 12),
      );

      await userEvent.keyboard('{PageUp}');
      await waitFor(() => expect(isoDoFoco(doc)).toBe(sabado));
    });
  },
};
