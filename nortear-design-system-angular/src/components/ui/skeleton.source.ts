/**
 * Transforms do painel Code do Skeleton.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * Um construtor por story (ou por grupo de stories com o MESMO markup): antes
 * havia um só, do Playground, e as outras stories publicavam o template cru —
 * com a região montada à mão em `role="status"` + `aria-busy`.
 *
 * O que todo snippet ensina:
 *
 * - a forma vem por ATRIBUTO (`data-shape`, `data-width`, `data-size`) e nunca
 *   por medida cravada — guideline 12;
 * - o placeholder nunca aparece solto: vai DENTRO de `div[ndsSkeletonRegion]`,
 *   a peça que escreve papel, estado e nome. Nenhum snippet escreve `role` nem
 *   `aria-busy` à mão, e nenhum liga estado de carregamento — a região não
 *   alterna, ela SAI quando o conteúdo chega;
 * - `fill` não tem caixa própria: ele ocupa a do container, e o container que o
 *   design system oferece para isso é o `ndsAspectRatio`.
 */
export type SkeletonArgs = {
  shape: 'text' | 'heading' | 'avatar' | 'fill';
  width: 'full' | '3-4' | '2-3' | '1-2' | '1-3';
};

const SHAPES: readonly SkeletonArgs['shape'][] = ['text', 'heading', 'avatar', 'fill'];
const WIDTHS: readonly SkeletonArgs['width'][] = ['full', '3-4', '2-3', '1-2', '1-3'];

const IMPORT_SKELETON = "import { NdsSkeleton, NdsSkeletonRegion } from '@/components/ui/skeleton';";
const IMPORT_RATIO = "import { NdsAspectRatio } from '@/components/ui/aspect-ratio';";

function indent(block: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return block
    .split('\n')
    .map((line) => (line ? `${pad}${line}` : line))
    .join('\n');
}

/**
 * Uma peça. A largura só entra nas formas que a folha lê (`text`, `heading`):
 * no avatar o atributo não teria efeito, e a folha o ignora de propósito.
 */
function part(
  shape: SkeletonArgs['shape'],
  opts: { width?: SkeletonArgs['width']; size?: 'sm' | 'lg' } = {},
): string {
  const attrs = [
    `data-shape="${shape}"`,
    opts.width && (shape === 'text' || shape === 'heading') ? `data-width="${opts.width}"` : '',
    opts.size ? `data-size="${opts.size}"` : '',
  ].filter(Boolean);
  return `<div ndsSkeleton ${attrs.join(' ')}></div>`;
}

/** Linhas de texto nas frações pedidas, uma por linha. */
function lines(widths: SkeletonArgs['width'][]): string {
  return widths.map((width) => part('text', { width })).join('\n');
}

/**
 * A região, pela PEÇA. O que sobra para o snippet escrever é o nome e o layout
 * — a classe de composição e os atributos que ela lê.
 */
function region(
  label: string,
  content: string,
  layout: { className?: string; align?: string; spacing?: string } = {},
): string {
  const attrs = [
    'ndsSkeletonRegion',
    `label="${label}"`,
    layout.className ? `class="${layout.className}"` : '',
    layout.align ? `data-align="${layout.align}"` : '',
    layout.spacing ? `data-spacing="${layout.spacing}"` : '',
  ].filter(Boolean);
  return `<div ${attrs.join(' ')}>\n${indent(content, 2)}\n</div>`;
}

/** O placeholder de mídia dentro da proporção que dá a caixa. */
const RATIO_FILL = `<div ndsAspectRatio [ratio]="16 / 9">
  ${part('fill')}
</div>`;

function component(opts: {
  ratio?: boolean;
  template: string;
  body?: string[];
}): string {
  const imports = [IMPORT_SKELETON, opts.ratio ? IMPORT_RATIO : ''].filter(Boolean).join('\n');
  const names = ['NdsSkeleton', 'NdsSkeletonRegion', opts.ratio ? 'NdsAspectRatio' : '']
    .filter(Boolean)
    .join(', ');
  const classBody = opts.body?.length
    ? ` {\n${opts.body.map((line) => `  ${line}`).join('\n')}\n}`
    : ' {}';
  return `import { Component } from '@angular/core';
${imports}

@Component({
  imports: [${names}],
  template: \`
${indent(opts.template, 4)}
  \`,
})
export class Example${classBody}`;
}

/**
 * Playground: acompanha os controls. Valor que não é da lista (espião de ação,
 * arg ausente) cai no padrão em vez de ser interpolado.
 */
export function skeletonPlaygroundSource(
  _generated?: string,
  ctx: { args?: Partial<SkeletonArgs> } = {},
): string {
  const args = ctx.args ?? {};
  const shape = SHAPES.includes(args.shape as SkeletonArgs['shape']) ? args.shape! : 'text';
  const width = WIDTHS.includes(args.width as SkeletonArgs['width']) ? args.width! : '3-4';

  if (shape === 'fill') {
    return component({
      ratio: true,
      template: region('Carregando conteúdo', RATIO_FILL, { className: 'nds-w-sm' }),
    });
  }
  return component({
    template: region('Carregando conteúdo', part(shape, { width })),
  });
}

/** Rectangle: `fill` preenche a caixa que a proporção estabelece. */
export function skeletonRectangleSource(): string {
  return component({
    ratio: true,
    template: region('Carregando bloco', RATIO_FILL, { className: 'nds-w-sm' }),
  });
}

/** Circle: a medida vem da escada `--size-*`, sem largura. */
export function skeletonCircleSource(): string {
  return component({ template: region('Carregando avatar', part('avatar')) });
}

/** TextLine: altura da escada de texto, larguras decrescentes. */
export function skeletonTextLineSource(): string {
  return component({
    template: region('Carregando linhas de texto', lines(['full', '3-4', '1-2']), {
      className: 'nds-stack nds-w-sm',
      spacing: 'sm',
    }),
  });
}

/**
 * Pulsing e ReducedMotion: o MESMO markup. O pulso é da classe base e o
 * movimento reduzido é preferência do sistema, que a folha atende sozinha —
 * nenhuma das duas acrescenta nada ao que se escreve. Um segundo construtor
 * idêntico seria a cópia que envelhece sozinha.
 */
export function skeletonStatesSource(): string {
  return component({
    template: region('Carregando conteúdo', lines(['full', '3-4']), {
      className: 'nds-stack nds-w-sm',
      spacing: 'sm',
    }),
  });
}

/** ProfileCard: avatar ao lado de duas linhas desiguais. */
export function skeletonProfileCardSource(): string {
  // `nds-flex-1` não é enfeite: sem base de largura a pilha encolhe para o
  // conteúdo, as frações resolvem para zero e as linhas somem.
  return component({
    template: region(
      'Carregando card de perfil',
      `${part('avatar')}
<div class="nds-stack nds-flex-1" data-spacing="sm">
${indent(lines(['2-3', '1-2']), 2)}
</div>`,
      {
        className: 'nds-cluster nds-p-4 nds-border-default nds-rounded-md nds-w-sm',
        align: 'center',
        spacing: 'md',
      },
    ),
  });
}

/**
 * ListWithAvatar: UMA região para a lista inteira — uma por item repetiria o
 * aviso cinco vezes. A `<ul>` fica DENTRO da peça, sem estado nem nome, e leva
 * `role="list"` porque `list-style: none` tira a semântica de lista em alguns
 * leitores de tela.
 */
export function skeletonListWithAvatarSource(): string {
  return component({
    template: region(
      'Carregando lista de pedidos',
      `<ul role="list" class="nds-stack nds-list-none nds-p-0" data-spacing="md">
  @for (item of items; track item) {
    <li class="nds-cluster" data-align="center" data-spacing="sm">
      ${part('avatar', { size: 'sm' })}
      <div class="nds-stack nds-flex-1" data-spacing="xs">
${indent(lines(['2-3', '1-3']), 8)}
      </div>
    </li>
  }
</ul>`,
      { className: 'nds-w-md' },
    ),
    body: ['readonly items = [1, 2, 3, 4, 5];'],
  });
}

/** ImageInAspectRatio: quem define a caixa é o container de proporção. */
export function skeletonImageRatioSource(): string {
  return component({
    ratio: true,
    template: region('Carregando imagem', RATIO_FILL, { className: 'nds-w-sm' }),
  });
}

/** Paragraph: três linhas decrescentes. */
export function skeletonParagraphSource(): string {
  return component({
    template: region('Carregando parágrafo', lines(['full', '3-4', '1-2']), {
      className: 'nds-stack nds-w-sm',
      spacing: 'sm',
    }),
  });
}
