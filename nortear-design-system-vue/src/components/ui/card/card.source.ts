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
  const nomes = ['Card', ...partes].sort();
  return `import {\n${nomes.map((nome) => `  ${nome},`).join('\n')}\n} from '@/components/ui/card'`;
}

const IMPORT_BUTTON = `import { Button } from '@/components/ui/button'`;

/**
 * O card não tem largura própria: ele preenche o que o contexto der. Numa story
 * isolada isso significa a página inteira, então a moldura entra pela classe.
 */
const LARGURA_SM = 'class="nds-w-full nds-max-w-sm"';
const LARGURA_XS = 'class="nds-w-full nds-max-w-xs"';

/** Raiz do card com os filhos já indentados. */
function card(partes: Array<string | ''>, ...filhos: string[]): string {
  const corpo = filhos
    .filter(Boolean)
    .map((filho) => indentar(filho, 2))
    .join('\n');
  return `<Card${attrs(...partes)}>\n${corpo}\n</Card>`;
}

/**
 * Cabeçalho: título, descrição e — quando há — a ação, nessa ordem no DOM. É a
 * ordem lógica de leitura; a posição da ação à direita vem da grade do
 * cabeçalho, não de uma classe no elemento.
 *
 * `as="h3"` porque o título nasce `div`: o CSS dá a aparência de título, e quem
 * dá a semântica é o elemento.
 */
function cabecalho(titulo: string, descricao: string, acao = ''): string {
  const corpo = [
    `  <CardTitle as="h3">${titulo}</CardTitle>`,
    `  <CardDescription>${descricao}</CardDescription>`,
    acao ? `  <CardAction>\n${indentar(acao, 4)}\n  </CardAction>` : '',
  ].filter(Boolean);
  return `<CardHeader>\n${corpo.join('\n')}\n</CardHeader>`;
}

const PRODUTO = 'Cadeira Gamer Pro';
const DESCRICAO_PRODUTO = 'Estrutura ergonômica com ajuste de altura e apoio lombar.';

const PRECO = `<CardContent>
  <p class="nds-text-h4">R$ 1.299,00</p>
</CardContent>`;

/**
 * Rodapé de ações. Cada rótulo acessível diz sobre QUAL item ele age: numa
 * lista de cards, "Excluir" sozinho vira uma fileira de botões idênticos para
 * quem navega por leitor de tela.
 */
function rodape(...botoes: string[]): string {
  return `<CardFooter class="nds-cluster" data-justify="end" data-spacing="sm">
${botoes.map((botao) => `  ${botao}`).join('\n')}
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
      [attr('size', ctx?.args?.size, 'default'), LARGURA_SM],
      cabecalho(PRODUTO, DESCRICAO_PRODUTO),
      PRECO,
      rodape(
        `<Button variant="outline" aria-label="Editar produto ${PRODUTO}">Editar</Button>`,
        `<Button variant="destructive" aria-label="Excluir produto ${PRODUTO}">Excluir</Button>`,
      ),
    ),
  );
};

/**
 * A unidade mínima: cabeçalho e corpo. O card é container passivo — não recebe
 * foco, não tem papel ARIA e não carrega handler próprio.
 */
export function cardSimplesSource(): string {
  return vueSnippet(
    importCard('CardContent', 'CardDescription', 'CardHeader', 'CardTitle'),
    card([LARGURA_SM], cabecalho(PRODUTO, DESCRICAO_PRODUTO), PRECO),
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
      ['size="sm"', LARGURA_XS],
      cabecalho('Assinantes ativos', '+12% no mês'),
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
export function cardClicavelSource(): string {
  return vueSnippet(
    importCard('CardContent', 'CardDescription', 'CardHeader', 'CardTitle'),
    `<a
  href="/produtos/cadeira-gamer-pro"
  aria-label="Abrir detalhes do produto ${PRODUTO}"
  class="nds-block nds-w-full nds-max-w-sm nds-text-left nds-focus-ring nds-rounded-xl"
>
${indentar(card([], cabecalho(PRODUTO, DESCRICAO_PRODUTO), PRECO), 2)}
</a>`,
  );
}

/**
 * Rodapé de ações: filho DIRETO do card. O card zera o próprio respiro de baixo
 * ao detectá-lo ali, e a borda superior do rodapé encosta na base — um
 * invólucro entre os dois mataria a regra sem mudar nada visível de imediato.
 */
export function cardComRodapeSource(): string {
  return vueSnippet(
    `${importCard('CardContent', 'CardDescription', 'CardFooter', 'CardHeader', 'CardTitle')}
${IMPORT_BUTTON}`,
    card(
      [LARGURA_SM],
      cabecalho(PRODUTO, 'Produto atualizado em 12/04.'),
      PRECO,
      rodape(
        `<Button variant="outline" aria-label="Cancelar edição de ${PRODUTO}">Cancelar</Button>`,
        `<Button aria-label="Salvar alterações em ${PRODUTO}">Salvar</Button>`,
      ),
    ),
  );
}

/**
 * Ação no cabeçalho: com ela o cabeçalho vira grade de duas colunas e a ação
 * encosta à direita. A ordem do DOM continua título, descrição e ação.
 */
export function cardComAcaoNoHeaderSource(): string {
  return vueSnippet(
    `${importCard('CardAction', 'CardContent', 'CardDescription', 'CardHeader', 'CardTitle')}
${IMPORT_BUTTON}`,
    card(
      [LARGURA_SM],
      cabecalho(
        PRODUTO,
        'Em estoque',
        `<Button variant="ghost" size="sm" aria-label="Editar produto ${PRODUTO}">Editar</Button>`,
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
export function cardComImagemSource(): string {
  return vueSnippet(
    importCard('CardContent', 'CardDescription', 'CardHeader', 'CardTitle'),
    card(
      [LARGURA_SM],
      `<img
  src="/produtos/cadeira-gamer-pro.jpg"
  alt="${PRODUTO} vista de frente, em fundo neutro"
  class="nds-w-full nds-aspect-video"
  style="object-fit: cover"
/>`,
      cabecalho(PRODUTO, DESCRICAO_PRODUTO),
      PRECO,
    ),
  );
}

/**
 * Catálogo: a unidade completa. O status é a AÇÃO do cabeçalho, e não texto
 * solto no corpo, e cada ação do rodapé diz sobre qual produto age.
 */
export function cardDeProdutoSource(): string {
  return vueSnippet(
    `${importCard('CardAction', 'CardContent', 'CardDescription', 'CardFooter', 'CardHeader', 'CardTitle')}
${IMPORT_BUTTON}
import { Badge } from '@/components/ui/badge'`,
    card(
      [LARGURA_SM],
      `<img
  src="/produtos/cadeira-gamer-pro.jpg"
  alt="${PRODUTO} vista de frente, em fundo neutro"
  class="nds-w-full nds-aspect-video"
  style="object-fit: cover"
/>`,
      cabecalho(PRODUTO, DESCRICAO_PRODUTO, `<Badge variant="secondary">Em estoque</Badge>`),
      PRECO,
      rodape(
        `<Button variant="outline" size="sm" aria-label="Editar produto ${PRODUTO}">Editar</Button>`,
        `<Button variant="destructive" size="sm" aria-label="Excluir produto ${PRODUTO}">Excluir</Button>`,
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
      ['size="sm"', LARGURA_XS],
      cabecalho('Assinantes ativos', 'Últimos 30 dias'),
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
      [LARGURA_SM],
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
