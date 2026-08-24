/**
 * Transforms do painel Code do Card.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. O snippet importa do design system, com os nomes
 * que `card/index.ts` exporta de verdade.
 */
import { attr, attrs, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type CardArgs = {
  size: 'default' | 'sm';
};

/** Import do card com só as partes que o exemplo usa, em ordem alfabética. */
function importCard(...partes: string[]): string {
  const names = ['Card', ...partes].sort();
  return `import {\n${names.map((name) => `  ${name},`).join('\n')}\n} from '@/components/ui/card'`;
}

const IMPORT_BUTTON = `import { Button } from '@/components/ui/button'`;

/**
 * O card não tem largura própria: ele preenche o que o contexto der. Numa story
 * isolada isso significa a página inteira, então a moldura entra pela classe.
 */
const WIDTH_SM = 'class="nds-w-sm"';
const WIDTH_XS = 'class="nds-w-xs"';

/** Raiz do card com os filhos já indentados. */
function card(partes: Array<string | ''>, ...children: string[]): string {
  const body = children
    .filter(Boolean)
    .map((child) => indentar(child, 2))
    .join('\n');
  return `<Card${attrs(...partes)}>\n${body}\n</Card>`;
}

/**
 * Cabeçalho: título, descrição e — quando há — a ação, nessa ordem no DOM. É a
 * ordem lógica de leitura; a posição da ação à direita vem da grade do
 * cabeçalho, não de uma classe no elemento.
 *
 * `as="h3"` porque o título nasce `div`: o CSS dá a aparência de título, e quem
 * dá a semântica é o elemento.
 */
function header(title: string, descricao: string, acao = ''): string {
  const body = [
    `  <CardTitle as="h3">${title}</CardTitle>`,
    `  <CardDescription>${descricao}</CardDescription>`,
    acao ? `  <CardAction>\n${indentar(acao, 4)}\n  </CardAction>` : '',
  ].filter(Boolean);
  return `<CardHeader>\n${body.join('\n')}\n</CardHeader>`;
}

const PRODUCT = 'Cadeira Gamer Pro';
const DESCRIPTION_PRODUCT = 'Estrutura ergonômica com ajuste de altura e apoio lombar.';

const PRECO = `<CardContent>
  <p class="nds-text-h4">R$ 1.299,00</p>
</CardContent>`;

/**
 * Rodapé de ações. Cada rótulo acessível diz sobre QUAL item ele age: numa
 * lista de cards, "Excluir" sozinho vira uma fileira de botões idênticos para
 * quem navega por leitor de tela.
 */
function footer(...buttons: string[]): string {
  // O piso do cluster cai para `sm` (8px) só quando TODOS os botões são
  // compactos — `size="sm"` ou da família de ícone. Misturando tamanhos, quem
  // manda é o alvo maior, e o piso volta a `md` (16px). Ver a regra do Button
  // em guidelines/06-form-components.md.
  const compacto = buttons.every((b) => /size="(?:sm|icon(?:-[a-z]+)?)"/.test(b));
  return `<CardFooter class="nds-cluster" data-justify="end" data-spacing="${compacto ? 'sm' : 'md'}">
${buttons.map((button) => `  ${button}`).join('\n')}
</CardFooter>`;
}

/**
 * Forma canônica, e a base dos arquivos de tamanhos e de estados: cabeçalho com
 * título e descrição, corpo com o dado em destaque e rodapé com as ações.
 */
export const cardSource: SourceTransform<CardArgs> = (_gerado, ctx) => {
  return vueSnippet(
    `${importCard('CardContent', 'CardDescription', 'CardFooter', 'CardHeader', 'CardTitle')}
${IMPORT_BUTTON}`,
    card(
      [attr('size', ctx?.args?.size, 'default'), WIDTH_SM],
      header(PRODUCT, DESCRIPTION_PRODUCT),
      PRECO,
      footer(
        `<Button variant="outline" aria-label="Editar produto ${PRODUCT}">Editar</Button>`,
        `<Button variant="destructive" aria-label="Excluir produto ${PRODUCT}">Excluir</Button>`,
      ),
    ),
  );
};

/**
 * A unidade mínima: cabeçalho e corpo. O card é container passivo — não recebe
 * foco, não tem papel ARIA e não carrega handler próprio.
 */
export function cardSimpleSource(): string {
  return vueSnippet(
    importCard('CardContent', 'CardDescription', 'CardHeader', 'CardTitle'),
    card([WIDTH_SM], header(PRODUCT, DESCRIPTION_PRODUCT), PRECO),
  );
}

/**
 * Tamanho compacto: o `size` propaga por atributo de dado às partes internas,
 * que ajustam o próprio respiro e o tamanho do título. Não há prop a repetir em
 * cada peça.
 */
export function cardCompactoSource(): string {
  return vueSnippet(
    importCard('CardContent', 'CardDescription', 'CardHeader', 'CardTitle'),
    card(
      ['size="sm"', WIDTH_XS],
      header('Assinantes ativos', '+12% no mês'),
      `<CardContent>
  <p class="nds-text-h4 nds-tabular-nums">8.742</p>
</CardContent>`,
    ),
  );
}

/**
 * Card inteiro clicável: quem ativa é um `<a>` POR FORA, e não o card. É ele
 * que carrega o destino, o nome acessível e o anel de foco — assim o Tab
 * alcança um destino único, em vez de um card mudo com handler no clique.
 */
export function cardClickableSource(): string {
  return vueSnippet(
    importCard('CardContent', 'CardDescription', 'CardHeader', 'CardTitle'),
    `<a
  href="/produtos/cadeira-gamer-pro"
  aria-label="Abrir detalhes do produto ${PRODUCT}"
  class="nds-block nds-w-sm nds-text-left nds-focus-ring nds-rounded-xl"
>
${indentar(card([], header(PRODUCT, DESCRIPTION_PRODUCT), PRECO), 2)}
</a>`,
  );
}

/**
 * Rodapé de ações: filho DIRETO do card. O card zera o próprio respiro de baixo
 * ao detectá-lo ali, e a borda superior do rodapé encosta na base — um
 * invólucro entre os dois mataria a regra sem mudar nada visível de imediato.
 */
export function cardWithFooterSource(): string {
  return vueSnippet(
    `${importCard('CardContent', 'CardDescription', 'CardFooter', 'CardHeader', 'CardTitle')}
${IMPORT_BUTTON}`,
    card(
      [WIDTH_SM],
      header(PRODUCT, 'Produto atualizado em 12/04.'),
      PRECO,
      footer(
        `<Button variant="outline" aria-label="Cancelar edição de ${PRODUCT}">Cancelar</Button>`,
        `<Button aria-label="Salvar alterações em ${PRODUCT}">Salvar</Button>`,
      ),
    ),
  );
}

/**
 * Ação no cabeçalho: com ela o cabeçalho vira grade de duas colunas e a ação
 * encosta à direita. A ordem do DOM continua título, descrição e ação.
 */
export function headerCardWithActionSource(): string {
  return vueSnippet(
    `${importCard('CardAction', 'CardContent', 'CardDescription', 'CardHeader', 'CardTitle')}
${IMPORT_BUTTON}`,
    card(
      [WIDTH_SM],
      header(
        PRODUCT,
        'Em estoque',
        `<Button variant="ghost" size="sm" aria-label="Editar produto ${PRODUCT}">Editar</Button>`,
      ),
      `<CardContent>
  <p class="nds-text-body">R$ 1.299,00</p>
</CardContent>`,
    ),
  );
}

/**
 * Imagem como primeiro filho: o card arredonda o topo dela e cede o próprio
 * respiro de cima, tudo por CSS — não é preciso passar classe de canto na
 * imagem. O texto alternativo descreve o produto, porque a imagem informa.
 */
export function cardWithImageSource(): string {
  return vueSnippet(
    importCard('CardContent', 'CardDescription', 'CardHeader', 'CardTitle'),
    card(
      [WIDTH_SM],
      `<img
  src="/produtos/cadeira-gamer-pro.jpg"
  alt="${PRODUCT} vista de frente, em fundo neutro"
  class="nds-w-full nds-aspect-16-9"
  style="object-fit: cover"
/>`,
      header(PRODUCT, DESCRIPTION_PRODUCT),
      PRECO,
    ),
  );
}

/**
 * Catálogo: a unidade completa. O status é a AÇÃO do cabeçalho, e não texto
 * solto no corpo, e cada ação do rodapé diz sobre qual produto age.
 */
export function productCardSource(): string {
  return vueSnippet(
    `${importCard('CardAction', 'CardContent', 'CardDescription', 'CardFooter', 'CardHeader', 'CardTitle')}
${IMPORT_BUTTON}
import { Badge } from '@/components/ui/badge'`,
    card(
      [WIDTH_SM],
      `<img
  src="/produtos/cadeira-gamer-pro.jpg"
  alt="${PRODUCT} vista de frente, em fundo neutro"
  class="nds-w-full nds-aspect-16-9"
  style="object-fit: cover"
/>`,
      header(PRODUCT, DESCRIPTION_PRODUCT, `<Badge variant="secondary">Em estoque</Badge>`),
      PRECO,
      footer(
        `<Button variant="outline" size="sm" aria-label="Editar produto ${PRODUCT}">Editar</Button>`,
        `<Button variant="destructive" size="sm" aria-label="Excluir produto ${PRODUCT}">Excluir</Button>`,
      ),
    ),
  );
}

/**
 * Indicador de painel: o título NOMEIA a métrica e o valor mora no corpo.
 * Trocá-los de lugar faria o leitor de tela anunciar "8.742" como o nome do
 * card, sem dizer do que ele fala.
 */
export function cardDeMetricaSource(): string {
  return vueSnippet(
    importCard('CardContent', 'CardDescription', 'CardHeader', 'CardTitle'),
    card(
      ['size="sm"', WIDTH_XS],
      header('Assinantes ativos', 'Últimos 30 dias'),
      `<CardContent>
  <p class="nds-text-h4 nds-tabular-nums">8.742</p>
  <p class="nds-text-caption nds-text-success">+12% no mês</p>
</CardContent>`,
    ),
  );
}

/**
 * Perfil: sem rodapé, é a unidade semântica mínima. O avatar é decorativo — o
 * nome já está no título, e um texto alternativo o faria ser anunciado duas
 * vezes seguidas.
 */
export function cardDePerfilSource(): string {
  return vueSnippet(
    `${importCard('CardDescription', 'CardHeader', 'CardTitle')}
import { Avatar, AvatarFallback } from '@/components/ui/avatar'`,
    card(
      [WIDTH_SM],
      `<CardHeader class="nds-cluster" data-align="center" data-spacing="sm">
  <Avatar>
    <AvatarFallback>MR</AvatarFallback>
  </Avatar>
  <div class="nds-flex-1">
    <CardTitle as="h3">Maria Rodrigues</CardTitle>
    <CardDescription>Designer de produto · São Paulo, BR</CardDescription>
  </div>
</CardHeader>`,
    ),
  );
}
