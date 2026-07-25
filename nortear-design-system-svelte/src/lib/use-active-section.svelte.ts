/**
 * Observa as seções da docs page via IntersectionObserver e retorna um wrapper
 * reativo do id da seção ativa (para destacar o item no DocsNav).
 *
 * O callback `onSectionChange` só dispara após a seção permanecer visível por
 * `dwellMs` contínuos (default 2000ms). Isso evita falsos positivos quando o
 * usuário clica num link do nav e o scroll programático atravessa várias
 * seções intermediárias em poucos ms.
 *
 * O `activeId` (highlight do nav) continua reagindo imediatamente à seção
 * visível — apenas o evento de analytics é debounced pelo dwell.
 *
 * Uso (dentro de $effect):
 *   const section = createActiveSection(ids, (id) => track(...));
 *   // section.value para ler reativamente
 *   $effect(() => section.attach());  // monta o observer; retorna cleanup
 */
export function createActiveSection(
  ids: string[],
  onSectionChange?: (id: string) => void,
  dwellMs = 2000,
) {
  let activeId = $state<string>(ids[0] ?? '');

  function attach() {
    const dwellTimers = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) {
            activeId = id;
            if (onSectionChange) {
              const timer = window.setTimeout(() => {
                onSectionChange(id);
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
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => {
      dwellTimers.forEach((t) => clearTimeout(t));
      observer.disconnect();
    };
  }

  return {
    get value() { return activeId; },
    attach,
  };
}
