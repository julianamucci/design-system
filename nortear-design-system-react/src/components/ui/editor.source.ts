/**
 * Transforms do painel Code do Editor.
 *
 * Módulo de TS puro — o `.tsx` não entra aqui. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta e NÃO entra no snippet: o registro da
 * instância que a play usa para dirigir o documento, os dublês de armazenamento
 * e de descrição escritos para o teste, e o `fn()` da aba Actions.
 *
 * A decisão de composição: `labels` aparece SEMPRE. Todos os botões são só de
 * ícone, e sem o objeto de rótulos a barra não tem nome acessível nenhum — é a
 * única prop obrigatória, e o snippet que a omitisse ensinaria um editor que o
 * axe reprova.
 */
import { jsxSnippet, propBool, propOption, type SourceTransform } from '@/lib/story-source';

export type EditorArgs = {
  content: string;
  editable: boolean;
  preset: 'basic' | 'advanced';
};

const IMPORTS = 'import { Editor } from "@/components/ui/editor";';

/**
 * Conteúdo inicial como atributo de aspas SIMPLES.
 *
 * O HTML de exemplo carrega aspas duplas (`<a href="…">`), e em JSX o atributo
 * de aspas duplas terminaria ali. Aspas simples são JSX válido e evitam uma
 * escapagem que ninguém escreveria à mão.
 */
function contentAttr(html: string | undefined): string | undefined {
  return typeof html === 'string' && html.trim() ? `content='${html}'` : undefined;
}

/** Um atributo por linha — a fila de props do editor passa de qualquer limite. */
function editorTag(parts: Array<string | false | null | undefined>): string {
  const list = parts.filter((part): part is string => Boolean(part));
  return `<Editor\n${list.map((part) => `  ${part}`).join('\n')}\n/>`;
}

/** O uso mínimo: rótulos, conteúdo inicial e o HTML de volta a cada mudança. */
function basicUse(html: string, extra: Array<string | false | null | undefined> = []): string {
  return jsxSnippet(
    IMPORTS,
    editorTag(['labels={labels}', contentAttr(html), ...extra, 'onChange={setHtml}']),
  );
}

/** Playground: acompanha os controls de conteúdo, edição e conjunto. */
export const editorSource: SourceTransform<EditorArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return jsxSnippet(
    IMPORTS,
    editorTag([
      'labels={labels}',
      contentAttr(args.content),
      propOption('preset', args.preset, ['basic', 'advanced'] as const, 'advanced'),
      propBool('editable', args.editable, true),
      'onChange={setHtml}',
    ]),
  );
};

/** Conjunto básico: ênfase, listas, link e desfazer. */
export const editorBasicSource: SourceTransform<EditorArgs> = () =>
  basicUse(
    '<p>Comentário curto, com ênfase e uma lista.</p><ul><li>primeiro</li><li>segundo</li></ul>',
    ['preset="basic"'],
  );

/** Conjunto avançado: o padrão, com títulos, imagem, tabela e fórmula. */
export const editorAdvancedSource: SourceTransform<EditorArgs> = () =>
  basicUse(
    '<h2>Relatório</h2><p>Texto com <mark>destaque</mark> e <a href="https://exemplo.com">link</a>.</p>',
  );

/** Somente leitura: o conteúdo continua navegável, a barra deixa de agir. */
export const editorReadOnlySource: SourceTransform<EditorArgs> = () =>
  jsxSnippet(
    IMPORTS,
    editorTag([
      'labels={labels}',
      contentAttr(
        '<h2>Relatório</h2><p>Texto com <mark>destaque</mark> e <a href="https://exemplo.com">link</a>.</p>',
      ),
      'editable={false}',
    ]),
  );

/** Cursor dentro de uma tabela: o bloco de tabela revela os seis botões. */
export const editorWithTableSource: SourceTransform<EditorArgs> = () =>
  basicUse(
    '<p>Antes.</p><table><tbody><tr><th>Nome</th><th>Valor</th></tr><tr><td>a</td><td>1</td></tr></tbody></table>',
  );

/** Imagem selecionada: o bloco de imagem revela descrição e tamanho. */
export const editorWithImageSource: SourceTransform<EditorArgs> = () =>
  basicUse('<p>Antes.</p><img src="/exemplo.png" alt="Ponto de exemplo">');

/**
 * Armazenamento próprio: quem consome decide de onde sai o endereço da imagem.
 *
 * O padrão embute o arquivo em base64 e serve para prototipar. Aqui o
 * resolvedor envia a um CDN e RECUSA arquivo acima do limite — devolver nulo é
 * recusa, não erro.
 */
export const editorCustomImageStorageSource: SourceTransform<EditorArgs> = () =>
  jsxSnippet(
    IMPORTS,
    editorTag([
      'labels={labels}',
      contentAttr('<p>O armazenamento da imagem é decisão de quem consome.</p>'),
      'resolveImage={async (file) =>\n    file.size > MAX_BYTES ? null : enviarAoCdn(file)\n  }',
      'onChange={setHtml}',
    ]),
  );

/**
 * Descrição automática: quem consome liga um modelo de visão.
 *
 * A imagem entra na hora, com o nome do arquivo segurando a vaga; a descrição
 * substitui o provisório quando chega. O arquivo vem nulo para imagem colada de
 * outra página, que chega só como endereço.
 */
export const editorAiImageDescriptionSource: SourceTransform<EditorArgs> = () =>
  jsxSnippet(
    IMPORTS,
    editorTag([
      'labels={labels}',
      contentAttr('<p>A IA propõe a descrição; quem publica confere.</p>'),
      'describeImage={(file, src) => descrever(file, src)}',
      'onChange={setHtml}',
    ]),
  );
