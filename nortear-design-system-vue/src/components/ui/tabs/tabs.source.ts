/**
 * Transforms do painel Code do Tabs.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * Duas decisões valem para todos os snippets daqui:
 *
 * 1. O `aria-label` da lista é obrigatório. Sem ele o conjunto é anunciado como
 *    "lista de abas" e nada mais, e uma página com dois conjuntos fica com dois
 *    marcos idênticos.
 * 2. Nenhum painel carrega respiro próprio. A raiz `.nds-tabs` já separa a lista
 *    do painel pelo `gap`, e as stories cravavam 12px por cima disso — um
 *    meio-degrau que o vocabulário de utilitárias exclui de propósito. No eixo
 *    vertical, o respiro que falta é lateral, e para ele existe `nds-pl-4`.
 */
import { attr, attrs, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type TabsArgs = {
  defaultValue: string;
  orientation: 'horizontal' | 'vertical';
  activationMode: 'automatic' | 'manual';
};

const IMPORT = `import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'`;

/** Painel de texto corrido: corpo atenuado, como toda leitura secundária. */
const CLASSNAME_PANEL = 'nds-text-body nds-text-muted-foreground';

/** No eixo vertical o respiro que falta é lateral, entre a lista e o painel. */
const VERTICAL_CLASSNAME_PANEL = `${CLASSNAME_PANEL} nds-pl-4`;

type Aba = {
  valor: string;
  /** Conteúdo do gatilho: o rótulo, ou rótulo com ícone/contador em várias linhas. */
  gatilho: string;
  /** Conteúdo do painel. */
  painel: string;
  desabilitada?: boolean;
};

/** Abre em uma linha quando o conteúdo cabe, e quebra quando não cabe. */
function bloco(tag: string, atributos: string, conteudo: string, recuo: number): string {
  const p = ' '.repeat(recuo);
  if (!conteudo.includes('\n')) return `${p}<${tag}${atributos}>${conteudo}</${tag}>`;
  return `${p}<${tag}${atributos}>\n${indentar(conteudo, recuo + 2)}\n${p}</${tag}>`;
}

function tabs(opcoes: {
  raiz?: string;
  lista?: string;
  rotuloLista: string;
  abas: Aba[];
  classePainel?: string;
}): string {
  const { raiz = '', lista = '', rotuloLista, abas, classePainel = CLASSNAME_PANEL } = opcoes;
  const gatilhos = abas
    .map((aba) =>
      bloco(
        'TabsTrigger',
        // `disabled` da aba vira `aria-disabled`, nunca o atributo nativo: o
        // padrão WAI-ARIA manda a aba indisponível continuar alcançável pela
        // seta, para que o leitor de tela a anuncie.
        attrs(`value="${aba.valor}"`, aba.desabilitada ? 'disabled' : ''),
        aba.gatilho,
        4,
      ),
    )
    .join('\n');
  const panels = abas
    .map((aba) =>
      bloco('TabsContent', attrs(`value="${aba.valor}"`, `class="${classePainel}"`), aba.painel, 2),
    )
    .join('\n');
  return `<Tabs${attrs(raiz)}>
  <TabsList${attrs(lista, `aria-label="${rotuloLista}"`)}>
${gatilhos}
  </TabsList>
${panels}
</Tabs>`;
}

/** As três seções que servem de exemplo na maioria das stories. */
const SECTIONS: Aba[] = [
  { valor: 'overview', gatilho: 'Visão geral', painel: 'Conteúdo da visão geral.' },
  { valor: 'properties', gatilho: 'Propriedades', painel: 'Lista de propriedades.' },
  { valor: 'examples', gatilho: 'Exemplos', painel: 'Exemplos de uso.' },
];

/**
 * Forma canônica: raiz com a aba de partida, lista nomeada, um gatilho e um
 * painel por seção — o `value` é o que casa o par.
 *
 * O eixo troca a largura da moldura e o lado do respiro do painel: na vertical a
 * lista fica ao lado, e o que separa os dois é margem lateral, não superior.
 */
export const tabsSource: SourceTransform<TabsArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const vertical = args.orientation === 'vertical';
  return vueSnippet(
    IMPORT,
    tabs({
      raiz: attrs(
        attr('default-value', args.defaultValue) || 'default-value="overview"',
        attr('orientation', args.orientation, 'horizontal'),
        attr('activation-mode', args.activationMode, 'automatic'),
        `class="nds-w-${vertical ? 'lg' : 'md'}"`,
      ).trim(),
      rotuloLista: 'Seções do componente',
      abas: SECTIONS,
      classePainel: vertical ? VERTICAL_CLASSNAME_PANEL : CLASSNAME_PANEL,
    }),
  );
};

/**
 * Variante padrão: trilho com fundo próprio e aba ativa destacada por fundo, não
 * só por cor de texto. A lista não escreve `variant` — `default` é o que ela já é.
 */
export function tabsDefaultSource(): string {
  return vueSnippet(
    IMPORT,
    tabs({
      raiz: 'default-value="overview" class="nds-w-md"',
      rotuloLista: 'Seções do componente',
      abas: SECTIONS,
    }),
  );
}

/** Variante em linha: sem trilho, com o indicador sob a aba ativa. */
export function tabsLineSource(): string {
  return vueSnippet(
    IMPORT,
    tabs({
      raiz: 'default-value="overview" class="nds-w-md"',
      lista: 'variant="line"',
      rotuloLista: 'Seções do componente',
      abas: SECTIONS,
    }),
  );
}

/**
 * Eixo vertical: a lista empilha à esquerda e o painel fica ao lado. O respiro
 * entre os dois passa a ser lateral — daí `nds-pl-4` no painel.
 */
export function tabsVerticalSource(): string {
  return vueSnippet(
    IMPORT,
    tabs({
      raiz: 'default-value="profile" orientation="vertical" class="nds-w-lg"',
      rotuloLista: 'Configurações da conta',
      classePainel: VERTICAL_CLASSNAME_PANEL,
      abas: [
        {
          valor: 'profile',
          gatilho: 'Perfil',
          painel: 'Configurações do perfil — nome, foto e bio.',
        },
        {
          valor: 'account',
          gatilho: 'Conta',
          painel: 'Configurações da conta — e-mail, idioma e fuso.',
        },
        {
          valor: 'security',
          gatilho: 'Segurança',
          painel: 'Configurações de segurança — senha e 2FA.',
        },
      ],
    }),
  );
}

/**
 * Outra aba de partida: `default-value` é o que decide quem nasce ativa, e ele
 * aponta para o `value`, nunca para a posição na lista.
 */
export function tabsAbaAtivaSource(): string {
  return vueSnippet(
    IMPORT,
    tabs({
      raiz: 'default-value="properties" class="nds-w-md"',
      rotuloLista: 'Seções do componente',
      abas: SECTIONS,
    }),
  );
}

/**
 * Aba indisponível: `disabled` no gatilho. O componente traduz isso para
 * `aria-disabled`, e não para o `disabled` nativo — a aba continua alcançável
 * pela seta, que é o que faz o leitor de tela anunciá-la como indisponível.
 */
export function tabsAbaDesabilitadaSource(): string {
  return vueSnippet(
    IMPORT,
    tabs({
      raiz: 'default-value="overview" class="nds-w-md"',
      rotuloLista: 'Seções do componente',
      abas: [
        SECTIONS[0],
        { ...SECTIONS[1], desabilitada: true },
        SECTIONS[2],
      ],
    }),
  );
}

/**
 * Controlado: o estado sai do componente e passa a viver na aplicação. É o
 * caminho para sincronizar com a URL, com o roteador ou com analytics.
 *
 * O evento entrega o valor cru; `String()` fecha a porta do tipo, porque o
 * `value` de uma aba também aceita número.
 */
export function tabsControlledSource(): string {
  const conjunto = tabs({
    raiz: ':model-value="aba" class="nds-w-full" @update:model-value="aba = String($event)"',
    rotuloLista: 'Seções do componente',
    abas: [
      {
        valor: 'overview',
        gatilho: 'Visão geral',
        painel: 'O estado vive fora do componente.',
      },
      {
        valor: 'properties',
        gatilho: 'Propriedades',
        painel: 'Útil para sincronizar com a URL ou com o roteador.',
      },
      {
        valor: 'examples',
        gatilho: 'Exemplos',
        painel: 'Permite registrar a troca de aba na mudança de valor.',
      },
    ],
  });
  return vueSnippet(
    `${IMPORT}
import { ref } from 'vue'

const aba = ref('overview')`,
    `<div class="nds-stack nds-w-md" data-spacing="sm">
  <p class="nds-text-caption nds-text-muted-foreground">
    Aba ativa: <code>{{ aba }}</code>
  </p>
${indentar(conjunto)}
</div>`,
  );
}

/**
 * Ícone à esquerda do rótulo. Ele é decorativo — `aria-hidden` o tira da árvore,
 * e o texto do gatilho continua sendo o nome acessível inteiro da aba. Um ícone
 * anunciado viraria um segundo pedaço de nome, sem acrescentar informação.
 */
export function tabsWithIconsSource(): string {
  const icone = (nome: string) => `<${nome} class="nds-size-4" aria-hidden="true" />`;
  return vueSnippet(
    `${IMPORT}
import { Code2, Eye, Settings2 } from 'lucide-vue-next'`,
    tabs({
      raiz: 'default-value="preview" class="nds-w-md"',
      lista: 'variant="line"',
      rotuloLista: 'Modos de visualização',
      abas: [
        {
          valor: 'preview',
          gatilho: `${icone('Eye')}\nPreview`,
          painel: 'Visualização renderizada do componente.',
        },
        {
          valor: 'code',
          gatilho: `${icone('Code2')}\nCódigo`,
          painel: 'Trecho copiável do componente.',
        },
        {
          valor: 'settings',
          gatilho: `${icone('Settings2')}\nAjustes`,
          painel: 'Ajustes de tema, idioma e variantes.',
        },
      ],
    }),
  );
}

/**
 * Contador na aba: o número entra DENTRO do gatilho, e por isso vira parte do
 * nome acessível ("Caixa de entrada 12"). `as="span"` é o que impede o contador
 * de virar um segundo alvo de foco dentro de um controle que já é focável.
 */
export function tabsWithCounterSource(): string {
  return vueSnippet(
    `${IMPORT}
import { Badge } from '@/components/ui/badge'`,
    tabs({
      raiz: 'default-value="inbox" class="nds-w-md"',
      rotuloLista: 'Caixas de mensagem',
      abas: [
        {
          valor: 'inbox',
          gatilho: 'Caixa de entrada\n<Badge as="span">12</Badge>',
          painel: 'Mensagens recebidas.',
        },
        {
          valor: 'spam',
          gatilho: 'Spam\n<Badge as="span" variant="destructive">3</Badge>',
          painel: 'Mensagens marcadas como spam.',
        },
        { valor: 'trash', gatilho: 'Lixeira', painel: 'Mensagens excluídas.' },
      ],
    }),
  );
}

/**
 * Tela de configurações: o eixo vertical com lista lateral e painel extenso à
 * direita. Aqui o painel deixa de ser uma linha de texto e ganha título próprio,
 * então a cor atenuada desce para o parágrafo — título em `--foreground`.
 */
export function tabsConfigVerticaisSource(): string {
  const icone = (nome: string) => `<${nome} class="nds-size-4" aria-hidden="true" />`;
  const painel = (titulo: string, texto: string) =>
    `<h3 class="nds-font-medium nds-text-foreground">${titulo}</h3>\n<p class="nds-mt-1 nds-text-muted-foreground">${texto}</p>`;
  return vueSnippet(
    `${IMPORT}
import { Settings2, Shield, User } from 'lucide-vue-next'`,
    tabs({
      raiz: 'default-value="profile" orientation="vertical" class="nds-w-lg"',
      rotuloLista: 'Configurações da conta',
      classePainel: 'nds-text-body nds-pl-4',
      abas: [
        {
          valor: 'profile',
          gatilho: `${icone('User')}\nPerfil`,
          painel: painel('Perfil público', 'Nome, foto e bio visíveis para outros usuários.'),
        },
        {
          valor: 'account',
          gatilho: `${icone('Settings2')}\nConta`,
          painel: painel('Conta', 'E-mail, idioma e preferências regionais.'),
        },
        {
          valor: 'security',
          gatilho: `${icone('Shield')}\nSegurança`,
          painel: painel('Segurança', 'Senha, autenticação em dois fatores e sessões.'),
        },
      ],
    }),
  );
}

/**
 * Modo manual: a seta move o foco e Enter/Espaço ativa. Vale quando trocar de
 * painel custa caro — busca de dados, render pesado —, porque no modo automático
 * atravessar a lista com a seta dispararia uma troca por aba percorrida.
 */
export function tabsModeManualSource(): string {
  return vueSnippet(
    IMPORT,
    tabs({
      raiz: 'default-value="overview" activation-mode="manual" class="nds-w-md"',
      rotuloLista: 'Seções do componente',
      abas: [
        {
          valor: 'overview',
          gatilho: 'Visão geral',
          painel: 'A seta move o foco; Enter ou Espaço ativa a aba focada.',
        },
        {
          valor: 'properties',
          gatilho: 'Propriedades',
          painel: 'Indicado quando trocar de aba tem custo.',
        },
        { valor: 'examples', gatilho: 'Exemplos', painel: 'Exemplos de uso.' },
      ],
    }),
  );
}
