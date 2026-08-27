import type { Editor as TiptapEditor } from '@tiptap/core';

export { default as Editor } from './Editor.vue';

/** Tudo que a barra sabe fazer. Nem todo conjunto expõe tudo. */
export type EditorAction =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'highlight'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'alignJustify'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'blockquote'
  | 'codeBlock'
  | 'link'
  | 'image'
  | 'table'
  | 'horizontalRule'
  | 'undo'
  | 'redo'
  | 'formula'
  // Só existe com uma imagem selecionada.
  | 'imageAlt'
  | 'imageSmaller'
  | 'imageLarger'
  | 'imageNatural'
  // Só existem com o cursor DENTRO de uma tabela.
  | 'rowAfter'
  | 'columnAfter'
  | 'deleteRow'
  | 'deleteColumn'
  | 'headerRow'
  | 'deleteTable';

/** Blocos visuais da barra. Cada um vira um grupo com nome próprio. */
export type EditorGroup = 'marks' | 'headings' | 'align' | 'lists' | 'blocks' | 'actions' | 'table';

/**
 * Conjuntos de botões.
 *
 * `basic` cobre texto de formulário, comentário e descrição. `advanced`
 * acrescenta o que um editor de conteúdo longo pede — título, citação, código e
 * divisória. Os dois usam a MESMA lista de extensões: trocar de conjunto muda o
 * que aparece na barra, não o que o documento aceita, então texto colado com
 * título continua com título mesmo no conjunto básico.
 */
export type EditorPreset = 'basic' | 'advanced';

export type EditorLabels = {
  /** Nome acessível da barra inteira. */
  toolbar: string;
  /**
   * Nome acessível da ÁREA EDITÁVEL.
   *
   * A biblioteca põe `role="textbox"` no elemento editável, e campo com papel
   * de campo e sem nome é violação de nome acessível de campo. Não há rótulo
   * visível a que apontar: a moldura inteira é o campo.
   */
  editorField: string;
  /** Nome de cada bloco. Grupo sem nome é anunciado como "grupo" e mais nada. */
  groups: Record<EditorGroup, string>;
  /** Nome de cada botão. Todos são só de ícone — o rótulo é o nome acessível. */
  actions: Record<EditorAction, string>;
  /** As três linhas que pedem texto antes de agir. */
  fields: {
    formula: string;
    formulaConfirm: string;
    link: string;
    linkConfirm: string;
    /**
     * Botão que TIRA o link do trecho.
     *
     * Aparece só quando há link sob o cursor. Apagar o campo e confirmar
     * continua tirando — mas esse caminho depende de a pessoa deduzir, e quem
     * não deduz não descobre que dá para remover.
     */
    linkRemove: string;
    /** Rótulo do campo de texto alternativo da imagem. */
    alt: string;
    altConfirm: string;
  };
};

/**
 * O que a instância expõe para quem monta o editor por fora.
 *
 * `insertImage` é o mesmo caminho do botão, com o armazenamento e a descrição
 * já configurados: colar e arrastar um arquivo usam exatamente isto por dentro.
 * Devolve `false` quando o resolvedor recusa.
 */
export type EditorApi = {
  editor: TiptapEditor;
  insertImage: (file: File) => Promise<boolean>;
};

/**
 * O resolvedor padrão de imagem: o próprio arquivo, embutido no documento.
 *
 * Serve para demonstrar e para prototipar. Base64 infla o documento em cerca de
 * um terço do tamanho do arquivo, e o conteúdo inteiro passa a trafegar junto do
 * texto a cada gravação — a decisão de armazenamento é de quem consome.
 */
export function imageAsDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string));
    reader.addEventListener('error', () => resolve(null));
    reader.readAsDataURL(file);
  });
}
