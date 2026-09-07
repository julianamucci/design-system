/**
 * ─── O banco de perguntas do chat de documentação ────────────────────────────
 *
 * POR QUE ESTE ARQUIVO EXISTE
 *
 * A pergunta que ele responde não é "o chat está bom?", que ninguém consegue
 * medir. É: **mudar X estraga alguma coisa?** Sem um banco fixo, toda mudança
 * no prompt, no recorte do contexto ou no provedor vira opinião — alguém digita
 * três perguntas, gosta do que lê, e a regressão aparece semanas depois num uso
 * que ninguém repetiu.
 *
 * ── DE ONDE VIERAM AS PERGUNTAS ──
 *
 * Todas de uso REAL, na sessão em que o chat foi construído. Nenhuma foi
 * inventada para o banco passar: o erro de digitação em `compute user` é o erro
 * que a Julia cometeu, e `compose vouce` também. Banco de avaliação escrito por
 * quem quer ver verde mede o que já funciona.
 *
 * ── O QUE CADA GRUPO PRENDE ──
 *
 * | grupo | o defeito que ele pega |
 * |---|---|
 * | `componente` | recuperação leva ao slug errado, ou o modelo responde pelo vizinho |
 * | `recusa` | o modelo responde com confiança a pergunta que o corpus não cobre |
 * | `continuacao` | "desse" perde o assunto e a segunda pergunta muda de componente |
 * | `nome` | nome de componente traduzido, ou conceito da prosa citado como peça |
 * | `prop-inventada` | a prop plausível que o modelo conhece de OUTRA biblioteca |
 *
 * Mora em `src/lib/` e não em `src/components/ui/`: guideline 17 §2 — o design
 * system não tem runtime de conversa, e um banco de avaliação de chat é
 * aplicação, não peça.
 */

/** Um turno já no formato que a função de servidor aceita no histórico. */
export interface TurnoDoBanco {
  papel: 'user' | 'model';
  texto: string;
}

export type GrupoDoCaso =
  | 'componente'
  | 'recusa'
  | 'continuacao'
  | 'nome'
  | 'prop-inventada';

export interface CasoDeAvaliacao {
  /** Curto e estável: é a coluna esquerda da tabela e a chave do diff A × B. */
  id: string;
  grupo: GrupoDoCaso;
  /**
   * As perguntas, em ordem. Só a ÚLTIMA é avaliada; as anteriores existem para
   * montar o histórico, porque é ele que dá sentido a "desse".
   */
  perguntas: string[];
  /**
   * Os slugs que a recuperação tem de trazer. Vazio quer dizer "nenhum" — é o
   * caso dos negativos, onde qualquer slug que apareça é vizinhança, não acerto.
   */
  esperados: string[];
  /**
   * Exige TODOS os esperados, e não um deles.
   *
   * "qual a diferença entre popover e hover card?" só se responde com os dois
   * documentos na conversa; trazer um é meia resposta, e meia resposta a uma
   * pergunta de comparação é resposta errada.
   */
  exigeTodos?: boolean;
  /** Quando a ORDEM importa: o slug que tem de vir em primeiro lugar. */
  primeiro?: string;
  /**
   * A resposta tem de trazer marca de recusa (`true`) ou não pode trazer
   * (`false`). `null` desliga o critério — usado no caso da prop inventada,
   * onde a resposta certa NÃO é uma recusa: é uma negação, e quem a mede é
   * `termoInexistente`. Ver o porquê medido em `negaExistencia`.
   */
  deveRecusar: boolean | null;
  /**
   * O termo que a resposta tem de NEGAR, na mesma frase em que o cita.
   *
   * Existe para a prop inventada: "não sei" seria uma resposta pior que "essa
   * prop não existe", e o documento certo está na conversa — o modelo tem como
   * saber.
   */
  termoInexistente?: string;
  /** Nomes que a resposta precisa citar, exatamente assim — em inglês. */
  nomesObrigatorios?: string[];
  /**
   * Trechos que a resposta NÃO pode citar.
   *
   * Diferente do guarda genérico de nome traduzido: aqui entram os CONCEITOS da
   * prosa que voltaram como se fossem componentes. "Conversa por voz" e
   * "Leitura em voz alta" estão escritos no texto de `composer-voice` como
   * alternativas descritas, não são título de nada, e por isso nenhum guarda
   * derivado do corpus os pegaria.
   */
  nomesProibidos?: string[];
  /** Por que este caso está no banco. Some da tabela, fica no arquivo. */
  porque: string;
}

export const BANCO: readonly CasoDeAvaliacao[] = [
  /* ── Acham o componente certo ──────────────────────────────────────────── */
  {
    id: 'cu-serve',
    grupo: 'componente',
    perguntas: ['pra que serve o componente ComputerUse?'],
    esperados: ['computer-use'],
    primeiro: 'computer-use',
    deveRecusar: false,
    porque:
      'O caso que quebrou a busca antes da quebra por maiúscula: `ComputerUse` virava um termo só e a resposta dizia que o componente não existe.',
  },
  {
    id: 'cu-casos',
    grupo: 'componente',
    perguntas: ['quais os casos de uso para o componente computeruse?'],
    esperados: ['computer-use'],
    primeiro: 'computer-use',
    deveRecusar: false,
    porque:
      'Tudo junto e minúsculo — como se digita de memória. Depende do mapa de formas compactas do corpus.',
  },
  {
    id: 'cu-typo',
    grupo: 'componente',
    perguntas: ['quais os casos de uso do compute user?'],
    esperados: ['computer-use'],
    primeiro: 'computer-use',
    deveRecusar: false,
    porque:
      'Erro de digitação de uma letra. Antes da correção por distância de edição, recuperava media-player com 0,25 e o chat dizia que não sabia.',
  },
  {
    id: 'popover-x-hover',
    grupo: 'componente',
    perguntas: ['qual a diferença entre popover e hover card?'],
    esperados: ['hover-card', 'popover'],
    exigeTodos: true,
    deveRecusar: false,
    porque: 'Comparação só se responde com os DOIS documentos na conversa.',
  },
  {
    id: 'input-otp',
    grupo: 'componente',
    perguntas: ['como uso o InputOTP?'],
    esperados: ['input-otp'],
    primeiro: 'input-otp',
    deveRecusar: false,
    porque: 'Sigla no meio do nome — o caso que a lista `SIGLAS` existe para não errar.',
  },
  {
    id: 'datatable-selecao',
    grupo: 'componente',
    perguntas: ['o datatable tem seleção de linha?'],
    esperados: ['data-table'],
    primeiro: 'data-table',
    deveRecusar: false,
    porque:
      'Pergunta de SIM/NÃO sobre um recurso concreto. Se o recorte do contexto tirar a seção certa, é aqui que aparece.',
  },
  {
    id: 'acordion-typo',
    grupo: 'componente',
    perguntas: ['como funciona o acordion?'],
    esperados: ['accordion'],
    primeiro: 'accordion',
    deveRecusar: false,
    porque: 'Erro de digitação num nome de uma palavra só.',
  },
  {
    id: 'alert-variantes',
    grupo: 'componente',
    perguntas: ['Quais variantes o Alert tem?'],
    esperados: ['alert'],
    primeiro: 'alert',
    deveRecusar: false,
    porque:
      'A resposta está em `variants`, que o recorte MANTÉM. É o par do caso de baixo: prova que o recorte não é o que decide.',
  },
  {
    id: 'erro-de-formulario',
    grupo: 'componente',
    perguntas: ['como anuncio erro de formulário?'],
    esperados: ['form', 'label', 'input'],
    deveRecusar: false,
    porque:
      'Nenhum nome de componente na pergunta — é conceito puro. É o caso que só funciona por causa de `seo.aiEntities`.',
  },

  /* ── Devem RECUSAR ─────────────────────────────────────────────────────── */
  {
    id: 'kubernetes',
    grupo: 'recusa',
    perguntas: ['como configuro um cluster de kubernetes?'],
    esperados: [],
    deveRecusar: true,
    porque: 'Fora do corpus, e nem parecido. O piso de recuperação pega sozinho.',
  },
  {
    id: 'oleo-do-motor',
    grupo: 'recusa',
    perguntas: ['preciso trocar o óleo do motor do carro'],
    esperados: [],
    deveRecusar: true,
    porque:
      'A colisão MEDIDA: pontua 0,857 em `media-player`, porque aquele resumo fala de "motor" (de mídia) sete vezes. Recuperação léxica não sabe que são dois motores — quem tem de pegar é a instrução de sistema.',
  },
  {
    id: 'previsao-do-tempo',
    grupo: 'recusa',
    perguntas: ['qual a previsão do tempo em Curitiba?'],
    esperados: [],
    deveRecusar: true,
    porque:
      '"tempo" existe no corpus (tempo de resposta, tempo de animação) — outra colisão de palavra comum.',
  },

  /* ── Continuação: o segundo turno depende do primeiro ──────────────────── */
  {
    id: 'continuacao-mesmo-assunto',
    grupo: 'continuacao',
    perguntas: ['pra que serve o componente ComputerUse?', 'quais as situações de uso desse'],
    esperados: ['computer-use'],
    primeiro: 'computer-use',
    deveRecusar: false,
    porque:
      'MEDIDO: "quais as situações de uso desse" SOZINHA recupera `progress` com 0,23. O que segura o assunto é a pergunta anterior concatenada na consulta.',
  },
  {
    id: 'continuacao-troca-assunto',
    grupo: 'continuacao',
    perguntas: ['pra que serve o componente ComputerUse?', 'e o HoverCard, qual a diferença?'],
    esperados: ['hover-card'],
    primeiro: 'hover-card',
    deveRecusar: false,
    porque:
      'O outro lado da mesma moeda: herdar o assunto não pode impedir a TROCA de assunto. O novo componente tem de vir na frente, com o antigo em segundo.',
  },

  /* ── Nome de componente ────────────────────────────────────────────────── */
  {
    id: 'compose-vouce',
    grupo: 'nome',
    perguntas: ['qual o caso de uso do compose vouce?'],
    esperados: ['composer-voice'],
    primeiro: 'composer-voice',
    deveRecusar: false,
    nomesObrigatorios: ['ComposerVoice'],
    nomesProibidos: ['Conversa por voz', 'Leitura em voz alta'],
    porque:
      'O caso que motivou as regras 5 e 7 da instrução de sistema. O documento de `composer-voice` tem título traduzido ("Ditado por voz") e cita alternativas por DESCRIÇÃO; as duas coisas voltavam na resposta como se fossem componentes do sistema. MEDIDO nesta rodada: a recuperação traz composer-voice (11,29), composer, composer-context, composer-model-picker e composer-quote — `media-player` NÃO entra. Por isso `MediaPlayer` não é nome obrigatório aqui: exigir que a resposta o cite seria exigir que ela afirme algo sobre um componente sem documento na conversa, que é justamente o que a regra 6 proíbe. O que se exige é o outro lado: se a resposta mencionar a alternativa de leitura em voz alta, ela não pode apresentá-la como peça — daí os proibidos.',
  },

  /* ── Prop inventada ────────────────────────────────────────────────────── */
  {
    id: 'alert-autoclose',
    grupo: 'prop-inventada',
    perguntas: [
      'o Alert tem uma prop autoClose para ele sumir sozinho depois de alguns segundos?',
    ],
    esperados: ['alert'],
    primeiro: 'alert',
    deveRecusar: null,
    termoInexistente: 'autoClose',
    porque:
      'CONFERIDO em docs/shared/content/alert/translations.json: as props do Alert são variant, role, className, children, dismissible, onDismiss, dismissLabel e titleAs. Não há autoClose, nem duration, nem timeout — a string "autoClose" não aparece uma vez no arquivo. Mas `dismissible` existe, e auto-fechamento é recurso comum em OUTRAS bibliotecas: é exatamente a forma de pergunta em que o modelo completa com o que sabe. O documento certo ESTÁ na conversa, então o piso de recuperação não ajuda aqui — quem tem de pegar é a regra 1.',
  },
] as const;
