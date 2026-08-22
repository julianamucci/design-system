// Snippet do painel Code do Tooltip — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';
import type { TooltipSide } from './tooltip';

/** Chaves iguais às dos args da story — `{ ...ctx.args }` entra sem tradução. */
export type TooltipSnippetOptions = {
  /** Texto visível do botão que dispara o balão. */
  triggerLabel?: string;
  /**
   * Nome acessível do gatilho. O Tooltip NÃO substitui o nome do botão: em
   * touch não há ponteiro, e o botão precisa ser anunciável sem o balão.
   */
  triggerAriaLabel?: string;
  triggerVariant?: string;
  triggerSize?: string;
  content?: string;
  side?: TooltipSide;
  delayDuration?: number;
  /**
   * `true` mostra o conteúdo entrando como ELEMENTO — o caminho de quando o
   * texto tem marcação (uma tecla de atalho em `<kbd>`, por exemplo). String
   * vira `textContent`, que é o caminho seguro para dado de fora.
   */
  contentComMarcacao?: boolean;
  /** Espera padrão do grupo; presença troca a fábrica pelo provedor. */
  provider?: { delayDuration?: number; skipDelayDuration?: number };
  /** Expressão do callback de exibição, quando a story o exercita. */
  onShow?: string;
};

/** A chamada real de `createTooltip` (ou do provedor) com as opções da story. */
export function tooltipSnippet(o: TooltipSnippetOptions = {}): string {
  const rotulo = o.triggerLabel ?? 'Salvar';
  const conteudo = o.content ?? 'Salvar (Ctrl+S)';
  const withProvider = Boolean(o.provider);

  const linhas = opcoes([
    ['trigger', 'gatilho'],
    ['content', o.contentComMarcacao ? 'conteudo' : texto(conteudo)],
    ['side', o.side && o.side !== 'top' ? texto(o.side) : undefined],
    // Sem provedor, a espera é por balão; com provedor, o padrão vem do grupo.
    ['delayDuration', !withProvider && o.delayDuration ? String(o.delayDuration) : undefined],
    ['onShow', o.onShow],
  ]);

  const fabrica = withProvider ? 'grupo.createTooltip' : 'createTooltip';

  const linesProvider = o.provider
    ? opcoes([
        ['delayDuration', o.provider.delayDuration ? String(o.provider.delayDuration) : undefined],
        ['skipDelayDuration', o.provider.skipDelayDuration !== undefined ? String(o.provider.skipDelayDuration) : undefined],
      ])
    : [];

  return snippet(
    [
      importing('tooltip', withProvider ? 'createTooltipProvider' : 'createTooltip'),
      importing('button', 'createButton'),
    ].join('\n'),
    withProvider
      ? `// O provedor guarda a espera do grupo: o balão seguinte abre na hora\n// enquanto a janela de dispensa dura.\nconst grupo = ${chamada('createTooltipProvider', linesProvider)};`
      : undefined,
    `const gatilho = ${chamada('createButton', opcoes([
      ['variant', texto(o.triggerVariant ?? 'outline')],
      ['size', o.triggerSize ? texto(o.triggerSize) : undefined],
      ['label', texto(rotulo)],
      ['aria-label', o.triggerAriaLabel ? texto(o.triggerAriaLabel) : undefined],
    ]))};`,
    o.contentComMarcacao
      ? `// Marcação entra como ELEMENTO já montado, nunca como HTML em string.
const conteudo = document.createElement('span');
conteudo.append(${texto(conteudo + ' ')});
const tecla = document.createElement('kbd');
tecla.textContent = 'Ctrl+S';
conteudo.appendChild(tecla);`
      : undefined,
    `const dica = ${chamada(fabrica, linhas)};`,
    montar('dica'),
  );
}

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const tooltipSource: SourceTransform<TooltipSnippetOptions> = (_gerado, ctx) =>
  tooltipSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function tooltipSourceWith(fixas: TooltipSnippetOptions): SourceTransform<TooltipSnippetOptions> {
  return (_gerado, ctx) => tooltipSnippet({ ...ctx.args, ...fixas });
}

/**
 * Os quatro lados lado a lado — a story que documenta o posicionamento mostra
 * um balão por lado, e um snippet de um balão só não diria o que ela diz.
 */
export function tooltipLadosSnippet(): string {
  return snippet(
    [importing('tooltip', 'createTooltip'), importing('button', 'createButton')].join('\n'),
    `const grade = document.createElement('div');
grade.className = 'nds-cluster';
grade.dataset.spacing = 'lg';

for (const side of ['top', 'right', 'bottom', 'left'] as const) {
  const gatilho = createButton({ variant: 'outline', label: side });
  grade.appendChild(createTooltip({ trigger: gatilho, content: \`Tooltip \${side}\`, side }));
}`,
    montar('grade'),
  );
}

/** Transform de story para a grade de lados. */
export const tooltipSourceLados: SourceTransform<TooltipSnippetOptions> = () => tooltipLadosSnippet();
