/**
 * ─── O contrato de borda da função de perguntar ──────────────────────────────
 *
 * POR QUE ESTE ARQUIVO EXISTE
 *
 * A função foi escrita no padrão Web — `(Request) => Response` — e o runtime
 * `nodejs` da Vercel entrega `(req, res)` do Node. Ela quebrava na PRIMEIRA
 * linha que lia um cabeçalho, com `request.headers.get is not a function`, em
 * qualquer chamada, por qualquer caminho.
 *
 * Os 40 testes do índice de recuperação continuaram verdes o tempo todo: eles
 * exercitam a pontuação, que é pura e não sabe o que é uma requisição. Um teste
 * que chamasse o núcleo direto também passaria. Só um servidor HTTP de verdade,
 * chamando o `export default`, vê o defeito — e é por isso que este arquivo sobe
 * um `node:http` em vez de invocar a função.
 *
 * O QUE ELE NÃO FAZ
 *
 * Não chama o modelo. Todos os casos aqui são resolvidos ANTES da chamada — é o
 * que os torna determinísticos e sem rede. O caminho que chega à API é
 * verificado à mão, com chave inválida, porque depender de rede num teste é
 * trocar um portão por uma fonte de intermitência.
 *
 * Mora em `src/lib/` e não em `src/components/ui/`: não serve a componente
 * nenhum, serve a uma aplicação.
 */
import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import handler, { MAX_QUESTION_LENGTH } from '../../api/perguntar';

let servidor: Server;
let base: string;

beforeAll(async () => {
  servidor = createServer((req, res) => {
    void handler(req, res);
  });
  await new Promise<void>((resolve) => servidor.listen(0, '127.0.0.1', resolve));
  const endereco = servidor.address();
  if (typeof endereco === 'string' || endereco === null) throw new Error('sem porta');
  base = `http://127.0.0.1:${endereco.port}/api/perguntar`;
});

afterAll(() => {
  servidor.close();
});

/**
 * Cada teste usa um IP próprio.
 *
 * O limite de taxa é estado de MÓDULO: um teste que gastasse a cota do IP
 * derrubaria o seguinte com 429, e a falha apareceria no teste errado.
 */
function perguntar(ip: string, corpo: unknown, metodo = 'POST') {
  return fetch(base, {
    method: metodo,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: metodo === 'GET' ? undefined : JSON.stringify(corpo),
  });
}

describe('a função responde pela borda do Node, que é a que a Vercel entrega', () => {
  it('não estoura ao ler cabeçalho — o defeito que motivou este arquivo', async () => {
    // Qualquer resposta serve: o que se afirma é que a requisição ATRAVESSOU a
    // função. Com o defeito original, isto derrubava o processo.
    const resposta = await perguntar('10.0.0.1', { pergunta: 'oi', locale: 'pt-BR' }, 'GET');
    expect(resposta.status).toBeTypeOf('number');
  });

  it('recusa método que não seja POST', async () => {
    const resposta = await perguntar('10.0.0.2', undefined, 'GET');
    expect(resposta.status).toBe(405);
    await expect(resposta.json()).resolves.toMatchObject({ code: 'metodo' });
  });

  it('recusa pergunta vazia', async () => {
    const resposta = await perguntar('10.0.0.3', { pergunta: '   ', locale: 'pt-BR' });
    expect(resposta.status).toBe(400);
    await expect(resposta.json()).resolves.toMatchObject({ code: 'pergunta_vazia' });
  });

  it('recusa corpo que não é JSON', async () => {
    const resposta = await fetch(base, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.4' },
      body: 'isto não é json',
    });
    expect(resposta.status).toBe(400);
    await expect(resposta.json()).resolves.toMatchObject({ code: 'json_invalido' });
  });

  // São DOIS cortes, e a diferença importa: o do corpo protege o servidor de
  // ler megabytes antes de julgar, e o da pergunta protege o prompt. Escrevi
  // este teste esperando um só, e foi ele que me corrigiu.
  it('recusa pergunta acima do teto, mas com corpo pequeno', async () => {
    const resposta = await perguntar('10.0.0.5', {
      pergunta: 'a'.repeat(MAX_QUESTION_LENGTH + 1),
      locale: 'pt-BR',
    });
    await expect(resposta.json()).resolves.toMatchObject({ code: 'pergunta_longa' });
  });

  it('recusa corpo grande antes mesmo de olhar a pergunta', async () => {
    const resposta = await perguntar('10.0.0.8', {
      pergunta: 'a'.repeat(MAX_QUESTION_LENGTH * 4 + 10),
      locale: 'pt-BR',
    });
    expect(resposta.status).toBe(413);
    await expect(resposta.json()).resolves.toMatchObject({ code: 'corpo_grande' });
  });

  it('sem chave configurada, diz isso em vez de falhar calada', async () => {
    const antes = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    // A função tem uma rede de segurança que lê o .env.local da máquina quando a
    // variável não veio do ambiente. Aqui ela precisa sair do caminho, senão o
    // teste passa a depender de quem roda ter — ou não ter — a chave no disco.
    process.env.NORTEAR_IGNORAR_ENV_LOCAL = '1';
    try {
      const resposta = await perguntar('10.0.0.6', {
        pergunta: 'o que é o slider?',
        locale: 'pt-BR',
      });
      expect(resposta.status).toBe(503);
      await expect(resposta.json()).resolves.toMatchObject({ code: 'sem_chave' });
    } finally {
      delete process.env.NORTEAR_IGNORAR_ENV_LOCAL;
      if (antes !== undefined) process.env.GEMINI_API_KEY = antes;
    }
  });

  it('o limite de taxa dispara no mesmo IP', async () => {
    // Sem chave de propósito: o corte por taxa acontece ANTES da leitura da
    // chave, então o teste não depende de rede nem de credencial.
    const antes = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    // A função tem uma rede de segurança que lê o .env.local da máquina quando a
    // variável não veio do ambiente. Aqui ela precisa sair do caminho, senão o
    // teste passa a depender de quem roda ter — ou não ter — a chave no disco.
    process.env.NORTEAR_IGNORAR_ENV_LOCAL = '1';
    try {
      let bateu = 0;
      for (let i = 0; i < 15; i++) {
        const resposta = await perguntar('10.0.0.7', { pergunta: 'badge', locale: 'pt-BR' });
        await resposta.text();
        if (resposta.status === 429) {
          bateu = i + 1;
          break;
        }
      }
      expect(bateu).toBeGreaterThan(0);
      expect(bateu).toBeLessThanOrEqual(12);
    } finally {
      delete process.env.NORTEAR_IGNORAR_ENV_LOCAL;
      if (antes !== undefined) process.env.GEMINI_API_KEY = antes;
    }
  });
});
