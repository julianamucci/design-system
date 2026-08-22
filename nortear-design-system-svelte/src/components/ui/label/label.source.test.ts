import { describe, expect, it } from 'vitest';
import {
  labelWithBoxSource,
  labelComCampoSource,
  labelDisabledSiblingSource,
  blockSourceLabelDisabled,
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
    const padrao = labelSource('', { args: { required: false } });
    expect(padrao).not.toContain('aria-required');
    expect(padrao).not.toContain('aria-hidden');

    const obrigatorio = labelSource('', { args: { required: true } });
    expect(obrigatorio).toContain('<span class="nds-text-destructive" aria-hidden="true">*</span>');
    // A obrigatoriedade é anunciada pelo CONTROLE, não pelo rótulo.
    expect(obrigatorio).toContain('aria-required="true"');
  });
});

describe('transforms das stories de estado e composição', () => {
  it('o campo obrigatório mantém o asterisco fora do nome acessível', () => {
    const saida = labelObrigatorioSource();
    expect(saida).toContain('aria-hidden="true">*</span>');
    expect(saida).toContain('aria-required="true"');
  });

  it('o desabilitado por irmão marca o CONTROLE e põe o rótulo depois dele', () => {
    const saida = labelDisabledSiblingSource();
    expect(saida).toContain('class="nds-peer"');
    // Ordem é a lição: o seletor de irmão só alcança o que vem depois.
    expect(saida.indexOf('<Input')).toBeLessThan(saida.indexOf('<Label'));
  });

  it('o desabilitado por bloco marca o ancestral, não o rótulo', () => {
    const saida = blockSourceLabelDisabled();
    expect(saida).toContain('data-disabled="true"');
    expect(saida).toContain('<Label for="documento">Documento</Label>');
  });

  it('a composição com campo usa o tipo semântico do dado', () => {
    expect(labelComCampoSource()).toContain('type="tel"');
  });

  it('a composição com caixa de seleção importa o controle certo', () => {
    const saida = labelWithBoxSource();
    expect(saida).toContain('from "@/components/ui/checkbox"');
    expect(saida).toContain('<Label for="termos">Concordo com os termos de uso</Label>');
  });
});
