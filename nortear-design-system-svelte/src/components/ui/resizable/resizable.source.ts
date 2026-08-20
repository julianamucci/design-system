/**
 * Transforms do painel Code do Resizable.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. Fora o Playground, as stories deste componente
 * declaram os painéis dentro do `render`, e não em `args` — por isso cada uma
 * declara a sua própria transform.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type ResizableArgs = {
  direction: 'horizontal' | 'vertical';
  withHandle: boolean;
  defaultSize: number;
  minSize: number;
};

type Grupo = {
  direction?: 'horizontal' | 'vertical';
  withHandle?: boolean;
  disabled?: boolean;
  /** Fatia do PRIMEIRO painel, em porcentagem do grupo. */
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  labelA?: string;
  labelB?: string;
  ariaLabel?: string;
  /** Altura do invólucro. Sem ela não há espaço livre para repartir. */
  height?: string;
};

const IMPORT = `import {
  ResizablePaneGroup,
  ResizablePane,
  ResizableHandle,
} from "@/components/ui/resizable";`;

/**
 * O grupo reparte o espaço LIVRE do eixo, então ele — ou o invólucro — precisa
 * de altura de verdade. `min-height` no elemento de fora não basta: os painéis
 * nascem com zero e o layout inteiro some sem erro nenhum.
 */
function envolver(height: string, conteudo: string): string {
  return `<div
  class="nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden"
  style="height: ${height}"
>
${conteudo}
</div>`;
}

/** Conteúdo centralizado de um painel — o painel em si não posiciona nada. */
function conteudo(rotulo: string, indentacao: string, esmaecido = false): string {
  const classe = esmaecido ? 'nds-text-body nds-text-muted-foreground' : 'nds-text-body';
  return `${indentacao}<div class="nds-cluster nds-h-full" data-align="center" data-justify="center">
${indentacao}  <span class="${classe}">${rotulo}</span>
${indentacao}</div>`;
}

function punho(o: Grupo, rotulo: string, indentacao: string): string {
  return `${indentacao}<ResizableHandle${attrs(
    o.withHandle ? 'withHandle' : '',
    o.disabled ? 'disabled' : '',
    `aria-label="${rotulo}"`,
  )} />`;
}

/** Dois painéis e um divisor: a forma canônica do componente. */
function grupoSimples(o: Grupo = {}): string {
  const direction = o.direction ?? 'horizontal';
  const primeiro = o.defaultSize ?? 30;
  const minSize = o.minSize ?? 20;
  const rotulo = o.ariaLabel ?? 'Redimensionar painéis — use setas para ajustar';

  const painelA = attrs(
    `defaultSize={${primeiro}}`,
    `minSize={${minSize}}`,
    o.maxSize === undefined ? '' : `maxSize={${o.maxSize}}`,
  );

  return svelteSnippet(
    IMPORT,
    envolver(
      o.height ?? '240px',
      `  <ResizablePaneGroup direction="${direction}">
    <ResizablePane${painelA}>
${conteudo(o.labelA ?? 'Sidebar', '      ', true)}
    </ResizablePane>
${punho(o, rotulo, '    ')}
    <ResizablePane defaultSize={${100 - primeiro}} minSize={${minSize}}>
${conteudo(o.labelB ?? 'Conteúdo principal', '      ')}
    </ResizablePane>
  </ResizablePaneGroup>`,
    ),
  );
}

type Aninhado = Grupo & {
  innerTop?: string;
  innerBottom?: string;
  innerAriaLabel?: string;
};

/**
 * Um grupo dentro do segundo painel do outro. Cada grupo governa só os
 * próprios painéis, e o de dentro corre no eixo oposto.
 */
function grupoAninhado(o: Aninhado = {}): string {
  const direction = o.direction ?? 'horizontal';
  const interno = direction === 'horizontal' ? 'vertical' : 'horizontal';
  const primeiro = o.defaultSize ?? 30;
  const minSize = o.minSize ?? 20;

  return svelteSnippet(
    IMPORT,
    envolver(
      o.height ?? '320px',
      `  <ResizablePaneGroup direction="${direction}">
    <ResizablePane defaultSize={${primeiro}} minSize={${minSize}}>
${conteudo(o.labelA ?? 'Sidebar', '      ', true)}
    </ResizablePane>
${punho(o, o.ariaLabel ?? 'Redimensionar sidebar e conteúdo — use setas', '    ')}
    <ResizablePane defaultSize={${100 - primeiro}} minSize={${minSize}}>
      <ResizablePaneGroup direction="${interno}">
        <ResizablePane defaultSize={60} minSize={20}>
${conteudo(o.innerTop ?? 'Editor', '          ')}
        </ResizablePane>
${punho(o, o.innerAriaLabel ?? 'Redimensionar editor e console — use setas', '        ')}
        <ResizablePane defaultSize={40} minSize={20}>
${conteudo(o.innerBottom ?? 'Console', '          ', true)}
        </ResizablePane>
      </ResizablePaneGroup>
    </ResizablePane>
  </ResizablePaneGroup>`,
    ),
  );
}

/** Forma canônica: split lateral com divisor operável por arrasto e por setas. */
export function resizableSource(_gerado?: string, ctx?: { args?: Partial<ResizableArgs> }): string {
  const a = ctx?.args ?? {};
  return grupoSimples({
    direction: a.direction ?? 'horizontal',
    withHandle: a.withHandle ?? true,
    defaultSize: a.defaultSize ?? 30,
    minSize: a.minSize ?? 20,
    maxSize: 60,
    height: '260px',
  });
}

/* ─── Variantes ─────────────────────────────────────────────────────────── */

/** Variante Horizontal: o divisor de um grupo em linha é uma linha vertical. */
export function resizableHorizontalSource(): string {
  return grupoSimples({
    direction: 'horizontal',
    defaultSize: 30,
    ariaLabel: 'Redimensionar as colunas — use setas para ajustar',
  });
}

/** Variante Vertical: painéis empilhados repartem a ALTURA do invólucro. */
export function resizableVerticalSource(): string {
  return grupoSimples({
    direction: 'vertical',
    defaultSize: 40,
    labelA: 'Topo',
    labelB: 'Rodapé',
    ariaLabel: 'Redimensionar as faixas — use setas para ajustar',
    height: '300px',
  });
}

/** Variante Nested: um grupo dentro de um painel, no eixo oposto. */
export function resizableAninhadoSource(): string {
  return grupoAninhado({ direction: 'horizontal', defaultSize: 30 });
}

/** Variante WithHandle: o pegador que anuncia que ali existe um controle. */
export function resizableComPegadorSource(): string {
  return grupoSimples({
    withHandle: true,
    defaultSize: 50,
    labelA: 'Antes',
    labelB: 'Depois',
    ariaLabel: 'Redimensionar painéis — use setas',
  });
}

/* ─── Estados ───────────────────────────────────────────────────────────── */

/** Estado Dragging: o divisor arrastável, sem piso apertado. */
export function resizableArrastoSource(): string {
  return grupoSimples({
    withHandle: true,
    defaultSize: 50,
    minSize: 10,
    labelA: 'Painel A',
    labelB: 'Painel B',
    height: '220px',
  });
}

/** Estado Limits: piso e teto declarados param o painel antes do colapso. */
export function resizableLimitesSource(): string {
  return grupoSimples({
    defaultSize: 50,
    minSize: 30,
    maxSize: 60,
    labelA: 'Limitado',
    labelB: 'Livre',
    height: '220px',
  });
}

/** Estado Focus: mesma marcação; o anel é comportamento, não markup. */
export function resizableFocoSource(): string {
  return grupoSimples({
    withHandle: true,
    defaultSize: 50,
    labelA: 'Um',
    labelB: 'Dois',
    height: '220px',
  });
}

/** Estado Disabled: o divisor trava, mas continua anunciado e alcançável. */
export function resizableDesabilitadoSource(): string {
  return grupoSimples({
    withHandle: true,
    disabled: true,
    defaultSize: 50,
    labelA: 'Fixo',
    labelB: 'Fixo',
    height: '220px',
  });
}

/* ─── Composições ───────────────────────────────────────────────────────── */

/** Composição SidebarLayout: navegação ajustável ao lado do conteúdo. */
export function resizableSidebarSource(): string {
  return grupoSimples({
    withHandle: true,
    defaultSize: 30,
    labelA: 'Navegação',
    labelB: 'Conteúdo principal',
    ariaLabel: 'Redimensionar sidebar — use setas para ajustar',
    height: '280px',
  });
}

/** Composição EditorPreview: dois painéis de mesmo peso. */
export function resizableEditorPreviewSource(): string {
  return grupoSimples({
    withHandle: true,
    defaultSize: 50,
    labelA: 'Editor',
    labelB: 'Preview',
    ariaLabel: 'Redimensionar editor e preview — use setas',
    height: '320px',
  });
}

/** Composição VerticalSplit: lista e detalhe empilhados, 40/60 da altura. */
export function resizableDivisaoVerticalSource(): string {
  return grupoSimples({
    direction: 'vertical',
    withHandle: true,
    defaultSize: 40,
    labelA: 'Lista',
    labelB: 'Detalhe',
    ariaLabel: 'Redimensionar lista e detalhe — use setas',
    height: '360px',
  });
}

/** Composição IDELayout: arquivos à esquerda, editor sobre o console. */
export function resizableIdeSource(): string {
  return grupoAninhado({
    withHandle: true,
    defaultSize: 30,
    labelA: 'Arquivos',
    ariaLabel: 'Redimensionar arquivos e área principal — use setas',
    height: '380px',
  });
}
