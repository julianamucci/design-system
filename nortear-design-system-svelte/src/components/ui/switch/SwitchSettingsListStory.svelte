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

<div class="nds-stack nds-w-md" data-spacing="sm">
  <p class="nds-text-body nds-font-semibold nds-mb-2">{titulo}</p>
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
