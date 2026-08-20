/**
 * Transforms do painel Code do Collapsible.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * O componente é uma composição de três peças, e a tag da raiz sozinha não
 * ensina nada: o que abre é o gatilho, e o que é revelado é o painel.
 */
import { attrBool, attrs, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type CollapsibleArgs = {
  defaultOpen: boolean;
  disabled: boolean;
};

/** Import do design system mais os ícones que o gatilho usa. */
function importar(icones = 'ChevronDown'): string {
  return `import { ${icones} } from 'lucide-vue-next'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'`;
}

/**
 * Classes do painel e do gatilho, iguais às do Vanilla — a referência
 * cross-stack. O gatilho é o próprio botão do design system: não há repasse
 * para um filho, e é por isso que ele carrega `aria-expanded` e `aria-controls`
 * sem nenhuma linha de ligação.
 */
const PAINEL =
  'nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2';
const GATILHO_GHOST = 'nds-button nds-button-ghost nds-cluster nds-w-full nds-px-4';
const GATILHO_OUTLINE = 'nds-button nds-button-outline nds-cluster nds-w-full nds-px-4';

/**
 * O chevron gira sozinho: `.nds-chevron` responde a `[aria-expanded="true"]` no
 * ancestral, então não há classe de estado a escrever nem ouvinte a registrar.
 */
const CHEVRON = 'nds-icon nds-shrink-0 nds-transition-transform nds-chevron';
/** Sem a rotação — o gatilho desabilitado não alterna, e girar mentiria. */
const CHEVRON_PARADO = 'nds-icon nds-shrink-0';

const FILTROS = `    <p>Filtro avançado 1</p>
    <p>Filtro avançado 2</p>`;

/** A composição inteira: raiz, gatilho com rótulo e chevron, e painel. */
function colapsavel(opcoes: {
  raiz?: string;
  classeRaiz?: string;
  gatilho?: string;
  classeGatilho?: string;
  chevron?: string;
  rotulo: string;
  corpo?: string;
}): string {
  const {
    raiz = '',
    classeRaiz = 'nds-w-full nds-max-w-sm',
    gatilho = '',
    classeGatilho = GATILHO_GHOST,
    chevron = CHEVRON,
    rotulo,
    corpo = FILTROS,
  } = opcoes;
  const atributosDoGatilho = [gatilho, `class="${classeGatilho}"`, 'data-justify="between"']
    .filter(Boolean)
    .map((atributo) => `    ${atributo}`)
    .join('\n');
  return `<Collapsible${attrs(raiz, `class="${classeRaiz}"`)}>
  <CollapsibleTrigger
${atributosDoGatilho}
  >
${rotulo}
    <ChevronDown aria-hidden="true" class="${chevron}" />
  </CollapsibleTrigger>
  <CollapsibleContent
    class="${PAINEL}"
    data-spacing="sm"
  >
${corpo}
  </CollapsibleContent>
</Collapsible>`;
}

/** Rótulo simples do gatilho, já indentado para dentro dele. */
const rotuloSimples = (texto: string) => `    <span>${texto}</span>`;

/**
 * Playground: estado inicial e desabilitado saem dos controls.
 *
 * `disabled` aparece nos DOIS lugares porque é onde a story o escreve: na raiz,
 * que guarda o estado, e no gatilho, que é o `<button>` que precisa sair da
 * ativação. Ambos passam por `attrBool`, que descarta o que não for booleano —
 * o Storybook troca arg de ação por um espião, e o corpo do mock interpolado
 * apareceria no painel como se fosse o exemplo.
 */
export const collapsibleSource: SourceTransform<CollapsibleArgs> = (_gerado, ctx) => {
  const desabilitado = attrBool('disabled', ctx?.args?.disabled, false);
  return vueSnippet(
    importar(),
    colapsavel({
      raiz: attrs(attrBool('default-open', ctx?.args?.defaultOpen, false), desabilitado).trim(),
      gatilho: desabilitado,
      rotulo: rotuloSimples('Exibir filtros avançados'),
    }),
  );
};

/**
 * Não controlado: ninguém de fora escreve `open`. O estado nasce e vive dentro
 * do componente, e a composição é a mínima possível.
 */
export function collapsibleNaoControladoSource(): string {
  return vueSnippet(
    importar(),
    colapsavel({ rotulo: rotuloSimples('Exibir filtros avançados') }),
  );
}

/**
 * Aberto de saída. `default-open` é ponto de partida, não trava: o gatilho
 * continua alternando depois da montagem.
 */
export function collapsibleAbertoPorPadraoSource(): string {
  return vueSnippet(
    importar(),
    colapsavel({
      raiz: 'default-open',
      // O rótulo acompanha o estado inicial: "Exibir" num painel já aberto
      // descreveria o contrário do que a pessoa vê.
      rotulo: rotuloSimples('Ocultar filtros avançados'),
    }),
  );
}

/**
 * Controlado: o estado mora fora, e o painel obedece à prop.
 *
 * `v-model:open` é o par `:open` + `@update:open` escrito de uma vez — o
 * gatilho devolve a mudança para quem guarda o estado, e os botões de fora
 * mandam no painel sem tocar nele.
 *
 * Os botões externos têm nome próprio: dois controles com o mesmo nome
 * acessível ficam ambíguos na lista do leitor de tela.
 */
export function collapsibleControladoSource(): string {
  const bloco = colapsavel({
    raiz: 'v-model:open="aberto"',
    classeRaiz: 'nds-w-full',
    rotulo: `    <span>{{ aberto ? 'Ocultar filtros avançados' : 'Exibir filtros avançados' }}</span>`,
  });
  return vueSnippet(
    `import { ref } from 'vue'
${importar()}

const aberto = ref(false)`,
    `<div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="sm">
  <p class="nds-text-caption nds-text-muted-foreground">
    Estado externo: <strong>{{ aberto ? 'aberto' : 'fechado' }}</strong>
  </p>
  <div class="nds-cluster" data-spacing="sm">
    <button class="nds-button nds-button-outline nds-button-sm" @click="aberto = true">
      Abrir pelo estado externo
    </button>
    <button class="nds-button nds-button-outline nds-button-sm" @click="aberto = false">
      Fechar pelo estado externo
    </button>
  </div>
${indentar(bloco, 2)}
</div>`,
  );
}

/**
 * Desabilitado nas duas pontas: a raiz não alterna e o gatilho é um `<button>`
 * desabilitado de verdade, não só esmaecido. O chevron perde a rotação porque
 * não há estado que o faça girar.
 */
export function collapsibleDesabilitadoSource(): string {
  return vueSnippet(
    importar(),
    colapsavel({
      raiz: 'disabled',
      gatilho: 'disabled',
      chevron: CHEVRON_PARADO,
      rotulo: rotuloSimples('Filtros avançados (desabilitado)'),
    }),
  );
}

/**
 * Gatilho com a cara de botão do design system. O botão E o gatilho são o MESMO
 * elemento: as classes moram no próprio gatilho, e por isso ele carrega o
 * estado sem código de ligação nenhum.
 */
export function collapsibleComBotaoSource(): string {
  return vueSnippet(
    importar(),
    colapsavel({
      classeGatilho: GATILHO_OUTLINE,
      rotulo: rotuloSimples('Exibir opções avançadas'),
      corpo: `    <p>Opção avançada 1</p>
    <p>Opção avançada 2</p>
    <p>Opção avançada 3</p>`,
    }),
  );
}

/**
 * Ícone no gatilho. Os dois desenhos são `aria-hidden`: o nome acessível do
 * gatilho é só o texto, e um ícone dentro dele viraria ruído no anúncio.
 */
export function collapsibleComIconeSource(): string {
  return vueSnippet(
    importar('ChevronDown, Filter'),
    colapsavel({
      rotulo: `    <span class="nds-cluster" data-spacing="sm">
      <Filter aria-hidden="true" class="nds-icon nds-shrink-0 nds-text-muted-foreground" />
      Filtros avançados
    </span>`,
      corpo: `    <p class="nds-text-muted-foreground">Filtro avançado 1</p>
    <p class="nds-text-muted-foreground">Filtro avançado 2</p>`,
    }),
  );
}

/**
 * Chevron rotativo. Não há classe de estado a escrever: `.nds-chevron` gira sob
 * `[aria-expanded="true"]`, que é atributo que o próprio gatilho mantém.
 */
export function collapsibleComChevronSource(): string {
  return vueSnippet(
    importar(),
    colapsavel({
      classeGatilho: GATILHO_OUTLINE,
      rotulo: rotuloSimples('Configurações avançadas'),
      corpo: `    <div class="nds-cluster" data-justify="between">
      <span class="nds-text-muted-foreground">Notificações</span>
      <span class="nds-font-medium">Ativadas</span>
    </div>
    <div class="nds-cluster" data-justify="between">
      <span class="nds-text-muted-foreground">Privacidade</span>
      <span class="nds-font-medium">Modo estrito</span>
    </div>`,
    }),
  );
}
