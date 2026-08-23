/**
 * Transforms do painel Code do Button.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. O snippet importa do design system, com o nome que
 * `button/index.ts` exporta de verdade.
 */
import { attr, attrBool, attrs, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type ButtonArgs = {
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size: 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';
  disabled: boolean;
};

const IMPORT = `import { Button } from '@/components/ui/button'`;

/** Import do componente mais um ícone da biblioteca de ícones da stack. */
function withIcon(...icons: string[]): string {
  return `${IMPORT}
import { ${icons.join(', ')} } from 'lucide-vue-next'`;
}

/** Botão de texto: a forma que variantes, tamanhos e estados compartilham. */
function text(label: string, ...partes: Array<string | ''>): string {
  return vueSnippet(IMPORT, `<Button${attrs(...partes)}>${label}</Button>`);
}

/**
 * Botão só de ícone. O SVG entra como filho direto — é assim que ele pega o
 * tamanho pela cascata do componente, sem classe nenhuma. Sem o rótulo
 * acessível a ação fica sem nome, porque não sobrou texto para nomeá-la.
 */
function soIcon(icone: string, size: string, label: string): string {
  return vueSnippet(
    withIcon(icone),
    `<Button size="${size}" aria-label="${label}">
  <${icone} aria-hidden="true" />
</Button>`,
  );
}

/**
 * Forma canônica: um botão de texto na variante e no tamanho padrão.
 *
 * Os três controls passam por `attr`/`attrBool`, que descartam o valor padrão e
 * o que não é do tipo esperado — o `onClick` do Playground chega como espião, e
 * interpolado apareceria como o corpo do mock no lugar do exemplo.
 */
export const buttonSource: SourceTransform<ButtonArgs> = (_gerado, ctx) => {
  const { variant, size, disabled } = ctx?.args ?? {};
  return text(
    'Botão',
    attr('variant', variant, 'default'),
    attr('size', size, 'default'),
    attrBool('disabled', disabled, false),
  );
};

/* ---------------------------------------------------------------- variantes */

/** Variante primária: a ação principal da seção. */
export function buttonDefaultSource(): string {
  return text('Salvar');
}

/** Variante destrutiva: ação irreversível. */
export function buttonDestructiveSource(): string {
  return text('Excluir conta', 'variant="destructive"');
}

/** Variante com borda: acompanha a primária em pares de ação. */
export function buttonOutlineSource(): string {
  return text('Cancelar', 'variant="outline"');
}

/** Variante sólida de menor ênfase. */
export function buttonSecundarioSource(): string {
  return text('Ver detalhes', 'variant="secondary"');
}

/** Variante sem fundo nem borda: barras de ferramentas e menus. */
export function buttonGhostSource(): string {
  return text('Fechar', 'variant="ghost"');
}

/** Variante com aparência de link, para ação em contexto textual. */
export function buttonLinkSource(): string {
  return text('Saiba mais', 'variant="link"');
}

/* ----------------------------------------------------------------- tamanhos */

/** Tamanho padrão: nenhuma prop de tamanho é preciso escrever. */
export function buttonSizeDefaultSource(): string {
  return text('Padrão');
}

/** Tamanho mínimo: linha de tabela e chips de filtro. */
export function buttonSizeXsSource(): string {
  return text('Mínimo', 'size="xs"');
}

/** Tamanho pequeno: barras de ferramentas e áreas densas. */
export function buttonSizeSmSource(): string {
  return text('Pequeno', 'size="sm"');
}

/** Tamanho grande: chamadas de ação em destaque. */
export function buttonSizeLgSource(): string {
  return text('Grande', 'size="lg"');
}

/** Botão de ícone no tamanho padrão. */
export function buttonIconSource(): string {
  return soIcon('Plus', 'icon', 'Adicionar item');
}

/** Botão de ícone mínimo. */
export function buttonIconXsSource(): string {
  return soIcon('Plus', 'icon-xs', 'Adicionar item');
}

/** Botão de ícone pequeno. */
export function buttonIconSmSource(): string {
  return soIcon('Plus', 'icon-sm', 'Adicionar item');
}

/** Botão de ícone grande. */
export function buttonIconLgSource(): string {
  return soIcon('Plus', 'icon-lg', 'Adicionar item');
}

/* ------------------------------------------------------------------ estados */

/** Estado desabilitado: sem clique e fora da ordem de tabulação. */
export function buttonDisabledSource(): string {
  return text('Salvar', 'disabled');
}

/**
 * Estado de carregamento: desabilitado, anunciado como ocupado e com o rótulo
 * trocado pelo progresso. O giro usa a classe do design system, que tem guarda
 * de movimento reduzido.
 */
export function buttonLoadingSource(): string {
  return vueSnippet(
    withIcon('Loader2'),
    `<Button disabled aria-busy="true">
  <Loader2 aria-hidden="true" class="nds-button-icon-svg nds-spin" />
  Salvando…
</Button>`,
  );
}

/** Estado de foco por teclado: o anel é do componente, sem prop nenhuma. */
export function buttonFocusVisibleSource(): string {
  return text('Foco visível');
}

/** Estado inválido: a sinalização de validação vai no atributo, não na cor. */
export function buttonInvalidoSource(): string {
  return text('Formulário inválido', 'variant="outline"', 'aria-invalid="true"');
}

/* -------------------------------------------------------------- composições */

/** Composição com ícone antes do rótulo. */
export function buttonWithIconInitialSource(): string {
  return vueSnippet(
    withIcon('Plus'),
    `<Button>
  <Plus aria-hidden="true" />
  Adicionar item
</Button>`,
  );
}

/** Composição com ícone depois do rótulo: navegação progressiva. */
export function buttonWithIconFinalSource(): string {
  return vueSnippet(
    withIcon('ChevronRight'),
    `<Button variant="outline">
  Próximo
  <ChevronRight aria-hidden="true" />
</Button>`,
  );
}

/** Composição de variante destrutiva com ícone. */
export function buttonDestructiveWithIconSource(): string {
  return vueSnippet(
    withIcon('Trash2'),
    `<Button variant="destructive">
  <Trash2 aria-hidden="true" />
  Excluir
</Button>`,
  );
}

/** Composição só com ícone: o rótulo acessível é obrigatório. */
export function buttonSoIconSource(): string {
  return soIcon('Download', 'icon', 'Baixar arquivo');
}

/** Par de ações: a primária fica à direita, e o respiro vem do container. */
export function actionsButtonPairSource(): string {
  return vueSnippet(
    IMPORT,
    `<div class="nds-cluster" data-spacing="sm">
  <Button variant="outline">Cancelar</Button>
  <Button>Confirmar</Button>
</div>`,
  );
}

/**
 * Composição navegacional: com `as-child` o `<a>` do consumidor recebe os
 * estilos do botão e continua sendo link — o papel é dele, não do componente.
 */
export function buttonAsLinkSource(): string {
  return vueSnippet(
    IMPORT,
    `<Button as-child variant="link">
  <a href="#docs">Ver documentação</a>
</Button>`,
  );
}
