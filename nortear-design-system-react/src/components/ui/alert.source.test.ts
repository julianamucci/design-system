import { describe, expect, it } from 'vitest';
import {
  alertAvisoSource,
  alertClassNameAdicionalSource,
  alertWithActionSource,
  alertContrastSource,
  alertDestructiveSource,
  alertDispensavelSource,
  alertInfoSource,
  alertInsercaoDinamicaSource,
  alertNoAnnouncementSource,
  alertNoIconSource,
  alertNoTitleSource,
  alertSource,
  alertSucessoSource,
} from './alert.source';

describe('alertSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    expect(alertSource()).toContain(
      'import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";',
    );
  });

  it('o ícone é reforço visual: quem nomeia o alerta é o texto', () => {
    const saida = alertSource();
    expect(saida).toContain('<Info aria-hidden="true" className="nds-icon" />');
    // Posicionamento é do .nds-alert, que trata o SVG filho direto.
    expect(saida).not.toContain('margin');
  });

  it('omite as props que são o padrão do componente', () => {
    const saida = alertSource(undefined, {
      args: { variant: 'default', role: 'alert', dismissible: false },
    });
    expect(saida).toContain('<Alert>');
    expect(saida).not.toContain('variant=');
    // role="alert" é o padrão; escrevê-lo sugeriria que a escolha é decorativa
    // quando é ela que define se o conteúdo interrompe o leitor de tela.
    expect(saida).not.toContain('role=');
    expect(saida).not.toContain('dismissible');
  });

  it('escreve as props quando o control difere do padrão', () => {
    const saida = alertSource(undefined, {
      args: { variant: 'warning', role: 'note', dismissible: true },
    });
    expect(saida).toContain('variant="warning"');
    expect(saida).toContain('role="note"');
    expect(saida).toContain('dismissible');
  });

  it('não inventa variante nem papel fora da união', () => {
    const saida = alertSource(undefined, {
      args: { variant: 'roxo' as never, role: 'banner' as never },
    });
    expect(saida).toContain('<Alert>');
  });

  it('o espião de control não vira código no painel', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const saida = alertSource(undefined, {
      args: { variant: spy as never, dismissible: spy as never },
    });
    expect(saida).not.toContain('CORPO_DO_MOCK');
    expect(saida).not.toContain('undefined');
  });
});

describe('variantes', () => {
  const casos = [
    ['destructive', 'AlertCircle', alertDestructiveSource],
    ['success', 'CheckCircle2', alertSucessoSource],
    ['warning', 'TriangleAlert', alertAvisoSource],
    ['info', 'Info', alertInfoSource],
  ] as const;

  it('cada uma declara a variante e troca o ícone junto', () => {
    for (const [name, icone, fn] of casos) {
      const saida = fn();
      expect(saida).toContain(`<Alert variant="${name}">`);
      expect(saida).toContain(`import { ${icone} } from "lucide-react";`);
      expect(saida).toContain(`<${icone} aria-hidden="true" className="nds-icon" />`);
    }
  });

  it('o texto corrido nunca carrega a cor semântica — só o contêiner a pinta', () => {
    for (const [, , fn] of casos) {
      const saida = fn();
      expect(saida).not.toContain('nds-text-destructive');
      expect(saida).not.toContain('nds-text-warning');
      expect(saida).not.toContain('nds-text-success');
      expect(saida).not.toContain('nds-text-info');
    }
  });

  it('a comparação de contraste mostra as cinco, sem ícone', () => {
    const saida = alertContrastSource();
    for (const name of ['destructive', 'success', 'warning', 'info']) {
      expect(saida).toContain(`<Alert variant="${name}">`);
    }
    expect(saida).toContain('<Alert>');
    expect(saida).not.toContain('lucide-react');
  });
});

describe('dispensável', () => {
  it('ensina o contrato, e não o wrapper que a story usa para remontar', () => {
    const saida = alertDispensavelSource();
    expect(saida).toContain('<Alert dismissible onDismiss={aoFechar}>');
    // O onDismiss é aviso posterior: o componente se remove sozinho.
    expect(saida).toContain('function aoFechar()');
    expect(saida).not.toContain('useState');
    expect(saida).not.toContain('key=');
  });
});

describe('ausências e contêineres', () => {
  it('sem título: a descrição vira o conteúdo inteiro, e o import encolhe junto', () => {
    const saida = alertNoTitleSource();
    expect(saida).not.toContain('<AlertTitle>');
    expect(saida).toContain('import { Alert, AlertDescription } from "@/components/ui/alert";');
    expect(saida).toContain('<AlertDescription>');
  });

  it('sem ícone: nenhuma prop desliga nada, é a ausência que muda o layout', () => {
    const saida = alertNoIconSource();
    expect(saida).not.toContain('lucide-react');
    expect(saida).not.toContain('nds-icon');
    expect(saida).toContain('<AlertTitle>');
  });

  it('role=note ao lado do padrão: os dois juntos é que mostram a diferença', () => {
    const saida = alertNoAnnouncementSource();
    expect(saida).toContain('<Alert role="note">');
    expect(saida).toContain('  <Alert>');
  });

  it('inserção dinâmica: quem anuncia é a região aria-live que envolve', () => {
    expect(alertInsercaoDinamicaSource()).toContain('<div aria-live="polite">');
  });
});

describe('composições', () => {
  it('com ação: o AlertAction entra no import e o botão vem do design system', () => {
    const saida = alertWithActionSource();
    expect(saida).toContain('AlertAction');
    expect(saida).toContain('import { Button } from "@/components/ui/button";');
    expect(saida).toContain('<Button size="sm" variant="outline">');
    // O alerta não é focável: quem recebe o Tab é o botão interno.
    expect(saida).not.toContain('tabIndex');
  });

  it('classe adicional: o className aparece em cada subcomponente, não só na raiz', () => {
    const saida = alertClassNameAdicionalSource();
    expect(saida).toContain('<Alert className="nds-w-full">');
    expect(saida).toContain('<AlertTitle className="nds-w-full">');
    expect(saida).toContain('<AlertDescription className="nds-w-full">');
    expect(saida).toContain('<AlertAction className="nds-w-auto">');
  });

  it('nenhum snippet ensina o andaime da story', () => {
    for (const fn of [
      alertSource,
      alertDestructiveSource,
      alertSucessoSource,
      alertAvisoSource,
      alertInfoSource,
      alertDispensavelSource,
      alertContrastSource,
      alertNoTitleSource,
      alertNoIconSource,
      alertNoAnnouncementSource,
      alertInsercaoDinamicaSource,
      alertWithActionSource,
      alertClassNameAdicionalSource,
    ]) {
      const saida = fn();
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('{...args}');
      // Nenhum valor de design em style inline: tudo por classe .nds-*.
      expect(saida).not.toContain('style={{');
      // Altura fixa em primitivo interativo é proibida no repositório.
      expect(saida).not.toContain('height:');
    }
  });
});
