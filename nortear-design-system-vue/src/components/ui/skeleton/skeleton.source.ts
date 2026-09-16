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
 * placeholder nunca aparece sozinho, e sim dentro da PEÇA de região que anuncia
 * o carregamento. Papel e estado nunca são escritos à mão: vêm da peça.
 */
import { attrsMultilinha, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type SkeletonArgs = {
  shape: 'text' | 'heading' | 'avatar' | 'fill';
  width: 'full' | '3-4' | '2-3' | '1-2' | '1-3';
};

const IMPORT = `import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton'`;

/** Formas que respondem a `data-width`; nas outras o atributo não faz nada. */
const HAS_WIDTH = new Set(['text', 'heading']);

/**
 * A peça de região: `role="status"`, `aria-busy="true"` e o nome acessível vêm
 * dela. O que o snippet escreve é só o nome e o LAYOUT do bloco.
 */
function region(options: {
  label: string;
  className?: string;
  spacing?: string;
  align?: string;
  body: string;
}): string {
  const opening = attrsMultilinha([
    `label="${options.label}"`,
    options.className && `class="${options.className}"`,
    options.spacing && `data-spacing="${options.spacing}"`,
    options.align && `data-align="${options.align}"`,
  ]);
  return `<SkeletonRegion${opening}>\n${indentar(options.body)}\n</SkeletonRegion>`;
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
  // sem container com medida o bloco nasce com altura zero. Quem dá a caixa no
  // snippet é o `AspectRatio` — a classe de mídia da docs page não é API.
  if (shape === 'fill') return ratioBlock('Carregando conteúdo');
  return vueSnippet(IMPORT, region({ label: 'Carregando conteúdo', body: part(shape, width) }));
};

/**
 * Placeholder de mídia dentro de uma proporção — a forma de ensinar `fill`.
 *
 * Função interna com o nome como parâmetro: as exportadas são usadas direto como
 * transform, e o primeiro argumento que recebem é o código gerado.
 */
function ratioBlock(label: string): string {
  return vueSnippet(
    `${IMPORT}\nimport { AspectRatio } from '@/components/ui/aspect-ratio'`,
    region({
      label,
      className: 'nds-w-sm',
      body: `<AspectRatio :ratio="16 / 9">
  ${part('fill')}
</AspectRatio>`,
    }),
  );
}

/** Bloco de mídia: quem dá a caixa é o container, na proporção que ele definir. */
export function skeletonRectangleSource(): string {
  return ratioBlock('Carregando bloco');
}

/**
 * Avatar: a exceção prevista na guideline 12 — peça sem fluxo de texto tem
 * medida, e ela vem da escada `--size-*`, não de um número escrito à mão.
 */
export function skeletonCircleSource(): string {
  return vueSnippet(IMPORT, region({ label: 'Carregando avatar', body: part('avatar') }));
}

/**
 * Linhas de texto: a altura sai da escada de tipografia e a largura é uma
 * fração do container. Variar a fração entre as linhas é o que faz o bloco
 * parecer parágrafo em vez de tabela.
 */
export function skeletonLineTextSource(): string {
  return vueSnippet(
    IMPORT,
    region({
      label: 'Carregando linhas de texto',
      className: 'nds-stack nds-w-sm',
      spacing: 'sm',
      body: lines(['full', '3-4', '1-2']),
    }),
  );
}

/** Estado padrão: o pulso é da classe base, não de prop nem de atributo. */
export function skeletonPulsingSource(): string {
  return vueSnippet(
    IMPORT,
    region({
      label: 'Carregando conteúdo',
      className: 'nds-stack nds-w-sm',
      spacing: 'sm',
      body: lines(['full', '3-4']),
    }),
  );
}

/**
 * Movimento reduzido: não há nada a escrever.
 *
 * A preferência é do sistema operacional, e quem responde a ela é a folha
 * compartilhada. O que some é a animação — o placeholder continua visível, que
 * é justamente o ponto: desligar o pulso não pode apagar o carregamento. O
 * markup é o MESMO do pulso: o que muda entre as duas stories é a preferência.
 */
export function skeletonReducedMotionSource(): string {
  return vueSnippet(
    IMPORT,
    region({
      label: 'Carregando conteúdo',
      className: 'nds-stack nds-w-sm',
      spacing: 'sm',
      body: lines(['full', '3-4']),
    }),
  );
}

/** Card de perfil: o avatar ao lado de duas linhas de larguras diferentes. */
export function skeletonProfileCardSource(): string {
  return vueSnippet(
    IMPORT,
    region({
      label: 'Carregando card de perfil',
      className: 'nds-cluster nds-p-4 nds-border-default nds-rounded-md nds-w-sm',
      spacing: 'md',
      align: 'center',
      body: `${part('avatar')}
<div class="nds-stack nds-flex-1" data-spacing="sm">
${indentar(lines(['2-3', '1-2']))}
</div>`,
    }),
  );
}

/**
 * Lista: a `ul` fica DENTRO da peça. A região anuncia a espera; a lista mantém
 * o papel de lista (e a contagem de itens) sem carregar estado nem nome.
 */
export function skeletonListSource(): string {
  return vueSnippet(
    IMPORT,
    region({
      label: 'Carregando lista de pedidos',
      className: 'nds-w-md',
      body: `<ul role="list" class="nds-stack nds-list-none nds-p-0" data-spacing="md">
  <li v-for="i in 5" :key="i" class="nds-cluster" data-align="center" data-spacing="sm">
    <Skeleton data-shape="avatar" data-size="sm" />
    <div class="nds-stack nds-flex-1" data-spacing="xs">
${indentar(lines(['2-3', '1-3']), 6)}
    </div>
  </li>
</ul>`,
    }),
  );
}

/**
 * Imagem em proporção: `fill` não tem caixa própria — ele ocupa a do container.
 * Aqui o container é o `AspectRatio`, que é a forma do design system de reservar
 * o lugar da mídia sem cravar altura.
 */
export function skeletonImageRatioSource(): string {
  return ratioBlock('Carregando imagem');
}

/** Parágrafo: três linhas decrescentes, o desenho mais reconhecível do bloco. */
export function skeletonParagraphSource(): string {
  return vueSnippet(
    IMPORT,
    region({
      label: 'Carregando parágrafo',
      className: 'nds-stack nds-w-sm',
      spacing: 'sm',
      body: lines(['full', '3-4', '1-2']),
    }),
  );
}
