import { describe, expect, it } from 'vitest';
import {
  progressAnimadoSnippet,
  progressComRotuloSnippet,
  progressListaSnippet,
  progressOcupadoSnippet,
  progressSnippet,
  progressSource,
  progressSourceWith,
  progressSourceLista,
  progressSourceLabel,
} from './progress.source';

describe('progressSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML da barra', () => {
    const code = progressSnippet();
    expect(code).toContain("import { createProgress } from '@/components/ui/progress';");
    expect(code).toContain('createProgress({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="progressbar"');
  });

  it('usa o nome acessível canônico, nunca o apelido', () => {
    const code = progressSnippet({ 'aria-label': 'Progresso do backup' });
    expect(code).toContain("'aria-label': 'Progresso do backup'");
    expect(code).not.toContain('ariaLabel');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = progressSnippet();
    expect(code).not.toContain('max:');
    expect(code).not.toContain('variant');
    expect(code).not.toContain('className');
  });

  it('o control vazio de variante não vira uma opção vazia no snippet', () => {
    // O Playground manda `''` quando a barra usa o primário.
    expect(progressSnippet({ variant: '' })).not.toContain('variant');
  });

  it('mostra as opções quando a story as usa', () => {
    const code = progressSnippet({ value: 92, max: 200, variant: 'destructive' });
    expect(code).toContain('value: 92');
    expect(code).toContain('max: 200');
    expect(code).toContain("variant: 'destructive'");
  });

  it('o modo sem estimativa entra como `null`, e não como zero', () => {
    const code = progressSnippet({ value: null, 'aria-label': 'Processando…' });
    expect(code).toContain('value: null');
    expect(code).not.toContain('value: 0');
  });

  it('não vaza o andaime das stories', () => {
    const code = progressSnippet();
    expect(code).not.toContain('buildBar');
    expect(code).not.toContain('buildLabeled');
  });
});

describe('progressComRotuloSnippet', () => {
  it('compõe rótulo e valor acima da barra, em região polite', () => {
    const code = progressComRotuloSnippet({
      value: 48,
      label: 'Enviando arquivo',
      'aria-label': 'Progresso do upload de documento-final.pdf',
    });
    expect(code).toContain("nome.textContent = 'Enviando arquivo';");
    expect(code).toContain("valor.textContent = '48%';");
    expect(code).toContain("setAttribute('aria-live', 'polite')");
    // O comentário do snippet CITA `assertive` para dizer por que não usá-lo —
    // a asserção é sobre a chamada, não sobre a palavra.
    expect(code).not.toContain("'aria-live', 'assertive'");
    expect(code).toContain('createProgress({');
  });

  it('deixa a região anunciar o texto da etapa quando não é porcentagem', () => {
    const code = progressComRotuloSnippet({
      value: 60,
      label: 'Etapa 3 de 5',
      valueText: 'Endereço',
    });
    expect(code).toContain("valor.textContent = 'Endereço';");
    expect(code).not.toContain("valor.textContent = '60%';");
  });
});

describe('progressListaSnippet', () => {
  it('mostra uma chamada por barra, cada uma com o próprio nome', () => {
    const code = progressListaSnippet([
      { value: 100, variant: 'success', 'aria-label': 'Sincronização concluída' },
      { value: 92, variant: 'destructive', 'aria-label': 'Espaço quase esgotado' },
    ]);
    expect(code.match(/createProgress\(/g)).toHaveLength(2);
    expect(code).toContain("variant: 'success'");
    expect(code).toContain("'aria-label': 'Espaço quase esgotado'");
  });
});

describe('progressAnimadoSnippet', () => {
  it('avança pela mesma custom property que a fábrica alimenta', () => {
    const code = progressAnimadoSnippet({ value: 0 });
    expect(code).toContain("setProperty('--value'");
    expect(code).toContain("setAttribute('aria-valuenow'");
    // Escrever largura ou transform passaria por cima da folha compartilhada.
    expect(code).not.toContain('style.width');
    expect(code).not.toContain('style.transform');
  });
});

describe('progressOcupadoSnippet', () => {
  it('declara o contêiner ocupado ao redor da barra', () => {
    const code = progressOcupadoSnippet({ value: 35 });
    expect(code).toContain("setAttribute('role', 'status')");
    expect(code).toContain("setAttribute('aria-busy', 'true')");
    expect(code).toContain('value: 35');
  });
});

describe('progressSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = progressSource('<div data-slot="progress">', {});
    const withArgs = progressSource('<div data-slot="progress">', {
      args: { value: 75, 'aria-label': 'Carregando dados' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain('value: 75');
    expect(withArgs).toContain("'aria-label': 'Carregando dados'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(progressSource('<div role="progressbar" aria-valuenow="42">', {})).not.toContain(
      'aria-valuenow="42"',
    );
  });
});

describe('progressSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = progressSourceWith({ value: null });
    const code = transform('', { args: { value: 42 } });
    expect(code).toContain('value: null');
    expect(code).not.toContain('value: 42');
  });
});

describe('as transforms das formas alternativas', () => {
  it('entregam a forma que a story pede', () => {
    expect(progressSourceLabel({ value: 48 })('', {})).toContain("aria-live', 'polite'");
    expect(
      progressSourceLista([{ value: 10, 'aria-label': 'Uma barra' }])('', {}),
    ).toContain("'aria-label': 'Uma barra'");
  });
});
