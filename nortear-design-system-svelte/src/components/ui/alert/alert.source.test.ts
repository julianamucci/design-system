import { describe, expect, it } from 'vitest';
import {
  alertAvisoSource,
  alertClasseAdicionalSource,
  alertComAcaoSource,
  alertContrasteSource,
  alertDestrutivoSource,
  alertDismissivelSource,
  alertInformativoSource,
  alertInsercaoDinamicaSource,
  alertSemAnuncioSource,
  alertSemIconeSource,
  alertSemTituloSource,
  alertSource,
  alertSucessoSource,
} from './alert.source';

describe('alertSource', () => {
  it('sem args, entrega a forma canônica sem nenhum atributo padrão repetido', () => {
    expect(alertSource()).toBe(
      `<script lang="ts">
  import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
  import Info from "@lucide/svelte/icons/info";
</script>

<Alert>
  <Info class="nds-icon" aria-hidden="true" />
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
</Alert>`,
    );
  });

  it('só escreve variant quando o valor difere do padrão', () => {
    expect(alertSource('', { args: { variant: 'default' } })).not.toContain('variant');
    expect(alertSource('', { args: { variant: 'destructive' } })).toContain('variant="destructive"');
  });

  it('só escreve role quando o valor difere do padrão', () => {
    expect(alertSource('', { args: { role: 'alert' } })).not.toContain('role=');
    expect(alertSource('', { args: { role: 'note' } })).toContain('role="note"');
  });

  it('o control de fechar traz a prop e o callback juntos', () => {
    expect(alertSource('', { args: { dismissible: false } })).not.toContain('dismissible');
    const saida = alertSource('', { args: { dismissible: true } });
    expect(saida).toContain('dismissible');
    expect(saida).toContain('onDismiss=');
  });
});

describe('transforms das stories de variante', () => {
  it('cada variante escreve a própria prop e importa o próprio ícone', () => {
    expect(alertDestrutivoSource()).toContain('variant="destructive"');
    expect(alertDestrutivoSource()).toContain('icons/circle-alert');
    expect(alertSucessoSource()).toContain('variant="success"');
    expect(alertSucessoSource()).toContain('icons/circle-check-big');
    expect(alertAvisoSource()).toContain('variant="warning"');
    expect(alertAvisoSource()).toContain('icons/triangle-alert');
    expect(alertInformativoSource()).toContain('variant="info"');
  });

  it('o alert dispensável mostra a prop e o callback de fechamento', () => {
    const saida = alertDismissivelSource();
    expect(saida).toContain('<Alert dismissible onDismiss=');
  });

  it('a medição de contraste mostra as cinco variantes na mesma tela', () => {
    const saida = alertContrasteSource();
    expect(saida).toContain('const variantes: AlertVariant[]');
    expect(saida).toContain('<Alert variant={variante}>');
    for (const variante of ['default', 'destructive', 'success', 'warning', 'info']) {
      expect(saida).toContain(`"${variante}"`);
    }
  });
});

describe('transforms das stories de estado', () => {
  it('sem título, nem o subcomponente nem o import sobram', () => {
    const saida = alertSemTituloSource();
    expect(saida).not.toContain('AlertTitle');
    expect(saida).toContain('<AlertDescription>');
  });

  it('sem ícone, o snippet não importa ícone nenhum', () => {
    const saida = alertSemIconeSource();
    expect(saida).not.toContain('@lucide/svelte');
    expect(saida).toContain('<AlertTitle>Sem ícone</AlertTitle>');
  });

  it('o par estático × urgente contrasta role="note" com a omissão da prop', () => {
    const saida = alertSemAnuncioSource();
    expect(saida).toContain('<Alert role="note">');
    // O segundo alert NÃO declara role: é o padrão `alert` que se quer mostrar.
    expect(saida).toContain('<Alert variant="destructive">');
  });

  it('a inserção dinâmica mantém o role padrão, que é o que anuncia na hora', () => {
    const saida = alertInsercaoDinamicaSource();
    expect(saida).toContain('<Alert>');
    expect(saida).not.toContain('role=');
    expect(saida).toContain('Operação concluída');
  });
});

describe('transforms das stories de composição', () => {
  it('a composição com ação aninha o Button dentro do AlertAction', () => {
    const saida = alertComAcaoSource();
    expect(saida).toContain('from "@/components/ui/button"');
    expect(saida).toContain('<AlertAction>');
    expect(saida).toContain('<Button size="sm" variant="outline">Atualizar</Button>');
  });

  it('a classe adicional aparece na raiz e em cada subcomponente', () => {
    const saida = alertClasseAdicionalSource();
    expect(saida).toContain('<Alert class="nds-w-full">');
    expect(saida).toContain('<AlertTitle class="nds-w-full">');
    expect(saida).toContain('<AlertDescription class="nds-w-full">');
    expect(saida).toContain('<AlertAction class="nds-w-auto">');
  });
});
