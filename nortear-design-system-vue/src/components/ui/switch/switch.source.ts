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
  <div class="nds-stack" data-spacing="xs">
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
      'Receber notificações por email',
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
  return vueSnippet(IMPORT_PAIR, linePair('notificacoes', 'Receber notificações por email'));
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
  return vueSnippet(IMPORT_PAIR, linePair('modo-escuro', 'Modo escuro', 'disabled default-value'));
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
      id: 'marketing',
      label: 'Emails de marketing',
      descricao: 'Receba novidades e promoções da plataforma.',
      attrs: 'default-value',
    },
    {
      id: 'seguranca',
      label: 'Alertas de segurança',
      descricao: 'Notificações sobre acessos suspeitos à sua conta.',
      attrs: 'default-value',
    },
    {
      id: 'resumo-semanal',
      label: 'Resumo semanal',
      descricao: 'Receba um resumo das principais novidades toda segunda.',
    },
  ];
  return vueSnippet(
    IMPORT_PAIR,
    `<div class="nds-stack nds-w-md" data-spacing="sm">
${lines.map((line) => indentar(panelLine(line))).join('\n\n')}
</div>`,
  );
}

/**
 * Lista de preferências: a mesma ideia sem o texto de apoio, e a estrutura vira
 * lista de verdade — três itens relacionados são uma `ul`, não três `div`.
 */
export function preferenciasSwitchListSource(): string {
  const items = [
    { id: 'push', label: 'Notificações push', attrs: 'default-value' },
    { id: 'email', label: 'Notificações por email', attrs: '' },
    { id: 'sms', label: 'SMS', attrs: '' },
  ];
  const lines = items
    .map(({ id, label, attrs: extra }, i) => {
      const border = i === 0 ? '' : ' nds-border-t';
      return `  <li class="nds-cluster nds-p-4${border}" data-align="center" data-justify="between">
    <Label for="${id}">${label}</Label>
    <Switch id="${id}"${attrs(extra)} />
  </li>`;
    })
    .join('\n');
  return vueSnippet(
    IMPORT_PAIR,
    `<ul class="nds-w-sm nds-rounded-lg nds-border-default">
${lines}
</ul>`,
  );
}

/**
 * Em formulário: o `name` é o que faz o switch entrar no envio nativo — sem ele
 * o campo simplesmente não é enviado, e nada no visual denuncia.
 */
export function formSwitchSource(): string {
  return vueSnippet(
    `${IMPORT_PAIR}
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'`,
    `<form class="nds-stack nds-w-md" data-spacing="sm" @submit.prevent>
  <div class="nds-stack" data-spacing="sm">
    <Label for="email">Email</Label>
    <Input id="email" type="email" placeholder="seu@email.com" />
  </div>

${indentar(
  panelLine({
    id: 'perfil-publico',
    label: 'Perfil público',
    descricao: 'Qualquer pessoa pode visualizar seu perfil.',
    attrs: 'name="perfil-publico"',
  }),
)}

  <Button type="submit">Salvar preferências</Button>
</form>`,
  );
}

/**
 * Item de menu compacto: o degrau `sm` cabe onde a linha inteira é pequena, e o
 * rótulo desce junto para a escala de legenda.
 */
export function switchItemDeMenuSource(): string {
  const items = [
    { id: 'modo-escuro', label: 'Modo escuro', attrs: 'size="sm"' },
    { id: 'salvar-automaticamente', label: 'Salvar automaticamente', attrs: 'size="sm" default-value' },
    { id: 'visualizacao-compacta', label: 'Visualização compacta', attrs: 'size="sm"' },
  ];
  const lines = items
    .map(
      ({ id, label, attrs: extra }) =>
        `  <div class="nds-cluster nds-rounded nds-px-2 nds-py-1 nds-hover-bg-muted-40" data-align="center" data-justify="between">
    <Label for="${id}" class="nds-text-caption">${label}</Label>
    <Switch id="${id}"${attrs(extra)} />
  </div>`,
    )
    .join('\n');
  return vueSnippet(
    IMPORT_PAIR,
    `<div class="nds-stack nds-w-xs nds-rounded-md nds-border-default nds-p-2" data-spacing="xs">
${lines}
</div>`,
  );
}
