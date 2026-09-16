import { describe, expect, it } from 'vitest';
import {
  progressAnimatedSource,
  progressAriaBusyContainerSource,
  progressBarSnippet,
  progressCustomColorSource,
  progressCustomValueTextSource,
  progressFileUploadSource,
  progressMultipleUploadsSource,
  progressSemanticColorSource,
  progressSource,
  progressWithLabelSource,
  progressWizardStepsSource,
} from './progress.source';

const IMPORT = `import { Progress } from '@/components/ui/progress'`;

describe('progressSource (Playground)', () => {
  it('sem args, entrega a barra nua com valor e nome próprio', () => {
    expect(progressSource()).toBe(
      `<script setup lang="ts">
${IMPORT}
</script>

<template>
  <Progress :model-value="42" aria-label="Progresso do upload" />
</template>`,
    );
  });

  it('omitir o valor é o indeterminado: null não escreve atributo de valor', () => {
    const output = progressSource('', { args: { modelValue: null } });
    expect(output).not.toContain(':model-value');
    expect(output).toContain('<Progress aria-label="Progresso do upload" />');
  });

  it('o zero sai escrito — é o que o separa do indeterminado', () => {
    expect(progressSource('', { args: { modelValue: 0 } })).toContain(':model-value="0"');
  });

  it('min e max só aparecem quando diferem do padrão', () => {
    expect(progressSource('', { args: { min: 0, max: 100 } })).not.toMatch(/:min=|:max=/);
    const output = progressSource('', { args: { min: 20, max: 60 } });
    expect(output).toContain(':min="20"');
    expect(output).toContain(':max="60"');
  });

  it('a variante vira data-variant, e o vazio do control não escreve nada', () => {
    expect(progressSource('', { args: { variant: 'success' } })).toContain('data-variant="success"');
    expect(progressSource('', { args: { variant: '' } })).not.toContain('data-variant');
  });

  it('o nome acessível do control chega ao snippet', () => {
    expect(progressSource('', { args: { ariaLabel: 'Progresso da exportação' } })).toContain(
      'aria-label="Progresso da exportação"',
    );
  });

  it('ignora control que não é número nem string — o espião vira ruído', () => {
    const output = progressSource('', {
      args: { modelValue: (() => {}) as never, max: (() => {}) as never, ariaLabel: (() => {}) as never },
    });
    expect(output).not.toContain('=>');
    expect(output).not.toContain('NaN');
    expect(output).not.toContain(':max=');
    expect(output).toContain('aria-label="Progresso do upload"');
  });
});

describe('barra sozinha — variantes e estados', () => {
  it('bate com a story Determinate', () => {
    expect(progressBarSnippet({ value: 42, label: 'Progresso do upload' })).toContain(
      '<Progress :model-value="42" aria-label="Progresso do upload" />',
    );
  });

  it('o indeterminado não escreve valor nem aria-valuenow', () => {
    const output = progressBarSnippet({ label: 'Processando…' });
    expect(output).toContain('<Progress aria-label="Processando…" />');
    expect(output).not.toContain('aria-valuenow');
  });

  it('as duas formas do valor desconhecido saem DIFERENTES no painel', () => {
    // A story de estado usa `:model-value="null"` e a de variante omite o
    // valor: duas telas iguais por caminhos diferentes. Com o `null` descartado,
    // os dois painéis ficavam idênticos e a página deixava de ensinar uma delas.
    const state = progressBarSnippet({ value: null, nullExplicit: true, label: 'Processando…' });
    const variante = progressBarSnippet({ label: 'Processando…' });
    expect(state).toContain('<Progress :model-value="null" aria-label="Processando…" />');
    expect(variante).toContain('<Progress aria-label="Processando…" />');
    expect(state).not.toBe(variante);
  });

  it('Default, Loading e Complete batem com as stories', () => {
    expect(progressBarSnippet({ value: 0, label: 'Progresso do upload' })).toContain(':model-value="0"');
    expect(progressBarSnippet({ value: 50, label: 'Carregando dados' })).toContain(
      '<Progress :model-value="50" aria-label="Carregando dados" />',
    );
    // `data-state="complete"` é derivado: escrevê-lo ensinaria a duplicar.
    expect(progressBarSnippet({ value: 100, label: 'Concluído' })).not.toContain('data-state');
  });
});

describe('formas com texto em volta', () => {
  it('com rótulo, o número repete o valor em região polite e tabular', () => {
    const output = progressWithLabelSource();
    expect(output).toContain('>42%</span>');
    expect(output).toContain('aria-live="polite"');
    expect(output).not.toContain('assertive');
    expect(output).toContain('nds-tabular-nums');
  });

  it('a cor semântica sai de atributo', () => {
    const output = progressSemanticColorSource();
    expect(output).toContain('data-variant="success"');
    expect(output).toContain('data-variant="destructive"');
    expect(output).not.toContain(':class=');
  });

  it('a barra que avança desliga o relógio no desmonte', () => {
    const output = progressAnimatedSource();
    expect(output).toContain('const value = ref(0)');
    expect(output).toContain(':model-value="value"');
    expect(output).toContain('{{ value }}%');
    expect(output).toContain('onUnmounted(() => clearInterval(timer))');
  });
});

describe('composições — o conjunto da referência', () => {
  it('o upload nomeia o arquivo', () => {
    expect(progressFileUploadSource()).toContain('aria-label="Progresso do upload de documento-final.pdf"');
  });

  it('o upload ensina o cartão inteiro: arquivo, tamanho e a linha polite', () => {
    const output = progressFileUploadSource();
    expect(output).toContain('<div class="nds-text-body nds-font-medium">documento-final.pdf</div>');
    expect(output).toContain('2.4 MB de 5.0 MB');
    expect(output).toContain('aria-live="polite">48%</span>');
    expect(output).toContain(':model-value="48"');
  });

  it('as etapas anunciam o nome da etapa', () => {
    const output = progressWizardStepsSource();
    expect(output).toContain('aria-live="polite">Endereço</span>');
    expect(output).toContain(':model-value="60"');
  });

  it('cada upload tem nome acessível próprio', () => {
    const names = progressMultipleUploadsSource().match(/aria-label="[^"]+"/g) ?? [];
    expect(names).toHaveLength(4);
    expect(new Set(names).size).toBe(4);
  });

  it('das três medidas, só as semânticas levam variante', () => {
    const output = progressCustomColorSource();
    expect(output.match(/data-variant=/g)).toHaveLength(2);
    expect(output).toContain('<Progress :model-value="72" aria-label="Progresso do backup" />');
  });

  it('o contêiner ocupado declara aria-busy', () => {
    expect(progressAriaBusyContainerSource()).toContain('role="status" aria-busy="true"');
  });

  it('o texto anunciado próprio usa get-value-text com a assinatura da lib', () => {
    const output = progressCustomValueTextSource();
    expect(output).toContain(':get-value-text="filesText"');
    expect(output).toContain('const filesText = (value: number | null | undefined, max: number) =>');
    expect(output).toContain('aria-label="Processamento de arquivos"');
  });
});

describe('o snippet ensina o design system, não o andaime da story', () => {
  const all = [
    () => progressSource(),
    () => progressBarSnippet(),
    progressWithLabelSource,
    progressSemanticColorSource,
    progressAnimatedSource,
    progressFileUploadSource,
    progressWizardStepsSource,
    progressMultipleUploadsSource,
    progressCustomColorSource,
    progressAriaBusyContainerSource,
    progressCustomValueTextSource,
  ];

  it('nenhuma crava medida em style inline', () => {
    for (const fn of all) {
      const output = fn();
      expect(output).not.toContain('style=');
      expect(output).not.toMatch(/\d+px/);
    }
  });

  it('toda barra tem nome acessível', () => {
    for (const fn of all) {
      const output = fn();
      const barras = output.match(/<Progress\b[^>]*>/g) ?? [];
      expect(barras.length).toBeGreaterThan(0);
      for (const barra of barras) expect(barra).toContain('aria-label="');
    }
  });

  it('todas importam do design system', () => {
    for (const fn of all) expect(fn()).toContain(IMPORT);
  });
});
