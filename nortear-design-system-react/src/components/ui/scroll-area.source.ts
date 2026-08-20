/**
 * Transforms do painel Code do ScrollArea.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta é ANDAIME e não entra no snippet: o
 * `<div style={{ width: "320px" }}>` que emoldura cada exemplo, a chave de
 * remontagem quando o control troca a forma do conteúdo, o `width: max-content`
 * plantado para forçar transbordo e as caixas cinza de tamanho cravado que
 * substituem imagens. Nada disso é do componente — é o Storybook precisando de
 * um quadro contra o que desenhar.
 *
 * A ALTURA é o contrário: sem teto não há transbordo, e sem transbordo não há
 * rolagem. Ela é do componente e entra pela escada `size` (`--box-height-*`),
 * que é justamente o que o primitivo criou para tirar as alturas cravadas dos
 * `style` inline. A LARGURA entra pela mesma razão nos exemplos que rolam na
 * horizontal: sem limite lateral a faixa nunca transborda. Por isso o snippet
 * troca o quadro de fora por uma classe de largura do design system, em vez de
 * repetir o `<div>` da story.
 */
import { jsxSnippet, type SourceTransform } from '@/lib/story-source';

export type ScrollAreaArgs = {
  orientation: 'vertical' | 'horizontal' | 'both';
  itemCount: number;
};

const IMPORT_SIMPLES = 'import { ScrollArea } from "@/components/ui/scroll-area";';
const IMPORT_COM_BARRA =
  'import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";';

/** Quantidade de itens do exemplo, e só quando o control entrega um número. */
function quantidade(valor: unknown, padrao: number): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return padrao;
  const inteiro = Math.round(valor);
  return inteiro > 0 ? inteiro : padrao;
}

/**
 * Lista vertical — o caso canônico. `size` dá o teto de altura e a largura vem
 * de uma utilitária: as duas medidas moram no componente, não num quadro em
 * volta dele.
 */
function listaVertical(itens: number): string {
  return `const tags = Array.from({ length: ${itens} }, (_, i) => \`Tag \${i + 1}\`);

<ScrollArea size="lg" className="nds-w-sm nds-rounded-md nds-border-default">
  <div className="nds-stack nds-p-4" data-spacing="sm">
    {tags.map((tag) => (
      <div key={tag} className="nds-text-body">
        {tag}
      </div>
    ))}
  </div>
</ScrollArea>`;
}

/**
 * Faixa horizontal. A `ScrollBar` horizontal é EXPLÍCITA: a vertical vem montada
 * pelo próprio componente, a do outro eixo é composta por quem escreve. Os
 * cartões não encolhem (`nds-shrink-0`) — sem isso o flex os espremeria para
 * caber e o transbordo, que é o assunto, deixaria de existir.
 */
function faixaHorizontal(itens: number): string {
  return `const cartoes = Array.from({ length: ${itens} }, (_, i) => \`Card \${i + 1}\`);

<ScrollArea
  size="sm"
  className="nds-w-lg nds-whitespace-nowrap nds-rounded-md nds-border-default"
>
  <div className="nds-cluster nds-p-4" data-spacing="sm">
    {cartoes.map((cartao) => (
      <div
        key={cartao}
        className="nds-shrink-0 nds-w-xs nds-rounded-md nds-bg-muted nds-p-4 nds-text-body"
      >
        {cartao}
      </div>
    ))}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>`;
}

/**
 * Tabela ampla — o caso dos dois eixos. A célula que não quebra linha é o que
 * faz a tabela passar da caixa: largura de tabela nasce do conteúdo, então não
 * há medida a cravar em lugar nenhum.
 */
function tabelaAmpla(linhas: number): string {
  return `const linhas = Array.from({ length: ${linhas} }, (_, i) => i + 1);
const colunas = Array.from({ length: 12 }, (_, i) => i + 1);

<ScrollArea size="lg" className="nds-w-lg nds-rounded-md nds-border-default">
  <table className="nds-border-collapse nds-text-caption">
    <tbody>
      {linhas.map((linha) => (
        <tr key={linha}>
          {colunas.map((coluna) => (
            <td
              key={coluna}
              className="nds-border-default nds-whitespace-nowrap nds-px-4 nds-py-2"
            >
              R{linha}·C{coluna}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
  <ScrollBar orientation="horizontal" />
</ScrollArea>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. O control de
 * direção troca a COMPOSIÇÃO, e não uma prop: o eixo que rola nasce do formato
 * do conteúdo, não de um atributo do componente. Imprimir sempre a lista
 * vertical enquanto o control diz "horizontal" mostraria um exemplo que não
 * rola no eixo que a story está ensinando.
 */
export const scrollAreaSource: SourceTransform<ScrollAreaArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  if (args.orientation === 'horizontal') {
    return jsxSnippet(IMPORT_COM_BARRA, faixaHorizontal(quantidade(args.itemCount, 12)));
  }
  if (args.orientation === 'both') {
    return jsxSnippet(IMPORT_COM_BARRA, tabelaAmpla(quantidade(args.itemCount, 12)));
  }
  return jsxSnippet(IMPORT_SIMPLES, listaVertical(quantidade(args.itemCount, 24)));
};

/** Horizontal: a direção é o assunto, e nenhum control a descreve neste arquivo. */
export function scrollAreaHorizontalSource(): string {
  return jsxSnippet(IMPORT_COM_BARRA, faixaHorizontal(12));
}

/**
 * Dois eixos ao mesmo tempo. É a mesma composição na variante de direção e na
 * matriz de dados — duplicá-la em duas funções faria as duas envelhecerem
 * separadas.
 */
export function scrollAreaTabelaSource(): string {
  return jsxSnippet(IMPORT_COM_BARRA, tabelaAmpla(15));
}

/**
 * Lista com divisor entre itens. O `Separator` fica FORA do item, entre um e o
 * seguinte, e some no último — linha depois do último item sugere que a lista
 * continua abaixo do que se vê, que é exatamente a leitura errada num conteúdo
 * que rola.
 */
export function scrollAreaListaDeTagsSource(): string {
  return jsxSnippet(
    `${IMPORT_SIMPLES}
import { Separator } from "@/components/ui/separator";`,
    `const versoes = Array.from({ length: 30 }, (_, i) => \`v1.0.\${i}\`);

<ScrollArea size="xl" className="nds-w-sm nds-rounded-md nds-border-default">
  <div className="nds-p-4">
    <h4 className="nds-mb-2 nds-text-body nds-font-medium">Tags</h4>
    {versoes.map((versao, i) => (
      <div key={versao}>
        <div className="nds-text-body nds-py-1">{versao}</div>
        {i < versoes.length - 1 && <Separator />}
      </div>
    ))}
  </div>
</ScrollArea>`,
  );
}

/**
 * Carrossel de cartões. A proporção da mídia vem de `nds-aspect-video`, e não de
 * uma altura em pixel: a faixa continua correta quando o tema troca a densidade
 * ou quando o cartão muda de largura.
 */
export function scrollAreaCarrosselSource(): string {
  return jsxSnippet(
    IMPORT_COM_BARRA,
    `const fotos = Array.from({ length: 12 }, (_, i) => i + 1);

<ScrollArea
  size="md"
  className="nds-w-lg nds-whitespace-nowrap nds-rounded-md nds-border-default"
>
  <div className="nds-cluster nds-p-4" data-spacing="md">
    {fotos.map((n) => (
      <figure key={n} className="nds-shrink-0 nds-w-xs">
        <div className="nds-aspect-video nds-rounded-md nds-bg-muted" />
        <figcaption className="nds-text-caption nds-text-muted-foreground nds-pt-2">
          Foto {n}
        </figcaption>
      </figure>
    ))}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>`,
  );
}

/**
 * Menu lateral rolável. A `<nav>` mora DENTRO da área: fora dela o nome da
 * região sobraria sobre uma caixa que não rola, e quem navega por marcos
 * chegaria à navegação sem alcançar os itens de baixo.
 */
export function scrollAreaMenuLateralSource(): string {
  return jsxSnippet(
    IMPORT_SIMPLES,
    `const secoes = [
  { nome: "Componentes", itens: ["Button", "Input", "Select", "Checkbox"] },
  { nome: "Layout", itens: ["Card", "ScrollArea", "Separator"] },
  { nome: "Sobreposição", itens: ["Dialog", "Sheet", "Popover", "Tooltip"] },
  { nome: "Feedback", itens: ["Alert", "Progress", "Skeleton"] },
];

<ScrollArea size="xl" className="nds-w-xs nds-rounded-md nds-border-default">
  <nav aria-label="Seções" className="nds-p-2">
    {secoes.map((secao) => (
      <div key={secao.nome} className="nds-mb-4">
        <div className="nds-mb-2 nds-text-caption nds-font-medium nds-uppercase nds-tracking-wide nds-text-muted-foreground">
          {secao.nome}
        </div>
        <ul className="nds-stack" data-spacing="xs">
          {secao.itens.map((item) => (
            <li key={item}>
              <a
                href={\`#\${item.toLowerCase()}\`}
                className="nds-block nds-rounded-md nds-px-2 nds-py-1 nds-text-body nds-hover-bg-muted-soft"
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </nav>
</ScrollArea>`,
  );
}

/**
 * Conteúdo focável dentro da área. O componente não reordena nem esconde nada:
 * os links continuam na ordem do documento, e o navegador traz para o campo
 * visível o que recebe foco. É por isso que a rolagem é a nativa.
 */
export function scrollAreaConteudoFocavelSource(): string {
  return jsxSnippet(
    IMPORT_SIMPLES,
    `const acoes = Array.from({ length: 20 }, (_, i) => i + 1);

<ScrollArea size="lg" className="nds-w-sm nds-rounded-md nds-border-default">
  <nav aria-label="Ações" className="nds-p-4">
    <ul className="nds-stack" data-spacing="xs">
      {acoes.map((n) => (
        <li key={n}>
          <a
            href={\`#acao-\${n}\`}
            className="nds-block nds-rounded-md nds-px-2 nds-py-1 nds-text-body nds-hover-bg-muted-soft"
          >
            Ação {n}
          </a>
        </li>
      ))}
    </ul>
  </nav>
</ScrollArea>`,
  );
}

/**
 * A ausência de teto de altura É o assunto: o par mostra o erro e a correção
 * lado a lado, porque sozinho o exemplo sem limite parece um componente com
 * defeito em vez de um componente ao qual ninguém disse até onde ir.
 */
export function scrollAreaSemAlturaSource(): string {
  return jsxSnippet(
    IMPORT_SIMPLES,
    `const itens = Array.from({ length: 24 }, (_, i) => \`Item \${i + 1}\`);

<div className="nds-stack nds-w-sm" data-spacing="lg">
  {/* Sem teto de altura o conteúdo expande e nada rola. */}
  <ScrollArea className="nds-w-full nds-rounded-md nds-border-default">
    <div className="nds-stack nds-p-4" data-spacing="sm">
      {itens.map((item) => (
        <div key={item} className="nds-text-body">
          {item}
        </div>
      ))}
    </div>
  </ScrollArea>

  {/* Com a escada de altura o mesmo conteúdo passa a rolar. */}
  <ScrollArea size="sm" className="nds-w-full nds-rounded-md nds-border-default">
    <div className="nds-stack nds-p-4" data-spacing="sm">
      {itens.map((item) => (
        <div key={item} className="nds-text-body">
          {item}
        </div>
      ))}
    </div>
  </ScrollArea>
</div>`,
  );
}
