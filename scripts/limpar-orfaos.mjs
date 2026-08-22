#!/usr/bin/env node
/**
 * Encerra processo de teste ÓRFÃO antes de abrir uma suíte nova.
 *
 * Por que existe: em 2026-08-21 a máquina carregava um `vitest run` do Vanilla
 * de pé desde as 12:08 — morto pelo timeout da ferramenta que o iniciou, nunca
 * encerrado — com 14 `chrome-headless-shell` presos a ele. A suíte do React
 * levava ~290s nesse estado e 162,6s com a máquina limpa. Quarenta e quatro por
 * cento do relógio, sem tocar em uma linha de código.
 *
 * O sintoma barato de reconhecer, quando isto não roda, é o
 * `Port 63315 is in use, trying another one...` na abertura da suíte.
 *
 * ─── O que ele NÃO faz ──────────────────────────────────────────────────────
 *
 * Não encerra processo recente. O corte de idade existe porque duas suítes
 * legítimas podem rodar ao mesmo tempo — uma por stack — e matar a irmã seria
 * pior que o problema que isto resolve. Órfão de verdade é o que sobreviveu ao
 * seu dono, e nenhuma suítе desta casa passa de vinte minutos.
 *
 * Não encerra `storybook dev`. É servidor de desenvolvimento, e quem o abriu
 * provavelmente quer que ele continue de pé — mesmo quando cresce demais (o do
 * Angular foi visto em 3,5 GB). Sobre esse, aqui só avisa.
 *
 * Não falha a suíte. Máquina sem `powershell`, permissão negada, formato de
 * saída diferente: tudo vira aviso e o teste segue. Higiene que quebra a suíte
 * é pior que sujeira.
 */
import { execFileSync } from 'node:child_process';

const IDADE_MINIMA_MIN = 20;
const AVISO_MEMORIA_MB = 1500;

function processos() {
  if (process.platform !== 'win32') return null;
  const ps = [
    "Get-CimInstance Win32_Process -Filter \"Name='node.exe' or Name='chrome-headless-shell.exe'\"",
    "| Select-Object ProcessId,Name,CreationDate,WorkingSetSize,CommandLine",
    '| ConvertTo-Json -Compress',
  ].join(' ');
  const bruto = execFileSync('powershell', ['-NoProfile', '-Command', ps], {
    encoding: 'utf8',
    timeout: 20_000,
  });
  const dados = JSON.parse(bruto || '[]');
  return Array.isArray(dados) ? dados : [dados];
}

function minutosDeVida(criacao) {
  // O CIM devolve `/Date(1234567890)/` quando serializado em JSON.
  const ms = /\/Date\((\d+)/.exec(String(criacao ?? ''))?.[1];
  if (!ms) return 0;
  return (Date.now() - Number(ms)) / 60_000;
}

function main() {
  let lista;
  try {
    lista = processos();
  } catch (erro) {
    console.warn(`[limpar-orfaos] não consegui listar processos (${erro.message}). Seguindo.`);
    return;
  }
  if (!lista) return; // plataforma sem suporte: silêncio, não é erro

  const alvos = [];
  for (const p of lista) {
    const idade = minutosDeVida(p.CreationDate);
    if (idade < IDADE_MINIMA_MIN) continue;
    const cmd = String(p.CommandLine ?? '');
    const ehVitest = /vitest/i.test(cmd);
    const ehNavegadorDeTeste = p.Name === 'chrome-headless-shell.exe';
    const ehServidorDeDev = /storybook[\/]dist[\/]bin|storybook.*\bdev\b/i.test(cmd);

    if (ehServidorDeDev) {
      const mb = Math.round((p.WorkingSetSize ?? 0) / 1024 / 1024);
      if (mb >= AVISO_MEMORIA_MB) {
        console.warn(
          `[limpar-orfaos] servidor de dev (pid ${p.ProcessId}) em ${mb} MB há ${Math.round(idade)} min. ` +
            'Não encerro servidor de dev — se não estiver usando, feche.',
        );
      }
      continue;
    }
    if (ehVitest || ehNavegadorDeTeste) alvos.push({ ...p, idade });
  }

  if (alvos.length === 0) return;

  let mortos = 0;
  for (const alvo of alvos) {
    try {
      execFileSync('powershell', [
        '-NoProfile',
        '-Command',
        `Stop-Process -Id ${alvo.ProcessId} -Force -ErrorAction Stop`,
      ], { timeout: 10_000 });
      mortos += 1;
    } catch {
      // Pode ter morrido sozinho entre a listagem e agora. Não é erro.
    }
  }
  console.warn(
    `[limpar-orfaos] encerrei ${mortos} processo(s) de teste com mais de ${IDADE_MINIMA_MIN} min. ` +
      'Eram sobra de rodada anterior, e é isso que faz a suíte lenta.',
  );
}

main();
