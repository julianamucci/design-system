/**
 * Transforms do painel Code do seletor do gatilho.
 *
 * Módulo de TS puro, sem import de componente: é o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm — a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica
 * `<wrapper …/>`, que não é um componente que alguém possa importar.
 *
 * A LISTA DE OPÇÕES NÃO ENTRA NO SNIPPET. Ela é dado do exemplo — quatro
 * pessoas e dois comandos —, e despejá-la faria o painel ensinar o andaime em
 * vez do componente. O snippet nomeia a constante e mostra o que se faz com
 * ela, que é onde estão as duas decisões que importam: onde o gatilho vale e o
 * que a lista oferece.
 *
 * E O TEXTO INICIAL NÃO ENTRA, porque nesta stack ele não é atributo: é a ponta
 * de fora de um vínculo. Divergência de API de framework se registra, não se
 * "alinha" — o que a story fixa por texto inicial, aqui é o valor com que quem
 * consome declara a variável vinculada.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** Quais gatilhos a story declara. */
export type TriggerArgs = {
  mention?: boolean;
  command?: boolean;
};

/** O contexto que o painel Code entrega à transform. */
type TriggerContext = { args?: TriggerArgs };

/** O snippet completo, com um gatilho ou com os dois. */
export function triggerSnippet(opts: TriggerArgs = {}): string {
  const sources: string[] = [];
  if (opts.mention !== false) sources.push('{ spec: MENTION_TRIGGER, options: pessoas }');
  if (opts.command) sources.push('{ spec: COMMAND_TRIGGER, options: comandos }');

  const list =
    sources.length === 1
      ? `triggers={[${sources[0]}]}`
      : `triggers={[\n    ${sources.join(',\n    ')},\n  ]}`;

  const script = [
    "import { Composer } from '@/components/ui/composer';",
    `import { ${opts.command ? 'COMMAND_TRIGGER, ' : ''}MENTION_TRIGGER } from '@shared/primitives/composer-trigger';`,
    '',
    // NOME LIGADO É NOME DECLARADO: a lista de cada gatilho, os rótulos e o
    // envio moravam só no arquivo da story, e o bloco do painel é copiado
    // inteiro.
    "let texto = $state('');",
    'const labels = { /* os rótulos do campo */ };',
    'const triggerLabels = { /* os rótulos da lista do gatilho */ };',
    '',
    '// As opções de cada gatilho são de quem consome: quem pode ser mencionado,',
    '// e que comandos existem.',
    ...(opts.mention !== false ? ['const pessoas = [/* quem pode ser mencionado */];'] : []),
    ...(opts.command ? ['const comandos = [/* os comandos oferecidos */];'] : []),
    '',
    'function enviar() { /* manda o texto para a conversa */ }',
  ].join('\n');

  const attributes = attrsMultilinha([
    'bind:value={texto}',
    '{labels}',
    '{triggerLabels}',
    list,
    'onSubmit={enviar}',
  ]);

  return svelteSnippet(script, `<Composer${attributes} />`);
}

/** Transform do `meta` do Playground: lê os args da story e devolve o uso real. */
export function triggerPopoverSource(_gerado?: unknown, ctx?: TriggerContext): string {
  return triggerSnippet(ctx?.args ?? {});
}

/** Transform do `meta` das variações, dos estados e das composições. */
export function triggerPopoverBaseSource(): string {
  return triggerSnippet();
}

/** Só a menção, que vale em começo de qualquer palavra. */
export function triggerPopoverMentionsSource(): string {
  return triggerSnippet({ mention: true });
}

/** Só o comando, que vale na primeira posição do campo. */
export function triggerPopoverCommandsSource(): string {
  return triggerSnippet({ mention: false, command: true });
}

/** O estado filtrado nasce do que foi digitado, e não de outra declaração. */
export function triggerPopoverFilteredSource(): string {
  return triggerSnippet();
}

/** O painel sem resultado é o mesmo painel — o que muda é o termo. */
export function triggerPopoverEmptySource(): string {
  return triggerSnippet();
}

/** Fechado é o repouso do mesmo campo. */
export function triggerPopoverClosedSource(): string {
  return triggerSnippet();
}

/** Escolher pelo teclado não pede declaração nenhuma a mais. */
export function triggerPopoverKeyboardSource(): string {
  return triggerSnippet();
}

/** Nem escolher pelo ponteiro. */
export function triggerPopoverPointerSource(): string {
  return triggerSnippet();
}
