/**
 * Transforms do painel Code do Chart.
 *
 * Módulo de TS puro — nada do `.tsx` entra aqui, nem por `import type`: o
 * primitivo carrega a lib de desenho no topo do arquivo, e o projeto `unit` do
 * vitest roda em node. É essa separação que permite exercitar as transforms,
 * porque a saída do painel não chega ao DOM durante a `play`.
 *
 * A transform do Playground vivia INLINE no `meta` de `chart.stories.tsx`, com
 * dois defeitos que só uma guarda executável acusa: exigia `ctx` (chamada sem
 * args lançava) e escrevia `aria-label=""` sempre que o control estivesse
 * vazio. Rótulo vazio é pior que rótulo ausente — o container deriva o dele do
 * título do desenho, e um atributo vazio bloqueia essa rede de segurança.
 */
import {
  attrsMultilinha,
  jsxSnippet,
  propNumber,
  propOption,
  propText,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

export type ChartArgs = {
  renderer: 'svg' | 'canvas';
  height: number;
  emptyLabel: string;
  className: string;
  'aria-label': string;
};

const RENDERIZADORES = ['svg', 'canvas'] as const;

/**
 * Espelho de `CHART_EMPTY_LABEL` do primitivo. Copiado de propósito: importar o
 * valor traria a lib de desenho para dentro do projeto `unit`. Serve só para
 * OMITIR o atributo quando o control está no padrão — repetir o padrão no
 * snippet ensina ruído a quem copia.
 */
const FRASE_VAZIA_DEFAULT = 'Sem dados para exibir';

/** Rótulo do Playground, e o padrão de qualquer chamada sem args. */
const LABEL_DEFAULT = 'Acessos mensais no desktop, de janeiro a junho';

const DATA_MENSAIS = `const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];`;
const SERIE_UNICA = `const series = [{ name: "Desktop", data: [186, 305, 237, 73, 209, 214] }];`;
const SERIES_MULTI = `const series = [
  { name: "Desktop", data: [186, 305, 237, 73, 209, 214] },
  { name: "Mobile", data: [80, 200, 120, 190, 130, 140] },
  { name: "Tablet", data: [40, 60, 55, 48, 70, 66] },
];`;

/** Importa o container e só os construtores que o exemplo realmente chama. */
function importChart(...construtores: string[]): string {
  return `import { ChartContainer, ${construtores.join(', ')} } from "@/components/ui/chart";`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo.
 *
 * A chamada é remontada a partir dos controls, então o snippet acompanha o que
 * a pessoa mexeu em vez de congelar num texto fixo. Só o que difere do padrão
 * do componente entra; o rótulo é a exceção e aparece sempre, porque ele é o
 * contrato de acessibilidade do desenho: sem ele o gráfico não é anunciado.
 */
export const chartSource: SourceTransform<ChartArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const frase = texto(args.emptyLabel);

  const atributos = attrsMultilinha(
    [
      'option={buildBarOption({ xAxis: meses, series })}',
      propNumber('height', args.height) ?? 'height={300}',
      propOption('renderer', args.renderer, RENDERIZADORES, 'svg'),
      frase && frase !== FRASE_VAZIA_DEFAULT ? `emptyLabel="${frase}"` : undefined,
      propText('className', args.className),
      `aria-label="${texto(args['aria-label']) ?? LABEL_DEFAULT}"`,
    ],
    '  ',
    0,
  );

  return jsxSnippet(
    `${importChart('buildBarOption')}

${DATA_MENSAIS}
${SERIE_UNICA}`,
    `<ChartContainer${atributos}/>`,
  );
};

/**
 * Linhas: tendência contínua no tempo. A partir da segunda série a legenda
 * aparece sozinha — não há bandeira para ligá-la.
 */
export function chartLineSource(): string {
  return jsxSnippet(
    `${importChart('buildLineOption')}

${DATA_MENSAIS}
const series = [
  { name: "Desktop", data: [186, 305, 237, 73, 209, 214] },
  { name: "Mobile", data: [80, 200, 120, 190, 130, 140] },
];`,
    `<ChartContainer
  option={buildLineOption({ xAxis: meses, series })}
  className="nds-max-w-lg"
  height={260}
  aria-label="Gráfico de linhas: acessos mensais por dispositivo"
/>`,
  );
}

/** Área: a mesma tendência da linha, com ênfase no volume acumulado. */
export function chartAreaSource(): string {
  return jsxSnippet(
    `${importChart('buildAreaOption')}

${DATA_MENSAIS}
const series = [
  { name: "Desktop", data: [186, 305, 237, 73, 209, 214] },
  { name: "Mobile", data: [80, 200, 120, 190, 130, 140] },
];`,
    `<ChartContainer
  option={buildAreaOption({ xAxis: meses, series })}
  className="nds-max-w-lg"
  height={260}
  aria-label="Gráfico de área: volume mensal de acessos por dispositivo"
/>`,
  );
}

/**
 * Pizza: proporção de partes no todo. O construtor recebe outra FORMA de dado —
 * pares de rótulo e valor, sem eixo —, e é por isso que a story não cabe no
 * snippet do `meta`.
 */
export function chartPizzaSource(): string {
  return jsxSnippet(
    `${importChart('buildPieOption')}

const dados = [
  { label: "Desktop", value: 1224 },
  { label: "Mobile", value: 860 },
  { label: "Tablet", value: 320 },
];`,
    `<ChartContainer
  option={buildPieOption({ data: dados })}
  className="nds-max-w-sm"
  height={280}
  aria-label="Distribuição de acessos por dispositivo"
/>`,
  );
}

/**
 * Multi-série: a legenda nasce sozinha da segunda série em diante, e cada série
 * ganha trama própria. Tirando a cor, a hachura ainda separa as séries — é o
 * que cumpre a WCAG 1.4.1 quando a cor sai de cena.
 */
export function chartMultiSerieSource(): string {
  return jsxSnippet(
    `${importChart('buildBarOption')}

${DATA_MENSAIS}
${SERIES_MULTI}`,
    `<ChartContainer
  option={buildBarOption({ xAxis: meses, series })}
  className="nds-max-w-lg"
  height={280}
  aria-label="Acessos mensais por dispositivo: desktop, mobile e tablet"
/>`,
  );
}

/**
 * Título dentro do desenho E rótulo autoral: dois textos com papéis diferentes.
 * O título é visual, escrito acima dos eixos; o rótulo é o que o leitor de tela
 * lê no lugar do desenho, e vence o título quando os dois existem.
 */
export function chartWithTitleSource(): string {
  return jsxSnippet(
    `${importChart('buildBarOption')}

${DATA_MENSAIS}
${SERIES_MULTI}`,
    `<ChartContainer
  option={buildBarOption({
    xAxis: meses,
    series,
    title: "Acessos por dispositivo",
  })}
  className="nds-max-w-lg"
  height={300}
  aria-label="Acessos por dispositivo, de janeiro a junho"
/>`,
  );
}

/**
 * Título sem rótulo autoral — a AUSÊNCIA é o assunto: um gráfico sem
 * `aria-label` não fica mudo, o container cai no título que já está na tela.
 * Escrever o rótulo aqui esconderia justamente a rede de segurança.
 */
export function chartTitleNoLabelSource(): string {
  return jsxSnippet(
    `${importChart('buildBarOption')}

${DATA_MENSAIS}
const series = [
  { name: "Desktop", data: [186, 305, 237, 73, 209, 214] },
  { name: "Mobile", data: [80, 200, 120, 190, 130, 140] },
];`,
    `<ChartContainer
  option={buildBarOption({ xAxis: meses, series, title: "Vendas mensais" })}
  className="nds-max-w-lg"
  height={280}
/>`,
  );
}

/**
 * Série única: a legenda NÃO aparece, porque não há o que comparar. O snippet
 * mostra a ausência dela como resultado do dado, não de uma prop desligada.
 */
export function chartSerieUnicaSource(): string {
  return jsxSnippet(
    `${importChart('buildLineOption')}

${DATA_MENSAIS}
${SERIE_UNICA}`,
    `<ChartContainer
  option={buildLineOption({ xAxis: meses, series })}
  className="nds-max-w-lg"
  height={260}
  aria-label="Acessos mensais no desktop"
/>`,
  );
}

/**
 * Estado vazio: sem série com dado o container troca o desenho por uma frase, e
 * então NÃO se anuncia como imagem — a frase é o conteúdo a ser lido, e um
 * `role="img"` com rótulo genérico a esconderia. Sem `height` de propósito: o
 * que segura o bloco aqui é o piso de altura, e é ele que impede a página de
 * saltar quando o dado chega.
 */
export function chartEmptySource(): string {
  return jsxSnippet(
    `${importChart('buildBarOption')}

${DATA_MENSAIS}`,
    `<ChartContainer
  option={buildBarOption({ xAxis: meses, series: [] })}
  className="nds-max-w-lg"
  emptyLabel="Nenhum dado disponível para o período selecionado."
/>`,
  );
}

/**
 * Gráfico dentro de um Card: o cabeçalho carrega título e período, o desenho
 * carrega o dado. A altura entra no container do gráfico, nunca no Card.
 */
export function chartEmCardSource(): string {
  return jsxSnippet(
    `${importChart('buildBarOption')}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

${DATA_MENSAIS}
const series = [
  { name: "Desktop", data: [186, 305, 237, 73, 209, 214] },
  { name: "Mobile", data: [80, 200, 120, 190, 130, 140] },
];`,
    `<Card className="nds-max-w-lg">
  <CardHeader>
    <CardTitle as="h3">Acessos por mês</CardTitle>
    <CardDescription>Janeiro a junho</CardDescription>
  </CardHeader>
  <CardContent>
    <ChartContainer
      option={buildBarOption({ xAxis: meses, series })}
      height={220}
      aria-label="Gráfico de barras: acessos mensais por dispositivo"
    />
  </CardContent>
</Card>`,
  );
}

/**
 * Dois desenhos com o mesmo dado: cor e tipografia saem dos tokens do tema em
 * vigor, e cada container é independente — nenhum estado é compartilhado entre
 * eles. Cada um carrega o seu próprio rótulo, senão os dois se anunciariam com
 * o mesmo nome.
 */
export function chartDoisDesenhosSource(): string {
  return jsxSnippet(
    `${importChart('buildBarOption', 'buildLineOption')}

${DATA_MENSAIS}
${SERIES_MULTI}`,
    `<div className="nds-stack">
  <ChartContainer
    option={buildBarOption({ xAxis: meses, series })}
    className="nds-max-w-lg"
    height={260}
    aria-label="Acessos mensais por dispositivo, em barras"
  />
  <ChartContainer
    option={buildLineOption({ xAxis: meses, series })}
    className="nds-max-w-lg"
    height={260}
    aria-label="Acessos mensais por dispositivo, em linhas"
  />
</div>`,
  );
}
