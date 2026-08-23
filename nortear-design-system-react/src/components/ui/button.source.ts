/**
 * Transforms do painel Code do Button.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * Nenhum snippet daqui carrega altura: a altura do botão é RESULTADO do
 * `padding-block` com o `line-height`, e é isso que o faz crescer junto com a
 * fonte do navegador (WCAG 1.4.4). Cravar `height` congelaria o botão e cortaria
 * o texto a 200%.
 */
import {
  attrs,
  childText,
  indentar,
  jsxSnippet,
  propBool,
  propOption,
  type SourceTransform,
} from '@/lib/story-source';

export type ButtonArgs = {
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size: 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';
  disabled: boolean;
  children: string;
};

const VARIANTS = [
  'default',
  'destructive',
  'outline',
  'secondary',
  'ghost',
  'link',
] as const;

const SIZES = [
  'default',
  'xs',
  'sm',
  'lg',
  'icon',
  'icon-xs',
  'icon-sm',
  'icon-lg',
] as const;

const IMPORT = 'import { Button } from "@/components/ui/button";';

/**
 * Um botão com o conteúdo dentro. Conteúdo de uma linha fica na mesma linha;
 * ícone (que vem quebrado) desce para o bloco indentado, que é como se escreve
 * de verdade.
 */
function button(
  parts: Array<string | false | null | undefined>,
  content: string,
  header: string = IMPORT,
): string {
  const abertura = `<Button${attrs(...parts)}>`;
  // Bloco quando há mais de uma linha ou quando o filho é um elemento: ícone
  // espremido na mesma linha do botão é justamente o que some na rolagem.
  const inBlock = content.includes('\n') || content.startsWith('<');
  const body = inBlock
    ? `${abertura}\n${indentar(content)}\n</Button>`
    : `${abertura}${content}</Button>`;
  return jsxSnippet(header, body);
}

/** Ícone + rótulo importam do mesmo lugar; muda só qual peça do lucide entra. */
function withIcon(icone: string): string {
  return `${IMPORT}\nimport { ${icone} } from "lucide-react";`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls do
 * Playground e cai no uso canônico quando não há nenhum, que é o caso dos
 * arquivos de variantes, tamanhos e composições.
 *
 * `variant` e `size` só aparecem quando diferem do padrão, e `onClick` fica de
 * fora: o control dele é um espião, e espião interpolado despeja o corpo do mock
 * no painel como se fosse código do design system.
 */
export const buttonSource: SourceTransform<ButtonArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return button(
    [
      propOption('variant', args.variant, VARIANTS, 'default'),
      propOption('size', args.size, SIZES, 'default'),
      propBool('disabled', args.disabled),
    ],
    childText(args.children, 'Botão'),
  );
};

/* ------------------------------------------------------------------ variantes
 * O arquivo de variantes desliga os controls, então o `meta` não tem args de
 * onde ler a variante: cada story diz a sua. Sem isso o painel imprimiria o
 * mesmo `<Button>` seis vezes, e a variante — que É o assunto — sumiria.
 */

/** Ação principal da seção: o padrão, e por isso sem atributo nenhum. */
export function buttonDefaultSource(): string {
  return button([], 'Salvar');
}

/** Reservada ao irreversível: a cor é o aviso, o rótulo diz o que se perde. */
export function buttonDestructiveSource(): string {
  return button(['variant="destructive"'], 'Excluir conta');
}

/** Contorno: acompanha a primária num par de ações sem competir com ela. */
export function buttonOutlineSource(): string {
  return button(['variant="outline"'], 'Cancelar');
}

/** Preenchida em outra cor: ação complementar de ênfase menor. */
export function buttonSecundarioSource(): string {
  return button(['variant="secondary"'], 'Ver detalhes');
}

/** Sem moldura: para barras e menus, onde a borda de cada botão vira ruído. */
export function buttonGhostSource(): string {
  return button(['variant="ghost"'], 'Fechar');
}

/** Aparência de link para ação navegacional dentro de texto corrido. */
export function buttonLinkSource(): string {
  return button(['variant="link"'], 'Saiba mais');
}

/* ------------------------------------------------------------------- tamanhos
 * Mesmo motivo das variantes: controls desligados, e o tamanho é o assunto.
 * Nenhum destes snippets escreve altura — o que muda entre eles é o
 * `padding-block` que a classe aplica.
 */

/** Referência da escala: formulários e diálogos. */
export function buttonSizeDefaultSource(): string {
  return button([], 'Padrão');
}

/** Densidade máxima: chip de filtro, ação dentro de linha de tabela. */
export function buttonSizeXsSource(): string {
  return button(['size="xs"'], 'Mínimo');
}

/** Barras de ferramentas e áreas densas. */
export function buttonSizeSmSource(): string {
  return button(['size="sm"'], 'Pequeno');
}

/** Chamada de destaque no topo de uma página. */
export function buttonSizeLgSource(): string {
  return button(['size="lg"'], 'Grande');
}

/**
 * Os quatro tamanhos só de ícone repetem a mesma lição: sem texto dentro, quem
 * nomeia o botão é o `aria-label`, e o ícone sai da árvore de acessibilidade
 * para não ser lido no lugar dele.
 */
function iconButton(size: string): string {
  return button(
    [`size="${size}"`, 'aria-label="Adicionar item"'],
    '<Plus aria-hidden="true" />',
    withIcon('Plus'),
  );
}

/** Ícone no tamanho de referência. */
export function buttonIconSource(): string {
  return iconButton('icon');
}

/** Ícone em linha de tabela e listas densas. */
export function buttonIconXsSource(): string {
  return iconButton('icon-xs');
}

/** Ícone em barra de ferramentas compacta. */
export function buttonIconSmSource(): string {
  return iconButton('icon-sm');
}

/** Ícone como ação flutuante ou chamada visual. */
export function buttonIconLgSource(): string {
  return iconButton('icon-lg');
}

/* --------------------------------------------------------------------- estados
 * `FocusVisible` NÃO tem override: o anel de foco é regra de CSS em
 * `:focus-visible`, não marcação. Um snippet próprio teria de inventar um
 * atributo que ninguém escreve para obtê-lo.
 */

/**
 * Desabilitado é o atributo nativo, não uma classe: é ele que tira o botão da
 * ordem de tabulação e impede o clique. Uma classe só o pintaria de cinza.
 */
export function buttonDisabledSource(): string {
  return button(['disabled'], 'Salvar');
}

/**
 * Carregando é a soma de três coisas, e o `meta` só saberia a primeira: o botão
 * fica desabilitado, se anuncia ocupado por `aria-busy` e troca o rótulo por um
 * estado em progresso — quem depende de leitor de tela ouve a mudança do texto.
 * A animação usa `.nds-spin`, que tem guarda de `prefers-reduced-motion`.
 */
export function buttonLoadingSource(): string {
  return button(
    ['disabled', 'aria-busy="true"'],
    `<Loader2 aria-hidden="true" className="nds-button-icon-svg nds-spin" />
Salvando…`,
    withIcon('Loader2'),
  );
}

/**
 * Inválido se sinaliza por `aria-invalid`, que é o que o leitor de tela anuncia;
 * a borda de erro é consequência dele no CSS, e não uma variante à parte.
 */
export function buttonInvalidoSource(): string {
  return button(['variant="outline"', 'aria-invalid="true"'], 'Formulário inválido');
}

/* ----------------------------------------------------------------- composições
 * Todas trazem uma peça a mais que o `meta` não tem como sugerir: um ícone, um
 * par de botões, ou um elemento que nem é o componente.
 */

/** Ícone antes do rótulo: o gap é do botão, então o ícone não leva margem. */
export function buttonIconEsquerdaSource(): string {
  return button([], '<Plus aria-hidden="true" />\nAdicionar item', withIcon('Plus'));
}

/** Ícone depois do rótulo — a ordem é o que separa esta composição da anterior. */
export function buttonIconDireitaSource(): string {
  return button(
    ['variant="outline"'],
    'Próximo\n<ChevronRight aria-hidden="true" />',
    withIcon('ChevronRight'),
  );
}

/** Variante destrutiva com ícone: a cor avisa, o ícone reforça, o texto nomeia. */
export function buttonDestructiveWithIconSource(): string {
  return button(
    ['variant="destructive"'],
    '<Trash2 aria-hidden="true" />\nExcluir',
    withIcon('Trash2'),
  );
}

/** Sem texto dentro, o `aria-label` é obrigatório: é o único nome que sobra. */
export function buttonSomenteIconSource(): string {
  return button(
    ['size="icon"', 'aria-label="Baixar arquivo"'],
    '<Download aria-hidden="true" />',
    withIcon('Download'),
  );
}

/**
 * Par de ações: a primária fica à DIREITA em leitura da esquerda para a direita,
 * e o respiro entre os dois vem do contêiner, nunca de margem em cada botão.
 */
export function actionsButtonPairSource(): string {
  return jsxSnippet(
    IMPORT,
    `<div className="nds-cluster" data-spacing="sm">
  <Button variant="outline">Cancelar</Button>
  <Button>Confirmar</Button>
</div>`,
  );
}

/**
 * Link com aparência de botão é um `<a>` de verdade levando as classes da
 * variante — e não o componente Button disfarçado. Trocar o elemento por dentro
 * custaria a semântica de link: some o menu de contexto, some abrir em nova aba,
 * e o leitor de tela anuncia "botão" para algo que navega.
 */
export function buttonAsLinkSource(): string {
  return jsxSnippet(
    'import { buttonVariants } from "@/components/ui/button";',
    `<a href="/docs" className={buttonVariants({ variant: "link" })}>
  Ver documentação
</a>`,
  );
}
