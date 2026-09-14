import { describe, expect, it } from 'vitest';
import * as progressSource from './progress.source';
import {
  progressAnimatedSource,
  progressCustomValueTextSource,
  progressIndeterminateSource,
  progressIndeterminateStateSource,
  progressPlaygroundSource,
  progressWithLabelSource,
} from './progress.source';

/**
 * A varredura genérica prova que o snippet importa o que usa e liga só o que a
 * classe declara. Estes casos guardam o que ela não alcança: que o snippet
 * omite o padrão, ensina valor desconhecido como AUSÊNCIA e não como zero, nunca
 * põe o valor em região `assertive`, usa a assinatura do formatador que o
 * componente declara — e que toda story tem o seu construtor.
 */

const stories = import.meta.glob<string>('./progress*.stories.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const component = import.meta.glob<string>('./progress.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
})['./progress.ts']!;

const constructors = Object.entries(progressSource).filter(
  (entry): entry is [string, () => string] => typeof entry[1] === 'function',
);

describe('cobertura das stories', () => {
  it('as quatro famílias de story existem', () => {
    expect(Object.keys(stories).sort()).toEqual([
      './progress-compositions.stories.ts',
      './progress-states.stories.ts',
      './progress-variants.stories.ts',
      './progress.stories.ts',
    ]);
  });

  for (const [path, text] of Object.entries(stories)) {
    it(`${path}: toda story publica um transform próprio`, () => {
      const declared = [...text.matchAll(/^export const (\w+): Story/gm)].map((m) => m[1]);
      // Pelo construtor, e não pela palavra: um comentário que diga "transform:"
      // contaria como story coberta.
      const transforms = text.match(/transform:\s*progress\w+Source\b/g) ?? [];
      expect(declared.length).toBeGreaterThan(0);
      expect(transforms.length).toBe(declared.length);
    });
  }

  it('todo construtor exportado é usado por alguma story', () => {
    const all = Object.values(stories).join('\n');
    const orphans = constructors.map(([name]) => name).filter((name) => !all.includes(name));
    expect(orphans).toEqual([]);
  });
});

describe('o que todo snippet ensina', () => {
  for (const [name, build] of constructors) {
    it(`${name} importa o barril e monta as três camadas`, () => {
      const code = build();
      expect(code).toContain("import { NDS_PROGRESS } from '@/components/ui/progress';");
      expect(code).toContain('imports: [...NDS_PROGRESS]');
      expect(code).toContain('<div ndsProgressTrack>');
      expect(code).toContain('<div ndsProgressIndicator></div>');
    });

    it(`${name} dá nome a toda barra`, () => {
      const code = build();
      for (const open of code.match(/<div ndsProgress\b[^>]*>/g) ?? []) {
        const named = open.includes('aria-label="') || code.includes('<span ndsProgressLabel>');
        expect(named, open).toBe(true);
      }
    });

    it(`${name} não vaza o andaime da story nem anuncia com interrupção`, () => {
      const code = build();
      expect(code).not.toContain('args.');
      expect(code).not.toContain('aria-live="assertive"');
      expect(code).not.toContain('style=');
    });
  }
});

describe('progressPlaygroundSource', () => {
  it('omite o que já é padrão', () => {
    const code = progressPlaygroundSource();
    expect(code).toContain('[value]="42"');
    expect(code).not.toContain('[min]');
    expect(code).not.toContain('[max]');
    expect(code).not.toContain('data-variant');
  });

  it('acompanha os controls', () => {
    const code = progressPlaygroundSource('', {
      args: { value: 30, min: 10, max: 200, variant: 'success', ariaLabel: 'Progresso do backup' },
    });
    expect(code).toContain('[value]="30"');
    expect(code).toContain('[min]="10"');
    expect(code).toContain('[max]="200"');
    expect(code).toContain('data-variant="success"');
    expect(code).toContain('aria-label="Progresso do backup"');
  });

  it('valor ausente do control vira o modo indeterminado, e não zero', () => {
    for (const value of [null, Number.NaN]) {
      const code = progressPlaygroundSource('', { args: { value } });
      expect(code).not.toContain('[value]');
    }
  });
});

describe('valor desconhecido', () => {
  it('a variante indeterminada OMITE o valor', () => {
    expect(progressIndeterminateSource()).not.toContain('[value]');
  });

  it('o estado indeterminado escreve `null`, nunca zero', () => {
    const code = progressIndeterminateStateSource();
    expect(code).toContain('[value]="null"');
    expect(code).not.toContain('[value]="0"');
  });
});

describe('formas alternativas', () => {
  it('o rótulo pela peça dispensa o aria-label', () => {
    const code = progressWithLabelSource();
    expect(code).toContain('<span ndsProgressLabel>Enviando arquivo</span>');
    expect(code).toContain('<span ndsProgressValue></span>');
    expect(code).not.toContain('aria-label=');
  });

  it('a barra que avança liga o valor a um sinal e anuncia em região polite', () => {
    const code = progressAnimatedSource();
    expect(code).toContain("import { Component, DestroyRef, inject, signal } from '@angular/core';");
    expect(code).toContain('[value]="progress()"');
    expect(code).toContain('aria-live="polite"');
    expect(code).toContain('clearInterval');
  });

  it('o texto anunciado usa a entrada e a assinatura que o componente declara', () => {
    const code = progressCustomValueTextSource();
    expect(code).toContain('[getAriaValueText]="filesText"');
    const signature = '(value: number | null, min: number, max: number)';
    expect(code).toContain(`readonly filesText = ${signature} =>`);
    // Se a assinatura do componente mudar, o snippet ensina a errada.
    expect(component).toContain(`export type ProgressValueTextFormatter = ${signature} => string;`);
    expect(component).toContain('readonly getAriaValueText = input<');
  });
});
