/**
 * Transforms do painel Code do CodeBlock.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * Aqui há uma armadilha própria do componente: o trecho a exibir chega por prop
 * de TEXTO, e o painel imprime código dentro de código. O snippet declara o
 * trecho num template literal nomeado e passa `code={source}` — colar
 * `code="const items = await load();\nconst total = …"` numa linha só é a forma
 * mais rápida de quem lê perder as quebras de linha.
 */
import { jsxSnippet, propBool, propTexto, texto, type SourceTransform } from '@/lib/story-source';

export type CodeBlockArgs = {
  code: string;
  language: string;
  title: string;
  showLineNumbers: boolean;
  highlightLines: string | ReadonlyArray<number | string>;
  footer: string;
};

const IMPORT = 'import { CodeBlock } from "@/components/ui/code-block";';

/** Trecho base das stories: curto, real e com uma chamada por linha. */
const CODIGO_BASE = `const items = await load();
const total = items.length;
render(items, total);`;

/**
 * O trecho vira template literal, então crase, contrabarra e `${` precisam sair
 * escapados — sem isso o snippet publicado abre uma interpolação que quem copia
 * não escreveu.
 */
function literalDeTemplate(codigo: string): string {
  return codigo
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

/** Cabeçalho: import mais a declaração do trecho que a prop `code` recebe. */
function cabecalhoCom(codigo: string): string {
  return `${IMPORT}

const source = \`${literalDeTemplate(codigo)}\`;`;
}

/**
 * `highlightLines` aceita as duas formas da API: a string `"1, 4-5"`, que é a do
 * control, e o array `[3, "5-7"]`. Valor de outro tipo não vira atributo
 * inventado.
 */
function propLinhas(valor: unknown): string | undefined {
  if (typeof valor === 'string') {
    const limpo = valor.trim();
    return limpo ? `highlightLines="${limpo}"` : undefined;
  }
  if (Array.isArray(valor)) {
    const itens = (valor as ReadonlyArray<unknown>)
      .filter(
        (item): item is number | string =>
          (typeof item === 'number' && Number.isFinite(item)) ||
          (typeof item === 'string' && item.trim() !== ''),
      )
      .map((item) => (typeof item === 'number' ? String(item) : `"${item.trim()}"`));
    return itens.length ? `highlightLines={[${itens.join(', ')}]}` : undefined;
  }
  return undefined;
}

/**
 * `<CodeBlock … />` em uma linha enquanto couber, e um atributo por linha quando
 * não couber. `code={source}` vem sempre primeiro: é a única prop obrigatória.
 */
function tagCodeBlock(partes: Array<string | false | undefined>): string {
  const lista = ['code={source}', ...partes].filter((parte): parte is string => Boolean(parte));
  const emLinha = lista.join(' ');
  if (emLinha.length <= 56) return `<CodeBlock ${emLinha} />`;
  return `<CodeBlock\n${lista.map((parte) => `  ${parte}`).join('\n')}\n/>`;
}

/**
 * Transform do `meta` — vale para todas as stories dos quatro arquivos. O
 * componente é inteiramente dirigido por props, então cada story alimenta este
 * mesmo snippet pelos seus `args`: linguagem, título, numeração, destaque e
 * rodapé saem daqui sem override nenhum. `showLineNumbers` só aparece quando é
 * `false`, porque o padrão do componente é `true`.
 */
export const codeBlockSource: SourceTransform<CodeBlockArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return jsxSnippet(
    cabecalhoCom(texto(args.code) ?? CODIGO_BASE),
    tagCodeBlock([
      propTexto('language', args.language),
      propTexto('title', args.title),
      propBool('showLineNumbers', args.showLineNumbers, true),
      propLinhas(args.highlightLines),
      propTexto('footer', args.footer),
    ]),
  );
};

/**
 * Rolagem nos dois eixos. O trecho da story é gerado com 40 linhas longas, e
 * despejá-lo no painel seria uma parede de texto que não ensina nada: o que o
 * leitor precisa saber é que não existe prop de rolagem — a região rola sozinha
 * e recebe foco pelo teclado quando o trecho não cabe.
 */
export function codeBlockRolagemSource(): string {
  return jsxSnippet(
    cabecalhoCom(`const registro = { id: 1, nome: "linha propositalmente longa para forçar o scroll horizontal do bloco", ativo: true };
const total = 40;
render(registro, total);`),
    tagCodeBlock([propTexto('language', 'ts')]),
  );
}

/**
 * Paleta de sintaxe. As cores são custom properties da raiz e trocam com o tema
 * — as duas stories de paleta mostram o MESMO código, e o que muda entre elas é
 * o tema do toolbar, não uma prop. Por isso as duas compartilham este snippet.
 */
export function codeBlockPaletaSource(): string {
  return jsxSnippet(
    cabecalhoCom(CODIGO_BASE),
    tagCodeBlock([propTexto('language', 'ts'), propLinhas([2])]),
  );
}

/**
 * Bloco que sai da tela. A story existe para provar que o temporizador do
 * "Copiado!" é cancelado no unmount — o que se ensina aqui é a montagem
 * condicional, porque a limpeza é do componente e não pede nada de quem usa.
 */
export function codeBlockRemovivelSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORT}
import { Button } from "@/components/ui/button";

const source = \`${literalDeTemplate(CODIGO_BASE)}\`;`,
    `function TrechoOpcional() {
  const [visivel, setVisivel] = useState(true);

  return (
    <div className="nds-stack" data-spacing="md">
      {visivel && <CodeBlock code={source} language="ts" />}
      <Button variant="outline" onClick={() => setVisivel((atual) => !atual)}>
        {visivel ? "Remover o bloco" : "Restaurar o bloco"}
      </Button>
    </div>
  );
}`,
  );
}
