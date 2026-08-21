/**
 * A ÁREA DE CLIQUE DIREITO — o vocabulário de classe, compartilhado pelas 5 stacks.
 *
 * O ContextMenu não tem botão: o que a pessoa vê é uma moldura tracejada dizendo
 * "clique com o botão direito aqui". Essa moldura é o componente inteiro do ponto
 * de vista de quem olha a página, e ela estava diferente em cada stack — três
 * pediam o tracejado por classes que não existem no CSS (`border-dashed`,
 * `border-2`, `cursor-default`, sem o prefixo `nds-`), uma renderizava a moldura
 * SÓLIDA, outra grossa e da cor do texto, e a docs page do Angular não desenhava
 * moldura nenhuma.
 *
 * Duas coisas valem a nota:
 *
 * - **As duas classes de borda são necessárias.** `nds-border-default` traz
 *   largura e cor; `nds-border-dashed` só troca `border-style`. Sozinha, ela
 *   herda a largura inicial (`medium`) e a cor do texto.
 * - **Sem altura fixa.** O quadro nasce do `nds-p-8`, então cresce junto quando a
 *   pessoa aumenta a fonte do navegador (WCAG 1.4.4). Era `height: 120px` inline
 *   nas quatro docs pages de navegador.
 *
 * Vive em `primitives/`, e não em `testing/`, porque as docs pages são PRODUTO:
 * o módulo de testes importa `storybook/test`, e arrastá-lo para o bundle da
 * página por causa de uma string seria pagar caro por nada. O módulo de testes
 * reexporta esta constante para as stories.
 */
export const AREA_CLICK_DIREITO =
  'nds-cluster nds-w-xs nds-p-8 nds-rounded-md nds-border-default nds-border-dashed nds-text-body nds-text-muted-foreground nds-cursor-default';
