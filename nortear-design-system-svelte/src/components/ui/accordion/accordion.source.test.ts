import { describe, expect, it } from 'vitest';
import {
  accordionOpenSource,
  accordionWithBadgeSource,
  accordionWithIconSource,
  accordionContentRichSource,
  accordionControlledSource,
  accordionFaqSource,
  segundoClickAccordionFechaSource,
  accordionClosedSource,
  accordionItemDisabledSource,
  accordionMultiploSource,
  accordionSource,
} from './accordion.source';

describe('accordionSource', () => {
  it('sem args, entrega a forma canônica no modo único e com um item aberto', () => {
    expect(accordionSource()).toBe(
      `<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion";

  let value = $state("item-1");
</script>

<Accordion type="single" bind:value class="nds-max-w-lg">
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
  });

  it('o control de modo troca também o formato do valor', () => {
    // No modo múltiplo o valor é uma lista: mostrar `"item-1"` ali ensinaria a
    // atribuir o tipo errado.
    const multiplo = accordionSource('', { args: { type: 'multiple' } });
    expect(multiplo).toContain('type="multiple"');
    expect(multiplo).toContain('$state(["item-1"])');
    expect(accordionSource('', { args: { type: 'single' } })).toContain('$state("item-1")');
  });

  it('só escreve disabled quando o valor difere do padrão', () => {
    expect(accordionSource('', { args: { disabled: false } })).not.toContain('disabled');
    expect(accordionSource('', { args: { disabled: true } })).toContain('disabled');
  });

  it('só escreve loop quando o valor difere do padrão', () => {
    expect(accordionSource('', { args: { loop: true } })).not.toContain('loop');
    expect(accordionSource('', { args: { loop: false } })).toContain('loop={false}');
  });
});

describe('transforms das stories de modo', () => {
  it('o fechar-no-segundo-clique nasce sem valor inicial e sem chave extra', () => {
    const output = segundoClickAccordionFechaSource();
    expect(output).toContain('<Accordion type="single" class="nds-max-w-lg">');
    expect(output).not.toContain('bind:value');
    expect(output).not.toContain('$state');
  });

  it('o modo múltiplo mantém o valor como lista', () => {
    const output = accordionMultiploSource();
    expect(output).toContain('type="multiple"');
    expect(output).toContain('$state<string[]>([])');
  });

  it('o modo controlado passa value e o callback de mudança', () => {
    const output = accordionControlledSource();
    expect(output).toContain('value={itemAtivo}');
    expect(output).toContain('onValueChange=');
    expect(output).not.toContain('bind:value');
  });
});

describe('transforms das stories de estado', () => {
  it('o estado fechado não traz valor inicial nenhum', () => {
    const output = accordionClosedSource();
    expect(output).not.toContain('bind:value');
    expect(output).toContain('Item fechado (estado padrão)');
  });

  it('o estado aberto expande pelo valor inicial', () => {
    const output = accordionOpenSource();
    expect(output).toContain('let value = $state("item-1");');
    expect(output).toContain('bind:value');
  });

  it('a prop disabled vai no item, e só ele para de responder', () => {
    const output = accordionItemDisabledSource();
    expect(output).toContain('<AccordionItem value="item-2" disabled>');
    expect(output).toContain('<AccordionItem value="item-1">');
  });
});

describe('transforms das stories de composição', () => {
  it('o ícone do gatilho vai com aria-hidden — o texto é o nome acessível', () => {
    const output = accordionWithIconSource();
    expect(output).toContain('aria-hidden="true"');
    expect(output).toContain('@lucide/svelte/icons/info');
  });

  it('o badge do gatilho vem do próprio design system', () => {
    const output = accordionWithBadgeSource();
    expect(output).toContain('from "@/components/ui/badge"');
    expect(output).toContain('<Badge>Novo</Badge>');
    expect(output).toContain('<Badge variant="info">Beta</Badge>');
  });

  it('o conteúdo rico mostra que o painel aceita qualquer marcação', () => {
    const output = accordionContentRichSource();
    expect(output).toContain('type="multiple"');
    expect(output).toContain('<table');
    expect(output).toContain('<ul');
  });

  it('o padrão FAQ traz o título da seção junto das perguntas', () => {
    const output = accordionFaqSource();
    expect(output).toContain('<h2 class="nds-text-base nds-font-semibold">Perguntas frequentes</h2>');
    expect(output.match(/<AccordionItem /g)).toHaveLength(3);
  });
});
