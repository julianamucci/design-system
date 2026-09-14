import { describe, expect, it } from 'vitest';
import {
  progressAnimadoSnippet,
  progressComRotuloSnippet,
  progressCustomTextSnippet,
  progressListaSnippet,
  progressOcupadoSnippet,
  progressSnippet,
  progressSource,
  progressSourceCustomText,
  progressSourceWith,
  progressSourceLista,
  progressSourceLabel,
} from './progress.source';

describe('faixa e forma omitida do indeterminado', () => {
  it('mostra `min` só quando difere do padrão', () => {
    expect(progressSnippet({ min: 0 })).not.toContain('min:');
    expect(progressSnippet({ value: 15, min: 10, max: 20 })).toContain('min: 10');
  });

  it('a forma omitida não escreve `value` nenhum — nem `null`, nem o exemplo', () => {
    // A story `Indeterminate` de Variants afirma o valor OMITIDO; um snippet
    // com `value: null` ensinaria a outra forma ao lado dela.
    const code = progressSnippet({ valueOmitted: true, 'aria-label': 'Processando…' });
    expect(code).not.toContain('value:');
    expect(code).toContain('Em andamento');
  });
});

describe('progressCustomTextSnippet', () => {
  it('ensina a função com a assinatura da fábrica, e o nome da barra', () => {
    const code = progressCustomTextSnippet({ value: 42 });
    expect(code).toContain('getAriaValueText: (value, min, max) =>');
    expect(code).toContain("'aria-label': 'Processamento de arquivos'");
    expect(code).toContain('value: 42');
    // Sem valor a função também precisa dizer algo — o ramo `null` é parte do
    // que se copia.
    expect(code).toContain('value === null');
  });

  it('a transform entrega a mesma forma', () => {
    expect(progressSourceCustomText({ value: 42 })('', {})).toContain('getAriaValueText');
  });
});

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

  it('sem título, o bloco fica solto — nenhum cartão inventado', () => {
    const code = progressComRotuloSnippet({ value: 42 });
    expect(code).not.toContain('cartao');
    expect(code).toContain("bloco.className = 'nds-stack nds-w-md';");
  });

  it('com título, ensina o cartão do arquivo que a story FileUpload renderiza', () => {
    const code = progressComRotuloSnippet({
      value: 48,
      title: 'documento-final.pdf',
      meta: '2.4 MB de 5.0 MB',
      label: 'Enviando arquivo',
      'aria-label': 'Progresso do upload de documento-final.pdf',
    });
    expect(code).toContain("titulo.textContent = 'documento-final.pdf';");
    expect(code).toContain("meta.textContent = '2.4 MB de 5.0 MB';");
    expect(code).toContain("nome.textContent = 'Enviando arquivo';");
    expect(code).toContain('nds-bg-card');
    expect(code).toContain('cartao.append(titulo, meta, bloco);');
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
    // Sem rótulo visível nos itens, a lista não carrega a função de linha.
    expect(code).not.toContain('comRotulo');
  });

  it('com rótulos, cada barra ganha a linha de rótulo e valor', () => {
    const code = progressListaSnippet([
      { value: 100, label: 'foto-1.jpg', 'aria-label': 'Upload de foto-1.jpg concluído' },
      { value: 74, label: 'foto-2.jpg', 'aria-label': 'Progresso do upload de foto-2.jpg' },
    ]);
    expect(code).toContain('function comRotulo(rotulo, barra)');
    expect(code).toContain("comRotulo('foto-1.jpg', createProgress(");
    expect(code).toContain("comRotulo('foto-2.jpg', createProgress(");
    expect(code).toContain("setAttribute('aria-live', 'polite')");
    expect(code.match(/createProgress\(/g)).toHaveLength(2);
  });
});

describe('progressAnimadoSnippet', () => {
  it('avança pela mesma custom property que a fábrica alimenta', () => {
    const code = progressAnimadoSnippet({ value: 0 });
    expect(code).toContain("setProperty('--value'");
    expect(code).toContain("setAttribute('aria-valuenow'");
    // O texto anunciado anda junto com o número, senão diria "0%" o tempo todo.
    expect(code).toContain("setAttribute('aria-valuetext'");
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

  it('ensina título, descrição e a linha de rótulo e valor da story', () => {
    const code = progressOcupadoSnippet({
      value: 35,
      title: 'Processando relatório',
      description: 'Isso pode levar alguns minutos.',
      label: 'Analisando dados',
      'aria-label': 'Progresso da análise de dados',
    });
    expect(code).toContain("titulo.textContent = 'Processando relatório';");
    expect(code).toContain("descricao.textContent = 'Isso pode levar alguns minutos.';");
    expect(code).toContain("nome.textContent = 'Analisando dados';");
    expect(code).toContain("valor.textContent = '35%';");
    expect(code).toContain('cartao.append(titulo, descricao, bloco);');
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

describe('progressSourceLista — espaçamento', () => {
  it('a lista usa o espaçamento que a story renderiza', () => {
    const items = [{ value: 100, 'aria-label': 'Uma barra' }];
    expect(progressSourceLista(items)('', {})).toContain("lista.dataset.spacing = 'md';");
    expect(progressSourceLista(items, 'sm')('', {})).toContain("lista.dataset.spacing = 'sm';");
  });
});
