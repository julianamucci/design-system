/**
 * Transforms do painel Code do Sonner.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta é andaime e não entra no snippet: o quadro
 * com `contain: layout`, `position: relative` e `minHeight` existe só porque a
 * região é POSICIONADA e precisa de um contêiner contra o qual se fixar dentro
 * do Storybook; os prazos de 300ms e 400ms existem para a suíte não depender do
 * relógio real; o `Infinity` das stories fotografadas existe para o axe e o
 * Chromatic medirem sempre o mesmo estado, e não porque a notificação seja
 * persistente. Nada disso é do componente.
 *
 * A decisão de composição é a que o componente realmente exige, e são DUAS
 * peças em lugares diferentes: `<Toaster />` uma vez na raiz da aplicação, e a
 * chamada `toast(...)` lá onde a operação termina. O botão que as stories
 * montam para o Storybook conseguir disparar a notificação só entra no snippet
 * quando ele é o gatilho honesto do exemplo — um botão "Disparar notificação"
 * não existe em produto nenhum.
 *
 * `toast` vem do pacote `sonner`, não de `@/components/ui/sonner`: o arquivo do
 * design system exporta a REGIÃO (com os ícones, os rótulos em pt-BR e os
 * tokens do tema já aplicados), e nunca reexportou a função da fila.
 */
import {
  attrs,
  filhoTexto,
  jsxSnippet,
  propBool,
  propNumero,
  propOpcao,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

export type SonnerArgs = {
  type: 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  description: string;
  actionLabel: string;
  position:
    | 'top-right'
    | 'top-center'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-center'
    | 'bottom-left';
  richColors: boolean;
  closeButton: boolean;
  duration: number;
};

const TIPOS = ['default', 'success', 'error', 'warning', 'info', 'loading'] as const;

const POSICOES = [
  'top-right',
  'top-center',
  'top-left',
  'bottom-right',
  'bottom-center',
  'bottom-left',
] as const;

/** Canto e prazo que a lib já usa sozinha — repeti-los ensinaria ruído. */
const POSICAO_PADRAO = 'bottom-right';
const PRAZO_PADRAO = 4000;

const IMPORT_TOAST = 'import { toast } from "sonner";';
const IMPORT_TOASTER = 'import { Toaster } from "@/components/ui/sonner";';
const IMPORT_BOTAO = 'import { Button } from "@/components/ui/button";';

const IMPORTS_BASE = `${IMPORT_TOAST}
${IMPORT_TOASTER}`;

const IMPORTS_COM_BOTAO = `${IMPORT_TOAST}
${IMPORT_BOTAO}
${IMPORT_TOASTER}`;

/**
 * A região que desenha a fila.
 *
 * Vai UMA VEZ, na raiz da aplicação — uma por tela faria duas filas disputando
 * o mesmo canto, e a segunda herdaria um nome acessível repetido. Por isso o
 * comentário viaja junto com a marcação: é a única parte do uso que não se
 * escreve onde a notificação nasce.
 */
function regiao(atributos = ''): string {
  return `// A região que desenha a fila. Vai UMA VEZ, na raiz da aplicação.
<Toaster${atributos} />`;
}

/** Chamada da fila: `toast()` para a neutra, `toast.<tipo>()` para as demais. */
function chamada(tipo: string, titulo: string, opcoes: string[] = []): string {
  const alvo = tipo === 'default' ? 'toast' : `toast.${tipo}`;
  if (!opcoes.length) return `${alvo}("${titulo}");`;
  return `${alvo}("${titulo}", {
${opcoes.map((opcao) => `  ${opcao}`).join('\n')}
});`;
}

/** Região + comentário + chamada, que é a forma de todo exemplo deste arquivo. */
function usoDaFila(atributosDaRegiao: string, comentario: string, corpo: string): string {
  return `${regiao(atributosDaRegiao)}

// ${comentario}
${corpo}`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground: os que descrevem a REGIÃO viram atributos do `Toaster`, e os
 * que descrevem a MENSAGEM viram argumentos da chamada. É a divisão que o
 * componente impõe, e o painel escondia ao imprimir só a árvore do `render`.
 *
 * Aqui o botão entra: o gatilho honesto de uma notificação é a ação que ela
 * relata, e o Playground existe justamente para disparar uma.
 *
 * Nada de `onClick` do espião é interpolado: o Storybook o entrega como função,
 * e o corpo do mock apareceria no painel como se fosse código do design system.
 */
export const sonnerSource: SourceTransform<SonnerArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};

  const atributosRegiao = attrs(
    propOpcao('position', args.position, POSICOES, POSICAO_PADRAO),
    propBool('richColors', args.richColors),
    propBool('closeButton', args.closeButton),
    typeof args.duration === 'number' && args.duration !== PRAZO_PADRAO
      ? propNumero('duration', args.duration)
      : undefined,
  );

  const tipo =
    typeof args.type === 'string' && (TIPOS as readonly string[]).includes(args.type)
      ? args.type
      : 'success';
  const titulo = filhoTexto(args.title, 'Alterações salvas.');

  const opcoes: string[] = [];
  const descricao = texto(args.description);
  if (descricao) opcoes.push(`description: "${descricao}",`);
  const rotuloAcao = texto(args.actionLabel);
  if (rotuloAcao) {
    opcoes.push(
      `action: { label: "${rotuloAcao}", onClick: () => toast.success("Feito.") },`,
    );
  }

  const disparo = chamada(tipo, titulo, opcoes);
  const corpoDoBotao = opcoes.length
    ? `<Button
  variant="outline"
  onClick={() => {
${disparo
  .split('\n')
  .map((linha) => `    ${linha}`)
  .join('\n')}
  }}
>
  Salvar alterações
</Button>`
    : `<Button variant="outline" onClick={() => ${disparo.replace(/;$/, '')}}>
  Salvar alterações
</Button>`;

  return jsxSnippet(
    IMPORTS_COM_BOTAO,
    usoDaFila(
      atributosRegiao,
      'E a notificação nasce no evento que termina a operação.',
      corpoDoBotao,
    ),
  );
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
//
// As seis stories de tipo montam só a região e disparam a notificação na `play`.
// Nenhum arg descreve o tipo nesse arquivo, então cada uma precisa do próprio
// snippet — sem override, todas imprimiriam a mesma notificação de êxito.

const REGIAO_TIPOS = ' position="top-right" richColors';

/** Notificação neutra: sem tipo semântico, e por isso sem ícone. */
export function sonnerNeutroSource(): string {
  return jsxSnippet(
    IMPORTS_BASE,
    usoDaFila(
      REGIAO_TIPOS,
      'Sem tipo semântico: nada aconteceu de certo nem de errado.',
      chamada('default', 'Código copiado.'),
    ),
  );
}

/** Êxito. `richColors` é o que leva a cor semântica do tema até a caixa. */
export function sonnerSucessoSource(): string {
  return jsxSnippet(
    IMPORTS_BASE,
    usoDaFila(
      REGIAO_TIPOS,
      'Confirmação de ação concluída.',
      chamada('success', 'Alterações salvas.'),
    ),
  );
}

/**
 * Falha. O texto diz a causa E o caminho de saída — a cor sozinha não chega a
 * quem não distingue vermelho de verde (WCAG 1.4.1).
 */
export function sonnerErroSource(): string {
  return jsxSnippet(
    IMPORTS_BASE,
    usoDaFila(
      REGIAO_TIPOS,
      'Falha da operação: a frase diz a causa e o caminho de saída.',
      chamada('error', 'Não foi possível salvar. Tente novamente.'),
    ),
  );
}

/**
 * Aviso não crítico. Se a mensagem precisa continuar visível enquanto a pessoa
 * age, o componente certo é o Alert — este some sozinho.
 */
export function sonnerAvisoSource(): string {
  return jsxSnippet(
    IMPORTS_BASE,
    usoDaFila(
      REGIAO_TIPOS,
      'Aviso não crítico, que não exige decisão para sair da tela.',
      chamada('warning', 'Sua sessão expira em 5 minutos.'),
    ),
  );
}

/** Informação contextual — novidade, não resultado. */
export function sonnerInfoSource(): string {
  return jsxSnippet(
    IMPORTS_BASE,
    usoDaFila(
      REGIAO_TIPOS,
      'Informação contextual ou novidade.',
      chamada('info', 'Nova versão disponível.'),
    ),
  );
}

/**
 * Operação em curso. Nasce SEM prazo de propósito: quem a encerra é o fim da
 * operação. Fechá-la sozinha deixaria a pessoa sem saber se terminou — e é por
 * isso que na prática este tipo aparece por `toast.promise`.
 */
export function sonnerCarregandoSource(): string {
  return jsxSnippet(
    IMPORTS_BASE,
    usoDaFila(
      REGIAO_TIPOS,
      'Operação em curso: sem prazo, quem a encerra é o fim da operação.',
      chamada('loading', 'Enviando arquivo...'),
    ),
  );
}

// ─── Estados ──────────────────────────────────────────────────────────────────

/**
 * Prazo. Ele vive na REGIÃO, e não em cada chamada: uma aplicação com dois
 * tempos de leitura diferentes ensina a pessoa a não confiar em nenhum. O valor
 * aparece por extenso aqui porque o prazo é o assunto da story.
 */
export function sonnerPrazoSource(): string {
  return jsxSnippet(
    IMPORTS_BASE,
    usoDaFila(
      ' position="top-right" richColors duration={4000}',
      'A chamada não repete o prazo: quem manda é o da região.',
      chamada('error', 'Não foi possível salvar. Tente novamente.'),
    ),
  );
}

/**
 * Pausa na leitura. Não há prop a escrever: o relógio congela sozinho enquanto
 * o ponteiro estiver dentro da região. O snippet é o mesmo uso de sempre, e é
 * essa a informação — o tempo de leitura não é o mesmo para todo mundo, e o
 * componente já trata disso (WCAG 2.2.1).
 */
export function sonnerPausaSource(): string {
  return jsxSnippet(
    IMPORTS_BASE,
    usoDaFila(
      ' position="top-right" richColors duration={4000}',
      'Com o ponteiro dentro da região, o prazo acima para de correr.',
      chamada('info', 'Nova versão disponível.'),
    ),
  );
}

/**
 * Fila com várias notificações. `expand` abre a pilha: sem ele a mais nova
 * encobre as anteriores, e uma mensagem ainda não lida sai de cena sem ter sido
 * lida. Cada chamada é uma notificação — nada precisa ser agrupado à mão.
 */
export function sonnerEmpilhadoSource(): string {
  return jsxSnippet(
    IMPORTS_BASE,
    usoDaFila(
      ' position="top-right" richColors expand',
      'Cada chamada entra na fila; a pilha aberta mantém todas legíveis.',
      `${chamada('success', 'Alterações salvas.')}
${chamada('warning', 'Sua sessão expira em 5 minutos.')}
${chamada('info', 'Nova versão disponível.')}`,
    ),
  );
}

/**
 * Canto da tela. É escolha do projeto e vale para a aplicação inteira: como a
 * região é montada uma vez só, a posição se decide uma vez só — misturar cantos
 * faria a pessoa procurar a notificação a cada vez.
 */
export function sonnerRodapeCentradoSource(): string {
  return jsxSnippet(
    IMPORTS_BASE,
    usoDaFila(
      ' position="bottom-center" richColors',
      'A chamada não muda: o canto é decisão da região, não da mensagem.',
      chamada('success', 'Alterações salvas.'),
    ),
  );
}

/**
 * Sem região montada — a AUSÊNCIA é o assunto, então o `Toaster` não aparece.
 *
 * A fila existe independentemente de quem a desenha: uma tela que ainda não
 * montou a região não desenha nada e também não derruba o fluxo que chamou.
 */
export function sonnerSemRegiaoSource(): string {
  return jsxSnippet(
    IMPORT_TOAST,
    `// Sem o Toaster montado na raiz, a chamada não desenha nada — e também não
// quebra: a fila existe independentemente de quem a desenha.
${chamada('success', 'Alterações salvas.')}`,
  );
}

/**
 * Tema escuro. `theme` só entra quando o projeto força um tema fixo: sem a
 * prop, a região acompanha o tema do documento, que é o que se quer em quase
 * todo caso.
 */
export function sonnerTemaEscuroSource(): string {
  return jsxSnippet(
    IMPORTS_BASE,
    usoDaFila(
      ' position="top-right" richColors expand theme="dark"',
      'Sem a prop theme, a região acompanha sozinha o tema do documento.',
      `${chamada('success', 'Alterações salvas.')}
${chamada('error', 'Não foi possível salvar. Tente novamente.')}
${chamada('info', 'Nova versão disponível.')}`,
    ),
  );
}

// ─── Composições ──────────────────────────────────────────────────────────────

/**
 * Título mais descrição, para quando o título sozinho não orienta. A descrição
 * é uma frase completa: se precisar de três linhas, o lugar da mensagem não é
 * uma notificação.
 */
export function sonnerComDescricaoSource(): string {
  return jsxSnippet(
    IMPORTS_BASE,
    usoDaFila(
      REGIAO_TIPOS,
      'A descrição complementa o título, e vai na mesma chamada.',
      chamada('success', 'Preferências atualizadas.', [
        'description: "Suas configurações entrarão em vigor na próxima sessão.",',
      ]),
    ),
  );
}

/**
 * Ação embutida, para operação reversível.
 *
 * Aqui o botão entra no snippet: excluir é o gatilho honesto de "Item
 * excluído.". A ação oferecida dentro da notificação precisa existir em outro
 * lugar da interface também — a notificação some, e o que só existia nela some
 * junto.
 */
export function sonnerComAcaoSource(): string {
  return jsxSnippet(
    IMPORTS_COM_BOTAO,
    usoDaFila(
      REGIAO_TIPOS,
      'Desfazer também precisa existir fora daqui: a notificação some.',
      `<Button
  variant="outline"
  onClick={() =>
    toast("Item excluído.", {
      action: {
        label: "Desfazer",
        onClick: () => toast.success("Exclusão desfeita."),
      },
    })
  }
>
  Excluir item
</Button>`,
    ),
  );
}

/**
 * Ciclo de uma promessa: uma notificação para a operação inteira.
 *
 * Nasce em carregamento e vira êxito ou falha no MESMO nó do DOM — trocar o nó
 * faria o leitor de tela anunciar duas notificações para um evento só. O mesmo
 * snippet serve aos dois desfechos: o que muda é a promessa resolver ou
 * rejeitar, e não uma linha do código.
 */
export function sonnerPromessaSource(): string {
  return jsxSnippet(
    IMPORTS_BASE,
    `${regiao(REGIAO_TIPOS)}

async function enviarArquivo(dados: FormData) {
  const resposta = await fetch("/api/arquivos", { method: "POST", body: dados });
  if (!resposta.ok) throw new Error("falha no envio");
}

// Uma notificação para a operação inteira: o desfecho troca o texto e o tipo
// no mesmo nó, sem piscar duas caixas.
function enviar(dados: FormData) {
  toast.promise(enviarArquivo(dados), {
    loading: "Enviando arquivo...",
    success: "Arquivo enviado com sucesso.",
    error: "Erro ao enviar. Tente novamente.",
  });
}`,
  );
}

/**
 * Prazo infinito, reservado a falha crítica que exige decisão.
 *
 * Sempre com `closeButton`: uma notificação que não sai sozinha e não pode ser
 * fechada deixa de ser aviso e vira obstáculo. Os dois andam juntos.
 */
export function sonnerPersistenteSource(): string {
  return jsxSnippet(
    IMPORTS_BASE,
    usoDaFila(
      ' position="top-right" richColors closeButton',
      'Prazo infinito: fechar à mão passa a ser o único caminho de saída.',
      chamada('error', 'Falha crítica no servidor.', [
        'duration: Number.POSITIVE_INFINITY,',
      ]),
    ),
  );
}
