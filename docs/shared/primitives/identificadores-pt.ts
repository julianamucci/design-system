/**
 * Identificadores que ainda estão em português, e o motivo de cada um seguir
 * assim.
 *
 * A campanha de tradução aplicou 2384 nomes em nove lotes por varredura. O que
 * restou não é resto mecânico: é o que uma varredura não pode decidir — nome
 * cujo alvo em inglês já existe no mesmo arquivo com outro sentido, nome que
 * significa duas coisas em dois lugares, nome cujo alvo natural é palavra
 * reservada.
 *
 * Esta lista existe para que a decisão apareça no lugar certo. O auditor cobra
 * `identificador_pt` por componente, então quem revisa um componente vê os
 * nomes DELE — em vez de um backlog global que ninguém lê.
 *
 * **Como fechar um item:** renomeie e tire daqui. A lista encolhe; quando
 * esvaziar, a regra fica calada sozinha.
 *
 * **Como declarar que um nome FICA:** mova para `MANTIDOS` com o motivo. Aqui
 * vale a mesma regra do vocabulário da sidebar — decisão declarada vale mais
 * que decisão inferida, e o auditor não distingue "ainda não decidi" de "decidi
 * que fica" se ninguém escrever qual dos dois é.
 *
 * ---
 *
 * **A base de contagem (`identificadores-pt-baseline.json`) foi REGENERADA em
 * 2026-09-18, e a regeneração não concedeu anistia nenhuma.** Ela tinha sido
 * gerada com o contador de identificadores defeituoso — ele atravessava a
 * fronteira de literal e contava prosa como código —, e por isso errava em 246
 * dos 673 arquivos. Medido antes de regenerar, entre os arquivos que a regra de
 * fato audita:
 *
 *     sobem sob o contador corrigido   0   ← seria anistia, e não há
 *     descem (a base dava folga)      41
 *     iguais                         506
 *
 * Ou seja, a regeneração só APERTOU. A decisão da dona foi pagar antes de
 * regenerar; a medição mostrou que não havia o que pagar aqui, e o caminho mudou
 * com ela.
 *
 * **PENDÊNCIA · 2026-09-18 — a base cobre mais arquivos do que a regra audita.**
 * O gerador percorre **673** arquivos e a regra `identificador_pt_novo` audita
 * **547**: ela itera por SLUG, e slug sai de `docs/shared/content/<slug>/`. Os
 * 126 de diferença estão em `src/components/docs/shared/` (56), na raiz de
 * `src/components/` (22) e em `src/lib/` (19) — e carregam **226 identificadores
 * em português que portão nenhum vê**. É a forma exata do `source-snippets.test.ts`
 * de 2026-09-10: quem não entra na lista não reprova, e a contagem encolhe sem
 * deixar rastro.
 *
 * **Fecha quando**: ou a regra alcança os arquivos fora de slug — como o
 * `inline_style_design_value` já faz com as páginas de fundamento, por uma regra
 * irmã sob `_infra` —, ou está escrito aqui por que esses 126 ficam de fora, com
 * a premissa verificada. Enquanto os dois números diferirem sem motivo escrito,
 * a base afirma cobrir o que a regra não cobra.
 */

/** Nome em português → por que a varredura não pôde traduzir sozinha. */
export const PENDENTES: Record<string, string> = {
  padrao:
    'ambíguo: ora é o elemento padrão numa story, ora o rótulo de fallback no slider — e `default` é palavra reservada',
  padrão: 'mesma decisão de `padrao`, com acento',
  novo: 'polissêmico: elemento recém-montado nas stories, e no AccordionDocs a chave de rótulo que significa *Novo* — `new` é palavra reservada',
  teclar: 'a recomposição fundia com `tipo` num só `type`; o alvo certo é `onKey`, mas o nome aparece em contextos que pedem leitura',
  com: 'a varredura não podia distinguir o identificador do `com` de prosa nem do sufixo de `figma.com`, e trocar por regex corromperia os dois. Restam duas declarações — `alert.source.test.ts` e `avatar.source.test.ts` do Vanilla; as do alert-dialog viraram `withMedia`. A razão anterior dizia "não é identificador", e isso era falso: eram quatro declarações',
  estilo: 'colide com o prop `style` do Svelte no aspect-ratio',
  densidade: 'colide com uma variável `density` já existente no preview.ts',
  canal: 'colide com `channel` no preview.ts',
  seletores: 'colide com `selectors` no preview.ts',
  meses: 'colide com `months` no calendar.svelte',
  anos: 'colide com `years` no calendar.svelte',
};

/**
 * Nome em português que FICA, e por quê.
 *
 * Vazio por enquanto — nenhum caso apareceu ainda. Quando aparecer, o motivo é
 * obrigatório: é o que separa "decidido" de "esquecido".
 */
export const MANTIDOS: Record<string, string> = {};
