/**
 * Transforms do painel Code do Card.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O Card é composição pura: quase toda story monta uma PEÇA diferente (ação no
 * cabeçalho, imagem sangrada, avatar, métrica). O snippet do `meta` mostra a
 * forma canônica, e cada composição que sai dela declara a sua — o `meta` nunca
 * adivinha por nome de story.
 */
import {
  attrs,
  indentar,
  jsxSnippet,
  propOption,
  propText,
  type SourceTransform,
} from '@/lib/story-source';

export type CardArgs = {
  size: 'default' | 'sm';
  className: string;
};

const SIZES = ['default', 'sm'] as const;

/**
 * Bloco de importação com as peças que o exemplo realmente usa.
 *
 * O Card é um conjunto de sub-componentes nomeados, e importar o conjunto
 * inteiro em todo exemplo ensinaria a copiar peça que não está na tela.
 */
function importCard(...parts: string[]): string {
  const lista = ['Card', ...parts].sort();
  return `import {\n${lista.map((part) => `  ${part},`).join('\n')}\n} from "@/components/ui/card";`;
}

const IMPORT_BUTTON = 'import { Button } from "@/components/ui/button";';

/**
 * A largura máxima faz parte da lição: o Card é um bloco fluido e, sem limite,
 * ele acompanha a coluna inteira em que estiver. Vem de classe utilitária,
 * nunca de `style`.
 */
const WIDTH = 'nds-w-sm';

/**
 * Cabeçalho canônico: o título é um heading DE VERDADE por `as`, e não só um
 * texto com aparência de título — o CSS dá a aparência, quem dá a semântica é
 * o elemento.
 */
const HEADER = `  <CardHeader>
    <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
    <CardDescription>
      Estrutura ergonômica com ajuste de altura e apoio lombar.
    </CardDescription>
  </CardHeader>`;

const BODY = `  <CardContent>
    <p className="nds-text-base nds-font-semibold">R$ 1.299,00</p>
  </CardContent>`;

/**
 * Rodapé de ações. Cada botão diz sobre QUAL item age: numa lista de cards,
 * "Excluir" sozinho vira uma fileira de botões idênticos para quem navega por
 * leitor de tela.
 */
const FOOTER = `  <CardFooter className="nds-cluster" data-justify="end" data-spacing="sm">
    <Button variant="outline" aria-label="Editar produto Cadeira Gamer Pro">
      Editar
    </Button>
    <Button variant="destructive" aria-label="Excluir produto Cadeira Gamer Pro">
      Excluir
    </Button>
  </CardFooter>`;

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai na forma canônica, que é a unidade
 * completa: cabeçalho, corpo e rodapé de ações como filhos DIRETOS do Card.
 *
 * O parentesco direto não é detalhe de estilo: `.nds-card:has(> .nds-card-footer)`
 * zera o padding inferior do card para a borda do rodapé encostar na base, e um
 * contêiner entre os dois mataria a regra sem mudar nada visível.
 */
export const cardSource: SourceTransform<CardArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const raiz = attrs(
    propOption('size', args.size, SIZES, 'default'),
    propText('className', args.className) ?? `className="${WIDTH}"`,
  );

  return jsxSnippet(
    `${IMPORT_BUTTON}\n${importCard('CardContent', 'CardDescription', 'CardFooter', 'CardHeader', 'CardTitle')}`,
    `<Card${raiz}>
${HEADER}
${BODY}
${FOOTER}
</Card>`,
  );
};

/**
 * Card sem rodapé: a unidade mínima do componente, e o estado em que ele é um
 * contêiner PASSIVO — nenhum papel ARIA, nenhuma entrada na ordem de foco.
 */
export function cardNoFooterSource(): string {
  return jsxSnippet(
    importCard('CardContent', 'CardDescription', 'CardHeader', 'CardTitle'),
    `<Card className="${WIDTH}">
${HEADER}
${BODY}
</Card>`,
  );
}

/**
 * Tamanho compacto: `size="sm"` propaga por `data-size` até as partes internas,
 * que reduzem padding e título sozinhas. Nada de classe extra peça por peça.
 */
export function cardCompactoSource(): string {
  return jsxSnippet(
    `${importCard('CardContent', 'CardDescription', 'CardHeader', 'CardTitle')}
import { TrendingUp } from "lucide-react";`,
    `<Card size="sm" className="nds-w-xs">
  <CardHeader>
    <CardTitle as="h3">Assinantes ativos</CardTitle>
    <CardDescription>Últimos 30 dias</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="nds-text-h4 nds-tabular-nums">8.742</p>
    <p
      className="nds-cluster nds-text-caption nds-text-success"
      data-align="center"
      data-spacing="xs"
    >
      <TrendingUp aria-hidden="true" className="nds-icon-sm" />
      +12% no mês
    </p>
  </CardContent>
</Card>`,
  );
}

/**
 * Ação no cabeçalho: com `CardAction` o header vira grade de duas colunas e a
 * ação encosta à direita. A ordem do DOM continua título → descrição → ação,
 * então o leitor de tela lê na ordem lógica mesmo com a ação no canto oposto.
 */
export function cardWithActionSource(): string {
  return jsxSnippet(
    `${IMPORT_BUTTON}
${importCard('CardAction', 'CardContent', 'CardDescription', 'CardHeader', 'CardTitle')}
import { MoreVertical } from "lucide-react";`,
    `<Card className="${WIDTH}">
  <CardHeader>
    <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
    <CardDescription>Em estoque</CardDescription>
    <CardAction>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Ações do produto Cadeira Gamer Pro"
      >
        <MoreVertical aria-hidden="true" className="nds-size-4" />
      </Button>
    </CardAction>
  </CardHeader>
${BODY}
</Card>`,
  );
}

/**
 * Imagem sangrada: como PRIMEIRO filho direto, o Card arredonda o topo dela e
 * cede o próprio padding superior por CSS — não é preciso classe na `<img>`
 * para isso. `object-fit` é mecânica de recorte, não valor de design: não há
 * classe `.nds-*` para ele e nenhum tema o altera.
 */
export function cardWithImageSource(): string {
  return jsxSnippet(
    importCard('CardContent', 'CardDescription', 'CardHeader', 'CardTitle'),
    `<Card className="${WIDTH}">
  <img
    src="/produtos/cadeira-gamer-pro.jpg"
    alt="Cadeira Gamer Pro vista de frente, em fundo neutro"
    className="nds-w-full nds-aspect-16-9"
    style={{ objectFit: "cover" }}
  />
${HEADER}
${BODY}
</Card>`,
  );
}

/**
 * Catálogo: a unidade inteira de uma vez — imagem, cabeçalho com status na
 * ação, corpo e rodapé. O status é a AÇÃO do cabeçalho e não texto solto no
 * corpo, que é o que o mantém alinhado ao título em qualquer largura.
 */
export function cardProductSource(): string {
  return jsxSnippet(
    `import { Badge } from "@/components/ui/badge";
${IMPORT_BUTTON}
${importCard('CardAction', 'CardContent', 'CardDescription', 'CardFooter', 'CardHeader', 'CardTitle')}`,
    `<Card className="${WIDTH}">
  <img
    src="/produtos/cadeira-gamer-pro.jpg"
    alt="Cadeira Gamer Pro vista de frente, em fundo neutro"
    className="nds-w-full nds-aspect-16-9"
    style={{ objectFit: "cover" }}
  />
  <CardHeader>
    <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
    <CardDescription>
      Estrutura ergonômica com ajuste de altura e apoio lombar.
    </CardDescription>
    <CardAction>
      <Badge variant="secondary">Em estoque</Badge>
    </CardAction>
  </CardHeader>
${BODY}
${FOOTER}
</Card>`,
  );
}

/**
 * Perfil: o avatar entra no cabeçalho e a foto é DECORATIVA — o nome já está no
 * título, e um texto alternativo faria o leitor de tela anunciá-lo duas vezes
 * seguidas.
 */
export function cardPerfilSource(): string {
  return jsxSnippet(
    `import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
${importCard('CardDescription', 'CardHeader', 'CardTitle')}`,
    `<Card className="${WIDTH}">
  <CardHeader className="nds-cluster" data-align="center" data-spacing="sm">
    <Avatar>
      <AvatarImage src="/pessoas/maria-rodrigues.jpg" alt="" />
      <AvatarFallback>MR</AvatarFallback>
    </Avatar>
    <div className="nds-flex-1">
      <CardTitle as="h3">Maria Rodrigues</CardTitle>
      <CardDescription>Designer de produto · São Paulo, BR</CardDescription>
    </div>
  </CardHeader>
</Card>`,
  );
}

/**
 * Card inteiro clicável: quem recebe foco, papel e nome acessível é a ÂNCORA em
 * volta — o Card raiz nunca ganha `onClick` nem `tabIndex`. Assim o Tab alcança
 * um destino só, e a ativação por teclado vem de graça do elemento nativo.
 */
export function cardClickableSource(): string {
  return jsxSnippet(
    importCard('CardContent', 'CardDescription', 'CardHeader', 'CardTitle'),
    `<a
  href="/produtos/cadeira-gamer-pro"
  aria-label="Abrir detalhes do produto Cadeira Gamer Pro"
  className="nds-block nds-w-sm nds-text-left nds-focus-ring nds-rounded-xl"
>
  <Card>
${indentar(HEADER)}
${indentar(BODY)}
  </Card>
</a>`,
  );
}
