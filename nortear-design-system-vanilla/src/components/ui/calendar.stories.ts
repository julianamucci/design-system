import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { focusIso } from '@shared/testing/calendar-probe';
import { createCalendar } from './calendar';
import { calendarSource } from './calendar.source';
import { createCalendarDocs } from '@/components/docs/CalendarDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Calendar',
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(createCalendarDocs),
      source: { transform: calendarSource },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: () =>
    createCalendar({ locale: 'pt-BR',
      value: new Date(2026, 3, 12),
    }),
  parameters: {
    covers: ['visual.item1', 'accessibility.item4', 'accessibility.item6', 'accessibility.item1', 'accessibility.item2'],
    docs: {
      description: {
        story:
          'Calendar no modo padrão (seleção única). A factory vanilla do Vanilla expõe `value`, `onSelect`, `disabled` e `class` — sem suporte nativo a mode="multiple"/"range", captionLayout, locale ou classNames por slot.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Grid semântico renderizado com role="grid"', async () => {
      const grid = canvas.getByRole('grid');
      await expect(grid).toBeInTheDocument();
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

    await step('Navegação com aria-label Previous/Next presente', async () => {
      const prev = canvas.getByRole('button', { name: 'Ir para o mês anterior' });
      const next = canvas.getByRole('button', { name: 'Ir para o próximo mês' });
      await expect(prev).toBeInTheDocument();
      await expect(next).toBeInTheDocument();
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

    await step('O calendário encolhe até o conteúdo, e não até o contêiner', async () => {
      // Sem `width: fit-content` ele esticava para a largura do bloco: as
      // colunas se afastavam e o cabeçalho abria de ponta a ponta, com as setas
      // nas bordas do card em vez de ao lado do mês. E item esticado não tem o
      // que centralizar, então o `justify-content: center` do contêiner das
      // docs pages não fazia efeito.
      const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="calendar"]')!;
      const wide = document.createElement('div');
      wide.style.width = '900px';
      canvasElement.appendChild(wide);
      wide.appendChild(raiz);

      await expect(raiz.getBoundingClientRect().width).toBeLessThan(400);
      const nav = raiz.querySelector<HTMLElement>('.nds-calendar-nav-overlay')!;
      const grade = raiz.querySelector<HTMLElement>('.nds-calendar-table')!;
      await expect(
        Math.abs(nav.getBoundingClientRect().width - grade.getBoundingClientRect().width),
      ).toBeLessThan(2);
    });

    await step('A paginação de mês é ghost: sem moldura própria', async () => {
      // O Vue e o Vanilla desenhavam esses botões com borda e fundo, enquanto o
      // React e o Svelte usavam ghost — o mesmo controle com dois pesos
      // diferentes. Emoldurado, ele competia com o dia escolhido, que é o único
      // elemento do calendário que deveria ter peso. Medida computada, porque
      // classe presente não é borda ausente.
      const anterior = canvas.getByRole('button', { name: 'Ir para o mês anterior' });
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
      const legenda = canvasElement.querySelector<HTMLElement>('.nds-calendar-nav-overlay')!;
      const semana = canvasElement.querySelector<HTMLElement>('thead')!;
      const respiro = semana.getBoundingClientRect().top - legenda.getBoundingClientRect().bottom;
      await expect(Math.round(respiro)).toBe(16);

      const neighbour = canvasElement.querySelector<HTMLElement>('.nds-calendar-day-btn[data-outside-month]')!;
      const ofMonth = canvasElement.querySelector<HTMLElement>('.nds-calendar-day-btn:not([data-outside-month])')!;
      await expect(getComputedStyle(neighbour).color).not.toBe(getComputedStyle(ofMonth).color);
    });

    await step('O clique nos botões de mês chega neles', async () => {
      // `userEvent.click` acerta o elemento mesmo com outra coisa pintada
      // por cima: ele verifica `pointer-events`, não oclusão. Foi assim que a nav
      // ficou morta na tela com a suíte verde — a legenda, posicionada, pintava
      // por cima e engolia o clique. `elementFromPoint` devolve QUEM está no
      // topo naquele ponto, e é a única coisa aqui que enxerga isso.
      const doc = canvasElement.ownerDocument;
      for (const nome of ['Ir para o mês anterior', 'Ir para o próximo mês']) {
        const btn = canvas.getByRole('button', { name: nome });
        const r = btn.getBoundingClientRect();
        const noTopo = doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        await expect(btn.contains(noTopo)).toBe(true);
      }
    });

    await step('Célula selecionada com aria-pressed="true"', async () => {
      const selected = canvasElement.querySelector('.nds-calendar-day-btn[aria-pressed="true"]');
      await expect(selected).not.toBeNull();
      await expect(selected).toHaveTextContent('12');
    });

    await step('Dias da semana expostos como <th scope="col">', async () => {
      const weekdayHeaders = canvasElement.querySelectorAll('th[scope="col"]');
      await expect(weekdayHeaders.length).toBe(7);
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
      // documentadas e sem asserção nenhuma em stack nenhuma, e três das cinco
      // não as cumpriam.
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
  },
};
