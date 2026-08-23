/**
 * Transforms do painel Code do Skeleton.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * O componente não tem prop de variação: a caixa vem de `data-shape` e a
 * largura de `data-width`, e a folha compartilhada continua dona das medidas.
 * O snippet existe em boa parte para mostrar isso — e para mostrar que o
 * placeholder nunca aparece sozinho, e sim dentro da região que anuncia o
 * carregamento.
 */
import { attrsMultilinha, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type SkeletonArgs = {
  shape: 'text' | 'heading' | 'avatar' | 'fill';
  width: 'full' | '3-4' | '2-3' | '1-2' | '1-3';
  loading: boolean;
};

const IMPORT = `import { Skeleton } from '@/components/ui/skeleton'`;

/** Formas que respondem a `data-width`; nas outras o atributo não faz nada. */
const HAS_WIDTH = new Set(['text', 'heading']);

/**
 * A região que anuncia o carregamento.
 *
 * `aria-busy` sozinho numa `div` sem papel não é anunciado, e `aria-label` numa
 * `div` sem papel é violação de ARIA — é o par papel + nome que faz o leitor de
 * tela dizer "carregando". O placeholder dentro fica `aria-hidden` de fábrica.
 */
function regiao(options: {
  label: string;
  ocupado?: boolean;
  className?: string;
  espaco?: string;
  miolo: string;
  tag?: string;
  papel?: string;
}): string {
  const tag = options.tag ?? 'div';
  const papel = options.papel ?? 'status';
  const abertura = attrsMultilinha([
    `role="${papel}"`,
    `aria-busy="${options.ocupado === false ? 'false' : 'true'}"`,
    `aria-label="${options.label}"`,
    options.className && `class="${options.className}"`,
    options.espaco && `data-spacing="${options.espaco}"`,
  ]);
  return `<${tag}${abertura}>\n${indentar(options.miolo)}\n</${tag}>`;
}

/** Uma peça: a forma sempre aparece, a largura só onde a folha a lê. */
function part(shape: string, width?: string, className?: string): string {
  const partes = [
    `data-shape="${shape}"`,
    width && HAS_WIDTH.has(shape) ? `data-width="${width}"` : '',
    className ? `class="${className}"` : '',
  ].filter(Boolean);
  return `<Skeleton ${partes.join(' ')} />`;
}

/** Duas ou três linhas de larguras decrescentes — o desenho de um parágrafo. */
function lines(larguras: string[]): string {
  return larguras.map((width) => part('text', width)).join('\n');
}

/**
 * Forma canônica: uma peça dentro da região que a anuncia.
 *
 * `data-shape` é sempre escrito, mesmo quando bate com o padrão do control: é
 * ele que desenha a caixa, e sem ele a folha não tem o que aplicar — o
 * placeholder nasceria com altura zero. `data-width` só entra nas formas de
 * texto, que são as únicas que a folha lê.
 */
export const skeletonPlaygroundSource: SourceTransform<SkeletonArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const shape = typeof args.shape === 'string' ? args.shape : 'text';
  const width = typeof args.width === 'string' ? args.width : '3-4';
  // `fill` não traz caixa própria: ele preenche a que o container estabelece, e
  // sem container com medida o bloco nasce com altura zero.
  const miolo =
    shape === 'fill' ? part('fill', undefined, 'nds-docs-skeleton-media') : part(shape, width);
  return vueSnippet(
    IMPORT,
    regiao({
      label: 'Carregando conteúdo',
      ocupado: args.loading !== false,
      miolo,
    }),
  );
};

/** Bloco de mídia: quem dá a caixa é o container, na proporção que ele definir. */
export function skeletonRetanguloSource(): string {
  return vueSnippet(
    IMPORT,
    regiao({
      label: 'Carregando bloco',
      className: 'nds-w-sm',
      miolo: part('fill', undefined, 'nds-docs-skeleton-media'),
    }),
  );
}

/**
 * Avatar: a exceção prevista na guideline 12 — peça sem fluxo de texto tem
 * medida, e ela vem da escada `--size-*`, não de um número escrito à mão.
 */
export function skeletonCirculoSource(): string {
  return vueSnippet(
    IMPORT,
    regiao({ label: 'Carregando avatar', miolo: part('avatar') }),
  );
}

/**
 * Linhas de texto: a altura sai da escada de tipografia e a largura é uma
 * fração do container. Variar a fração entre as linhas é o que faz o bloco
 * parecer parágrafo em vez de tabela.
 */
export function skeletonLineTextSource(): string {
  return vueSnippet(
    IMPORT,
    regiao({
      label: 'Carregando linhas de texto',
      className: 'nds-stack nds-w-sm',
      espaco: 'sm',
      miolo: lines(['full', '3-4', '1-2']),
    }),
  );
}

/** Estado padrão: o pulso é da classe base, não de prop nem de atributo. */
export function skeletonPulsandoSource(): string {
  return vueSnippet(
    IMPORT,
    regiao({
      label: 'Carregando conteúdo',
      className: 'nds-stack nds-w-sm',
      espaco: 'sm',
      miolo: lines(['full', '3-4']),
    }),
  );
}

/**
 * Movimento reduzido: não há nada a escrever.
 *
 * A preferência é do sistema operacional, e quem responde a ela é a folha
 * compartilhada. O que some é a animação — o placeholder continua visível, que
 * é justamente o ponto: desligar o pulso não pode apagar o carregamento.
 */
export function skeletonMovimentoReduzidoSource(): string {
  return vueSnippet(
    IMPORT,
    regiao({
      label: 'Carregando conteúdo',
      className: 'nds-stack nds-w-sm',
      espaco: 'sm',
      miolo: part('text', '3-4'),
    }),
  );
}

/** Card de perfil: o avatar ao lado de duas linhas de larguras diferentes. */
export function skeletonCardPerfilSource(): string {
  return vueSnippet(
    IMPORT,
    regiao({
      label: 'Carregando card de perfil',
      className: 'nds-cluster nds-p-4 nds-border-default nds-rounded-md nds-w-sm',
      espaco: 'md',
      miolo: `${part('avatar')}
<div class="nds-stack nds-flex-1" data-spacing="sm">
${indentar(lines(['2-3', '1-2']))}
</div>`,
    }),
  );
}

/**
 * Lista: a região ocupada é a própria `ul`, e não uma `div` em volta — assim o
 * leitor de tela recebe a contagem de itens junto com o estado de carregando.
 */
export function skeletonListSource(): string {
  return vueSnippet(
    IMPORT,
    regiao({
      tag: 'ul',
      papel: 'list',
      label: 'Carregando lista de pedidos',
      className: 'nds-stack nds-list-none nds-p-0 nds-w-md',
      espaco: 'md',
      miolo: `<li v-for="i in 5" :key="i" class="nds-cluster" data-align="center" data-spacing="sm">
  <Skeleton data-shape="avatar" data-size="sm" />
  <div class="nds-stack nds-flex-1" data-spacing="xs">
${indentar(lines(['2-3', '1-3']), 4)}
  </div>
</li>`,
    }),
  );
}

/**
 * Imagem em proporção: `fill` não tem caixa própria — ele ocupa a do container.
 * Aqui o container é o `AspectRatio`, que é a forma do design system de reservar
 * o lugar da mídia sem cravar altura.
 */
export function skeletonImageRatioSource(): string {
  return vueSnippet(
    `${IMPORT}\nimport { AspectRatio } from '@/components/ui/aspect-ratio'`,
    regiao({
      label: 'Carregando imagem',
      className: 'nds-w-sm',
      miolo: `<AspectRatio :ratio="16 / 9">
  ${part('fill')}
</AspectRatio>`,
    }),
  );
}

/** Parágrafo: três linhas decrescentes, o desenho mais reconhecível do bloco. */
export function skeletonParagrafoSource(): string {
  return vueSnippet(
    IMPORT,
    regiao({
      label: 'Carregando parágrafo',
      className: 'nds-stack nds-w-sm',
      espaco: 'sm',
      miolo: lines(['full', '3-4', '1-2']),
    }),
  );
}
