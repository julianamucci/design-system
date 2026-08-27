/**
 * Transforms do painel Code do Editor.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 */
import { attrBool, attrs, asCode, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type EditorArgs = {
  content: string;
  editable: boolean;
  preset: 'basic' | 'advanced';
};

const IMPORT = `import { Editor, type EditorLabels } from '@/components/ui/editor'`;

/**
 * O objeto de rótulos, por extenso.
 *
 * Não dá para abreviar sem mentir: todo botão é só de ícone, não há texto
 * visível de onde deduzir nome nenhum, e por isso `labels` é obrigatório. Quem
 * copiar o exemplo precisa ver o tamanho real do compromisso.
 */
const LABELS_BLOCK = `const labels: EditorLabels = {
  toolbar: 'Formatação',
  editorField: 'Corpo do texto',
  groups: {
    marks: 'Marcas de texto', headings: 'Títulos', align: 'Alinhamento',
    lists: 'Listas', blocks: 'Blocos', actions: 'Ações', table: 'Tabela',
  },
  actions: {
    bold: 'Negrito', italic: 'Itálico', underline: 'Sublinhado',
    strike: 'Tachado', code: 'Código', highlight: 'Destaque',
    h1: 'Título 1', h2: 'Título 2', h3: 'Título 3',
    alignLeft: 'Alinhar à esquerda', alignCenter: 'Centralizar',
    alignRight: 'Alinhar à direita', alignJustify: 'Justificar',
    bulletList: 'Lista com marcadores', orderedList: 'Lista numerada',
    taskList: 'Lista de tarefas', blockquote: 'Citação',
    codeBlock: 'Bloco de código', link: 'Link', image: 'Inserir imagem',
    imageAlt: 'Texto alternativo', imageSmaller: 'Diminuir a imagem',
    imageLarger: 'Aumentar a imagem', imageNatural: 'Tamanho natural',
    table: 'Inserir tabela', horizontalRule: 'Linha divisória',
    undo: 'Desfazer', redo: 'Refazer', formula: 'Inserir fórmula',
    rowAfter: 'Inserir linha abaixo', columnAfter: 'Inserir coluna à direita',
    deleteRow: 'Excluir linha', deleteColumn: 'Excluir coluna',
    headerRow: 'Alternar linha de cabeçalho', deleteTable: 'Excluir tabela',
  },
  fields: {
    formula: 'Fórmula em LaTeX', formulaConfirm: 'Inserir',
    link: 'Endereço do link', linkConfirm: 'Aplicar',
    linkRemove: 'Tirar o link',
    alt: 'Descrição da imagem', altConfirm: 'Salvar descrição',
  },
}`;

const PLAYGROUND_CONTENT =
  '<p>Escreva aqui. A energia de repouso é <strong>E = mc²</strong>.</p>';

/** O mesmo pixel transparente que as stories inserem, embutido no documento. */
const PIXEL_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ'
  + 'AAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/**
 * O SFC completo: import, rótulos, conteúdo inicial e a tag.
 *
 * O conteúdo sai numa constante e entra por ligação, e não como atributo
 * literal: ele é HTML com aspas dentro, e um atributo cru precisaria de
 * escapagem que ninguém quer copiar.
 */
function build(options: {
  content: string;
  root?: Array<string | false>;
  extraScript?: string;
}): string {
  const script = [
    IMPORT,
    options.extraScript ?? '',
    '',
    LABELS_BLOCK,
    `const content = '${options.content.replace(/'/g, "\\'")}'`,
  ]
    .filter((line, index) => line !== '' || index > 0)
    .join('\n');
  const root = attrs(':labels="labels"', ':content="content"', ...(options.root ?? []));
  return vueSnippet(script, `<Editor${root} />`);
}

/**
 * Forma canônica: o editor com rótulos, conteúdo inicial e o HTML de volta a
 * cada mudança. O conjunto só entra no snippet quando difere do padrão.
 */
export const editorSource: SourceTransform<EditorArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  const preset = asCode(args.preset) === 'basic' ? 'basic' : 'advanced';
  return build({
    content: asCode(args.content) ?? PLAYGROUND_CONTENT,
    extraScript: `import { ref } from 'vue'\n\nconst html = ref('')`,
    root: [
      preset === 'basic' && 'preset="basic"',
      attrBool('editable', args.editable, true),
      '@change="html = $event"',
    ],
  });
};

/** Conjunto básico: ênfase, listas, link e desfazer. */
export function editorBasicSource(): string {
  return build({
    content: '<p>Comentário curto, com ênfase e uma lista.</p><ul><li>primeiro</li><li>segundo</li></ul>',
    root: ['preset="basic"'],
  });
}

/** Conjunto avançado — o padrão, e por isso o atributo não aparece. */
export function editorAdvancedSource(): string {
  return build({
    content: '<h2>Relatório</h2><p>Texto com <mark>destaque</mark> e <a href="https://exemplo.com">link</a>.</p>',
  });
}

/** Somente leitura: o conteúdo segue visível e navegável, a edição desliga. */
export function editorReadOnlySource(): string {
  return build({
    content: '<h2>Relatório</h2><p>Texto com <mark>destaque</mark> e <a href="https://exemplo.com">link</a>.</p>',
    root: [':editable="false"'],
  });
}

/** Documento que já chega com tabela — os botões dela aparecem no cursor. */
export function editorWithTableSource(): string {
  return build({
    content: '<p>Antes.</p><table><tbody><tr><th>Nome</th><th>Valor</th></tr><tr><td>a</td><td>1</td></tr></tbody></table>',
  });
}

/** Documento que já chega com imagem, e ela entra com descrição escrita. */
export function editorWithImageSource(): string {
  return build({
    content: `<p>Antes.</p><img src="${PIXEL_DATA_URL}" alt="Ponto de exemplo">`,
  });
}

/**
 * O armazenamento é de quem consome: o resolvedor devolve a URL a gravar, e
 * `null` recusa a inserção sem erro nenhum.
 */
export function editorCustomImageStorageSource(): string {
  return build({
    content: '<p>O armazenamento da imagem é decisão de quem consome.</p>',
    extraScript: `const enviarAoCdn = async (file: File) => {
  if (file.size > 1024) return null
  return \`https://cdn.exemplo.com/\${file.name}\`
}`,
    root: [':resolve-image="enviarAoCdn"'],
  });
}

/**
 * A descrição automática: a imagem entra na hora e o texto alternativo chega
 * quando o serviço responder. A proposta é conferida por quem publica.
 */
export function editorAiImageDescriptionSource(): string {
  return build({
    content: '<p>A IA propõe a descrição; quem publica confere.</p>',
    extraScript: `const descrever = async (file: File | null, src: string) => {
  const nome = file ? file.name : src.slice(src.lastIndexOf('/') + 1)
  return \`Descrição automática de \${nome}\`
}`,
    root: [':describe-image="descrever"'],
  });
}
