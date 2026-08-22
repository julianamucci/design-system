/**
 * Transforms do painel Code do Collapsible.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * As três peças andam juntas: raiz, gatilho e painel. O gatilho É o botão — não
 * há um `<Button>` por dentro recebendo comportamento —, então quem quer a
 * aparência do botão passa as classes de `buttonVariants` no próprio gatilho, e
 * é ele que carrega `aria-expanded` e `aria-controls` sem código de ligação.
 */
import { attrs, jsxSnippet, propBool, type SourceTransform } from '@/lib/story-source';

export type CollapsibleArgs = {
  defaultOpen: boolean;
  disabled: boolean;
};

/**
 * Cabeçalho parametrizado: `ofButton` cresce quando a composição também usa o
 * `<Button>`, e `icones` quando o gatilho leva mais de um ícone. Duas linhas de
 * import do mesmo módulo compilam, mas ninguém escreve assim.
 */
function importes(ofButton = 'buttonVariants', icones = 'ChevronDown'): string {
  return `import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ${ofButton} } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ${icones} } from "lucide-react";`;
}

const IMPORTS = importes();

/** Markup alinhado ao Vanilla, a referência cross-stack deste design system. */
const ROOT_CLASSES = 'nds-w-sm';
const TRIGGER_CLASSES = 'nds-cluster nds-w-full nds-px-4';
const PAINEL_CLASSES =
  'nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2';
/** `nds-chevron` é quem gira 180° a partir do estado escrito no gatilho. */
const CHEVRON_CLASSES = 'nds-icon nds-shrink-0 nds-transition-transform nds-chevron';

/**
 * Corpo do gatilho e do painel, que não mudam entre as stories: rótulo à
 * esquerda, seta decorativa à direita (`data-justify="between"`), conteúdo
 * empilhado abaixo.
 */
function corpo(
  rotulo: string,
  variante: 'ghost' | 'outline',
  atributosDoTrigger = '',
  itens: readonly string[] = ['Filtro avançado 1', 'Filtro avançado 2'],
): string {
  return `  <CollapsibleTrigger
    className={cn(buttonVariants({ variant: "${variante}" }), "${TRIGGER_CLASSES}")}
    data-justify="between"${atributosDoTrigger}
  >
    <span>${rotulo}</span>
    <ChevronDown
      aria-hidden="true"
      className="${CHEVRON_CLASSES}"
    />
  </CollapsibleTrigger>
  <CollapsibleContent
    className="${PAINEL_CLASSES}"
    data-spacing="sm"
  >
${itens.map((item) => `    <p>${item}</p>`).join('\n')}
  </CollapsibleContent>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls do
 * Playground; sem args cai no uso canônico, que é o não-controlado fechado.
 *
 * `disabled` vai no GATILHO, não na raiz: é o botão que deixa de responder, e é
 * nele que a lib escreve o estado que o CSS lê.
 */
export const collapsibleSource: SourceTransform<CollapsibleArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const aberto = args.defaultOpen === true;
  return jsxSnippet(
    IMPORTS,
    `<Collapsible${attrs(propBool('defaultOpen', args.defaultOpen))} className="${ROOT_CLASSES}">
${corpo(
  aberto ? 'Ocultar filtros avançados' : 'Exibir filtros avançados',
  'ghost',
  propBool('disabled', args.disabled) ? '\n    disabled' : '',
)}
</Collapsible>`,
  );
};

/**
 * Começa expandido. `defaultOpen` é prop de MONTAGEM: define o ponto de partida
 * e não trava o painel — o gatilho continua alternando depois disso.
 */
export function defaultCollapsibleOpenSource(): string {
  return jsxSnippet(
    IMPORTS,
    `<Collapsible defaultOpen className="${ROOT_CLASSES}">
${corpo('Ocultar filtros avançados', 'ghost')}
</Collapsible>`,
  );
}

/**
 * Modo controlado: quem guarda o estado é quem usa o componente, e a troca
 * volta pelo callback. O par `open` + `onOpenChange` é indivisível — só `open`
 * congela o painel, porque o clique no gatilho não tem para onde escrever.
 */
export function collapsibleControlledSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${importes('Button, buttonVariants')}`,
    `function FiltrosAvancados() {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="nds-stack ${ROOT_CLASSES}" data-spacing="sm">
      <div className="nds-cluster" data-spacing="sm">
        <Button size="sm" variant="outline" onClick={() => setAberto(true)}>
          Abrir pelo estado externo
        </Button>
        <Button size="sm" variant="outline" onClick={() => setAberto(false)}>
          Fechar pelo estado externo
        </Button>
      </div>
      <Collapsible open={aberto} onOpenChange={setAberto} className="nds-w-full">
        <CollapsibleTrigger
          className={cn(buttonVariants({ variant: "ghost" }), "${TRIGGER_CLASSES}")}
          data-justify="between"
        >
          <span>{aberto ? "Ocultar filtros avançados" : "Exibir filtros avançados"}</span>
          <ChevronDown
            aria-hidden="true"
            className="${CHEVRON_CLASSES}"
          />
        </CollapsibleTrigger>
        <CollapsibleContent
          className="${PAINEL_CLASSES}"
          data-spacing="sm"
        >
          <p>Filtro avançado 1</p>
          <p>Filtro avançado 2</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}`,
  );
}

/**
 * Desabilitado: a seta perde a transição de rotação porque não há mais estado
 * para animar, e o gatilho continua alcançável pelo teclado — ele é anunciado
 * como indisponível em vez de sumir da navegação.
 */
export function collapsibleDisabledSource(): string {
  return jsxSnippet(
    IMPORTS,
    `<Collapsible className="${ROOT_CLASSES}">
  <CollapsibleTrigger
    className={cn(buttonVariants({ variant: "ghost" }), "${TRIGGER_CLASSES}")}
    data-justify="between"
    disabled
  >
    <span>Filtros avançados (desabilitado)</span>
    <ChevronDown aria-hidden="true" className="nds-icon nds-shrink-0" />
  </CollapsibleTrigger>
  <CollapsibleContent
    className="${PAINEL_CLASSES}"
    data-spacing="sm"
  >
    <p>Filtro avançado 1</p>
    <p>Filtro avançado 2</p>
  </CollapsibleContent>
</Collapsible>`,
  );
}

/**
 * Gatilho com a aparência de botão de contorno. A variante é o assunto da story
 * e não cabe nos args da raiz — quem a recebe é o gatilho.
 */
export function collapsibleWithButtonSource(): string {
  return jsxSnippet(
    IMPORTS,
    `<Collapsible className="${ROOT_CLASSES}">
${corpo('Exibir opções avançadas', 'outline', '', [
  'Opção avançada 1',
  'Opção avançada 2',
  'Opção avançada 3',
])}
</Collapsible>`,
  );
}

/**
 * Ícone à esquerda do rótulo: os DOIS ícones saem da árvore de acessibilidade,
 * senão o nome do gatilho ganharia ruído — quem nomeia é o texto.
 */
export function collapsibleWithIconSource(): string {
  return jsxSnippet(
    importes('buttonVariants', 'ChevronDown, SlidersHorizontal'),
    `<Collapsible className="${ROOT_CLASSES}">
  <CollapsibleTrigger
    className={cn(buttonVariants({ variant: "ghost" }), "${TRIGGER_CLASSES}")}
    data-justify="between"
  >
    <span className="nds-cluster" data-spacing="sm">
      <SlidersHorizontal
        aria-hidden="true"
        className="nds-icon nds-shrink-0 nds-text-muted-foreground"
      />
      Filtros avançados
    </span>
    <ChevronDown
      aria-hidden="true"
      className="${CHEVRON_CLASSES}"
    />
  </CollapsibleTrigger>
  <CollapsibleContent
    className="${PAINEL_CLASSES}"
    data-spacing="sm"
  >
    <p className="nds-text-muted-foreground">Filtro avançado 1</p>
    <p className="nds-text-muted-foreground">Filtro avançado 2</p>
  </CollapsibleContent>
</Collapsible>`,
  );
}

/**
 * Cabeçalho fixo com gatilho só de ícone. Aqui o gatilho sai de dentro do
 * cabeçalho visível e o painel fica abaixo dele: sem texto próprio, o nome
 * acessível PRECISA vir de `aria-label`, porque a seta é decorativa.
 */
export function collapsibleEstruturadoSource(): string {
  return jsxSnippet(
    IMPORTS,
    `<Collapsible className="nds-stack ${ROOT_CLASSES}" data-spacing="sm">
  <div
    className="nds-cluster nds-rounded-md nds-border-default nds-bg-card nds-px-4 nds-py-2"
    data-align="center"
    data-justify="between"
  >
    <span className="nds-flex-1 nds-text-body nds-font-medium">Filtro básico ativo</span>
    <CollapsibleTrigger
      className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
      aria-label="Exibir filtros avançados"
    >
      <ChevronDown
        aria-hidden="true"
        className="${CHEVRON_CLASSES}"
      />
    </CollapsibleTrigger>
  </div>
  <CollapsibleContent
    className="${PAINEL_CLASSES}"
    data-spacing="sm"
  >
    <p className="nds-text-muted-foreground">Filtro avançado 1</p>
    <p className="nds-text-muted-foreground">Filtro avançado 2</p>
  </CollapsibleContent>
</Collapsible>`,
  );
}
