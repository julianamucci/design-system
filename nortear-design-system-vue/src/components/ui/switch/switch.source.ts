/**
 * Transforms do painel Code do Switch.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * O Switch nunca aparece sozinho: sem rótulo associado ele é um controle sem
 * nome acessível. Por isso todo snippet daqui monta o PAR — o controle e o
 * `Label` que o nomeia pelo `id`.
 */
import { attr, attrBool, attrs, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type SwitchArgs = {
  defaultValue: boolean;
  disabled: boolean;
  required: boolean;
  name: string;
  size: 'default' | 'sm';
};

const IMPORT_PAIR = `import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'`;

/**
 * Par em linha: o controle e, à direita, o rótulo que o nomeia. O `for` do
 * rótulo casa com o `id` do controle — é o que dá nome acessível ao switch.
 */
function linePair(id: string, label: string, extra = ''): string {
  return `<div class="nds-cluster" data-spacing="sm">
  <Switch id="${id}"${attrs(extra)} />
  <Label for="${id}">${label}</Label>
</div>`;
}

/**
 * Linha de painel de configurações: rótulo e texto de apoio à esquerda,
 * controle à direita. A descrição fica FORA do rótulo — se entrasse nele, o
 * leitor de tela anunciaria o parágrafo inteiro como nome do controle.
 */
function panelLine(options: {
  id: string;
  label: string;
  descricao: string;
  attrs?: string;
  border?: string;
  width?: string;
}): string {
  const { id, label, descricao, attrs: extra = '', border = 'nds-border-default', width } = options;
  const classes = ['nds-cluster', width, 'nds-rounded-lg', border, 'nds-p-4']
    .filter(Boolean)
    .join(' ');
  return `<div class="${classes}" data-align="center" data-justify="between">
  <div class="nds-stack nds-pr-4" data-spacing="xs">
    <Label for="${id}">${label}</Label>
    <p class="nds-text-body">${descricao}</p>
  </div>
  <Switch id="${id}"${attrs(extra)} />
</div>`;
}

/**
 * Forma canônica: controle mais rótulo, com os controles do painel refletidos
 * nos atributos que diferem do padrão.
 *
 * `defaultValue` é prop de MONTAGEM — quem precisa dirigir o estado depois da
 * montagem usa `v-model`, e é por isso que `modelValue` não entra aqui.
 */
export const switchSource: SourceTransform<SwitchArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return vueSnippet(
    IMPORT_PAIR,
    linePair(
      'notificacoes',
      'Receber notificações',
      attrs(
        attr('name', args.name),
        attr('size', args.size, 'default'),
        attrBool('default-value', args.defaultValue, false),
        attrBool('required', args.required, false),
        attrBool('disabled', args.disabled, false),
      ).trim(),
    ),
  );
};

/** Variante padrão: o par mínimo, sem nenhum atributo além do vínculo do id. */
export function switchDefaultSource(): string {
  return vueSnippet(IMPORT_PAIR, linePair('notificacoes', 'Receber notificações'));
}

/**
 * Com texto de apoio: o par vira linha de painel, e a descrição ganha um
 * parágrafo próprio ao lado do rótulo.
 */
export function switchWithDescriptionSource(): string {
  return vueSnippet(
    IMPORT_PAIR,
    panelLine({
      id: 'marketing',
      label: 'Emails de marketing',
      descricao: 'Receba novidades e promoções da plataforma.',
      width: 'nds-w-sm',
    }),
  );
}

/**
 * Degrau compacto ao lado do padrão: o `size` é a única diferença entre as duas
 * linhas, e é ela que o exemplo precisa deixar visível. O rótulo do compacto
 * desce junto na escala de texto.
 */
export function switchCompactoSource(): string {
  const compacto = `<div class="nds-cluster" data-spacing="sm">
  <Switch id="tamanho-compacto" size="sm" />
  <Label for="tamanho-compacto" class="nds-text-caption">Tamanho compacto</Label>
</div>`;
  return vueSnippet(
    IMPORT_PAIR,
    `<div class="nds-stack" data-spacing="sm">
${indentar(linePair('tamanho-padrao', 'Tamanho padrão'))}
${indentar(compacto)}
</div>`,
  );
}

/**
 * Estado de repouso: nada a escrever. Um switch nasce desligado, e escrever
 * `:default-value="false"` ensinaria uma prop que não faz nada.
 */
export function switchDesligadoSource(): string {
  return vueSnippet(IMPORT_PAIR, linePair('notificacoes', 'Receber notificações'));
}

/** Estado ligado na montagem: `default-value` é a prop de partida, não o estado. */
export function switchLigadoSource(): string {
  return vueSnippet(
    IMPORT_PAIR,
    linePair('notificacoes', 'Receber notificações', 'default-value'),
  );
}

/** Desabilitado: o controle sai da ordem de tabulação e não responde ao clique. */
export function switchDisabledSource(): string {
  return vueSnippet(IMPORT_PAIR, linePair('notificacoes', 'Receber notificações', 'disabled'));
}

/**
 * Desabilitado E ligado: o par mostra que bloquear a edição não apaga o estado.
 * Quem lê a tela precisa continuar sabendo que a opção está ativa.
 */
export function switchDisabledLigadoSource(): string {
  return vueSnippet(IMPORT_PAIR, linePair('notificacoes', 'Receber notificações', 'disabled default-value'));
}

/**
 * Erro: `aria-invalid` marca o controle e `aria-describedby` aponta para a
 * mensagem, que vive fora do rótulo — ela descreve, não nomeia.
 */
export function switchInvalidoSource(): string {
  return vueSnippet(
    IMPORT_PAIR,
    `<div class="nds-stack nds-w-sm" data-spacing="sm">
${indentar(
  panelLine({
    id: 'aceitar-termos',
    label: 'Aceitar termos',
    descricao: 'Você precisa aceitar para continuar.',
    attrs: 'aria-invalid="true" aria-describedby="aceitar-termos-erro"',
    border: 'nds-border-destructive',
  }),
)}
  <p id="aceitar-termos-erro" class="nds-text-body nds-text-destructive">Este campo é obrigatório.</p>
</div>`,
  );
}

/**
 * Painel de configurações: uma linha por preferência, cada controle com o seu
 * próprio estado de partida e o seu próprio rótulo.
 */
export function configSwitchPanelSource(): string {
  const lines = [
    {
      id: 'pref-email',
      label: 'Receber novidades por email',
      descricao: 'Resumo semanal sobre o produto.',
      attrs: 'default-value',
    },
    {
      id: 'pref-push',
      label: 'Receber notificações push',
      descricao: 'Alertas no dispositivo em tempo real.',
    },
    {
      id: 'pref-sms',
      label: 'Alertas por SMS',
      descricao: 'Eventos críticos via mensagem de texto.',
    },
  ];
  return vueSnippet(
    IMPORT_PAIR,
    `<div class="nds-stack nds-w-md" data-spacing="sm">
  <p class="nds-text-body nds-font-semibold nds-mb-2">Preferências de notificação</p>
${lines.map((line) => indentar(panelLine(line))).join('\n\n')}
</div>`,
  );
}

/**
 * Em formulário: o `name` é o que faz o switch entrar no envio nativo — sem ele
 * o campo simplesmente não é enviado, e nada no visual denuncia.
 */
export function formSwitchSource(): string {
  return vueSnippet(
    `${IMPORT_PAIR}
import { Button } from '@/components/ui/button'`,
    `<form class="nds-stack nds-w-sm" data-spacing="sm" @submit.prevent>
${indentar(linePair('newsletter', 'Aceitar newsletter semanal', 'name="newsletter" default-value'))}
  <Button type="submit">Salvar preferências</Button>
</form>`,
  );
}

/**
 * Sem rótulo visível: o nome vive em `aria-label`, e continua obrigatório.
 *
 * É a única composição em que o par rótulo ↔ controle não aparece, e por isso
 * a que mais precisa deixar o nome explícito — sem ele o leitor de tela anuncia
 * apenas "botão".
 */
export function switchSemRotuloSource(): string {
  return vueSnippet(
    `import { Switch } from '@/components/ui/switch'`,
    `<Switch id="modo-escuro" aria-label="Ativar modo escuro" />`,
  );
}

/**
 * Controlado por estado externo. O par é sempre este: o valor entra por
 * `v-model` e volta pela mesma ligação. Passar só o valor, sem a volta, deixa
 * o interruptor inerte — ele deixa de ser dono do próprio estado e ninguém
 * assume o lugar.
 */
export function switchControlledSource(): string {
  return vueSnippet(
    `${IMPORT_PAIR}

const ativo = ref(false)`,
    `<div class="nds-stack nds-w-sm" data-align="start" data-spacing="sm">
${indentar(linePair('notificacoes', 'Receber notificações', 'v-model="ativo"'))}
  <p class="nds-text-caption nds-text-muted-foreground">
    Estado atual: <code class="nds-font-mono">{{ ativo }}</code>
  </p>
</div>`,
  );
}
