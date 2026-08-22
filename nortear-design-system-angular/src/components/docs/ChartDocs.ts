import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NdsChart } from '@/components/ui/chart';
import {
  DATA_DISPOSITIVO,
  MONTHS,
  SERIES_MULTI,
  SERIES_TRIO,
  SERIE_UNICA,
  TENDENCIA,
} from '@/components/ui/chart.fixtures';
import { NdsCard, NdsCardContent, NdsCardDescription, NdsCardHeader, NdsCardTitle } from '@/components/ui/card';
import uiTranslations from '@/i18n/ui.json';
import chartTranslations from '@shared/content/chart/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsVariants,
  NdsDocsStates,
  NdsDocsProps,
  NdsDocsTokens,
  NdsDocsAccessibility,
  NdsDocsRelated,
  NdsDocsNotes,
  NdsDocsAnalytics,
  NdsDocsTestes,
} from '@/components/docs/shared/sections';

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// ─── Overrides ────────────────────────────────────────────────────────────────
//
// O conteúdo compartilhado do Chart descreve um wrapper sobre o ECharts: objeto
// de configuração único, `buildBarOption`, `aria.enabled`, `aria.decal.show`,
// escolha de renderer svg/canvas. Nada disso existe aqui — esta stack não tem
// echarts nas dependências e o componente DESENHA o SVG (ver o cabeçalho de
// `src/components/ui/chart.ts`). Manter o texto compartilhado seria documentar
// uma API que não compila.
//
// O que fica sobrescrito, então, é só o que é factualmente falso nesta stack,
// mais os rótulos que o conteúdo não tem porque descrevem entradas que só
// existem aqui (`showData`, `compact`, os rótulos da tabela de dados). Nenhum
// snippet `*Code` entra em override — ele ficaria preso a esta stack.
const { t, dict } = useTranslation(chartTranslations as Record<string, unknown>, {
  '*': {
    // "ChartContainer" é o nome do wrapper das outras stacks; aqui a peça é uma
    // só e se chama Chart.
    'props.containerTitle': 'Chart',
  },
  'pt-BR': {
    'usage.guidelines.item2':
      'Uma entrada escolhe o tipo do gráfico; o que muda entre um e outro é o dado, não a montagem.',
    'variants.items.bar.name': 'Barras',
    'variants.items.line.name': 'Linhas',
    'variants.items.area.name': 'Área',
    'variants.items.pie.name': 'Pizza',
    'variants.note':
      'O Chart não tem variantes de estilo: o tipo é o DADO, não a aparência. Uma entrada escolhe entre barras, linhas, área e pizza, e a mesma tabela de dados acompanha o desenho em qualquer um deles.',
    'accessibility.summary':
      'O Chart atende WCAG 2.2 AA por quatro caminhos: descrição obrigatória do gráfico, uma tabela de dados equivalente que existe sempre, trama e símbolo por série (a informação nunca vive só na cor) e contorno em cima de cada forma, que é o que garante os 3:1 de objeto gráfico.',
    'accessibility.item2':
      '<strong>Alternativa textual equivalente</strong> — o componente emite sempre uma tabela de verdade com os mesmos números do desenho, com cabeçalho por série e uma linha por categoria. Por padrão ela existe só para leitor de tela; uma entrada a torna visível para todo mundo.',
    'accessibility.item3':
      '<strong>A informação não vive na cor</strong> — cada série recebe uma trama sobreposta ao preenchimento, e nas linhas também um traço e um símbolo de ponto próprios. Retirando toda a cor, o gráfico continua legível (WCAG 1.4.1).',
    'accessibility.item4':
      '<strong>Papel de imagem no desenho, não no container</strong> — a marcação de imagem fica no próprio desenho, e não no bloco que o envolve: no container ela podaria a tabela de dados junto, e a alternativa textual sumiria da árvore de acessibilidade.',
    'accessibility.item6':
      '<strong>Contraste</strong> — quem sustenta os 3:1 de objeto gráfico (WCAG 1.4.11) é o contorno de cada forma, não a cor de série: as cores de série do tema padrão ficam em torno de 2:1 contra o fundo. O texto dos eixos usa a cor de texto secundário, com 4.5:1.',
    'notes.tip1':
      '<strong>Sem lib de gráfico</strong>: o desenho é SVG montado pelo próprio componente. Não há dependência para instalar, nem bundle de biblioteca de visualização somado à página.',
    'notes.tip2':
      '<strong>API declarativa</strong>: em vez de um objeto de configuração único, as entradas são declarativas — tipo, dados, eixo de categorias, séries e título. O que muda entre um gráfico e outro é o dado, não a montagem.',
    'notes.tip3':
      '<strong>Tipografia que cresce</strong>: nenhum texto do desenho tem tamanho fixo. O SVG herda a tipografia do container, então aumentar a fonte do navegador aumenta o rótulo do eixo junto (WCAG 1.4.4).',
    'notes.tip4':
      '<strong>Altura pela proporção</strong>: o desenho não tem altura cravada. A altura nasce da proporção do desenho aplicada à largura do container, e o piso vem do próprio bloco — por isso a página não salta quando o dado chega.',
    'props.extensibility':
      'Para tipos de gráfico não cobertos (dispersão, radar, mapa de calor), o caminho é estender o componente, não passar um objeto de configuração: o desenho é montado aqui. Cores e tipografia continuam vindo do tema em qualquer caso.',
    'props.table.showData': 'Torna visível para todo mundo a tabela de dados que já existe para leitor de tela.',
    'props.table.compact':
      'Mini gráfico inline: sem eixos, grade, legenda ou rótulo de valor, e com proporção achatada. Serve de indicador de tendência ao lado de um número.',
    'props.table.categoryLabel': 'Cabeçalho da primeira coluna da tabela de dados.',
    'props.table.valueLabel': 'Nome da série quando os dados vêm na forma simples de rótulo e valor.',
    'props.table.shareLabel': 'Cabeçalho da coluna de participação, na tabela de dados da pizza.',
    'props.table.className':
      'Classes extras vão no atributo class do próprio elemento — o Angular as mescla com as do design system.',
    'props.table.pointLabel': 'Rótulo da categoria — vira a marca do eixo e a primeira coluna da tabela.',
    'props.table.pointValue': 'Valor numérico da categoria.',
    'props.table.seriesName': 'Nome da série — aparece na legenda e no cabeçalho da coluna da tabela.',
    'props.table.seriesData': 'Valores da série, alinhados ao eixo de categorias.',
    'props.table.seriesColor': 'Cor explícita da série; sobrescreve o token da posição.',
    'tokens.table.background':
      'Traço da trama sobreposta a cada série — é ele que separa a hachura do preenchimento.',
    'demonstration.labels.pie': 'Pizza',
    'demonstration.labels.dataTable': 'Tabela de dados equivalente, visível',
  },
  en: {
    'usage.guidelines.item2':
      'One input picks the chart type; what changes between one chart and another is the data, not the assembly.',
    'variants.items.bar.name': 'Bars',
    'variants.items.line.name': 'Lines',
    'variants.items.area.name': 'Area',
    'variants.items.pie.name': 'Pie',
    'variants.note':
      'The Chart has no style variants: the type is the DATA, not the look. One input chooses between bars, lines, area and pie, and the same data table follows the drawing in all of them.',
    'accessibility.summary':
      'The Chart meets WCAG 2.2 AA through four paths: a mandatory chart description, an equivalent data table that always exists, a pattern and a symbol per series (information never lives in colour alone) and an outline on every shape, which is what secures the 3:1 for graphical objects.',
    'accessibility.item2':
      '<strong>Equivalent text alternative</strong> — the component always emits a real table with the same numbers as the drawing, one header per series and one row per category. By default it exists only for screen readers; one input makes it visible to everyone.',
    'accessibility.item3':
      '<strong>Information does not live in colour</strong> — every series gets a pattern over its fill, and lines also get their own dash and point symbol. Strip all colour and the chart is still readable (WCAG 1.4.1).',
    'accessibility.item4':
      '<strong>Image role on the drawing, not on the container</strong> — the image marking sits on the drawing itself, not on the block around it: on the container it would prune the data table along with it, and the text alternative would vanish from the accessibility tree.',
    'accessibility.item6':
      '<strong>Contrast</strong> — what secures the 3:1 for graphical objects (WCAG 1.4.11) is the outline of each shape, not the series colour: the default theme series colours sit around 2:1 against the background. Axis text uses the secondary text colour, at 4.5:1.',
    'notes.tip1':
      '<strong>No charting library</strong>: the drawing is SVG built by the component itself. There is no dependency to install and no visualization bundle added to the page.',
    'notes.tip2':
      '<strong>Declarative API</strong>: instead of a single configuration object, the inputs are declarative — type, data, category axis, series and title. What changes between one chart and another is the data, not the wiring.',
    'notes.tip3':
      '<strong>Type that grows</strong>: no text in the drawing has a fixed size. The SVG inherits the container typography, so raising the browser font size raises the axis label with it (WCAG 1.4.4).',
    'notes.tip4':
      '<strong>Height from the aspect ratio</strong>: the drawing has no hard-coded height. Height comes from the drawing ratio applied to the container width, and the floor comes from the block itself — which is why the page does not jump when the data arrives.',
    'props.extensibility':
      'For chart types not covered (scatter, radar, heatmap), the path is extending the component, not passing a configuration object: the drawing is built here. Colours and typography still come from the theme either way.',
    'props.table.showData': 'Makes the data table that already exists for screen readers visible to everyone.',
    'props.table.compact':
      'Inline mini chart: no axes, grid, legend or value labels, and a flattened ratio. Works as a trend indicator next to a number.',
    'props.table.categoryLabel': 'Header of the first column of the data table.',
    'props.table.valueLabel': 'Series name when the data comes in the simple label/value shape.',
    'props.table.shareLabel': 'Header of the share column in the pie data table.',
    'props.table.className':
      'Extra classes go on the class attribute of the element itself — Angular merges them with the design system ones.',
    'props.table.pointLabel': 'Category label — becomes the axis tick and the first column of the table.',
    'props.table.pointValue': 'Numeric value of the category.',
    'props.table.seriesName': 'Series name — shows in the legend and in the table column header.',
    'props.table.seriesData': 'Series values, aligned to the category axis.',
    'props.table.seriesColor': 'Explicit series colour; overrides the token for that position.',
    'tokens.table.background':
      'Stroke of the pattern laid over each series — it is what separates the hatching from the fill.',
    'demonstration.labels.pie': 'Pie',
    'demonstration.labels.dataTable': 'Equivalent data table, visible',
  },
  es: {
    'usage.guidelines.item2':
      'Una entrada elige el tipo de gráfico; lo que cambia entre uno y otro es el dato, no el armado.',
    'variants.items.bar.name': 'Barras',
    'variants.items.line.name': 'Líneas',
    'variants.items.area.name': 'Área',
    'variants.items.pie.name': 'Circular',
    'variants.note':
      'El Chart no tiene variantes de estilo: el tipo es el DATO, no la apariencia. Una entrada elige entre barras, líneas, área y circular, y la misma tabla de datos acompaña al dibujo en todos ellos.',
    'accessibility.summary':
      'El Chart cumple WCAG 2.2 AA por cuatro caminos: descripción obligatoria del gráfico, una tabla de datos equivalente que existe siempre, trama y símbolo por serie (la información nunca vive solo en el color) y contorno sobre cada forma, que es lo que garantiza los 3:1 de objeto gráfico.',
    'accessibility.item2':
      '<strong>Alternativa textual equivalente</strong> — el componente emite siempre una tabla real con los mismos números del dibujo, con un encabezado por serie y una fila por categoría. Por defecto existe solo para lectores de pantalla; una entrada la hace visible para todos.',
    'accessibility.item3':
      '<strong>La información no vive en el color</strong> — cada serie recibe una trama sobre el relleno, y en las líneas también un trazo y un símbolo de punto propios. Quitando todo el color, el gráfico sigue siendo legible (WCAG 1.4.1).',
    'accessibility.item4':
      '<strong>Rol de imagen en el dibujo, no en el contenedor</strong> — la marca de imagen va en el propio dibujo, no en el bloque que lo envuelve: en el contenedor podaría también la tabla de datos, y la alternativa textual desaparecería del árbol de accesibilidad.',
    'accessibility.item6':
      '<strong>Contraste</strong> — quien sostiene los 3:1 de objeto gráfico (WCAG 1.4.11) es el contorno de cada forma, no el color de serie: los colores de serie del tema por defecto rondan los 2:1 contra el fondo. El texto de los ejes usa el color de texto secundario, con 4.5:1.',
    'notes.tip1':
      '<strong>Sin librería de gráficos</strong>: el dibujo es SVG montado por el propio componente. No hay dependencia que instalar ni bundle de visualización sumado a la página.',
    'notes.tip2':
      '<strong>API declarativa</strong>: en lugar de un objeto de configuración único, las entradas son declarativas — tipo, datos, eje de categorías, series y título. Lo que cambia entre un gráfico y otro es el dato, no el montaje.',
    'notes.tip3':
      '<strong>Tipografía que crece</strong>: ningún texto del dibujo tiene tamaño fijo. El SVG hereda la tipografía del contenedor, así que aumentar la fuente del navegador aumenta la etiqueta del eje con ella (WCAG 1.4.4).',
    'notes.tip4':
      '<strong>Altura por proporción</strong>: el dibujo no tiene altura fija. La altura nace de la proporción del dibujo aplicada al ancho del contenedor, y el piso viene del propio bloque — por eso la página no salta cuando llega el dato.',
    'props.extensibility':
      'Para tipos de gráfico no cubiertos (dispersión, radar, mapa de calor), el camino es extender el componente, no pasar un objeto de configuración: el dibujo se monta aquí. Los colores y la tipografía siguen viniendo del tema en cualquier caso.',
    'props.table.showData': 'Hace visible para todos la tabla de datos que ya existe para lectores de pantalla.',
    'props.table.compact':
      'Mini gráfico en línea: sin ejes, rejilla, leyenda ni etiquetas de valor, y con proporción achatada. Sirve de indicador de tendencia junto a un número.',
    'props.table.categoryLabel': 'Encabezado de la primera columna de la tabla de datos.',
    'props.table.valueLabel': 'Nombre de la serie cuando los datos vienen en la forma simple de rótulo y valor.',
    'props.table.shareLabel': 'Encabezado de la columna de participación, en la tabla de datos del circular.',
    'props.table.className':
      'Las clases extra van en el atributo class del propio elemento — Angular las combina con las del design system.',
    'props.table.pointLabel': 'Rótulo de la categoría — se convierte en la marca del eje y en la primera columna de la tabla.',
    'props.table.pointValue': 'Valor numérico de la categoría.',
    'props.table.seriesName': 'Nombre de la serie — aparece en la leyenda y en el encabezado de la columna.',
    'props.table.seriesData': 'Valores de la serie, alineados al eje de categorías.',
    'props.table.seriesColor': 'Color explícito de la serie; sobrescribe el token de la posición.',
    'tokens.table.background':
      'Trazo de la trama superpuesta a cada serie — es lo que separa el rayado del relleno.',
    'demonstration.labels.pie': 'Circular',
    'demonstration.labels.dataTable': 'Tabla de datos equivalente, visible',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
  { labelKey: 'nav.overview', sections: [
    { id: 'demonstracao', labelKey: 'nav.demonstration' },
    { id: 'anatomia',     labelKey: 'nav.anatomy'       },
    { id: 'quando-usar',  labelKey: 'nav.usage'         },
    { id: 'do-dont',      labelKey: 'nav.doDont'        },
  ]},
  { labelKey: 'nav.techRef', sections: [
    { id: 'importacao',   labelKey: 'nav.import'       },
    { id: 'variantes',    labelKey: 'nav.variants'     },
    { id: 'composicoes',  labelKey: 'nav.compositions' },
    { id: 'estados',      labelKey: 'nav.states'       },
    { id: 'propriedades', labelKey: 'nav.props'        },
    { id: 'tokens',       labelKey: 'nav.tokens'       },
  ]},
  { labelKey: 'nav.context', sections: [
    { id: 'acessibilidade', labelKey: 'nav.accessibility' },
    { id: 'relacionados',   labelKey: 'nav.related'       },
    { id: 'notas',          labelKey: 'nav.notes'         },
  ]},
  { labelKey: 'nav.quality', sections: [
    { id: 'analytics', labelKey: 'nav.analytics' },
    { id: 'testes',    labelKey: 'nav.testes'    },
  ]},
];

// ─── Snippets ─────────────────────────────────────────────────────────────────
//
// O `anatomy.structureCode.angular` do conteúdo compartilhado anuncia
// "ngx-echarts sobre a mesma option do buildBarOption" e passa `[option]`. Não
// existe: não há echarts nesta stack e o componente não tem entrada `option`.
// Os snippets abaixo são o que compila — divergência registrada no relatório.

const IMPORT_CODE = `import { NdsChart } from '@/components/ui/chart';`;

const ANATOMY_CODE = `<div
  ndsChart
  type="bar"
  [xAxis]="meses"
  [series]="series"
  label="Acessos mensais por dispositivo"
></div>

<!--
  meses  = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  series = [
    { name: 'Desktop', data: [186, 305, 237, 73, 209, 214] },
    { name: 'Mobile',  data: [80, 200, 120, 190, 130, 140] },
  ];

  label é obrigatório: vira a descrição do desenho e a legenda da tabela de
  dados que acompanha o gráfico.
-->`;

const CODE_BAR = `<div ndsChart type="bar" [xAxis]="meses" [series]="series" label="Acessos mensais no desktop"></div>`;

const CODE_LINE = `<div ndsChart type="line" [xAxis]="meses" [series]="series" label="Acessos mensais por dispositivo"></div>`;

const CODE_AREA = `<div ndsChart type="area" [xAxis]="meses" [series]="series" label="Volume mensal de acessos por dispositivo"></div>`;

const CODE_PIE = `<!-- A pizza só aceita a forma simples: um rótulo e um valor por fatia. -->
<div ndsChart type="pie" [data]="dados" label="Distribuição de acessos por dispositivo"></div>`;

const CODE_COMPACT = `<!-- Indicador ao lado de um número: sem eixos, sem legenda, proporção
     achatada. O valor exato continua na tabela de dados. -->
<div class="nds-cluster" data-spacing="sm" data-align="center">
  <span class="nds-text-h3 nds-font-semibold">2.640</span>
  <div ndsChart type="line" [series]="tendencia" [compact]="true" label="Tendência de acessos nos últimos seis meses"></div>
</div>`;

const CODE_IN_CARD = `<div ndsCard>
  <div ndsCardHeader>
    <p ndsCardTitle>Acessos mensais</p>
    <p ndsCardDescription>Janeiro a junho, por dispositivo</p>
  </div>
  <div ndsCardContent>
    <div ndsChart type="bar" [xAxis]="meses" [series]="series" label="Acessos mensais por dispositivo"></div>
  </div>
</div>`;

const INTERFACE_CODE = `// Um componente só, com entradas declarativas — sem objeto de configuração e
// sem builders. O tipo é o dado, não o estilo.
@Component({ selector: 'div[ndsChart]' })
export class NdsChart {
  readonly type = input<ChartType>('bar');          // 'bar' | 'line' | 'area' | 'pie'
  readonly label = input.required<string>();        // descrição do gráfico
  readonly data = input<ChartDataPoint[] | undefined>(undefined);
  readonly xAxis = input<string[] | undefined>(undefined);
  readonly series = input<ChartSeries[] | undefined>(undefined);
  readonly chartTitle = input<string>('');
  readonly showLegend = input<boolean | undefined>(undefined);
  readonly showData = input<boolean>(false);
  readonly compact = input<boolean>(false);

  readonly categoryLabel = input<string>('Categoria');
  readonly valueLabel = input<string>('Valor');
  readonly shareLabel = input<string>('Participação');
  readonly emptyLabel = input<string>('Sem dados para exibir');
}

interface ChartDataPoint { label: string; value: number }
interface ChartSeries { name: string; data: number[]; color?: string }`;

const TOKENS_CSS = `/* As cores de série saem dos tokens do tema, na ordem das séries.
   Personalizar a paleta é redefinir os tokens — o desenho acompanha. */
.meu-tema {
  --chart-1: 210 90% 45%;
  --chart-2: 160 70% 38%;
  --chart-3: 35 90% 45%;
}`;

@Component({
  selector: 'nds-chart-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsChart, NdsCard, NdsCardHeader, NdsCardTitle, NdsCardDescription, NdsCardContent,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- ── Previews ──────────────────────────────────────────────────────────
         Nenhum preview usa <main> nem heading próprio: a docs page já está
         dentro de um <main>, e marco dentro de marco reprova no axe. O título
         do card da composição é um <p>, não um <h3>: o card já vive dentro do
         h3 do card de variante, e repetir o nível embaralharia a ordem. -->

    <ng-template #tplDoDont1Do>
      <!-- Duas séries com legenda automática: o nome de cada uma fica escrito,
           e a trama distingue as barras sem depender da cor. -->
      <div
        ndsChart
        type="bar"
        [xAxis]="meses"
        [series]="seriesMulti"
        [label]="rotulo(toPlainText(t('doDont.pair1.do')))"
      ></div>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <!-- Legenda desligada à força: sobram duas cores sem nome. -->
      <div
        ndsChart
        type="bar"
        [xAxis]="meses"
        [series]="seriesMulti"
        [showLegend]="false"
        [label]="rotulo(toPlainText(t('doDont.pair1.dont')))"
      ></div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <!-- Descrição específica: diz o tipo, o recorte e o que está medido. -->
      <div
        ndsChart
        type="line"
        [xAxis]="meses"
        [series]="seriesMulti"
        [label]="rotulo(toPlainText(t('doDont.pair2.do')))"
      ></div>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <!-- Descrição genérica: quem não vê o desenho fica sabendo que existe um
           gráfico, e nada mais. -->
      <div
        ndsChart
        type="line"
        [xAxis]="meses"
        [series]="seriesMulti"
        [label]="t('title')"
      ></div>
    </ng-template>

    <ng-template #tplVarBar>
      <div
        ndsChart
        type="bar"
        [xAxis]="meses"
        [series]="serieUnica"
        [label]="rotulo(t('variants.items.bar.name'))"
      ></div>
    </ng-template>

    <ng-template #tplVarLine>
      <div
        ndsChart
        type="line"
        [xAxis]="meses"
        [series]="seriesMulti"
        [label]="rotulo(t('variants.items.line.name'))"
      ></div>
    </ng-template>

    <ng-template #tplVarArea>
      <div
        ndsChart
        type="area"
        [xAxis]="meses"
        [series]="seriesMulti"
        [label]="rotulo(t('variants.items.area.name'))"
      ></div>
    </ng-template>

    <ng-template #tplVarPie>
      <div
        ndsChart
        type="pie"
        [data]="dataDispositivo"
        [label]="rotulo(t('variants.items.pie.name'))"
        [categoryLabel]="t('demonstration.labels.dataLabel')"
        [valueLabel]="t('demonstration.labels.tooltipLabel')"
      ></div>
    </ng-template>

    <ng-template #tplVarCompact>
      <div class="nds-cluster nds-w-full" data-spacing="sm" data-align="center" data-justify="center">
        <span class="nds-text-h3 nds-font-semibold">{{ totalTendencia }}</span>
        <div
          ndsChart
          type="line"
          [series]="tendencia"
          [compact]="true"
          class="nds-max-w-xs"
          [label]="rotulo(t('variants.items.smallInline.name'))"
        ></div>
      </div>
    </ng-template>

    <ng-template #tplCompInCard>
      <div ndsCard class="nds-w-full">
        <div ndsCardHeader>
          <p ndsCardTitle>{{ t('demonstration.labels.chartTitle') }}</p>
          <p ndsCardDescription>{{ t('demonstration.labels.tooltipLabel') }}</p>
        </div>
        <div ndsCardContent>
          <div
            ndsChart
            type="bar"
            [xAxis]="meses"
            [series]="seriesTrio"
            [label]="rotulo(t('variants.compositions.inCard.name'))"
          ></div>
        </div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="chart"
    >
      <div docsHeader>
        <nds-docs-header
          [title]="t('title')"
          [description]="t('description')"
          [category]="t('category')"
          [type]="t('type')"
        />
      </div>

      <ng-container docsMain>
        <nds-docs-demonstration [title]="t('demonstration.title')">
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <div class="nds-stack nds-w-full" data-spacing="sm">
              <span class="nds-text-caption">{{ t('demonstration.labels.bar') }}</span>
              <div
                ndsChart
                type="bar"
                [xAxis]="meses"
                [series]="seriesMulti"
                [chartTitle]="t('demonstration.labels.chartTitle')"
                [label]="rotulo(t('demonstration.labels.bar'))"
              ></div>
            </div>

            <div class="nds-stack nds-w-full" data-spacing="sm">
              <span class="nds-text-caption">{{ t('demonstration.labels.line') }}</span>
              <div
                ndsChart
                type="line"
                [xAxis]="meses"
                [series]="seriesMulti"
                [label]="rotulo(t('demonstration.labels.line'))"
              ></div>
            </div>

            <div class="nds-stack nds-w-full" data-spacing="sm">
              <!-- showData ligado: a mesma tabela que o leitor de tela já lê,
                   agora à vista de todo mundo. -->
              <span class="nds-text-caption">{{ t('demonstration.labels.dataTable') }}</span>
              <div
                ndsChart
                type="pie"
                [data]="dataDispositivo"
                [showData]="true"
                [categoryLabel]="t('demonstration.labels.dataLabel')"
                [valueLabel]="t('demonstration.labels.tooltipLabel')"
                [label]="rotulo(t('demonstration.labels.pie'))"
              ></div>
            </div>
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="anatomyCode"
          language="html"
        />

        <nds-docs-when-to-use
          [title]="t('usage.title')"
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="t('import.title')"
          [description]="t('import.basic')"
          [code]="importCode"
          componentSlug="chart"
          language="ts"
        />

        <nds-docs-variants
          id="variantes"
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="chart"
          language="html"
        />

        <nds-docs-variants
          id="composicoes"
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          componentSlug="chart"
          language="html"
        />

        <nds-docs-states
          [title]="t('states.title')"
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <nds-docs-props
          [title]="t('props.title')"
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityNotes]="t('props.extensibility')"
        />

        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="tokensCss"
        />

        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboardTitle')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="chart"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="chart" />

        <nds-docs-analytics
          [title]="t('analytics.title')"
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <nds-docs-testes
          [title]="t('testes.title')"
          [functional]="testesFunctional()"
          [accessibility]="testesAccessibility()"
          [visual]="testesVisual()"
        />
      </ng-container>
    </nds-docs-page-layout>
  `,
})
export class NdsChartDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  // Exposto ao template porque o destino é atributo (textNode), não HTML: as
  // chaves de doDont guardam markup escapado e ele chegaria literal à tela.
  protected readonly toPlainText = toPlainText;
  protected readonly importCode = IMPORT_CODE;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly tokensCss = TOKENS_CSS;

  // Os mesmos dados das stories: a regressão visual compara o mesmo gráfico na
  // docs page e na story, e um número diferente aqui viraria diferença de pixel
  // sem causa.
  protected readonly meses = MONTHS;
  protected readonly serieUnica = SERIE_UNICA;
  protected readonly seriesMulti = SERIES_MULTI;
  protected readonly seriesTrio = SERIES_TRIO;
  protected readonly dataDispositivo = DATA_DISPOSITIVO;
  protected readonly tendencia = TENDENCIA;

  /** Total do mini gráfico — derivado da série, nunca escrito à mão. */
  protected readonly totalTendencia = TENDENCIA[0].data.reduce((sum, v) => sum + v, 0);

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarBar = viewChild.required<TemplateRef<unknown>>('tplVarBar');
  private readonly tplVarLine = viewChild.required<TemplateRef<unknown>>('tplVarLine');
  private readonly tplVarArea = viewChild.required<TemplateRef<unknown>>('tplVarArea');
  private readonly tplVarPie = viewChild.required<TemplateRef<unknown>>('tplVarPie');
  private readonly tplVarCompact = viewChild.required<TemplateRef<unknown>>('tplVarCompact');
  private readonly tplCompInCard = viewChild.required<TemplateRef<unknown>>('tplCompInCard');

  /**
   * Descrição do gráfico de um preview.
   *
   * `label` é obrigatório no componente porque um desenho sem descrição é
   * conteúdo perdido — e cada preview desta página precisa da sua, senão a
   * mesma frase apareceria na legenda de meia dúzia de tabelas de dados.
   */
  protected rotulo(sufixo: string): string {
    return `${t('demonstration.labels.chartTitle')} — ${toPlainText(sufixo)}`;
  }

  // ─── Seções ─────────────────────────────────────────────────────────────────

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: navLabel(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: navLabel(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => numberedItems(dict(), 'anatomy'));

  protected readonly guidelines = computed(() => {
    const d = dict();
    return { title: t('usage.guidelines.title'), items: numberedItems(d, 'usage.guidelines') };
  });

  protected readonly scenarios = computed(() => {
    const d = dict();
    return {
      title: t('usage.scenarios.title'),
      cols: {
        scenario: t('usage.scenarios.cols.scenario'),
        use: t('usage.scenarios.cols.use'),
        alternative: t('usage.scenarios.cols.alternative'),
      },
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']),
    };
  });

  protected readonly uxWriting = computed(() => {
    dict();
    return {
      title: t('usage.uxWriting.title'),
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        // O container lê `do`/`dont`; `correct`/`avoid` renderiza duas colunas
        // vazias, e o tsc não pega porque não valida template Angular.
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: ['axisLabel', 'tooltipValue', 'legendLabel', 'emptyState'].map((k) => ({
        element: toPlainText(t(`usage.uxWriting.table.${k}.name`)),
        rules: toPlainText(t(`usage.uxWriting.table.${k}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${k}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${k}.bad`)),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    const d = dict();
    return { title: t('usage.do.title'), items: numberedItems(d, 'usage.do') };
  });

  protected readonly usageDont = computed(() => {
    const d = dict();
    return { title: t('usage.dont.title'), items: numberedItems(d, 'usage.dont') };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    const pairs: [TemplateRef<unknown>, TemplateRef<unknown>][] = [
      [this.tplDoDont1Do(), this.tplDoDont1Dont()],
      [this.tplDoDont2Do(), this.tplDoDont2Dont()],
    ];
    return pairs.map(([doTpl, dontTpl], i) => ({
      doLabel: tNav('common.do'),
      dontLabel: tNav('common.dont'),
      doCaption: toPlainText(t(`doDont.pair${i + 1}.do`)),
      dontCaption: toPlainText(t(`doDont.pair${i + 1}.dont`)),
      doPreview: doTpl,
      dontPreview: dontTpl,
    }));
  });

  protected readonly variantItems = computed(() => {
    dict();
    return [
      { key: 'bar',         code: CODE_BAR,     tpl: this.tplVarBar()     },
      { key: 'line',        code: CODE_LINE,    tpl: this.tplVarLine()    },
      { key: 'area',        code: CODE_AREA,    tpl: this.tplVarArea()    },
      { key: 'pie',         code: CODE_PIE,     tpl: this.tplVarPie()     },
      { key: 'smallInline', code: CODE_COMPACT, tpl: this.tplVarCompact() },
    ].map(({ key, code, tpl }) => ({
      // `.name` existe no conteúdo só para `smallInline`; para os quatro tipos
      // vem do override. Lido sempre pelo mesmo caminho, o card nunca cai no
      // caso em que o título repete a descrição inteira.
      name: t(`variants.items.${key}.name`),
      description: valueOuField(`variants.items.${key}`, 'description'),
      code,
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly compositionItems = computed(() => {
    dict();
    return [{ key: 'inCard', code: CODE_IN_CARD, tpl: this.tplCompInCard() }].map(
      ({ key, code, tpl }) => ({
        name: t(`variants.compositions.${key}.name`),
        description: withQuandoUsar(
          t(`variants.compositions.${key}.description`),
          t(`variants.compositions.${key}.use`),
        ),
        code,
        trackId: key,
        preview: tpl,
      }),
    );
  });

  protected readonly statesCols = computed(() => {
    dict();
    return {
      state: t('states.cols.state'),
      trigger: t('states.cols.trigger'),
      behavior: t('states.cols.behavior'),
    };
  });

  protected readonly stateItems = computed(() => {
    dict();
    return ['empty', 'loading', 'singleSeries', 'multiSeries', 'multiSeriesWithLegend'].map((k) => ({
      label: t(`states.${k}.label`),
      trigger: toPlainText(t(`states.${k}.trigger`)),
      behavior: toPlainText(t(`states.${k}.behavior`)),
    }));
  });

  protected readonly propTables = computed(() => {
    dict();
    const cols = {
      prop: t('props.table.prop'),
      type: t('props.table.type'),
      default: t('props.table.default'),
      required: t('props.table.required'),
      description: t('props.table.description'),
    };
    const sim = tNav('common.yes');
    const not = tNav('common.no');
    // "—" e nunca a string "undefined": travessão é o vazio tipográfico, e é o
    // que as outras stacks mostram.
    const linha = (
      name: string,
      chave: string,
      tipo: string,
      padrao: string,
      obrigatorio = not,
    ) => ({
      name,
      type: tipo,
      defaultValue: padrao,
      required: obrigatorio,
      description: toPlainText(t(`props.table.${chave}`)),
    });

    return [
      {
        title: t('props.containerTitle'),
        cols,
        items: [
          linha('type', 'chartType', `'bar' | 'line' | 'area' | 'pie'`, `'bar'`),
          linha('label', 'ariaLabel', 'string', '—', sim),
          linha('data', 'data', 'ChartDataPoint[]', '—'),
          linha('xAxis', 'xAxis', 'string[]', '—'),
          linha('series', 'series', 'ChartSeries[]', '—'),
          linha('chartTitle', 'title', 'string', `''`),
          linha('showLegend', 'showLegend', 'boolean', '—'),
          linha('showData', 'showData', 'boolean', 'false'),
          linha('compact', 'compact', 'boolean', 'false'),
          linha('categoryLabel', 'categoryLabel', 'string', `'Categoria'`),
          linha('valueLabel', 'valueLabel', 'string', `'Valor'`),
          linha('shareLabel', 'shareLabel', 'string', `'Participação'`),
          linha('emptyLabel', 'emptyLabel', 'string', `'Sem dados para exibir'`),
          linha('class', 'className', 'string', '—'),
        ],
      },
      {
        title: t('props.legendTitle'),
        cols,
        items: [
          linha('ChartDataPoint.label', 'pointLabel', 'string', '—', sim),
          linha('ChartDataPoint.value', 'pointValue', 'number', '—', sim),
          linha('ChartSeries.name', 'seriesName', 'string', '—', sim),
          linha('ChartSeries.data', 'seriesData', 'number[]', '—', sim),
          linha('ChartSeries.color', 'seriesColor', 'string', '—'),
        ],
      },
    ];
  });

  protected readonly tokensCols = computed(() => {
    dict();
    return {
      token: t('tokens.table.token'),
      value: t('tokens.table.part'),
      description: t('tokens.table.class'),
    };
  });

  protected readonly tokenItems = computed(() => {
    dict();
    return [
      // A coluna do meio é SELETOR, não texto traduzido: escrever "Série 1" ali
      // deixaria português cravado nas três versões da página.
      { token: '--chart-1',          k: 'chart1',          parte: '[data-series="0"]'     },
      { token: '--chart-2',          k: 'chart2',          parte: '[data-series="1"]'     },
      { token: '--chart-3',          k: 'chart3',          parte: '[data-series="2"]'     },
      { token: '--chart-4',          k: 'chart4',          parte: '[data-series="3"]'     },
      { token: '--chart-5',          k: 'chart5',          parte: '[data-series="4"]'     },
      { token: '--foreground',       k: 'foreground',      parte: '.nds-chart svg [stroke]' },
      { token: '--muted-foreground', k: 'mutedForeground', parte: '.nds-chart svg text'   },
      { token: '--border',           k: 'border',          parte: '.nds-chart svg line'   },
      { token: '--background',       k: 'background',      parte: '.nds-chart pattern'    },
    ].map(({ token, k, parte }) => ({
      token,
      value: parte,
      description: toPlainText(t(`tokens.table.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => numberedItems(dict(), 'accessibility'));

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',   description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: '←  →',  description: toPlainText(t('accessibility.keyboard.arrowRight')) },
      { key: '—',     description: toPlainText(t('accessibility.keyboard.noOtherKeys')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return ['onFocus', 'onDataPoint', 'srOnlyText', 'icons'].map((k) =>
      t(`accessibility.screenReader.${k}`),
    );
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'table',     nome: 'Table',     path: '?path=/docs/ui-table--docs'     },
      { key: 'card',      nome: 'Card',      path: '?path=/docs/ui-card--docs'      },
      { key: 'dataTable', nome: 'DataTable', path: '?path=/docs/ui-datatable--docs' },
    ].map(({ key, nome, path }) => ({
      name: nome,
      description: toPlainText(t(`related.${key}`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() =>
    numberedItems(dict(), 'notes', 'tip').map((content) => ({ title: '', content })),
  );

  protected readonly analyticsCols = computed(() => {
    dict();
    return {
      event: t('analytics.table.event'),
      trigger: t('analytics.table.trigger'),
      payload: t('analytics.table.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    // O Chart é passivo: não dispara evento próprio. O que sai daqui é o
    // tracking da própria docs page.
    return [
      { e: 'pageView',      gatilho: 'pageViewTrigger',      carga: 'pageViewPayload'      },
      { e: 'sectionViewed', gatilho: 'sectionViewedTrigger', carga: 'sectionViewedPayload' },
      { e: 'langSwitch',    gatilho: 'langSwitchTrigger',    carga: 'langSwitchPayload'    },
    ].map(({ e, gatilho, carga }) => ({
      event: t(`analytics.table.${e}`),
      trigger: toPlainText(t(`analytics.table.${gatilho}`)),
      payload: toPlainText(t(`analytics.table.${carga}`)),
    }));
  });

  protected readonly testesFunctional = computed(() => {
    const d = dict();
    return {
      title: t('testes.functional.title'),
      description: t('testes.functional.description'),
      cols: {
        action: tNav('common.userAction'),
        result: tNav('common.expectedResult'),
        priority: tNav('common.priority'),
      },
      items: itemsFromDict(d, 'testes.functional', ['action', 'result', 'priority']).map((r) => ({
        action: toPlainText(r.action),
        result: stripHtml(toPlainText(r.result)),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    const d = dict();
    // A forma varia por componente: trinca criterion/level/how ou string solta.
    const trinca = itemsFromDict(d, 'testes.accessibility', ['criterion', 'level', 'how']);
    const items = trinca.length
      ? trinca.map((r) => ({
          criterion: toPlainText(r.criterion),
          level: r.level,
          how: toPlainText(r.how),
        }))
      : numberedItems(d, 'testes.accessibility').map((texto) => ({
          criterion: toPlainText(texto),
          level: '',
          how: '',
        }));
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items,
    };
  });

  protected readonly testesVisual = computed(() => {
    const d = dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
      items: itemsFromDict(d, 'testes.visual', ['story', 'priority']).map((r) => ({
        story: toPlainText(r.story),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  private observer: { disconnect: () => void } | undefined;

  constructor() {
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: 'chart',
      });
      track('docs_page_view', {
        component_name: 'chart',
        locale,
        page_title: `${t('title')} · Design System`,
      });
      onCleanup(cleanup);
    });
  }

  ngAfterViewInit(): void {
    this.observer = createActiveSectionObserver(
      [...SECTION_IDS],
      (id) => document.getElementById(id),
      (id) => this.activeSection.set(id),
      (id) =>
        track('docs_section_viewed', {
          component_name: 'chart',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

// ─── Helpers de cauda ─────────────────────────────────────────────────────────

/** Rótulo de navegação, com queda para o ui.json quando o slug não o declara. */
function navLabel(chave: string): string {
  const doComponente = t(chave);
  return doComponente === chave ? tNav(chave) : doComponente;
}

/**
 * Lê uma chave que pode ser string solta OU objeto com campos.
 *
 * `t()` devolve a PRÓPRIA CHAVE quando ela aponta para um objeto — e é assim
 * que "variants.items.smallInline" acaba escrito na tela, sem erro nenhum.
 */
function valueOuField(base: string, campo: string): string {
  const direto = t(base);
  if (direto !== base) return direto;
  const chave = `${base}.${campo}`;
  const ofField = t(chave);
  return ofField === chave ? '' : ofField;
}

/**
 * Junta descrição e "quando usar" na forma que o container de variantes espera.
 *
 * `NdsDocsCompositions` faria isto sozinho, mas não repassa `language` para o
 * `NdsDocsVariants` — e os snippets aqui são template Angular, não TS.
 */
function withQuandoUsar(descricao: string, quandoUsar: string): string {
  return `${descricao}<br><br><strong>${tNav('common.useWhen')}</strong> ${quandoUsar}`;
}

/**
 * Lista numerada (`base.item1`, `base.item2`…) lida até acabar.
 *
 * Contar à mão é o defeito que aparece na tela: com um item a menos, a chave
 * crua sai escrita no lugar do texto; com um a mais, o item some da página.
 */
function numberedItems(
  d: Record<string, string>,
  base: string,
  prefixo = 'item',
): string[] {
  const itens: string[] = [];
  for (let i = 1; ; i++) {
    const valor = d[`${base}.${prefixo}${i}`];
    if (valor === undefined) break;
    itens.push(valor);
  }
  return itens;
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

function itemsFromDict<K extends string>(
  d: Record<string, string>,
  base: string,
  fields: readonly K[],
): Record<K, string>[] {
  const rows: Record<K, string>[] = [];
  for (let i = 1; ; i++) {
    if (d[`${base}.item${i}.${fields[0]}`] === undefined) break;
    const row = {} as Record<K, string>;
    for (const f of fields) row[f] = d[`${base}.item${i}.${f}`] ?? '';
    rows.push(row);
  }
  return rows;
}
