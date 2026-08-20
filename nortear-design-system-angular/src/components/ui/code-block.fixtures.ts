/**
 * Andaimes de teste do CodeBlock — um módulo, quatro arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * `root` estava copiada byte a byte em três arquivos. `withClipboardStub`
 * DIVERGIA entre os dois que a tinham, e a divergência tinha motivo: a story
 * do playground precisa espiar o texto que foi copiado, e por isso recebia o
 * espião; as de estado só precisam que a Clipboard API pare de rejeitar, e por
 * isso não recebiam nada. Virou parâmetro com padrão — quem não passa espião
 * continua com um stub que apenas resolve.
 */

/** Raiz do bloco renderizado pela story. */
export function root(canvasElement: HTMLElement): HTMLElement {
  return canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;
}

/**
 * Roda `run` com `navigator.clipboard.writeText` substituído.
 *
 * O clipboard real não funciona no browser de teste: a Clipboard API rejeita
 * por permissão e o fallback via `execCommand` exige user activation, que
 * evento sintético não tem. Sem o stub, `copyText` devolve `false` e o
 * componente — corretamente — não confirma nada, e o teste mediria o browser em
 * vez do componente.
 *
 * Nada aqui LÊ a área de transferência: o que se verifica é o feedback visível
 * e o anúncio por região de status. `spy` só registra o que o componente mandou
 * copiar; o padrão apenas resolve.
 */
export async function withClipboardStub(
  run: () => Promise<void>,
  spy: (text: string) => Promise<unknown> = () => Promise.resolve(),
): Promise<void> {
  const original = navigator.clipboard;
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: spy },
    configurable: true,
  });
  try {
    await run();
  } finally {
    Object.defineProperty(navigator, 'clipboard', { value: original, configurable: true });
  }
}
