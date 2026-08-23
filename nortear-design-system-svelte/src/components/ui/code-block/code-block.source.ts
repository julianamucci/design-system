/**
 * Transforms do painel Code do CodeBlock.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 */
import { svelteSnippet } from '@/lib/story-source';

export type CodeBlockArgs = {
  code: string;
  language: string;
  title: string;
  showLineNumbers: boolean;
  highlightLines: string | Array<number | string>;
  footer: string;
};

const IMPORT = 'import { CodeBlock } from "@/components/ui/code-block";';

/**
 * O trecho exibido não entra no snippet: ele tem quebras de linha e viraria o
 * assunto da amostra, no lugar da configuração do bloco.
 */
const FONTE = 'const source = "…";';

/** As duas formas aceitas de `highlightLines`: texto entre aspas, lista entre chaves. */
function highlight(value: string | Array<number | string>): string {
  if (Array.isArray(value)) {
    const items = value.map((item) => (typeof item === 'number' ? String(item) : `'${item}'`));
    return `highlightLines={[${items.join(', ')}]}`;
  }
  return `highlightLines="${value}"`;
}

/** Uma linha por atributo: a lista do bloco cresce com a configuração. */
function block(props: string[]): string {
  return `<CodeBlock\n${props.map((prop) => `  ${prop}`).join('\n')}\n/>`;
}

/**
 * Forma canônica: um bloco configurado pelos args da story.
 *
 * Serve o Playground e cascateia para as stories de linguagem, configuração e
 * arranjo, que também são declaradas por `args`.
 */
export function codeBlockSource(_gerado?: string, ctx?: { args?: Partial<CodeBlockArgs> }): string {
  const a = ctx?.args ?? {};
  const checked = a.highlightLines;

  const props = [
    'code={source}',
    `language="${a.language ?? 'text'}"`,
    a.title ? `title="${a.title}"` : '',
    a.showLineNumbers === false ? 'showLineNumbers={false}' : '',
    checked && (!Array.isArray(checked) || checked.length > 0) ? highlight(checked) : '',
    a.footer ? `footer="${a.footer}"` : '',
  ].filter((prop): prop is string => Boolean(prop));

  return svelteSnippet(`${IMPORT}\n${FONTE}`, block(props));
}

/**
 * Stories `LightPalette` e `DarkPalette`: vários blocos empilhados, um por
 * linguagem, mais um com linha em destaque — os dois fundos que a paleta de
 * sintaxe precisa atravessar.
 */
export function codeBlockPaletteSource(): string {
  return svelteSnippet(
    `${IMPORT}

const trechos = [
  { language: 'ts', code: 'const total = items.length;' },
  { language: 'css', code: '.nds-card { padding: var(--spacing-4); }' },
  { language: 'json', code: '{ "port": 6008, "open": true }' },
];
const destacado = "…";`,
    `<div class="nds-stack" data-spacing="md">
  {#each trechos as trecho (trecho.language)}
    <CodeBlock
      code={trecho.code}
      language={trecho.language}
      showLineNumbers={false}
    />
  {/each}
  <CodeBlock code={destacado} language="ts" highlightLines={[2]} />
</div>`,
  );
}

/**
 * Story `RemovedBeforeFeedback`: o bloco sai da tela antes de o feedback de
 * cópia terminar. Quem monta e desmonta o bloco por condição precisa saber que
 * o temporizador da confirmação é cancelado sozinho.
 */
export function codeBlockRemovivelSource(): string {
  return svelteSnippet(
    `${IMPORT}
import { Button } from "@/components/ui/button";

${FONTE}
let visivel = $state(true);`,
    `<div class="nds-stack" data-spacing="md">
  {#if visivel}
    <CodeBlock code={source} language="ts" />
  {/if}
  <Button variant="outline" onclick={() => (visivel = !visivel)}>
    {visivel ? "Remover o bloco" : "Restaurar o bloco"}
  </Button>
</div>`,
  );
}
