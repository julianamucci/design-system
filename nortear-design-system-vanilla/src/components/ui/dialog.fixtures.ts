import { expect, userEvent, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';

// Helpers compartilhados pelas quatro stories de Dialog.
//
// Arquivo à parte porque num `*.stories.ts` TODO export nomeado vira uma story:
// um helper exportado apareceria na sidebar como se fosse um exemplo.
//
// Tudo aqui procura pelo CONTRATO de markup (`data-slot`) — o mesmo contrato
// que as outras quatro stacks copiam desta.

/** O painel vive no `<body>`, fora do `canvasElement` — o portal é o ponto. */
export const painel = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-slot="dialog-content"]');

export const overlay = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]');

/**
 * O gatilho é o primeiro filho do wrapper que a factory devolve.
 *
 * A factory não marca o gatilho com `data-slot` — quem escolhe o elemento é
 * quem chama, e ele já vem com o `data-slot` do próprio botão.
 */
export const gatilho = (raiz: ParentNode): HTMLElement | null =>
  raiz.querySelector<HTMLElement>('[data-slot="dialog"] > button');

/**
 * O botão X do CANTO — e não qualquer controle que fecha.
 *
 * `data-slot="dialog-close"` marca TODO controle de fechamento, inclusive o
 * Cancelar do rodapé. Uma consulta crua pelo slot devolvia o primeiro da ordem
 * do DOM, que é o Cancelar: a asserção "o X fecha" clicava no botão errado e
 * passava assim mesmo, e a asserção "não há X no canto" reprovava por causa do
 * Cancelar. O que separa os dois é onde eles moram.
 */
export const botaoFecharDoCanto = (p: HTMLElement): HTMLElement | null =>
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
export async function esperarAberto(): Promise<HTMLElement> {
  await waitForPortal('dialog');
  return painel()!;
}

/** Espera o painel sair do DOM. */
export async function esperarFechado(): Promise<void> {
  await waitForPortalGone('dialog');
}

/**
 * Deixa o diálogo ABERTO, venha de onde vier.
 *
 * O painel Interactions reexecuta a play no MESMO DOM, sem remontar: um clique
 * absoluto partiria do estado que a rodada anterior deixou e inverteria o
 * resultado. Cada passo estabelece a própria precondição.
 */
export async function abrir(raiz: ParentNode): Promise<HTMLElement> {
  if (!painel()) {
    const trigger = gatilho(raiz);
    if (trigger) await userEvent.click(trigger);
  }
  return esperarAberto();
}

/** O par idempotente de `abrir`. Escape porque existe em toda composição. */
export async function fechar(): Promise<void> {
  if (painel()) await userEvent.keyboard('{Escape}');
  await esperarFechado();
}

/**
 * Confere o par nome/descrição pelos ids REAIS, não por comparação de texto.
 *
 * Um `aria-labelledby` apontando para um id ausente passaria numa comparação de
 * string e reprovaria no axe por `aria-valid-attr-value` — é exatamente o caso
 * que esta checagem existe para pegar.
 */
export async function conferirNomeEDescricao(p: HTMLElement): Promise<void> {
  const idTitulo = p.getAttribute('aria-labelledby');
  await expect(idTitulo).toBeTruthy();
  const titulo = document.getElementById(idTitulo!);
  await expect(titulo).toHaveClass('nds-dialog-title');

  const idDescricao = p.getAttribute('aria-describedby');
  await expect(idDescricao).toBeTruthy();
  await expect(document.getElementById(idDescricao!)).toHaveClass('nds-dialog-description');

  await expect(p).toHaveAccessibleName(titulo!.textContent!.trim());
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
export async function conferirFocusTrap(p: HTMLElement): Promise<void> {
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
