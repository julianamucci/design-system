/**
 * ─── O portão do portão ──────────────────────────────────────────────────────
 *
 * "Portão sem dentes é pior que portão nenhum, e 'passou' não prova que ele
 * mede a coisa certa." Um avaliador é exatamente o tipo de código que passa
 * verde para sempre: ele só é exercitado quando a resposta do modelo já está
 * boa, e ninguém repara que o critério nunca reprovou nada.
 *
 * Então cada critério aqui é testado NOS DOIS SENTIDOS: com o defeito plantado,
 * ele reprova; sem o defeito, ele não reprova. O segundo é tão importante
 * quanto o primeiro — guarda que acusa a resposta certa é ruído, e ruído mata
 * portão mais rápido que falta de dentes.
 *
 * Sem rede e sem chave: tudo aqui é função pura.
 */
import { describe, expect, it } from 'vitest';
import {
  avaliarRecuperacao,
  citaSlugEsperado,
  detectarRecusa,
  negaExistencia,
  nomesInventados,
  nomesObrigatoriosFaltando,
  nomesProibidosCitados,
  nomesTraduzidosCitados,
  titulosTraduzidos,
} from './avaliador';
import { BANCO } from './banco';

describe('acerto de recuperação', () => {
  it('aceita quando um dos esperados aparece', () => {
    const r = avaliarRecuperacao(['label', 'form'], ['form', 'label', 'input']);
    expect(r.ok).toBe(true);
    expect(r.faltando).toEqual(['input']);
  });

  it('reprova quando nenhum esperado aparece', () => {
    expect(avaliarRecuperacao(['button', 'card'], ['form']).ok).toBe(false);
  });

  it('com exigeTodos, meia comparação reprova', () => {
    // "qual a diferença entre popover e hover card?" com só um dos dois no
    // prompt é uma resposta que compara com nada.
    expect(
      avaliarRecuperacao(['hover-card', 'card'], ['hover-card', 'popover'], {
        exigeTodos: true,
      }).ok,
    ).toBe(false);
    expect(
      avaliarRecuperacao(['hover-card', 'popover'], ['hover-card', 'popover'], {
        exigeTodos: true,
      }).ok,
    ).toBe(true);
  });

  it('a ordem só é cobrada quando o caso a exige', () => {
    expect(avaliarRecuperacao(['popover', 'hover-card'], ['hover-card']).primeiroOk).toBeNull();
    expect(
      avaliarRecuperacao(['popover', 'hover-card'], ['hover-card'], { primeiro: 'hover-card' })
        .primeiroOk,
    ).toBe(false);
  });

  it('nos negativos, qualquer slug recuperado continua sendo vizinhança', () => {
    // `media-player` pontua 0,86 em "trocar o óleo do motor" — acima do piso.
    // Quem julga esse caso é a recusa, não a recuperação.
    expect(avaliarRecuperacao(['media-player'], []).ok).toBe(true);
  });
});

describe('detecção de recusa', () => {
  const recusas = [
    'Não sei — os trechos não falam sobre isso. (alert)',
    'Não encontrei nada sobre Kubernetes na documentação.',
    'Essa prop não existe no Alert (alert).',
    'Os trechos não mencionam previsão do tempo.',
    'Essa informação não está documentada nos trechos fornecidos.',
    "I don't know — that isn't documented in the excerpts.",
    'That prop does not exist on Alert.',
    'No lo sé: no encontré nada sobre eso.',
    'Esa propiedad no existe en Alert.',
  ];
  for (const texto of recusas) {
    it(`reconhece: ${texto.slice(0, 44)}…`, () => {
      expect(detectarRecusa(texto).recusou).toBe(true);
    });
  }

  const respostas = [
    'O Alert tem cinco variantes: default, destructive, success, warning e info. (alert)',
    'Sim, o DataTable tem seleção de linha por checkbox. (data-table)',
    // O caso que faria um guarda ingênuo reprovar: "não está" numa resposta que
    // respondeu. É por isso que "não está" só conta perto de palavra de
    // documentação.
    'Enquanto o item não está aberto, o conteúdo fica oculto. (accordion)',
    'O conteúdo não está visível até o gatilho ser acionado. (collapsible)',
    'The badge is not interactive by default. (badge)',
  ];
  for (const texto of respostas) {
    it(`não confunde com recusa: ${texto.slice(0, 44)}…`, () => {
      expect(detectarRecusa(texto).recusou).toBe(false);
    });
  }
});

describe('negação de um termo que não existe', () => {
  it('reconhece a resposta MEDIDA na primeira rodada, que a recusa não pegava', () => {
    const real =
      'Não. O Alert não possui uma prop `autoClose` para sumir sozinho (alert).\n' +
      'As props documentadas são dismissible, onDismiss e dismissLabel.';
    expect(negaExistencia(real, 'autoClose').negou).toBe(true);
    // E o guarda de recusa continua NÃO vendo recusa aqui — de propósito: isto
    // é uma resposta, não uma recusa.
    expect(detectarRecusa(real).recusou).toBe(false);
  });

  it('reprova quando o modelo descreve a prop inventada como se existisse', () => {
    const alucinacao =
      'A prop `autoClose` recebe o número de milissegundos até o Alert sumir (alert).';
    expect(negaExistencia(alucinacao, 'autoClose').negou).toBe(false);
  });

  it('a negação tem de estar na MESMA frase do termo', () => {
    // A negação existe no texto, mas fala de outra coisa. Aceitar isto seria
    // aprovar uma alucinação por causa de uma frase vizinha.
    const desalinhado =
      'A prop autoClose fecha o Alert após 5s. O Alert não é um toast.';
    expect(negaExistencia(desalinhado, 'autoClose').negou).toBe(false);
  });

  it('não lê a preposição "no" do português como negação', () => {
    const falso = 'A prop autoClose no Alert define o tempo de fechamento.';
    expect(negaExistencia(falso, 'autoClose').negou).toBe(false);
  });

  it('vale em inglês e espanhol', () => {
    expect(negaExistencia('Alert does not have an autoClose prop.', 'autoClose').negou).toBe(true);
    expect(negaExistencia('Alert no tiene una prop autoClose.', 'autoClose').negou).toBe(true);
  });
});

describe('respondeu de fato, medido pela citação obrigatória do slug', () => {
  // O texto MEDIDO na primeira rodada: corrige o nome errado e responde. A
  // marca "não existe" dispara, e ainda assim isto não é uma recusa.
  const corrigiuEResponde =
    'Não existe um componente chamado "compute user". O componente é o ComputerUse (computer-use).\n' +
    'Os casos de uso são: mostrar onde o agente tocou na tela (computer-use).';

  it('a marca de recusa dispara — e por isso ela não pode decidir sozinha', () => {
    expect(detectarRecusa(corrigiuEResponde).recusou).toBe(true);
  });

  it('mas a citação prova que houve afirmação sobre o componente esperado', () => {
    expect(citaSlugEsperado(corrigiuEResponde, ['computer-use'])).toBe(true);
  });

  it('recusa de verdade não cita slug esperado nenhum', () => {
    const recusa = 'Não encontrei nada sobre Kubernetes nos trechos.';
    expect(citaSlugEsperado(recusa, ['computer-use'])).toBe(false);
  });

  it('enxerga a citação com crase de markdown por dentro dos parênteses', () => {
    // MEDIDO na rodada B: "Com base na documentação do **ComposerVoice**
    // (`composer-voice`), seu caso de uso é…". A marcação é decoração.
    const comCrase = 'Com base na documentação do **ComposerVoice** (`composer-voice`), o uso é…';
    expect(citaSlugEsperado(comCrase, ['composer-voice'])).toBe(true);
  });

  it('não confunde o slug citado com o slug esperado', () => {
    const outro = 'Use o Popover para isso (popover).';
    expect(citaSlugEsperado(outro, ['hover-card'])).toBe(false);
    expect(citaSlugEsperado(outro, ['hover-card', 'popover'])).toBe(true);
  });
});

describe('nome de componente traduzido', () => {
  const corpus = [
    { slug: 'composer-voice', title: 'Ditado por voz' },
    { slug: 'computer-use', title: 'Tela do computador' },
    { slug: 'context-menu', title: 'Context Menu' },
    { slug: 'table', title: 'Tabela' },
    { slug: 'alert', title: 'Alert' },
  ];
  const nomeDeMenu = (slug: string) =>
    slug.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
  const titulos = titulosTraduzidos(corpus, nomeDeMenu);

  it('junta só os títulos que de fato divergem do nome do menu', () => {
    expect(titulos.map((t) => t.titulo)).toEqual(['Ditado por voz', 'Tela do computador']);
  });

  it('não junta título de uma palavra só — "Tabela" é prosa, não nome errado', () => {
    expect(titulos.map((t) => t.titulo)).not.toContain('Tabela');
  });

  it('não junta "Context Menu": é o mesmo nome com espaço, não tradução', () => {
    expect(titulos.map((t) => t.titulo)).not.toContain('Context Menu');
  });

  it('acusa a resposta que troca o nome pelo título traduzido', () => {
    expect(
      nomesTraduzidosCitados('Use a Tela do computador para isso. (computer-use)', titulos),
    ).toEqual(['Tela do computador']);
  });

  it('não acusa a resposta que usa o nome do menu', () => {
    expect(
      nomesTraduzidosCitados('Use o ComputerUse para isso. (computer-use)', titulos),
    ).toEqual([]);
  });

  it('isenta a prosa que descreve o componente E dá o nome em inglês', () => {
    // O caso MEDIDO: "Para mostrar o plano do agente passo a passo, use o
    // AgentPlan". A frase coincide com um título traduzido, mas a pessoa sai
    // dali com o nome pelo qual procurar.
    const comNome = 'Para mostrar a tela do computador, use o ComputerUse (computer-use).';
    expect(nomesTraduzidosCitados(comNome, titulos)).toEqual([]);
  });
});

describe('nome de componente inventado', () => {
  const catalogo = ['Alert', 'AlertDialog', 'ComputerUse', 'DataTable', 'InputOTP'];

  it('acusa o nome que não existe no catálogo', () => {
    expect(nomesInventados('Use o ToastProvider para isso.', catalogo)).toEqual([
      'ToastProvider',
    ]);
  });

  it('isenta subcomponente: AlertTitle começa com Alert', () => {
    expect(nomesInventados('Componha AlertTitle e AlertDescription.', catalogo)).toEqual([]);
  });

  it('isenta palavra de tecnologia', () => {
    expect(nomesInventados('A interface TypeScript está no bloco.', catalogo)).toEqual([]);
  });

  it('isenta nome que veio dos próprios trechos do prompt', () => {
    // O modelo copiou de onde devia; acusar isso puniria a resposta certa.
    expect(nomesInventados('Ele usa o MediaQuery interno.', catalogo, '{"a":"MediaQuery"}')).toEqual(
      [],
    );
  });

  it('não acusa nome que está no catálogo', () => {
    expect(nomesInventados('O DataTable e o InputOTP resolvem.', catalogo)).toEqual([]);
  });
});

describe('nomes obrigatórios e proibidos', () => {
  it('cobra o nome em inglês que a resposta tinha de trazer', () => {
    expect(nomesObrigatoriosFaltando('Use o Ditado por voz.', ['ComposerVoice'])).toEqual([
      'ComposerVoice',
    ]);
    expect(nomesObrigatoriosFaltando('Use o ComposerVoice.', ['ComposerVoice'])).toEqual([]);
  });

  it('acusa o conceito da prosa apresentado como componente, com ou sem acento', () => {
    const proibidos = ['Conversa por voz', 'Leitura em voz alta'];
    expect(nomesProibidosCitados('Existe também Conversa por voz.', proibidos)).toEqual([
      'Conversa por voz',
    ]);
    expect(nomesProibidosCitados('existe leitura em voz alta', proibidos)).toEqual([
      'Leitura em voz alta',
    ]);
    expect(nomesProibidosCitados('Use o MediaPlayer para ler em voz alta.', proibidos)).toEqual([]);
  });
});

describe('o banco em si', () => {
  it('não tem id repetido — o diff A × B casa por id', () => {
    const ids = BANCO.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todo caso tem pelo menos uma pergunta e uma justificativa', () => {
    for (const caso of BANCO) {
      expect(caso.perguntas.length).toBeGreaterThan(0);
      expect(caso.porque.length).toBeGreaterThan(20);
    }
  });

  it('os negativos não esperam slug nenhum, e os positivos esperam', () => {
    for (const caso of BANCO) {
      if (caso.grupo === 'recusa') expect(caso.esperados).toEqual([]);
      else expect(caso.esperados.length).toBeGreaterThan(0);
    }
  });
});
