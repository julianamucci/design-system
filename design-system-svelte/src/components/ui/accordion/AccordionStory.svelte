<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from './index';

  interface FAQItem {
    value: string;
    q: string;
    a: string;
  }

  interface Props {
    type?: 'single' | 'multiple';
    collapsible?: boolean;
    defaultValue?: string;
    items?: FAQItem[];
    disabledItem?: string;
    class?: string;
  }

  let {
    type = 'single',
    collapsible = true,
    defaultValue,
    items = [
      { value: 'item-1', q: 'Como faço para redefinir minha senha?', a: 'Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um link de redefinição no email cadastrado, válido por 24 horas.' },
      { value: 'item-2', q: 'Quais formas de pagamento são aceitas?', a: 'Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento disponível em até 12 vezes sem juros no cartão.' },
      { value: 'item-3', q: 'Como cancelo minha assinatura?', a: 'Você pode cancelar a qualquer momento em Configurações → Assinatura. O acesso permanece ativo até o fim do período já pago.' },
    ],
    disabledItem,
    class: className = 'w-full max-w-lg',
  }: Props = $props();
</script>

<Accordion {type} {collapsible} {defaultValue} class={className}>
  {#each items as item (item.value)}
    <AccordionItem value={item.value} disabled={disabledItem === item.value}>
      <AccordionTrigger>{item.q}</AccordionTrigger>
      <AccordionContent>{item.a}</AccordionContent>
    </AccordionItem>
  {/each}
</Accordion>
