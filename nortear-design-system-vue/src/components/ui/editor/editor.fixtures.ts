/**
 * Andaime das stories do Editor — rótulos, sondas e esperas.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente. E são quatro arquivos de story usando as
 * mesmas peças.
 */
import { expect, userEvent } from 'storybook/test';
import { nextTick } from 'vue';
import type { Editor as TiptapEditor } from '@tiptap/core';
import type { EditorLabels } from './index';

/**
 * Deixa o framework repintar antes de a asserção medir.
 *
 * A barra é CONTROLADA pelo editor: a transação escreve no estado reativo e a
 * pintura vem no próximo ciclo. Medir no mesmo tique leria o DOM de antes — e a
 * asserção reprovaria com o código certo.
 *
 * Dois ciclos porque o alternador é controlado em duas camadas: o estado do
 * editor alimenta o valor do grupo, e o grupo alimenta o botão.
 */
export async function settle(): Promise<void> {
  await nextTick();
  await nextTick();
}

/**
 * Os nomes acessíveis do editor.
 *
 * Todo botão é só de ícone: o rótulo É o nome que o leitor de tela anuncia, e
 * por isso ele carrega o VERBO da ação — "Inserir tabela" diz o que acontece,
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

/** Um PNG de 1×1 transparente, montado byte a byte — nada baixado. */
export const PIXEL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk'
  + 'YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/**
 * O mesmo pixel, com o NOME anexado depois do fim do arquivo.
 *
 * O cache de descrição é por `src`, e o resolvedor padrão embute os bytes: dois
 * arquivos de conteúdo idêntico viram o MESMO endereço, e o segundo recebe a
 * descrição do primeiro sem novo pedido — que é o comportamento correto, e
 * fazia a play medir "grafico.png" onde esperava "colada.png". Os bytes extras
 * vêm depois do IEND, então o PNG continua decodificável e cada arquivo ganha
 * endereço próprio.
 */
export function pixelPngFile(name: string): File {
  const bytes = Uint8Array.from(atob(PIXEL_PNG_BASE64), (c) => c.charCodeAt(0));
  return new File([bytes, new TextEncoder().encode(name)], name, { type: 'image/png' });
}

/**
 * A linha de entrada está DESENHADA?
 *
 * Lê o `display` computado, e não o atributo `hidden`. O `toBeVisible` do
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
    await new Promise((resolve) => setTimeout(resolve, 30));
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
export function selectNode(editor: TiptapEditor, name: string): void {
  let position = -1;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === name) position = pos;
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
  await settle();
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
  await settle();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
}
