/**
 * Transforms do painel Code do Separator.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções
 * rodarem no projeto `unit` do vitest. A saída do painel não chega ao DOM
 * durante a `play`, então este é o único lugar em que elas têm guarda.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type SeparatorArgs = {
  orientation: 'horizontal' | 'vertical';
  decorative: boolean;
  emphasis: 'default' | 'strong';
};

const IMPORT = `import { Separator } from "@/components/ui/separator";`;

/** Forma canônica: uma linha entre dois blocos de conteúdo. */
export function separatorSource(_gerado?: string, ctx?: { args?: Partial<SeparatorArgs> }): string {
  const { orientation = 'horizontal', decorative = true, emphasis = 'default' } = ctx?.args ?? {};
  const props = attrs(
    `orientation="${orientation}"`,
    decorative ? '' : 'decorative={false}',
    emphasis === 'strong' ? 'emphasis="strong"' : '',
  );

  return svelteSnippet(
    IMPORT,
    orientation === 'vertical'
      ? `<div class="nds-cluster" data-spacing="md">
  <p>Item A</p>
  <Separator${props} />
  <p>Item B</p>
</div>`
      : `<p>Seção superior</p>
<Separator${props} />
<p>Seção inferior</p>`,
  );
}

/** Variante horizontal: divide dois blocos empilhados de uma mesma página. */
export function separatorHorizontalSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="md">
  <div>
    <p class="nds-font-medium">Configurações da conta</p>
    <p class="nds-text-muted-foreground">Gerencie seu nome e e-mail.</p>
  </div>
  <Separator orientation="horizontal" />
  <div>
    <p class="nds-font-medium">Preferências</p>
    <p class="nds-text-muted-foreground">Tema, idioma e notificações.</p>
  </div>
</div>`,
  );
}

/** Variante vertical: divide itens na mesma linha, com a altura vinda do flex. */
export function separatorVerticalSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div class="nds-cluster" data-spacing="md">
  <span>Blog</span>
  <Separator orientation="vertical" />
  <span>Documentação</span>
  <Separator orientation="vertical" />
  <span>Contato</span>
</div>`,
  );
}

/** Estado decorativo (padrão): a divisão é só visual. */
export function separatorDecorativoSource(): string {
  return svelteSnippet(
    IMPORT,
    `<p>Conteúdo antes do separador.</p>
<Separator orientation="horizontal" />
<p>Conteúdo depois do separador.</p>`,
  );
}

/** Estado semântico: a divisão faz parte da estrutura da informação. */
export function separatorSemanticoSource(): string {
  return svelteSnippet(
    IMPORT,
    `<p>Categoria: Layout</p>
<Separator orientation="horizontal" decorative={false} />
<p>Categoria: Formulários</p>`,
  );
}

/** Composição: o separador aninhado num Card, entre cabeçalho e corpo. */
export function separatorEmCardSource(): string {
  return svelteSnippet(
    `import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";`,
    `<Card class="nds-max-w-md">
  <CardHeader>
    <CardTitle>Resumo do pedido</CardTitle>
    <CardDescription>3 itens, entrega em 5 dias úteis.</CardDescription>
  </CardHeader>
  <Separator orientation="horizontal" />
  <CardContent>
    <p>Total: R$ 249,90</p>
  </CardContent>
</Card>`,
  );
}

/** Composição: divisão entre grupos de um menu — o caso semântico por natureza. */
export function separatorEmMenuSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div class="nds-stack nds-rounded-md nds-border-default nds-bg-background nds-p-1" data-spacing="xs">
  <div class="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1">Perfil</div>
  <div class="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1">Conta</div>
  <Separator orientation="horizontal" decorative={false} />
  <div class="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1">Sair</div>
</div>`,
  );
}

/** Composição: ênfase forte convivendo com a linha padrão, e classe extra junto. */
export function separatorEnfaseForteSource(): string {
  return svelteSnippet(
    IMPORT,
    `<p class="nds-text-muted-foreground">Fim da seção</p>
<Separator orientation="horizontal" />
<p class="nds-text-muted-foreground">Continuação do mesmo assunto</p>
<Separator orientation="horizontal" emphasis="strong" class="nds-mt-4" />
<p class="nds-font-medium">Troca de assunto</p>`,
  );
}
