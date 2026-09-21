/**
 * Transforms do painel Code do Alert.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 */
import {
  asCode,
  attr,
  attrBool,
  attrs,
  indentar,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type AlertVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

export type AlertArgs = {
  variant: AlertVariant;
  role: 'alert' | 'status' | 'note';
  dismissible: boolean;
  /** Texto do título. String vazia mostra a composição sem título. */
  title: string;
  description: string;
  /** Documentados na aba API Reference; o Playground usa os padrões do componente. */
  class?: string;
  dismissLabel?: string;
  onDismiss?: () => void;
};

const TITLE_DEFAULT = 'Atenção';
const DESCRIPTION_DEFAULT = 'Suas alterações serão aplicadas na próxima sessão.';

/**
 * O ícone que acompanha cada variante. `default` não tem cor semântica, então
 * recebe o informativo; `destructive` é a única cujo nome de variante e nome de
 * ícone não coincidem.
 *
 * O MESMO mapa vive na story (`VARIANT_ICON`, em `alert.stories.ts`): as duas
 * pontas escolhem o ícone pela mesma regra de propósito. Com o mapa só de um
 * lado, o painel prometia `CheckCircle2` enquanto a tela mostrava o informativo
 * em toda variante.
 */
const VARIANT_ICON: Record<AlertVariant, string> = {
  default: 'Info',
  destructive: 'AlertCircle',
  success: 'CheckCircle2',
  warning: 'TriangleAlert',
  info: 'Info',
};

function variantIconName(variant: unknown): string {
  return VARIANT_ICON[(asCode(variant) ?? 'default') as AlertVariant] ?? VARIANT_ICON.default;
}

/**
 * Texto vindo de control: string vence, inclusive a VAZIA — é ela que mostra a
 * composição sem título. Qualquer outra coisa (o espião de ação, um objeto) cai
 * no padrão, pela mesma razão que `asCode` existe.
 */
function contentText(value: unknown, defaultValue: string): string {
  return typeof value === 'string' ? value : defaultValue;
}

const IMPORT = `import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'`;

const IMPORT_WITH_ACTION = `import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'`;

/** Import do ícone. Ele é decorativo; quem nomeia o alerta é o título. */
function importIcon(...names: string[]): string {
  return `import { ${names.join(', ')} } from 'lucide-vue-next'`;
}

/**
 * O ícone entra como filho comum: a posição e o tamanho são da folha
 * (`.nds-alert > svg`), não de uma prop nem de classe utilitária.
 */
function icon(name: string): string {
  return `<${name} aria-hidden="true" />`;
}

/** Raiz + filhos, cada filho indentado um nível. */
function alertBlock(parts: Array<string | false | undefined>, children: string[]): string {
  return `<Alert${attrs(...parts)}>\n${indentar(children.join('\n'))}\n</Alert>`;
}

/**
 * Corpo mais comum: ícone, título e texto corrido.
 *
 * O texto corrido NÃO recebe a cor da variante — é regra do design system para
 * contêiner colorido: cor semântica sobre fundo suave raramente alcança os
 * 4.5:1 que texto longo exige. Por isso não há classe de cor aqui.
 */
function body(iconName: string | null, title: string, description: string): string[] {
  const children = [];
  if (iconName) children.push(icon(iconName));
  // `as="h4"` escrito de propósito, mesmo sendo o título o default `h5`: o
  // painel Code ensina que o nível é ESCOLHA de quem compõe a página, e escreve
  // o mesmo que a story renderiza.
  if (title) children.push(`<AlertTitle as="h4">${title}</AlertTitle>`);
  children.push(`<AlertDescription>${description}</AlertDescription>`);
  return children;
}

/**
 * Forma canônica: a raiz e, dentro dela, ícone, título e descrição na ordem em
 * que o leitor de tela os encontra.
 *
 * `role` fica de fora quando é o padrão: `alert` já é live region assertiva, e
 * repeti-lo sugeriria que a semântica precisa ser pedida.
 *
 * Ícone, título e descrição seguem os controls: é a mesma composição que o
 * render do Playground monta, e o painel só ensina o que a tela mostra.
 */
export const alertSource: SourceTransform<AlertArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  const iconName = variantIconName(args.variant);
  const title = contentText(args.title, TITLE_DEFAULT);
  // Sem título, o subcomponente some do import junto com a marcação.
  const importLine = title ? IMPORT : IMPORT.replace(', AlertTitle', '');
  return vueSnippet(
    `${importLine}\n${importIcon(iconName)}`,
    alertBlock(
      [
        attr('variant', args.variant, 'default'),
        attr('role', args.role, 'alert'),
        attrBool('dismissible', args.dismissible, false),
      ],
      body(iconName, title, contentText(args.description, DESCRIPTION_DEFAULT)),
    ),
  );
};

/** Variante padrão: nenhuma cor semântica, para aviso sem urgência. */
export function alertDefaultSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('Info')}`,
    alertBlock([], body('Info', 'Atenção', 'Suas alterações serão aplicadas na próxima sessão.')),
  );
}

/** Variante de erro: a que interrompe uma tarefa em curso. */
export function alertDestructiveSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('AlertCircle')}`,
    alertBlock(
      ['variant="destructive"'],
      body(
        'AlertCircle',
        'Erro ao salvar',
        'Não foi possível salvar. Verifique sua conexão e tente novamente.',
      ),
    ),
  );
}

/** Variante de sucesso: confirma o que acabou de acontecer. */
export function alertSuccessSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('CheckCircle2')}`,
    alertBlock(
      ['variant="success"'],
      body('CheckCircle2', 'Perfil atualizado', 'Suas informações foram salvas com sucesso.'),
    ),
  );
}

/** Variante de atenção: algo ainda vai acontecer e há tempo de agir. */
export function alertWarningSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('TriangleAlert')}`,
    alertBlock(
      ['variant="warning"'],
      body(
        'TriangleAlert',
        'Assinatura expirando',
        'Sua assinatura expira em 3 dias. Renove para evitar interrupções.',
      ),
    ),
  );
}

/** Variante informativa: contexto útil, nunca urgência. */
export function alertInfoSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('Info')}`,
    alertBlock(
      ['variant="info"'],
      body('Info', 'Dica', 'Você pode fixar os filtros mais usados para acessá-los mais rápido.'),
    ),
  );
}

/**
 * Fechável: o botão aparece por uma prop; o rótulo padrão ("Fechar alerta")
 * não é escrito, porque repetir o padrão sugeriria que ele precisa ser pedido.
 *
 * O componente se remove sozinho ao fechar — o evento existe para quem precisa
 * reagir. O `v-if` não é o que remove: é o que impede o alerta de voltar quando
 * o que está em volta renderizar de novo.
 */
export function alertDismissibleSource(): string {
  return vueSnippet(
    `${IMPORT}
${importIcon('Info')}
import { ref } from 'vue'

const noticeVisible = ref(true)`,
    alertBlock(
      ['v-if="noticeVisible"', 'dismissible', '@dismiss="noticeVisible = false"'],
      body('Info', 'Preferências salvas', 'Você pode fechar este aviso quando quiser.'),
    ),
  );
}

/**
 * Fechar pelo teclado não tem nada a configurar: o controle é botão de verdade,
 * então o Tab chega nele e Enter e Espaço o acionam. Escrever um handler de
 * tecla aqui ensinaria um remendo que o componente não precisa. O que muda é o
 * rótulo, que diz O QUE está sendo fechado.
 */
export function alertDismissibleByKeyboardSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('CheckCircle2')}`,
    alertBlock(
      ['variant="success"', 'dismissible', 'dismiss-label="Fechar confirmação"'],
      body('CheckCircle2', 'Perfil atualizado', 'Suas informações foram salvas com sucesso.'),
    ),
  );
}

/**
 * As cinco variantes lado a lado. O que a story mede é CONTRASTE, e por isso o
 * exemplo é só título e texto corrido: nenhum ícone competindo pela atenção,
 * nenhuma cor no texto corrido.
 */
export function alertContrastSource(): string {
  const variants = ['default', 'destructive', 'success', 'warning', 'info'];
  const blocks = variants.map((v) =>
    alertBlock(
      [attr('variant', v, 'default')],
      body(null, `Título ${v}`, `Texto corrido da variante ${v}.`),
    ),
  );
  return vueSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="sm">
${indentar(blocks.join('\n'))}
</div>`,
  );
}

/** Composição completa: ícone, título e descrição. */
export function alertCompleteSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('Info')}`,
    alertBlock([], body('Info', 'Atenção', 'Suas alterações serão aplicadas na próxima sessão.')),
  );
}

/**
 * Sem título: a descrição sozinha basta para uma frase curta. Não há prop a
 * desligar — o título simplesmente não é escrito.
 */
export function alertNoTitleSource(): string {
  return vueSnippet(
    `${IMPORT.replace(', AlertTitle', '')}\n${importIcon('Info')}`,
    alertBlock([], body('Info', '', 'Suas alterações serão aplicadas na próxima sessão.')),
  );
}

/** Sem ícone: o alerta passa a coluna única, e o título assume a identificação. */
export function alertNoIconSource(): string {
  return vueSnippet(
    IMPORT,
    alertBlock([], body(null, 'Atenção', 'Suas alterações serão aplicadas na próxima sessão.')),
  );
}

/**
 * O anúncio é decisão de conteúdo, não de estilo.
 *
 * `note` não é live region: é o valor de conteúdo estático, já presente quando
 * a página carrega. O padrão continua sendo `alert`, assertivo, para a mensagem
 * que SURGE — e é o contraste entre os dois que o exemplo mostra.
 */
export function alertNoAnnouncementSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('AlertCircle', 'Info')}`,
    `<div class="nds-stack" data-spacing="md">
${indentar(
  alertBlock(
    ['role="note"'],
    body(
      'Info',
      'Nota de implementação',
      'Conteúdo estático: o leitor de tela lê na ordem do documento, sem interromper.',
    ),
  ),
)}
${indentar(
  alertBlock(
    ['variant="destructive"'],
    body(
      'AlertCircle',
      'Falha no envio',
      'Mensagem urgente surgida em tempo de execução: anúncio imediato.',
    ),
  ),
)}
</div>`,
  );
}

/**
 * Inserção em tempo de execução: o alerta só monta depois de uma ação, e o
 * anúncio vem do papel na PRÓPRIA raiz. Nenhum contêiner `aria-live` em volta —
 * ele aninharia duas regiões vivas, e o leitor anunciaria duas vezes ou nenhuma.
 *
 * O contêiner e a linha do botão fazem parte do exemplo: é o `nds-stack` que
 * separa o gatilho do alerta que surge, e é a linha própria que impede o stack
 * de esticar o botão na largura toda. Sem os dois, o painel publicava duas
 * peças soltas e quem copiasse não teria o espaçamento da tela.
 */
export function alertDynamicInsertionSource(): string {
  return vueSnippet(
    `${IMPORT}
import { Button } from '@/components/ui/button'
${importIcon('CheckCircle2')}
import { ref } from 'vue'

const reportReady = ref(false)`,
    `<div class="nds-stack" data-spacing="sm">
  <div>
    <Button size="sm" @click="reportReady = true">Gerar relatório</Button>
  </div>
${indentar(
  alertBlock(
    ['v-if="reportReady"'],
    body('CheckCircle2', 'Operação concluída', 'O relatório foi gerado com sucesso.'),
  ),
)}
</div>`,
  );
}

/** Ícone na composição: filho comum, decorativo, posicionado pelo componente. */
export function alertWithIconSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('Info')}`,
    alertBlock([], body('Info', 'Informação', 'Ícone SVG posicionado automaticamente.')),
  );
}

/**
 * Ação dentro do alerta: ela vive num slot próprio, que é quem a posiciona.
 * O botão é `sm` e preenchido — sobre a lavagem colorida, é o que se separa do
 * fundo.
 */
export function alertWithActionSource(): string {
  return vueSnippet(
    `${IMPORT_WITH_ACTION}
import { Button } from '@/components/ui/button'
${importIcon('Info')}`,
    alertBlock(
      [],
      [
        ...body('Info', 'Atualização disponível', 'Uma nova versão está pronta para instalação.'),
        `<AlertAction>
  <Button size="sm" variant="default">Atualizar</Button>
</AlertAction>`,
      ],
    ),
  );
}

/**
 * Ação e botão de fechar no mesmo alerta. Não há prop de layout: a ação ocupa a
 * própria coluna do grid, e o X fica na calha dele, à direita.
 */
export function alertWithActionAndDismissSource(): string {
  return vueSnippet(
    `${IMPORT_WITH_ACTION}
import { Button } from '@/components/ui/button'
${importIcon('Info')}`,
    alertBlock(
      ['dismissible'],
      [
        ...body('Info', 'Sessão expira em 5 minutos', 'Salve seu trabalho para não perder as alterações.'),
        `<AlertAction>
  <Button size="sm" variant="default">Salvar agora</Button>
</AlertAction>`,
      ],
    ),
  );
}

/**
 * Classe do consumidor: ela SOMA às do design system em qualquer subcomponente,
 * nunca substitui. É o que permite ajustar o encaixe sem reescrever o alerta.
 */
export function alertAdditionalClassSource(): string {
  return vueSnippet(
    `${IMPORT_WITH_ACTION}
import { Button } from '@/components/ui/button'
${importIcon('Info')}`,
    `<Alert class="nds-w-full">
  ${icon('Info')}
  <AlertTitle as="h4" class="nds-w-full">Classe adicional</AlertTitle>
  <AlertDescription class="nds-w-full">A classe do consumidor convive com as do design system.</AlertDescription>
  <AlertAction class="nds-w-auto">
    <Button size="sm" variant="default">Ação</Button>
  </AlertAction>
</Alert>`,
  );
}

/** Layout de coluna única: sem ícone, título e texto ocupam a linha inteira. */
export function alertLayoutNoIconSource(): string {
  return vueSnippet(
    IMPORT,
    alertBlock([], body(null, 'Sem ícone', 'Alert sem ícone mantém layout de coluna única.')),
  );
}
