<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from './index';

  const items = [
    { value: 'senha',        q: 'Como faço para redefinir minha senha?',   a: 'Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um link de redefinição no email cadastrado, válido por 24 horas.' },
    { value: 'pagamento',    q: 'Quais formas de pagamento são aceitas?',   a: 'Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento disponível em até 12 vezes sem juros no cartão.' },
    { value: 'cancelamento', q: 'Como cancelo minha assinatura?',          a: 'Você pode cancelar a qualquer momento em Configurações → Assinatura. O acesso permanece ativo até o fim do período já pago.' },
    { value: 'dados',        q: 'Onde encontro meus dados de acesso?',     a: 'Seus dados de acesso estão disponíveis em Configurações → Conta.' },
  ];
</script>

<div class="w-full max-w-lg space-y-2">
  <h2 class="text-base font-semibold">Perguntas frequentes</h2>
  <Accordion type="single">
    {#each items as item (item.value)}
      <AccordionItem value={item.value}>
        <AccordionTrigger>{item.q}</AccordionTrigger>
        <AccordionContent>{item.a}</AccordionContent>
      </AccordionItem>
    {/each}
  </Accordion>
</div>
