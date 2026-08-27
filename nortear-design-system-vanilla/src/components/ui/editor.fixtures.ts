/**
 * Andaime das demonstrações do Editor — um construtor, cinco arquivos.
 *
 * Este módulo existe porque num `*.stories.ts` todo export nomeado vira story:
 * o andaime não pode sair de lá, e a saída fácil é copiar a constante para cada
 * arquivo. Cópia divergida não é variação — é o defeito, porque corrigir uma
 * delas deixa as outras erradas sem nenhum sinal.
 *
 * Aqui nada pode variar: os rótulos são o NOME ACESSÍVEL de cada botão, e é por
 * eles que toda play encontra o que clicar. Um rótulo diferente num arquivo
 * quebraria a busca em vez de mudar a aparência.
 *
 * Nada de `storybook/test` neste módulo, de propósito: a docs page importa
 * daqui os rótulos da demonstração, e arrastar o runner de teste para dentro
 * dela levaria o pacote junto. Os auxiliares que precisam de `userEvent` e
 * `expect` moram em `editor.play-helpers.ts`.
 */

import type { EditorLabels } from './editor';

/**
 * Rótulos de toda demonstração do Editor.
 *
 * Vivem aqui, e não no `translations.json` compartilhado, porque o conteúdo
 * compartilhado não declara chave para os 38 nomes de ação — só para os quatro
 * controles da demonstração. Ver a nota do relatório desta stack.
 */
export const LABELS: EditorLabels = {
  toolbar: 'Formatação',
  editorField: 'Corpo do texto',
  groups: {
    marks: 'Marcas de texto',
    headings: 'Títulos',
    align: 'Alinhamento',
    lists: 'Listas',
    blocks: 'Blocos',
    actions: 'Ações',
    table: 'Tabela',
  },
  actions: {
    bold: 'Negrito',
    italic: 'Itálico',
    underline: 'Sublinhado',
    strike: 'Tachado',
    code: 'Código',
    highlight: 'Destaque',
    h1: 'Título 1',
    h2: 'Título 2',
    h3: 'Título 3',
    alignLeft: 'Alinhar à esquerda',
    alignCenter: 'Centralizar',
    alignRight: 'Alinhar à direita',
    alignJustify: 'Justificar',
    bulletList: 'Lista com marcadores',
    orderedList: 'Lista numerada',
    taskList: 'Lista de tarefas',
    blockquote: 'Citação',
    codeBlock: 'Bloco de código',
    link: 'Link',
    image: 'Inserir imagem',
    imageAlt: 'Texto alternativo',
    imageSmaller: 'Diminuir a imagem',
    imageLarger: 'Aumentar a imagem',
    imageNatural: 'Tamanho natural',
    table: 'Inserir tabela',
    horizontalRule: 'Linha divisória',
    undo: 'Desfazer',
    redo: 'Refazer',
    formula: 'Inserir fórmula',
    rowAfter: 'Inserir linha abaixo',
    columnAfter: 'Inserir coluna à direita',
    deleteRow: 'Excluir linha',
    deleteColumn: 'Excluir coluna',
    headerRow: 'Alternar linha de cabeçalho',
    deleteTable: 'Excluir tabela',
  },
  fields: {
    formula: 'Fórmula em LaTeX',
    formulaConfirm: 'Inserir',
    link: 'Endereço do link',
    linkConfirm: 'Aplicar',
    linkRemove: 'Tirar o link',
    alt: 'Descrição da imagem',
    altConfirm: 'Salvar descrição',
  },
};

/**
 * Rótulos do par Do & Don't: o mesmo botão nomeado pelo VERBO e pelo
 * SUBSTANTIVO.
 *
 * Todo botão da barra é só de ícone, então o rótulo é o que o leitor de tela
 * anuncia — e ouvir "Tabela" não diz o que o clique faz.
 */
export const NOUN_LABELS: EditorLabels = {
  ...LABELS,
  actions: { ...LABELS.actions, table: 'Tabela', link: 'Link' },
};

/** Um PNG de 1×1 transparente, montado byte a byte — nada baixado. */
export const DOT_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk'
  + 'YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/** O mesmo ponto, já em `data:` — é o que o conteúdo inicial de `WithImage` traz. */
export const DOT_PNG_DATA_URL = `data:image/png;base64,${DOT_PNG_BASE64}`;

/**
 * Arquivo de imagem sintético, para exercitar o caminho de inserção.
 *
 * O CONTEÚDO sai do nome, e não de zeros: o resolvedor padrão embute o arquivo
 * em base64, e a descrição fica em cache por `src`. Dois arquivos de nomes
 * diferentes e bytes iguais produzem o MESMO `src` — a segunda inserção
 * receberia a descrição da primeira, e o teste de colar acusaria um defeito que
 * não existe. Medido.
 */
export function createPngFile(name: string, size = 3): File {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) bytes[i] = (name.charCodeAt(i % name.length) + i) % 256;
  return new File([bytes], name, { type: 'image/png' });
}

/** O ponto de 1×1 como arquivo de verdade, decodificado do base64 acima. */
export function createDotPngFile(name = 'ponto.png'): File {
  const bytes = Uint8Array.from(atob(DOT_PNG_BASE64), (c) => c.charCodeAt(0));
  return new File([bytes], name, { type: 'image/png' });
}

// ─── Conteúdos iniciais ──────────────────────────────────────────────────────
//
// Um por story, literais e fixos: é o que a pessoa vê ao abrir pela barra
// lateral e o que o Chromatic fotografa.

export const PLAYGROUND_CONTENT =
  '<p>Escreva aqui. A energia de repouso é <strong>E = mc²</strong>.</p>';

export const BASIC_CONTENT =
  '<p>Comentário curto, com ênfase e uma lista.</p><ul><li>primeiro</li><li>segundo</li></ul>';

export const ADVANCED_CONTENT =
  '<h2>Relatório</h2><p>Texto com <mark>destaque</mark> e '
  + '<a href="https://exemplo.com">link</a>.</p>';

export const TABLE_CONTENT =
  '<p>Antes.</p><table><tbody><tr><th>Nome</th><th>Valor</th></tr>'
  + '<tr><td>a</td><td>1</td></tr></tbody></table>';

export const IMAGE_CONTENT =
  `<p>Antes.</p><img src="${DOT_PNG_DATA_URL}" alt="Ponto de exemplo">`;

export const CUSTOM_STORAGE_CONTENT =
  '<p>O armazenamento da imagem é decisão de quem consome.</p>';

export const AI_DESCRIPTION_CONTENT =
  '<p>A IA propõe a descrição; quem publica confere.</p>';

/** Conteúdo dos dois previews do segundo par de Do & Don't. */
export const DO_DONT_CONTENT = '<p>Ótimo trabalho, obrigado!</p>';

// ─── Costuras de exemplo ─────────────────────────────────────────────────────

/**
 * Envio fingido a um CDN, com política de tamanho.
 *
 * Recusa é `null`, e não exceção: arquivo grande demais, formato fora da
 * política, envio negado. A barra não insere nada e segue.
 */
export async function resolveToCdn(file: File): Promise<string | null> {
  if (file.size > 1024) return null;
  return `https://cdn.exemplo.com/${file.name}`;
}

/**
 * Dublê de serviço de descrição: demora e devolve uma frase fixa.
 *
 * Recebe as duas coisas que um serviço real pede: os bytes, QUANDO existem, e
 * uma URL. Imagem colada de outra página chega sem arquivo — e um serviço que
 * trabalha por URL descreve os dois casos.
 */
export async function describeWithFakeAi(
  file: File | null,
  src: string,
): Promise<string | null> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  if (file) return `Descrição automática de ${file.name}`;
  return `Descrição automática de ${src.slice(src.lastIndexOf('/') + 1)}`;
}

/**
 * Moldura fluida das stories.
 *
 * O editor é `width: 100%`, e sob `layout: 'padded'` o container do canvas já
 * tem largura definida — o wrapper só declara que a caixa ocupa tudo.
 */
export function fluidBox(child: HTMLElement): HTMLDivElement {
  const box = document.createElement('div');
  box.className = 'nds-w-full';
  box.appendChild(child);
  return box;
}
