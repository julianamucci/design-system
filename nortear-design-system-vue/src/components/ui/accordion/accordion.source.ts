/**
 * Transforms do painel Code do Accordion.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 */
import {
  attr,
  attrBool,
  attrs,
  asCode,
  indentar,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type AccordionArgs = {
  type: 'single' | 'multiple';
  disabled: boolean;
  orientation: 'vertical' | 'horizontal';
  unmountOnHide: boolean;
};

const IMPORT = `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'`;

/**
 * A largura máxima faz parte da lição: o item ocupa a linha inteira, e sem um
 * teto a pergunta e a resposta esticam até a borda da tela.
 */
const LARGURA = 'class="nds-max-w-lg"';

/** Corpo de várias linhas dentro de uma tag que abre na coluna `recuo - 2`. */
function bloco(conteudo: string, recuo: number): string {
  return `\n${indentar(conteudo.trim(), recuo)}\n${' '.repeat(recuo - 2)}`;
}

/** Um item: o valor que o identifica, o gatilho e o painel. */
function item(valor: string, gatilho: string, conteudo: string, extra = ''): string {
  const g = gatilho.includes('\n') ? bloco(gatilho, 6) : gatilho;
  const c = conteudo.includes('\n') ? bloco(conteudo, 6) : conteudo;
  return `  <AccordionItem${attrs(`value="${valor}"`, extra)}>
    <AccordionTrigger>${g}</AccordionTrigger>
    <AccordionContent>${c}</AccordionContent>
  </AccordionItem>`;
}

/** Raiz + itens. `type` é obrigatório: é ele que decide um ou vários abertos. */
function acordeao(partes: Array<string | false | undefined>, itens: string[]): string {
  return `<Accordion${attrs(...partes)}>\n${itens.join('\n')}\n</Accordion>`;
}

const PERGUNTAS = [
  {
    valor: 'item-1',
    q: 'Como faço para redefinir minha senha?',
    a: `Acesse a tela de login e clique em "Esqueci minha senha". Você receberá
um link de redefinição no email cadastrado, válido por 24 horas.`,
  },
  {
    valor: 'item-2',
    q: 'Quais formas de pagamento são aceitas?',
    a: `Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento
disponível em até 12 vezes sem juros no cartão.`,
  },
  {
    valor: 'item-3',
    q: 'Como cancelo minha assinatura?',
    a: `Você pode cancelar a qualquer momento em Configuracoes → Assinatura.
O acesso permanece ativo até o fim do período já pago.`,
  },
];

/**
 * Forma canônica: a raiz declara o modo, cada item carrega o valor que o
 * identifica, e o par gatilho + painel mora dentro dele.
 *
 * `type` sai sempre, mesmo igual ao control: é prop obrigatória, e um snippet
 * sem ela não monta. O resto acompanha o padrão do componente — `orientation`
 * vertical, `disabled` desligado e o painel permanecendo montado ao fechar, que
 * é o que deixa a busca do navegador achar a resposta dentro do item.
 */
export const accordionSource: SourceTransform<AccordionArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return vueSnippet(
    IMPORT,
    acordeao(
      [
        attr('type', asCode(args.type) ?? 'single'),
        attr('orientation', args.orientation, 'vertical'),
        attrBool('disabled', args.disabled, false),
        attrBool('unmount-on-hide', args.unmountOnHide, false),
        'default-value="item-1"',
        LARGURA,
      ],
      PERGUNTAS.map((p) => item(p.valor, p.q, p.a)),
    ),
  );
};

const RESPOSTAS_CURTAS = [
  {
    valor: 'item-1',
    q: 'Como faço para redefinir minha senha?',
    a: `Acesse a tela de login e clique em "Esqueci minha senha". Você receberá
um link de redefinição no email cadastrado, válido por 24 horas.`,
  },
  {
    valor: 'item-2',
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Aceitamos cartão de crédito, Pix e boleto bancário.',
  },
  {
    valor: 'item-3',
    q: 'Como cancelo minha assinatura?',
    a: 'Você pode cancelar a qualquer momento em Configuracoes → Assinatura.',
  },
];

/** Modo único: um painel aberto por vez, e o primeiro já vem aberto. */
export function accordionSingleSource(): string {
  return vueSnippet(
    IMPORT,
    acordeao(
      ['type="single"', 'default-value="item-1"', LARGURA],
      RESPOSTAS_CURTAS.map((p) => item(p.valor, p.q, p.a)),
    ),
  );
}

/**
 * O fechar-ao-clicar-de-novo, sem nenhuma configuração.
 *
 * A ausência é o assunto: não há chave a ligar. Escrever uma prop aqui ensinaria
 * que o comportamento depende dela, e é justamente o contrário.
 */
export function segundoClickSourceAccordionClose(): string {
  return vueSnippet(
    IMPORT,
    acordeao(
      ['type="single"', LARGURA],
      [
        item(
          'item-1',
          'Como faço para redefinir minha senha?',
          'Acesse a tela de login e clique em "Esqueci minha senha".',
        ),
        item(
          'item-2',
          'Quais formas de pagamento são aceitas?',
          'Aceitamos cartão de crédito, Pix e boleto bancário.',
        ),
      ],
    ),
  );
}

/** Modo múltiplo: vários painéis abertos ao mesmo tempo, cada um por si. */
export function accordionMultipleSource(): string {
  return vueSnippet(
    IMPORT,
    acordeao(
      ['type="multiple"', LARGURA],
      [
        item(
          'especificacoes',
          'Especificações técnicas',
          'CPU: Intel Core i7-12700, RAM: 16GB DDR5, SSD: 512GB NVMe',
        ),
        item('compatibilidade', 'Compatibilidade', 'Windows 11, macOS 14+, Ubuntu 22.04 LTS'),
        item(
          'garantia',
          'Garantia e suporte',
          '24 meses de garantia de fábrica. Suporte técnico 24/7.',
        ),
      ],
    ),
  );
}

/**
 * Modo controlado: o item aberto passa a ser estado de quem consome, e o
 * componente só avisa da mudança. É o par `model-value` + `@update:model-value`
 * — o mesmo que `v-model`, escrito aberto para o vínculo ficar visível.
 */
export function accordionControladoSource(): string {
  return vueSnippet(
    `${IMPORT}
import { ref } from 'vue'

const aberto = ref('item-1')`,
    `<div class="nds-stack nds-w-lg" data-spacing="sm">
  <p class="nds-text-caption nds-text-muted-foreground">
    Item aberto: <code>{{ aberto || 'nenhum' }}</code>
  </p>
  <Accordion
    type="single"
    :model-value="aberto"
    class="nds-w-full"
    @update:model-value="aberto = $event"
  >
    <AccordionItem value="item-1">
      <AccordionTrigger>Item 1 — controlado</AccordionTrigger>
      <AccordionContent>Estado gerenciado fora do componente.</AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-2">
      <AccordionTrigger>Item 2 — controlado</AccordionTrigger>
      <AccordionContent>Útil para sincronizar com a URL ou outro estado da aplicação.</AccordionContent>
    </AccordionItem>
  </Accordion>
</div>`,
  );
}

/**
 * Valor inicial sem modo controlado: `default-value` só vale na montagem, e
 * daí em diante o estado é do próprio componente.
 */
export function defaultSourceAccordionOpen(): string {
  return vueSnippet(
    IMPORT,
    acordeao(
      ['type="single"', 'default-value="item-1"', LARGURA],
      [
        item(
          'item-1',
          'Item aberto por padrão',
          `Este item inicia expandido pelo valor inicial da raiz.
Não é modo controlado — o estado interno assume depois da montagem.`,
        ),
        item('item-2', 'Item fechado por padrão', 'Este item inicia colapsado.'),
      ],
    ),
  );
}

/**
 * Estado fechado, que é o de partida: nenhum valor inicial na raiz.
 *
 * O painel fechado continua no documento, e é isso que deixa a busca do
 * navegador achá-lo e abrir o item. Não há atributo a escrever — vem do
 * componente.
 */
export function accordionFechadoSource(): string {
  return vueSnippet(
    IMPORT,
    acordeao(
      ['type="single"', LARGURA],
      [item('item-1', 'Item fechado (estado padrão)', 'Conteúdo oculto.')],
    ),
  );
}

/** Estado aberto: o valor inicial da raiz aponta para o item. */
export function accordionAbertoSource(): string {
  return vueSnippet(
    IMPORT,
    acordeao(
      ['type="single"', 'default-value="item-1"', LARGURA],
      [
        item(
          'item-1',
          'Item aberto',
          'Conteúdo visível, e o chevron do gatilho aponta para cima.',
        ),
      ],
    ),
  );
}

/**
 * Desabilitado item a item: a prop mora no ITEM, não na raiz. Na raiz ela
 * desliga o acordeão inteiro de uma vez, que é outra decisão.
 */
export function accordionDisabledSource(): string {
  return vueSnippet(
    IMPORT,
    acordeao(
      ['type="single"', LARGURA],
      [
        item('item-1', 'Item habilitado', 'Este item funciona normalmente.'),
        item('item-2', 'Item desabilitado', 'Este conteúdo não pode ser acessado.', 'disabled'),
      ],
    ),
  );
}

/**
 * Foco de teclado: nada a configurar. O anel é do próprio gatilho, e a ordem de
 * tabulação sai da ordem dos itens.
 */
export function accordionFocusVisibleSource(): string {
  return vueSnippet(
    IMPORT,
    acordeao(
      ['type="single"', 'default-value="item-1"', LARGURA],
      [
        item(
          'item-1',
          'Navegar com Tab para ver o anel de foco',
          'Anel de foco visível ao navegar por teclado.',
        ),
        item('item-2', 'Segundo item', 'Tab move o foco para este gatilho.'),
      ],
    ),
  );
}

/**
 * Ícone no gatilho: ele é decorativo e sai da árvore de acessibilidade, porque
 * o nome do gatilho já é o texto ao lado. Um ícone anunciado repetiria a
 * categoria em toda leitura.
 */
export function accordionComIconeSource(): string {
  const comIcone = (icone: string, cor: string, rotulo: string) =>
    `<span class="nds-cluster" data-spacing="sm">
  <${icone} class="nds-icon ${cor} nds-shrink-0" aria-hidden="true" />
  ${rotulo}
</span>`;
  return vueSnippet(
    `${IMPORT}
import { AlertTriangle, CheckCircle, Info } from 'lucide-vue-next'`,
    acordeao(
      ['type="single"', LARGURA],
      [
        item(
          'info',
          comIcone('Info', 'nds-text-info', 'Informação'),
          'Ícones facilitam a identificação rápida do tipo de conteúdo.',
        ),
        item(
          'warning',
          comIcone('AlertTriangle', 'nds-text-warning', 'Aviso'),
          'Sinalize categorias distintas com ícones semânticos.',
        ),
        item(
          'success',
          comIcone('CheckCircle', 'nds-text-success', 'Confirmação'),
          'Use ícones consistentes entre os itens do mesmo acordeão.',
        ),
      ],
    ),
  );
}

/**
 * Selo no gatilho: sinaliza situação sem mudar o rótulo. O texto do gatilho
 * continua autoexplicativo sem ele.
 */
export function accordionComBadgeSource(): string {
  const comBadge = (rotulo: string, variante: string, selo: string) =>
    `<span class="nds-cluster" data-spacing="sm">
  ${rotulo}
  <Badge${attrs(attr('variant', variante, 'default'))}>${selo}</Badge>
</span>`;
  return vueSnippet(
    `${IMPORT}
import { Badge } from '@/components/ui/badge'`,
    acordeao(
      ['type="single"', LARGURA],
      [
        item(
          'novo',
          comBadge('Novidades da versão 3.0', 'default', 'Novo'),
          'Use selos para sinalizar situação sem alterar o rótulo do gatilho.',
        ),
        item(
          'beta',
          comBadge('Funcionalidades em beta', 'secondary', 'Beta'),
          'Funcionalidades em beta podem mudar. Comentários são bem-vindos.',
        ),
      ],
    ),
  );
}

/**
 * Conteúdo estruturado: o painel aceita marcação qualquer.
 *
 * A tabela é tabela de verdade, e não grade: `.nds-grid[data-cols="2"]` pede
 * 18rem por coluna e colapsa dentro da largura do acordeão.
 */
export function accordionConteudoRicoSource(): string {
  return vueSnippet(
    IMPORT,
    acordeao(
      ['type="multiple"', 'class="nds-max-w-lg nds-text-body"'],
      [
        item(
          'specs',
          'Especificações técnicas',
          `<table class="nds-w-full nds-text-body nds-border-collapse">
  <tbody>
    <tr class="nds-border-b">
      <td class="nds-py-1 nds-pr-4">CPU</td>
      <td class="nds-py-1">Intel Core i7-12700</td>
    </tr>
    <tr class="nds-border-b">
      <td class="nds-py-1 nds-pr-4">RAM</td>
      <td class="nds-py-1">16GB DDR5</td>
    </tr>
    <tr>
      <td class="nds-py-1 nds-pr-4">SSD</td>
      <td class="nds-py-1">512GB NVMe</td>
    </tr>
  </tbody>
</table>`,
        ),
        item(
          'inclui',
          'O que está incluso',
          `<ul class="nds-stack nds-text-body nds-list-disc" data-spacing="xs">
  <li>Cabo de alimentação</li>
  <li>Manual do usuário</li>
  <li>Garantia de 24 meses</li>
</ul>`,
        ),
      ],
    ),
  );
}

/**
 * Padrão de perguntas frequentes: os itens vêm de dados, não de marcação
 * repetida. A pergunta inteira vive no gatilho, e a resposta objetiva no painel.
 */
export function accordionFaqSource(): string {
  return vueSnippet(
    `${IMPORT}

const perguntas = [
  {
    valor: 'senha',
    pergunta: 'Como faço para redefinir minha senha?',
    resposta: 'Acesse a tela de login e clique em "Esqueci minha senha".',
  },
  {
    valor: 'pagamento',
    pergunta: 'Quais formas de pagamento são aceitas?',
    resposta: 'Aceitamos cartão de crédito, Pix e boleto bancário.',
  },
  {
    valor: 'cancelamento',
    pergunta: 'Como cancelo minha assinatura?',
    resposta: 'Você pode cancelar a qualquer momento em Configuracoes → Assinatura.',
  },
]`,
    `<div class="nds-stack nds-w-lg" data-spacing="sm">
  <h2 class="nds-text-base nds-font-semibold">Perguntas frequentes</h2>
  <Accordion type="single">
    <AccordionItem v-for="p in perguntas" :key="p.valor" :value="p.valor">
      <AccordionTrigger>{{ p.pergunta }}</AccordionTrigger>
      <AccordionContent>{{ p.resposta }}</AccordionContent>
    </AccordionItem>
  </Accordion>
</div>`,
  );
}
