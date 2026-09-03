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
 * Os rótulos, por INTEIRO — e são muitos de propósito.
 *
 * Não cabe resumir, e não é falta de economia: `groups` e `actions` são
 * `Record` de união fechada, então um objeto pela metade nem compila para quem
 * copia. E o custo de resumir seria pior que o de compilar — todos os botões
 * são só de ícone, e cada entrada que faltasse aqui é um botão sem nome
 * acessível na tela, que é exatamente o que o axe reprova na regra
 * `button-name`. É a mesma razão de `labels` ser a única prop obrigatória.
 */
const LABELS_BLOCK = [
  'const labels = {',
  '  toolbar: "Formatação",',
  '  // A moldura inteira é o campo, e não há rótulo visível a que apontar.',
  '  editorField: "Corpo do texto",',
  '  groups: {',
  '    marks: "Marcas de texto",',
  '    headings: "Títulos",',
  '    align: "Alinhamento",',
  '    lists: "Listas",',
  '    blocks: "Blocos",',
  '    actions: "Ações",',
  '    table: "Tabela",',
  '  },',
  '  actions: {',
  '    bold: "Negrito",',
  '    italic: "Itálico",',
  '    underline: "Sublinhado",',
  '    strike: "Tachado",',
  '    code: "Código",',
  '    highlight: "Destaque",',
  '    h1: "Título 1",',
  '    h2: "Título 2",',
  '    h3: "Título 3",',
  '    alignLeft: "Alinhar à esquerda",',
  '    alignCenter: "Centralizar",',
  '    alignRight: "Alinhar à direita",',
  '    alignJustify: "Justificar",',
  '    bulletList: "Lista com marcadores",',
  '    orderedList: "Lista numerada",',
  '    taskList: "Lista de tarefas",',
  '    blockquote: "Citação",',
  '    codeBlock: "Bloco de código",',
  '    link: "Inserir link",',
  '    image: "Inserir imagem",',
  '    table: "Inserir tabela",',
  '    horizontalRule: "Linha divisória",',
  '    undo: "Desfazer",',
  '    redo: "Refazer",',
  '    formula: "Inserir fórmula",',
  '    // Só aparecem com uma imagem selecionada.',
  '    imageAlt: "Texto alternativo",',
  '    imageSmaller: "Diminuir a imagem",',
  '    imageLarger: "Aumentar a imagem",',
  '    imageNatural: "Tamanho natural",',
  '    // Só aparecem com o cursor DENTRO de uma tabela.',
  '    rowAfter: "Inserir linha abaixo",',
  '    columnAfter: "Inserir coluna à direita",',
  '    deleteRow: "Excluir linha",',
  '    deleteColumn: "Excluir coluna",',
  '    headerRow: "Alternar linha de cabeçalho",',
  '    deleteTable: "Excluir tabela",',
  '  },',
  '  fields: {',
  '    formula: "Fórmula em LaTeX",',
  '    formulaConfirm: "Inserir",',
  '    link: "Endereço do link",',
  '    linkConfirm: "Aplicar",',
  '    linkRemove: "Tirar o link",',
  '    alt: "Descrição da imagem",',
  '    altConfirm: "Salvar descrição",',
  '  },',
  '};',
].join('\n');

/**
 * O par de estado do documento.
 *
 * `onChange` devolve o HTML a cada mudança, e guardá-lo é de quem consome — o
 * componente não guarda documento. O nome precisa EXISTIR no snippet: a versão
 * anterior passava `onChange={setHtml}` sem nunca declarar o par.
 */
const STATE_BLOCK = 'const [html, setHtml] = useState("");';

/** O import de estado, só nos ramos que declaram o par. */
const IMPORT_STATE = 'import { useState } from "react";';

/**
 * O armazenamento próprio, declarado.
 *
 * O teto e o envio são de quem consome — a que bucket, com que política, com
 * que limite —, mas os nomes precisam EXISTIR: `MAX_BYTES` e `enviarAoCdn`
 * apareciam na chamada sem nunca serem declarados.
 */
const STORAGE_BLOCK = [
  '// O teto e o destino são de quem consome: devolver nulo é RECUSA, e não erro.',
  'const MAX_BYTES = 2 * 1024 * 1024;',
  'const enviarAoCdn = async (file: File): Promise<string | null> => { /* … */ };',
].join('\n');

/** A descrição automática, declarada. Quem liga o modelo de visão é quem consome. */
const DESCRIBE_BLOCK = [
  '// O arquivo vem nulo para imagem colada de outra página, que chega só como',
  '// endereço: quem precisa dos bytes devolve nulo nesse caso.',
  'const descrever = async (file: File | null, src: string): Promise<string | null> => { /* … */ };',
].join('\n');

/**
 * O preâmbulo do snippet: os imports, o estado e os rótulos.
 *
 * Entra em TODOS os ramos, e é o que os torna copiáveis.
 */
function preamble(blocks: string[] = [], withState = true): string {
  const head = withState ? [IMPORT_STATE, IMPORTS] : [IMPORTS];
  const partes = [...(withState ? [STATE_BLOCK] : []), LABELS_BLOCK, ...blocks].flatMap(
    (bloco) => ['', bloco],
  );
  return [head.join('\n'), ...partes].join('\n');
}

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
    preamble(),
    editorTag(['labels={labels}', contentAttr(html), ...extra, 'onChange={setHtml}']),
  );
}

/** Playground: acompanha os controls de conteúdo, edição e conjunto. */
export const editorSource: SourceTransform<EditorArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return jsxSnippet(
    preamble(),
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
    // Sem `onChange` não há documento a guardar, então o par de estado não
    // entra: declarar o que o exemplo não usa ensina a escrever por hábito.
    preamble([], false),
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
    preamble([STORAGE_BLOCK]),
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
    preamble([DESCRIBE_BLOCK]),
    editorTag([
      'labels={labels}',
      contentAttr('<p>A IA propõe a descrição; quem publica confere.</p>'),
      'describeImage={(file, src) => descrever(file, src)}',
      'onChange={setHtml}',
    ]),
  );
