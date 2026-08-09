// ─── Calendar — Vanilla factory standalone ──────────────────────────────────
// Visual: classes .nds-calendar-* (standalone).
// Locale-aware (Intl.DateTimeFormat) para nomes de dia/mês.

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { rotulosDoCalendario } from '@shared/primitives/calendar-labels';

export type CalendarRange = { from?: Date; to?: Date };

export type CalendarOptions = {
  /** Uma data (padrão), várias datas avulsas, ou um intervalo contínuo. */
  mode?: 'single' | 'multiple' | 'range';
  /** Data no modo único; lista no múltiplo; par de datas no intervalo. */
  value?: Date | Date[] | CalendarRange;
  onSelect?: (value: Date | Date[] | CalendarRange) => void;
  /** Quantos meses exibir lado a lado. Padrão: 1. */
  numberOfMonths?: number;
  disabled?: (date: Date) => boolean;
  /**
   * Completa a primeira e a última semana com os dias dos meses vizinhos, em
   * vez de deixar buracos. Padrão: `true`.
   */
  showOutsideDays?: boolean;
  /** Legenda em texto (padrão) ou com seletores de mês e ano. */
  captionLayout?: 'label' | 'dropdown';
  /** BCP 47 locale tag (ex: "pt-BR", "en-US", "es-ES"). Default: "en-US". */
  locale?: string;
  class?: string;
};

// ─── Locale helpers ───────────────────────────────────────────────────────────

/** Derives short weekday initials (2 letters) starting from Sunday. */
function getDayNames(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  // Sem o ponto: em pt-BR o formato curto sai 'dom.', e o ponto numa coluna de
  // uma palavra só vira ruído. As quatro stacks mostram a mesma abreviação.
  const semPonto = (s: string) => s.replace(/\.$/, '');
  // Sunday = 2020-01-05 (known Sunday as anchor)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2020, 0, 5 + i);
    return semPonto(fmt.format(d));
  });
}

/** Derives full month names. */
function getMonthNames(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: 'long' });
  return Array.from({ length: 12 }, (_, m) => {
    const d = new Date(2020, m, 1);
    return fmt.format(d);
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/** Compara só a data, ignorando hora — é o que interessa num calendário. */
function diaA(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Anos oferecidos para cada lado do ano em vista, no seletor da legenda. */
const ANOS_PARA_CADA_LADO = 100;

// ─── createCalendar ───────────────────────────────────────────────────────────

export function createCalendar(options: CalendarOptions = {}): HTMLElement {
  const {
    mode = 'single',
    onSelect,
    disabled,
    locale = 'en-US',
    showOutsideDays = true,
    captionLayout = 'label',
    numberOfMonths = 1,
  } = options;

  const dayNames = getDayNames(locale);
  const monthNames = getMonthNames(locale);
  const rotulos = rotulosDoCalendario(locale);
  const dayButtonLabelFmt = new Intl.DateTimeFormat(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const ehIntervalo = mode === 'range';
  const ehMultiplo = mode === 'multiple';
  const valorInicial = options.value;

  let selected: Date | null =
    mode === 'single' && valorInicial instanceof Date ? valorInicial : null;
  let selecionadas: Date[] = ehMultiplo && Array.isArray(valorInicial) ? [...valorInicial] : [];
  let intervalo: CalendarRange =
    ehIntervalo && valorInicial && !(valorInicial instanceof Date) && !Array.isArray(valorInicial)
      ? { ...valorInicial }
      : {};

  /** A data que ancora o mês exibido, seja qual for o modo. */
  const ancora = selected ?? selecionadas[0] ?? intervalo.from ?? null;

  /** No modo múltiplo, escolher de novo tira da lista — é o que o diferencia. */
  function alternarNaLista(date: Date): void {
    const i = selecionadas.findIndex((d) => isSameDay(d, date));
    if (i === -1) selecionadas = [...selecionadas, date].sort((a, b) => diaA(a) - diaA(b));
    else selecionadas = selecionadas.filter((_, j) => j !== i);
  }

  const estaSelecionada = (date: Date): boolean => {
    if (ehIntervalo) return estadoNoIntervalo(date) !== null;
    if (ehMultiplo) return selecionadas.some((d) => isSameDay(d, date));
    return selected ? isSameDay(date, selected) : false;
  };

  const today = new Date();
  let viewYear = ancora ? ancora.getFullYear() : today.getFullYear();
  let viewMonth = ancora ? ancora.getMonth() : today.getMonth();

  // Um `role="grid"` promete navegação por setas, e o grid inteiro entra na
  // tabulação como UM parada só: quem chega por Tab pousa no dia corrente e
  // anda pelo mês com o teclado. Sem isto, o Tab visitava os 30 e poucos dias
  // um a um e as setas não faziam nada.
  const hojeEstaNaVisao = today.getFullYear() === viewYear && today.getMonth() === viewMonth;
  /* v8 ignore next -- o lado falso do ternário é inalcançável: sem data inicial
     a visão abre no mês de hoje (linhas acima), então `hojeEstaNaVisao` é
     verdadeiro sempre que `ancora` é nula. Fica como rede se a origem da visão
     deixar de ser o relógio. */
  let focado: Date = ancora ?? (hojeEstaNaVisao ? today : new Date(viewYear, viewMonth, 1));
  let devolverFoco = false;

  const isoDe = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  /** Move o dia focado e traz a visão junto quando ele cai em outro mês. */
  function moverFoco(dias: number, meses = 0): void {
    const alvo = new Date(focado.getFullYear(), focado.getMonth() + meses, focado.getDate() + dias);
    focado = alvo;
    viewYear = alvo.getFullYear();
    viewMonth = alvo.getMonth();
    devolverFoco = true;
    render();
  }

  /**
   * Um clique no modo intervalo tem três desfechos: abre um intervalo novo,
   * fecha o que estava aberto ou recomeça. Datas fora de ordem são trocadas —
   * quem clica no fim antes do início quis o mesmo intervalo.
   */
  function escolherNoIntervalo(date: Date): void {
    if (!intervalo.from || intervalo.to) {
      intervalo = { from: date };
    } else if (diaA(date) < diaA(intervalo.from)) {
      intervalo = { from: date, to: intervalo.from };
    } else {
      intervalo = { from: intervalo.from, to: date };
    }
  }

  const estadoNoIntervalo = (date: Date): 'start' | 'middle' | 'end' | null => {
    const { from, to } = intervalo;
    if (!from) return null;
    if (!to) return isSameDay(date, from) ? 'start' : null;
    const d = diaA(date);
    if (d === diaA(from)) return 'start';
    if (d === diaA(to)) return 'end';
    return d > diaA(from) && d < diaA(to) ? 'middle' : null;
  };

  const root = document.createElement('div');
  root.dataset.slot = 'calendar';
  root.className = cn('nds-calendar', options.class);

  function buildChevron(direction: 'left' | 'right'): SVGSVGElement {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('xmlns', SVG_NS);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6');
    svg.appendChild(path);
    return svg;
  }

  /** Legenda com seletores: salta de período sem passar mês a mês. */
  function buildDropdownCaption(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'nds-calendar-caption-dropdown';

    const selMes = document.createElement('select');
    selMes.className = 'nds-calendar-select';
    selMes.setAttribute('aria-label', rotulos.selecionarMes);
    monthNames.forEach((nome, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = nome;
      if (i === viewMonth) opt.selected = true;
      selMes.appendChild(opt);
    });
    selMes.addEventListener('change', () => {
      viewMonth = Number(selMes.value);
      render();
    });

    const selAno = document.createElement('select');
    selAno.className = 'nds-calendar-select';
    selAno.setAttribute('aria-label', rotulos.selecionarAno);
    // A lista é completa, e não uma janela em torno do ano em vista: o painel
    // de um <select> é desenhado pelo navegador e não entrega evento de rolagem
    // ao JS, então não há onde pendurar um "carregar mais ao chegar na ponta" —
    // e a janela obrigava a escolher o último ano e reabrir para andar mais.
    // Quem limita o que aparece é a altura do painel (onze itens, no CSS).
    for (let ano = viewYear - ANOS_PARA_CADA_LADO; ano <= viewYear + ANOS_PARA_CADA_LADO; ano++) {
      const opt = document.createElement('option');
      opt.value = String(ano);
      opt.textContent = String(ano);
      if (ano === viewYear) opt.selected = true;
      selAno.appendChild(opt);
    }
    selAno.addEventListener('change', () => {
      viewYear = Number(selAno.value);
      render();
    });

    wrap.append(selMes, selAno);
    return wrap;
  }

  /**
   * Monta a tabela de UM mês. Com `numberOfMonths` maior que 1, o render a
   * chama uma vez por mês da janela — a navegação continua sendo uma só, e é
   * ela que move a janela inteira.
   */
  function buildGrid(anoDaGrade: number, mesDaGrade: number): HTMLTableElement {
    const table = document.createElement('table');
    table.className = 'nds-calendar-grid';
    table.setAttribute('role', 'grid');
    table.setAttribute('aria-label', `${monthNames[mesDaGrade]} ${anoDaGrade}`);

    // Header row
    //
    // `aria-hidden`: a linha dos dias da semana aparece na tela mas fica fora da
    // árvore de acessibilidade, porque cada dia já anuncia a data por extenso —
    // repetir a coluna a cada célula só encompridaria a leitura. O React e o Vue
    // já faziam isso; aqui e no Svelte o cabeçalho era lido, e a mesma tabela
    // soava diferente dependendo da stack.
    const thead = document.createElement('thead');
    thead.setAttribute('aria-hidden', 'true');
    const headerRow = document.createElement('tr');
    dayNames.forEach((day) => {
      const th = document.createElement('th');
      th.setAttribute('scope', 'col');
      th.textContent = day;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body — a grade começa no domingo anterior ao dia 1º e é preenchida com
    // datas reais de ponta a ponta. Os dias dos meses vizinhos ficam marcados
    // como externos; quando `showOutsideDays` é falso, a casa fica vazia.
    const tbody = document.createElement('tbody');
    const primeiroDaGrade = new Date(anoDaGrade, mesDaGrade, 1);
    primeiroDaGrade.setDate(1 - primeiroDaGrade.getDay());
    const diasNoMes = new Date(anoDaGrade, mesDaGrade + 1, 0).getDate();
    const semanas = Math.ceil((new Date(anoDaGrade, mesDaGrade, 1).getDay() + diasNoMes) / 7);

    for (let week = 0; week < semanas; week++) {
      const row = document.createElement('tr');

      for (let col = 0; col < 7; col++) {
        const td = document.createElement('td');
        // Explícito, não implícito: o mapeamento de <td> para gridcell depende
        // do ancestral ter papel de grid, e nem toda árvore de acessibilidade
        // faz essa conta. Sem o papel, a célula é lida como célula de tabela
        // comum e o modo de navegação por grade não é oferecido.
        td.setAttribute('role', 'gridcell');

        const date = new Date(
          primeiroDaGrade.getFullYear(),
          primeiroDaGrade.getMonth(),
          primeiroDaGrade.getDate() + week * 7 + col,
        );
        const foraDoMes = date.getMonth() !== mesDaGrade;

        if (foraDoMes && !showOutsideDays) {
          row.appendChild(td);
          continue;
        }

        const isDisabled = disabled ? disabled(date) : false;
        const posicaoNoIntervalo = ehIntervalo ? estadoNoIntervalo(date) : null;
        const isSelected = estaSelecionada(date);
        const isTodayDate = isToday(date);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nds-calendar-day';
        btn.textContent = String(date.getDate());
        btn.dataset.day = isoDe(date);
        btn.setAttribute('aria-label', dayButtonLabelFmt.format(date));
        btn.setAttribute('aria-pressed', String(isSelected));
        // Tabulação móvel: só o dia focado é alcançável por Tab; os outros
        // são alcançados pelas setas, dentro do grid.
        btn.tabIndex = isSameDay(date, focado) ? 0 : -1;
        if (isSelected) btn.dataset.selected = 'true';
        if (isTodayDate) btn.dataset.today = 'true';
        if (foraDoMes) btn.dataset.outside = 'true';
        if (posicaoNoIntervalo) btn.dataset.range = posicaoNoIntervalo;
        if (isDisabled) btn.disabled = true;

        btn.addEventListener('keydown', (e) => {
          const passos: Record<string, [number, number]> = {
            ArrowRight: [1, 0],
            ArrowLeft: [-1, 0],
            ArrowDown: [7, 0],
            ArrowUp: [-7, 0],
            PageDown: [0, 1],
            PageUp: [0, -1],
          };
          if (e.key === 'Home' || e.key === 'End') {
            e.preventDefault();
            const alvo = e.key === 'Home' ? -date.getDay() : 6 - date.getDay();
            moverFoco(alvo);
            return;
          }
          const passo = passos[e.key];
          if (!passo) return;
          e.preventDefault();
          moverFoco(passo[0], passo[1]);
        });

        if (!isDisabled) {
          btn.addEventListener('click', () => {
            if (ehIntervalo) escolherNoIntervalo(date);
            else if (ehMultiplo) alternarNaLista(date);
            else selected = date;

            focado = date;
            // Clicar num dia vizinho leva a visão para o mês dele: senão a
            // escolha sumiria da tela no instante em que foi feita. Com mais de
            // um mês na tela, o dia já está visível — mover a visão faria o
            // grid pular embaixo do cursor.
            // `viewYear`/`viewMonth`, e não os parâmetros da grade: estes dizem
            // QUAL mês esta tabela desenha, e mudá-los não move visão nenhuma —
            // some no próximo render. É a visão que precisa acompanhar.
            if (numberOfMonths === 1) {
              viewYear = date.getFullYear();
              viewMonth = date.getMonth();
            }

            onSelect?.(
              ehIntervalo ? { ...intervalo } : ehMultiplo ? [...selecionadas] : date,
            );
            render();
          });
        }

        // `aria-selected` na célula, e não no botão: quem tem papel de
        // `gridcell` é ela, e é do gridcell que o leitor de tela lê o estado de
        // seleção ao percorrer a grade.
        if (isSelected) td.setAttribute('aria-selected', 'true');

        td.appendChild(btn);
        row.appendChild(td);
      }
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    return table;
  }

  function render(): void {
    root.innerHTML = '';

    // Month navigation
    const nav = document.createElement('div');
    nav.className = 'nds-calendar-nav';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'nds-calendar-nav-button';
    prevBtn.setAttribute('aria-label', rotulos.mesAnterior);
    prevBtn.appendChild(buildChevron('left'));
    prevBtn.addEventListener('click', () => {
      viewMonth -= 1;
      if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
      render();
    });

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'nds-calendar-nav-button';
    nextBtn.setAttribute('aria-label', rotulos.proximoMes);
    nextBtn.appendChild(buildChevron('right'));
    nextBtn.addEventListener('click', () => {
      viewMonth += 1;
      if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
      render();
    });

    let legenda: HTMLElement;
    if (captionLayout === 'dropdown') {
      legenda = buildDropdownCaption();
    } else {
      legenda = document.createElement('div');
      legenda.className = 'nds-calendar-month-label';
      // Com mais de um mês, a legenda diz a janela, não um mês só.
      const ultimo = new Date(viewYear, viewMonth + numberOfMonths - 1, 1);
      legenda.textContent =
        numberOfMonths === 1
          ? `${monthNames[viewMonth]} ${viewYear}`
          : `${monthNames[viewMonth]} – ${monthNames[ultimo.getMonth()]} ${ultimo.getFullYear()}`;
    }

    nav.append(prevBtn, legenda, nextBtn);
    root.appendChild(nav);

    // Um mês: a tabela pendura direto na raiz, como sempre — nada muda no DOM
    // de quem não pede janela maior. Vários: cada mês ganha o próprio rótulo,
    // porque a legenda da nav já não dá conta de dizer qual é qual.
    if (numberOfMonths === 1) {
      root.appendChild(buildGrid(viewYear, viewMonth));
    } else {
      const meses = document.createElement('div');
      meses.className = 'nds-calendar-months';

      for (let i = 0; i < numberOfMonths; i++) {
        const d = new Date(viewYear, viewMonth + i, 1);
        const bloco = document.createElement('div');
        bloco.className = 'nds-calendar-month';

        const rotulo = document.createElement('div');
        rotulo.className = 'nds-calendar-month-label';
        rotulo.textContent = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

        bloco.append(rotulo, buildGrid(d.getFullYear(), d.getMonth()));
        meses.appendChild(bloco);
      }
      root.appendChild(meses);
    }


    // O render reconstrói o DOM inteiro, então o elemento que tinha o foco
    // deixou de existir: sem devolvê-lo, cada seta jogaria o foco no body e a
    // navegação pararia no primeiro passo.
    if (devolverFoco) {
      devolverFoco = false;
      root.querySelector<HTMLButtonElement>(`.nds-calendar-day[data-day="${isoDe(focado)}"]`)?.focus();
    }
  }

  render();
  return root;
}
