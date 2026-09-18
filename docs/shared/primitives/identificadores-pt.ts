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
 * **FECHADA · 2026-09-18 — a base cobria mais arquivos do que a regra auditava.**
 * O gerador percorria **673** arquivos e `identificador_pt_novo` auditava **547**,
 * porque ela itera por SLUG e slug sai de `docs/shared/content/<slug>/`. Os 126 de
 * diferença — `src/components/docs/shared/`, a raiz de `src/components/` e
 * `src/lib/` — carregavam 226 identificadores que portão nenhum via. Era a forma
 * exata do `source-snippets.test.ts` de 2026-09-10: quem não entra na lista não
 * reprova, e a contagem encolhe sem deixar rastro.
 *
 * Fechou com `identificador_pt_novo_sem_slug`, a irmã sob `_infra`, que usa o
 * MESMO contador e a MESMA base e pula o que a regra por componente já abre.
 *
 * ---
 *
 * **A CAMPANHA, e o que ela custou até aqui.** A base saiu de 1186 nomes e está
 * em 263, em três levas:
 *
 *     1186 → 1052   o contador deixa de atravessar a fronteira de literal
 *     1052 →  611   leva 1, os 29 nomes mais frequentes, 441 pagos
 *      611 →  263   leva 2, os 88 nomes em 2+ arquivos, 348 pagos
 *
 * Nenhuma regeneração concedeu anistia: em toda elas o número de caminhos NOVOS
 * na base foi zero.
 *
 * **E três motivos desta lista estavam DESATUALIZADOS quando fomos pagá-los** —
 * o que vale mais que os números. O `padrao` não era ambíguo do jeito que a
 * entrada dizia; o `montar` não vinha do `story-source` (o docblock do
 * `audit.mjs` que o citava foi corrigido); e as entradas `densidade` e
 * `seletores` já não tinham ocorrência nenhuma. Motivo escrito envelhece calado,
 * e envelhecendo passa a ensinar a coisa errada: dois comentários de
 * `*.source.ts` justificavam DUPLICAR código citando uma dívida que já tinha
 * sido paga em outro commit.
 */

/** Nome em português → por que a varredura não pôde traduzir sozinha. */
export const PENDENTES: Record<string, string> = {
  padrão:
    'com acento, e por isso fora da campanha por varredura. O `padrao` sem acento SAIU desta lista em 2026-09-19, pago em 60 arquivos: o motivo que ele carregava — "ambíguo" — estava desatualizado, e a ambiguidade real cabia num conjunto fechado de cinco alvos (`defaultValue` para valor de prop, `defaultElement` para o nó de uma story, `defaultLabel`, `defaultCode`, `defaultOption`). Restam 8 declarações com acento; o mesmo conjunto serve, e `default` continua sendo palavra reservada para variável — como CHAVE de objeto é válido',
  novo: 'polissêmico: elemento recém-montado nas stories, e no AccordionDocs a chave de rótulo que significa *Novo* — `new` é palavra reservada',
  teclar: 'a recomposição fundia com `tipo` num só `type`; o alvo certo é `onKey`, mas o nome aparece em contextos que pedem leitura',
  com: 'a varredura não podia distinguir o identificador do `com` de prosa nem do sufixo de `figma.com`, e trocar por regex corromperia os dois. Restam duas declarações — `alert.source.test.ts` e `avatar.source.test.ts` do Vanilla; as do alert-dialog viraram `withMedia`. A razão anterior dizia "não é identificador", e isso era falso: eram quatro declarações',
  estilo: 'colide com o prop `style` do Svelte no aspect-ratio',
  canal: 'colide com `channel` no preview.ts',
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
