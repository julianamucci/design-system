/**
 * ─── A rede de segurança que lê o `.env.local` da stack ──────────────────────
 *
 * POR QUE EM ARQUIVO SEPARADO
 *
 * O carregamento é memoizado por MÓDULO: acontece uma vez por processo, de
 * propósito, para não reler disco a cada pergunta. Um caso dentro do arquivo de
 * borda dependeria de ter rodado antes dos outros — e teste sensível a ordem é
 * o que esta casa já pagou caro para não ter. Arquivo próprio nasce com o
 * módulo limpo.
 *
 * POR QUE ISTO PRECISA DE PORTÃO
 *
 * O leitor cobria só `GEMINI_*`, de quando o Google era o único provedor. Sem
 * vínculo com a Vercel — que é o estado normal de quem clona o repositório —,
 * as `CHAT_DOCS_*` do arquivo eram IGNORADAS: o provedor caía no padrão, o chat
 * respondia pela outra credencial, e nada na tela dizia isso. Funcionava pelo
 * motivo errado, que é o defeito mais caro de achar.
 *
 * NÃO HÁ REDE AQUI
 *
 * A prova usa `CHAT_DOCS_BASE_URL` apontando para uma porta morta. Se o arquivo
 * FOI lido, a função passa da checagem de chave e falha ao conectar; se não
 * foi, ela para antes, em `sem_chave`. Os dois desfechos são distinguíveis sem
 * falar com servidor nenhum de verdade.
 */
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { responder } from '../../../docs/shared/chat-docs/servidor';

afterEach(() => {
  vi.restoreAllMocks();
});

function pergunta() {
  return new Request('http://local/api/perguntar', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.9.9.9' },
    body: JSON.stringify({ pergunta: 'o que é o slider?', locale: 'pt-BR' }),
  });
}

it('lê as CHAT_DOCS_* do .env.local, e não só as do Google', async () => {
  const pasta = mkdtempSync(join(tmpdir(), 'nds-envlocal-'));
  writeFileSync(
    join(pasta, '.env.local'),
    [
      // Com aspas de propósito: é convenção comum de arquivo `.env`, e sem
      // tirá-las a chave viaja com aspas e a API recusa — sintoma que aponta
      // para o lugar errado.
      'CHAT_DOCS_API_KEY="chave-falsa-de-teste"',
      // Porta morta: nada sai desta máquina.
      'CHAT_DOCS_BASE_URL=http://127.0.0.1:1/v1',
      'CHAT_DOCS_MODELO=modelo-que-so-existe-neste-teste',
      // Não deve vazar para o processo: não está na lista de variáveis
      // reconhecidas, e um arquivo local não pode reconfigurar o processo.
      'VARIAVEL_INTRUSA=nao-deveria-entrar',
    ].join('\n'),
  );

  // Nem a chave do ambiente, nem a saída de emergência: o arquivo é a única
  // fonte possível, e é isso que torna o resultado uma prova.
  delete process.env.CHAT_DOCS_API_KEY;
  delete process.env.CHAT_DOCS_BASE_URL;
  delete process.env.CHAT_DOCS_MODELO;
  delete process.env.NORTEAR_IGNORAR_ENV_LOCAL;
  vi.spyOn(process, 'cwd').mockReturnValue(pasta);

  const resposta = await responder(pergunta());

  // O TIPO da resposta é a prova, e é mais forte que ler o corpo: falha ANTES
  // do fluxo — `sem_chave` inclusive — sai como JSON com código HTTP; quem
  // passou do portão da chave sai como `text/event-stream`. Escrevi este caso
  // esperando JSON e foi o SSE que me corrigiu: o arquivo tinha sido lido.
  expect(resposta.headers.get('content-type')).toContain('text/event-stream');
  expect(resposta.status).toBe(200);

  // E o arquivo alimentou `process.env` para as variáveis reconhecidas...
  expect(process.env.CHAT_DOCS_MODELO).toBe('modelo-que-so-existe-neste-teste');
  // ...com as aspas removidas.
  expect(process.env.CHAT_DOCS_BASE_URL).toBe('http://127.0.0.1:1/v1');
  // ...e SÓ para elas. Um `.env.local` de máquina não configura o processo.
  expect(process.env.VARIAVEL_INTRUSA).toBeUndefined();
});
