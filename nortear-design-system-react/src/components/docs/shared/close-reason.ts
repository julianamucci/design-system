/**
 * Mapeia o motivo de fechamento do base-ui (`eventDetails.reason` do
 * `onOpenChange`) para o vocabulário do evento `dialog_close` do catálogo
 * tipado de analytics. Motivos sem correspondência direta (focus-out,
 * trigger-press, none) caem em 'user'.
 */
export function mapCloseReason(
  reason?: string,
): 'escape' | 'overlay' | 'close-button' | 'action' | 'user' {
  switch (reason) {
    case 'escape-key':
      return 'escape';
    case 'outside-press':
      return 'overlay';
    case 'close-press':
      return 'close-button';
    case 'imperative-action':
      return 'action';
    default:
      return 'user';
  }
}
