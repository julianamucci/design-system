/**
 * ─── O chat de documentação: a interface, no MANAGER ─────────────────────────
 *
 * **Por que no manager e não no preview.** O preview recarrega a cada troca de
 * story — é literalmente outro documento. Um chat montado lá reiniciaria a cada
 * clique na sidebar, e uma conversa que se apaga quando a pessoa vai conferir o
 * componente sobre o qual estava perguntando não serve para nada. O manager é o
 * frame que sobrevive à navegação.
 *
 * **Por que isto não é um componente.** Guideline 17 §2: o design system não
 * tem runtime de conversa. Este arquivo faz `fetch`, guarda estado de execução
 * e agenda quadro — as três coisas que uma peça de `src/components/ui/` não
 * pode fazer. Ele CONSOME as peças (`createChatThread`, `createComposer`,
 * `createThinkingIndicator`) e não acrescenta nenhuma.
 *
 * **Acessibilidade, no mesmo rigor que o sistema cobra das peças:**
 *
 * - O painel é `role="dialog"` com nome acessível, e `aria-modal="false"`
 *   porque ele NÃO é modal: o Storybook atrás dele continua utilizável, e
 *   mentir sobre isso faria o leitor de tela esconder o resto da aplicação.
 * - Escape fecha e devolve o foco ao botão. Devolver o foco é a metade que
 *   costuma faltar: sem ela o foco cai no `<body>` e a pessoa recomeça a
 *   tabulação do topo do Storybook.
 * - Ao abrir, o foco vai para o campo — que é o que a pessoa veio fazer.
 * - SEM armadilha de foco. Tabular para fora do painel é permitido de
 *   propósito: em diálogo não modal, prender o foco é defeito, não recurso.
 * - `prefers-reduced-motion` é respeitado pela folha (ver `chat-docs.css`).
 */

import { negociarLocale, type Locale } from '../../../docs/shared/primitives/locale-negotiation';
import type { ChatSource } from '../../../docs/shared/primitives/chat-protocol';
import { createChatThread, type ChatThreadElement } from '../../src/components/ui/chat-thread';
import { createComposer, type ComposerElement } from '../../src/components/ui/composer';
import { createThinkingIndicator } from '../../src/components/ui/thinking-indicator';
import { ask, type SourcesEvent, type TurnoAnterior } from './client';
import { labelsFor, type ChatDocsLabels } from './labels';
import './chat-docs.css';

/** Mesmo teto que `api/perguntar.ts` declara. A pessoa vê o limite antes de bater nele. */
const MAX_QUESTION_LENGTH = 600;

/** Chave do idioma, a mesma que as docs pages e a sidebar usam. */
const LOCALE_KEY = 'ds-locale';

/**
 * Erro de CONFIGURAÇÃO, que não passa sozinho.
 *
 * Vale um aviso permanente no painel, e não a faixa de erro da conversa: a
 * faixa some na pergunta seguinte, e este problema não some — é o estado que
 * quem ainda não configurou a chave vê primeiro, e ele precisa ficar na tela
 * dizendo o que fazer.
 */
const CONFIG_ERRORS = new Set([
  'sem_chave',
  'sem_corpus',
  'chave_invalida',
  'sem_servidor',
  // Nome de modelo que a chave não alcança é configuração, não intermitência:
  // mostrar 'tente de novo' na conversa manda a pessoa repetir o que não vai
  // funcionar nunca.
  'modelo_indisponivel',
]);

interface Widget {
  root: HTMLDivElement;
  launcher: HTMLButtonElement;
  panel: HTMLDivElement;
  notice: HTMLDivElement;
  thread: ChatThreadElement;
  composer: ComposerElement;
  thinkingSlot: HTMLDivElement;
  labels: ChatDocsLabels;
  locale: Locale;
}

let widget: Widget | null = null;
let open = false;
let running: AbortController | null = null;
let messageSeq = 0;

/**
 * A conversa até agora, para a próxima pergunta fazer sentido.
 *
 * Sem isto o chat é de turno único: "quais as situações de uso DESSE" não tem
 * a que se referir, e — pior — a recuperação sozinha devolvia quatro
 * componentes sem relação com nota ACIMA do piso, o que produziria uma resposta
 * confiante e errada. O piso não protege contra pergunta de continuação.
 *
 * Só em memória, e morre com a aba. Persistir traria armazenamento e, com ele,
 * o que as pessoas digitam — que é outra conversa, com outras obrigações.
 */
const historico: TurnoAnterior[] = [];

/** Turnos que viajam. Seis são três pares, o bastante para um "e esse?" longe. */
const MAX_TURNOS = 6;

/* ── O índice do Storybook, para a citação virar link ──────────────────────── */

/**
 * slug → id da docs page.
 *
 * Sai de `index.json`, que o Storybook serve tanto em desenvolvimento quanto no
 * build estático. Derivar do índice, e não de uma tabela escrita à mão, é o que
 * impede a lista de envelhecer quando um componente muda de seção — o defeito
 * clássico do índice paralelo, o mesmo que `docs-index.ts` evita no corpus.
 */
let docsIds: Map<string, string> | null = null;

function slugKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

async function loadDocsIds(): Promise<Map<string, string>> {
  if (docsIds) return docsIds;
  const map = new Map<string, string>();
  try {
    const response = await fetch('index.json');
    const index = (await response.json()) as {
      entries?: Record<string, { id: string; title: string; type?: string }>;
    };
    for (const entry of Object.values(index.entries ?? {})) {
      if (entry.type !== 'docs') continue;
      const last = entry.title.split('/').pop() ?? '';
      map.set(slugKey(last), entry.id);
    }
  } catch {
    // Sem índice, a citação continua aparecendo — só não vira link para a
    // página. Perder o link é bem menos grave do que perder a citação.
  }
  docsIds = map;
  return map;
}

async function toSources(hits: SourcesEvent['hits']): Promise<ChatSource[]> {
  const ids = await loadDocsIds();
  return hits.map((hit) => {
    const id = ids.get(slugKey(hit.slug));
    return { title: hit.slug, url: id ? `?path=/docs/${id}` : './' };
  });
}

/* ── Montagem ─────────────────────────────────────────────────────────────── */

function currentLocale(): Locale {
  return negociarLocale(window, navigator.languages, LOCALE_KEY);
}

function build(locale: Locale): Widget {
  const labels = labelsFor(locale);

  const root = document.createElement('div');
  // `tema-default` não é decoração: `themes/index.css` declara que sem classe
  // de tema não há cor nenhuma, e o manager não carrega o tema do preview.
  root.className = 'chat-docs-root tema-default';

  const panelId = 'chat-docs-panel';

  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'nds-button nds-button-default chat-docs-launcher nds-shadow-lg';
  launcher.textContent = labels.launcher;
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', panelId);

  const panel = document.createElement('div');
  panel.id = panelId;
  panel.className = 'chat-docs-panel nds-shadow-xl';
  panel.setAttribute('role', 'dialog');
  // NÃO modal, e declarado: o Storybook atrás continua utilizável, e um
  // `aria-modal="true"` mentiroso esconderia o resto da aplicação de quem lê a
  // tela por software.
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-label', labels.panel);
  panel.hidden = true;

  const header = document.createElement('div');
  header.className = 'chat-docs-header';
  const title = document.createElement('h2');
  title.className = 'chat-docs-title nds-text-h4';
  title.textContent = labels.title;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nds-button nds-button-ghost nds-button-sm';
  close.textContent = labels.close;
  header.append(title, close);

  const body = document.createElement('div');
  body.className = 'chat-docs-body';

  const notice = document.createElement('div');
  notice.hidden = true;

  // ── Aviso permanente de demonstração ──────────────────────────────────────
  //
  // O Storybook é público e o chat roda num modelo de camada gratuita, com teto
  // DIÁRIO de requisições. Sem este aviso, quem chega depois do teto estourado
  // vê um erro e conclui que o chat está quebrado — quando ele está esgotado.
  //
  // NÃO é `role="alert"`: o aviso já está na tela quando o painel abre, e região
  // viva serve para o que CHEGA. Anunciá-lo a cada abertura seria repetir a
  // mesma frase para quem usa leitor de tela, antes de deixar a pessoa
  // perguntar o que veio perguntar. O texto está no fluxo do documento, então
  // quem navega o lê na ordem natural. Compare com `showNotice`, que É
  // `role="alert"` — lá o aviso aparece por causa de uma falha, e a pessoa
  // precisa saber sem procurar.
  const demo = document.createElement('div');
  demo.className = 'nds-alert nds-alert-info chat-docs-demo';
  const demoTexto = document.createElement('div');
  demoTexto.className = 'nds-alert-description';
  demoTexto.textContent = labels.demo;
  demo.appendChild(demoTexto);

  const thread = createChatThread({
    labels: labels.thread,
    regionLabel: labels.panel,
    messages: [{ role: 'system', content: labels.empty }],
  });

  const thinkingSlot = document.createElement('div');

  body.append(demo, notice, thread, thinkingSlot);

  const footer = document.createElement('div');
  footer.className = 'chat-docs-footer';

  const composer = createComposer({
    labels: labels.composer,
    rows: 2,
    maxLength: MAX_QUESTION_LENGTH,
    onSubmit: (value) => {
      void submit(value);
    },
    onStop: () => {
      running?.abort();
      running = null;
      composer.setRunning(false);
      clearThinking();
    },
  });
  footer.appendChild(composer);

  panel.append(header, body, footer);
  root.append(launcher, panel);

  close.addEventListener('click', () => closePanel());
  launcher.addEventListener('click', () => (open ? closePanel() : openPanel()));

  // Escape no painel. No PAINEL e não no documento: um ouvinte global fecharia
  // o chat quando alguém apertasse Escape num popover do Storybook.
  panel.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    closePanel();
  });

  document.body.appendChild(root);

  return { root, launcher, panel, notice, thread, composer, thinkingSlot, labels, locale };
}

function ensureWidget(): Widget {
  const locale = currentLocale();
  if (widget && widget.locale === locale) return widget;
  // Trocou de idioma com o painel fechado: reconstrói. Reconstruir é honesto
  // aqui — a conversa anterior estava em outra língua, e traduzir uma
  // transcrição é problema que este protótipo não tem.
  if (widget) widget.root.remove();
  widget = build(locale);
  return widget;
}

/* ── Abrir e fechar ───────────────────────────────────────────────────────── */

function openPanel(): void {
  const w = ensureWidget();
  open = true;
  w.launcher.setAttribute('aria-expanded', 'true');
  w.panel.hidden = false;
  w.panel.dataset.entering = 'true';
  // Um quadro depois: sem isto o navegador aplica os dois estados na mesma
  // recalculação e não há transição nenhuma para animar.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      delete w.panel.dataset.entering;
    });
  });

  // A conversa é ancorada no fim DEPOIS de o painel aparecer.
  //
  // Enquanto o painel está `hidden`, o viewport mede zero: a mensagem de
  // boas-vindas entra, o componente tenta acompanhar o fim e a rolagem não vai a
  // lugar nenhum, porque não há caixa para rolar. Quando o painel abre, o
  // conteúdo passa a transbordar com `scrollTop` em zero — e o componente
  // conclui, corretamente, que a rolagem NÃO está no fim. O botão de ir ao fim
  // aparecia dizendo "0 novas", que é a descrição exata de um estado que não
  // deveria existir.
  //
  // A correção é ancorar aqui, não adivinhar lá dentro: quem sabe quando o
  // painel ficou visível é quem o abriu. O `chat-scroll` avisa disso no próprio
  // contrato — medir antes de o conteúdo crescer —, e o caso do elemento oculto
  // é a mesma armadilha vista do outro lado.
  w.thread.jumpToEnd();

  // O foco vai para o campo, que é o que a pessoa veio fazer. Consultado pelo
  // ELEMENTO e não pela classe: `ComposerElement` não expõe `focus()` do campo,
  // e `textarea` é o contrato semântico, que muda menos que um nome de classe.
  w.panel.querySelector('textarea')?.focus();
}

function closePanel(): void {
  if (!widget) return;
  open = false;
  widget.panel.hidden = true;
  widget.launcher.setAttribute('aria-expanded', 'false');
  // Devolver o foco é a metade que costuma faltar: sem isto ele cai no `<body>`
  // e a tabulação recomeça no topo do Storybook.
  widget.launcher.focus();
}

/* ── A espera ─────────────────────────────────────────────────────────────── */

function showThinking(w: Widget): void {
  w.thinkingSlot.replaceChildren(createThinkingIndicator({ label: w.labels.thinking }));
}

function clearThinking(): void {
  widget?.thinkingSlot.replaceChildren();
}

function showNotice(w: Widget, text: string): void {
  const alert = document.createElement('div');
  alert.className = 'nds-alert nds-alert-destructive chat-docs-notice';
  alert.setAttribute('role', 'alert');
  const description = document.createElement('div');
  description.className = 'nds-alert-description';
  description.textContent = text;
  alert.appendChild(description);
  w.notice.replaceChildren(alert);
  w.notice.hidden = false;
}

/* ── Uma pergunta ─────────────────────────────────────────────────────────── */

async function submit(question: string): Promise<void> {
  const w = ensureWidget();
  const text = question.trim();
  if (text.length === 0 || running) return;

  w.notice.hidden = true;
  w.thread.setError(null);
  w.composer.setValue('');
  w.composer.setRunning(true);
  showThinking(w);

  messageSeq += 1;
  const answerId = `resposta-${messageSeq}`;

  w.thread.append({ id: `pergunta-${messageSeq}`, role: 'user', content: text });
  w.thread.append({ id: answerId, role: 'assistant', content: '', streaming: true });

  const controller = new AbortController();
  running = controller;
  let answer = '';

  await ask(
    text,
    w.locale,
    {
      onSources: (event) => {
        void toSources(event.hits).then((sources) => {
          w.thread.update(answerId, { sources });
        });
      },
      onDelta: (chunk) => {
        // O primeiro trecho é o fim da espera: o indicador sai quando o texto
        // começa, e não quando a resposta termina.
        clearThinking();
        answer += chunk;
        w.thread.update(answerId, { content: answer });
      },
      onDone: () => {
        // Desligar `streaming` é o que dispara o anúncio único da resposta
        // pronta — ver o cabeçalho de `chat-thread.ts`.
        w.thread.update(answerId, { streaming: false });
      },
      onError: (code) => {
        const message = w.labels.errors[code] ?? w.labels.errorFallback;
        w.thread.update(answerId, { streaming: false });
        if (CONFIG_ERRORS.has(code)) showNotice(w, message);
        else w.thread.setError(message);
      },
    },
    controller.signal,
    // Cópia, e recortada: o array é mutado logo abaixo, e mandar a referência
    // viva significaria que uma resposta lenta veria um histórico que mudou.
    historico.slice(-MAX_TURNOS),
  );

  clearThinking();
  running = null;
  w.composer.setRunning(false);

  // O turno entra no histórico DEPOIS de responder, e só se houve resposta.
  // Guardar a pergunta antes faria a própria pergunta atual voltar como
  // contexto dela mesma; guardar uma resposta vazia ensinaria o modelo a
  // responder vazio.
  historico.push({ papel: 'user', texto: text });
  if (answer.trim()) historico.push({ papel: 'model', texto: answer });
  while (historico.length > MAX_TURNOS) historico.shift();
}

/* ── Entrada ──────────────────────────────────────────────────────────────── */

let mounted = false;

/**
 * Monta o botão flutuante no manager. Idempotente: o manager pode reavaliar o
 * módulo em recarga a quente, e duas instâncias dariam dois botões e dois
 * nomes acessíveis idênticos.
 */
export function mountChatDocs(): void {
  if (mounted || typeof document === 'undefined') return;
  mounted = true;
  ensureWidget();

  // O idioma vive no `localStorage` do preview; `storage` é o evento que
  // atravessa os dois frames (ver `sidebar-i18n.ts`, que usa a mesma ponte).
  window.addEventListener('storage', (event) => {
    if (event.key !== LOCALE_KEY || open) return;
    ensureWidget();
  });
}
