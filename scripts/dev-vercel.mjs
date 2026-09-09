/**
 * ─── O servidor de desenvolvimento que o `vercel dev` chama ──────────────────
 *
 * POR QUE ESTE ARQUIVO EXISTE
 *
 * Sem `devCommand` no `vercel.json`, o `vercel dev` ADIVINHA o framework. Ele
 * encontra um `vite.config.ts` na pasta e roda `vite --port $PORT`.
 *
 * Duas coisas dão errado nisso, e a segunda é a que aparece:
 *
 * 1. O `vite.config.ts` desta stack é a configuração do VITEST, não de uma
 *    aplicação. Não há servidor de aplicação para subir; a interface desta
 *    stack é o Storybook, e só ele.
 * 2. `$PORT` é sintaxe de shell POSIX. No Windows o `cmd` não expande, o Vite
 *    recebe a string literal `$PORT`, tenta lê-la como número e falha com
 *    "No available ports found between $PORT and 65535" — mensagem que descreve
 *    o sintoma e esconde a causa.
 *
 * A saída é declarar o comando e ler a porta AQUI, em Node, onde
 * `process.env.PORT` é apenas uma variável e nenhum shell precisa expandir
 * nada. Funciona igual nos três sistemas.
 *
 * O QUE ELE FAZ
 *
 * Compila o pacote do chat (o mesmo passo que o script `storybook` faz) e sobe
 * o Storybook na porta que o `vercel dev` reservou. O `vercel dev` fica na
 * frente: encaminha tudo para cá e atende `/api/*` com as funções, que é
 * exatamente o arranjo de produção — e é por isso que vale usá-lo em vez de
 * subir o Storybook sozinho.
 */
import { spawn } from 'node:child_process';

const porta = process.env.PORT;

if (!porta || !/^\d+$/.test(porta)) {
  console.error(
    '[dev-vercel] PORT não chegou como número (veio: ' +
      JSON.stringify(porta) +
      ').\n' +
      'Este script é para ser chamado pelo `vercel dev`, que define PORT.\n' +
      'Para subir só a interface, sem função de servidor: npm run storybook',
  );
  process.exit(1);
}

/** Roda um comando e resolve quando ele termina bem. */
function executar(comando, args, opcoes = {}) {
  return new Promise((resolve, reject) => {
    const filho = spawn(comando, args, {
      stdio: 'inherit',
      // `shell` no Windows é o que permite chamar `npm`/`storybook` sem o
      // caminho completo do executável.
      shell: process.platform === 'win32',
      ...opcoes,
    });
    filho.on('error', reject);
    filho.on('exit', (codigo) => {
      if (codigo === 0) resolve();
      else reject(new Error(comando + ' saiu com ' + codigo));
    });
  });
}

// O pacote do chat é estático e o Storybook o serve de `.storybook/public/`.
// Precisa existir antes de o Storybook subir, senão o manager carrega um script
// que não está lá e o painel simplesmente não aparece — sem erro visível.
await executar('npm', ['run', 'chat-docs']);

const storybook = spawn(
  'npm',
  ['exec', '--', 'storybook', 'dev', '-p', porta, '--no-open', '--quiet'],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);

// Sem isto, encerrar o `vercel dev` deixa o Storybook rodando e segurando a
// porta — e a próxima subida encontra "Port already in use", que é o mesmo tipo
// de mensagem que esconde a causa.
for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => {
    storybook.kill(sinal);
    process.exit(0);
  });
}

storybook.on('exit', (codigo) => process.exit(codigo ?? 0));
