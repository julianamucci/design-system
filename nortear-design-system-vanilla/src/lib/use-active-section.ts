/**
 * Cria um IntersectionObserver para as seções da docs page.
 *
 * `onActive` (síncrono) é chamado imediatamente quando uma seção entra no
 * viewport — use para atualizar o highlight do DocsNav.
 *
 * `onDwell` (debounced) só dispara após a seção permanecer visível por
 * `dwellMs` contínuos (default 2000ms) — use para disparar analytics. Evita
 * falsos positivos quando o usuário clica num link do nav e o scroll
 * programático atravessa várias seções intermediárias em poucos ms.
 *
 * Retorna `{ disconnect }`. Chame quando a docs page for desmontada.
 */
export function createActiveSectionObserver(
  ids: string[],
  getElement: (id: string) => Element | null,
  onActive: (id: string) => void,
  onDwell?: (id: string) => void,
  dwellMs = 2000,
): { disconnect: () => void } {
  const dwellTimers = new Map<string, number>();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target.id;
        if (entry.isIntersecting) {
          onActive(id);
          if (onDwell) {
            const timer = window.setTimeout(() => {
              onDwell(id);
              dwellTimers.delete(id);
            }, dwellMs);
            dwellTimers.set(id, timer);
          }
          break;
        } else {
          const timer = dwellTimers.get(id);
          if (timer !== undefined) {
            clearTimeout(timer);
            dwellTimers.delete(id);
          }
        }
      }
    },
    { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
  );

  for (const id of ids) {
    const el = getElement(id);
    if (el) observer.observe(el);
  }

  return {
    disconnect() {
      dwellTimers.forEach((t) => clearTimeout(t));
      observer.disconnect();
    },
  };
}
