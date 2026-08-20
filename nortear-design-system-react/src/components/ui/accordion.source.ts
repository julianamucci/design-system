/**
 * Transforms do painel Code do Accordion.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que o painel imprimia antes era a árvore do `render`: no FAQ, um `.map()`
 * sobre um array declarado dentro do arquivo de story; no controlado, um
 * componente de andaime que só existe ali. Colado, nada disso compila.
 */
import {
  attrsMultilinha,
  jsxSnippet,
  propBool,
  propOpcao,
  type SourceTransform,
} from '@/lib/story-source';

export type AccordionArgs = {
  multiple: boolean;
  disabled: boolean;
  orientation: 'vertical' | 'horizontal';
};

const ORIENTACOES = ['vertical', 'horizontal'] as const;

/**
 * As quatro peças sempre andam juntas: Root, Item, Trigger e Content. Importar
 * só o que o exemplo usa esconderia que o Item é obrigatório entre a raiz e o
 * par gatilho/painel.
 */
const IMPORT = `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";`;

type Pergunta = { value: string; pergunta: string; resposta: string };

const FAQ: Pergunta[] = [
  {
    value: 'item-1',
    pergunta: 'Como faço para redefinir minha senha?',
    resposta:
      'Acesse a tela de login e clique em “Esqueci minha senha”. Você receberá um link de redefinição no email cadastrado, válido por 24 horas.',
  },
  {
    value: 'item-2',
    pergunta: 'Quais formas de pagamento são aceitas?',
    resposta:
      'Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento disponível em até 12 vezes sem juros no cartão.',
  },
  {
    value: 'item-3',
    pergunta: 'Como cancelo minha assinatura?',
    resposta:
      'Você pode cancelar a qualquer momento em Configurações → Assinatura. O acesso permanece ativo até o fim do período já pago.',
  },
];

/**
 * Um item completo. O `value` é o que identifica o item para o estado da raiz —
 * sem ele o disclosure não sabe qual painel abrir, e é por isso que ele aparece
 * em todos os snippets, mesmo nos que não configuram mais nada.
 */
function item({ value, pergunta, resposta }: Pergunta, indentacao = '  '): string {
  return [
    `${indentacao}<AccordionItem value="${value}">`,
    `${indentacao}  <AccordionTrigger>${pergunta}</AccordionTrigger>`,
    `${indentacao}  <AccordionContent>${resposta}</AccordionContent>`,
    `${indentacao}</AccordionItem>`,
  ].join('\n');
}

function raiz(atributos: string, corpo: string): string {
  return `<Accordion${atributos}>\n${corpo}\n</Accordion>`;
}

/**
 * Transform do `meta` — vale para todas as stories dos quatro arquivos. Lê os
 * controls do Playground; nos arquivos que desligam os controls cai no padrão do
 * componente, que é o uso canônico: modo único, um item aberto na montagem.
 *
 * `multiple`, `disabled` e `orientation` só aparecem quando diferem do padrão —
 * repetir `multiple={false}` ensina ruído a quem copia.
 */
export const accordionSource: SourceTransform<AccordionArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const atributos = attrsMultilinha([
    propBool('multiple', args.multiple),
    propBool('disabled', args.disabled),
    propOpcao('orientation', args.orientation, ORIENTACOES, 'vertical'),
    'defaultValue={["item-1"]}',
    'className="nds-max-w-lg"',
  ]);
  return jsxSnippet(IMPORT, raiz(atributos, FAQ.map((p) => item(p)).join('\n')));
};

/**
 * Fechar clicando de novo, sem configuração nenhuma.
 *
 * O snippet do `meta` traz `defaultValue`, e é justamente a AUSÊNCIA dele que a
 * story mede: o comportamento não depende de nenhuma chave que quem consome
 * precise lembrar de ligar. Um snippet com props escondia o que a story prova.
 */
export function accordionSemConfiguracaoSource(): string {
  return jsxSnippet(IMPORT, raiz('', FAQ.slice(0, 2).map((p) => item(p)).join('\n')));
}

/**
 * Modo múltiplo: a prop `multiple` não está nos args deste arquivo (os controls
 * são desligados), então o snippet do `meta` mostraria o modo único.
 */
export function accordionMultiploSource(): string {
  const itens = [
    {
      value: 'especificacoes',
      pergunta: 'Especificações técnicas',
      resposta: 'CPU: Intel Core i7-12700, RAM: 16GB DDR5, SSD: 512GB NVMe',
    },
    {
      value: 'compatibilidade',
      pergunta: 'Compatibilidade',
      resposta: 'Windows 11, macOS 14+, Ubuntu 22.04 LTS',
    },
    {
      value: 'garantia',
      pergunta: 'Garantia e suporte',
      resposta: '24 meses de garantia de fábrica. Suporte técnico 24/7.',
    },
  ];
  return jsxSnippet(
    IMPORT,
    raiz(' multiple className="nds-max-w-lg"', itens.map((p) => item(p)).join('\n')),
  );
}

/**
 * Modo controlado: o estado sai do componente e passa a ser de quem consome.
 *
 * `value` é sempre um array, inclusive no modo único — quem lê precisa disso
 * para tipar o `useState`, e a árvore do `render` não mostrava o estado, só o
 * andaime que o guardava.
 */
export function accordionControladoSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORT}

const [abertos, setAbertos] = useState<string[]>(["item-1"]);`,
    raiz(
      attrsMultilinha([
        'value={abertos}',
        'onValueChange={setAbertos}',
        'className="nds-max-w-lg"',
      ]),
      [
        item({
          value: 'item-1',
          pergunta: 'Item 1 — controlado',
          resposta: 'Estado gerenciado externamente por value e onValueChange.',
        }),
        item({
          value: 'item-2',
          pergunta: 'Item 2 — controlado',
          resposta: 'Útil para sincronizar com a URL ou outro estado da aplicação.',
        }),
      ].join('\n'),
    ),
  );
}

/**
 * Estado fechado: um item só e nenhum `defaultValue`. A ausência É o assunto —
 * o snippet do `meta` abre o primeiro item e mostraria o oposto do que a story
 * documenta.
 */
export function accordionFechadoSource(): string {
  return jsxSnippet(
    IMPORT,
    raiz(
      ' className="nds-max-w-lg"',
      item({
        value: 'item-1',
        pergunta: 'Item fechado (estado padrão)',
        resposta: 'Conteúdo oculto.',
      }),
    ),
  );
}

/**
 * Desabilitado no ITEM, não na raiz.
 *
 * A raiz também aceita `disabled` (e é isso que o control do Playground liga),
 * mas o que a story documenta é a seção temporariamente indisponível ao lado de
 * outra que funciona — recorte que o snippet do `meta` não alcança.
 */
export function accordionItemDesabilitadoSource(): string {
  const habilitado = item({
    value: 'item-1',
    pergunta: 'Item habilitado',
    resposta: 'Este item funciona normalmente.',
  });
  const desabilitado = [
    '  <AccordionItem value="item-2" disabled>',
    '    <AccordionTrigger>Item desabilitado</AccordionTrigger>',
    '    <AccordionContent>Este conteúdo não pode ser acessado.</AccordionContent>',
    '  </AccordionItem>',
  ].join('\n');
  return jsxSnippet(
    IMPORT,
    raiz(' className="nds-max-w-lg"', `${habilitado}\n${desabilitado}`),
  );
}

/**
 * Ícone no gatilho: composição que os args não descrevem.
 *
 * O ícone sai da árvore de acessibilidade (`aria-hidden`) porque quem nomeia o
 * gatilho é o texto — o nome acessível tem que continuar sendo só o rótulo. O
 * respiro entre os dois é do `.nds-cluster`, nunca uma margem no ícone.
 */
export function accordionComIconeSource(): string {
  const linhas = [
    { value: 'info', icone: 'Info', cor: 'nds-text-info', rotulo: 'Informação',
      resposta: 'Ícones facilitam a identificação rápida do tipo de conteúdo.' },
    { value: 'warning', icone: 'AlertTriangle', cor: 'nds-text-warning', rotulo: 'Aviso',
      resposta: 'Sinalize categorias distintas com ícones semânticos.' },
    { value: 'success', icone: 'CheckCircle', cor: 'nds-text-success', rotulo: 'Confirmação',
      resposta: 'Use ícones consistentes entre itens do mesmo accordion.' },
  ];
  const corpo = linhas
    .map(({ value, icone, cor, rotulo, resposta }) =>
      [
        `  <AccordionItem value="${value}">`,
        '    <AccordionTrigger>',
        '      <span className="nds-cluster" data-spacing="sm">',
        `        <${icone} className="nds-icon ${cor} nds-shrink-0" aria-hidden="true" />`,
        `        ${rotulo}`,
        '      </span>',
        '    </AccordionTrigger>',
        `    <AccordionContent>${resposta}</AccordionContent>`,
        '  </AccordionItem>',
      ].join('\n'),
    )
    .join('\n');
  return jsxSnippet(
    `import { AlertTriangle, CheckCircle, Info } from "lucide-react";
${IMPORT}`,
    raiz(' className="nds-max-w-lg"', corpo),
  );
}

/**
 * Badge no gatilho: o badge é decorativo e entra depois do rótulo, então o
 * texto do gatilho continua autoexplicativo sozinho. Outra composição fora do
 * alcance dos args.
 */
export function accordionComBadgeSource(): string {
  const corpo = [
    { value: 'novo', rotulo: 'Novidades da versão 3.0', variante: 'default', badge: 'Novo',
      resposta: 'Use badges para sinalizar status sem alterar o gatilho textual.' },
    { value: 'beta', rotulo: 'Funcionalidades em beta', variante: 'secondary', badge: 'Beta',
      resposta: 'Funcionalidades beta podem mudar. Feedback é bem-vindo.' },
  ]
    .map(({ value, rotulo, variante, badge, resposta }) =>
      [
        `  <AccordionItem value="${value}">`,
        '    <AccordionTrigger>',
        '      <span className="nds-cluster" data-spacing="sm">',
        `        ${rotulo}`,
        `        <Badge variant="${variante}">${badge}</Badge>`,
        '      </span>',
        '    </AccordionTrigger>',
        `    <AccordionContent>${resposta}</AccordionContent>`,
        '  </AccordionItem>',
      ].join('\n'),
    )
    .join('\n');
  return jsxSnippet(
    `import { Badge } from "@/components/ui/badge";
${IMPORT}`,
    raiz(' className="nds-max-w-lg"', corpo),
  );
}

/**
 * Conteúdo rico: o painel aceita qualquer árvore React.
 *
 * Tabela de verdade, e não `.nds-grid[data-cols="2"]` — o grid exige 18rem por
 * coluna e colapsa dentro do accordion. É o detalhe que só se aprende vendo a
 * marcação, e o snippet do `meta` mostraria um parágrafo.
 */
export function accordionConteudoRicoSource(): string {
  const corpo = [
    '  <AccordionItem value="specs">',
    '    <AccordionTrigger>Especificações técnicas</AccordionTrigger>',
    '    <AccordionContent>',
    '      <table className="nds-w-full nds-text-body nds-border-collapse">',
    '        <tbody>',
    '          <tr className="nds-border-b">',
    '            <td className="nds-py-1 nds-pr-4">CPU</td>',
    '            <td className="nds-py-1">Intel Core i7-12700</td>',
    '          </tr>',
    '          <tr>',
    '            <td className="nds-py-1 nds-pr-4">RAM</td>',
    '            <td className="nds-py-1">16GB DDR5</td>',
    '          </tr>',
    '        </tbody>',
    '      </table>',
    '    </AccordionContent>',
    '  </AccordionItem>',
    '  <AccordionItem value="inclui">',
    '    <AccordionTrigger>O que está incluso</AccordionTrigger>',
    '    <AccordionContent>',
    '      <ul className="nds-stack nds-text-body nds-list-disc" data-spacing="xs">',
    '        <li>Cabo de alimentação</li>',
    '        <li>Manual do usuário</li>',
    '        <li>Garantia de 24 meses</li>',
    '      </ul>',
    '    </AccordionContent>',
    '  </AccordionItem>',
  ].join('\n');
  return jsxSnippet(IMPORT, raiz(' multiple className="nds-max-w-lg nds-text-body"', corpo));
}

/**
 * FAQ: o padrão canônico, e o caso em que o painel mais enganava — a story
 * itera um array declarado dentro do arquivo de story, invisível para quem
 * copiava. Aqui o array vem junto.
 *
 * O `h2` fora da raiz é de propósito: o accordion não emite cabeçalho de seção,
 * e sem ele a lista de perguntas fica sem título na navegação por headings.
 */
export function accordionFaqSource(): string {
  const dados = FAQ.map(
    ({ value, pergunta, resposta }) =>
      `  { value: "${value}", pergunta: "${pergunta}", resposta: "${resposta}" },`,
  ).join('\n');
  return jsxSnippet(
    `${IMPORT}

const perguntas = [
${dados}
];`,
    `<div className="nds-stack nds-w-cap-lg" data-spacing="sm">
  <h2 className="nds-text-base nds-font-semibold">Perguntas frequentes</h2>
  <Accordion>
    {perguntas.map(({ value, pergunta, resposta }) => (
      <AccordionItem key={value} value={value}>
        <AccordionTrigger>{pergunta}</AccordionTrigger>
        <AccordionContent>{resposta}</AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
</div>`,
  );
}
