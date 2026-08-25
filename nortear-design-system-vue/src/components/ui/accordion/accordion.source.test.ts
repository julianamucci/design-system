import { describe, expect, it } from 'vitest';
import {
  defaultAccordionOpenSource,
  accordionOpenSource,
  accordionWithBadgeSource,
  accordionWithIconSource,
  accordionContentRichSource,
  accordionControlledSource,
  accordionDisabledSource,
  accordionFaqSource,
  segundoClickAccordionCloseSource,
  accordionClosedSource,
  accordionFocusVisibleSource,
  accordionMultipleSource,
  accordionSingleSource,
  accordionSource,
} from './accordion.source';

describe('accordionSource', () => {
  it('sem args, entrega a forma canônica no modo único', () => {
    expect(accordionSource()).toBe(
      `<script setup lang="ts">
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
</script>

<template>
  <Accordion type="single" default-value="item-1" class="nds-max-w-lg">
    <AccordionItem value="item-1">
      <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
      <AccordionContent>
        Acesse a tela de login e clique em "Esqueci minha senha". Você receberá
        um link de redefinição no email cadastrado, válido por 24 horas.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-2">
      <AccordionTrigger>Quais formas de pagamento são aceitas?</AccordionTrigger>
      <AccordionContent>
        Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento
        disponível em até 12 vezes sem juros no cartão.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-3">
      <AccordionTrigger>Como cancelo minha assinatura?</AccordionTrigger>
      <AccordionContent>
        Você pode cancelar a qualquer momento em Configuracoes → Assinatura.
        O acesso permanece ativo até o fim do período já pago.
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</template>`,
    );
  });

  it('o modo acompanha o control, porque a prop é obrigatória', () => {
    expect(accordionSource('', { args: { type: 'multiple' } })).toContain(
      '<Accordion type="multiple"',
    );
  });

  it('não escreve os padrões do componente — repetir padrão ensina ruído', () => {
    const saida = accordionSource('', {
      args: { disabled: false, unmountOnHide: false },
    });
    expect(saida).not.toContain('disabled');
    expect(saida).not.toContain('unmount-on-hide');
  });

  it('o que difere do padrão entra, e o booleano vai na forma curta', () => {
    const saida = accordionSource('', {
      args: { disabled: true, unmountOnHide: true },
    });
    expect(saida).toContain(' disabled');
    // Ligar isto desmonta o painel fechado e mata a busca do navegador; o
    // snippet mostra a prop, e não `:unmount-on-hide="true"`.
    expect(saida).toContain(' unmount-on-hide');
    expect(saida).not.toContain(':unmount-on-hide=');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = accordionSource('', {
      args: { type: (() => {}) as never, disabled: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    // O modo cai no padrão em vez de sumir: sem `type` a raiz não monta.
    expect(saida).toContain('<Accordion type="single"');
  });
});

describe('transforms das stories de variante', () => {
  it('o modo múltiplo não traz valor inicial: cada item abre por si', () => {
    const saida = accordionMultipleSource();
    expect(saida).toContain('<Accordion type="multiple" class="nds-max-w-lg">');
    expect(saida).not.toContain('default-value');
  });

  it('o fechar no segundo clique não tem chave a ligar', () => {
    const saida = segundoClickAccordionCloseSource();
    expect(saida).toContain('<Accordion type="single" class="nds-max-w-lg">');
    // A prop existe na lib por baixo, mas está fora da API pública: escrevê-la
    // aqui ensinaria que o comportamento depende dela.
    expect(saida).not.toContain('collapsible');
    expect(saida).not.toContain('default-value');
  });

  it('o controlado leva o estado para fora, com o par de vínculo aberto', () => {
    const saida = accordionControlledSource();
    expect(saida).toContain(`import { ref } from 'vue'`);
    expect(saida).toContain(`const aberto = ref('item-1')`);
    expect(saida).toContain(':model-value="aberto"');
    expect(saida).toContain('@update:model-value="aberto = $event"');
  });

  it('o valor inicial contrasta um item aberto com um fechado', () => {
    const saida = defaultAccordionOpenSource();
    expect(saida).toContain('default-value="item-1"');
    expect(saida).toContain('Item fechado por padrão');
  });

  it('o modo único abre o primeiro e mantém os três itens', () => {
    const saida = accordionSingleSource();
    expect(saida).toContain('<Accordion type="single" default-value="item-1"');
    expect(saida.match(/<AccordionItem /g)).toHaveLength(3);
  });
});

describe('transforms das stories de estado', () => {
  it('o fechado é a ausência de valor inicial, não um atributo', () => {
    const saida = accordionClosedSource();
    expect(saida).toContain('<Accordion type="single" class="nds-max-w-lg">');
    expect(saida).not.toContain('default-value');
    // O painel fechado permanece no documento por decisão do componente; não
    // há prop a escrever, e escrever uma ensinaria o contrário.
    expect(saida).not.toContain('hidden');
  });

  it('o aberto vem do valor inicial da raiz', () => {
    expect(accordionOpenSource()).toContain('default-value="item-1"');
  });

  it('o desabilitado mora no ITEM, não na raiz', () => {
    const saida = accordionDisabledSource();
    expect(saida).toContain('<AccordionItem value="item-2" disabled>');
    expect(saida).toContain('<Accordion type="single" class="nds-max-w-lg">');
  });

  it('o foco não tem nada a configurar: são dois itens e mais nada', () => {
    const saida = accordionFocusVisibleSource();
    expect(saida.match(/<AccordionItem /g)).toHaveLength(2);
    expect(saida).not.toContain('tabindex');
  });
});

describe('transforms das stories de composição', () => {
  it('o ícone do gatilho sai da árvore de acessibilidade', () => {
    const saida = accordionWithIconSource();
    expect(saida).toContain(`import { AlertTriangle, CheckCircle, Info } from 'lucide-vue-next'`);
    const icons = [...saida.matchAll(/<(Info|AlertTriangle|CheckCircle) /g)];
    expect(icons).toHaveLength(3);
    // O nome do gatilho já é o texto ao lado; um ícone anunciado repetiria a
    // categoria em toda leitura.
    expect(saida.match(/aria-hidden="true"/g)).toHaveLength(3);
  });

  it('o selo entra depois do rótulo e omite a variante padrão', () => {
    const saida = accordionWithBadgeSource();
    expect(saida).toContain(`import { Badge } from '@/components/ui/badge'`);
    expect(saida).toContain('<Badge>Novo</Badge>');
    expect(saida).toContain('<Badge variant="info">Beta</Badge>');
    expect(saida).not.toContain('variant="default"');
  });

  it('o conteúdo rico é tabela de verdade dentro do painel', () => {
    const saida = accordionContentRichSource();
    // `.nds-grid[data-cols="2"]` pede 18rem por coluna e colapsa nesta largura.
    expect(saida).toContain('<table class="nds-w-full nds-text-body nds-border-collapse">');
    expect(saida).not.toContain('nds-grid');
    expect(saida).toContain('<Accordion type="multiple"');
  });

  it('o FAQ monta os itens a partir de dados', () => {
    const saida = accordionFaqSource();
    expect(saida).toContain('v-for="p in perguntas" :key="p.valor" :value="p.valor"');
    expect(saida).toContain('<AccordionTrigger>{{ p.pergunta }}</AccordionTrigger>');
    const values = [...saida.matchAll(/^ {4}valor: '([^']+)',$/gm)].map((m) => m[1]);
    expect(values).toHaveLength(3);
    // Valor repetido faria dois itens abrirem juntos no modo único.
    expect(new Set(values).size).toBe(values.length);
  });
});
