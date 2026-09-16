/**
 * Transforms do painel Code do Tooltip.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * O contêiner que as stories usam para reservar espaço na tela (o `style` com
 * `contain: layout` e altura mínima) não entra em snippet nenhum: ele existe
 * para o canvas do Storybook, não para quem consome o componente.
 */
import {
  attr,
  attrBool,
  attrs,
  attrsMultilinha,
  indentar,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type TooltipArgs = {
  defaultOpen: boolean;
  side: 'top' | 'right' | 'bottom' | 'left';
  align: 'start' | 'center' | 'end';
};

const IMPORT_TOOLTIP = `import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'`;

const IMPORT_BUTTON = `import { Button } from '@/components/ui/button'`;

const IMPORT_KBD = `import { Kbd } from '@/components/ui/kbd'`;

/** Importa da biblioteca de ícones só o que a composição usa, sem repetir. */
function importIcons(...names: string[]): string {
  return `import { ${[...new Set(names)].join(', ')} } from 'lucide-vue-next'`;
}

/** Bloco `<script setup>`: os componentes da composição, os ícones e o estado. */
function script(options: { kbd?: boolean; icons?: string[]; state?: string } = {}): string {
  const imports = [
    IMPORT_BUTTON,
    options.kbd ? IMPORT_KBD : '',
    IMPORT_TOOLTIP,
    options.icons?.length ? importIcons(...options.icons) : '',
    options.state ? `import { ref } from 'vue'` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return options.state ? `${imports}\n\n${options.state}` : imports;
}

/**
 * Gatilho icon-only. O nome acessível é do BOTÃO — o balão é complementar, e em
 * toque não há hover que o abra. O ícone entra `aria-hidden` para não competir
 * com esse nome.
 */
function triggerIcon(options: { label: string; icone: string; variant?: string }): string {
  const variant = options.variant ?? 'outline';
  return `<TooltipTrigger as-child>
  <Button variant="${variant}" size="icon" aria-label="${options.label}">
    <${options.icone} aria-hidden="true" class="nds-size-4" />
  </Button>
</TooltipTrigger>`;
}

/**
 * Gatilho de GLIFO: um botão pequeno com "?" ou "i" ao lado do que ele explica.
 *
 * O glifo não nomeia nada — é desenho feito de letra, e quem lê por áudio ouve
 * "ponto de interrogação". O nome acessível vem do `aria-label`, e é por isso
 * que ele é obrigatório aqui, não enfeite.
 */
function triggerGlyph(options: { glyph: string; ariaLabel: string }): string {
  return `<TooltipTrigger as-child>
  <Button variant="ghost" size="icon-sm" aria-label="${options.ariaLabel}">${options.glyph}</Button>
</TooltipTrigger>`;
}

/** Gatilho com rótulo visível: o texto do botão já é o nome acessível. */
function triggerText(label: string, extra = ''): string {
  return `<TooltipTrigger as-child>
  <Button${attrs('variant="outline"', extra)}>${label}</Button>
</TooltipTrigger>`;
}

/**
 * Uma unidade completa: a raiz, o gatilho e o balão.
 *
 * O balão fica em linha quando é texto corrido e vira bloco quando o conteúdo
 * tem estrutura própria (o rótulo mais as teclas do atalho).
 */
function balao(options: {
  root?: Array<string | false | null | undefined>;
  trigger: string;
  contentText: string;
  content?: Array<string | false | null | undefined>;
}): string {
  const root = attrs(...(options.root ?? []));
  const attrsBalao = attrs(...(options.content ?? []));
  const content = options.contentText.includes('\n')
    ? `<TooltipContent${attrsBalao}>\n${indentar(options.contentText)}\n</TooltipContent>`
    : `<TooltipContent${attrsBalao}>${options.contentText}</TooltipContent>`;
  return `<Tooltip${root}>
${indentar(options.trigger)}
${indentar(content)}
</Tooltip>`;
}

/**
 * O Provider é requisito, não enfeite: é ele que guarda a espera compartilhada
 * entre os balões. Vive no topo da aplicação, e por isso abre todo snippet.
 *
 * Sem atributo ele já entrega a espera padrão do design system — declarar o
 * valor padrão aqui ensinaria que a prop é obrigatória.
 */
function withProvider(miolo: string, ...parts: Array<string | false>): string {
  return `<TooltipProvider${attrs(...parts)}>\n${indentar(miolo)}\n</TooltipProvider>`;
}

/** Contêiner de composição, com a fila de atributos quebrada quando fica longa. */
function blockWith(tag: string, attrs: string[], miolo: string): string {
  return `<${tag}${attrsMultilinha(attrs)}>\n${indentar(miolo)}\n</${tag}>`;
}

/**
 * Forma canônica: Provider no topo, gatilho que já se explica sozinho e um
 * balão de reforço.
 *
 * `side` e `align` saem pelos controls, e ambos passam por `attr`, que descarta
 * o que não é texto — arg de ação chega como função e o corpo do espião
 * apareceria no painel como se fosse o exemplo.
 */
export const tooltipSource: SourceTransform<TooltipArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return vueSnippet(
    script({ icons: ['Save'] }),
    withProvider(
      balao({
        root: [attrBool('default-open', args.defaultOpen, false)],
        trigger: triggerIcon({ label: 'Salvar', icone: 'Save' }),
        content: [attr('side', args.side, 'top'), attr('align', args.align, 'center')],
        contentText: 'Salvar (Ctrl+S)',
      }),
    ),
  );
};

/** Texto curto: uma explicação de uma linha, que é o caso de uso do balão. */
export function tooltipTextCurtoSource(): string {
  return vueSnippet(
    script({ icons: ['Save'] }),
    withProvider(
      balao({
        root: ['default-open'],
        trigger: triggerIcon({ label: 'Salvar', icone: 'Save' }),
        contentText: 'Salvar',
      }),
    ),
  );
}

/**
 * Atalho de teclado: a tecla vai em `Kbd`, e não solta no texto — a folha
 * compartilhada reconhece a tecla pelo componente e ajusta o respiro do balão.
 */
export function tooltipWithShortcutSource(): string {
  return vueSnippet(
    script({ kbd: true, icons: ['Save'] }),
    withProvider(
      balao({
        root: ['default-open'],
        trigger: triggerIcon({ label: 'Salvar', icone: 'Save' }),
        contentText: `<span>Salvar</span>
<Kbd>Ctrl</Kbd>
<Kbd>S</Kbd>`,
      }),
    ),
  );
}

/**
 * Texto longo: quebra dentro do limite de largura do balão. Passou de uma
 * definição curta, o caso deixa de ser de Tooltip.
 */
export function tooltipTextLongSource(): string {
  return vueSnippet(
    script(),
    withProvider(
      balao({
        root: ['default-open'],
        trigger: triggerText('Compartilhar'),
        content: ['side="bottom"'],
        contentText: 'Cria um link público de leitura — qualquer pessoa com o link vê o conteúdo',
      }),
    ),
  );
}

/** Estado de partida: o balão nem existe no DOM até o gatilho pedir. */
export function tooltipClosedSource(): string {
  return vueSnippet(
    script({ icons: ['Save'] }),
    withProvider(
      balao({
        trigger: triggerIcon({ label: 'Salvar', icone: 'Save' }),
        contentText: 'Salvar',
      }),
    ),
  );
}

/** Aberto de saída: o estado inicial vem da raiz, sem interação nenhuma. */
export function tooltipOpenSource(): string {
  return vueSnippet(
    script({ icons: ['Save'] }),
    withProvider(
      balao({
        root: ['default-open'],
        trigger: triggerIcon({ label: 'Salvar', icone: 'Save' }),
        contentText: 'Salvar (Ctrl+S)',
      }),
    ),
  );
}

/**
 * Espera antes de abrir: é o que separa passar o mouse de parar sobre o
 * elemento. Ela mora no Provider, e vale para todos os balões abaixo dele.
 *
 * Quem chega pelo teclado não tem como "parar em cima": o foco abre na hora,
 * sem esperar — é a mesma composição vista pelos dois caminhos de entrada.
 */
export function tooltipWithWaitSource(): string {
  return vueSnippet(
    script({ icons: ['Save'] }),
    withProvider(
      balao({
        trigger: triggerIcon({ label: 'Salvar', icone: 'Save' }),
        content: ['side="bottom"'],
        contentText: 'Salvar (Ctrl+S)',
      }),
      ':delay-duration="600"',
    ),
  );
}

/**
 * Persistência: levar o ponteiro do gatilho até o balão não fecha nada. Não há
 * prop a ligar — a área de tolerância entre os dois já vem no componente.
 */
export function tooltipPersistenteSource(): string {
  return vueSnippet(
    script(),
    withProvider(
      balao({
        trigger: triggerText('Compartilhar'),
        content: ['side="bottom"'],
        contentText: 'Cria um link público de leitura',
      }),
    ),
  );
}

/**
 * Abertura controlada por estado externo.
 *
 * Dois botões, e não um que alterna: o `pointerdown` do clique fora dispensa o
 * balão ANTES do `click`, então um alternador leria o estado já invertido e
 * reabriria o que acabou de fechar.
 */
export function tooltipControlledSource(): string {
  return vueSnippet(
    script({ icons: ['Save'], state: 'const aberto = ref(false)' }),
    withProvider(
      blockWith(
        'div',
        ['class="nds-stack"', 'data-align="center"', 'data-spacing="sm"'],
        `<div class="nds-cluster" data-spacing="md">
  <Button variant="secondary" @click="aberto = true">Abrir externamente</Button>
  <Button variant="outline" @click="aberto = false">Fechar externamente</Button>
</div>

${balao({
  root: [':open="aberto"', '@update:open="(valor) => (aberto = valor)"'],
  trigger: triggerIcon({ label: 'Salvar', icone: 'Save' }),
  content: ['side="bottom"'],
  contentText: 'Salvar (Ctrl+S)',
})}`,
      ),
    ),
  );
}

/**
 * Botão icon-only: a composição de referência do Tooltip. É a mesma do texto
 * curto — aqui o assunto não é o conteúdo do balão, e sim de quem é o nome
 * acessível: do botão, sempre, com o balão só reforçando.
 */
export function tooltipButtonIconSource(): string {
  return tooltipTextCurtoSource();
}

/**
 * Ajuda ao lado do rótulo de um campo.
 *
 * Quem nomeia o campo é o `label` ligado por `for`/`id` — o balão explica ONDE
 * achar o valor, que é informação complementar: pode faltar sem quebrar o
 * formulário. À direita, e não acima, porque acima ele cobriria o próprio
 * rótulo que o campo usa para se nomear.
 */
export function tooltipHelpInFormFieldSource(): string {
  return vueSnippet(
    script(),
    withProvider(
      blockWith(
        'div',
        ['class="nds-stack"', 'data-spacing="sm"'],
        `<div class="nds-cluster" data-spacing="sm">
  <label for="api-token-input" class="nds-text-body nds-font-medium">Token de API</label>
${indentar(
  balao({
    trigger: triggerGlyph({ glyph: '?', ariaLabel: 'Onde encontrar o Token de API' }),
    content: ['side="right"'],
    contentText: 'Gere em Configurações › Acesso › Tokens.',
  }),
)}
</div>

<input id="api-token-input" type="text" class="nds-input" placeholder="ndsk_..." />`,
      ),
    ),
  );
}

/**
 * Sigla de métrica com a expansão no balão.
 *
 * A sigla fica VISÍVEL e o balão só a expande: quem não abre o tooltip ainda lê
 * a métrica e o valor. Tooltip que carregasse a única cópia do significado
 * esconderia o conteúdo de quem navega por toque.
 */
export function tooltipMetricDescriptionSource(): string {
  return vueSnippet(
    script(),
    withProvider(
      blockWith(
        'div',
        ['class="nds-stack"', 'data-spacing="xs"'],
        `<div class="nds-cluster" data-spacing="sm">
  <p class="nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider">LCP</p>
${indentar(
  balao({
    trigger: triggerGlyph({ glyph: 'i', ariaLabel: 'O que é LCP' }),
    contentText: 'LCP — Largest Contentful Paint',
  }),
)}
</div>

<p class="nds-text-h3 nds-font-semibold">1,8 s</p>`,
      ),
    ),
  );
}

/**
 * Os quatro lados de posicionamento.
 *
 * Os quatro declaram `side`, o de cima inclusive: a story escreve `side="top"`
 * no primeiro balão, e snippet que omite o que a story renderiza ensina outra
 * tela. Perto da borda o posicionador troca para o lado oposto em vez de sair
 * do campo de visão.
 *
 * O `aria-label` repete o rótulo visível porque é o que a story tem — aqui os
 * quatro gatilhos se chamam pelo próprio lado, e o painel Code publica a
 * composição que está na tela, não uma variação dela.
 */
/**
 * Colisão: o gatilho encostado na borda, e o balão pedindo o lado sem espaço.
 *
 * O pedido continua sendo `top`; quem muda é o resultado. Sem espaço acima, o
 * posicionador vira o balão para o lado oposto em vez de deixá-lo sair do campo
 * de visão, e `data-side` passa a trazer o lado FINAL — é dele que a folha
 * compartilhada desenha a seta e a origem da animação.
 *
 * A barra presa ao topo entra no snippet de propósito: ela não é andaime de
 * canvas, é o que põe o gatilho contra a borda. Sem ela não há colisão nenhuma
 * a demonstrar, e o exemplo ensinaria outra tela.
 */
export function tooltipCollisionSource(): string {
  return vueSnippet(
    script(),
    withProvider(
      blockWith(
        'div',
        [
          'class="nds-cluster"',
          'data-justify="center"',
          'style="position: fixed; inset-block-start: 0; inset-inline: 0"',
        ],
        balao({
          root: ['default-open'],
          trigger: triggerText('Compartilhar'),
          content: ['side="top"'],
          contentText: 'Cria um link público de leitura',
        }),
      ),
    ),
  );
}

/**
 * A janela do grupo: um Provider só servindo dois gatilhos.
 *
 * O primeiro balão cumpre a espera inteira. Enquanto a janela de cortesia não
 * expira, o vizinho abre NA HORA — é ela que faz percorrer uma barra parecer um
 * movimento só, em vez de uma espera a cada parada.
 *
 * Os dois valores vão largos porque é a diferença entre eles que o exemplo
 * ensina: com a espera padrão, "abriu sem esperar" e "abriu depois de esperar"
 * ficam a 300ms um do outro, e o leitor não vê o que a prop faz.
 */
export function tooltipGroupWaitSource(): string {
  const actions: Array<{ label: string; key: string }> = [
    { label: 'Copiar', key: 'C' },
    { label: 'Colar', key: 'V' },
  ];
  return vueSnippet(
    script({ kbd: true }),
    withProvider(
      blockWith(
        'div',
        ['class="nds-cluster"', 'data-spacing="md"'],
        actions
          .map((action) =>
            balao({
              trigger: triggerText(action.label),
              content: ['side="bottom"'],
              contentText: `<span>${action.label}</span>
<Kbd>Ctrl</Kbd>
<Kbd>${action.key}</Kbd>`,
            }),
          )
          .join('\n\n'),
      ),
      ':delay-duration="3000"',
      ':skip-delay-duration="5000"',
    ),
  );
}

export function tooltipQuatroLadosSource(): string {
  const lados = ['top', 'right', 'bottom', 'left'];
  return vueSnippet(
    script(),
    withProvider(
      blockWith(
        'div',
        ['class="nds-grid nds-w-full nds-p-8"', 'data-spacing="xl"', 'data-cols="2"'],
        lados
          .map((side) =>
            balao({
              root: ['default-open'],
              trigger: triggerText(side, `size="sm" aria-label="${side}"`),
              content: [`side="${side}"`],
              contentText: `Tooltip ${side}`,
            }),
          )
          .join('\n\n'),
      ),
    ),
  );
}
