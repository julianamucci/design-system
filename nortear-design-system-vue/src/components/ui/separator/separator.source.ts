/**
 * Transforms do painel Code do Separator.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * O CONTÊINER faz parte do uso, não do andaime: na horizontal a linha ocupa a
 * largura do bloco pai; na vertical a altura vem da linha do flex — fora de um
 * contêiner flex ou de grade o separador vertical colapsa para zero e continua
 * no DOM com o atributo certo, sem quebrar nada. É o mesmo par contêiner+linha
 * que a stack de referência entrega.
 */
import { attr, attrBool, attrs, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type SeparatorArgs = {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
  emphasis?: 'default' | 'strong';
};

const IMPORT = `import { Separator } from '@/components/ui/separator'`;

/**
 * A linha, com só o que difere do padrão.
 *
 * `horizontal`, `decorative` verdadeiro e ênfase `default` são o que o
 * componente já assume — escrevê-los ensinaria ruído a quem copia.
 */
function line(o: SeparatorArgs & { className?: string } = {}): string {
  return `<Separator${attrs(
    attr('orientation', o.orientation, 'horizontal'),
    attrBool('decorative', o.decorative, true),
    attr('emphasis', o.emphasis, 'default'),
    o.className && `class="${o.className}"`,
  )} />`;
}

/**
 * O bloco em volta: empilhado na horizontal, em linha na vertical.
 *
 * A largura máxima faz parte da lição da horizontal — a linha ocupa 100% do
 * pai, e sem um pai medido não há como ver onde ela começa e termina.
 */
function section(vertical: boolean, children: string): string {
  const eixo = vertical ? 'nds-cluster' : 'nds-stack';
  return `<div class="${eixo} nds-w-md" data-spacing="md">
${indentar(children)}
</div>`;
}

/**
 * Forma canônica: dois blocos de conteúdo com a linha entre eles, dentro de um
 * contêiner que dá o eixo.
 *
 * A story alterna o texto junto com a orientação — na vertical os vizinhos são
 * itens de uma linha, e não seções empilhadas —, e o snippet acompanha: um
 * "Seção superior" ao lado de uma linha vertical descreveria outra tela.
 */
export const separatorSource: SourceTransform<SeparatorArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const vertical = args.orientation === 'vertical';
  const antes = vertical ? 'Item A' : 'Seção superior';
  const depois = vertical ? 'Item B' : 'Seção inferior';
  return vueSnippet(
    IMPORT,
    section(
      vertical,
      `<p class="nds-text-body">${antes}</p>
${line({ orientation: vertical ? 'vertical' : 'horizontal', decorative: args.decorative, emphasis: args.emphasis })}
<p class="nds-text-body">${depois}</p>`,
    ),
  );
};

/**
 * Eixo horizontal: linha de 1px de altura que ocupa a largura do contêiner. É
 * o padrão do componente, então não há atributo de eixo a escrever.
 */
export function separatorHorizontalSource(): string {
  return vueSnippet(
    IMPORT,
    section(
      false,
      `<div class="nds-text-body">
  <p class="nds-font-medium">Configurações da conta</p>
  <p class="nds-text-muted-foreground">Gerencie seu nome e e-mail.</p>
</div>
${line()}
<div class="nds-text-body">
  <p class="nds-font-medium">Preferências</p>
  <p class="nds-text-muted-foreground">Tema, idioma e notificações.</p>
</div>`,
    ),
  );
}

/**
 * Eixo vertical: 1px de largura, e a altura vem da linha do flex. Nenhuma
 * medida é cravada — a linha acompanha a altura do vizinho, e cresce junto
 * quando a pessoa aumenta a fonte do navegador.
 */
export function separatorVerticalSource(): string {
  return vueSnippet(
    IMPORT,
    section(
      true,
      `<span class="nds-text-body">Blog</span>
${line({ orientation: 'vertical' })}
<span class="nds-text-body">Documentação</span>
${line({ orientation: 'vertical' })}
<span class="nds-text-body">Contato</span>`,
    ),
  );
}

/**
 * Modo decorativo, que é o padrão: a divisão é só visual, e o leitor de tela
 * ignora a linha. Não há prop a escrever — pedir `decorative` explicitamente
 * repetiria o que o componente já faz.
 */
export function separatorDecorativoSource(): string {
  return vueSnippet(
    IMPORT,
    `<div class="nds-stack nds-w-md" data-spacing="sm">
  <p class="nds-text-body">Conteúdo antes do separador.</p>
${indentar(line())}
  <p class="nds-text-body">Conteúdo depois do separador.</p>
</div>`,
  );
}

/**
 * Modo semântico: a divisão FAZ parte da estrutura da informação, e a linha
 * passa a ser anunciada como divisor, com a própria orientação. É o que
 * `:decorative="false"` liga.
 */
export function separatorSemanticoSource(): string {
  return vueSnippet(
    IMPORT,
    `<div class="nds-stack nds-w-md" data-spacing="sm">
  <p class="nds-text-body">Categoria: Layout</p>
${indentar(line({ decorative: false }))}
  <p class="nds-text-body">Categoria: Formulários</p>
</div>`,
  );
}

/**
 * Dentro de um cartão: a linha é IRMÃ do cabeçalho e do conteúdo, e é dessa
 * vizinhança que vem o respeito à caixa — dentro do conteúdo ela herdaria o
 * recuo e não chegaria às bordas.
 */
export function separatorEmCardSource(): string {
  return vueSnippet(
    `import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
${IMPORT}`,
    `<Card class="nds-max-w-md">
  <CardHeader>
    <CardTitle>Resumo do pedido</CardTitle>
    <CardDescription>3 itens, entrega em 5 dias úteis.</CardDescription>
  </CardHeader>
${indentar(line())}
  <CardContent>
    <p class="nds-text-body">Total: R$ 249,90</p>
  </CardContent>
</Card>`,
  );
}

/**
 * Num menu: a divisão entre grupos de ações é estrutura, não enfeite — é o caso
 * em que o separador deixa de ser decorativo. E ele fica ENTRE os dois grupos,
 * nunca dentro de um deles.
 */
export function separatorEmMenuSource(): string {
  return vueSnippet(
    IMPORT,
    `<div class="nds-stack nds-max-w-xs nds-rounded-md nds-border-default nds-bg-background nds-p-1" data-spacing="xs">
  <div class="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1 nds-text-body">Perfil</div>
  <div class="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1 nds-text-body">Conta</div>
${indentar(line({ decorative: false }))}
  <div class="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1 nds-text-body">Sair</div>
</div>`,
  );
}

/**
 * Ênfase forte ao lado da padrão: a linha mais pesada separa ASSUNTOS, a fina
 * separa seções do mesmo assunto. A classe extra convive com a base — ela
 * acrescenta respiro, não substitui o desenho da linha.
 */
export function separatorEnfaseForteSource(): string {
  return vueSnippet(
    IMPORT,
    section(
      false,
      `<p class="nds-text-body nds-text-muted-foreground">Fim da seção</p>
${line()}
<p class="nds-text-body nds-text-muted-foreground">Continuação do mesmo assunto</p>
${line({ emphasis: 'strong', className: 'nds-mt-4' })}
<p class="nds-text-body nds-font-medium">Troca de assunto</p>`,
    ),
  );
}
