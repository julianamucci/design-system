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
function importIcons(...nomes: string[]): string {
  return `import { ${[...new Set(nomes)].join(', ')} } from 'lucide-vue-next'`;
}

/** Bloco `<script setup>`: os componentes da composição, os ícones e o estado. */
function script(opcoes: { kbd?: boolean; icones?: string[]; estado?: string } = {}): string {
  const imports = [
    IMPORT_BUTTON,
    opcoes.kbd ? IMPORT_KBD : '',
    IMPORT_TOOLTIP,
    opcoes.icones?.length ? importIcons(...opcoes.icones) : '',
    opcoes.estado ? `import { ref } from 'vue'` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return opcoes.estado ? `${imports}\n\n${opcoes.estado}` : imports;
}

/**
 * Gatilho icon-only. O nome acessível é do BOTÃO — o balão é complementar, e em
 * toque não há hover que o abra. O ícone entra `aria-hidden` para não competir
 * com esse nome.
 */
function triggerIcon(opcoes: { rotulo: string; icone: string; variante?: string }): string {
  const variante = opcoes.variante ?? 'outline';
  return `<TooltipTrigger as-child>
  <Button variant="${variante}" size="icon" aria-label="${opcoes.rotulo}">
    <${opcoes.icone} aria-hidden="true" class="nds-size-4" />
  </Button>
</TooltipTrigger>`;
}

/** Gatilho com rótulo visível: o texto do botão já é o nome acessível. */
function triggerText(rotulo: string, extra = ''): string {
  return `<TooltipTrigger as-child>
  <Button${attrs('variant="outline"', extra)}>${rotulo}</Button>
</TooltipTrigger>`;
}

/**
 * Uma unidade completa: a raiz, o gatilho e o balão.
 *
 * O balão fica em linha quando é texto corrido e vira bloco quando o conteúdo
 * tem estrutura própria (o rótulo mais as teclas do atalho).
 */
function balao(opcoes: {
  raiz?: Array<string | false | null | undefined>;
  gatilho: string;
  conteudo: string;
  content?: Array<string | false | null | undefined>;
}): string {
  const raiz = attrs(...(opcoes.raiz ?? []));
  const attrsBalao = attrs(...(opcoes.content ?? []));
  const conteudo = opcoes.conteudo.includes('\n')
    ? `<TooltipContent${attrsBalao}>\n${indentar(opcoes.conteudo)}\n</TooltipContent>`
    : `<TooltipContent${attrsBalao}>${opcoes.conteudo}</TooltipContent>`;
  return `<Tooltip${raiz}>
${indentar(opcoes.gatilho)}
${indentar(conteudo)}
</Tooltip>`;
}

/**
 * O Provider é requisito, não enfeite: é ele que guarda a espera compartilhada
 * entre os balões. Vive no topo da aplicação, e por isso abre todo snippet.
 *
 * Sem atributo ele já entrega a espera padrão do design system — declarar o
 * valor padrão aqui ensinaria que a prop é obrigatória.
 */
function withProvider(miolo: string, ...atributos: Array<string | false>): string {
  return `<TooltipProvider${attrs(...atributos)}>\n${indentar(miolo)}\n</TooltipProvider>`;
}

/** Contêiner de composição, com a fila de atributos quebrada quando fica longa. */
function blockWith(tag: string, atributos: string[], miolo: string): string {
  return `<${tag}${attrsMultilinha(atributos)}>\n${indentar(miolo)}\n</${tag}>`;
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
    script({ icones: ['Save'] }),
    withProvider(
      balao({
        raiz: [attrBool('default-open', args.defaultOpen, false)],
        gatilho: triggerIcon({ rotulo: 'Salvar', icone: 'Save' }),
        content: [attr('side', args.side, 'top'), attr('align', args.align, 'center')],
        conteudo: 'Salvar (Ctrl+S)',
      }),
    ),
  );
};

/** Texto curto: uma explicação de uma linha, que é o caso de uso do balão. */
export function tooltipTextCurtoSource(): string {
  return vueSnippet(
    script({ icones: ['Save'] }),
    withProvider(
      balao({
        raiz: ['default-open'],
        gatilho: triggerIcon({ rotulo: 'Salvar', icone: 'Save' }),
        content: ['side="bottom"'],
        conteudo: 'Salvar',
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
    script({ kbd: true, icones: ['Save'] }),
    withProvider(
      balao({
        raiz: ['default-open'],
        gatilho: triggerIcon({ rotulo: 'Salvar', icone: 'Save' }),
        content: ['side="bottom"'],
        conteudo: `<span>Salvar</span>
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
        raiz: ['default-open'],
        gatilho: triggerText('Compartilhar'),
        content: ['side="bottom"'],
        conteudo: 'Cria um link público de leitura — qualquer pessoa com o link vê o conteúdo',
      }),
    ),
  );
}

/** Estado de partida: o balão nem existe no DOM até o gatilho pedir. */
export function tooltipClosedSource(): string {
  return vueSnippet(
    script({ icones: ['Save'] }),
    withProvider(
      balao({
        gatilho: triggerIcon({ rotulo: 'Salvar', icone: 'Save' }),
        conteudo: 'Salvar',
      }),
    ),
  );
}

/** Aberto de saída: o estado inicial vem da raiz, sem interação nenhuma. */
export function tooltipOpenSource(): string {
  return vueSnippet(
    script({ icones: ['Save'] }),
    withProvider(
      balao({
        raiz: ['default-open'],
        gatilho: triggerIcon({ rotulo: 'Salvar', icone: 'Save' }),
        content: ['side="bottom"'],
        conteudo: 'Salvar (Ctrl+S)',
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
    script({ icones: ['Save'] }),
    withProvider(
      balao({
        gatilho: triggerIcon({ rotulo: 'Salvar', icone: 'Save' }),
        content: ['side="bottom"'],
        conteudo: 'Salvar (Ctrl+S)',
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
        gatilho: triggerText('Compartilhar'),
        content: ['side="bottom"'],
        conteudo: 'Cria um link público de leitura',
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
    script({ icones: ['Save'], estado: 'const aberto = ref(false)' }),
    withProvider(
      blockWith(
        'div',
        ['class="nds-stack"', 'data-align="center"', 'data-spacing="sm"'],
        `<div class="nds-cluster" data-spacing="sm">
  <Button variant="secondary" @click="aberto = true">Abrir externamente</Button>
  <Button variant="outline" @click="aberto = false">Fechar externamente</Button>
</div>

${balao({
  raiz: [':open="aberto"', '@update:open="(valor) => (aberto = valor)"'],
  gatilho: triggerIcon({ rotulo: 'Salvar', icone: 'Save' }),
  content: ['side="bottom"'],
  conteudo: 'Salvar (Ctrl+S)',
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
 * Barra de ações: vários botões icon-only, cada um com nome próprio e balão de
 * reforço. Um Provider só serve a todos — a espera é compartilhada.
 */
export function actionsTooltipBarSource(): string {
  const acoes: Array<{ rotulo: string; icone: string }> = [
    { rotulo: 'Salvar', icone: 'Save' },
    { rotulo: 'Copiar', icone: 'Copy' },
    { rotulo: 'Editar', icone: 'Pencil' },
    { rotulo: 'Compartilhar', icone: 'Share2' },
    { rotulo: 'Excluir', icone: 'Trash2' },
  ];
  return vueSnippet(
    script({ icones: acoes.map((acao) => acao.icone) }),
    withProvider(
      blockWith(
        'div',
        [
          'role="toolbar"',
          'aria-label="Ações do documento"',
          'class="nds-cluster nds-rounded-md nds-border-default nds-bg-card nds-p-1"',
          'data-align="center"',
          'data-spacing="xs"',
        ],
        acoes
          .map((acao) =>
            balao({
              gatilho: triggerIcon({ ...acao, variante: 'ghost' }),
              content: ['side="bottom"'],
              conteudo: acao.rotulo,
            }),
          )
          .join('\n\n'),
      ),
    ),
  );
}

/**
 * Os quatro lados de posicionamento.
 *
 * O de cima sai SEM `side`: é o padrão, e a ausência é a própria lição — o
 * balão nasce em cima sem que ninguém peça. Perto da borda da tela o
 * posicionador troca para o lado oposto em vez de sair do campo de visão.
 */
export function tooltipQuatroLadosSource(): string {
  const lados = ['top', 'right', 'bottom', 'left'];
  return vueSnippet(
    script(),
    withProvider(
      blockWith(
        'div',
        ['class="nds-grid nds-p-8"', 'data-spacing="xl"', 'data-cols="2"'],
        lados
          .map((lado) =>
            balao({
              raiz: ['default-open'],
              gatilho: triggerText(lado, 'size="sm"'),
              content: [attr('side', lado, 'top')],
              conteudo: `Tooltip ${lado}`,
            }),
          )
          .join('\n\n'),
      ),
    ),
  );
}
