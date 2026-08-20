import { describe, expect, it } from 'vitest';
import {
  progressAnimadoSnippet,
  progressComRotuloSnippet,
  progressListaSnippet,
  progressOcupadoSnippet,
  progressSnippet,
  progressSource,
  progressSourceCom,
  progressSourceLista,
  progressSourceRotulo,
} from './progress.source';

describe('progressSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML da barra', () => {
    const código = progressSnippet();
    expect(código).toContain("import { createProgress } from '@/components/ui/progress';");
    expect(código).toContain('createProgress({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('role="progressbar"');
  });

  it('usa o nome acessível canônico, nunca o apelido', () => {
    const código = progressSnippet({ 'aria-label': 'Progresso do backup' });
    expect(código).toContain("'aria-label': 'Progresso do backup'");
    expect(código).not.toContain('ariaLabel');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = progressSnippet();
    expect(código).not.toContain('max:');
    expect(código).not.toContain('variant');
    expect(código).not.toContain('className');
  });

  it('o control vazio de variante não vira uma opção vazia no snippet', () => {
    // O Playground manda `''` quando a barra usa o primário.
    expect(progressSnippet({ variant: '' })).not.toContain('variant');
  });

  it('mostra as opções quando a story as usa', () => {
    const código = progressSnippet({ value: 92, max: 200, variant: 'destructive' });
    expect(código).toContain('value: 92');
    expect(código).toContain('max: 200');
    expect(código).toContain("variant: 'destructive'");
  });

  it('o modo sem estimativa entra como `null`, e não como zero', () => {
    const código = progressSnippet({ value: null, 'aria-label': 'Processando…' });
    expect(código).toContain('value: null');
    expect(código).not.toContain('value: 0');
  });

  it('não vaza o andaime das stories', () => {
    const código = progressSnippet();
    expect(código).not.toContain('buildBar');
    expect(código).not.toContain('buildLabeled');
  });
});

describe('progressComRotuloSnippet', () => {
  it('compõe rótulo e valor acima da barra, em região polite', () => {
    const código = progressComRotuloSnippet({
      value: 48,
      label: 'Enviando arquivo',
      'aria-label': 'Progresso do upload de documento-final.pdf',
    });
    expect(código).toContain("nome.textContent = 'Enviando arquivo';");
    expect(código).toContain("valor.textContent = '48%';");
    expect(código).toContain("setAttribute('aria-live', 'polite')");
    // O comentário do snippet CITA `assertive` para dizer por que não usá-lo —
    // a asserção é sobre a chamada, não sobre a palavra.
    expect(código).not.toContain("'aria-live', 'assertive'");
    expect(código).toContain('createProgress({');
  });

  it('deixa a região anunciar o texto da etapa quando não é porcentagem', () => {
    const código = progressComRotuloSnippet({
      value: 60,
      label: 'Etapa 3 de 5',
      valueText: 'Endereço',
    });
    expect(código).toContain("valor.textContent = 'Endereço';");
    expect(código).not.toContain("valor.textContent = '60%';");
  });
});

describe('progressListaSnippet', () => {
  it('mostra uma chamada por barra, cada uma com o próprio nome', () => {
    const código = progressListaSnippet([
      { value: 100, variant: 'success', 'aria-label': 'Sincronização concluída' },
      { value: 92, variant: 'destructive', 'aria-label': 'Espaço quase esgotado' },
    ]);
    expect(código.match(/createProgress\(/g)).toHaveLength(2);
    expect(código).toContain("variant: 'success'");
    expect(código).toContain("'aria-label': 'Espaço quase esgotado'");
  });
});

describe('progressAnimadoSnippet', () => {
  it('avança pela mesma custom property que a fábrica alimenta', () => {
    const código = progressAnimadoSnippet({ value: 0 });
    expect(código).toContain("setProperty('--value'");
    expect(código).toContain("setAttribute('aria-valuenow'");
    // Escrever largura ou transform passaria por cima da folha compartilhada.
    expect(código).not.toContain('style.width');
    expect(código).not.toContain('style.transform');
  });
});

describe('progressOcupadoSnippet', () => {
  it('declara o contêiner ocupado ao redor da barra', () => {
    const código = progressOcupadoSnippet({ value: 35 });
    expect(código).toContain("setAttribute('role', 'status')");
    expect(código).toContain("setAttribute('aria-busy', 'true')");
    expect(código).toContain('value: 35');
  });
});

describe('progressSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const semArgs = progressSource('<div data-slot="progress">', {});
    const comArgs = progressSource('<div data-slot="progress">', {
      args: { value: 75, 'aria-label': 'Carregando dados' },
    });
    expect(semArgs).not.toBe(comArgs);
    expect(comArgs).toContain('value: 75');
    expect(comArgs).toContain("'aria-label': 'Carregando dados'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(progressSource('<div role="progressbar" aria-valuenow="42">', {})).not.toContain(
      'aria-valuenow="42"',
    );
  });
});

describe('progressSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = progressSourceCom({ value: null });
    const código = transform('', { args: { value: 42 } });
    expect(código).toContain('value: null');
    expect(código).not.toContain('value: 42');
  });
});

describe('as transforms das formas alternativas', () => {
  it('entregam a forma que a story pede', () => {
    expect(progressSourceRotulo({ value: 48 })('', {})).toContain("aria-live', 'polite'");
    expect(
      progressSourceLista([{ value: 10, 'aria-label': 'Uma barra' }])('', {}),
    ).toContain("'aria-label': 'Uma barra'");
  });
});
