import { expect, userEvent, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { createButton } from './button';
import { createInput } from './input';
import { createLabel } from './label';

// Helpers compartilhados pelas quatro stories de Dialog.
//
// Arquivo à parte porque num `*.stories.ts` TODO export nomeado vira uma story:
// um helper exportado apareceria na sidebar como se fosse um exemplo.
//
// Duas seções. As CONSULTAS E PASSOS da play, aqui em cima, procuram sempre
// pelo CONTRATO de markup (`data-slot`) — o mesmo contrato que as outras quatro
// stacks copiam desta. As FIXTURES DE MONTAGEM, no fim do arquivo, são o que as
// stories constroem.

/** O painel vive no `<body>`, fora do `canvasElement` — o portal é o ponto. */
export const panel = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-slot="dialog-content"]');

export const overlay = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]');

/**
 * O gatilho é o primeiro filho do wrapper que a factory devolve.
 *
 * A factory não marca o gatilho com `data-slot` — quem escolhe o elemento é
 * quem chama, e ele já vem com o `data-slot` do próprio botão.
 */
export const trigger = (root: ParentNode): HTMLElement | null =>
  root.querySelector<HTMLElement>('[data-slot="dialog"] > button');

/**
 * O botão X do CANTO — e não qualquer controle que fecha.
 *
 * `data-slot="dialog-close"` marca TODO controle de fechamento, inclusive o
 * Cancelar do rodapé. Uma consulta crua pelo slot devolvia o primeiro da ordem
 * do DOM, que é o Cancelar: a asserção "o X fecha" clicava no botão errado e
 * passava assim mesmo, e a asserção "não há X no canto" reprovava por causa do
 * Cancelar. O que separa os dois é onde eles moram.
 */
export const cantoButtonClose = (p: HTMLElement): HTMLElement | null =>
  [...p.querySelectorAll<HTMLElement>('[data-slot="dialog-close"]')].find(
    (el) => !el.closest('[data-slot="dialog-footer"]'),
  ) ?? null;

/**
 * Espera o painel montar E a animação de entrada assentar.
 *
 * `waitForPortal` gateia na opacidade computada: o browser dos testes roda COM
 * animação, e uma asserção de visibilidade no primeiro quadro pega o painel
 * ainda em `opacity: 0` e culpa o componente.
 */
export async function waitForOpen(): Promise<HTMLElement> {
  await waitForPortal('dialog');
  return panel()!;
}

/** Espera o painel sair do DOM. */
export async function waitForClosed(): Promise<void> {
  await waitForPortalGone('dialog');
}

/**
 * Deixa o diálogo ABERTO, venha de onde vier.
 *
 * O painel Interactions reexecuta a play no MESMO DOM, sem remontar: um clique
 * absoluto partiria do estado que a rodada anterior deixou e inverteria o
 * resultado. Cada passo estabelece a própria precondição.
 */
export async function open(root: ParentNode): Promise<HTMLElement> {
  if (!panel()) {
    const triggerEl = trigger(root);
    if (triggerEl) await userEvent.click(triggerEl);
  }
  return waitForOpen();
}

/** O par idempotente de `open`. Escape porque existe em toda composição. */
export async function close(): Promise<void> {
  if (panel()) await userEvent.keyboard('{Escape}');
  await waitForClosed();
}

/**
 * Confere o par nome/descrição pelos ids REAIS, não por comparação de texto.
 *
 * Um `aria-labelledby` apontando para um id ausente passaria numa comparação de
 * string e reprovaria no axe por `aria-valid-attr-value` — é exatamente o caso
 * que esta checagem existe para pegar.
 */
export async function checkNameAndDescription(p: HTMLElement): Promise<void> {
  const idTitle = p.getAttribute('aria-labelledby');
  await expect(idTitle).toBeTruthy();
  const title = document.getElementById(idTitle!);
  await expect(title).toHaveClass('nds-dialog-title');

  const idDescription = p.getAttribute('aria-describedby');
  await expect(idDescription).toBeTruthy();
  await expect(document.getElementById(idDescription!)).toHaveClass('nds-dialog-description');

  await expect(p).toHaveAccessibleName(title!.textContent!.trim());
}

/**
 * Tab não escapa do painel (WCAG 2.1.2 — armadilha de teclado).
 *
 * Do último focável, Tab volta para dentro; do primeiro, Shift+Tab também.
 *
 * O `waitFor` aqui NÃO é folga para animação: as libs headless põem elementos
 * sentinela FORA do painel e devolvem o foco num handler de `focus`, um tique
 * depois da tecla. Se a armadilha estivesse quebrada o foco ficaria parado lá
 * fora e a espera estouraria — que é justamente o que se quer detectar.
 */
export async function checkFocusTrap(p: HTMLElement): Promise<void> {
  const focaveis = p.querySelectorAll<HTMLElement>(
    'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
  );
  await expect(focaveis.length).toBeGreaterThan(0);

  focaveis[focaveis.length - 1].focus();
  await userEvent.tab();
  await waitFor(async () => {
    await expect(p.contains(document.activeElement)).toBe(true);
  });

  focaveis[0].focus();
  await userEvent.tab({ shift: true });
  await waitFor(async () => {
    await expect(p.contains(document.activeElement)).toBe(true);
  });
}

// ─── Fixtures de montagem ─────────────────────────────────────────────────────
//
// O que as stories MONTAM, e não o que elas conferem. As três estavam copiadas
// em `dialog-variantes` e `dialog-composicoes`; `buildField` e `mountOpen`
// eram idênticas, e `makeFooter` divergia só na ação destrutiva — que agora
// entra por parâmetro, com o padrão neutro que as composições usam.

/**
 * Um campo do formulário: rótulo e controle, ligados por `for`/`id`.
 *
 * Fábricas do sistema em vez de `<input>`/`<textarea>` crus com `style`: o cru
 * trazia padding inline, que sai do tema, da densidade e da escala.
 */
export function buildField(
  id: string,
  labelText: string,
  type: string,
  value: string,
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack';
  wrapper.dataset.spacing = 'xs';
  wrapper.append(createLabel({ text: labelText, htmlFor: id }), createInput({ id, type, value }));
  return wrapper;
}

/**
 * As ações do rodapé saem como LISTA, não embrulhadas num `<div>`: quem faz o
 * arranjo (empilhar ao contrário no estreito, alinhar à direita no largo) é o
 * `.nds-dialog-footer`, e para isso os botões precisam ser filhos diretos dele.
 *
 * `destructive` fica em `false` por padrão porque só a composição da ação
 * irreversível troca a ênfase da primária; todo o resto é neutro.
 */
export function makeFooter(
  cancelLabel: string,
  actionLabel: string,
  destructive = false,
): HTMLElement[] {
  return [
    createButton({ variant: 'outline', label: cancelLabel }),
    createButton({ variant: destructive ? 'destructive' : 'default', label: actionLabel }),
  ];
}

/** Abre pelo gatilho depois da montagem — a factory não tem `defaultOpen`. */
export function mountOpen(dialog: HTMLElement): HTMLElement {
  queueMicrotask(() => dialog.querySelector<HTMLElement>('button')?.click());
  return dialog;
}
