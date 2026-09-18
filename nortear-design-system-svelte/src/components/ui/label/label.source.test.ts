import { describe, expect, it } from 'vitest';
import {
  labelWithBoxSource,
  labelWithFieldSource,
  labelDisabledSiblingSource,
  blockLabelDisabledSource,
  labelObrigatorioSource,
  labelSource,
} from './label.source';

describe('labelSource', () => {
  it('sem args, entrega o rótulo associado ao campo por for/id', () => {
    expect(labelSource()).toBe(
      `<script lang="ts">
  import { Label } from "@/components/ui/label";
  import { Input } from "@/components/ui/input";
</script>

<div class="nds-stack" data-spacing="xs">
  <Label for="nome">Nome completo</Label>
  <Input id="nome" type="text" placeholder="ex: João da Silva" />
</div>`,
    );
  });

  it('só escreve class quando o control traz alguma', () => {
    // Sem valor, o atributo nem aparece: `class=""` no snippet ensinaria ruído.
    expect(labelSource('', { args: { class: '' } })).toContain(
      '<Label for="nome">Nome completo</Label>',
    );
    expect(labelSource('', { args: { class: 'nds-text-caption' } })).toContain(
      '<Label for="nome" class="nds-text-caption">Nome completo</Label>',
    );
  });

  it('o control de obrigatório acrescenta o marcador decorativo e o aria-required', () => {
    const defaultCode = labelSource('', { args: { required: false } });
    expect(defaultCode).not.toContain('aria-required');
    expect(defaultCode).not.toContain('aria-hidden');

    const required = labelSource('', { args: { required: true } });
    expect(required).toContain('<span class="nds-text-destructive" aria-hidden="true">*</span>');
    // A obrigatoriedade é anunciada pelo CONTROLE, não pelo rótulo.
    expect(required).toContain('aria-required="true"');
  });
});

describe('transforms das stories de estado e composição', () => {
  it('o campo obrigatório mantém o asterisco fora do nome acessível', () => {
    const output = labelObrigatorioSource();
    expect(output).toContain('aria-hidden="true">*</span>');
    expect(output).toContain('aria-required="true"');
  });

  it('o desabilitado por irmão marca o CONTROLE e põe o rótulo depois dele', () => {
    const output = labelDisabledSiblingSource();
    expect(output).toContain('class="nds-peer"');
    // Ordem é a lição: o seletor de irmão só alcança o que vem depois.
    expect(output.indexOf('<Input')).toBeLessThan(output.indexOf('<Label'));
  });

  it('o desabilitado por bloco marca o ancestral, não o rótulo', () => {
    const output = blockLabelDisabledSource();
    expect(output).toContain('data-disabled="true"');
    expect(output).toContain('<Label for="documento">Documento</Label>');
  });

  it('a composição com campo usa o tipo semântico do dado', () => {
    expect(labelWithFieldSource()).toContain('type="tel"');
  });

  it('a composição com caixa de seleção importa o controle certo', () => {
    const output = labelWithBoxSource();
    expect(output).toContain('from "@/components/ui/checkbox"');
    expect(output).toContain('<Label for="termos">Concordo com os termos de uso</Label>');
  });
});
