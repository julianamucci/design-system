import { describe, expect, it } from 'vitest';
import {
  alertClassNameAdicionalSource,
  alertWithActionSource,
  alertWithIconSource,
  alertCompletoSource,
  alertContrastSource,
  alertDefaultSource,
  alertDestructiveSource,
  keyboardAlertDismissivelSource,
  alertDismissivelSource,
  alertInfoSource,
  alertInsercaoDinamicaSource,
  alertLayoutNoIconSource,
  alertNoAnnouncementSource,
  alertNoIconSource,
  alertNoTitleSource,
  alertSource,
  alertSuccessSource,
  alertWarningSource,
} from './alert.source';

describe('alertSource', () => {
  it('sem args, entrega a forma canônica na variante padrão', () => {
    expect(alertSource()).toBe(
      `<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-vue-next'
</script>

<template>
  <Alert>
    <Info class="nds-icon" aria-hidden="true" />
    <AlertTitle>Atenção</AlertTitle>
    <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
  </Alert>
</template>`,
    );
  });

  it('não escreve os padrões do componente', () => {
    const saida = alertSource('', {
      args: { variant: 'default', role: 'alert', dismissible: false },
    });
    expect(saida).not.toContain('variant=');
    // `alert` já é live region assertiva; repetir o papel sugeriria que a
    // semântica precisa ser pedida.
    expect(saida).not.toContain('role=');
    expect(saida).not.toContain('dismissible');
  });

  it('o que difere do padrão entra na raiz', () => {
    const saida = alertSource('', {
      args: { variant: 'destructive', role: 'note', dismissible: true },
    });
    expect(saida).toContain('<Alert variant="destructive" role="note" dismissible>');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = alertSource('', {
      args: { variant: (() => {}) as never, role: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).toBe(alertSource());
  });
});

describe('transforms das stories de variante', () => {
  it('cada variante semântica leva o ícone e a mensagem do próprio caso', () => {
    expect(alertDefaultSource()).not.toContain('variant=');
    expect(alertDestructiveSource()).toContain('<Alert variant="destructive">');
    expect(alertDestructiveSource()).toContain(`import { AlertCircle } from 'lucide-vue-next'`);
    expect(alertSuccessSource()).toContain('<Alert variant="success">');
    expect(alertSuccessSource()).toContain(`import { CheckCircle2 } from 'lucide-vue-next'`);
    expect(alertWarningSource()).toContain('<Alert variant="warning">');
    expect(alertWarningSource()).toContain(`import { TriangleAlert } from 'lucide-vue-next'`);
    expect(alertInfoSource()).toContain('<Alert variant="info">');
  });

  it('o ícone é decorativo em toda variante — quem nomeia é o título', () => {
    for (const fn of [alertDestructiveSource, alertSuccessSource, alertWarningSource]) {
      expect(fn()).toContain('class="nds-icon" aria-hidden="true"');
      expect(fn()).not.toContain('aria-label');
    }
  });

  it('o fechável mostra a prop, o rótulo do botão e o evento', () => {
    const saida = alertDismissivelSource();
    expect(saida).toContain('dismissible');
    expect(saida).toContain('dismiss-label="Fechar alerta"');
    expect(saida).toContain('@dismiss="avisoVisivel = false"');
    // A remontagem por `:key` existe para a story não deixar o canvas vazio;
    // quem consome não escreve isso.
    expect(saida).not.toContain(':key=');
  });

  it('fechar pelo teclado não tem nada a configurar', () => {
    const saida = keyboardAlertDismissivelSource();
    expect(saida).toContain('<Alert dismissible dismiss-label="Fechar alerta">');
    // O controle já é botão de verdade: um handler de tecla aqui ensinaria um
    // remendo que o componente não precisa.
    expect(saida).not.toContain('@keydown');
    expect(saida).not.toContain('tabindex');
  });

  it('o contraste empilha as cinco variantes sem ícone e sem cor no texto', () => {
    const saida = alertContrastSource();
    expect(saida.match(/<Alert[ >]/g)).toHaveLength(5);
    expect(saida).toContain('<Alert>');
    expect(saida).toContain('<Alert variant="info">');
    // Ícone competiria com a medição; e o texto corrido de contêiner colorido
    // nunca leva cor semântica.
    expect(saida).not.toContain('nds-icon');
    expect(saida).not.toContain('nds-text-destructive');
    expect(saida).not.toContain(`from 'lucide-vue-next'`);
  });
});

describe('transforms das stories de estado', () => {
  it('sem título, o subcomponente some do import junto com a marcação', () => {
    const saida = alertNoTitleSource();
    expect(saida).not.toContain('AlertTitle');
    expect(saida).toContain(
      `import { Alert, AlertDescription } from '@/components/ui/alert'`,
    );
  });

  it('sem ícone, o import do ícone some junto', () => {
    const saida = alertNoIconSource();
    expect(saida).not.toContain('nds-icon');
    expect(saida).not.toContain('lucide-vue-next');
    expect(saida).toContain('<AlertTitle>Atenção</AlertTitle>');
  });

  it('o completo traz os três: ícone, título e descrição', () => {
    const saida = alertCompletoSource();
    expect(saida).toContain('nds-icon');
    expect(saida).toContain('<AlertTitle>');
    expect(saida).toContain('<AlertDescription>');
  });

  it('o papel de nota contrasta com o padrão no mesmo exemplo', () => {
    const saida = alertNoAnnouncementSource();
    expect(saida).toContain('<Alert role="note">');
    // O segundo alerta fica SEM papel escrito: é ele que mostra o padrão.
    expect(saida).toContain('<Alert>');
    expect(saida).not.toContain('role="alert"');
    // `data-testid` é gancho de teste, não parte do design system.
    expect(saida).not.toContain('data-testid');
  });

  it('a inserção dinâmica ensina a região live em volta, não uma prop', () => {
    const saida = alertInsercaoDinamicaSource();
    expect(saida).toContain('<div aria-live="polite">');
    expect(saida).toContain('<Alert>');
  });
});

describe('transforms das stories de composição', () => {
  it('a ação mora no subcomponente próprio, com botão secundário', () => {
    const saida = alertWithActionSource();
    expect(saida).toContain(`import { Button } from '@/components/ui/button'`);
    expect(saida).toContain(
      `    <AlertAction>
      <Button size="sm" variant="default">Atualizar</Button>
    </AlertAction>`,
    );
  });

  it('a classe adicional aparece em cada subcomponente', () => {
    const saida = alertClassNameAdicionalSource();
    expect(saida).toContain('<Alert class="nds-w-full">');
    expect(saida).toContain('<AlertTitle class="nds-w-full">');
    expect(saida).toContain('<AlertDescription class="nds-w-full">');
    expect(saida).toContain('<AlertAction class="nds-w-auto">');
  });

  it('o ícone da composição é filho comum, sem prop que o posicione', () => {
    const saida = alertWithIconSource();
    expect(saida).toContain('<Info class="nds-icon" aria-hidden="true" />');
    expect(saida).not.toContain('icon=');
  });

  it('a coluna única é a ausência do ícone, não uma prop de layout', () => {
    const saida = alertLayoutNoIconSource();
    expect(saida).not.toContain('nds-icon');
    expect(saida).toContain('<AlertTitle>Sem ícone</AlertTitle>');
  });
});
