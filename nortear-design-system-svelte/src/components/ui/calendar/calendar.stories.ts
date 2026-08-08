import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import { Calendar } from './index';
import CalendarStory from './CalendarStory.svelte';
import CalendarDocs from '@/components/docs/CalendarDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta = {
  title: 'UI/Calendar',
  component: Calendar,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: {
      page: withAutoDocsTab(CalendarDocs),
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
      await userEvent.click(canvas.getByRole('button', { name: /next/i }));
      await expect(canvasElement.querySelector('.nds-calendar-day-btn[data-value="2026-05-15"]')).not.toBeNull();
      await userEvent.click(canvas.getByRole('button', { name: /previous/i }));
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
  },
};
