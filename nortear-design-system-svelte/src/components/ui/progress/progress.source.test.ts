import { describe, expect, it } from 'vitest';
import { progressSource } from './progress.source';

describe('progressSource', () => {
  it('sem args, entrega a barra nomeada pela operação', () => {
    expect(progressSource()).toBe(
      `<script lang="ts">
  import { Progress } from "@/components/ui/progress";
</script>

<Progress value={42} aria-label="Progresso do upload" />`,
    );
  });

  it('o valor nulo vira o modo indeterminado, e não zero', () => {
    // Zero e "não sei quanto falta" são telas parecidas e informações opostas.
    const saida = progressSource('', { args: { value: null, 'aria-label': 'Processando' } });
    expect(saida).toContain('<Progress value={null} aria-label="Processando" />');
  });

  it('só escreve max quando a escala não é a de 100', () => {
    expect(progressSource()).not.toContain('max=');
    expect(progressSource('', { args: { max: 60 } })).toContain('max={60}');
  });

  it('a cor semântica sai do atributo, não de uma classe', () => {
    expect(progressSource('', { args: { variant: 'success' } })).toContain('data-variant="success"');
    expect(progressSource()).not.toContain('data-variant');
  });

  it('classe utilitária extra entra só quando pedida', () => {
    expect(progressSource('', { args: { class: 'nds-w-full' } })).toContain('class="nds-w-full"');
    expect(progressSource()).not.toContain('class=');
  });

  it('rótulo e porcentagem sobem para uma linha acima da trilha', () => {
    const saida = progressSource('', {
      args: {
        value: 42,
        'aria-label': 'Enviando arquivo',
        showLabel: true,
        label: 'Enviando arquivo',
        showValue: true,
      },
    });
    expect(saida).toContain('<span class="nds-font-medium nds-text-foreground">Enviando arquivo</span>');
    // `polite` e não `assertive`: a cada passo o leitor seria interrompido.
    expect(saida).toContain('aria-live="polite">42%</span>');
    expect(saida).toContain('data-justify="between"');
  });

  it('sem valor não há porcentagem para exibir, mas o rótulo permanece', () => {
    const saida = progressSource('', {
      args: { value: null, showLabel: true, label: 'Processando…', showValue: true },
    });
    expect(saida).toContain('Processando…');
    expect(saida).not.toContain('aria-live');
  });

  it('o upload animado traz o relógio que faz a barra andar', () => {
    const saida = progressSource('', {
      args: {
        value: 0,
        animated: true,
        intervalMs: 500,
        step: 5,
        showLabel: true,
        label: 'Enviando arquivo',
        showValue: true,
      },
    });
    expect(saida).toContain('let valor = $state(0);');
    expect(saida).toContain('valor = valor >= 100 ? 0 : valor + 5;');
    expect(saida).toContain('}, 500);');
    expect(saida).toContain('return () => clearInterval(id);');
    expect(saida).toContain('<Progress value={valor}');
    expect(saida).toContain('>{valor}%</span>');
  });
});
