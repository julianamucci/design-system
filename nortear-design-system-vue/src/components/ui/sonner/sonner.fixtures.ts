import { waitFor } from 'storybook/test';
import { toast } from 'vue-sonner';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

/**
 * Notificação que fica na tela até a story ser desmontada.
 *
 * As stories que existem para ser FOTOGRAFADAS (tipos, composições, posições)
 * usam isto de propósito. Com prazo normal, a notificação pode estar no meio do
 * fade de saída no instante em que o axe mede contraste — e uma razão perto de
 * 1.0 num elemento em transição parece paleta ruim sem ser. Prazo infinito torna
 * o estado final determinístico; a limpeza fica por conta do `clearToasts()`
 * no início da próxima rodada.
 */
export const PERSISTENT = { duration: Number.POSITIVE_INFINITY } as const;

/**
 * Apoio das stories do Sonner.
 *
 * Existe por dois motivos que custaram caro em outros componentes:
 *
 * 1. A notificação entra no DOM ANTES de estar medível. A lib desenha o `<li>`
 *    e só no quadro seguinte marca `data-mounted='true'`, que é o que dispara a
 *    transição de opacidade. Afirmar sobre retângulo, visibilidade ou contraste
 *    no primeiro quadro lê um elemento no meio do fade.
 *
 * 2. A fila é global ao módulo e o contêiner é portalizado. Uma story que
 *    empilha notificações e não limpa entrega lixo para a rodada seguinte — e o
 *    painel Interactions REEXECUTA a play no mesmo DOM, sem remontar. Por isso
 *    toda play começa por `clearToasts()`.
 *
 * O markup é o da lib (`[data-sonner-toast]`, `[data-title]`, `[data-button]`),
 * e não o `.nds-toast` que Vanilla e Angular montam à mão. É divergência de
 * implementação registrada, não desalinhamento a corrigir: a lib desenha a
 * própria árvore e o contrato compartilhado aqui é o COMPORTAMENTO.
 */

/**
 * Todas as notificações presentes no documento, na ordem em que a lib as
 * desenha — que é a MAIS NOVA PRIMEIRO, e não a ordem de chegada. Divergência
 * de implementação registrada: as stacks que desenham a pilha com o CSS do
 * design system acrescentam ao fim.
 */
export function toastsOnScreen(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-sonner-toast]'));
}

/**
 * O tipo semântico de uma notificação.
 *
 * A lib só escreve `data-type` quando existe tipo: uma notificação neutra sai
 * SEM o atributo, e não com `data-type='default'`. Ler o atributo cru fazia todo
 * filtro por `default` procurar algo que nunca esteve no DOM.
 */
export function toastType(el: Element): ToastType {
  return (el.getAttribute('data-type') as ToastType | null) ?? 'default';
}

/** Espera a notificação aparecer E assentar. */
export async function waitForToast(
  filtro: { type?: ToastType; text?: string | RegExp } = {},
  timeout = 4000,
): Promise<HTMLElement> {
  return await waitFor(
    () => {
      const found = toastsOnScreen().filter((el) => {
        if (filtro.type && toastType(el) !== filtro.type) return false;
        if (filtro.text === undefined) return true;
        const text = el.textContent ?? '';
        return typeof filtro.text === 'string'
          ? text.includes(filtro.text)
          : filtro.text.test(text);
      });

      const el = found[0];
      if (!el) throw new Error(`nenhuma torrada ${JSON.stringify(filtro)} na tela`);
      if (el.getAttribute('data-mounted') !== 'true') {
        throw new Error('torrada ainda entrando (data-mounted=false)');
      }
      if (el.getAttribute('data-removed') === 'true') {
        throw new Error('torrada saindo (data-removed=true)');
      }
      const opacity = Number.parseFloat(getComputedStyle(el).opacity);
      if (opacity < 0.99) throw new Error(`torrada em fade: opacity=${opacity}`);
      return el;
    },
    { timeout, interval: 30 },
  );
}

/** Espera a tela ficar sem notificação nenhuma — inclusive as que estão saindo. */
export async function waitForNoToasts(timeout = 4000): Promise<void> {
  await waitFor(
    () => {
      const remaining = toastsOnScreen().length;
      if (remaining > 0) throw new Error(`ainda há ${remaining} torrada(s) na tela`);
    },
    { timeout, interval: 30 },
  );
}

/**
 * Precondição de toda play: fila vazia e nada em transição.
 *
 * A espera fixa no fim cobre o `TIME_BEFORE_UNMOUNT` da lib (200ms): sem ela a
 * story seguinte montaria a região a tempo de desenhar a notificação da
 * anterior.
 */
export async function clearToasts(): Promise<void> {
  toast.dismiss();
  await waitForNoToasts();
  await new Promise<void>((resolve) => setTimeout(resolve, 300));
}

// ─── Textos das demonstrações ─────────────────────────────────────────────────
//
// Um lugar só: os mesmos textos aparecem nos quatro arquivos de story, e três
// cópias divergiriam na primeira revisão de conteúdo.

export const TEXTS = {
  padrao: 'Código copiado.',
  sucesso: 'Alterações salvas.',
  erro: 'Não foi possível salvar. Tente novamente.',
  aviso: 'Sua sessão expira em 5 minutos.',
  info: 'Nova versão disponível.',
  loading: 'Enviando arquivo...',
  comDescricao: 'Preferências atualizadas.',
  comDescricaoDetalhe:
    'Suas configurações foram salvas e entrarão em vigor na próxima sessão.',
  comAcao: 'Item excluído.',
  comAcaoRotulo: 'Desfazer',
  promessaCarregando: 'Enviando arquivo...',
  promessaSucesso: 'Arquivo enviado com sucesso.',
  promessaErro: 'Erro ao enviar. Tente novamente.',
  persistente: 'Falha crítica no servidor.',
} as const;
