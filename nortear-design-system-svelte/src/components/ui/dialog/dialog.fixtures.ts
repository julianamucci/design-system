import { expect, userEvent, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';

// Helpers compartilhados pelas quatro stories de Dialog.
//
// Arquivo à parte porque num `*.stories.ts` TODO export nomeado vira uma story:
// um helper exportado apareceria na sidebar como se fosse um exemplo.
//
// Tudo aqui procura pelo CONTRATO de markup (`data-slot`), nunca por texto: o
// rótulo visível segue o idioma escolhido na toolbar, e uma play presa a
// "Editar perfil" quebraria em inglês e espanhol sem nada de errado no
// componente.

/** O painel vive no `<body>`, fora do `canvasElement` — o portal é o ponto. */
export const panel = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-slot="dialog-content"]');

export const overlay = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]');

export const trigger = (root: ParentNode): HTMLElement | null =>
  root.querySelector<HTMLElement>('[data-slot="dialog-trigger"]');

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

/** Espera o painel sair do DOM — fechar não desmonta antes da animação de saída. */
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
    if (triggerEl) {
      // A trava de rolagem do primitivo desta stack põe `pointer-events: none`
      // no documento e só a solta um tique DEPOIS de o painel sair do DOM.
      // Clicar antes disso falha com "element has pointer-events: none", e o
      // culpado aparente seria o gatilho. Esperar a trava sair é esperar o
      // fechamento terminar de verdade — não é folga para asserção nenhuma.
      await waitFor(() => {
        if (getComputedStyle(triggerEl).pointerEvents === 'none') {
          throw new Error('trava de rolagem do diálogo ainda ativa');
        }
      });
      await userEvent.click(triggerEl);
    }
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
export async function checkNameEDescricao(p: HTMLElement): Promise<void> {
  const idTitle = p.getAttribute('aria-labelledby');
  await expect(idTitle).toBeTruthy();
  await expect(document.getElementById(idTitle!)).toHaveAttribute('data-slot', 'dialog-title');

  const idDescription = p.getAttribute('aria-describedby');
  await expect(idDescription).toBeTruthy();
  await expect(document.getElementById(idDescription!)).toHaveAttribute(
    'data-slot',
    'dialog-description',
  );

  // O nome acessível é o texto do título REAL, e não uma constante: assim a
  // asserção vale nos três idiomas.
  const title = document.getElementById(idTitle!)!;
  await expect(p).toHaveAccessibleName(title.textContent!.trim());
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
