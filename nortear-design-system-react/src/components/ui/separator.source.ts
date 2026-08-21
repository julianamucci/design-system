/**
 * Transforms do painel Code do Separator.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * Estas funções nasceram de uma lambda declarada DENTRO do `meta` da story.
 * Inline, nenhum teste a alcançava: ela imprimia sempre a composição
 * horizontal — mesmo com o control em vertical — e lia `ctx.args` sem guardar
 * `ctx`, então quebrava na chamada sem argumento.
 */
import { attrs, jsxSnippet, propBool, propOpcao, type SourceTransform } from '@/lib/story-source';

export type SeparatorArgs = {
  orientation: 'horizontal' | 'vertical';
  decorative: boolean;
  emphasis: 'default' | 'strong';
};

const ORIENTACOES = ['horizontal', 'vertical'] as const;
const ENFASES = ['default', 'strong'] as const;

const IMPORT = 'import { Separator } from "@/components/ui/separator";';

/**
 * Atributos do divisor, e só os que diferem do padrão: `orientation` horizontal,
 * `decorative` ligado e `emphasis` normal já são o que o componente faz sozinho.
 */
function atributos(args: Partial<SeparatorArgs>): string {
  return attrs(
    propOpcao('orientation', args.orientation, ORIENTACOES, 'horizontal'),
    propBool('decorative', args.decorative, true),
    propOpcao('emphasis', args.emphasis, ENFASES, 'default'),
  );
}

/**
 * Composição horizontal: a linha nasce da largura do contêiner, então ela vive
 * entre dois blocos empilhados. Sem contêiner nenhum a linha continua existindo,
 * mas com a largura do que estiver em volta.
 */
function empilhado(attrsDaLinha: string): string {
  return `<div className="nds-stack nds-w-md" data-spacing="md">
  <p className="nds-text-body">Seção superior</p>
  <Separator${attrsDaLinha} />
  <p className="nds-text-body">Seção inferior</p>
</div>`;
}

/**
 * Composição vertical: a altura NÃO é do componente — vem do `align-self:
 * stretch` contra a linha do flex. Fora de um contêiner flex ou de grade a linha
 * vertical colapsa para zero e some da tela sem sumir do DOM, que é o defeito
 * que o snippet precisa evitar ensinar.
 */
function emLinha(attrsDaLinha: string): string {
  return `<div className="nds-cluster nds-w-md" data-spacing="md">
  <span className="nds-text-body">Item A</span>
  <Separator${attrsDaLinha} />
  <span className="nds-text-body nds-text-muted-foreground">Item B</span>
</div>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls do
 * Playground e troca a COMPOSIÇÃO junto com a orientação: o divisor vertical
 * entre dois parágrafos empilhados não desenharia nada, e era exatamente isso
 * que o painel mostrava antes.
 */
export const separatorSource: SourceTransform<SeparatorArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const linha = atributos(args);
  return jsxSnippet(IMPORT, args.orientation === 'vertical' ? emLinha(linha) : empilhado(linha));
};

/**
 * Vertical: a orientação é o assunto, e ela só se sustenta dentro de uma linha
 * de flex. Duas linhas separando três destinos é o caso canônico.
 */
export function separatorVerticalSource(): string {
  return jsxSnippet(
    IMPORT,
    `<div className="nds-cluster nds-w-md" data-spacing="md">
  <span className="nds-text-body">Blog</span>
  <Separator orientation="vertical" />
  <span className="nds-text-body">Documentação</span>
  <Separator orientation="vertical" />
  <span className="nds-text-body">Contato</span>
</div>`,
  );
}

/**
 * Semântico: `decorative={false}` é o que troca `role="none"` por
 * `role="separator"` e faz a linha anunciar a própria orientação. É a escolha
 * que a story afirma, e nenhum control a descreve neste arquivo.
 */
export function separatorSemanticoSource(): string {
  return jsxSnippet(
    IMPORT,
    `<div className="nds-stack nds-w-md" data-spacing="sm">
  <p className="nds-text-body">Categoria: Layout</p>
  <Separator decorative={false} />
  <p className="nds-text-body">Categoria: Formulários</p>
</div>`,
  );
}

/**
 * Dentro do Card: o divisor mora ENTRE o cabeçalho e o conteúdo, irmão dos dois.
 * Colocado dentro de um deles ele herdaria o padding e deixaria de encostar nas
 * bordas do cartão — a divisão passa a parecer um traço solto.
 */
export function separatorEmCardSource(): string {
  return jsxSnippet(
    `${IMPORT}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";`,
    `<Card className="nds-max-w-md">
  <CardHeader>
    <CardTitle>Resumo do pedido</CardTitle>
    <CardDescription>3 itens, entrega em 5 dias úteis.</CardDescription>
  </CardHeader>
  <Separator />
  <CardContent>
    <p className="nds-text-body">Total: R$ 249,90</p>
  </CardContent>
</Card>`,
  );
}

/**
 * Dentro de um menu: aqui a divisão entre grupos FAZ parte da estrutura da
 * informação — quem ouve precisa saber que "Sair" não pertence ao mesmo bloco
 * que "Perfil". É o caso em que o divisor deixa de ser decorativo.
 */
export function separatorEmMenuSource(): string {
  return jsxSnippet(
    IMPORT,
    `<div
  className="nds-stack nds-max-w-xs nds-rounded-md nds-border-default nds-bg-background nds-p-1"
  data-spacing="xs"
>
  <div className="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1 nds-text-body">Perfil</div>
  <div className="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1 nds-text-body">Conta</div>
  <Separator decorative={false} />
  <div className="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1 nds-text-body">Sair</div>
</div>`,
  );
}

/**
 * Ênfase forte ao lado da padrão: o peso da linha só significa alguma coisa em
 * comparação — sozinha, a linha forte parece só uma linha. A classe extra entra
 * junto para mostrar que ela convive com a classe base em vez de substituí-la.
 */
export function separatorEnfaseForteSource(): string {
  return jsxSnippet(
    IMPORT,
    `<div className="nds-stack nds-w-md" data-spacing="md">
  <p className="nds-text-body nds-text-muted-foreground">Fim da seção</p>
  <Separator />
  <p className="nds-text-body nds-text-muted-foreground">Continuação do mesmo assunto</p>
  <Separator emphasis="strong" className="nds-mt-4" />
  <p className="nds-text-body nds-font-medium">Troca de assunto</p>
</div>`,
  );
}
