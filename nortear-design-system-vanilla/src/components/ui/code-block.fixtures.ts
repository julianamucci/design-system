/**
 * Andaimes de teste do CodeBlock — um módulo, dois arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * `withClipboardStub` estava copiada byte a byte nos dois arquivos, e havia uma
 * TERCEIRA cópia à mão dentro de uma `play` de `code-block.stories.ts` — a única
 * que precisava espiar o texto copiado. Por isso o espião entra por parâmetro
 * com padrão: quem só precisa que a API não rejeite não passa nada, e quem mede
 * o que foi copiado passa o seu.
 */

/**
 * Roda `run` com `navigator.clipboard.writeText` substituído.
 *
 * O clipboard real não funciona no browser de teste: a Clipboard API rejeita por
 * permissão e o fallback via `execCommand` exige user activation, que evento
 * sintético não tem. Sem o stub, `copyText` devolve `false` e o componente —
 * corretamente — não confirma nada, e o teste mediria o browser em vez do
 * componente.
 *
 * Nada aqui LÊ a área de transferência: o que se verifica é o feedback visível e
 * o anúncio por região de status. `spy` só registra o que o componente mandou
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
