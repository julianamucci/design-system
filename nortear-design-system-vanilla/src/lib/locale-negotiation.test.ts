/**
 * ─── A escada que decide o idioma inicial ────────────────────────────────────
 *
 * POR QUE ESTE ARQUIVO EXISTE
 *
 * O primitivo não tinha teste nenhum, e por isso passou meses inteiramente
 * inerte: o parâmetro se chamava `window` e sombreava o global, então
 * `typeof window === 'undefined'` dentro da função testava o PARÂMETRO. Com o
 * argumento omitido — que é como todos os chamadores chamam, menos o chat — a
 * função devolvia o padrão na primeira linha.
 *
 * A função inteira virava `return 'pt-BR'`: `?lang=` ignorado, preferência
 * salva ignorada (trocar de idioma e recarregar perdia a escolha) e idioma do
 * navegador ignorado. Nas cinco stacks e na barra lateral.
 *
 * Ninguém viu porque o padrão É português e quase todo teste roda em português:
 * o defeito devolvia a resposta certa pelo motivo errado.
 *
 * O teste roda em `environment: 'node'`, onde NÃO existe `window` global — e é
 * justamente isso que permite afirmar a ramificação do sombreamento sem montar
 * um navegador.
 */
import { describe, expect, it } from 'vitest';
import {
  LOCALES,
  localeDoNavegador,
  negociarLocale,
} from '../../../docs/shared/primitives/locale-negotiation';

/** Uma janela de mentira, com só o que a função lê. */
function janela(busca = '', salvo: string | null = null) {
  return {
    location: { search: busca },
    localStorage: { getItem: () => salvo },
  };
}

describe('localeDoNavegador', () => {
  it('pega o primeiro idioma que o sistema fala, na ordem da pessoa', () => {
    expect(localeDoNavegador(['fr-FR', 'en-GB', 'pt-BR'])).toBe('en');
  });

  it('casa pela raiz — pt-PT e pt-AO também são português', () => {
    expect(localeDoNavegador(['pt-PT'])).toBe('pt-BR');
    expect(localeDoNavegador(['es-AR'])).toBe('es');
  });

  it('devolve nulo quando não fala nenhum', () => {
    expect(localeDoNavegador(['fr-FR', 'de-DE'])).toBeNull();
  });
});

describe('a ordem da escada', () => {
  it('a URL vence tudo — link compartilhado é escolha explícita', () => {
    expect(negociarLocale(janela('?lang=es', 'en'), ['pt-BR'])).toBe('es');
  });

  it('a preferência salva vence o navegador — escolha anterior é escolha', () => {
    expect(negociarLocale(janela('', 'en'), ['pt-BR'])).toBe('en');
  });

  it('o navegador entra quando não há URL nem preferência', () => {
    expect(negociarLocale(janela(), ['es-ES'])).toBe('es');
  });

  it('cai no padrão quando o navegador fala um idioma que o sistema não tem', () => {
    expect(negociarLocale(janela(), ['fr-FR'])).toBe('pt-BR');
  });

  it('ignora valor inválido na URL e no armazenamento', () => {
    expect(negociarLocale(janela('?lang=klingon', 'elfico'), ['en'])).toBe('en');
  });
});

describe('a regressão do parâmetro que sombreava o global', () => {
  it('sem janela nenhuma, devolve o padrão — e é a ÚNICA saída legítima', () => {
    // Em `environment: 'node'` não há `window` global. Com o sombreamento, esta
    // era a resposta de TODA chamada sem argumento, inclusive no navegador.
    expect(negociarLocale()).toBe('pt-BR');
  });

  it('com janela passada, a escada roda', () => {
    expect(negociarLocale(janela('?lang=en'))).toBe('en');
    expect(negociarLocale(janela('', 'es'))).toBe('es');
    expect(negociarLocale(janela(), ['en-US'])).toBe('en');
  });

  it('SEM argumento, lê o window GLOBAL — este é o caso que o defeito matava', () => {
    // Passar a janela explicitamente NÃO distingue as duas versões: com o
    // sombreamento, o parâmetro recebia o objeto e a escada rodava igual. O
    // defeito só aparecia com o argumento OMITIDO e um `window` global
    // presente — que é a situação de todo chamador real, no navegador.
    //
    // Montar o global aqui é o que torna o teste capaz de reprovar. Verificado
    // replantando o defeito: sem isto, ele passava.
    const anterior = (globalThis as { window?: unknown }).window;
    (globalThis as { window?: unknown }).window = janela('?lang=es');
    try {
      expect(negociarLocale()).toBe('es');
    } finally {
      if (anterior === undefined) delete (globalThis as { window?: unknown }).window;
      else (globalThis as { window?: unknown }).window = anterior;
    }
  });

  it('a chave do armazenamento é respeitada', () => {
    const lida: string[] = [];
    const w = {
      location: { search: '' },
      localStorage: {
        getItem: (chave: string) => {
          lida.push(chave);
          return null;
        },
      },
    };
    negociarLocale(w, ['fr'], 'outra-chave');
    expect(lida).toEqual(['outra-chave']);
  });
});

describe('o contrato do módulo', () => {
  it('os três idiomas do conteúdo compartilhado, nesta ordem', () => {
    expect([...LOCALES]).toEqual(['pt-BR', 'en', 'es']);
  });
});
