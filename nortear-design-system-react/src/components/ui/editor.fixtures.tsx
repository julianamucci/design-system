// ─── Editor — andaime das stories e da docs page ─────────────────────────────
//
// Nada aqui vira snippet: o painel Code lê `editor.source.ts`. Este módulo
// existe para que os quatro arquivos de story E a docs page compartilhem os
// rótulos, os conteúdos iniciais, as costuras de exemplo e o acesso à instância
// da lib — sem isso cada consumidor carregaria a sua cópia, e as cópias
// divergem.
//
// Fica fora dos `*.stories.tsx` porque no CSF TODO export nomeado é lido como
// story: `export const LABELS` num arquivo de story apareceria na sidebar.

import { useCallback } from 'react';
import { userEvent, expect } from 'storybook/test';
import { Editor, type EditorHandle, type EditorLabels, type EditorProps } from './editor';

/**
 * Rótulos da barra.
 *
 * Todos os botões são só de ícone, então o rótulo É o nome acessível: é ele que
 * o leitor de tela anuncia, e é por ele que a play encontra cada botão. O verbo
 * da ação vem antes do nome da marcação — "Inserir tabela" diz o que acontece,
 * "Tabela" não.
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
 * Os mesmos rótulos com o SUBSTANTIVO no lugar do verbo — o "não faça" do
 * primeiro par de Do & Don't.
 *
 * Só duas ações mudam, e de propósito: a comparação precisa de uma variável só.
 */
export const NOUN_LABELS: EditorLabels = {
  ...LABELS,
  actions: { ...LABELS.actions, table: 'Tabela', link: 'Link' },
};

/** Um PNG de 1×1 transparente, escrito byte a byte — nada baixado. */
export const DOT_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk'
  + 'YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/** O mesmo ponto, já em `data:` — é o que o conteúdo inicial de `WithImage` traz. */
export const DOT_PNG_DATA_URL = `data:image/png;base64,${DOT_PNG_BASE64}`;

/**
 * Arquivo de imagem sintético, para exercitar o caminho de inserção.
 *
 * O conteúdo é derivado do NOME, e não uma sequência de zeros: o resolvedor
 * padrão devolve o arquivo embutido, então dois arquivos de nomes diferentes e
 * bytes iguais viram o MESMO endereço — e o cache de descrição, que é por
 * endereço, devolve a descrição do primeiro. O comportamento está certo (mesma
 * imagem, mesma descrição, uma chamada só); o que estava errado era a fixture
 * fingir duas imagens com uma só.
 */
export function createPngFile(name: string, bytes = 3): File {
  const content = new Uint8Array(bytes);
  for (let i = 0; i < bytes; i += 1) {
    content[i] = (name.charCodeAt(i % name.length) + i) % 256;
  }
  return new File([content], name, { type: 'image/png' });
}

// ─── Conteúdos iniciais ──────────────────────────────────────────────────────
//
// Um por story, literais e fixos: é o que a pessoa vê ao abrir pela barra
// lateral e o que a comparação de imagem fotografa.

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
 * um endereço. Imagem colada de outra página chega sem arquivo — e um serviço
 * que trabalha por URL descreve os dois casos.
 */
export async function describeWithFakeAi(
  file: File | null,
  src: string,
): Promise<string | null> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  if (file) return `Descrição automática de ${file.name}`;
  return `Descrição automática de ${src.slice(src.lastIndexOf('/') + 1)}`;
}

// ─── Acesso à instância ──────────────────────────────────────────────────────

/**
 * As instâncias montadas, indexadas pela própria moldura.
 *
 * O estado que a play precisa (marca ativa, documento, transação) vive na
 * instância da lib, não no DOM — e em React ela chega por `ref`. A chave é o nó
 * raiz porque é o que a play tem em mãos: uma variável de módulo apontaria
 * sempre para a última instância montada na página, e a docs page monta seis.
 */
const handles = new WeakMap<HTMLElement, EditorHandle>();

/** O editor montado dentro deste canvas. Falha alto se ainda não montou. */
export function editorHandle(canvasElement: HTMLElement): EditorHandle {
  const root = canvasElement.querySelector<HTMLElement>('[data-slot="editor"]');
  const handle = root ? handles.get(root) : undefined;
  if (!handle?.editor) throw new Error('Editor ainda não montado neste canvas');
  return handle;
}

/**
 * O mesmo `Editor`, com a instância registrada para a play alcançar e a moldura
 * fluida em volta.
 *
 * O editor é `width: 100%`, e sob `layout: 'padded'` o container do canvas já
 * tem largura definida — o wrapper só declara que a caixa ocupa tudo.
 */
export function EditorCanvas(props: Omit<EditorProps, 'ref'>) {
  const register = useCallback((handle: EditorHandle | null) => {
    if (handle?.root) handles.set(handle.root, handle);
  }, []);
  return (
    <div className="nds-w-full">
      <Editor {...props} ref={register} />
    </div>
  );
}

// ─── Sondas de asserção ──────────────────────────────────────────────────────

/**
 * A linha de entrada está desenhada?
 *
 * Lê o `display` COMPUTADO, e não o atributo `hidden`. O `toBeVisible` do
 * jest-dom trata `hidden` como prova de invisibilidade — e era justamente o
 * atributo que estava certo enquanto a linha ficava na tela: `display: flex` de
 * autor vence o `[hidden] { display: none }` do navegador. A asserção que confia
 * no atributo concorda com o bug.
 */
export function rowIsPainted(root: HTMLElement, slot: string): boolean {
  const row = root.querySelector(`[data-slot="${slot}"]`) as HTMLElement;
  return getComputedStyle(row).display !== 'none';
}

/**
 * Espera uma condição de LEITURA PURA, e reprova se ela não chegar.
 *
 * Em React a barra espelha a instância no PRÓXIMO desenho, e não na mesma volta
 * do laço de eventos: comando disparado direto na lib — o que a play faz para
 * pôr o documento num estado conhecido — muda o estado antes de o React
 * redesenhar, e a asserção síncrona lê o quadro anterior.
 *
 * Laço de RELÓGIO, nunca `waitFor`: com prazo próprio, "demorou" e "não veio"
 * são resultados diferentes, e o segundo REPROVA. E a condição é leitura pura —
 * `waitFor` reagenda por observador de mutação, e condição que mexe no DOM
 * pendura a aba sem reportar nada.
 */
export async function waitUntil(
  check: () => boolean,
  description: string,
  timeout = 2000,
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (check()) return;
    await new Promise((r) => setTimeout(r, 16));
  }
  await expect(`tempo esgotado esperando: ${description}`).toBe('condição satisfeita');
}

/**
 * Espera o `alt` da imagem chegar ao valor pedido.
 *
 * Laço de RELÓGIO, não `waitFor`: com prazo, "demorou" e "não veio" são
 * resultados diferentes, e o segundo REPROVA. `waitFor` cuja condição nunca
 * satisfaz pendura a aba sem reportar nada.
 */
export async function waitForAlt(root: HTMLElement, expected: string): Promise<void> {
  const deadline = Date.now() + 3000;
  let current = '';
  while (Date.now() < deadline) {
    current = root.querySelector('img')?.getAttribute('alt') ?? '';
    if (current === expected) break;
    await new Promise((r) => setTimeout(r, 30));
  }
  await expect(current).toBe(expected);
}

/**
 * Põe a seleção na imagem do documento.
 *
 * A posição vem de uma VARREDURA, e não de aritmética sobre o tamanho do
 * documento: um parágrafo a mais ou a menos desloca a conta em silêncio. E é
 * repetido a cada passo porque escrever atributo refaz a seleção.
 */
export function selectImage(handle: EditorHandle): void {
  const editor = handle.editor;
  if (!editor) return;
  let position = -1;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'image') position = pos;
  });
  if (position >= 0) editor.commands.setNodeSelection(position);
}

/**
 * Abre uma linha de entrada, clicando SÓ se ela ainda não estiver aberta.
 *
 * O painel Interactions reexecuta a play no mesmo DOM: um clique cego parte do
 * estado que a rodada anterior deixou e fecha o que deveria abrir. Cada passo
 * estabelece a própria precondição.
 */
export async function openRow(button: HTMLElement): Promise<void> {
  if (button.getAttribute('aria-expanded') !== 'true') await userEvent.click(button);
  await expect(button).toHaveAttribute('aria-expanded', 'true');
}

/**
 * O par da anterior, escrito na MESMA forma: clique só se ainda não estiver no
 * estado desejado.
 *
 * `!== 'false'` e não `=== 'true'` — é a mesma condição, e é a forma que diz o
 * que a regra é ("se ainda não é o alvo, aja"), em vez de descrever o estado de
 * partida. As duas metades do par ficam simétricas.
 */
export async function closeRow(button: HTMLElement): Promise<void> {
  if (button.getAttribute('aria-expanded') !== 'false') await userEvent.click(button);
  await expect(button).toHaveAttribute('aria-expanded', 'false');
}
