import { fn } from 'storybook/test';

/**
 * Andaime de navegação do Breadcrumb — uma fábrica, dois arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * O corpo das duas cópias era idêntico, mas cada uma fechava sobre o ESPIÃO do
 * próprio arquivo — um estado de módulo que a assinatura não mostra. Exportar
 * uma função pronta faria os dois arquivos de story dividirem o mesmo espião, e
 * a contagem de um vazaria para o outro. Por isso o que se exporta é uma
 * fábrica: cada arquivo chama uma vez e fica com o seu par.
 */

export interface NavigationEspionada {
  /** Espião de escopo de módulo: dentro do `render`, a play não o alcançaria. */
  onNavigate: ReturnType<typeof fn>;
  /** Impede a navegação de verdade e registra o clique, como um handler real faria. */
  aoNavegar: (event: Event) => void;
}

/** Um par espião ↔ handler, novo a cada chamada. */
export function navigationEspionada(): NavigationEspionada {
  const onNavigate = fn();
  return {
    onNavigate,
    aoNavegar: (event: Event) => {
      event.preventDefault();
      onNavigate({ label: (event.currentTarget as HTMLElement).textContent?.trim() });
    },
  };
}
