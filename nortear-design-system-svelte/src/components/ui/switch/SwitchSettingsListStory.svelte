<script lang="ts">
  import { Switch } from './index';
  import { Label } from '@/components/ui/label';

  interface Preferencia {
    id: string;
    label: string;
    desc: string;
    checked?: boolean;
  }

  interface Props {
    titulo?: string;
    preferencias?: Preferencia[];
  }

  /** Mesmas três preferências que a docs page e o snippet mostram. */
  let {
    titulo = 'Preferências de notificação',
    preferencias = [
      { id: 'pref-email', label: 'Receber novidades por email', desc: 'Resumo semanal sobre o produto.', checked: true },
      { id: 'pref-push', label: 'Receber notificações push', desc: 'Alertas no dispositivo em tempo real.' },
      { id: 'pref-sms', label: 'Alertas por SMS', desc: 'Eventos críticos via mensagem de texto.' },
    ],
  }: Props = $props();
</script>

<!-- fieldset + legend, e não div + p: os três interruptores são UM grupo, e só
     o fieldset carrega esse agrupamento para a árvore de acessibilidade — a
     legend passa a nomear o grupo e é anunciada junto de cada controle
     (WCAG 1.3.1). Um <p> é só texto ao lado, e deixa os três soltos. -->
<fieldset class="nds-border-none nds-p-0 nds-m-0 nds-w-md">
  <legend class="nds-text-body nds-font-semibold nds-mb-2">{titulo}</legend>
  <!-- O nds-stack mora num div INTERNO: fieldset com display flex/grid tem
       histórico de bug de layout em navegador. -->
  <div class="nds-stack" data-spacing="sm">
    {#each preferencias as item (item.id)}
      <div
        class="nds-cluster nds-rounded-lg nds-border-default nds-p-4"
        data-align="center"
        data-justify="between"
      >
        <div class="nds-stack nds-pr-4" data-spacing="xs">
          <!-- A descrição fica FORA do Label: dentro dele entraria no nome
               acessível, e a frase inteira seria anunciada a cada passagem. -->
          <Label id="{item.id}-label" for={item.id} class="nds-text-body nds-font-medium">
            {item.label}
          </Label>
          <p class="nds-text-body">{item.desc}</p>
        </div>
        <Switch id={item.id} checked={item.checked ?? false} aria-labelledby="{item.id}-label" />
      </div>
    {/each}
  </div>
</fieldset>
