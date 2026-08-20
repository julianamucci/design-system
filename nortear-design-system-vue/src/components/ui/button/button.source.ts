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
function comIcone(...icones: string[]): string {
  return `${IMPORT}
import { ${icones.join(', ')} } from 'lucide-vue-next'`;
}

/** Botão de texto: a forma que variantes, tamanhos e estados compartilham. */
function texto(rotulo: string, ...partes: Array<string | ''>): string {
  return vueSnippet(IMPORT, `<Button${attrs(...partes)}>${rotulo}</Button>`);
}

/**
 * Botão só de ícone. O SVG entra como filho direto — é assim que ele pega o
 * tamanho pela cascata do componente, sem classe nenhuma. Sem o rótulo
 * acessível a ação fica sem nome, porque não sobrou texto para nomeá-la.
 */
function soIcone(icone: string, size: string, rotulo: string): string {
  return vueSnippet(
    comIcone(icone),
    `<Button size="${size}" aria-label="${rotulo}">
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
  return texto(
    'Botão',
    attr('variant', variant, 'default'),
    attr('size', size, 'default'),
    attrBool('disabled', disabled, false),
  );
};

/* ---------------------------------------------------------------- variantes */

/** Variante primária: a ação principal da seção. */
export function buttonPadraoSource(): string {
  return texto('Salvar');
}

/** Variante destrutiva: ação irreversível. */
export function buttonDestrutivoSource(): string {
  return texto('Excluir conta', 'variant="destructive"');
}

/** Variante com borda: acompanha a primária em pares de ação. */
export function buttonOutlineSource(): string {
  return texto('Cancelar', 'variant="outline"');
}

/** Variante sólida de menor ênfase. */
export function buttonSecundarioSource(): string {
  return texto('Ver detalhes', 'variant="secondary"');
}

/** Variante sem fundo nem borda: barras de ferramentas e menus. */
export function buttonGhostSource(): string {
  return texto('Fechar', 'variant="ghost"');
}

/** Variante com aparência de link, para ação em contexto textual. */
export function buttonLinkSource(): string {
  return texto('Saiba mais', 'variant="link"');
}

/* ----------------------------------------------------------------- tamanhos */

/** Tamanho padrão: nenhuma prop de tamanho é preciso escrever. */
export function buttonTamanhoPadraoSource(): string {
  return texto('Padrão');
}

/** Tamanho mínimo: linha de tabela e chips de filtro. */
export function buttonTamanhoXsSource(): string {
  return texto('Mínimo', 'size="xs"');
}

/** Tamanho pequeno: barras de ferramentas e áreas densas. */
export function buttonTamanhoSmSource(): string {
  return texto('Pequeno', 'size="sm"');
}

/** Tamanho grande: chamadas de ação em destaque. */
export function buttonTamanhoLgSource(): string {
  return texto('Grande', 'size="lg"');
}

/** Botão de ícone no tamanho padrão. */
export function buttonIconeSource(): string {
  return soIcone('Plus', 'icon', 'Adicionar item');
}

/** Botão de ícone mínimo. */
export function buttonIconeXsSource(): string {
  return soIcone('Plus', 'icon-xs', 'Adicionar item');
}

/** Botão de ícone pequeno. */
export function buttonIconeSmSource(): string {
  return soIcone('Plus', 'icon-sm', 'Adicionar item');
}

/** Botão de ícone grande. */
export function buttonIconeLgSource(): string {
  return soIcone('Plus', 'icon-lg', 'Adicionar item');
}

/* ------------------------------------------------------------------ estados */

/** Estado desabilitado: sem clique e fora da ordem de tabulação. */
export function buttonDesabilitadoSource(): string {
  return texto('Salvar', 'disabled');
}

/**
 * Estado de carregamento: desabilitado, anunciado como ocupado e com o rótulo
 * trocado pelo progresso. O giro usa a classe do design system, que tem guarda
 * de movimento reduzido.
 */
export function buttonCarregandoSource(): string {
  return vueSnippet(
    comIcone('Loader2'),
    `<Button disabled aria-busy="true">
  <Loader2 aria-hidden="true" class="nds-button-icon-svg nds-spin" />
  Salvando…
</Button>`,
  );
}

/** Estado de foco por teclado: o anel é do componente, sem prop nenhuma. */
export function buttonFocoVisivelSource(): string {
  return texto('Foco visível');
}

/** Estado inválido: a sinalização de validação vai no atributo, não na cor. */
export function buttonInvalidoSource(): string {
  return texto('Formulário inválido', 'variant="outline"', 'aria-invalid="true"');
}

/* -------------------------------------------------------------- composições */

/** Composição com ícone antes do rótulo. */
export function buttonComIconeInicialSource(): string {
  return vueSnippet(
    comIcone('Plus'),
    `<Button>
  <Plus aria-hidden="true" />
  Adicionar item
</Button>`,
  );
}

/** Composição com ícone depois do rótulo: navegação progressiva. */
export function buttonComIconeFinalSource(): string {
  return vueSnippet(
    comIcone('ChevronRight'),
    `<Button variant="outline">
  Próximo
  <ChevronRight aria-hidden="true" />
</Button>`,
  );
}

/** Composição de variante destrutiva com ícone. */
export function buttonDestrutivoComIconeSource(): string {
  return vueSnippet(
    comIcone('Trash2'),
    `<Button variant="destructive">
  <Trash2 aria-hidden="true" />
  Excluir
</Button>`,
  );
}

/** Composição só com ícone: o rótulo acessível é obrigatório. */
export function buttonSoIconeSource(): string {
  return soIcone('Download', 'icon', 'Baixar arquivo');
}

/** Par de ações: a primária fica à direita, e o respiro vem do container. */
export function buttonParDeAcoesSource(): string {
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
export function buttonComoLinkSource(): string {
  return vueSnippet(
    IMPORT,
    `<Button as-child variant="link">
  <a href="#docs">Ver documentação</a>
</Button>`,
  );
}
