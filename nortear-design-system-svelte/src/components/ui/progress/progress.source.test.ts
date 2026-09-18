import { describe, expect, it } from 'vitest';
import { progressSource, progressValueTextSource } from './progress.source';

describe('progressSource', () => {
  it('sem args, entrega a barra nomeada e sem valor — o indeterminado', () => {
    expect(progressSource()).toBe(
      `<script lang="ts">
  import { Progress } from "@/components/ui/progress";
</script>

<Progress aria-label="Progresso do upload" />`,
    );
  });

  it('omitir o valor não escreve value; null escreve, e os dois são indeterminado', () => {
    // Ensinar `value={null}` onde basta omitir faria parecer obrigatório.
    expect(progressSource('', { args: { 'aria-label': 'Processando…' } })).toContain(
      '<Progress aria-label="Processando…" />',
    );
    expect(progressSource('', { args: { value: null, 'aria-label': 'Processando…' } })).toContain(
      '<Progress value={null} aria-label="Processando…" />',
    );
  });

  it('zero é valor, não ausência', () => {
    expect(progressSource('', { args: { value: 0 } })).toContain('<Progress value={0}');
  });

  it('min e max só entram quando saem do padrão 0–100', () => {
    expect(progressSource('', { args: { value: 42, min: 0, max: 100 } })).not.toMatch(/min=|max=/);
    const output = progressSource('', { args: { value: 30, min: 20, max: 60 } });
    expect(output).toContain('min={20}');
    expect(output).toContain('max={60}');
  });

  it('a cor semântica sai do atributo, não de uma classe', () => {
    expect(progressSource('', { args: { value: 100, variant: 'success' } })).toContain('data-variant="success"');
    expect(progressSource('', { args: { value: 100 } })).not.toContain('data-variant');
  });

  it('WithLabel: rótulo e percentual sobem para uma linha acima da trilha', () => {
    const output = progressSource('', {
      args: { value: 42, 'aria-label': 'Enviando arquivo', label: 'Enviando arquivo', showValue: true },
    });
    expect(output).toContain('<span class="nds-text-foreground">Enviando arquivo</span>');
    // `polite` e não `assertive`: a cada passo o leitor seria interrompido.
    expect(output).toContain('<span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">42%</span>');
    expect(output).toContain('data-justify="between"');
    expect(output).not.toContain('style=');
  });

  it('sem valor não há percentual para exibir, mas o rótulo permanece', () => {
    const output = progressSource('', { args: { value: null, label: 'Processando…', showValue: true } });
    expect(output).toContain('Processando…');
    expect(output).not.toContain('aria-live');
  });

  it('WizardSteps: a etapa ocupa o lugar do percentual, sem números tabulares', () => {
    const output = progressSource('', {
      args: {
        value: 60,
        label: 'Etapa 3 de 5',
        strongLabel: true,
        valueText: 'Endereço',
        'aria-label': 'Progresso do cadastro: etapa 3 de 5',
      },
    });
    expect(output).toContain('<span class="nds-text-foreground nds-font-medium">Etapa 3 de 5</span>');
    expect(output).toContain('<span class="nds-text-muted-foreground" aria-live="polite">Endereço</span>');
  });

  it('SemanticColor: duas barras, uma por variante, numa pilha', () => {
    const output = progressSource('', {
      args: {
        items: [
          { value: 100, variant: 'success', 'aria-label': 'Sincronização concluída' },
          { value: 92, variant: 'destructive', 'aria-label': 'Espaço de armazenamento quase esgotado' },
        ],
      },
    });
    expect(output).toContain('<div class="nds-stack" data-spacing="sm">');
    expect(output).toContain('<Progress value={100} data-variant="success" aria-label="Sincronização concluída" />');
    expect(output).toContain(
      '<Progress value={92} data-variant="destructive" aria-label="Espaço de armazenamento quase esgotado" />',
    );
  });

  it('MultipleUploads: cada barra leva o próprio rótulo e nome acessível', () => {
    const output = progressSource('', {
      args: {
        spacing: 'md',
        items: [
          { value: 100, label: 'foto-1.jpg', showValue: true, 'aria-label': 'Upload de foto-1.jpg concluído' },
          { value: 0, label: 'foto-4.jpg', showValue: true, 'aria-label': 'Upload de foto-4.jpg aguardando' },
        ],
      },
    });
    expect(output).toContain('data-spacing="md"');
    expect(output).toContain('aria-live="polite">100%</span>');
    expect(output).toContain('aria-live="polite">0%</span>');
    expect(output.match(/<Progress /g)).toHaveLength(2);
  });

  it('FileUpload: o cartão traz arquivo e tamanho, sem se declarar ocupado', () => {
    const output = progressSource('', {
      args: {
        card: { title: 'documento-final.pdf', meta: '2.4 MB de 5.0 MB' },
        value: 48,
        label: 'Enviando arquivo',
        showValue: true,
        'aria-label': 'Progresso do upload de documento-final.pdf',
      },
    });
    expect(output).toContain('<div class="nds-text-body nds-font-medium">documento-final.pdf</div>');
    expect(output).toContain('<div class="nds-text-caption nds-text-muted-foreground">2.4 MB de 5.0 MB</div>');
    expect(output).not.toContain('aria-busy');
  });

  it('AriaBusyContainer: o contêiner se declara ocupado ao redor da barra', () => {
    const output = progressSource('', {
      args: {
        card: { title: 'Processando relatório', meta: 'Isso pode levar alguns minutos.', busy: true },
        value: 35,
        label: 'Analisando dados',
        showValue: true,
        'aria-label': 'Progresso da análise de dados',
      },
    });
    expect(output).toContain('role="status" aria-busy="true"');
    expect(output).toContain('<Progress value={35} aria-label="Progresso da análise de dados" />');
  });

  it('Animated: o relógio que faz a barra andar viaja com o snippet', () => {
    const output = progressSource('', {
      args: {
        value: 0,
        animated: true,
        intervalMs: 400,
        step: 5,
        label: 'Enviando arquivo',
        showValue: true,
        'aria-label': 'Progresso do upload',
      },
    });
    expect(output).toContain('let value = $state(0);');
    expect(output).toContain('value = value >= 100 ? 0 : value + 5;');
    expect(output).toContain('}, 400);');
    expect(output).toContain('return () => clearInterval(id);');
    expect(output).toContain('<Progress value={value} aria-label="Progresso do upload" />');
    expect(output).toContain('aria-live="polite">{value}%</span>');
  });
});

describe('cada story sai dos PRÓPRIOS args', () => {
  it('os estados escrevem o valor e o nome que aquela story renderiza', () => {
    // A transform do meta cascateia, mas o que ela lê são os `args` de cada
    // story: o painel de uma não pode sair no lugar do da outra.
    expect(progressSource('', { args: { value: 0, 'aria-label': 'Progresso do upload' } })).toContain(
      '<Progress value={0} aria-label="Progresso do upload" />',
    );
    expect(progressSource('', { args: { value: 50, 'aria-label': 'Carregando dados' } })).toContain(
      '<Progress value={50} aria-label="Carregando dados" />',
    );
    expect(progressSource('', { args: { value: 100, 'aria-label': 'Concluído' } })).toContain(
      '<Progress value={100} aria-label="Concluído" />',
    );
    expect(
      progressSource('', { args: { value: null, 'aria-label': 'Processando dados' } }),
    ).toContain('<Progress value={null} aria-label="Processando dados" />');
  });

  it('a Animated traz o bloco inteiro: rótulo, região polite e o laço', () => {
    const output = progressSource('', {
      args: {
        value: 0,
        'aria-label': 'Progresso do upload',
        label: 'Enviando arquivo',
        showValue: true,
        animated: true,
        intervalMs: 400,
        step: 5,
      },
    });
    expect(output).toContain('<div class="nds-stack" data-spacing="xs">');
    expect(output).toContain('<span class="nds-text-foreground">Enviando arquivo</span>');
    expect(output).toContain('aria-live="polite">{value}%</span>');
    expect(output).toContain('const id = setInterval(() => {');
    expect(output).toContain('<Progress value={value} aria-label="Progresso do upload" />');
  });
});

describe('progressValueTextSource', () => {
  it('CustomValueText: ensina a função com a assinatura do wrapper', () => {
    const output = progressValueTextSource();
    expect(output).toContain('import { Progress } from "@/components/ui/progress";');
    expect(output).toContain('aria-label="Processamento de arquivos"');
    expect(output).toContain('function filesText(value: number | null, min: number, max: number): string {');
    expect(output).toContain("return value === null ? 'Contando arquivos' : `${value} de ${max} arquivos`;");
    expect(output).toContain('getAriaValueText={filesText} />');
  });
});
