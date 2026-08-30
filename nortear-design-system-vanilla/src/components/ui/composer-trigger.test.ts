// O caractere gatilho do composer, preso sem DOM.
//
// Vive na stack de referência porque é lá que o projeto roda `--project unit`;
// o módulo em si é compartilhado e não importa framework nenhum.

import { describe, expect, it } from 'vitest';
import {
  applyTrigger,
  COMMAND_TRIGGER,
  findTrigger,
  MENTION_TRIGGER,
  matchesTerm,
  normalizeTerm,
  rankByTerm,
  type TriggerMatch,
} from '@shared/primitives/composer-trigger';

const GATILHOS = [MENTION_TRIGGER, COMMAND_TRIGGER];

/** Acha o gatilho com o cursor no fim do texto, que é o caso de quem digita. */
const noFim = (texto: string) => findTrigger(texto, texto.length, GATILHOS);

describe('findTrigger — onde a menção vale', () => {
  it('no começo do campo', () => {
    expect(noFim('@an')).toMatchObject({ start: 0, term: 'an' });
  });

  it('depois de um espaço', () => {
    expect(noFim('avisa a @an')).toMatchObject({ start: 8, term: 'an' });
  });

  it('depois de uma quebra de linha', () => {
    // Primeira coluna de uma linha nova é começo de palavra tanto quanto
    // depois de um espaço — e um composer é multilinha por definição.
    expect(noFim('primeira linha\n@an')).toMatchObject({ term: 'an' });
  });

  it('recém-digitado, com termo vazio', () => {
    // O seletor abre com a lista inteira: é isso que faz dele um seletor, e
    // não uma busca.
    expect(noFim('avisa a @')).toMatchObject({ term: '' });
  });
});

describe('findTrigger — onde a menção NÃO vale', () => {
  it('no meio de uma palavra', () => {
    // A regra que justifica o módulo existir. Sem ela, escrever um e-mail
    // abre o seletor de menções no meio da palavra.
    expect(noFim('contato@nortear.com.br')).toBeNull();
  });

  it('no meio de uma palavra, mesmo com o cursor logo após o arroba', () => {
    // O caso que a regra ingênua ("o último @ antes do cursor") deixa passar:
    // o cursor está colado no gatilho e ainda assim ele não vale, porque o
    // caractere anterior é letra.
    expect(findTrigger('contato@nortear.com.br', 8, GATILHOS)).toBeNull();
  });

  it('depois de um espaço no termo', () => {
    // `@ana ` fechou. É o que permite escrever `@ana e @bruno` sem que a
    // segunda busca herde a primeira.
    expect(noFim('avisa a @ana e')).toBeNull();
  });

  it('quando o gatilho está depois do cursor', () => {
    // Só o texto ANTES do cursor conta. Considerar o que vem depois faria o
    // seletor abrir ao voltar o cursor sobre uma menção já escrita.
    expect(findTrigger('avisa a @ana', 4, GATILHOS)).toBeNull();
  });

  it('em texto sem gatilho nenhum', () => {
    expect(noFim('bom dia')).toBeNull();
  });
});

describe('findTrigger — o comando vale só no começo do campo', () => {
  it('na primeira posição, sim', () => {
    expect(noFim('/aju')).toMatchObject({ spec: COMMAND_TRIGGER, start: 0, term: 'aju' });
  });

  it('depois de texto, não — ali a barra é pontuação', () => {
    // É por isto que o lugar é declarado por gatilho, e não assumido pelo
    // módulo: `@` e `/` não valem no mesmo lugar.
    expect(noFim('veja isso /aju')).toBeNull();
  });

  it('depois de um espaço no começo, também não', () => {
    expect(noFim(' /aju')).toBeNull();
  });
});

describe('findTrigger — qual gatilho ganha', () => {
  it('o mais próximo do cursor', () => {
    // Quem está sendo escrito é o segundo; o primeiro já virou menção.
    expect(noFim('@ana @bru')).toMatchObject({ start: 5, term: 'bru' });
  });

  it('a menção ganha do comando quando está mais perto', () => {
    const achado = noFim('/ajuda @bru');
    // O comando na posição 0 continua válido pelo lugar, mas o termo dele
    // tem espaço — então ele já fechou, e sobra a menção.
    expect(achado).toMatchObject({ spec: MENTION_TRIGGER, term: 'bru' });
  });

  it('cursor além do texto é tratado como o fim', () => {
    expect(findTrigger('@an', 999, GATILHOS)).toMatchObject({ term: 'an' });
  });
});

describe('normalizeTerm e matchesTerm — acento não pode esconder ninguém', () => {
  it('tira o acento e baixa a caixa', () => {
    expect(normalizeTerm('João')).toBe('joao');
    expect(normalizeTerm('ÂNGELA')).toBe('angela');
  });

  it('quem digita sem acento acha quem tem', () => {
    // Um seletor que não acha o próprio colega de time por causa de um til é
    // um seletor que ninguém usa.
    expect(matchesTerm('João Pedro', 'joao')).toBe(true);
    expect(matchesTerm('Ângela', 'ang')).toBe(true);
  });

  it('e quem digita com acento também acha', () => {
    expect(matchesTerm('Joao Pedro', 'joão')).toBe(true);
  });

  it('termo vazio serve para todos', () => {
    expect(matchesTerm('qualquer', '')).toBe(true);
  });

  it('o que não casa, não casa', () => {
    expect(matchesTerm('João', 'bruno')).toBe(false);
  });
});

describe('rankByTerm — quem começa pelo termo vem antes', () => {
  const pessoas = ['Joana Lima', 'Ana Souza', 'Mariana Dias'];
  const nome = (p: string) => p;

  it('quem começa pelo termo lidera', () => {
    // Quem digita `@an` quase sempre quer Ana, não Joana.
    expect(rankByTerm(pessoas, 'an', nome)).toEqual([
      'Ana Souza',
      'Joana Lima',
      'Mariana Dias',
    ]);
  });

  it('dentro de cada grupo, a ordem de entrada é preservada', () => {
    // Quem produz a lista já a ordenou por relevância; reordenar de novo
    // apagaria essa informação.
    //
    // O termo põe DOIS no grupo de quem só contém — Joana e Mariana —, e é
    // entre esses dois que a ordem original tem de sobreviver. Com um termo
    // que deixasse um só no grupo, a asserção passaria sem medir nada.
    expect(rankByTerm(pessoas, 'ana', nome)).toEqual([
      'Ana Souza',
      'Joana Lima',
      'Mariana Dias',
    ]);
  });

  it('quem não casa fica de fora', () => {
    expect(rankByTerm(pessoas, 'bru', nome)).toEqual([]);
  });

  it('termo vazio devolve tudo, na ordem original', () => {
    expect(rankByTerm(pessoas, '', nome)).toEqual(pessoas);
  });

  it('não devolve o mesmo array de entrada', () => {
    // Devolver a lista recebida faria quem ordena a saída reordenar a origem.
    const saida = rankByTerm(pessoas, '', nome);
    expect(saida).not.toBe(pessoas);
  });
});

describe('applyTrigger — o que fica escrito depois da escolha', () => {
  const acharNoFim = (texto: string): TriggerMatch => {
    const achado = findTrigger(texto, texto.length, GATILHOS);
    if (!achado) throw new Error(`sem gatilho em ${JSON.stringify(texto)}`);
    return achado;
  };

  it('troca gatilho e termo, e deixa um espaço', () => {
    const texto = 'avisa a @an';
    const r = applyTrigger(texto, acharNoFim(texto), texto.length, '@Ana Souza');
    expect(r.text).toBe('avisa a @Ana Souza ');
    expect(r.caret).toBe(r.text.length);
  });

  it('não emenda dois espaços quando já há um adiante', () => {
    // Aplicar a escolha no meio de uma frase já escrita não deve deixar
    // buraco duplo — é a diferença entre inserir e emendar.
    const texto = 'avisa a @an sobre o prazo';
    const match = findTrigger(texto, 11, GATILHOS)!;
    const r = applyTrigger(texto, match, 11, '@Ana Souza');
    expect(r.text).toBe('avisa a @Ana Souza sobre o prazo');
  });

  it('o cursor fica logo depois do que foi inserido', () => {
    const texto = 'avisa a @an sobre o prazo';
    const match = findTrigger(texto, 11, GATILHOS)!;
    const r = applyTrigger(texto, match, 11, '@Ana Souza');
    // Depois do nome e do espaço que já existia: é dali que se continua a
    // escrever, e não do fim da frase.
    expect(r.text.slice(0, r.caret)).toBe('avisa a @Ana Souza ');
  });

  it('preserva o que vem depois do cursor', () => {
    const texto = 'avisa a @an sobre o prazo';
    const match = findTrigger(texto, 11, GATILHOS)!;
    expect(applyTrigger(texto, match, 11, '@Ana Souza').text).toContain('sobre o prazo');
  });

  it('serve ao comando do mesmo jeito', () => {
    const texto = '/aju';
    const r = applyTrigger(texto, acharNoFim(texto), texto.length, '/ajuda');
    expect(r.text).toBe('/ajuda ');
  });
});
