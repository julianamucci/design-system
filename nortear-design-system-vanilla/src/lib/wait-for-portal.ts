import { within, waitFor } from 'storybook/test';

// ─── Regras do axe de uma story ───────────────────────────────────────────────

/**
 * Regras do axe de uma story que precisa de guarda — **use isto, nunca um array
 * cru**.
 *
 * O Storybook SUBSTITUI array ao mesclar parâmetro, em vez de concatenar. Então
 * `a11y: { config: { rules: [{ id: '…', enabled: false }] } }` numa story apaga
 * o `rules` global do `preview.ts`, que é onde `target-size` (WCAG 2.5.8) está
 * ligado — o axe não roda regra 2.2 por default, e essa linha é a única coisa
 * que faz alvo de toque ser medido no repositório. A story deixa de medir alvo
 * de toque, e nada acusa: fica verde por medir MENOS.
 *
 * O defeito é silencioso nos dois sentidos: quem escreve a exceção está falando
 * de UMA regra (contraste, rolagem) e derruba de carona um portão que fala de
 * outra coisa. Foi assim que ele apareceu — por acaso, ao notar que a exceção de
 * `scrollable-region-focusable` da `LongMenu` do Menubar apagava junto o
 * `target-size`.
 *
 * Medido no repositório inteiro em 2026-09-19: 83 arquivos de story nas cinco
 * stacks declaravam array cru, e nenhum preservava a regra global. Nesta stack
 * eram 2 arquivos, 2 pontos — o menor dos cinco lotes, porque aqui não há lib
 * headless e portanto não há âncora de foco a silenciar (o `FOCUS_RULE_GUARDA`
 * das outras stacks não existe nesta).
 *
 * A exceção continua sendo declarada no call site, com a premissa medida; o que
 * este helper garante é que declarar UMA exceção não apague as demais.
 *
 * **O número acima envelhece; o portão não.** Quem cobra esta forma é a regra
 * `regra_de_axe_crua` do `scripts/audit.mjs`, que reprova `rules: [` perto de
 * `a11y` em qualquer story das cinco stacks. Ela nasceu junto com esta
 * conversão, e pelo motivo que o próprio helper ilustra: quando ele foi criado,
 * o docblock dele já trazia a medição do defeito — e a conversão parou em 4
 * arquivos, com o número certo escrito ao lado.
 */
export const axeRules = (...guards: ReadonlyArray<{ id: string; enabled: boolean }>) => [
  { id: 'target-size', enabled: true },
  ...guards,
];

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
 * Aguarda as animações DAQUELE elemento terminarem. Leitura pura.
 *
 * Irmã de `waitForPortal`, e existe porque a pergunta é outra. Aquela espera o
 * painel ficar VISÍVEL (opacidade quase final), que é o bastante para afirmar
 * presença; esta espera a animação ACABAR, que é o que uma medida de GEOMETRIA
 * precisa — `nds-menu-in` anima `translateY` e `scale(0.98)`, e os dois entram
 * no `getBoundingClientRect`.
 *
 * Medido em 2026-09-18, quando o painel de menu desta stack passou a animar a
 * entrada como as outras quatro (D5): a `Placement` do DropdownMenu passou a
 * ler 1,28px de diferença entre as bordas direitas — que é exatamente 2% da
 * largura do painel, o `scale` a meio caminho —, e a `Playground` do Menubar
 * mediu 4,9px de vão onde a folha declara 8, que é o `translateY` ainda em
 * curso. Nenhum dos dois era defeito de posição: eram medidas tiradas no meio
 * de um quadro de animação.
 *
 * `finished` rejeita quando a animação é cancelada (o painel sai antes de
 * terminar); ali não há o que esperar, e o `catch` devolve o controle em vez de
 * derrubar a play. Animação já concluída não aparece em `getAnimations()`
 * (a escada não usa `fill`), então chamar depois da hora resolve na hora.
 */
export async function waitForAnimationsDone(el: Element): Promise<void> {
  await Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined)));
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
