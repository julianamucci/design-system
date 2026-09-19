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
 * **A CAMPANHA, e o que ela custou.** A base saiu de 1186 nomes e está em 5, em
 * três levas:
 *
 *     1186 → 1052   o contador deixa de atravessar a fronteira de literal
 *     1052 →  611   leva 1, os 29 nomes mais frequentes, 441 pagos
 *      611 →  263   leva 2, os 88 nomes em 2+ arquivos, 348 pagos
 *      263 →    6   leva 3, a cauda longa — 202 dos 211 nomes viviam num
 *                   arquivo só, então o método deixou de ser dicionário e
 *                   passou a ser julgamento por nome
 *        6 →    5   o contrato de fio do chat (`papel`/`texto` → `role`/`text`)
 *                   e as chaves de `CalendarLabels`, ambos declarados em
 *                   `docs/shared/` — edição de dono único, com as stacks paradas
 *
 * Nenhuma regeneração concedeu anistia: em todas elas o número de caminhos
 * NOVOS na base foi zero. O que resta é o `janela` de `MANTIDOS`, abaixo.
 *
 * **A leva 3 também fechou o SEXTO caminho de vazamento do contador**, e este
 * era no sentido de contar prosa. O descascamento de texto de tela apaga de `>`
 * a `<`, e só o nó INTEIRO: interpolação no meio parte o nó, e o pedaço depois
 * do `}` não começava em `>`. `<p>Parágrafo {i + 1}: … a rolagem interna</p>`
 * contava `rolagem` como identificador declarado. As três passadas novas cobrem
 * cabeça, miolo e cauda em volta da chave, e valem só em `.vue`/`.svelte`, onde
 * o `<script>` já saiu de lado e `}` só fecha interpolação — em `.tsx` o mesmo
 * padrão engoliria declaração real, que seria anistia. O A/B contra a árvore
 * inteira mostrou UMA entrada a menos e nenhuma outra linha mexida.
 *
 * ---
 *
 * **ABERTO · o gerador da base não varre `docs/shared/`.** `gerarBaselinePt`
 * percorre `nortear-design-system-<stack>/src` e mais nada, então todo
 * identificador declarado no compartilhado é invisível às duas regras — a por
 * componente e a `_infra`. É a MESMA forma do descompasso que fechou em
 * 2026-09-18 (a base cobria 673 arquivos, a regra auditava 547), uma camada
 * acima.
 *
 * Medido em 2026-09-18, só no subsistema de chat (`docs/shared/chat-docs/` mais
 * o `chat-eval` do vanilla, 11 arquivos): **117 identificadores em português de
 * 944 declarações, 12%** — e o contador enxergava TRÊS, porque `texto` é o
 * único que cai nos radicais. `servidor.ts` sozinho tem 46 (`Turno`, `bruto`,
 * `cabem`, `restante`, `custo`, `pedaco`, `parada`, `uso`). As sondas de
 * `docs/shared/testing/` carregam outra família (`papel` para `role`), ainda
 * não medida.
 *
 * Isso NÃO é a cauda de radicais que a campanha declaradamente não cobre
 * (`partes`, `modulos`, `colapsavel`): é alcance de gerador. Estender
 * `gerarBaselinePt` ao compartilhado é aperto puro — nada novo passa a ser
 * permitido —, mas a dívida que ele revelaria é tarefa própria, não rabo de
 * leva.
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
 * O motivo é obrigatório: é o que separa "decidido" de "esquecido". `MANTIDOS`
 * vence `PENDENTES`, então declarar aqui já cala a regra.
 */
export const MANTIDOS: Record<string, string> = {
  janela:
    'em `vanilla/src/lib/locale-negotiation.test.ts`, `function janela(…)` fabrica uma janela de mentira, e o arquivo inteiro testa o SOMBREAMENTO do `window` global. Declarar `function window` ali cria exatamente a confusão que o teste existe para pegar — o alvo natural é o nome que o teste ataca. Primeira entrada de `MANTIDOS` da campanha, decidida na leva 3. Em `activity-calendar.test.ts` não havia `janela` nenhum: a agente do vanilla corrigiu o brief, e o nome contado ali era `proximo`',
};
