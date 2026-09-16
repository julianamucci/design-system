import { describe, expect, it } from 'vitest';
import {
  progressAnimatedSource,
  progressAriaBusySource,
  progressCompleteSource,
  progressDeterminateSource,
  progressCustomColorSource,
  progressCustomValueTextSource,
  progressFileUploadSource,
  progressIndeterminateSource,
  progressLoadingSource,
  progressMultipleUploadsSource,
  progressOmittedValueSource,
  progressReducedMotionSource,
  progressSemanticColorSource,
  progressSource,
  progressWithLabelSource,
  progressWizardStepsSource,
  progressZeroSource,
} from './progress.source';

const ALL = [
  () => progressSource(),
  progressAnimatedSource,
  progressAriaBusySource,
  progressCompleteSource,
  progressCustomColorSource,
  progressCustomValueTextSource,
  progressDeterminateSource,
  progressFileUploadSource,
  progressIndeterminateSource,
  progressLoadingSource,
  progressMultipleUploadsSource,
  progressOmittedValueSource,
  progressReducedMotionSource,
  progressSemanticColorSource,
  progressWithLabelSource,
  progressWizardStepsSource,
  progressZeroSource,
];

describe('progressSource', () => {
  it('sem args, entrega a barra do Playground dentro do contêiner de largura', () => {
    expect(progressSource()).toBe(
      `import { Progress } from "@/components/ui/progress";

<div className="nds-w-md">
  <Progress value={42} aria-label="Progresso do upload" />
</div>`,
    );
  });

  it('omite a escala e a variante padrão', () => {
    const code = progressSource('', {
      args: { value: 10, min: 0, max: 100, variant: '', 'aria-label': 'Backup' },
    });
    expect(code).not.toContain('min=');
    expect(code).not.toContain('max=');
    expect(code).not.toContain('data-variant');
  });

  it('mostra min, max e variante quando o control os muda', () => {
    const code = progressSource('', {
      args: { value: 30, min: 10, max: 60, variant: 'destructive', 'aria-label': 'Cota' },
    });
    expect(code).toContain('min={10}');
    expect(code).toContain('max={60}');
    expect(code).toContain('data-variant="destructive"');
  });

  it('valor ausente sai do snippet — omitir é o indeterminado, e não zero', () => {
    expect(progressSource('', { args: { value: null } })).not.toContain('value=');
    expect(progressSource('', { args: { value: undefined } })).not.toContain('value=');
  });

  it('não publica className: a classe não é control desta story', () => {
    expect(progressSource('', { args: { 'aria-label': 'X' } })).not.toContain('className="nds-progress');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(progressSource('<div role="progressbar" aria-valuenow="42">', {})).not.toContain('role=');
  });
});

describe('todo snippet', () => {
  it('nasce num contêiner de largura média, sem medida inline', () => {
    for (const fn of ALL) {
      const code = fn();
      expect(code).toContain('nds-w-md');
      expect(code).not.toContain('nds-w-sm');
      expect(code).not.toContain('style');
    }
  });

  it('dá nome acessível a toda barra', () => {
    for (const fn of ALL) {
      const code = fn();
      const bars = code.match(/<Progress[\s>]/g)?.length ?? 0;
      const named = (code.match(/aria-label="[^"]+"/g)?.length ?? 0) + (code.match(/<ProgressLabel>/g)?.length ?? 0);
      expect(named).toBeGreaterThanOrEqual(bars);
    }
  });

  it('nunca escreve à mão o que é do componente', () => {
    for (const fn of ALL) {
      const code = fn();
      expect(code).not.toContain('role="progressbar"');
      expect(code).not.toContain('aria-valuenow');
      expect(code).not.toContain('aria-valuetext');
      expect(code).not.toContain('tabIndex');
    }
  });

  it('não anuncia em modo assertivo', () => {
    for (const fn of ALL) expect(fn()).not.toContain('assertive');
  });
});

describe('estados', () => {
  it('cada estado mostra o valor e o nome da story', () => {
    expect(progressZeroSource()).toContain('<Progress value={0} aria-label="Progresso do upload" />');
    expect(progressLoadingSource()).toContain('<Progress value={50} aria-label="Carregando dados" />');
    expect(progressCompleteSource()).toContain('<Progress value={100} aria-label="Concluído" />');
    expect(progressIndeterminateSource()).toContain('<Progress value={null} aria-label="Processando…" />');
    expect(progressReducedMotionSource()).toContain('aria-label="Processando dados"');
  });

  it('a variante sem valor OMITE a prop, e a de estado a escreve null', () => {
    expect(progressOmittedValueSource()).toContain('<Progress aria-label="Processando…" />');
    expect(progressOmittedValueSource()).not.toContain('value=');
  });

  it('a animação alimenta a barra e a região polite com o mesmo estado', () => {
    const code = progressAnimatedSource();
    expect(code).toContain('const [value, setValue] = useState(0);');
    expect(code).toContain('{value}%');
    expect(code).toContain('aria-live="polite"');
    expect(code).toContain('<Progress value={value} aria-label="Progresso do upload" />');
    // Largura e transform são da folha; o exemplo só troca o número.
    expect(code).not.toContain('width');
    expect(code).not.toContain('transform');
  });
});

describe('variantes', () => {
  it('a determinada tem construtor PRÓPRIO, com o valor e o nome da story', () => {
    // Antes ela herdava a transform do meta e acertava por coincidência: o
    // padrão dos controls é o mesmo 42. No dia em que o padrão mudasse, o painel
    // passaria a ensinar outra barra sem nada ficar vermelho.
    expect(progressDeterminateSource()).toContain(
      '<Progress value={42} aria-label="Progresso do upload" />',
    );
  });

  it('com ProgressLabel, o nome sai do rótulo e não de um aria-label repetido', () => {
    const code = progressWithLabelSource();
    expect(code).toContain('<ProgressLabel>Enviando arquivo</ProgressLabel>');
    expect(code).toContain('<ProgressIndicator />');
    expect(code).not.toContain('aria-label');
  });

  it('a cor semântica são duas barras, success e destructive', () => {
    const code = progressSemanticColorSource();
    expect(code.match(/<Progress/g)).toHaveLength(2);
    expect(code).toContain('data-variant="success"');
    expect(code).toContain('data-variant="destructive"');
  });
});

describe('composições', () => {
  it('upload de arquivo nomeia o arquivo', () => {
    const code = progressFileUploadSource();
    expect(code).toContain('documento-final.pdf');
    expect(code).toContain('aria-label="Progresso do upload de documento-final.pdf"');
    expect(code).toContain('48%');
  });

  it('wizard anuncia a etapa, não a porcentagem', () => {
    const code = progressWizardStepsSource();
    expect(code).toContain('Endereço');
    expect(code).toContain('value={60}');
    expect(code).not.toContain('60%');
  });

  it('múltiplos uploads: quatro barras com nomes distintos', () => {
    const code = progressMultipleUploadsSource();
    const names = [...code.matchAll(/aria-label="([^"]+)"/g)].map((m) => m[1]);
    expect(names).toHaveLength(4);
    expect(new Set(names).size).toBe(4);
  });

  it('cor customizada: a barra do meio fica neutra', () => {
    const variants = [...progressCustomColorSource().matchAll(/data-variant="([^"]+)"/g)].map((m) => m[1]);
    expect(variants).toEqual(['success', 'destructive']);
  });

  it('o contêiner ocupado leva status e aria-busy', () => {
    const code = progressAriaBusySource();
    expect(code).toContain('role="status"');
    expect(code).toContain('aria-busy="true"');
    expect(code).toContain('value={35}');
  });

  it('texto anunciado próprio usa a assinatura da lib', () => {
    const code = progressCustomValueTextSource();
    expect(code).toContain('getAriaValueText={(_formatted, current) =>');
    expect(code).toContain('de 100 arquivos');
    expect(code).toContain('aria-label="Processamento de arquivos"');
  });
});
