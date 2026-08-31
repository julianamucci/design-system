// Snippets do painel Code do Editor.
//
// O painel imprime o `template` da story como está escrito — com os bindings
// ligados aos args e com a `<div class="nds-w-full">` que só existe para a
// story ocupar a largura da tela. Isso é andaime, não o que alguém escreve para
// usar o componente. Estas funções devolvem o uso real, com os valores atuais
// dos controls já resolvidos.
//
// Vive num arquivo próprio, e não solto na story, porque QUATRO arquivos de
// story mostram o mesmo componente: repetir o construtor em cada um é como as
// cópias divergem sem ninguém notar. É também o que permite ao módulo rodar em
// TS puro, sem o compilador de template no caminho.
//
// A decisão de composição: `[labels]` aparece SEMPRE. Todos os botões são só de
// ícone, e sem o objeto de rótulos a barra não tem nome acessível nenhum — é a
// única prop obrigatória, e um snippet que a omitisse ensinaria um editor que o
// axe reprova.

/** Os controls do Playground, na forma em que o `transform` os recebe. */
export type EditorArgs = {
  content?: string;
  editable?: boolean;
  preset?: 'basic' | 'advanced';
};

export type EditorSnippetOptions = {
  /** Conteúdo inicial. Vira o campo `html` da classe do exemplo. */
  content?: string;
  preset?: 'basic' | 'advanced';
  editable?: boolean;
  /** Atributos extras da tag, um por linha, já escritos como no template. */
  extraAttrs?: readonly string[];
  /** Membros extras da classe do exemplo, um bloco por entrada. */
  extraMembers?: readonly string[];
};

/**
 * O conteúdo como campo da CLASSE, e não como atributo estático.
 *
 * É o que alguém escreve de verdade: o HTML de exemplo carrega aspas duplas
 * (`<a href="…">`), e enfiá-lo num atributo de template pediria uma escapagem
 * que ninguém escreve à mão. Como campo, ele também é o destino natural do
 * `(changed)`.
 */
function contentField(html: string): string {
  return `  html = '${html}';`;
}

/**
 * Os rótulos como MEMBRO da classe, e não como constante do módulo.
 *
 * Expressão de template só enxerga membro de classe: um objeto declarado ao
 * lado do componente é invisível para o binding, e quem copiasse receberia um
 * nome que não resolve. É também a única prop obrigatória — todos os botões
 * são só de ícone, e sem ela a barra não tem nome acessível nenhum.
 */
const LABELS_MEMBER = '  readonly labels = editorLabels();';

/** O uso real do editor, com só o que difere do padrão. */
export function editorSnippet(options: EditorSnippetOptions = {}): string {
  const {
    content,
    preset = 'advanced',
    editable = true,
    extraAttrs = [],
    extraMembers = [],
  } = options;

  // Só o que difere do padrão entra: snippet que repete valor padrão ensina
  // ruído a quem copia.
  const attrs = [
    '[labels]="labels"',
    content === undefined ? '' : '[content]="html"',
    preset === 'advanced' ? '' : `preset="${preset}"`,
    editable ? '' : '[editable]="false"',
    ...extraAttrs,
    // Em somente leitura não há mudança a receber: o `(changed)` seria uma
    // saída que nunca emite.
    editable && content !== undefined ? '(changed)="html = $event"' : '',
  ].filter(Boolean);

  const members = [
    LABELS_MEMBER,
    content === undefined ? '' : contentField(content),
    ...extraMembers,
  ].filter(Boolean);

  const body = members.length > 0 ? `\n${members.join('\n\n')}\n` : '';

  return `import { EditorComponent } from '@/components/ui/editor';

@Component({
  imports: [EditorComponent],
  template: \`
    <nds-editor
      ${attrs.join('\n      ')}
    />
  \`,
})
export class Exemplo {${body}}`;
}

/**
 * Playground: acompanha os controls de conteúdo, edição e conjunto.
 *
 * A assinatura é a do `transform` do Storybook — o primeiro argumento é o código
 * gerado, que aqui se descarta inteiro.
 */
export function editorSource(
  _generated: string,
  context: { args?: EditorArgs } = {},
): string {
  const args = context.args ?? {};
  return editorSnippet({
    content: args.content,
    preset: args.preset,
    editable: args.editable,
  });
}

/** Conjunto básico: ênfase, listas, link, desfazer e fórmula. */
export function editorBasicSource(): string {
  return editorSnippet({
    content:
      '<p>Comentário curto, com ênfase e uma lista.</p><ul><li>primeiro</li><li>segundo</li></ul>',
    preset: 'basic',
  });
}

/** Conjunto avançado: o padrão, com títulos, imagem, tabela e fórmula. */
export function editorAdvancedSource(): string {
  return editorSnippet({
    content:
      '<h2>Relatório</h2><p>Texto com <mark>destaque</mark> e '
      + '<a href="https://exemplo.com">link</a>.</p>',
  });
}

/** Somente leitura: o conteúdo continua navegável, a barra deixa de agir. */
export function editorReadOnlySource(): string {
  return editorSnippet({
    content:
      '<h2>Relatório</h2><p>Texto com <mark>destaque</mark> e '
      + '<a href="https://exemplo.com">link</a>.</p>',
    editable: false,
  });
}

/** Cursor dentro de uma tabela: o bloco de tabela revela os seis botões. */
export function editorWithTableSource(): string {
  return editorSnippet({
    content:
      '<p>Antes.</p><table><tbody><tr><th>Nome</th><th>Valor</th></tr>'
      + '<tr><td>a</td><td>1</td></tr></tbody></table>',
  });
}

/** Imagem selecionada: o bloco de imagem revela descrição e tamanho. */
export function editorWithImageSource(): string {
  return editorSnippet({
    content: '<p>Antes.</p><img src="/exemplo.png" alt="Ponto de exemplo">',
  });
}

/**
 * Armazenamento próprio: quem consome decide de onde sai o endereço da imagem.
 *
 * O padrão embute o arquivo em base64 e serve para prototipar. Aqui o resolvedor
 * envia a um CDN e RECUSA arquivo acima do limite — devolver nulo é recusa, não
 * erro, e é por isso que o retorno é `string | null` e não uma exceção.
 *
 * A propriedade é um CAMPO com função de seta, e não um método: um método
 * perderia o `this` ao ser passado por binding, e o erro só apareceria no
 * primeiro arquivo escolhido.
 */
export function editorCustomImageStorageSource(): string {
  return editorSnippet({
    content: '<p>O armazenamento da imagem é decisão de quem consome.</p>',
    extraAttrs: ['[resolveImage]="enviarAoCdn"'],
    extraMembers: [
      `  readonly enviarAoCdn = async (file: File): Promise<string | null> =>
    file.size > MAX_BYTES ? null : uploadDoProjeto(file);`,
    ],
  });
}

/**
 * Descrição automática: quem consome liga um modelo de visão.
 *
 * A imagem entra na hora, com o nome do arquivo segurando a vaga; a descrição
 * substitui o provisório quando chega. O arquivo vem NULO para imagem colada de
 * outra página, que chega só como endereço — e é por isso que a assinatura
 * recebe os dois.
 */
export function editorAiImageDescriptionSource(): string {
  return editorSnippet({
    content: '<p>A IA propõe a descrição; quem publica confere.</p>',
    extraAttrs: ['[describeImage]="descrever"'],
    extraMembers: [
      `  readonly descrever = async (file: File | null, src: string): Promise<string | null> =>
    servicoDeVisao.descrever(file, src);`,
    ],
  });
}
