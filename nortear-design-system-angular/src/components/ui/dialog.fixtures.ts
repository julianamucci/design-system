import { expect, userEvent, waitFor } from 'storybook/test';
import { useTranslation } from '@/lib/i18n';
import dialogTranslations from '@shared/content/dialog/translations.json';

// Rótulos e helpers compartilhados pelas quatro stories de Dialog.
//
// Arquivo à parte porque num `*.stories.ts` TODO export nomeado vira uma story:
// um helper exportado apareceria na sidebar como se fosse um exemplo, e o
// Storybook tentaria renderizá-lo.

const { t } = useTranslation(dialogTranslations as Record<string, unknown>);

/**
 * Os textos saem do conteúdo compartilhado e entram no template como `props`,
 * nunca interpolados na string do template: assim o mesmo valor alimenta o
 * exemplo e as asserções da play, e nenhum apóstrofo precisa de escape.
 */
export const LABELS = {
  trigger: t('demonstration.labels.triggerLabel'),
  title: t('demonstration.labels.title'),
  description: t('demonstration.labels.description'),
  action: t('demonstration.labels.action'),
  cancel: t('demonstration.labels.cancel'),
  footerNote: t('demonstration.labels.footerNote'),
  // O botão X do canto precisa de nome acessível próprio. A regra de formato
  // está em `usage.uxWriting.table.srOnly` do conteúdo compartilhado: verbo no
  // infinitivo, uma palavra.
  close: 'Fechar',
};

/**
 * Imagem de exemplo da composição de pré-visualização de mídia.
 *
 * SVG em data URI e não um arquivo: a story não pode depender de rede, e o
 * Chromatic capturaria um quadro sem imagem se o carregamento atrasasse.
 */
export const IMG_PLACEHOLDER =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%23cbd5e1'/%3E%3C/svg%3E";

// O painel vive no `<body>`, fora do `canvasElement`: o portal é o que isola o
// diálogo de `overflow` e `transform` de qualquer ancestral. Toda consulta ao
// conteúdo aberto sai de `document`.

export const panel = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-slot="dialog-content"]');

export const overlay = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]');

/**
 * Espera o painel montar E a animação de entrada assentar.
 *
 * `data-starting-style` é o que segura o primeiro quadro da animação. Checar
 * contraste ou medir o painel antes disso mediria o meio do fade, não o estado
 * final — foi assim que uma violação de contraste com razão ~1.0 já apareceu em
 * outro componente.
 */
export async function waitForOpen(): Promise<HTMLElement> {
  const p = await waitFor(() => {
    const el = panel();
    if (!el) throw new Error('painel do diálogo ainda não montou');
    if (el.hasAttribute('data-starting-style')) throw new Error('animação de entrada em curso');
    return el;
  });

  // `data-starting-style` sai no primeiro quadro, ou seja, quando a animação
  // COMEÇA — e as keyframes de entrada partem de `opacity: 0`. Uma asserção de
  // visibilidade logo depois pega o painel invisível, e a mensagem culpa o
  // componente. Esperar as animações do painel e do overlay terminarem é o que
  // separa "ainda entrando" de "aberto".
  const animacoes = [p, overlay()]
    .filter((el): el is HTMLElement => el !== null)
    .flatMap((el) => el.getAnimations().map((a) => a.finished.catch(() => undefined)));
  await Promise.all(animacoes);

  return p;
}

/**
 * Espera o painel sair do DOM.
 *
 * Fechar não desmonta na hora: o primitivo mantém a view montada até a animação
 * de saída terminar, senão o fechamento não teria o que animar.
 */
export async function waitForClosed(): Promise<void> {
  await waitFor(() => {
    if (panel()) throw new Error('painel do diálogo ainda montado');
  });
}

/**
 * Deixa o diálogo ABERTO, venha de onde vier.
 *
 * O painel Interactions reexecuta a play no MESMO DOM, sem remontar: uma story
 * que nasce com `defaultOpen` e termina fechada encontraria, na segunda rodada,
 * um painel que não existe mais — e `esperarAberto()` ficaria esperando até o
 * timeout. Cada passo estabelece a própria precondição, e abrir é a precondição
 * de quase todos.
 *
 * Clica no gatilho só se estiver fechado; se já estiver aberto, apenas espera a
 * animação assentar.
 */
export async function open(root: ParentNode): Promise<HTMLElement> {
  if (!panel()) {
    const trigger = root.querySelector<HTMLElement>('[data-slot="dialog-trigger"]');
    if (trigger) await userEvent.click(trigger);
  }
  return waitForOpen();
}

/**
 * Deixa o diálogo FECHADO, venha de onde vier — o par idempotente de `open`.
 *
 * Escape e não o botão X: a saída por teclado existe em toda composição,
 * inclusive nas que escondem o X.
 */
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
}
