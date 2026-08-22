import { describe, expect, it } from 'vitest';
import {
  progressCarregandoSource,
  progressComRotuloSource,
  progressConcluidoSource,
  progressCorSemanticaSource,
  listSourceProgressColors,
  progressDeterminadoSource,
  progressIndeterminadoSource,
  progressListSource,
  progressProcessandoServidorSource,
  progressProcessandoSource,
  progressSource,
  progressUploadAnimadoSource,
  progressZeroSource,
} from './progress.source';

describe('progressSource', () => {
  it('sem args, entrega a barra com rótulo, porcentagem e nome próprio', () => {
    expect(progressSource()).toBe(
      `<script setup lang="ts">
import { Progress } from '@/components/ui/progress'
</script>

<template>
  <div class="nds-stack" data-spacing="xs">
    <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
      <span class="nds-text-foreground">Enviando arquivo</span>
      <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">0%</span>
    </div>
    <Progress :model-value="0" aria-label="Progresso do upload" />
  </div>
</template>`,
    );
  });

  it('o valor do control chega junto à barra e ao número ao lado', () => {
    // Dois números calculados à parte divergem; aqui os dois saem do mesmo arg.
    const saida = progressSource('', { args: { modelValue: 42 } });
    expect(saida).toContain(':model-value="42"');
    expect(saida).toContain('>42%</span>');
  });

  it('o valor sai escrito mesmo batendo com o padrão — ele é a API inteira', () => {
    // `0` e `null` desenham telas quase idênticas, e só uma delas informa o
    // progresso ao leitor de tela. Omitir o zero deixaria as duas
    // indistinguíveis justamente onde a diferença importa.
    expect(progressSource('', { args: { modelValue: 0 } })).toContain(':model-value="0"');
    expect(progressSource('', { args: { modelValue: null } })).toContain(':model-value="null"');
  });

  it('a escala máxima, essa sim, some quando é a de fábrica', () => {
    expect(progressSource('', { args: { max: 100 } })).not.toContain(':max=');
    expect(progressSource('', { args: { max: 60 } })).toContain(':max="60"');
  });

  it('ignora control que não é número — o espião de ação vira ruído no painel', () => {
    const saida = progressSource('', {
      args: { modelValue: (() => {}) as never, max: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('NaN');
    expect(saida).not.toContain(':max=');
    expect(saida).toContain(':model-value="0"');
  });
});

describe('transforms das stories de variante', () => {
  it('o valor conhecido é a barra sozinha, sem medida de largura cravada', () => {
    const saida = progressDeterminadoSource();
    expect(saida).toContain('<Progress :model-value="42" aria-label="Progresso do upload" />');
    // A barra ocupa a largura de quem a contém: não há prop de largura, e a
    // medida cravada da story existe só para a foto sair sempre igual.
    expect(saida).not.toContain('width');
  });

  it('o indeterminado é `null`, e não um número pequeno', () => {
    const saida = progressIndeterminadoSource();
    expect(saida).toContain(':model-value="null"');
    // `aria-valuenow` some sozinho quando não há valor: escrevê-lo à mão daria
    // "zero por cento" onde a verdade é "não sei quanto falta".
    expect(saida).not.toContain('aria-valuenow');
  });

  it('a barra com rótulo repete o valor para quem enxerga a tela', () => {
    const saida = progressComRotuloSource();
    expect(saida).toContain('>42%</span>');
    expect(saida).toContain('aria-live="polite"');
    // `assertive` interromperia o leitor de tela a cada avanço.
    expect(saida).not.toContain('assertive');
    // Sem `nds-tabular-nums` o número dança de largura e empurra o rótulo.
    expect(saida).toContain('nds-tabular-nums');
  });

  it('a cor semântica sai de atributo, e a trilha continua neutra', () => {
    const saida = progressCorSemanticaSource();
    expect(saida).toContain('data-variant="success"');
    expect(saida).toContain('data-variant="destructive"');
    // Classe montada em runtime não é auditável, e o contraste de 3:1 não pode
    // depender de qual variante alguém escolheu.
    expect(saida).not.toContain(':class=');
  });
});

describe('transforms das stories de estado', () => {
  it('o zero é escrito: é o que o separa do indeterminado', () => {
    const saida = progressZeroSource();
    expect(saida).toContain('<Progress :model-value="0" aria-label="Progresso do upload" />');
    expect(saida).not.toContain('null');
  });

  it('no meio do caminho o número ao lado bate com o valor da barra', () => {
    const saida = progressCarregandoSource();
    expect(saida).toContain(':model-value="50"');
    expect(saida).toContain('>50%</span>');
  });

  it('concluído não põe região viva num número que não muda mais', () => {
    const saida = progressConcluidoSource();
    expect(saida).toContain(':model-value="100"');
    expect(saida).toContain('>100%</span>');
    expect(saida).not.toContain('aria-live');
    // `data-state="complete"` é DERIVADO pelo componente: escrevê-lo à mão
    // ensinaria a duplicar o que ele já calcula.
    expect(saida).not.toContain('data-state');
  });

  it('sem valor o rótulo diz o que acontece, já que não há porcentagem', () => {
    const saida = progressProcessandoSource();
    expect(saida).toContain('<div class="nds-text-body">Processando…</div>');
    expect(saida).toContain(':model-value="null"');
    expect(saida).not.toContain('%');
  });
});

describe('transforms das stories de composição', () => {
  it('o upload animado desliga o relógio no desmonte', () => {
    const saida = progressUploadAnimadoSource();
    expect(saida).toContain('const valor = ref(0)');
    expect(saida).toContain(':model-value="valor"');
    expect(saida).toContain('{{ valor }}%');
    // Um `setInterval` sobrevivente continua escrevendo num componente que já
    // saiu da tela.
    expect(saida).toContain('onUnmounted');
    expect(saida).toContain('clearInterval(relogio)');
  });

  it('na lista o nome acessível sai do DADO, um por arquivo', () => {
    const saida = progressListSource();
    expect(saida).toContain(':aria-label="`Progresso do upload de ${item.nome}`"');
    // Repetir o mesmo rótulo nas três equivale a não nomear nenhuma: quem ouve
    // não saberia qual arquivo está a 92%.
    expect(saida).not.toContain('aria-label="Progresso do upload"');
    expect(saida).toContain('nds-list-none');
  });

  it('das três medidas, só as semânticas levam variante', () => {
    const saida = listSourceProgressColors();
    expect(saida.match(/data-variant=/g)).toHaveLength(2);
    // "Em andamento" não é semântico: a barra do meio fica sem variante.
    expect(saida).toContain('<Progress :model-value="72" aria-label="Progresso do backup" />');
  });

  it('o processamento no servidor não tem valor nem relógio', () => {
    const saida = progressProcessandoServidorSource();
    expect(saida).toContain(':model-value="null"');
    expect(saida).toContain('aria-label="Processando dados do servidor"');
    expect(saida).not.toContain('setInterval');
  });
});

describe('o snippet ensina o design system, não o andaime da story', () => {
  const todas = [
    progressSource,
    progressDeterminadoSource,
    progressIndeterminadoSource,
    progressComRotuloSource,
    progressCorSemanticaSource,
    progressZeroSource,
    progressCarregandoSource,
    progressConcluidoSource,
    progressProcessandoSource,
    progressUploadAnimadoSource,
    progressListSource,
    listSourceProgressColors,
    progressProcessandoServidorSource,
  ];

  it('nenhuma crava medida de desenho em style inline', () => {
    // As stories fixam 360px para a foto do Chromatic sair sempre do mesmo
    // tamanho. Copiado para o snippet, o valor sai do alcance do tema, da
    // densidade e da escala tipográfica — e o snippet é o markup que alguém
    // COPIA.
    for (const fn of todas) {
      const saida = fn();
      expect(saida).not.toContain('style=');
      expect(saida).not.toContain('360px');
      expect(saida).not.toContain('400px');
    }
  });

  it('toda barra tem nome acessível — o papel sozinho não diz de quê', () => {
    for (const fn of todas) {
      expect(fn()).toMatch(/<Progress[\s\S]*?:?aria-label="/);
    }
  });

  it('todas importam do design system, nunca de um caminho interno', () => {
    for (const fn of todas) {
      expect(fn()).toContain(`import { Progress } from '@/components/ui/progress'`);
    }
  });
});
