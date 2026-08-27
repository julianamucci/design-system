/**
 * Auxiliares das play do Editor — quatro arquivos de story, um construtor.
 *
 * Separado de `editor.fixtures.ts` porque este módulo importa `storybook/test`:
 * a docs page consome os rótulos do outro e não pode arrastar o runner junto.
 */

import { userEvent, expect } from 'storybook/test';
import type { EditorRoot } from './editor';

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
export function selectImage(root: EditorRoot): void {
  let position = -1;
  root.editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'image') position = pos;
  });
  if (position >= 0) root.editor.commands.setNodeSelection(position);
}

/** O mesmo, para o nó de fórmula sob o cursor. */
export function selectInlineMath(root: EditorRoot): void {
  let position = -1;
  root.editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'inlineMath') position = pos;
  });
  if (position >= 0) root.editor.commands.setNodeSelection(position);
}

/**
 * Põe o cursor DENTRO da primeira célula da tabela do documento.
 *
 * `+ 2` e não `+ 1`: a célula contém um parágrafo, e `pos + 1` cai na borda
 * dele, fora do conteúdo em linha. A lib aceita, avisa no console
 * ("TextSelection endpoint not pointing into a node with inline content") e
 * corrige por conta própria — aviso que some quando a posição está certa.
 */
export function selectTableCell(root: EditorRoot): void {
  let position = -1;
  root.editor.state.doc.descendants((node, pos) => {
    if (position < 0 && (node.type.name === 'tableHeader' || node.type.name === 'tableCell')) {
      position = pos + 2;
    }
  });
  if (position >= 0) root.editor.commands.setTextSelection(position);
}

/**
 * Abre uma linha de entrada, clicando SÓ se ela ainda não estiver aberta.
 *
 * O painel Interactions reexecuta a play no mesmo DOM: um clique cego parte do
 * estado que a rodada anterior deixou e fecha o que deveria abrir. Cada passo
 * estabelece a própria precondição — é a mesma disciplina do `setContent` no
 * início da play.
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
