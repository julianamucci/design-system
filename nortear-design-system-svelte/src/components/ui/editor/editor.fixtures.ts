// Fixture compartilhada pelas stories do Editor.
//
// Módulo à parte porque num `*.stories.ts` TODO export nomeado vira story: um
// helper exportado apareceria na sidebar como se fosse um exemplo. Os rótulos e
// os conteúdos iniciais também moram aqui — quatro arquivos de story usam os
// mesmos, e três cópias de um rótulo são três chances de um deles envelhecer.

import { expect, userEvent } from 'storybook/test';
import type { EditorLabels, EditorRootElement } from './index';

/**
 * Nome acessível de tudo que a barra expõe.
 *
 * Todo botão é só de ícone: sem estes textos, o leitor de tela anuncia "botão" e
 * nada mais. O verbo vem antes do nome da marcação — "Inserir tabela" diz o que
 * acontece, "Tabela" não.
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
 * O mesmo conjunto de rótulos com o nome da MARCAÇÃO no lugar do verbo.
 *
 * Existe para o par de boas práticas: os dois editores são iguais em tudo menos
 * nestes dois textos, que é o que a comparação precisa isolar.
 */
export const NOUN_LABELS: EditorLabels = {
  ...LABELS,
  actions: { ...LABELS.actions, link: 'Link', table: 'Tabela' },
  fields: { ...LABELS.fields, linkRemove: 'Link' },
};

/** Um PNG de 1×1 transparente, montado byte a byte — nada baixado. */
export const DOT_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk'
  + 'YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

export const DOT_PNG_DATA_URL = `data:image/png;base64,${DOT_PNG_BASE64}`;

/**
 * Arquivo de imagem para os caminhos que inserem de verdade.
 *
 * Os bytes saem do NOME, e não de uma constante. O resolvedor padrão devolve um
 * `data:` construído a partir do conteúdo: dois arquivos de bytes iguais viram o
 * MESMO `src`, e o cache de descrição — que é por `src`, de propósito — entrega
 * ao segundo a descrição do primeiro. Medido: `colada.png` recebia a descrição
 * de `grafico.png`, e a asserção acusava o componente por um defeito da fixture.
 */
export function imageFile(name: string): File {
  const bytes = Uint8Array.from([...name].map((c) => c.charCodeAt(0)));
  return new File([bytes], name, { type: 'image/png' });
}

/** Conteúdos iniciais de cada story, na letra do contrato. */
export const CONTENTS = {
  playground: '<p>Escreva aqui. A energia de repouso é <strong>E = mc²</strong>.</p>',
  basic:
    '<p>Comentário curto, com ênfase e uma lista.</p><ul><li>primeiro</li><li>segundo</li></ul>',
  advanced:
    '<h2>Relatório</h2><p>Texto com <mark>destaque</mark> e <a href="https://exemplo.com">link</a>.</p>',
  withTable:
    '<p>Antes.</p><table><tbody><tr><th>Nome</th><th>Valor</th></tr>'
    + '<tr><td>a</td><td>1</td></tr></tbody></table>',
  withImage: `<p>Antes.</p><img src="${DOT_PNG_DATA_URL}" alt="Ponto de exemplo">`,
  customImageStorage: '<p>O armazenamento da imagem é decisão de quem consome.</p>',
  aiImageDescription: '<p>A IA propõe a descrição; quem publica confere.</p>',
} as const;

/** A raiz que carrega a instância da lib, a partir do canvas da story. */
export function editorRoot(canvasElement: HTMLElement): EditorRootElement {
  return canvasElement.querySelector('[data-slot="editor"]') as EditorRootElement;
}

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
 * A cor que um token vale nesta página, resolvida pelo navegador.
 *
 * A sonda é montada, lida e removida ANTES de qualquer asserção — nunca dentro
 * de um `waitFor`. Condição que mexe no DOM reagenda o próprio `waitFor` por
 * observador de mutação, e o prazo nunca chega: a aba trava sem reprovar.
 */
export function tokenColor(root: HTMLElement, token: string): string {
  const probe = document.createElement('span');
  probe.style.color = `hsl(var(${token}))`;
  root.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** O mesmo, para medida: quanto vale `--text-h1` em pixels nesta página. */
export function tokenSize(root: HTMLElement, token: string): string {
  const probe = document.createElement('span');
  probe.style.fontSize = `var(${token})`;
  root.appendChild(probe);
  const size = getComputedStyle(probe).fontSize;
  probe.remove();
  return size;
}

/**
 * Espera por RELÓGIO, com prazo.
 *
 * Nunca `waitFor`: ele reagenda por observador de mutação, e uma condição que
 * nunca satisfaz pendura a aba sem reportar nada. Com prazo, "demorou" e "não
 * veio" são resultados diferentes, e o segundo reprova.
 */
async function untilTrue(condition: () => boolean, timeout = 3000): Promise<boolean> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (condition()) return true;
    await new Promise((r) => setTimeout(r, 20));
  }
  return condition();
}

/**
 * Um giro de relógio, para o que a última escrita pediu chegar ao DOM.
 *
 * Escrever no editor e ler o atributo na linha seguinte não funciona: a
 * asserção é avaliada ANTES do `await`, e a renderização é assíncrona. É a
 * espera mínima para o caso NEGATIVO — o positivo usa `waitUntil`, que reprova
 * quando a condição não chega.
 */
export async function settle(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}

/** Espera a condição valer, e REPROVA com a mensagem quando ela não vale. */
export async function waitUntil(condition: () => boolean, message: string): Promise<void> {
  await expect(await untilTrue(condition), message).toBe(true);
}

/** Espera o atributo chegar ao valor pedido, e REPROVA se ele não chegar. */
export async function waitForAttribute(
  el: Element,
  name: string,
  expected: string,
): Promise<void> {
  await untilTrue(() => el.getAttribute(name) === expected);
  await expect(el.getAttribute(name)).toBe(expected);
}

/** Espera o `alt` da imagem chegar ao valor pedido. */
export async function waitForAlt(root: HTMLElement, expected: string): Promise<void> {
  await untilTrue(() => root.querySelector('img')?.getAttribute('alt') === expected);
  await expect(root.querySelector('img')?.getAttribute('alt')).toBe(expected);
}

/** Espera o elemento receber o foco — a abertura da linha passa por um tick. */
export async function waitForFocus(el: Element): Promise<void> {
  await untilTrue(() => document.activeElement === el);
  await expect(el).toHaveFocus();
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
  await waitForAttribute(button, 'aria-expanded', 'true');
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
  await waitForAttribute(button, 'aria-expanded', 'false');
}

/**
 * Põe a seleção na imagem do documento.
 *
 * A posição vem de uma VARREDURA, e não de aritmética sobre o tamanho do
 * documento: um parágrafo a mais ou a menos desloca a conta em silêncio. E é
 * repetido a cada passo porque escrever atributo refaz a seleção.
 */
export function selectImage(root: EditorRootElement): void {
  let position = -1;
  root.editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'image') position = pos;
  });
  if (position >= 0) root.editor.commands.setNodeSelection(position);
}

/** O mesmo, para o nó de fórmula sob o cursor. */
export function selectInlineMath(root: EditorRootElement): void {
  let position = -1;
  root.editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'inlineMath') position = pos;
  });
  if (position >= 0) root.editor.commands.setNodeSelection(position);
}

/** Põe o cursor na primeira célula da tabela do documento. */
export function cursorInTable(root: EditorRootElement): void {
  let position = -1;
  root.editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
      if (position < 0) position = pos + 1;
    }
  });
  if (position >= 0) root.editor.commands.setTextSelection(position);
}

/** A caixa contextual de um assunto — a que só aparece com o nó sob o cursor. */
export function contextBox(root: HTMLElement, node: 'image' | 'table'): HTMLElement {
  return root.querySelector(
    `[data-slot="editor-toolbar-context"][data-node="${node}"]`,
  ) as HTMLElement;
}
