// A recuperação do chat de documentação, presa sem rede e sem chave de API.
//
// Vive na stack de referência porque é lá que o projeto roda `--project unit`;
// o módulo em si é compartilhado e não importa framework nenhum.
//
// MORA EM `src/lib/` E NÃO EM `src/components/ui/`, que é onde estão os outros
// testes de primitivo compartilhado (`chat-scroll.test.ts`, `markdown-ast.test.ts`).
// A razão não é de gosto: `docs-index.ts` não serve a componente nenhum — serve
// a uma APLICAÇÃO que consome o design system (o chat do manager), e a
// guideline 17 §2 separa as duas coisas com rigor. Pôr o teste ao lado dos
// componentes sugeriria que a peça é do sistema, e ela não é.
//
// O CORPUS DO TESTE É O CORPUS DE VERDADE, lido do disco. Um corpus falso
// provaria que a aritmética fecha e não provaria nada sobre a única pergunta
// que importa: uma pessoa pergunta em português e sai o slug certo? A leitura é
// de arquivo, síncrona, em nó — não é rede, e é o mesmo conteúdo que o servidor
// manda para o modelo.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  RETRIEVAL_FLOOR,
  entryFromTranslations,
  isWeakRetrieval,
  normalize,
  searchDocs,
  tokenize,
  type DocsIndexEntry,
  type TranslationsLocaleDocument,
} from '@shared/primitives/docs-index';

const AQUI = fileURLToPath(new URL('.', import.meta.url));
const CONTEUDO = join(AQUI, '..', '..', '..', 'docs', 'shared', 'content');

function carregarCorpus(locale: string): DocsIndexEntry[] {
  const entries: DocsIndexEntry[] = [];
  for (const slug of readdirSync(CONTEUDO)) {
    const arquivo = join(CONTEUDO, slug, 'translations.json');
    // `foundations` é um diretório sem `translations.json`. Pular em silêncio é
    // certo aqui: o corpus é o que existe, não uma lista declarada à parte.
    if (!existsSync(arquivo)) continue;
    const json = JSON.parse(readFileSync(arquivo, 'utf8')) as Record<
      string,
      TranslationsLocaleDocument
    >;
    const doc = json[locale];
    if (doc) entries.push(entryFromTranslations(slug, doc));
  }
  return entries;
}

const CORPUS_PT = carregarCorpus('pt-BR');
const CORPUS_EN = carregarCorpus('en');
const CORPUS_ES = carregarCorpus('es');

/** O slug campeão, ou `null` quando nada pontuou. */
function melhor(corpus: DocsIndexEntry[], pergunta: string): string | null {
  return searchDocs(corpus, pergunta)[0]?.slug ?? null;
}

function nota(corpus: DocsIndexEntry[], pergunta: string): number {
  return searchDocs(corpus, pergunta)[0]?.score ?? 0;
}

describe('o corpus que o teste lê', () => {
  it('tem os 84 slugs, nas três línguas', () => {
    expect(CORPUS_PT).toHaveLength(84);
    expect(CORPUS_EN).toHaveLength(84);
    expect(CORPUS_ES).toHaveLength(84);
  });

  it('traz aiEntities em pelo menos 56 deles', () => {
    // É o campo que torna a recuperação léxica viável. Se ele encolher, esta
    // asserção avisa antes de a qualidade da resposta cair em silêncio.
    const comEntidades = CORPUS_PT.filter((entry) => entry.entities.length > 0);
    expect(comEntidades.length).toBeGreaterThanOrEqual(56);
  });

  it('não deixa o corpo vazio em slug nenhum', () => {
    const vazios = CORPUS_PT.filter((entry) => entry.body.trim().length === 0);
    expect(vazios.map((entry) => entry.slug)).toEqual([]);
  });
});

describe('normalização e recorte de termos', () => {
  it('tira acento e caixa — quem pergunta digita sem acento', () => {
    expect(normalize('Formulário')).toBe('formulario');
    expect(normalize('AÇÃO')).toBe('acao');
  });

  it('o hífen separa, e é isso que faz "alert dialog" achar alert-dialog', () => {
    expect(tokenize('alert-dialog')).toEqual(['alert', 'dialog']);
  });

  // Este bloco existe por um defeito de campo, não por zelo: `ComputerUse`
  // virava o termo único `computeruse` — a quebra acontecia depois de
  // minuscular — e a pergunta devolvia button, chart e dialog. O chat respondia
  // que o componente não existe, sobre um componente documentado cujo nome a
  // pessoa tinha acabado de ler na barra lateral.
  it.each([
    ['ComputerUse', ['computer', 'use']],
    ['HoverCard', ['hover', 'card']],
    ['DataTable', ['data', 'table']],
    // Sigla seguida de palavra: o corte da sigla vem primeiro, senão `OTP`
    // seria partido no meio.
    ['InputOTP', ['input', 'otp']],
    ['InputOTPField', ['input', 'otp', 'field']],
  ])('maiúscula no meio separa: %s', (entrada, esperado) => {
    expect(tokenize(entrada)).toEqual(esperado);
  });

  it('descarta termo de uma letra, que não distingue documento nenhum', () => {
    expect(tokenize('o a e x')).toEqual([]);
  });
});

describe('pergunta que cita o componente pelo nome', () => {
  it.each([
    ['Quais variantes o Alert tem?', 'alert'],
    ['Como uso o chat thread para streaming?', 'chat-thread'],
    ['o composer aceita anexo?', 'composer'],
    ['como funciona o data table?', 'data-table'],
    // Como a pessoa REALMENTE digita: copiando o nome da barra lateral.
    ['pra que serve o componente ComputerUse?', 'computer-use'],
    ['qual a diferença entre popover e HoverCard?', 'hover-card'],
    ['como uso o InputOTP?', 'input-otp'],
  ])('%s → %s', (pergunta, slug) => {
    expect(melhor(CORPUS_PT, pergunta)).toBe(slug);
  });

  it('nome composto ganha do nome simples que ele contém', () => {
    // "alert-dialog tem botão de cancelar?" casa `alert` e `dialog` isolados
    // também. Sem o bônus de sequência os três empatariam no mesmo patamar, e
    // o modelo receberia o componente errado em primeiro lugar.
    const hits = searchDocs(CORPUS_PT, 'alert-dialog tem botao de cancelar?');
    expect(hits[0].slug).toBe('alert-dialog');
    expect(hits.slice(0, 3).map((hit) => hit.slug)).toContain('dialog');
  });

  it('funciona em inglês e em espanhol, contra o corpus daquela língua', () => {
    expect(melhor(CORPUS_EN, 'What props does Badge take?')).toBe('badge');
    expect(melhor(CORPUS_ES, 'que hace el componente tooltip?')).toBe('tooltip');
  });

  it('pontua muito acima do piso — este é o caso fácil', () => {
    expect(nota(CORPUS_PT, 'Quais variantes o Alert tem?')).toBeGreaterThan(7);
  });
});

describe('pergunta que cita só um conceito, sem nome nenhum', () => {
  it.each([
    ['como anuncio erro de formulario para leitor de tela', ['form', 'label', 'input']],
    ['qual componente mostra uma mensagem de sucesso temporaria', ['alert', 'sonner']],
    ['como faco uma tabela que ordena por coluna', ['data-table', 'table']],
    ['como deixo o usuario escolher varias opcoes de uma lista', ['combobox', 'select']],
    ['preciso pedir autorizacao antes de rodar uma ferramenta', ['approval-card', 'tool-group']],
    ['como mostro quanto do contexto ja foi gasto', ['context-breakdown', 'context-display', 'quota-banner']],
  ])('%s traz um dos esperados no topo', (pergunta, esperados) => {
    const topo = searchDocs(CORPUS_PT, pergunta, { limit: 3 }).map((hit) => hit.slug);
    expect(topo.some((slug) => (esperados as string[]).includes(slug))).toBe(true);
  });

  it('passa do piso, para quem chama poder responder', () => {
    // A faixa medida deste grupo começa em 0,70 — o caso mais magro é
    // "como mostro as fontes que a resposta citou". Ele precisa passar, senão a
    // interface diz "não sei" para uma pergunta que o corpus responde.
    const magra = nota(CORPUS_PT, 'como mostro as fontes que a resposta citou');
    expect(magra).toBeGreaterThan(RETRIEVAL_FLOOR);
    expect(isWeakRetrieval(searchDocs(CORPUS_PT, 'como mostro as fontes que a resposta citou'))).toBe(false);
  });

  it('em inglês, o conceito acha o formulário', () => {
    const topo = searchDocs(CORPUS_EN, 'how do I announce a form error to screen readers', {
      limit: 3,
    }).map((hit) => hit.slug);
    expect(topo).toContain('form');
  });
});

describe('pergunta sem resposta no corpus', () => {
  const FORA = [
    'como configuro o kubernetes para escalar pods no cluster',
    'qual a capital da Australia',
    'qual a receita de bolo de cenoura com cobertura',
    'quanto custa uma passagem de aviao para Lisboa em dezembro',
    'me explique a teoria da relatividade geral de Einstein',
    'como declaro imposto de renda de pessoa fisica',
    'qual o melhor banco de dados relacional para producao',
    'quem ganhou a copa do mundo de 2022',
  ];

  it.each(FORA)('%s fica abaixo do piso', (pergunta) => {
    expect(nota(CORPUS_PT, pergunta)).toBeLessThan(RETRIEVAL_FLOOR);
  });

  it('isWeakRetrieval concorda — é ela que quem chama consulta', () => {
    for (const pergunta of FORA) {
      expect(isWeakRetrieval(searchDocs(CORPUS_PT, pergunta))).toBe(true);
    }
  });

  it('pergunta sem termo nenhum devolve lista vazia, e vazio é fraco', () => {
    expect(searchDocs(CORPUS_PT, 'o a de')).toEqual([]);
    expect(isWeakRetrieval([])).toBe(true);
  });

  it('a colisão léxica conhecida continua sendo colisão', () => {
    // "motor" (de mídia) aparece no resumo do media-player, e nenhum limiar
    // separa isso de "motor do carro". O teste existe para que a limitação
    // fique MEDIDA e não vire surpresa: se um dia a nota cair sozinha, é
    // porque o conteúdo mudou, e alguém precisa saber.
    //
    // Este é o motivo de o piso não ser o único guarda. A instrução de sistema
    // do servidor é a segunda camada, e é ela que pega este caso.
    const nota = searchDocs(CORPUS_PT, 'preciso trocar o oleo do motor do carro')[0];
    expect(nota.slug).toBe('media-player');
    expect(nota.score).toBeLessThan(1);
  });
});

describe('o formato do que sai', () => {
  const corpus: DocsIndexEntry[] = [
    {
      slug: 'primeiro',
      title: 'Primeiro',
      category: 'Teste',
      entities: 'sigma',
      summary: 'sigma sigma',
      body: 'sigma sigma sigma',
    },
    { slug: 'segundo', title: 'Segundo', category: 'Teste', entities: '', summary: '', body: 'sigma' },
    { slug: 'terceiro', title: 'Terceiro', category: 'Teste', entities: '', summary: '', body: 'outro' },
  ];

  it('respeita o limite pedido', () => {
    expect(searchDocs(corpus, 'sigma', { limit: 1 })).toHaveLength(1);
  });

  it('não devolve quem não pontuou', () => {
    expect(searchDocs(corpus, 'sigma').map((hit) => hit.slug)).toEqual(['primeiro', 'segundo']);
  });

  it('devolve a nota e os termos que casaram, para quem chama decidir', () => {
    const [hit] = searchDocs(corpus, 'sigma');
    expect(hit.matched).toEqual(['sigma']);
    expect(hit.score).toBeGreaterThan(0);
  });

  it('corpus vazio não explode', () => {
    expect(searchDocs([], 'qualquer coisa')).toEqual([]);
  });

  it('a nota não cresce só porque a pergunta é comprida', () => {
    // É o que sustenta o piso: sem normalização, uma pergunta de vinte palavras
    // pontuaria mais que uma de três pelo tamanho, e nenhum limiar fixo
    // separaria "achei" de "não achei".
    const curta = searchDocs(corpus, 'sigma')[0].score;
    const comprida = searchDocs(corpus, 'sigma sigma sigma sigma sigma')[0].score;
    expect(comprida).toBeCloseTo(curta, 5);
  });
});

describe('entryFromTranslations — o que entra no corpus', () => {
  it('separa os campos de alta densidade do corpo', () => {
    const entry = entryFromTranslations('exemplo', {
      title: 'Exemplo — Feedback',
      category: 'Feedback',
      description: 'descricao curta',
      seo: { aiEntities: 'Exemplo, WCAG', aiSummary: 'resumo para modelo', description: 'seo' },
      anatomy: { texto: 'corpo do documento' },
    });
    expect(entry.entities).toBe('Exemplo, WCAG');
    expect(entry.summary).toContain('resumo para modelo');
    expect(entry.summary).toContain('descricao curta');
    expect(entry.body).toContain('corpo do documento');
  });

  it('ignora os snippets por stack — código não é sinal de assunto', () => {
    const entry = entryFromTranslations('exemplo', {
      title: 'Exemplo',
      anatomy: { structureCode: { react: 'ZZZUNICO', vue: 'ZZZUNICO' }, texto: 'prosa' },
    });
    expect(entry.body).toContain('prosa');
    expect(entry.body).not.toContain('ZZZUNICO');
  });

  it('aceita documento sem seo, que são 28 dos 84', () => {
    const entry = entryFromTranslations('exemplo', { title: 'Exemplo' });
    expect(entry.entities).toBe('');
    expect(entry.summary).toBe('');
  });
});
