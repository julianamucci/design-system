/**
 * Transforms do painel Code do Resizable.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * A moldura é LIÇÃO, não enfeite: o grupo divide o espaço que o contêiner lhe
 * der, e sem tamanho definido não há o que dividir — um grupo vertical dentro de
 * um pai sem altura empilha os painéis no tamanho do conteúdo e nada se ajusta.
 * As stories cravam esse tamanho em `style` inline (`width: 480px`); o snippet
 * não pode, então o tamanho vem de largura máxima + proporção, as utilitárias
 * que o design system tem. Não existe utilitária de altura fixa para onde mover
 * um `height: 240px`.
 */
import { attrs, asCode, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type ResizableArgs = {
  direction: 'horizontal' | 'vertical';
};

const IMPORT = `import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'`;

/**
 * O rótulo do divisor diz o ATALHO, e não só o que ele é: o `role="separator"`
 * focável não tem nenhuma pista visual de que as setas o movem, e sem o nome o
 * leitor de tela anuncia "separador" e para por aí.
 */
const LABEL_HANDLE = 'Redimensionar painéis — use setas para ajustar';

type Panel = {
  size: number;
  min?: number;
  max?: number;
  label?: string;
  highlight?: boolean;
};

/**
 * Miolo demonstrativo de um painel. `nds-h-full` é o que faz o conteúdo ocupar
 * a faixa inteira — sem ele o painel muda de tamanho e o conteúdo fica boiando
 * no topo, e a divisão deixa de ser visível.
 */
function content(label: string, highlight = false): string {
  const background = highlight ? ' nds-bg-muted' : '';
  return `<div class="nds-cluster nds-h-full nds-p-4 nds-text-body${background}" data-align="center" data-justify="center">${label}</div>`;
}

/** Um painel com o tamanho inicial e os limites que ele aceita. */
function panel(p: Panel, inside?: string): string {
  const body = inside ?? content(p.label ?? '', p.highlight);
  return `<ResizablePanel${attrs(
    `:default-size="${p.size}"`,
    p.min !== undefined && `:min-size="${p.min}"`,
    p.max !== undefined && `:max-size="${p.max}"`,
  )}>
${indentar(body)}
</ResizablePanel>`;
}

/** O divisor entre dois painéis. */
function punho(
  label: string,
  options: { grabber?: boolean; travado?: boolean } = {},
): string {
  return `<ResizableHandle${attrs(
    options.travado && 'disabled',
    options.grabber && 'with-handle',
    `aria-label="${label}"`,
  )} />`;
}

/**
 * O grupo sempre declara a direção: ela é obrigatória no componente, então
 * omiti-la — mesmo quando bate com o arranjo mais comum — entregaria ao leitor
 * um trecho que não roda.
 */
function group(direction: 'horizontal' | 'vertical', children: string[]): string {
  return `<ResizablePanelGroup direction="${direction}">
${indentar(children.join('\n'))}
</ResizablePanelGroup>`;
}

/**
 * A moldura de tamanho definido em volta do grupo.
 *
 * `nds-max-w-*` + proporção no lugar do par largura/altura cravado: são as
 * utilitárias que existem, e a proporção sobrevive à tela estreita, onde uma
 * altura fixa estouraria.
 */
function frame(
  interno: string,
  options: { width?: string; proporcao?: string } = {},
): string {
  const { width = 'nds-w-lg', proporcao = 'nds-aspect-16-9' } = options;
  return `<div class="${width} ${proporcao} nds-rounded-md nds-border-default nds-overflow-hidden">
${indentar(interno)}
</div>`;
}

/**
 * Forma canônica: moldura com tamanho, grupo na direção pedida, dois painéis e
 * um divisor com pegador entre eles.
 */
export const resizableSource: SourceTransform<ResizableArgs> = (_gerado, ctx) => {
  const direction = asCode(ctx?.args?.direction) === 'vertical' ? 'vertical' : 'horizontal';
  return vueSnippet(
    IMPORT,
    frame(
      group(direction, [
        panel({
          size: 30,
          min: 20,
          max: 60,
        }, `<div class="nds-stack nds-p-4" data-spacing="xs">
  <p class="nds-text-body nds-font-semibold">Sidebar</p>
  <p class="nds-text-caption nds-text-muted-foreground">Navegação do projeto</p>
</div>`),
        punho(LABEL_HANDLE, { grabber: true }),
        panel({
          size: 70,
          min: 20,
        }, `<div class="nds-stack nds-p-4" data-spacing="xs">
  <p class="nds-text-body nds-font-semibold">Conteúdo principal</p>
  <p class="nds-text-caption nds-text-muted-foreground">
    Arraste o divisor ou use as setas com ele focado.
  </p>
</div>`),
      ]),
    ),
  );
};

/**
 * Split lateral: o grupo é horizontal e o divisor é uma linha VERTICAL. A
 * inversão é a fonte clássica de erro — a direção descreve o arranjo dos
 * painéis, não a do traço entre eles.
 */
export function resizableHorizontalSource(): string {
  return vueSnippet(
    IMPORT,
    frame(
      group('horizontal', [
        panel({ size: 30, min: 20, max: 50, label: 'Esquerda', highlight: true }),
        punho('Redimensionar as colunas — use setas para ajustar'),
        panel({ size: 70, min: 50, label: 'Direita' }),
      ]),
    ),
  );
}

/** Split empilhado: os painéis dividem a ALTURA e o divisor deita. */
export function resizableVerticalSource(): string {
  return vueSnippet(
    IMPORT,
    frame(
      group('vertical', [
        panel({ size: 40, min: 20, label: 'Topo' }),
        punho('Redimensionar as faixas — use setas para ajustar'),
        panel({ size: 60, min: 20, label: 'Rodapé', highlight: true }),
      ]),
      { width: 'nds-w-xs', proporcao: 'nds-aspect-4-3' },
    ),
  );
}

/**
 * Grupo dentro de painel: cada grupo governa só os próprios painéis, e o de
 * dentro tem eixo e proporções independentes do de fora.
 */
export function resizableNestedSource(): string {
  return vueSnippet(
    IMPORT,
    frame(
      group('horizontal', [
        panel({ size: 30, min: 20, max: 50, label: 'Sidebar', highlight: true }),
        punho('Redimensionar sidebar e conteúdo — use setas'),
        panel(
          { size: 70, min: 50 },
          group('vertical', [
            panel({ size: 60, min: 20, label: 'Editor' }),
            punho('Redimensionar editor e console — use setas'),
            panel({ size: 40, min: 20, label: 'Console', highlight: true }),
          ]),
        ),
      ]),
    ),
  );
}

/**
 * Divisor com pegador: a linha de 1px é quase invisível, e o pegador é o que
 * anuncia que ali existe um controle. Ele é desenho — o nome acessível continua
 * saindo do `aria-label` do divisor, e nenhum texto entra no pegador.
 */
export function resizableWithGrabberSource(): string {
  return vueSnippet(
    IMPORT,
    frame(
      group('horizontal', [
        panel({ size: 50, min: 20, label: 'Antes' }),
        punho('Redimensionar painéis — use setas', { grabber: true }),
        panel({ size: 50, min: 20, label: 'Depois', highlight: true }),
      ]),
    ),
  );
}

/** Arrasto: dois painéis livres, com o piso baixo para o divisor ter curso. */
export function resizableArrastandoSource(): string {
  return vueSnippet(
    IMPORT,
    frame(
      group('horizontal', [
        panel({ size: 50, min: 10, label: 'Esquerda' }),
        punho(LABEL_HANDLE, { grabber: true }),
        panel({ size: 50, min: 10, label: 'Direita', highlight: true }),
      ]),
    ),
  );
}

/**
 * Limites: o piso e o teto moram no PAINEL, não no divisor. Sem o piso,
 * insistir na seta faria o painel sumir — e o conteúdo dentro dele com ele.
 */
export function resizableLimitesSource(): string {
  return vueSnippet(
    IMPORT,
    frame(
      group('horizontal', [
        panel({ size: 50, min: 30, max: 60, label: 'Limitado' }),
        punho(LABEL_HANDLE),
        panel({ size: 50, min: 30, label: 'Livre', highlight: true }),
      ]),
    ),
  );
}

/**
 * Divisor alcançável pelo teclado: a linha nua, sem pegador. O `tabindex` não
 * se escreve — o componente já põe o divisor na ordem de tabulação, e o anel
 * sai de `:focus-visible`, que só casa quando o foco chega por teclado.
 */
export function resizableFocusSource(): string {
  return vueSnippet(
    IMPORT,
    frame(
      group('horizontal', [
        panel({ size: 50, min: 20, label: 'Um' }),
        punho(LABEL_HANDLE),
        panel({ size: 50, min: 20, label: 'Dois', highlight: true }),
      ]),
    ),
  );
}

/**
 * Divisor travado: `disabled` mora no divisor e ele CONTINUA na ordem de
 * tabulação. Um controle que some do Tab não tem como explicar por que travou.
 */
export function resizableTravadoSource(): string {
  return vueSnippet(
    IMPORT,
    frame(
      group('horizontal', [
        panel({ size: 50, min: 20, label: 'Fixo' }),
        punho(LABEL_HANDLE, { grabber: true, travado: true }),
        panel({ size: 50, min: 20, label: 'Fixo', highlight: true }),
      ]),
    ),
  );
}

/**
 * Três colunas em sequência: um divisor a menos que o número de painéis, cada
 * um com o próprio nome. Rótulos repetidos deixariam a lista de marcos do
 * leitor de tela com três entradas iguais.
 */
export function resizableEditorSource(): string {
  return vueSnippet(
    IMPORT,
    frame(
      group('horizontal', [
        panel({ size: 25, min: 15, max: 40, label: 'Arquivos', highlight: true }),
        punho('Redimensionar lista de arquivos — use setas para ajustar', { grabber: true }),
        panel({ size: 50, min: 30, label: 'Editor' }),
        punho('Redimensionar editor e preview — use setas para ajustar', { grabber: true }),
        panel({ size: 25, min: 15, max: 40, label: 'Preview', highlight: true }),
      ]),
    ),
  );
}

/** Três faixas empilhadas: cabeçalho, conteúdo e rodapé dividindo a altura. */
export function resizableFaixasSource(): string {
  return vueSnippet(
    IMPORT,
    frame(
      group('vertical', [
        panel({ size: 20, min: 10, max: 40, label: 'Cabeçalho', highlight: true }),
        punho('Redimensionar cabeçalho — use setas para ajustar', { grabber: true }),
        panel({ size: 60, min: 30, label: 'Conteúdo' }),
        punho('Redimensionar rodapé — use setas para ajustar', { grabber: true }),
        panel({ size: 20, min: 10, max: 40, label: 'Rodapé', highlight: true }),
      ]),
      { width: 'nds-w-xs', proporcao: 'nds-aspect-square' },
    ),
  );
}

/** Sidebar de um lado, área de trabalho e console do outro, em grupo próprio. */
export function resizableSidebarConsoleSource(): string {
  return vueSnippet(
    IMPORT,
    frame(
      group('horizontal', [
        panel({ size: 30, min: 20, max: 50, label: 'Sidebar', highlight: true }),
        punho('Redimensionar sidebar e área principal — use setas', { grabber: true }),
        panel(
          { size: 70, min: 50 },
          group('vertical', [
            panel({ size: 65, min: 30, label: 'Workspace' }),
            punho('Redimensionar workspace e console — use setas', { grabber: true }),
            panel({ size: 35, min: 15, max: 60, label: 'Console', highlight: true }),
          ]),
        ),
      ]),
    ),
  );
}
