/**
 * Transforms do painel Code do Calendar.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que o painel imprimia era o wrapper de estado do arquivo de story — peça
 * que existe só ali. E o wrapper existe por um motivo real: `selected` muda de
 * TIPO com o modo (uma data, uma lista, um intervalo), então o snippet honesto
 * também precisa mudar o estado junto com o modo, e é o que o `meta` faz lendo
 * `ctx.args.mode`.
 *
 * `defaultMonth` fica de fora de propósito: as stories fixam abril de 2026 para
 * a foto do Chromatic não mudar todo dia, o que é necessidade da suíte e não do
 * design system.
 */
import {
  jsxSnippet,
  propBool,
  propOption,
  type SourceTransform,
} from '@/lib/story-source';

export type CalendarArgs = {
  mode: 'single' | 'multiple' | 'range';
  captionLayout: 'label' | 'dropdown';
  showOutsideDays: boolean;
  showWeekNumber: boolean;
  numberOfMonths: number;
};

const MODOS = ['single', 'multiple', 'range'] as const;
const LEGENDAS = ['label', 'dropdown'] as const;

type Mode = (typeof MODOS)[number];

/**
 * O estado que cada modo pede. Uma data, uma lista e um intervalo não são
 * conversíveis entre si: trocar o modo sem trocar o estado deixaria o valor de
 * um formato sendo lido por outro, que é o defeito real que o snippet precisa
 * não ensinar.
 *
 * O handler não é o setter cru porque `onSelect` devolve seleção VAZIA quando se
 * clica no dia já escolhido — desmarcar é parte do contrato do componente, e
 * cada tela decide se aceita ficar sem nada. Estes exemplos mantêm a escolha
 * anterior, que é o comportamento que um campo de data espera.
 */
const STATE: Record<
  Mode,
  { declaration: string; valor: string; handler: string; precisaDeTipo?: boolean }
> = {
  single: {
    declaration: 'const [data, setData] = useState(new Date());',
    valor: 'data',
    handler: 'onSelect={(escolhida) => escolhida && setData(escolhida)}',
  },
  multiple: {
    declaration: 'const [datas, setDatas] = useState([new Date()]);',
    valor: 'datas',
    handler: 'onSelect={(escolhidas) => setDatas(escolhidas ?? [])}',
  },
  range: {
    declaration: 'const [intervalo, setIntervalo] = useState<DateRange>({ from: new Date() });',
    valor: 'intervalo',
    handler: 'onSelect={(escolhido) => escolhido && setIntervalo(escolhido)}',
    precisaDeTipo: true,
  },
};

const IMPORT_CALENDAR = 'import { Calendar } from "@/components/ui/calendar";';
const IMPORT_LOCALE = 'import { ptBR } from "react-day-picker/locale";';

/** `<Calendar />` com uma prop por linha — fila longa some na rolagem do painel. */
function calendarWithProps(props: Array<string | false | null | undefined>): string {
  const lista = props.filter((prop): prop is string => Boolean(prop));
  if (lista.length <= 2) return `<Calendar ${lista.join(' ')} />`;
  return `<Calendar\n${lista.map((prop) => `  ${prop}`).join('\n')}\n/>`;
}

/**
 * Calendário controlado: o estado do modo pedido, o `locale` e o que a story
 * acrescenta. É a forma que quem copia vai escrever — sem ela o painel mostrava
 * o andaime do arquivo de story, que não existe fora dele.
 */
function calendarControlled(
  modo: Mode,
  extras: Array<string | false | null | undefined> = [],
): string {
  const estado = STATE[modo];
  // O componente do design system vem primeiro, e as dependências depois: é a
  // ordem do Badge, que é o modelo destas transforms.
  const imports = [
    IMPORT_CALENDAR,
    'import { useState } from "react";',
    estado.precisaDeTipo ? 'import type { DateRange } from "react-day-picker";' : undefined,
    IMPORT_LOCALE,
  ]
    .filter((linha): linha is string => Boolean(linha))
    .join('\n');
  // O estado entra no mesmo bloco do cabeçalho, separado por uma linha em
  // branco: é declaração de componente, e não marcação.
  const header = `${imports}\n\n${estado.declaration}`;

  return jsxSnippet(
    header,
    calendarWithProps([
      `mode="${modo}"`,
      ...extras,
      `selected={${estado.valor}}`,
      estado.handler,
      'locale={ptBR}',
    ]),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls do
 * Playground: o modo escolhe o formato do estado, e as demais props só entram
 * quando diferem do padrão do componente (`showOutsideDays` já vem ligado,
 * a legenda já vem em texto, e um mês é o padrão).
 *
 * Nos arquivos sem control algum o resultado é o calendário de uma data só, que
 * é o uso canônico.
 */
export const calendarSource: SourceTransform<CalendarArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const modo: Mode = (MODOS as readonly string[]).includes(args.mode as string)
    ? (args.mode as Mode)
    : 'single';
  const meses =
    typeof args.numberOfMonths === 'number' &&
    Number.isFinite(args.numberOfMonths) &&
    args.numberOfMonths !== 1
      ? `numberOfMonths={${args.numberOfMonths}}`
      : undefined;

  return calendarControlled(modo, [
    propOption('captionLayout', args.captionLayout, LEGENDAS, 'label'),
    meses,
    propBool('showOutsideDays', args.showOutsideDays, true),
    propBool('showWeekNumber', args.showWeekNumber),
  ]);
};

/* ----------------------------------------------------------------------- modos
 * `Single` NÃO tem override: o padrão do `meta` já é o calendário de uma data
 * só, e um snippet próprio seria a mesma string escrita duas vezes.
 */

/**
 * Várias datas avulsas: o estado vira lista, e é essa troca de formato que o
 * snippet de data única esconderia. Escolher soma à lista; escolher de novo tira.
 */
export function calendarMultiplasSource(): string {
  return calendarControlled('multiple');
}

/**
 * Intervalo: o estado guarda início e fim, não uma lista de dias — o miolo é
 * derivado. Dois meses lado a lado porque um intervalo costuma atravessar a
 * virada, e escolher o fim sem ver o mês seguinte obriga a paginar no meio da
 * escolha.
 */
export function calendarIntervaloSource(): string {
  return calendarControlled('range', ['numberOfMonths={2}']);
}

/* --------------------------------------------------------------------- estados
 * `Selected` NÃO tem override: o snippet do `meta` já é o calendário controlado,
 * e a marcação da data escolhida vem do estado que ele mostra.
 */

/**
 * Bloqueio por regra, e não por lista de datas: `disabled` aceita um descritor
 * de intervalo, e é ele que sustenta "nada antes de hoje" sem enumerar dia a dia.
 * A prop não cabe em nenhum control, então o `meta` nunca a mostraria.
 */
export function calendarBloqueadoSource(): string {
  return calendarControlled('single', ['disabled={{ before: new Date() }}']);
}

/**
 * Nenhuma seleção é o assunto: sem `selected`, o calendário abre no mês corrente
 * e apenas DESTACA o dia de hoje. O snippet controlado do `meta` mostraria o
 * oposto — e destacar hoje não é tê-lo escolhido.
 */
export function calendarHojeSource(): string {
  return jsxSnippet(
    `${IMPORT_CALENDAR}\n${IMPORT_LOCALE}`,
    calendarWithProps(['mode="single"', 'locale={ptBR}']),
  );
}

/**
 * `showOutsideDays` escrito por extenso mesmo sendo o padrão: a story existe
 * para nomear a prop, e um snippet que a omitisse deixaria o leitor sem saber
 * como desligar as bordas do mês (`showOutsideDays={false}`).
 */
export function outsideCalendarDaysSource(): string {
  return calendarControlled('single', ['showOutsideDays']);
}

/** Intervalo num mês só — o miolo entre os extremos é o que a story mostra. */
export function calendarIntervaloWithMioloSource(): string {
  return calendarControlled('range');
}

/* --------------------------------------------------------------------- layouts
 */

/**
 * `captionLayout="label"` escrito por extenso mesmo sendo o padrão, pelo mesmo
 * motivo de `showOutsideDays`: a story existe para nomear o formato da legenda,
 * e o par com a story de seletores é o que dá sentido aos dois.
 */
export function calendarCaptionTextSource(): string {
  return calendarControlled('single', ['captionLayout="label"']);
}

/**
 * Legenda em seletores: mês e ano viram controles operáveis, para saltar de
 * período sem passar mês a mês. O `<select>` é o próprio controle — não há
 * rótulo desenhado por cima dele.
 */
export function calendarCaptionSelectorsSource(): string {
  return calendarControlled('single', ['captionLayout="dropdown"']);
}

/**
 * Dois meses lado a lado: a prop é a lição, e o modo de intervalo é o que a
 * justifica — é escolhendo datas que atravessam a virada do mês que os dois
 * painéis deixam de ser enfeite.
 */
export function calendarDoisMonthsSource(): string {
  return calendarControlled('range', ['numberOfMonths={2}']);
}

/**
 * Coluna com o número da semana ISO à esquerda do grid, para quem organiza o
 * trabalho por semana. Vem desligada por padrão, então a prop precisa aparecer.
 */
export function calendarNumberWeekSource(): string {
  return calendarControlled('single', ['showWeekNumber']);
}

/* ----------------------------------------------------------------- composições
 */

/**
 * A composição canônica: o calendário quase nunca fica solto na página — ele
 * mora num popover, atrás de um botão que mostra a data escolhida.
 *
 * São três peças e dois estados, e é a story inteira que o painel imprimia como
 * um único componente inexistente. O que o snippet ensina, e a `play` cobra: o
 * rótulo do gatilho acompanha a escolha (sem isso a pessoa fecha o popover sem
 * saber o que escolheu) e escolher fecha o painel, porque depois disso não
 * sobra nada para oferecer ali.
 */
export function calendarWithPopoverSource(): string {
  return jsxSnippet(
    `import { Button } from "@/components/ui/button";
${IMPORT_CALENDAR}
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
${IMPORT_LOCALE}

const formatador = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const [data, setData] = useState(new Date());
const [aberto, setAberto] = useState(false);`,
    `<Popover open={aberto} onOpenChange={setAberto}>
  <PopoverTrigger
    render={<Button variant="outline">{formatador.format(data)}</Button>}
  />
  <PopoverContent>
    <Calendar
      mode="single"
      selected={data}
      onSelect={(escolhida) => {
        if (!escolhida) return;
        setData(escolhida);
        setAberto(false);
      }}
      locale={ptBR}
    />
  </PopoverContent>
</Popover>`,
  );
}
