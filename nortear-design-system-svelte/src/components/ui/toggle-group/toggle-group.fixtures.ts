// Fixture compartilhada pelas stories do ToggleGroup.
//
// `ligado` estava copiado em três arquivos de story. A leitura do estado é a
// única coisa que TODA play deste componente faz, e ela depende de um detalhe
// que não é óbvio (dois atributos ARIA distintos, um por modo): manter três
// cópias é manter três chances de alguém "simplificar" uma delas para ler só um
// dos dois e deixar o outro modo passando em falso.
//
// Módulo à parte porque num `*.stories.ts` TODO export nomeado vira story: um
// helper exportado apareceria na sidebar como se fosse um exemplo.

/**
 * O item está ligado?
 *
 * O estado é anunciado por `aria-checked` no modo exclusivo (a lib anuncia o
 * grupo como conjunto de rádio) e por `aria-pressed` no combinado. Ler os DOIS
 * mantém a play honesta nos dois modos — cada consulta sozinha devolveria
 * `false` no modo que não é o seu, e "nada está ligado" é um resultado que
 * passa despercebido em asserção de desligamento.
 */
export function ligado(el: Element): boolean {
  return (
    el.getAttribute('aria-checked') === 'true' || el.getAttribute('aria-pressed') === 'true'
  );
}
