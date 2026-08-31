/**
 * Os alcances de demonstração do cartão de autorização, uns só para as cinco.
 *
 * Mesma razão de `chat-examples.ts` e de `tool-group-examples.ts`, e a regra
 * está escrita na §3.3 da guideline 17: se cada stack escreve o próprio
 * exemplo, as cinco stories deixam de fotografar a mesma tela e a divergência
 * só aparece no Chromatic, como diferença de largura que ninguém consegue
 * atribuir a nada.
 *
 * O QUE MORA AQUI E O QUE NÃO. O DETALHE é dado — o nome que o agente chamou, o
 * caminho que ele vai tocar, a quantia que vai gastar —, e dado não se traduz.
 * O TERMO é rótulo de interface, e rótulo vive na `translations.json`; por isso
 * cada item carrega a CHAVE do termo, e não o termo. Quem monta o alcance é o
 * andaime de cada stack, que junta a chave ao texto do idioma da foto.
 *
 * ONDE ESTE ARQUIVO DEVERIA MORAR, e por que não mora lá: a §3.3 pede um
 * arquivo por FAMÍLIA (`agent-run-examples.ts`), e é para lá que estas
 * constantes vão quando alguém consolidar os exemplos da família 2. O nome por
 * slug segue o precedente que `tool-group-examples.ts` já abriu, e pelo mesmo
 * motivo mecânico: um arquivo por família é exatamente o arquivo em que duas
 * mãos colidem.
 */

/** Uma linha do alcance: a chave do termo e o valor daquele termo. */
export interface ApprovalScopeExample {
  /**
   * A chave do rótulo em `labels.scope` da `translations.json`.
   *
   * Chave, e não texto: o termo é rótulo de interface e muda com o idioma da
   * foto. Escrever "Ferramenta" aqui prenderia as cinco stacks ao português.
   */
  termKey: string;
  /** O valor, como quem consome o escreveria. Dado, e por isso não se traduz. */
  detail: string;
}

/**
 * Usar uma ferramenta que escreve fora.
 *
 * É o exemplo PADRÃO, e a escolha tem motivo: a pergunta que a peça existe para
 * fazer é sobre consequência, e publicar é a consequência mais fácil de
 * reconhecer sem contexto. As outras duas cobrem os outros dois tipos que a
 * família encontra — gastar e tocar um arquivo.
 */
export const APPROVAL_SCOPE_PUBLISH: ApprovalScopeExample[] = [
  { termKey: 'tool', detail: 'publicar_relatorio' },
  { termKey: 'target', detail: 'docs/shared/relatorios/agosto.md' },
  { termKey: 'effect', detail: 'Cria o arquivo e sobrescreve o que houver com esse nome.' },
];

/** Gastar. O alcance é a quantia e de onde ela sai. */
export const APPROVAL_SCOPE_SPEND: ApprovalScopeExample[] = [
  { termKey: 'tool', detail: 'comprar_creditos' },
  { termKey: 'cost', detail: 'R$ 128,00' },
  { termKey: 'target', detail: 'Carteira da equipe de conteúdo' },
];

/**
 * Tocar um arquivo, com um caminho LONGO de propósito.
 *
 * O caminho comprido é o assunto deste exemplo, e não um descuido: alcance pela
 * metade é autorização pela metade, e é aqui que se vê a quebra em vez das
 * reticências que a folha proíbe.
 */
export const APPROVAL_SCOPE_WRITE_FILE: ApprovalScopeExample[] = [
  { termKey: 'tool', detail: 'gravar_arquivo' },
  {
    termKey: 'target',
    detail: 'nortear-design-system-vanilla/src/components/ui/approval-card.fixtures.ts',
  },
];

/**
 * Os identificadores de escolha dos exemplos.
 *
 * SÃO A POLÍTICA DE UM PRODUTO, e não a do design system — a §7 da guideline 17
 * é explícita: o que "sempre permitir" abrange, o que acontece ao recusar e se
 * a escolha vale para as próximas não estão aqui e não vão estar. Estes três
 * existem para que a demonstração tenha o que apertar, e para que o evento
 * tenha um valor de exemplo a relatar.
 *
 * Quem consome escreve os seus, com os nomes que a política dele tiver.
 */
export const APPROVAL_CHOICE_ALLOW_ONCE = 'allow-once';
export const APPROVAL_CHOICE_ALWAYS = 'always';
export const APPROVAL_CHOICE_DENY = 'deny';

/**
 * Na ordem em que os controles aparecem na demonstração.
 *
 * A ordem é do produto do exemplo, e a peça não a conhece: para ela, o espaço
 * dos controles é uma lista de elementos que chega pronta.
 */
export const APPROVAL_EXAMPLE_CHOICES: readonly string[] = [
  APPROVAL_CHOICE_ALLOW_ONCE,
  APPROVAL_CHOICE_ALWAYS,
  APPROVAL_CHOICE_DENY,
] as const;
