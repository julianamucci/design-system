/**
 * Transforms do painel Code do Accordion.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

export type AccordionArgs = {
  type: 'single' | 'multiple';
  disabled: boolean;
  loop: boolean;
};

const IMPORT = `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";`;

/**
 * Forma canônica: raiz com o modo, itens com valor próprio e um item já aberto
 * na montagem. Serve o Playground e toda story cuja composição é essa.
 */
export function accordionSource(_gerado?: string, ctx?: { args?: Partial<AccordionArgs> }): string {
  const { type = 'single', disabled = false, loop = true } = ctx?.args ?? {};
  const inicial = type === 'multiple' ? '["item-1"]' : '"item-1"';
  const props = attrsMultilinha([
    `type="${type}"`,
    'bind:value',
    disabled ? 'disabled' : '',
    loop ? '' : 'loop={false}',
    'class="nds-max-w-lg"',
  ]);

  return svelteSnippet(
    `${IMPORT}

let value = $state(${inicial});`,
    `<Accordion${props}>
  <AccordionItem value="item-1">
    <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
    <AccordionContent>
      Acesse a tela de login e clique em "Esqueci minha senha".
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Quais formas de pagamento são aceitas?</AccordionTrigger>
    <AccordionContent>
      Aceitamos cartão de crédito, Pix e boleto bancário.
    </AccordionContent>
  </AccordionItem>
</Accordion>`,
  );
}

/**
 * Fechar clicando de novo no item aberto, sem nenhuma configuração extra: a
 * raiz nasce só com o modo, sem valor inicial e sem mais nenhuma chave.
 */
export function segundoClickSourceAccordionFecha(): string {
  return svelteSnippet(
    IMPORT,
    `<Accordion type="single" class="nds-max-w-lg">
  <AccordionItem value="item-1">
    <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
    <AccordionContent>
      Acesse a tela de login e clique em "Esqueci minha senha".
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Quais formas de pagamento são aceitas?</AccordionTrigger>
    <AccordionContent>
      Aceitamos cartão de crédito, Pix e boleto bancário.
    </AccordionContent>
  </AccordionItem>
</Accordion>`,
  );
}

/** Modo múltiplo: o valor é uma lista, e mais de um item fica aberto ao mesmo tempo. */
export function accordionMultiploSource(): string {
  return svelteSnippet(
    `${IMPORT}

let value = $state<string[]>([]);`,
    `<Accordion type="multiple" bind:value class="nds-max-w-lg">
  <AccordionItem value="especificacoes">
    <AccordionTrigger>Especificações técnicas</AccordionTrigger>
    <AccordionContent>
      CPU: Intel Core i7-12700, RAM: 16GB DDR5, SSD: 512GB NVMe
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="compatibilidade">
    <AccordionTrigger>Compatibilidade</AccordionTrigger>
    <AccordionContent>Windows 11, macOS 14+, Ubuntu 22.04 LTS</AccordionContent>
  </AccordionItem>
</Accordion>`,
  );
}

/**
 * Modo controlado: quem manda no item aberto é o estado de fora, e a mudança
 * chega pelo callback — dá para sincronizar com a URL ou com outro estado.
 */
export function accordionControladoSource(): string {
  return svelteSnippet(
    `${IMPORT}

let itemAtivo = $state("item-1");`,
    `<div class="nds-stack nds-w-lg" data-spacing="sm">
  <p class="nds-text-caption nds-text-muted-foreground">
    Item aberto: <code class="nds-font-mono">{itemAtivo || "nenhum"}</code>
  </p>
  <Accordion
    type="single"
    value={itemAtivo}
    onValueChange={(valor) => (itemAtivo = valor as string)}
  >
    <AccordionItem value="item-1">
      <AccordionTrigger>Item 1 — controlado</AccordionTrigger>
      <AccordionContent>
        Estado gerenciado externamente via valor inicial e callback de mudança.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-2">
      <AccordionTrigger>Item 2 — controlado</AccordionTrigger>
      <AccordionContent>
        Útil para sincronizar com URL ou outro estado da aplicação.
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</div>`,
  );
}

/** Estado fechado: sem valor inicial, todo item nasce colapsado. */
export function accordionFechadoSource(): string {
  return svelteSnippet(
    IMPORT,
    `<Accordion type="single" class="nds-max-w-lg">
  <AccordionItem value="item-1">
    <AccordionTrigger>Item fechado (estado padrão)</AccordionTrigger>
    <AccordionContent>Conteúdo oculto.</AccordionContent>
  </AccordionItem>
</Accordion>`,
  );
}

/** Estado aberto: o valor inicial expande o item já na montagem. */
export function accordionAbertoSource(): string {
  return svelteSnippet(
    `${IMPORT}

let value = $state("item-1");`,
    `<Accordion type="single" bind:value class="nds-max-w-lg">
  <AccordionItem value="item-1">
    <AccordionTrigger>Item aberto</AccordionTrigger>
    <AccordionContent>Conteúdo visível enquanto o item estiver expandido.</AccordionContent>
  </AccordionItem>
</Accordion>`,
  );
}

/** Item desabilitado: a prop vai no item, e só ele para de responder. */
export function accordionItemDesabilitadoSource(): string {
  return svelteSnippet(
    IMPORT,
    `<Accordion type="single" class="nds-max-w-lg">
  <AccordionItem value="item-1">
    <AccordionTrigger>Item habilitado</AccordionTrigger>
    <AccordionContent>Este item funciona normalmente.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2" disabled>
    <AccordionTrigger>Item desabilitado</AccordionTrigger>
    <AccordionContent>Este conteúdo não pode ser acessado.</AccordionContent>
  </AccordionItem>
</Accordion>`,
  );
}

/**
 * Ícone no gatilho: o texto continua sendo o nome acessível, então o ícone vai
 * com `aria-hidden` para não vazar para a árvore de acessibilidade.
 */
export function accordionComIconeSource(): string {
  return svelteSnippet(
    `${IMPORT}
import Info from "@lucide/svelte/icons/info";
import AlertTriangle from "@lucide/svelte/icons/triangle-alert";`,
    `<Accordion type="single" class="nds-max-w-lg">
  <AccordionItem value="info">
    <AccordionTrigger>
      <span class="nds-cluster" data-spacing="sm">
        <Info class="nds-icon nds-text-info nds-shrink-0" aria-hidden="true" />
        Informação
      </span>
    </AccordionTrigger>
    <AccordionContent>
      Ícones facilitam a identificação rápida do tipo de conteúdo.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="warning">
    <AccordionTrigger>
      <span class="nds-cluster" data-spacing="sm">
        <AlertTriangle class="nds-icon nds-text-warning nds-shrink-0" aria-hidden="true" />
        Aviso
      </span>
    </AccordionTrigger>
    <AccordionContent>
      Sinalize categorias distintas com ícones semânticos.
    </AccordionContent>
  </AccordionItem>
</Accordion>`,
  );
}

/**
 * Badge no gatilho: sinaliza status sem alterar o texto, que continua
 * autoexplicativo por si só.
 */
export function accordionComBadgeSource(): string {
  return svelteSnippet(
    `${IMPORT}
import { Badge } from "@/components/ui/badge";`,
    `<div class="nds-w-lg">
  <Accordion type="single">
    <AccordionItem value="novo">
      <AccordionTrigger>
        <span class="nds-cluster" data-spacing="sm">
          Novidades da versão 3.0
          <Badge>Novo</Badge>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        Use badges para sinalizar status sem alterar o trigger textual.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="beta">
      <AccordionTrigger>
        <span class="nds-cluster" data-spacing="sm">
          Funcionalidades em beta
          <Badge variant="secondary">Beta</Badge>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        Funcionalidades beta podem mudar. Feedback é bem-vindo.
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</div>`,
  );
}

/** Conteúdo rico: o painel aceita tabela, lista, qualquer marcação. */
export function accordionConteudoRicoSource(): string {
  return svelteSnippet(
    IMPORT,
    `<Accordion type="multiple" class="nds-max-w-lg nds-text-body">
  <AccordionItem value="specs">
    <AccordionTrigger>Especificações técnicas</AccordionTrigger>
    <AccordionContent>
      <table class="nds-w-full nds-text-body nds-border-collapse">
        <tbody>
          <tr class="nds-border-b">
            <td class="nds-py-1 nds-pr-4">CPU</td>
            <td class="nds-py-1">Intel Core i7-12700</td>
          </tr>
          <tr>
            <td class="nds-py-1 nds-pr-4">RAM</td>
            <td class="nds-py-1">16GB DDR5</td>
          </tr>
        </tbody>
      </table>
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="inclui">
    <AccordionTrigger>O que está incluso</AccordionTrigger>
    <AccordionContent>
      <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="xs">
        <li>Cabo de alimentação</li>
        <li>Manual do usuário</li>
        <li>Garantia de 24 meses</li>
      </ul>
    </AccordionContent>
  </AccordionItem>
</Accordion>`,
  );
}

/**
 * Padrão FAQ: perguntas interrogativas completas no gatilho e respostas
 * objetivas no painel, sob um título de seção.
 */
export function accordionFaqSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div class="nds-stack nds-w-lg" data-spacing="sm">
  <h2 class="nds-text-base nds-font-semibold">Perguntas frequentes</h2>
  <Accordion type="single">
    <AccordionItem value="senha">
      <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
      <AccordionContent>
        Acesse a tela de login e clique em "Esqueci minha senha". O link de
        redefinição vale por 24 horas.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="pagamento">
      <AccordionTrigger>Quais formas de pagamento são aceitas?</AccordionTrigger>
      <AccordionContent>
        Aceitamos cartão de crédito, Pix e boleto bancário.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="cancelamento">
      <AccordionTrigger>Como cancelo minha assinatura?</AccordionTrigger>
      <AccordionContent>
        Em Configurações → Assinatura. O acesso permanece ativo até o fim do
        período já pago.
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</div>`,
  );
}
