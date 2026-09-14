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
    const saida = progressSource('', { args: { modelValue: null } });
    expect(saida).not.toContain(':model-value');
    expect(saida).toContain('<Progress aria-label="Progresso do upload" />');
  });

  it('o zero sai escrito — é o que o separa do indeterminado', () => {
    expect(progressSource('', { args: { modelValue: 0 } })).toContain(':model-value="0"');
  });

  it('min e max só aparecem quando diferem do padrão', () => {
    expect(progressSource('', { args: { min: 0, max: 100 } })).not.toMatch(/:min=|:max=/);
    const saida = progressSource('', { args: { min: 20, max: 60 } });
    expect(saida).toContain(':min="20"');
    expect(saida).toContain(':max="60"');
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
    const saida = progressSource('', {
      args: { modelValue: (() => {}) as never, max: (() => {}) as never, ariaLabel: (() => {}) as never },
    });
    expect(saida).not.toContain('=>');
    expect(saida).not.toContain('NaN');
    expect(saida).not.toContain(':max=');
    expect(saida).toContain('aria-label="Progresso do upload"');
  });
});

describe('barra sozinha — variantes e estados', () => {
  it('bate com a story Determinate', () => {
    expect(progressBarSnippet({ value: 42, label: 'Progresso do upload' })).toContain(
      '<Progress :model-value="42" aria-label="Progresso do upload" />',
    );
  });

  it('o indeterminado não escreve valor nem aria-valuenow', () => {
    const saida = progressBarSnippet({ label: 'Processando…' });
    expect(saida).toContain('<Progress aria-label="Processando…" />');
    expect(saida).not.toContain('aria-valuenow');
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
    const saida = progressWithLabelSource();
    expect(saida).toContain('>42%</span>');
    expect(saida).toContain('aria-live="polite"');
    expect(saida).not.toContain('assertive');
    expect(saida).toContain('nds-tabular-nums');
  });

  it('a cor semântica sai de atributo', () => {
    const saida = progressSemanticColorSource();
    expect(saida).toContain('data-variant="success"');
    expect(saida).toContain('data-variant="destructive"');
    expect(saida).not.toContain(':class=');
  });

  it('a barra que avança desliga o relógio no desmonte', () => {
    const saida = progressAnimatedSource();
    expect(saida).toContain('const value = ref(0)');
    expect(saida).toContain(':model-value="value"');
    expect(saida).toContain('{{ value }}%');
    expect(saida).toContain('onUnmounted(() => clearInterval(timer))');
  });
});

describe('composições — o conjunto da referência', () => {
  it('o upload nomeia o arquivo', () => {
    expect(progressFileUploadSource()).toContain('aria-label="Progresso do upload de documento-final.pdf"');
  });

  it('as etapas anunciam o nome da etapa', () => {
    const saida = progressWizardStepsSource();
    expect(saida).toContain('aria-live="polite">Endereço</span>');
    expect(saida).toContain(':model-value="60"');
  });

  it('cada upload tem nome acessível próprio', () => {
    const nomes = progressMultipleUploadsSource().match(/aria-label="[^"]+"/g) ?? [];
    expect(nomes).toHaveLength(4);
    expect(new Set(nomes).size).toBe(4);
  });

  it('das três medidas, só as semânticas levam variante', () => {
    const saida = progressCustomColorSource();
    expect(saida.match(/data-variant=/g)).toHaveLength(2);
    expect(saida).toContain('<Progress :model-value="72" aria-label="Progresso do backup" />');
  });

  it('o contêiner ocupado declara aria-busy', () => {
    expect(progressAriaBusyContainerSource()).toContain('role="status" aria-busy="true"');
  });

  it('o texto anunciado próprio usa get-value-text com a assinatura da lib', () => {
    const saida = progressCustomValueTextSource();
    expect(saida).toContain(':get-value-text="filesText"');
    expect(saida).toContain('const filesText = (value: number | null | undefined, max: number) =>');
    expect(saida).toContain('aria-label="Processamento de arquivos"');
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
      const saida = fn();
      expect(saida).not.toContain('style=');
      expect(saida).not.toMatch(/\d+px/);
    }
  });

  it('toda barra tem nome acessível', () => {
    for (const fn of all) {
      const saida = fn();
      const barras = saida.match(/<Progress\b[^>]*>/g) ?? [];
      expect(barras.length).toBeGreaterThan(0);
      for (const barra of barras) expect(barra).toContain('aria-label="');
    }
  });

  it('todas importam do design system', () => {
    for (const fn of all) expect(fn()).toContain(IMPORT);
  });
});
