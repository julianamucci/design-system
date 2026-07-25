import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue';

/**
 * Observa as seções da docs page via IntersectionObserver e mantém o id da
 * seção ativa (para destacar o item no DocsNav).
 *
 * O callback `onSectionChange` só dispara após a seção permanecer visível por
 * `dwellMs` contínuos (default 2000ms). Isso evita falsos positivos quando o
 * usuário clica num link do nav e o scroll programático atravessa várias
 * seções intermediárias em poucos ms.
 *
 * O `activeId` (highlight do nav) continua reagindo imediatamente à seção
 * visível — apenas o evento de analytics é debounced pelo dwell.
 */
export function useActiveSection(
  ids: Ref<string[]>,
  onSectionChange?: (id: string) => void,
  dwellMs = 2000,
) {
  const activeId = ref<string>(ids.value[0] ?? '');
  let observer: IntersectionObserver | null = null;
  const dwellTimers = new Map<string, number>();

  function start() {
    observer?.disconnect();
    dwellTimers.forEach((t) => clearTimeout(t));
    dwellTimers.clear();

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) {
            activeId.value = id;
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

    ids.value.forEach((id) => {
      const el = document.getElementById(id);
      if (el && observer) observer.observe(el);
    });
  }

  onMounted(start);
  watch(ids, start, { deep: true });

  onUnmounted(() => {
    dwellTimers.forEach((t) => clearTimeout(t));
    observer?.disconnect();
  });

  return { activeId };
}
