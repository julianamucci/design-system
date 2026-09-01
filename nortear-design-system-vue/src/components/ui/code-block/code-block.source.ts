/**
 * Transforms do painel Code do CodeBlock.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * Quase toda story do componente monta `<CodeBlock v-bind="args" />` e muda só
 * os args — por isso a transform do `meta` lê os args e serve o arquivo inteiro.
 * Só as stories que trocam a própria composição declaram a sua.
 */
import {
  attr,
  attrBool,
  attrsMultilinha,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type CodeBlockArgs = {
  code: string;
  language: string;
  title: string;
  showLineNumbers: boolean;
  highlightLines: string | Array<number | string>;
  footer: string;
};

const IMPORT = `import { CodeBlock } from '@/components/ui/code-block'`;

/** Trecho de partida quando o control não trouxer código utilizável. */
const CODE_DEFAULT = `const items = await load();
const total = items.length;
render(items, total);`;

/**
 * O código vira um literal do `script setup`.
 *
 * Uma linha sem aspas simples cabe numa string comum; o resto vira literal de
 * crase. Nos dois casos o `</script` do conteúdo sai escapado: sem isso o
 * parser do SFC fecharia o bloco de script no meio da string, e o exemplo
 * deixaria de compilar no primeiro colar — a armadilha é exatamente a que
 * `END_SCRIPT` evita neste repositório.
 */
function codeLiteral(code: string): string {
  const scriptNoEnd = (text: string) => text.replace(/<\/script/gi, '<\\/script');
  if (!code.includes('\n') && !code.includes("'") && !code.includes('\\')) {
    return `'${scriptNoEnd(code)}'`;
  }
  const escapado = code
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  return `\`${scriptNoEnd(escapado)}\``;
}

/**
 * Linhas destacadas. A entrada aceita as duas formas documentadas: o texto
 * `'3, 5-7'` vira atributo comum, e a lista `[2]` vira ligação — escrita com
 * aspas simples por dentro, porque o valor do atributo já usa as duplas.
 */
function attrLinhas(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim() === '' ? '' : `highlight-lines="${value}"`;
  }
  if (Array.isArray(value) && value.length > 0) {
    const list = value
      .map((item) => (typeof item === 'number' ? String(item) : `'${String(item)}'`))
      .join(', ');
    return `:highlight-lines="[${list}]"`;
  }
  return '';
}

/** O bloco, com os atributos em uma linha cada quando a fila fica longa. */
function block(code: string, partes: Array<string | false>): string {
  const attrs = attrsMultilinha([`:code="${code}"`, ...partes]);
  return attrs.startsWith('\n') ? `<CodeBlock${attrs}/>` : `<CodeBlock${attrs} />`;
}

/**
 * Transform de arquivo: o bloco recebendo o que os args descrevem.
 *
 * Todo control passa por `attr`/`attrBool`/`attrLinhas`, que descartam o que
 * não for do tipo esperado — o Storybook troca arg de ação por um espião, e o
 * corpo do mock interpolado apareceria no painel como se fosse o exemplo.
 *
 * `language` nasce em `text`, `show-line-numbers` em ligado: nenhum dos dois
 * entra no snippet quando o valor bate com o padrão do componente.
 */
export const codeBlockSource: SourceTransform<CodeBlockArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const code = typeof args.code === 'string' && args.code !== '' ? args.code : CODE_DEFAULT;
  return vueSnippet(
    `${IMPORT}\n\nconst source = ${codeLiteral(code)}`,
    block('source', [
      attr('language', args.language, 'text'),
      attr('title', args.title),
      attrBool('show-line-numbers', args.showLineNumbers, true),
      attrLinhas(args.highlightLines),
      attr('footer', args.footer),
    ]),
  );
};

/**
 * Trecho de diferencial: a segunda linha sai e a terceira entra no lugar dela.
 *
 * É o menor trecho em que as TRÊS espécies convivem — sem a linha de contexto
 * ao lado das duas marcadas, o exemplo não mostraria que a linha inalterada
 * continua sem marca e sem palavra.
 */
const DIFF_CODE = `const items = await load();
const total = items.length;
const total = items.filter(Boolean).length;
render(items, total);`

/**
 * Espécie por linha.
 *
 * Forma própria, e não a transform do meta, porque `lineKinds` é indexado por
 * LINHA: o exemplo só ensina alguma coisa se a lista e o trecho aparecerem
 * juntos, e um trecho vindo dos controls os separaria.
 */
export function codeBlockLineKindsSource(): string {
  return vueSnippet(
    `${IMPORT}\n\nconst source = ${codeLiteral(DIFF_CODE)}`,
    block('source', [
      attr('language', 'ts'),
      `:line-kinds="['context', 'removed', 'added', 'context']"`,
    ]),
  )
}

/**
 * Fila de controles no cabeçalho.
 *
 * O que o exemplo ensina é a ORDEM: quem compõe entrega os controles pelo
 * encaixe nomeado e o componente os põe ANTES do copiar, que segue ancorado no
 * canto do bloco (WCAG 3.2.4). Forma própria porque encaixe não é atributo, e
 * a transform do meta só sabe montar atributos.
 */
export function codeBlockHeaderActionsSource(): string {
  return vueSnippet(
    `import { Button } from '@/components/ui/button'
${IMPORT}

const source = ${codeLiteral(CODE_DEFAULT)}`,
    `<CodeBlock :code="source" language="ts" title="lista.ts">
  <template #actions>
    <Button variant="ghost" size="sm">Executar</Button>
  </template>
</CodeBlock>`,
  )
}

const PALETTE_TRECHOS = `const trechos = [
  {
    language: 'ts',
    code: \`const total = Math.max(items.length, 10); // soma
render(items, total);\`,
  },
  { language: 'html', code: '<button class="nds-button" disabled>Salvar</button>' },
  { language: 'css', code: '@media (min-width: 40rem) { .nds-card { --gap: 8px; } }' },
  { language: 'json', code: '{ "port": 6006, "open": true, "nome": "docs" }' },
  { language: 'bash', code: 'npm run build -- --mode production # publica' },
]`;

/**
 * Paleta de sintaxe: um bloco por linguagem, mais um com linha em destaque.
 *
 * São os dois fundos possíveis do componente — a superfície e a linha marcada —
 * e é contra eles que as onze cores da paleta são medidas. Um trecho só acende
 * cinco delas, por isso a lista.
 */
export function codeBlockPaletteSource(): string {
  return vueSnippet(
    `${IMPORT}

${PALETTE_TRECHOS}

const destacado = \`const items = await load();
const total = items.length;
render(items, total);\``,
    `<div class="nds-stack" data-spacing="md">
  <CodeBlock
    v-for="trecho in trechos"
    :key="trecho.language"
    :code="trecho.code"
    :language="trecho.language"
    :show-line-numbers="false"
  />
  <CodeBlock :code="destacado" language="ts" :highlight-lines="[2]" />
</div>`,
  );
}

/**
 * Conteúdo longo nos dois eixos. Não há prop a ligar — a região de rolagem é do
 * próprio componente, e o que o exemplo mostra é conteúdo que a estoura.
 *
 * O trecho é gerado, e não colado: quarenta linhas literais no painel afogariam
 * a lição, que é o bloco aguentar o que não cabe.
 */
export function codeBlockRolagemSource(): string {
  return vueSnippet(
    `${IMPORT}

const consulta =
  'formato=json&incluirDetalhes=true&ordenarPor=dataCriacao&limite=100&pagina=1'
const rotas = Array.from(
  { length: 40 },
  (_, i) => \`const rota\${i} = "/api/v1/relatorios/consolidado/por-periodo/\${i}?\${query}";\`,
).join('\\n')`,
    block('rotas', [attr('language', 'ts')]),
  );
}

/**
 * Bloco que sai da tela antes do fim da confirmação de cópia.
 *
 * O que o exemplo ensina é que não há nada a fazer: o componente cancela o
 * próprio temporizador ao ser desmontado. Alternar em vez de só remover é o que
 * deixa o exemplo servir duas vezes.
 */
export function codeBlockRemovidoSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
import { Button } from '@/components/ui/button'
${IMPORT}

const visivel = ref(true)
const source = \`${CODE_DEFAULT}\``,
    `<div class="nds-stack" data-spacing="md">
  <CodeBlock v-if="visivel" :code="source" language="ts" />
  <Button variant="outline" @click="visivel = !visivel">
    {{ visivel ? 'Remover o bloco' : 'Restaurar o bloco' }}
  </Button>
</div>`,
  );
}
