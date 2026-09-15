import { describe, expect, it } from 'vitest';
import {
  alertAdditionalClassSource,
  alertCompleteSource,
  alertContrastSource,
  alertDefaultSource,
  alertDestructiveSource,
  alertDismissibleByKeyboardSource,
  alertDismissibleSource,
  alertDynamicInsertionSource,
  alertInfoSource,
  alertLayoutNoIconSource,
  alertNoAnnouncementSource,
  alertNoIconSource,
  alertNoTitleSource,
  alertSource,
  alertSuccessSource,
  alertWarningSource,
  alertWithActionAndDismissSource,
  alertWithActionSource,
  alertWithIconSource,
} from './alert.source';

const ALL = [
  alertAdditionalClassSource,
  alertCompleteSource,
  alertContrastSource,
  alertDefaultSource,
  alertDestructiveSource,
  alertDismissibleByKeyboardSource,
  alertDismissibleSource,
  alertDynamicInsertionSource,
  alertInfoSource,
  alertLayoutNoIconSource,
  alertNoAnnouncementSource,
  alertNoIconSource,
  alertNoTitleSource,
  () => alertSource(),
  alertSuccessSource,
  alertWarningSource,
  alertWithActionAndDismissSource,
  alertWithActionSource,
  alertWithIconSource,
];

describe('regras que valem em todo snippet', () => {
  it('o ícone do alerta não leva `.nds-icon` — a folha o dimensiona por `.nds-alert > svg`', () => {
    for (const build of ALL) expect(build()).not.toContain('nds-icon');
  });

  it('nenhum snippet envolve o alerta em região aria-live', () => {
    for (const build of ALL) expect(build()).not.toContain('aria-live');
  });
});

describe('alertSource', () => {
  it('sem args, entrega a forma canônica na variante padrão', () => {
    expect(alertSource()).toBe(
      `<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-vue-next'
</script>

<template>
  <Alert>
    <Info aria-hidden="true" />
    <AlertTitle>Atenção</AlertTitle>
    <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
  </Alert>
</template>`,
    );
  });

  it('não escreve os padrões do componente', () => {
    const output = alertSource('', {
      args: { variant: 'default', role: 'alert', dismissible: false },
    });
    expect(output).not.toContain('variant=');
    // `alert` já é live region assertiva; repetir o papel sugeriria que a
    // semântica precisa ser pedida.
    expect(output).not.toContain('role=');
    expect(output).not.toContain('dismissible');
  });

  it('o que difere do padrão entra na raiz', () => {
    const output = alertSource('', {
      args: { variant: 'destructive', role: 'note', dismissible: true },
    });
    expect(output).toContain('<Alert variant="destructive" role="note" dismissible>');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = alertSource('', {
      args: { variant: (() => {}) as never, role: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    expect(output).toBe(alertSource());
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
    expect(alertInfoSource()).toContain('Você pode fixar os filtros mais usados');
  });

  it('o ícone é decorativo em toda variante — quem nomeia é o título', () => {
    for (const build of [alertDestructiveSource, alertSuccessSource, alertWarningSource]) {
      expect(build()).toMatch(/<\w+ aria-hidden="true" \/>/);
      expect(build()).not.toContain('aria-label');
    }
  });

  it('o fechável mostra a prop e o evento, e omite o rótulo padrão', () => {
    const output = alertDismissibleSource();
    expect(output).toContain('dismissible');
    expect(output).toContain('@dismiss="noticeVisible = false"');
    expect(output).toContain('<AlertTitle>Preferências salvas</AlertTitle>');
    expect(output).not.toContain('dismiss-label');
    // A remontagem por `:key` existe para a story não deixar o canvas vazio;
    // quem consome não escreve isso.
    expect(output).not.toContain(':key=');
  });

  it('fechar pelo teclado não tem nada a configurar, só o rótulo do que se fecha', () => {
    const output = alertDismissibleByKeyboardSource();
    expect(output).toContain(
      '<Alert variant="success" dismissible dismiss-label="Fechar confirmação">',
    );
    // O controle já é botão de verdade: um handler de tecla aqui ensinaria um
    // remendo que o componente não precisa.
    expect(output).not.toContain('@keydown');
    expect(output).not.toContain('tabindex');
  });

  it('o contraste empilha as cinco variantes sem ícone e sem cor no texto', () => {
    const output = alertContrastSource();
    expect(output.match(/<Alert[ >]/g)).toHaveLength(5);
    expect(output).toContain('<Alert>');
    expect(output).toContain('<Alert variant="info">');
    // Ícone competiria com a medição; e o texto corrido de contêiner colorido
    // nunca leva cor semântica.
    expect(output).not.toContain('nds-text-destructive');
    expect(output).not.toContain(`from 'lucide-vue-next'`);
  });
});

describe('transforms das stories de estado', () => {
  it('sem título, o subcomponente some do import junto com a marcação', () => {
    const output = alertNoTitleSource();
    expect(output).not.toContain('AlertTitle');
    expect(output).toContain(
      `import { Alert, AlertDescription } from '@/components/ui/alert'`,
    );
  });

  it('sem ícone, o import do ícone some junto', () => {
    const output = alertNoIconSource();
    expect(output).not.toContain('lucide-vue-next');
    expect(output).toContain('<AlertTitle>Atenção</AlertTitle>');
  });

  it('o completo traz os três: ícone, título e descrição', () => {
    const output = alertCompleteSource();
    expect(output).toContain('<Info aria-hidden="true" />');
    expect(output).toContain('<AlertTitle>');
    expect(output).toContain('<AlertDescription>');
  });

  it('o papel de nota contrasta com o padrão no mesmo exemplo', () => {
    const output = alertNoAnnouncementSource();
    expect(output).toContain('<Alert role="note">');
    // O segundo alerta fica SEM papel escrito: é ele que mostra o padrão.
    expect(output).toContain('<Alert variant="destructive">');
    expect(output).toContain('Falha no envio');
    expect(output).not.toContain('role="alert"');
    // `data-testid` é gancho de teste, não parte do design system.
    expect(output).not.toContain('data-testid');
  });

  it('a inserção dinâmica monta o alerta depois da ação, sem região viva em volta', () => {
    const output = alertDynamicInsertionSource();
    expect(output).toContain('<Button size="sm" @click="reportReady = true">Gerar relatório</Button>');
    expect(output).toContain('<Alert v-if="reportReady">');
    expect(output).toContain('const reportReady = ref(false)');
    expect(output).not.toContain('aria-live');
  });
});

describe('transforms das stories de composição', () => {
  it('a ação mora no subcomponente próprio, com botão secundário', () => {
    const output = alertWithActionSource();
    expect(output).toContain(`import { Button } from '@/components/ui/button'`);
    expect(output).toContain(
      `    <AlertAction>
      <Button size="sm" variant="default">Atualizar</Button>
    </AlertAction>`,
    );
  });

  it('ação e fechar juntos: a prop na raiz e a ação no slot, sem prop de layout', () => {
    const output = alertWithActionAndDismissSource();
    expect(output).toContain('<Alert dismissible>');
    expect(output).toContain('<AlertTitle>Sessão expira em 5 minutos</AlertTitle>');
    expect(output).toContain(
      `    <AlertAction>
      <Button size="sm" variant="default">Salvar agora</Button>
    </AlertAction>`,
    );
  });

  it('a classe adicional aparece em cada subcomponente', () => {
    const output = alertAdditionalClassSource();
    expect(output).toContain('<Alert class="nds-w-full">');
    expect(output).toContain('<AlertTitle class="nds-w-full">');
    expect(output).toContain('<AlertDescription class="nds-w-full">');
    expect(output).toContain('<AlertAction class="nds-w-auto">');
  });

  it('o ícone da composição é filho comum, sem prop que o posicione', () => {
    const output = alertWithIconSource();
    expect(output).toContain('<Info aria-hidden="true" />');
    expect(output).not.toContain('icon=');
  });

  it('a coluna única é a ausência do ícone, não uma prop de layout', () => {
    const output = alertLayoutNoIconSource();
    expect(output).not.toContain('lucide-vue-next');
    expect(output).toContain('<AlertTitle>Sem ícone</AlertTitle>');
  });
});
