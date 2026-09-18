/**
 * Transform do painel Code do Sonner.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * O que o snippet ensina: o `<div ndsToaster>` entra UMA VEZ, no root da
 * aplicação, e `toast()` é chamado de qualquer lugar — sem referência ao
 * Toaster e sem injeção. É a peça em que a story mais engana: o botão que
 * dispara a demonstração existe só para haver o que clicar, e copiá-lo ensinaria
 * a montar o toaster junto do gatilho.
 *
 * **Por que há um construtor por story, e não só o do Playground.** Até
 * 2026-09-14 as outras 17 stories publicavam o TEMPLATE DA STORY no painel — o
 * `[duration]="1200"` que existe para encurtar o relógio da suíte, o andaime que
 * prende a região ao quadro, os bindings ligados aos controls. O painel é a
 * única parte da página feita para ser COPIADA, e o que estava lá não se copia.
 * O portão é `story_file_sem_transform`, em `scripts/audit.mjs`.
 */
import { TEXTS } from './sonner.fixtures';
import type { ToastPosition, ToastType } from './sonner';

export type SonnerArgs = {
  type: ToastType;
  title: string;
  description: string;
  actionLabel: string;
  position: ToastPosition;
  richColors: boolean;
  closeButton: boolean;
  duration: number;
};

/** Padrões do componente. Repetir valor padrão no snippet ensina ruído. */
const DEFAULT_POSITION: ToastPosition = 'top-right';
const DEFAULT_DURATION = 4000;

/**
 * Nome acessível que a região da DEMONSTRAÇÃO carrega.
 *
 * O padrão do `input()` é "Notificações", e este não é o padrão: a página do
 * Playground tem outras regiões, então a dela se nomeia para ser distinguível —
 * e a `play` afirma esse nome. Está no snippet porque é prop real da região que
 * a story monta; omiti-lo fazia o painel publicar uma região que a story não
 * tem.
 */
const DEMO_REGION_LABEL = 'Notificações da demonstração';

type RegionOptions = {
  position?: ToastPosition;
  richColors?: boolean;
  closeButton?: boolean;
  duration?: number;
  label?: string;
};

/**
 * A região, com só o que difere do padrão declarado nos `input()`.
 *
 * `duration` NÃO entra por padrão nas stories que encurtam o relógio: aquele
 * valor é da suíte, não do design system, e ensiná-lo faria quem copia montar
 * uma aplicação cujas notificações somem em 1,2s.
 */
function regionTag(o: RegionOptions = {}): string {
  const attrs = [
    o.position && o.position !== DEFAULT_POSITION ? `position="${o.position}"` : '',
    o.richColors ? '[richColors]="true"' : '',
    o.closeButton ? '[closeButton]="true"' : '',
    o.duration !== undefined && o.duration !== DEFAULT_DURATION
      ? `[duration]="${o.duration}"`
      : '',
    // Atributo estático, e não binding: o rótulo é um `input()` de string.
    o.label ? `label="${o.label}"` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `<div ndsToaster${attrs ? ` ${attrs}` : ''}></div>`;
}

/** Aspas simples dentro do literal se escapam, em vez de encerrar a string. */
function text(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/**
 * O molde: import, `@Component` com a região no template, e a classe com os
 * métodos que disparam.
 *
 * Quando não há região, não há `@Component` nenhum — a lição daquela story é
 * justamente que `toast()` vive sem quem o desenhe.
 */
function example(o: { region?: string | null; body: string[]; nota?: string[] }): string {
  const body = o.body.map((line) => (line ? `  ${line}` : '')).join('\n');

  if (!o.region) {
    const nota = (o.nota ?? []).map((line) => `// ${line}`).join('\n');
    return `import { toast } from '@/components/ui/sonner';

${nota ? `${nota}\n` : ''}export class Exemplo {
${body}
}`;
  }

  const nota = (o.nota ?? [
    'O Toaster entra UMA VEZ, no root da aplicação. `toast()` é chamado de',
    'qualquer lugar — não precisa de referência ao Toaster nem de injeção.',
  ])
    .map((line) => `  // ${line}`)
    .join('\n');

  return `import { NdsToaster, toast } from '@/components/ui/sonner';

@Component({
  imports: [NdsToaster],
${nota}
  template: \`
    ${o.region}
  \`,
})
export class Exemplo {
${body}
}`;
}

/** `toast('…')` / `toast.success('…')` — o tipo neutro é a própria função. */
function queueCall(type: ToastType, message: string, options: string[] = []): string {
  const queue = type === 'default' ? 'toast' : `toast.${type}`;
  if (options.length === 0) return `${queue}(${text(message)});`;
  return `${queue}(${text(message)}, {\n${options.map((l) => `      ${l}`).join('\n')}\n    });`;
}

// ─── Playground ───────────────────────────────────────────────────────────────

/**
 * O painel Code imprime o `template` da story literalmente — com o botão que só
 * existe para disparar a demonstração e com os bindings ligados aos controls. É
 * o que a pessoa copia, e não é o que ela deve escrever. Ver a nota em
 * `separator.source.ts`.
 */
export function sonnerPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<SonnerArgs> } = {},
): string {
  const {
    type = 'success',
    title = TEXTS.success,
    description = '',
    actionLabel = '',
    position = DEFAULT_POSITION,
    richColors = true,
    closeButton = false,
    // O control de prazo também descreve a REGIÃO: sem ler este arg, mexer no
    // painel Controls não mudava uma vírgula do painel Code.
    duration = DEFAULT_DURATION,
  } = ctx.args ?? {};

  const options = [
    description ? `description: ${text(description)},` : '',
    actionLabel
      ? `action: { label: ${text(actionLabel)}, onClick: () => this.desfazer() },`
      : '',
  ].filter(Boolean);

  return example({
    region: regionTag({ position, richColors, closeButton, duration, label: DEMO_REGION_LABEL }),
    body: [
      'confirmar(): void {',
      `    ${queueCall(type, title, options)}`,
      '}',
      ...(actionLabel
        ? [
            '',
            '// A ação some junto com a notificação: o que ela oferece precisa',
            '// existir em outro lugar da interface também.',
            'desfazer(): void {',
            `    toast.success(${text('Item restaurado.')});`,
            '}',
          ]
        : []),
    ],
  });
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

function typeSource(type: ToastType, message: string, nota?: string[]) {
  return (): string =>
    example({
      region: regionTag({ richColors: true }),
      nota,
      body: ['notificar(): void {', `    ${queueCall(type, message)}`, '}'],
    });
}

export const sonnerNeutralSource = typeSource('default', TEXTS.default, [
  'Sem tipo semântico a fila é a própria função `toast()` — não existe',
  '`toast.default()`. A notificação sai sem ícone e com as cores base do tema.',
]);

export const sonnerSuccessSource = typeSource('success', TEXTS.success);

export const sonnerErrorSource = typeSource('error', TEXTS.error, [
  'O texto diz a causa e o caminho de saída: quem não distingue vermelho de',
  'verde precisa da frase, e não só da cor (WCAG 1.4.1).',
]);

export const sonnerWarningSource = typeSource('warning', TEXTS.warning, [
  'Aviso não crítico. Se a mensagem precisa continuar visível enquanto a pessoa',
  'age, o componente certo é o Alert.',
]);

export const sonnerInfoSource = typeSource('info', TEXTS.info);

export const sonnerLoadingSource = typeSource('loading', TEXTS.loading, [
  'O carregamento nasce SEM prazo — quem o encerra é a operação que o originou.',
  'Nada de `duration` aqui: fechá-lo sozinho deixaria a pessoa sem saber se a',
  'operação terminou. Na prática, use `toast.promise`.',
]);

// ─── Estados ──────────────────────────────────────────────────────────────────

export function sonnerAutoDismissSource(): string {
  return example({
    region: regionTag({ richColors: true }),
    nota: [
      'O prazo é da REGIÃO e vale para toda notificação disparada enquanto ela',
      'estiver montada — 4000ms por padrão, e por isso ausente daqui. A story',
      'encurta esse número para não depender do relógio real; uma aplicação não.',
    ],
    body: ['avisarFalha(): void {', `    ${queueCall('error', TEXTS.error)}`, '}'],
  });
}

export function sonnerPauseOnHoverSource(): string {
  return example({
    region: regionTag({ richColors: true }),
    nota: [
      'A pausa no ponteiro e no foco não se liga: é comportamento da região, e',
      'vale para a pilha inteira (WCAG 2.2.1). Não há nada a escrever — o que',
      'existe é a garantia de que o tempo de leitura não é o mesmo para todos.',
    ],
    body: ['informar(): void {', `    ${queueCall('info', TEXTS.info)}`, '}'],
  });
}

export function sonnerStackSource(): string {
  return example({
    region: regionTag({ richColors: true }),
    nota: [
      'Uma chamada por notificação. A pilha é uma coluna com espaço entre os',
      'itens: a nova entra ao lado, nunca por cima.',
    ],
    body: [
      'notificarTudo(): void {',
      `    ${queueCall('success', TEXTS.success)}`,
      `    ${queueCall('warning', TEXTS.warning)}`,
      `    ${queueCall('info', TEXTS.info)}`,
      '}',
    ],
  });
}

export function sonnerPositionSource(): string {
  return example({
    region: regionTag({ position: 'bottom-center', richColors: true }),
    nota: [
      'A posição é da REGIÃO, e não da notificação: ela vale para a aplicação',
      'inteira. Misturar cantos faria a pessoa procurar o aviso a cada vez.',
    ],
    body: ['confirmar(): void {', `    ${queueCall('success', TEXTS.success)}`, '}'],
  });
}

export function sonnerNoRegionSource(): string {
  return example({
    region: null,
    nota: [
      'Sem Toaster montado no root, `toast()` não desenha nada — e também não',
      'quebra. A fila existe independentemente de quem a desenha, então uma tela',
      'que ainda não montou a região não derruba o fluxo que a chamou.',
    ],
    body: ['salvar(): void {', `    ${queueCall('success', TEXTS.success)}`, '}'],
  });
}

export function sonnerDarkThemeSource(): string {
  return example({
    region: regionTag({ richColors: true }),
    nota: [
      'Não há prop de tema: quem recolore é a cascata dos tokens. Trocar a',
      'classe do documento basta, e os mesmos nós mudam de cor sem remontar.',
    ],
    body: [
      'demonstrarTipos(): void {',
      `    ${queueCall('default', TEXTS.default)}`,
      `    ${queueCall('success', TEXTS.success)}`,
      `    ${queueCall('error', TEXTS.error)}`,
      `    ${queueCall('warning', TEXTS.warning)}`,
      `    ${queueCall('info', TEXTS.info)}`,
      '}',
    ],
  });
}

// ─── Composições ──────────────────────────────────────────────────────────────

export function sonnerWithDescriptionSource(): string {
  return example({
    region: regionTag({ richColors: true }),
    nota: [
      'Título mais descrição, quando o título sozinho não orienta. Os dois vão',
      'na MESMA chamada: é isso que faz o leitor de tela anunciar uma',
      'notificação, e não dois avisos.',
    ],
    body: [
      'confirmar(): void {',
      `    ${queueCall('success', TEXTS.withDescription, [
        `description: ${text(TEXTS.withDescriptionDetail)},`,
      ])}`,
      '}',
    ],
  });
}

export function sonnerWithActionSource(): string {
  return example({
    region: regionTag({ richColors: true }),
    nota: [
      'A ação embutida é um `<button>` de verdade, alcançável por Tab enquanto a',
      'notificação está na tela. Acioná-la fecha a notificação na hora — ela',
      'existia para oferecer a ação.',
    ],
    body: [
      'excluir(): void {',
      `    ${queueCall('default', TEXTS.withAction, [
        `action: { label: ${text(TEXTS.withActionLabel)}, onClick: () => this.desfazer() },`,
      ])}`,
      '}',
      '',
      '// A notificação some, e o que só existia nela some junto: desfazer',
      '// precisa existir em outro lugar da interface também.',
      'desfazer(): void {',
      `    toast.success(${text('Item restaurado.')});`,
      '}',
    ],
  });
}

export function sonnerPromiseSource(): string {
  return example({
    region: regionTag({ richColors: true }),
    nota: [
      'UMA notificação para a operação inteira: nasce em carregamento e vira',
      'êxito ou falha no MESMO nó do DOM. Trocar o nó faria o leitor de tela',
      'anunciar duas notificações para um evento só.',
    ],
    body: [
      'enviar(): void {',
      '    toast.promise(this.enviarArquivo(), {',
      `      loading: ${text(TEXTS.promiseLoading)},`,
      `      success: ${text(TEXTS.promiseSuccess)},`,
      `      error: ${text(TEXTS.promiseError)},`,
      '    });',
      '}',
      '',
      '// `promise` não devolve nada e não repropaga a rejeição: quem chamou já',
      '// tem a promessa original para tratar o erro.',
      'enviarArquivo(): Promise<void> {',
      "    return fetch('/api/arquivos').then(() => undefined);",
      '}',
    ],
  });
}

export function sonnerPersistentSource(): string {
  return example({
    // O fechar vem da OPÇÃO da chamada, e não da região — é o que a story faz.
    // Ligá-lo nos dois lugares ensinava botão de fechar em toda notificação da
    // aplicação para conseguir um em UMA.
    region: regionTag({ richColors: true }),
    nota: [
      'Prazo infinito, reservado a falha crítica que exige decisão — e SEMPRE',
      'com botão de fechar: uma notificação que não sai sozinha e não pode ser',
      'fechada vira obstáculo. Aqui os dois vão na MESMA chamada, porque é só',
      'esta notificação que precisa deles.',
    ],
    body: [
      'avisarFalhaCritica(): void {',
      `    ${queueCall('error', TEXTS.persistent, [
        'duration: Number.POSITIVE_INFINITY,',
        'closeButton: true,',
      ])}`,
      '}',
    ],
  });
}
