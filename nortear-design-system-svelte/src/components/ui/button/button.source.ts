/**
 * Transforms do painel Code do Button.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. O snippet importa do design system, com o nome
 * que `button/index.ts` exporta de verdade.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type ButtonArgs = {
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size: 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';
  disabled: boolean;
};

const IMPORT = `import { Button } from "@/components/ui/button";`;

/** Botão de texto: a forma que variantes, tamanhos e estados compartilham. */
function text(label: string, ...partes: Array<string | ''>): string {
  return svelteSnippet(IMPORT, `<Button${attrs(...partes)}>${label}</Button>`);
}

/**
 * Botão só de ícone. A classe do desenho é `nds-button-icon-svg`, e não a
 * genérica de ícone: é a única que acompanha o tamanho do botão pelos
 * modificadores. Sem o rótulo, a ação fica sem nome acessível.
 */
function soIcon(icone: string, modulo: string, size: string, label: string): string {
  return svelteSnippet(
    `${IMPORT}
import ${icone} from "@lucide/svelte/icons/${modulo}";`,
    `<Button size="${size}" aria-label="${label}">
  <${icone} class="nds-button-icon-svg" aria-hidden="true" />
</Button>`,
  );
}

/** Forma canônica: um botão de texto na variante e no tamanho padrão. */
export function buttonSource(_gerado?: string, ctx?: { args?: Partial<ButtonArgs> }): string {
  const { variant = 'default', size = 'default', disabled = false } = ctx?.args ?? {};

  return text(
    'Botão',
    variant !== 'default' ? `variant="${variant}"` : '',
    size !== 'default' ? `size="${size}"` : '',
    disabled ? 'disabled' : '',
  );
}

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
  return soIcon('Plus', 'plus', 'icon', 'Adicionar item');
}

/** Botão de ícone mínimo. */
export function buttonIconXsSource(): string {
  return soIcon('Plus', 'plus', 'icon-xs', 'Adicionar item');
}

/** Botão de ícone pequeno. */
export function buttonIconSmSource(): string {
  return soIcon('Plus', 'plus', 'icon-sm', 'Adicionar item');
}

/** Botão de ícone grande. */
export function buttonIconLgSource(): string {
  return soIcon('Plus', 'plus', 'icon-lg', 'Adicionar item');
}

/* ------------------------------------------------------------------ estados */

/** Estado desabilitado: sem clique e fora da ordem de tabulação. */
export function buttonDisabledSource(): string {
  return text('Salvar', 'disabled');
}

/**
 * Estado de carregamento: desabilitado, anunciado como ocupado e com o rótulo
 * trocado pelo progresso. O giro usa a classe do componente, que tem guarda de
 * movimento reduzido.
 */
export function buttonLoadingSource(): string {
  return svelteSnippet(
    `${IMPORT}
import Loader from "@lucide/svelte/icons/loader-circle";`,
    `<Button disabled aria-busy="true">
  <Loader class="nds-button-icon-svg nds-spin" aria-hidden="true" />
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
  return svelteSnippet(
    `${IMPORT}
import Plus from "@lucide/svelte/icons/plus";`,
    `<Button>
  <Plus class="nds-button-icon-svg" aria-hidden="true" />
  Adicionar item
</Button>`,
  );
}

/** Composição com ícone depois do rótulo: navegação progressiva. */
export function buttonWithIconFinalSource(): string {
  return svelteSnippet(
    `${IMPORT}
import ChevronRight from "@lucide/svelte/icons/chevron-right";`,
    `<Button variant="outline">
  Próximo
  <ChevronRight class="nds-button-icon-svg" aria-hidden="true" />
</Button>`,
  );
}

/** Composição de variante destrutiva com ícone. */
export function buttonDestructiveWithIconSource(): string {
  return svelteSnippet(
    `${IMPORT}
import Trash2 from "@lucide/svelte/icons/trash-2";`,
    `<Button variant="destructive">
  <Trash2 class="nds-button-icon-svg" aria-hidden="true" />
  Excluir
</Button>`,
  );
}

/** Composição só com ícone: o rótulo acessível é obrigatório. */
export function buttonSoIconSource(): string {
  return soIcon('Download', 'download', 'icon', 'Baixar arquivo');
}

/** Par de ações: a primária fica à direita, e o respiro vem do container. */
export function actionsButtonPairSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div class="nds-cluster" data-spacing="md">
  <Button variant="outline">Cancelar</Button>
  <Button>Confirmar</Button>
</div>`,
  );
}

/** Composição navegacional: com destino, o componente renderiza um link. */
export function buttonAsLinkSource(): string {
  return text('Ver documentação', 'variant="link"', 'href="#docs"');
}

/**
 * Link desabilitado: perde o destino para não navegar e sai da ordem de foco,
 * sem deixar de ser link para o leitor de tela.
 */
export function buttonLinkDisabledSource(): string {
  return text('Ver documentação', 'variant="link"', 'href="#docs"', 'disabled');
}

/**
 * Destino de protocolo não permitido: o componente descarta em vez de deixar
 * virar vetor de execução.
 */
export function buttonTargetInseguroSource(): string {
  return svelteSnippet(
    `${IMPORT}

// Fora da lista permitida (http, https, mailto, tel, âncora e caminho
// relativo). O componente descarta o valor e o elemento renderiza sem destino.
const destino = "javascript:alert(1)";`,
    `<Button variant="link" href={destino}>Ver documentação</Button>`,
  );
}

/**
 * Destino que a validação não consegue nem interpretar: também é descartado,
 * em vez de ir para o DOM na dúvida.
 */
export function buttonTargetMalformadoSource(): string {
  return svelteSnippet(
    `${IMPORT}

// URL malformada: o parser estoura, e na dúvida o valor não vira destino.
const destino = "http://[";`,
    `<Button variant="link" href={destino}>Ver documentação</Button>`,
  );
}
