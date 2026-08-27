import { userEvent, expect } from 'storybook/test';
import type { EditorHostElement, EditorLabels } from './editor';

/**
 * Rótulos e utilitários do Editor — um módulo, quatro arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * constante ou função auxiliar exportada apareceria na barra lateral do
 * Storybook como se fosse um exemplo do componente.
 *
 * Os textos são os mesmos do Vanilla, que é a referência cross-stack. Eles NÃO
 * vêm do `translations.json`: o conteúdo compartilhado descreve os rótulos
 * (`props.table.labels`) mas não os declara — não há chave `labels.actions.*`
 * em idioma nenhum. Enquanto não houver, os nomes acessíveis do editor são os
 * daqui, em pt-BR, nas cinco stacks.
 */
export const EDITOR_LABELS: EditorLabels = {
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

/** Conteúdo inicial de cada story, na letra da spec de exemplos. */
export const EDITOR_CONTENT = {
  playground: '<p>Escreva aqui. A energia de repouso é <strong>E = mc²</strong>.</p>',
  basic:
    '<p>Comentário curto, com ênfase e uma lista.</p><ul><li>primeiro</li><li>segundo</li></ul>',
  advanced:
    '<h2>Relatório</h2><p>Texto com <mark>destaque</mark> e '
    + '<a href="https://exemplo.com">link</a>.</p>',
  withTable:
    '<p>Antes.</p><table><tbody><tr><th>Nome</th><th>Valor</th></tr>'
    + '<tr><td>a</td><td>1</td></tr></tbody></table>',
  customStorage: '<p>O armazenamento da imagem é decisão de quem consome.</p>',
  aiDescription: '<p>A IA propõe a descrição; quem publica confere.</p>',
} as const;

/** Um PNG de 1×1 transparente, montado byte a byte — nada baixado. */
export const PNG_1X1
  = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ'
  + 'AAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/**
 * Um arquivo de imagem para os caminhos que recebem `File`.
 *
 * Os bytes derivam do NOME, e não são zeros. Medido: com o mesmo conteúdo, o
 * resolvedor padrão (que embute o arquivo em base64) devolve o MESMO `src` para
 * arquivos de nomes diferentes — e o cache de descrição, que é por `src`,
 * entrega ao segundo a descrição do primeiro. A story acusava "arrastar não
 * funciona" com o código certo.
 */
export function pngFile(name: string, size = 8): File {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) bytes[i] = (name.charCodeAt(i % name.length) + i) % 256;
  return new File([bytes], name, { type: 'image/png' });
}

/**
 * A linha de entrada está desenhada?
 *
 * Lê o `display` COMPUTADO, e não o atributo `hidden`. O `toBeVisible` do
 * jest-dom trata `hidden` como prova de invisibilidade — e era justamente o
 * atributo que estava certo enquanto a linha ficava na tela: `display: flex` de
 * autor vence o `[hidden] { display: none }` do navegador. A asserção que
 * confia no atributo concorda com o bug.
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

/**
 * Espera de RELÓGIO, com prazo.
 *
 * Nunca `waitFor`: com prazo, "demorou" e "não veio" são resultados diferentes,
 * e o segundo REPROVA. `waitFor` cuja condição nunca satisfaz pendura a aba sem
 * reportar nada.
 */
export async function waitUntil(
  condition: () => boolean,
  timeoutMs = 3000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (condition()) return;
    await new Promise((r) => setTimeout(r, 30));
  }
}

/** Espera o `alt` da imagem chegar ao valor pedido, e reprova se não chegar. */
export async function waitForAlt(root: HTMLElement, expected: string): Promise<void> {
  await waitUntil(() => root.querySelector('img')?.getAttribute('alt') === expected);
  await expect(root.querySelector('img')?.getAttribute('alt') ?? '').toBe(expected);
}

/**
 * Põe a seleção na imagem do documento.
 *
 * A posição vem de uma VARREDURA, e não de aritmética sobre o tamanho do
 * documento: um parágrafo a mais ou a menos desloca a conta em silêncio. E é
 * repetido a cada passo porque escrever atributo refaz a seleção.
 */
export function selectImage(host: EditorHostElement): void {
  let position = -1;
  host.editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'image') position = pos;
  });
  if (position >= 0) host.editor.commands.setNodeSelection(position);
}

/** O mesmo, para a fórmula sob o cursor. */
export function selectFormula(host: EditorHostElement): void {
  let position = -1;
  host.editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'inlineMath') position = pos;
  });
  if (position >= 0) host.editor.commands.setNodeSelection(position);
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
  await waitUntil(() => button.getAttribute('aria-expanded') === 'true');
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
  await waitUntil(() => button.getAttribute('aria-expanded') === 'false');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
}
