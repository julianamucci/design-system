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
  filhoTexto,
  indentar,
  jsxSnippet,
  propBool,
  propOpcao,
  type SourceTransform,
} from '@/lib/story-source';

export type ButtonArgs = {
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size: 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';
  disabled: boolean;
  children: string;
};

const VARIANTES = [
  'default',
  'destructive',
  'outline',
  'secondary',
  'ghost',
  'link',
] as const;

const TAMANHOS = [
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
function botao(
  atributos: Array<string | false | null | undefined>,
  conteudo: string,
  cabecalho: string = IMPORT,
): string {
  const abertura = `<Button${attrs(...atributos)}>`;
  // Bloco quando há mais de uma linha ou quando o filho é um elemento: ícone
  // espremido na mesma linha do botão é justamente o que some na rolagem.
  const emBloco = conteudo.includes('\n') || conteudo.startsWith('<');
  const corpo = emBloco
    ? `${abertura}\n${indentar(conteudo)}\n</Button>`
    : `${abertura}${conteudo}</Button>`;
  return jsxSnippet(cabecalho, corpo);
}

/** Ícone + rótulo importam do mesmo lugar; muda só qual peça do lucide entra. */
function comIcone(icone: string): string {
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
  return botao(
    [
      propOpcao('variant', args.variant, VARIANTES, 'default'),
      propOpcao('size', args.size, TAMANHOS, 'default'),
      propBool('disabled', args.disabled),
    ],
    filhoTexto(args.children, 'Botão'),
  );
};

/* ------------------------------------------------------------------ variantes
 * O arquivo de variantes desliga os controls, então o `meta` não tem args de
 * onde ler a variante: cada story diz a sua. Sem isso o painel imprimiria o
 * mesmo `<Button>` seis vezes, e a variante — que É o assunto — sumiria.
 */

/** Ação principal da seção: o padrão, e por isso sem atributo nenhum. */
export function buttonDefaultSource(): string {
  return botao([], 'Salvar');
}

/** Reservada ao irreversível: a cor é o aviso, o rótulo diz o que se perde. */
export function buttonDestrutivoSource(): string {
  return botao(['variant="destructive"'], 'Excluir conta');
}

/** Contorno: acompanha a primária num par de ações sem competir com ela. */
export function buttonOutlineSource(): string {
  return botao(['variant="outline"'], 'Cancelar');
}

/** Preenchida em outra cor: ação complementar de ênfase menor. */
export function buttonSecundarioSource(): string {
  return botao(['variant="secondary"'], 'Ver detalhes');
}

/** Sem moldura: para barras e menus, onde a borda de cada botão vira ruído. */
export function buttonGhostSource(): string {
  return botao(['variant="ghost"'], 'Fechar');
}

/** Aparência de link para ação navegacional dentro de texto corrido. */
export function buttonLinkSource(): string {
  return botao(['variant="link"'], 'Saiba mais');
}

/* ------------------------------------------------------------------- tamanhos
 * Mesmo motivo das variantes: controls desligados, e o tamanho é o assunto.
 * Nenhum destes snippets escreve altura — o que muda entre eles é o
 * `padding-block` que a classe aplica.
 */

/** Referência da escala: formulários e diálogos. */
export function buttonTamanhoPadraoSource(): string {
  return botao([], 'Padrão');
}

/** Densidade máxima: chip de filtro, ação dentro de linha de tabela. */
export function buttonTamanhoXsSource(): string {
  return botao(['size="xs"'], 'Mínimo');
}

/** Barras de ferramentas e áreas densas. */
export function buttonTamanhoSmSource(): string {
  return botao(['size="sm"'], 'Pequeno');
}

/** Chamada de destaque no topo de uma página. */
export function buttonTamanhoLgSource(): string {
  return botao(['size="lg"'], 'Grande');
}

/**
 * Os quatro tamanhos só de ícone repetem a mesma lição: sem texto dentro, quem
 * nomeia o botão é o `aria-label`, e o ícone sai da árvore de acessibilidade
 * para não ser lido no lugar dele.
 */
function botaoDeIcone(tamanho: string): string {
  return botao(
    [`size="${tamanho}"`, 'aria-label="Adicionar item"'],
    '<Plus aria-hidden="true" />',
    comIcone('Plus'),
  );
}

/** Ícone no tamanho de referência. */
export function buttonIconeSource(): string {
  return botaoDeIcone('icon');
}

/** Ícone em linha de tabela e listas densas. */
export function buttonIconeXsSource(): string {
  return botaoDeIcone('icon-xs');
}

/** Ícone em barra de ferramentas compacta. */
export function buttonIconeSmSource(): string {
  return botaoDeIcone('icon-sm');
}

/** Ícone como ação flutuante ou chamada visual. */
export function buttonIconeLgSource(): string {
  return botaoDeIcone('icon-lg');
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
export function buttonDesabilitadoSource(): string {
  return botao(['disabled'], 'Salvar');
}

/**
 * Carregando é a soma de três coisas, e o `meta` só saberia a primeira: o botão
 * fica desabilitado, se anuncia ocupado por `aria-busy` e troca o rótulo por um
 * estado em progresso — quem depende de leitor de tela ouve a mudança do texto.
 * A animação usa `.nds-spin`, que tem guarda de `prefers-reduced-motion`.
 */
export function buttonCarregandoSource(): string {
  return botao(
    ['disabled', 'aria-busy="true"'],
    `<Loader2 aria-hidden="true" className="nds-button-icon-svg nds-spin" />
Salvando…`,
    comIcone('Loader2'),
  );
}

/**
 * Inválido se sinaliza por `aria-invalid`, que é o que o leitor de tela anuncia;
 * a borda de erro é consequência dele no CSS, e não uma variante à parte.
 */
export function buttonInvalidoSource(): string {
  return botao(['variant="outline"', 'aria-invalid="true"'], 'Formulário inválido');
}

/* ----------------------------------------------------------------- composições
 * Todas trazem uma peça a mais que o `meta` não tem como sugerir: um ícone, um
 * par de botões, ou um elemento que nem é o componente.
 */

/** Ícone antes do rótulo: o gap é do botão, então o ícone não leva margem. */
export function buttonIconeEsquerdaSource(): string {
  return botao([], '<Plus aria-hidden="true" />\nAdicionar item', comIcone('Plus'));
}

/** Ícone depois do rótulo — a ordem é o que separa esta composição da anterior. */
export function buttonIconeDireitaSource(): string {
  return botao(
    ['variant="outline"'],
    'Próximo\n<ChevronRight aria-hidden="true" />',
    comIcone('ChevronRight'),
  );
}

/** Variante destrutiva com ícone: a cor avisa, o ícone reforça, o texto nomeia. */
export function buttonDestrutivoComIconeSource(): string {
  return botao(
    ['variant="destructive"'],
    '<Trash2 aria-hidden="true" />\nExcluir',
    comIcone('Trash2'),
  );
}

/** Sem texto dentro, o `aria-label` é obrigatório: é o único nome que sobra. */
export function buttonSomenteIconeSource(): string {
  return botao(
    ['size="icon"', 'aria-label="Baixar arquivo"'],
    '<Download aria-hidden="true" />',
    comIcone('Download'),
  );
}

/**
 * Par de ações: a primária fica à DIREITA em leitura da esquerda para a direita,
 * e o respiro entre os dois vem do contêiner, nunca de margem em cada botão.
 */
export function buttonParDeAcoesSource(): string {
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
export function buttonComoLinkSource(): string {
  return jsxSnippet(
    'import { buttonVariants } from "@/components/ui/button";',
    `<a href="/docs" className={buttonVariants({ variant: "link" })}>
  Ver documentação
</a>`,
  );
}
