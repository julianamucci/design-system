/**
 * Transforms do painel Code do Card.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type CardArgs = {
  size: 'default' | 'sm';
};

/** As partes que quase todo card usa. Rodapé, ação e badge entram à parte. */
const IMPORT_BASE = `import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";`;

const IMPORT_COM_RODAPE = `import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";`;

/**
 * A largura máxima faz parte da lição: o Card é um bloco fluido e, solto na
 * página, ele se estica de ponta a ponta.
 */
const LARGURA = 'class="nds-w-cap-sm"';

/** Playground: a unidade completa — cabeçalho, corpo e rodapé de ações. */
export function cardSource(_gerado?: string, ctx?: { args?: Partial<CardArgs> }): string {
  const { size = 'default' } = ctx?.args ?? {};
  const props = attrs(LARGURA, size === 'sm' ? 'size="sm"' : '');

  return svelteSnippet(
    IMPORT_COM_RODAPE,
    `<Card${props}>
  <CardHeader>
    <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
    <CardDescription>Estrutura ergonômica com ajuste de altura e apoio lombar.</CardDescription>
  </CardHeader>
  <CardContent>
    <p class="nds-text-h4">R$ 1.299,00</p>
  </CardContent>
  <CardFooter class="nds-cluster" data-justify="end" data-spacing="sm">
    <Button variant="outline" aria-label="Editar produto Cadeira Gamer Pro">Editar</Button>
    <Button variant="destructive" aria-label="Excluir produto Cadeira Gamer Pro">Excluir</Button>
  </CardFooter>
</Card>`,
  );
}

/**
 * Forma canônica e passiva: cabeçalho e corpo, sem rodapé. É também o snippet
 * de reserva dos arquivos de tamanhos, estados e composições — cada story de lá
 * declara o seu, e quem cair aqui vê o card mínimo, não o de ações.
 */
export function cardPadraoSource(): string {
  return svelteSnippet(
    IMPORT_BASE,
    `<Card ${LARGURA}>
  <CardHeader>
    <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
    <CardDescription>Estrutura ergonômica com ajuste de altura e apoio lombar.</CardDescription>
  </CardHeader>
  <CardContent>
    <p class="nds-text-h4">R$ 1.299,00</p>
  </CardContent>
</Card>`,
  );
}

/** Tamanho sm: o atributo desce do raiz e aperta padding e título das partes. */
export function cardPequenoSource(): string {
  return svelteSnippet(
    IMPORT_BASE,
    `<Card class="nds-w-cap-xs" size="sm">
  <CardHeader>
    <CardTitle as="h3">Assinantes ativos</CardTitle>
    <CardDescription>+12% no mês</CardDescription>
  </CardHeader>
  <CardContent>
    <p class="nds-text-h4 nds-tabular-nums">8.742</p>
  </CardContent>
</Card>`,
  );
}

/**
 * Card inteiro clicável: quem ativa é o link em volta, nunca o Card. O anel de
 * foco e a ativação por teclado vêm do elemento nativo, e o Tab acha um destino
 * só.
 */
export function cardClicavelSource(): string {
  return svelteSnippet(
    IMPORT_BASE,
    `<a
  href="/produtos/cadeira-gamer-pro"
  aria-label="Abrir detalhes do produto Cadeira Gamer Pro"
  class="nds-block nds-w-cap-sm nds-text-left nds-focus-ring nds-rounded-xl"
>
  <Card>
    <CardHeader>
      <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
      <CardDescription>Estrutura ergonômica com ajuste de altura e apoio lombar.</CardDescription>
    </CardHeader>
    <CardContent>
      <p class="nds-text-h4">R$ 1.299,00</p>
    </CardContent>
  </Card>
</a>`,
  );
}

/**
 * Com rodapé: ele precisa ser filho DIRETO do Card — é o que aciona a borda
 * superior e a retirada do padding inferior.
 */
export function cardComRodapeSource(): string {
  return svelteSnippet(
    IMPORT_COM_RODAPE,
    `<Card ${LARGURA}>
  <CardHeader>
    <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
    <CardDescription>Produto atualizado em 12/04.</CardDescription>
  </CardHeader>
  <CardContent>
    <p class="nds-text-h4">R$ 1.299,00</p>
  </CardContent>
  <CardFooter class="nds-cluster" data-justify="end" data-spacing="sm">
    <Button variant="outline" aria-label="Cancelar edição de Cadeira Gamer Pro">Cancelar</Button>
    <Button aria-label="Salvar alterações em Cadeira Gamer Pro">Salvar</Button>
  </CardFooter>
</Card>`,
  );
}

/**
 * Com ação no cabeçalho: a ação mora DENTRO do CardHeader, depois da descrição.
 * O alinhamento à direita vem da grade do cabeçalho, não de classe própria.
 */
export function cardComAcaoSource(): string {
  return svelteSnippet(
    `import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";`,
    `<Card ${LARGURA}>
  <CardHeader>
    <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
    <CardDescription>Em estoque</CardDescription>
    <CardAction>
      <Button variant="ghost" size="sm" aria-label="Editar produto Cadeira Gamer Pro">
        Editar
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    <p class="nds-text-body">R$ 1.299,00</p>
  </CardContent>
</Card>`,
  );
}

/**
 * Com imagem: primeiro filho do Card. O raio do topo e a retirada do padding
 * superior saem do CSS — não é preciso passar classe nenhuma para isso.
 */
export function cardComImagemSource(): string {
  return svelteSnippet(
    IMPORT_BASE,
    `<Card ${LARGURA}>
  <img
    src="/produtos/cadeira-gamer-pro.jpg"
    alt="Cadeira Gamer Pro vista de frente, em fundo neutro"
    class="nds-w-full nds-aspect-16-9"
    style="object-fit: cover"
  />
  <CardHeader>
    <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
    <CardDescription>Estrutura ergonômica com ajuste de altura e apoio lombar.</CardDescription>
  </CardHeader>
  <CardContent>
    <p class="nds-text-h4">R$ 1.299,00</p>
  </CardContent>
</Card>`,
  );
}

/** Exemplo de catálogo: imagem, status na ação do cabeçalho e ações no rodapé. */
export function cardDeProdutoSource(): string {
  return svelteSnippet(
    `import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";`,
    `<Card ${LARGURA}>
  <img
    src="/produtos/cadeira-gamer-pro.jpg"
    alt="Cadeira Gamer Pro vista de frente, em fundo neutro"
    class="nds-w-full nds-aspect-16-9"
    style="object-fit: cover"
  />
  <CardHeader>
    <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
    <CardDescription>Estrutura ergonômica com ajuste de altura e apoio lombar.</CardDescription>
    <CardAction>
      <Badge variant="secondary">Em estoque</Badge>
    </CardAction>
  </CardHeader>
  <CardContent>
    <p class="nds-text-h4">R$ 1.299,00</p>
  </CardContent>
  <CardFooter class="nds-cluster" data-justify="end" data-spacing="sm">
    <Button variant="outline" size="sm" aria-label="Editar produto Cadeira Gamer Pro">
      Editar
    </Button>
    <Button variant="destructive" size="sm" aria-label="Excluir produto Cadeira Gamer Pro">
      Excluir
    </Button>
  </CardFooter>
</Card>`,
  );
}

/**
 * KPI de painel: o título nomeia a métrica e o número mora no corpo — trocar os
 * dois de lugar faz o leitor de tela anunciar "8.742" como nome do card.
 */
export function cardDeMetricaSource(): string {
  return svelteSnippet(
    IMPORT_BASE,
    `<Card class="nds-w-cap-xs" size="sm">
  <CardHeader>
    <CardTitle as="h3">Assinantes ativos</CardTitle>
    <CardDescription>Últimos 30 dias</CardDescription>
  </CardHeader>
  <CardContent>
    <p class="nds-text-h4 nds-tabular-nums">8.742</p>
    <p class="nds-text-caption nds-text-success">+12% no mês</p>
  </CardContent>
</Card>`,
  );
}

/**
 * Card de perfil: avatar ao lado do texto, sem rodapé. O avatar é decorativo —
 * o nome já está no título, e repeti-lo faria o leitor anunciar duas vezes.
 */
export function cardDePerfilSource(): string {
  return svelteSnippet(
    `import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";`,
    `<Card ${LARGURA}>
  <CardHeader class="nds-cluster" data-align="center" data-spacing="sm">
    <Avatar>
      <AvatarFallback>MR</AvatarFallback>
    </Avatar>
    <div class="nds-flex-1">
      <CardTitle as="h3">Maria Rodrigues</CardTitle>
      <CardDescription>Designer de produto · São Paulo, BR</CardDescription>
    </div>
  </CardHeader>
</Card>`,
  );
}
