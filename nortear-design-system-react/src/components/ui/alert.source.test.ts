import { describe, expect, it } from 'vitest';
import {
  alertAdditionalClassSource,
  alertContrastSource,
  alertDestructiveSource,
  alertDismissibleByKeyboardSource,
  alertDismissibleSource,
  alertDynamicInsertionSource,
  alertInfoSource,
  alertNoAnnouncementSource,
  alertCompositionNoIconSource,
  alertNoTitleSource,
  alertSource,
  alertStateNoIconSource,
  alertSuccessSource,
  alertWarningSource,
  alertWithActionAndDismissSource,
  alertWithActionSource,
  alertWithIconSource,
} from './alert.source';

const ALL = [
  alertSource,
  alertDestructiveSource,
  alertSuccessSource,
  alertWarningSource,
  alertInfoSource,
  alertDismissibleSource,
  alertDismissibleByKeyboardSource,
  alertContrastSource,
  alertNoTitleSource,
  alertStateNoIconSource,
  alertCompositionNoIconSource,
  alertWithIconSource,
  alertNoAnnouncementSource,
  alertDynamicInsertionSource,
  alertWithActionSource,
  alertWithActionAndDismissSource,
  alertAdditionalClassSource,
];

describe('alertSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    expect(alertSource()).toContain(
      'import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";',
    );
  });

  it('o ícone é reforço visual: quem nomeia o alerta é o texto', () => {
    const output = alertSource();
    expect(output).toContain('<Info aria-hidden="true" />');
    // Dimensionamento e posicionamento são do .nds-alert, que trata o SVG filho direto.
    expect(output).not.toContain('margin');
  });

  it('omite as props que são o padrão do componente', () => {
    const output = alertSource(undefined, {
      args: { variant: 'default', role: 'alert', dismissible: false },
    });
    expect(output).toContain('<Alert>');
    expect(output).not.toContain('variant=');
    // role="alert" é o padrão; escrevê-lo sugeriria que a escolha é decorativa
    // quando é ela que define se o conteúdo interrompe o leitor de tela.
    expect(output).not.toContain('role=');
    expect(output).not.toContain('dismissible');
  });

  it('escreve as props quando o control difere do padrão', () => {
    const output = alertSource(undefined, {
      args: { variant: 'warning', role: 'note', dismissible: true },
    });
    expect(output).toContain('variant="warning"');
    expect(output).toContain('role="note"');
    expect(output).toContain('dismissible');
  });

  it('não inventa variante nem papel fora da união', () => {
    const output = alertSource(undefined, {
      args: { variant: 'roxo' as never, role: 'banner' as never },
    });
    expect(output).toContain('<Alert>');
  });

  it('o espião de control não vira código no painel', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const output = alertSource(undefined, {
      args: { variant: spy as never, dismissible: spy as never },
    });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).not.toContain('undefined');
  });
});

describe('variantes', () => {
  const cases = [
    ['destructive', 'AlertCircle', alertDestructiveSource],
    ['success', 'CheckCircle2', alertSuccessSource],
    ['warning', 'TriangleAlert', alertWarningSource],
    ['info', 'Info', alertInfoSource],
  ] as const;

  it('cada uma declara a variante e troca o ícone junto', () => {
    for (const [name, icon, fn] of cases) {
      const output = fn();
      expect(output).toContain(`<Alert variant="${name}">`);
      expect(output).toContain(`import { ${icon} } from "lucide-react";`);
      expect(output).toContain(`<${icon} aria-hidden="true" />`);
    }
  });

  it('o texto corrido nunca carrega a cor semântica — só o contêiner a pinta', () => {
    for (const [, , fn] of cases) {
      const output = fn();
      expect(output).not.toContain('nds-text-destructive');
      expect(output).not.toContain('nds-text-warning');
      expect(output).not.toContain('nds-text-success');
      expect(output).not.toContain('nds-text-info');
    }
  });

  it('a info ensina o mesmo texto que a story renderiza', () => {
    expect(alertInfoSource()).toContain('Você pode fixar os filtros mais usados');
  });

  it('a comparação de contraste mostra as cinco, sem ícone', () => {
    const output = alertContrastSource();
    for (const name of ['destructive', 'success', 'warning', 'info']) {
      expect(output).toContain(`<Alert variant="${name}">`);
    }
    expect(output).toContain('<Alert>');
    expect(output).not.toContain('lucide-react');
  });
});

describe('dispensável', () => {
  it('ensina o contrato, e não o wrapper que a story usa para remontar', () => {
    const output = alertDismissibleSource();
    expect(output).toContain('<Alert dismissible onDismiss={handleDismiss}>');
    // O onDismiss é aviso posterior: o componente se remove sozinho.
    expect(output).toContain('function handleDismiss()');
    expect(output).toContain('Preferências salvas');
    expect(output).not.toContain('useState');
    expect(output).not.toContain('key=');
  });

  it('por teclado: o rótulo do botão de fechar entra no snippet, com a variante', () => {
    const output = alertDismissibleByKeyboardSource();
    expect(output).toContain('variant="success"');
    expect(output).toContain('dismissLabel="Fechar confirmação"');
    expect(output).toContain('onDismiss={handleDismiss}');
    expect(output).not.toContain('key=');
  });
});

describe('ausências e contêineres', () => {
  it('sem título: a descrição vira o conteúdo inteiro, e o import encolhe junto', () => {
    const output = alertNoTitleSource();
    expect(output).not.toContain('<AlertTitle>');
    expect(output).toContain('import { Alert, AlertDescription } from "@/components/ui/alert";');
    expect(output).toContain('<AlertDescription>');
  });

  it('sem ícone: nenhuma prop desliga nada, é a ausência que muda o layout', () => {
    for (const fn of [alertStateNoIconSource, alertCompositionNoIconSource]) {
      const output = fn();
      expect(output).not.toContain('lucide-react');
      expect(output).not.toContain('aria-hidden');
      expect(output).toContain('<AlertTitle>');
    }
  });

  it('sem ícone: cada story ensina o próprio texto, sem misturar os dois', () => {
    const state = alertStateNoIconSource();
    expect(state).toContain('<AlertTitle>Atenção</AlertTitle>');
    expect(state).toContain('Suas alterações serão aplicadas na próxima sessão.');
    expect(state).not.toContain('coluna única');

    const composition = alertCompositionNoIconSource();
    expect(composition).toContain('<AlertTitle>Sem ícone</AlertTitle>');
    expect(composition).toContain('Alert sem ícone mantém layout de coluna única.');
    expect(composition).not.toContain('Atenção');
  });

  it('role=note ao lado do padrão: os dois juntos é que mostram a diferença', () => {
    const output = alertNoAnnouncementSource();
    expect(output).toContain('<Alert role="note">');
    // O segundo alerta não declara papel: o padrão assertivo é o assunto.
    expect(output).toContain('  <Alert variant="destructive">');
    expect(output).toContain('Falha no envio');
  });

  it('inserção dinâmica: o alerta nasce por estado, e nenhum contêiner aria-live o envolve', () => {
    const output = alertDynamicInsertionSource();
    expect(output).not.toContain('aria-live');
    expect(output).toContain('import { useState } from "react";');
    expect(output).toContain('onClick={() => setGenerated(true)}');
    expect(output).toContain('{generated && (');
    // Sem prop de papel: o padrão assertivo da raiz é quem anuncia.
    expect(output).not.toContain('role=');
  });
});

describe('composições', () => {
  it('com ação: o AlertAction entra no import e o botão vem do design system', () => {
    const output = alertWithActionSource();
    expect(output).toContain('AlertAction');
    expect(output).toContain('import { Button } from "@/components/ui/button";');
    expect(output).toContain('<Button size="sm" variant="default">');
    // O alerta não é focável: quem recebe o Tab é o botão interno.
    expect(output).not.toContain('tabIndex');
  });

  it('com ícone: o painel ensina o texto que a story mostra, não o do meta', () => {
    const output = alertWithIconSource();
    expect(output).toContain('<Info aria-hidden="true" />');
    expect(output).toContain('<AlertTitle>Informação</AlertTitle>');
    expect(output).toContain('Ícone SVG posicionado automaticamente.');
    expect(output).not.toContain('Atenção');
  });

  it('ação e fechar juntos: nenhuma prop a mais além de dismissible', () => {
    const output = alertWithActionAndDismissSource();
    expect(output).toContain('<Alert dismissible onDismiss={handleDismiss}>');
    expect(output).toContain('<AlertAction>');
    expect(output).toContain('Salvar agora');
    expect(output).toContain('Sessão expira em 5 minutos');
  });

  it('classe adicional: o className aparece em cada subcomponente, não só na raiz', () => {
    const output = alertAdditionalClassSource();
    expect(output).toContain('<Alert className="nds-w-full">');
    expect(output).toContain('<AlertTitle className="nds-w-full">');
    expect(output).toContain('<AlertDescription className="nds-w-full">');
    expect(output).toContain('<AlertAction className="nds-w-auto">');
  });

  it('nenhum snippet ensina o andaime da story', () => {
    for (const fn of ALL) {
      const output = fn();
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('{...args}');
      // Nenhum valor de design em style inline: tudo por classe .nds-*.
      expect(output).not.toContain('style={{');
      // Altura fixa em primitivo interativo é proibida no repositório.
      expect(output).not.toContain('height:');
      // O ícone do alerta é dimensionado pela folha, nunca por classe própria.
      expect(output).not.toContain('nds-icon');
      // Região viva em volta de alerta aninharia duas.
      expect(output).not.toContain('aria-live');
    }
  });
});
