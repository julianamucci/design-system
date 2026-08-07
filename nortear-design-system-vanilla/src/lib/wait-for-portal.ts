import { within, waitFor } from 'storybook/test';

// ─── Espera de portais animados nos testes ────────────────────────────────────
// O browser dos testes NÃO emula prefers-reduced-motion: as animações de
// entrada e saída rodam de verdade, como para a maioria dos usuários. Medir no
// quadro zero (logo após o clique que abre) lê opacity: 0 e reprova por
// "invisível" — asserção racy, não bug de componente.
//
// Use estes helpers em vez de `findByRole` cru sempre que o alvo for um
// elemento portalizado no <body> (dialog, alert-dialog, sheet, drawer,
// popover, tooltip). Eles esperam a animação concluir antes de devolver.
//
// NÃO use para o que é síncrono — foco por Tab/Shift+Tab e restauração de foco
// ao fechar não dependem de animação, e envolvê-los mascara bug de foco real.

type PortalRole =
  | 'tooltip'
  | 'dialog'
  | 'alertdialog'
  | 'listbox'
  | 'menu'
  | 'menuitem'
  | 'option'
  | 'button';

/**
 * Aguarda um elemento portalizado aparecer E a animação de entrada concluir.
 * - Procura no `document.body` (não no canvas — portais escapam do canvas)
 * - Exige opacidade praticamente final (> 0.9) e `data-state` != "closed"
 */
export async function waitForPortal(
  role: PortalRole,
  options: { name?: string | RegExp; timeout?: number } = {},
): Promise<HTMLElement> {
  const { name, timeout = 4000 } = options;
  const body = within(document.body);

  return await waitFor(
    async () => {
      const el = name
        ? await body.findByRole(role, { name })
        : await body.findByRole(role);
      const styles = window.getComputedStyle(el);
      const opacity = parseFloat(styles.opacity);
      if (styles.opacity !== '1' && opacity < 0.9) {
        throw new Error(`Portal ${role} opacity=${styles.opacity}, ainda animando`);
      }
      if (el.getAttribute('data-state') === 'closed') {
        throw new Error(`Portal ${role} data-state=closed`);
      }
      return el;
    },
    { timeout, interval: 50 },
  );
}

/**
 * Aguarda o portal sumir do DOM.
 *
 * As factories desta stack adiam a remoção até a animação de saída terminar
 * (`animationend` + timeout de segurança), então o elemento continua no
 * documento por algumas centenas de ms depois do Escape/clique que fechou.
 * O timeout default cobre esse atraso com folga.
 */
export async function waitForPortalGone(
  role: PortalRole,
  timeout = 2000,
): Promise<void> {
  const body = within(document.body);
  await waitFor(
    () => {
      const elements = body.queryAllByRole(role);
      if (elements.length > 0) throw new Error(`Portal ${role} ainda aberto`);
    },
    { timeout, interval: 50 },
  );
}

/**
 * Aguarda um elemento específico sair do DOM — para dispensa animada que não
 * é portal (alert dismissible, por exemplo), onde a factory só remove depois
 * do `animationend`.
 */
export async function waitForRemoval(el: Element, timeout = 2000): Promise<void> {
  await waitFor(
    () => {
      if (el.isConnected) throw new Error('elemento ainda no documento');
    },
    { timeout, interval: 50 },
  );
}
