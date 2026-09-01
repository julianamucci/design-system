import { useCallback, useEffect, useMemo, useState } from "react"
import { Eye, EyeOff, Search } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
  type InputGroupAlign,
} from "@/components/ui/input-group"
import { inputGroupSnippet } from "@/components/ui/input-group.source"
import { useTranslation } from "@/lib/i18n"
import { useSeoEffect } from "@/lib/use-seo"
import { track } from "@/lib/analytics"
import { useActiveSection } from "@/lib/use-active-section"
import uiTranslations from "@/i18n/ui.json"
import inputGroupTranslations from "@shared/content/input-group/translations.json"

import { DocsHeader } from "@/components/docs/shared/sections/DocsHeader"
import { DocsPageLayout } from "@/components/docs/shared/sections/DocsPageLayout"
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration"
import { DocsAnatomy } from "@/components/docs/shared/sections/DocsAnatomy"
import { DocsWhenToUse } from "@/components/docs/shared/sections/DocsWhenToUse"
import { DocsDoDont } from "@/components/docs/shared/sections/DocsDoDont"
import { DocsImport } from "@/components/docs/shared/sections/DocsImport"
import { DocsVariants } from "@/components/docs/shared/sections/DocsVariants"
import { DocsCompositions } from "@/components/docs/shared/sections/DocsCompositions"
import { DocsStates } from "@/components/docs/shared/sections/DocsStates"
import { DocsProps } from "@/components/docs/shared/sections/DocsProps"
import { DocsTokens } from "@/components/docs/shared/sections/DocsTokens"
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility"
import { DocsRelated } from "@/components/docs/shared/sections/DocsRelated"
import { DocsNotes } from "@/components/docs/shared/sections/DocsNotes"
import { DocsAnalytics } from "@/components/docs/shared/sections/DocsAnalytics"
import { DocsTestes } from "@/components/docs/shared/sections/DocsTestes"
import { stripHtml, toPlainText } from "@/lib/strip-html"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SLUG = "input-group"

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
}

/** Onde o botão de revelar a senha vive. Valor ESTÁVEL: nunca texto traduzido. */
type DemoLocation = "docs_demo" | "docs_composition"

// ─── Nav ─────────────────────────────────────────────────────────────────────
//
// Com Variantes E Composições: o conteúdo compartilhado deste componente traz
// `variants.items` (as quatro posições do addon) e `variants.compositions` (as
// quatro montagens canônicas), e as duas seções são obrigatórias por isso.
const getNavGroups = (t: (key: string) => string) => [
  {
    label: t("nav.overview"),
    sections: [
      { id: "demonstracao", label: t("nav.demonstration") },
      { id: "anatomia", label: t("nav.anatomy") },
      { id: "quando-usar", label: t("nav.usage") },
      { id: "do-dont", label: t("nav.doDont") },
    ],
  },
  {
    label: t("nav.techRef"),
    sections: [
      { id: "importacao", label: t("nav.import") },
      { id: "variantes", label: t("nav.variants") },
      { id: "composicoes", label: t("nav.compositions") },
      { id: "estados", label: t("nav.states") },
      { id: "propriedades", label: t("nav.props") },
      { id: "tokens", label: t("nav.tokens") },
    ],
  },
  {
    label: t("nav.context"),
    sections: [
      { id: "acessibilidade", label: t("nav.accessibility") },
      { id: "relacionados", label: t("nav.related") },
      { id: "notas", label: t("nav.notes") },
    ],
  },
  {
    label: t("nav.quality"),
    sections: [
      { id: "analytics", label: t("nav.analytics") },
      { id: "testes", label: t("nav.testes") },
    ],
  },
]

// ─── Tokens ──────────────────────────────────────────────────────────────────
//
// Chave do conteúdo → token, conferidos um a um contra a folha
// `docs/shared/styles/nds/input-group.css`.
const tokenItems: Array<{ key: string; token: string }> = [
  { key: "border", token: "--input" },
  { key: "radius", token: "--radius" },
  { key: "transition", token: "--duration-fast" },
  { key: "ring", token: "--ring" },
  { key: "destructive", token: "--destructive" },
  { key: "disabledBg", token: "--muted" },
  { key: "controlRadius", token: "--radius-none" },
  { key: "textareaPadding", token: "--spacing-2" },
  { key: "addonPadding", token: "--spacing-1-5" },
  { key: "addonGap", token: "--spacing-2" },
  { key: "addonSize", token: "--text-control" },
  { key: "addonWeight", token: "--font-weight-medium" },
  { key: "addonColor", token: "--muted-foreground" },
  { key: "addonInline", token: "--spacing-2" },
  { key: "addonBlock", token: "--spacing-2-5" },
  { key: "iconSize", token: "--spacing-4" },
  { key: "buttonRadius", token: "--radius-md" },
  { key: "buttonGap", token: "--spacing-1" },
  { key: "buttonPadding", token: "--spacing-1-5" },
]

const codeImport = `import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";`

const interfaceCode = `// InputGroup (a moldura)
interface InputGroupProps extends React.ComponentProps<"div"> {
  "aria-label"?: string;   // OPCIONAL — ver a nota sobre nomear o grupo
  className?: string;
}

// InputGroupAddon (o compartimento do acompanhamento)
interface InputGroupAddonProps extends React.ComponentProps<"div"> {
  align?: "inline-start" | "inline-end" | "block-start" | "block-end";
  className?: string;
}

// InputGroupText — só children e os atributos nativos de <span>.

// InputGroupButton (compõe Button)
interface InputGroupButtonProps {
  size?: "xs" | "sm" | "icon-xs" | "icon-sm";   // repassada ao Button
  variant?: ButtonVariant;                      // default "ghost"
  type?: "button" | "submit" | "reset";         // default "button"
  className?: string;
}

// InputGroupInput / InputGroupTextarea — repassam todo atributo nativo de
// <input> e de <textarea>. O estado inválido é do CAMPO, e a moldura reage
// a ele por :has().`

// ─── Componente principal ─────────────────────────────────────────────────────

export function InputGroupDocs() {
  const { t: tNav } = useTranslation(uiTranslations)
  const { t: tContent, locale } = useTranslation(inputGroupTranslations)

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = useMemo(
    () =>
      Object.values(
        (inputGroupTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      ),
    [locale],
  )

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav])
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups],
  )

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: SLUG,
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/form" },
      { name: tContent("title") },
    ],
  })

  useEffect(() => {
    track("docs_page_view", {
      component_name: SLUG,
      locale,
      page_title: `${tContent("title")} · Design System`,
    })
  }, [locale, tContent])

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: SLUG,
        locale,
      })
    },
    [locale],
  )

  const activeId = useActiveSection(allIds, handleSectionChange)

  // ─── Rótulos da página ──────────────────────────────────────────────────────

  const labels = useMemo(
    () => ({
      searchGroup: tContent("demonstration.labels.searchGroup"),
      searchField: tContent("demonstration.labels.searchField"),
      clear: tContent("demonstration.labels.clear"),
      password: tContent("demonstration.labels.password"),
      reveal: tContent("demonstration.labels.reveal"),
      hide: tContent("demonstration.labels.hide"),
      siteGroup: tContent("demonstration.labels.siteGroup"),
      siteField: tContent("demonstration.labels.siteField"),
      prefix: tContent("demonstration.labels.prefix"),
      paste: tContent("demonstration.labels.paste"),
      note: tContent("demonstration.labels.note"),
      send: tContent("demonstration.labels.send"),
      invalidMsg: tContent("demonstration.labels.invalidMsg"),
      shortcut: tContent("demonstration.labels.shortcut"),
    }),
    [tContent],
  )

  // ─── Peças reutilizadas ─────────────────────────────────────────────────────

  /**
   * Moldura com prefixo de formato e o rótulo VISÍVEL acima dela.
   *
   * Quem nomeia o campo é o rótulo; o prefixo só completa o formato, e é essa a
   * diferença que o terceiro par de Do & Don't ensina.
   */
  const affixFrame = (id: string) => (
    <div className="nds-stack nds-w-full" data-spacing="sm">
      <label className="nds-label" htmlFor={id}>
        {labels.siteGroup}
      </label>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>{labels.prefix}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput id={id} placeholder={labels.siteField} />
        <InputGroupAddon align="inline-end">
          <InputGroupText>.com</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )

  /** A composição de busca: ícone decorativo antes, atalho em texto depois. */
  const searchFrame = (
    <InputGroup aria-label={labels.searchGroup}>
      <InputGroupAddon align="inline-start">
        <Search aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput placeholder={labels.searchField} />
      <InputGroupAddon align="inline-end">
        <InputGroupText>{labels.shortcut}</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )

  /** A composição de área de texto: barra embaixo, e o grupo empilha sozinho. */
  const textareaFrame = (
    <InputGroup aria-label={labels.note}>
      <InputGroupTextarea placeholder={labels.note} rows={3} />
      <InputGroupAddon align="block-end">
        <InputGroupButton>{labels.send}</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )

  /** Moldura inválida, com o texto do erro FORA dela. */
  const invalidFrame = (id: string) => {
    const errorId = `${id}-erro`
    return (
      <div className="nds-stack nds-w-full" data-spacing="sm">
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>{labels.prefix}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id={id}
            placeholder={labels.siteField}
            aria-invalid
            aria-describedby={errorId}
          />
        </InputGroup>
        {/* Dentro da moldura, o texto herdaria o `cursor: text` do addon e
            disputaria a largura com o que a pessoa digita. */}
        <p id={errorId} className="nds-text-caption nds-text-destructive">
          {labels.invalidMsg}
        </p>
      </div>
    )
  }

  // ─── Variantes e composições ────────────────────────────────────────────────

  const alignments: Array<{ key: string; align: InputGroupAlign }> = [
    { key: "inlineStart", align: "inline-start" },
    { key: "inlineEnd", align: "inline-end" },
    { key: "blockStart", align: "block-start" },
    { key: "blockEnd", align: "block-end" },
  ]

  const alignmentPreview = (align: InputGroupAlign) => {
    const stacked = align.startsWith("block")
    const addon = (
      <InputGroupAddon align={align}>
        {stacked ? (
          <InputGroupButton>{labels.send}</InputGroupButton>
        ) : (
          <InputGroupText>{labels.prefix}</InputGroupText>
        )}
      </InputGroupAddon>
    )
    const field = stacked ? (
      <InputGroupTextarea placeholder={labels.note} rows={2} />
    ) : (
      <InputGroupInput placeholder={labels.siteField} />
    )

    // A ordem VISUAL é da folha, por `order` em `[data-align]`; a ordem da
    // marcação só põe o addon do lado que a leitura sequencial espera.
    return (
      <InputGroup>
        {align.endsWith("start") ? addon : field}
        {align.endsWith("start") ? field : addon}
      </InputGroup>
    )
  }

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug={SLUG}
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration
        title={tContent("demonstration.title")}
        componentSlug={SLUG}
      >
        <PasswordDemo
          location="docs_demo"
          label={labels.password}
          revealLabel={labels.reveal}
          hideLabel={labels.hide}
        />
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={[1, 2, 3, 4, 5, 6].map((i) => tContent(`anatomy.item${i}`))}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

      {/* ── Quando Usar ───────────────────────────────────────────── */}
      <DocsWhenToUse
        title={tContent("usage.title")}
        guidelines={{
          title: tContent("usage.guidelines.title"),
          items: [1, 2, 3, 4, 5].map((i) => tContent(`usage.guidelines.item${i}`)),
        }}
        scenarios={{
          title: tContent("usage.scenarios.title"),
          cols: {
            scenario: tContent("usage.scenarios.cols.scenario"),
            use: tContent("usage.scenarios.cols.use"),
            alternative: tContent("usage.scenarios.cols.alternative"),
          },
          items: [1, 2, 3, 4].map((i) => ({
            s: tContent(`usage.scenarios.item${i}.s`),
            u: tContent(`usage.scenarios.item${i}.u`),
            a: tContent(`usage.scenarios.item${i}.a`),
          })),
        }}
        uxWriting={{
          title: tContent("usage.uxWriting.title"),
          cols: {
            element: tContent("usage.uxWriting.table.element"),
            rules: tContent("usage.uxWriting.table.rules"),
            do: tContent("usage.uxWriting.table.correct"),
            dont: tContent("usage.uxWriting.table.avoid"),
          },
          items: ["prefix", "suffix", "addonButton", "groupName"].map((key) => ({
            element: tContent(`usage.uxWriting.table.${key}.name`),
            rules: tContent(`usage.uxWriting.table.${key}.format`),
            do: tContent(`usage.uxWriting.table.${key}.good`),
            dont: tContent(`usage.uxWriting.table.${key}.bad`),
          })),
        }}
        do={{
          title: tContent("usage.do.title"),
          items: [1, 2, 3, 4].map((i) => tContent(`usage.do.item${i}`)),
        }}
        dont={{
          title: tContent("usage.dont.title"),
          items: [1, 2, 3, 4].map((i) => tContent(`usage.dont.item${i}`)),
        }}
      />

      {/* ── Do & Don't ────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            // O que age é um botão de verdade: recebe foco e tem nome.
            doPreview: (
              <InputGroup aria-label={labels.searchGroup}>
                <InputGroupInput placeholder={labels.searchField} />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="icon-xs" aria-label={labels.clear}>
                    <EyeOff aria-hidden="true" />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            ),
            // O painel "não faça" mostra o FORMATO do defeito sem plantá-lo: o
            // acompanhamento é texto inerte, e a legenda é quem conta que a
            // forma errada é pendurar um clique num bloco desses. Plantar um
            // `onClick` num `<div>` aqui deixaria a própria página de
            // documentação com um controle inalcançável por teclado.
            dontPreview: (
              <InputGroup>
                <InputGroupInput placeholder={labels.searchField} />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>{labels.clear}</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            ),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            // Moldura vermelha E texto ligado ao campo.
            doPreview: invalidFrame("input-group-do-dont-com-texto"),
            // Só a moldura vermelha: quem não distingue a cor não fica sabendo
            // de nada. O atributo está lá — é ele que pinta —, mas não há texto
            // nenhum ligado a ele.
            dontPreview: (
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>{labels.prefix}</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput placeholder={labels.siteField} aria-invalid />
              </InputGroup>
            ),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            // Rótulo visível acima; o prefixo só completa o formato.
            doPreview: affixFrame("input-group-do-dont-rotulado"),
            // Sem rótulo: o campo fica sem nome, e `https://` não é o assunto
            // dele. O leitor de tela anuncia só "campo de edição".
            dontPreview: (
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>{labels.prefix}</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput placeholder={labels.siteField} />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>.com</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            ),
            doCaption: toPlainText(tContent("doDont.pair3.do")),
            dontCaption: toPlainText(tContent("doDont.pair3.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={stripHtml(tContent("description"))}
        code={codeImport}
        componentSlug={SLUG}
      />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        note={tContent("variants.note")}
        componentSlug={SLUG}
        items={alignments.map(({ key, align }) => {
          const stacked = align.startsWith("block")
          return {
            name: tContent(`variants.items.${key}.name`),
            description: tContent(`variants.items.${key}.description`),
            // Chave estável de tracking: o `name` chega traduzido, e sem ela o
            // mesmo botão sairia com um valor por idioma no GA4.
            trackId: key,
            // O mesmo construtor de snippet que alimenta o painel Code das
            // stories: snippet escrito à mão aqui divergiria da demo, e cada
            // metade estaria certa sozinha.
            code: inputGroupSnippet({
              placeholder: stacked ? labels.note : labels.siteField,
              multiline: stacked,
              rows: stacked ? 2 : undefined,
              addons: [
                stacked
                  ? { align, buttonLabel: labels.send }
                  : { align, label: labels.prefix },
              ],
            }),
            preview: alignmentPreview(align),
          }
        })}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug={SLUG}
        items={[
          {
            name: tContent("variants.compositions.search.name"),
            description: tContent("variants.compositions.search.description"),
            useWhen: tContent("variants.compositions.search.use"),
            trackId: "search",
            code: inputGroupSnippet({
              "aria-label": labels.searchGroup,
              placeholder: labels.searchField,
              addons: [
                { align: "inline-start", icon: "Search" },
                { align: "inline-end", label: labels.shortcut },
              ],
            }),
            preview: searchFrame,
          },
          {
            name: tContent("variants.compositions.password.name"),
            description: tContent("variants.compositions.password.description"),
            useWhen: tContent("variants.compositions.password.use"),
            trackId: "password",
            code: inputGroupSnippet({
              "aria-label": labels.password,
              addons: [
                {
                  align: "inline-end",
                  buttonAccessibleName: labels.reveal,
                  buttonIcon: "Eye",
                },
              ],
            }),
            preview: (
              <PasswordDemo
                location="docs_composition"
                label={labels.password}
                revealLabel={labels.reveal}
                hideLabel={labels.hide}
              />
            ),
          },
          {
            name: tContent("variants.compositions.affix.name"),
            description: tContent("variants.compositions.affix.description"),
            useWhen: tContent("variants.compositions.affix.use"),
            trackId: "affix",
            code: inputGroupSnippet({
              placeholder: labels.siteField,
              visibleLabel: labels.siteGroup,
              addons: [
                { align: "inline-start", label: labels.prefix },
                { align: "inline-end", label: ".com" },
              ],
            }),
            preview: affixFrame("input-group-composicao-site"),
          },
          {
            name: tContent("variants.compositions.textareaToolbar.name"),
            description: tContent(
              "variants.compositions.textareaToolbar.description",
            ),
            useWhen: tContent("variants.compositions.textareaToolbar.use"),
            trackId: "textareaToolbar",
            code: inputGroupSnippet({
              "aria-label": labels.note,
              placeholder: labels.note,
              multiline: true,
              rows: 3,
              addons: [{ align: "block-end", buttonLabel: labels.send }],
            }),
            preview: textareaFrame,
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: toPlainText(tContent("states.cols.trigger")),
          behavior: toPlainText(tContent("states.cols.behavior")),
        }}
        items={["rest", "focus", "invalid", "disabled"].map((key) => ({
          label: tContent(`states.${key}.label`),
          trigger: toPlainText(tContent(`states.${key}.trigger`)),
          behavior: toPlainText(tContent(`states.${key}.behavior`)),
        }))}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: "InputGroup",
            cols: propsCols(tContent),
            items: [
              propsRow(tContent, "aria-label", "ariaLabel"),
              propsRow(tContent, "className", "class"),
            ],
          },
          {
            title: "InputGroupAddon",
            cols: propsCols(tContent),
            items: [
              propsRow(tContent, "align", "align"),
              propsRow(tContent, "className", "class"),
            ],
          },
          {
            title: "InputGroupText",
            cols: propsCols(tContent),
            items: [
              propsRow(tContent, "children", "text"),
              propsRow(tContent, "className", "class"),
            ],
          },
          {
            title: "InputGroupButton",
            cols: propsCols(tContent),
            items: [
              propsRow(tContent, "size", "size"),
              propsRow(tContent, "variant", "variant"),
              propsRow(tContent, "className", "class"),
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityCode={tContent("props.extensibilityCode")}
      />

      {/* ── Tokens ────────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={tokenItems.map(({ key, token }) => ({
          token,
          value: tContent(`tokens.table.${key}.class`),
          description: toPlainText(tContent(`tokens.table.${key}.part`)),
        }))}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) =>
          tContent(`accessibility.items.item${i}`),
        )}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        keyboardItems={[
          { key: "Tab", description: tContent("accessibility.keyboard.tab") },
          {
            key: "Shift + Tab",
            description: tContent("accessibility.keyboard.shiftTab"),
          },
          { key: "Enter", description: tContent("accessibility.keyboard.enter") },
          { key: "Space", description: tContent("accessibility.keyboard.space") },
        ]}
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug={SLUG}
        items={[
          {
            name: tContent("related.items.input.name"),
            description: toPlainText(tContent("related.items.input.description")),
            path: "?path=/docs/primitives-form-input--docs",
          },
          {
            name: tContent("related.items.textarea.name"),
            description: toPlainText(
              tContent("related.items.textarea.description"),
            ),
            path: "?path=/docs/primitives-form-textarea--docs",
          },
          {
            name: tContent("related.items.button.name"),
            description: toPlainText(tContent("related.items.button.description")),
            path: "?path=/docs/primitives-form-button--docs",
          },
          {
            name: tContent("related.items.form.name"),
            description: toPlainText(tContent("related.items.form.description")),
            path: "?path=/docs/primitives-form-form--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug={SLUG}
        items={[
          ...[1, 2, 3, 4, 5].map((i) => ({
            title: "",
            content: tContent(`notes.item${i}`),
          })),
          {
            title: "",
            // Não há forma declarada para somente-leitura, e a ausência é
            // registrada: inventar aqui uma classe que a folha não tem seria
            // cravar o valor.
            content:
              "<strong>Não há forma declarada para somente-leitura.</strong> A folha compartilhada não desenha esse estado. Use o atributo <code>readOnly</code> nativo no campo: ele é anunciado pelo leitor de tela e não gasta cor nenhuma.",
          },
        ]}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: "button_click",
            trigger: toPlainText(tContent("analytics.table.button_click.trigger")),
            payload: tContent("analytics.table.button_click.payload"),
          },
          {
            event: "docs_page_view",
            trigger: tNav("common.pageMount"),
            payload: `{ component_name: "${SLUG}", locale, page_title }`,
          },
          {
            event: "docs_section_viewed",
            trigger: toPlainText(
              tContent("analytics.table.docs_section_viewed.trigger"),
            ),
            payload: `{ component_name: "${SLUG}", section_id, locale }`,
          },
        ]}
      />

      {/* ── Testes ────────────────────────────────────────────────── */}
      <DocsTestes
        title={tContent("testes.title")}
        functional={{
          title: tContent("testes.functional.title"),
          description: tContent("testes.functional.description"),
          cols: {
            action: tNav("common.userAction"),
            result: tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4, 5].map((i) => ({
            action: toPlainText(tContent(`testes.functional.item${i}.action`)),
            result: toPlainText(tContent(`testes.functional.item${i}.result`)),
            priority: tNav(
              priorityKeyMap[tContent(`testes.functional.item${i}.priority`)] ??
                "common.high",
            ),
          })),
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          description: tContent("testes.accessibility.description"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          items: [
            { key: 1, level: "2.2 AA", how: "axe-core via Storybook" },
            { key: 2, level: "4.1.2", how: "play (Playground)" },
            { key: 3, level: "4.1.2", how: "play (Playground)" },
            { key: 4, level: "2.1.1", how: "play (Playground)" },
            { key: 5, level: "1.4.1", how: "play (Invalid)" },
            { key: 6, level: "4.1.3", how: "play (Playground)" },
            { key: 7, level: "1.4.4", how: "play (Playground)" },
          ].map(({ key, level, how }) => ({
            criterion: toPlainText(tContent(`testes.accessibility.item${key}`)),
            level,
            how,
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          description: tContent("testes.visual.description"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4].map((i) => ({
            story: tContent(`testes.visual.item${i}.story`),
            priority: tNav(
              priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ??
                "common.high",
            ),
          })),
        }}
      />
    </DocsPageLayout>
  )
}

// ─── Peças com estado ─────────────────────────────────────────────────────────

/** Colunas da tabela de props — as mesmas nas quatro peças. */
function propsCols(t: (key: string) => string) {
  return {
    prop: t("props.table.prop"),
    type: t("props.table.type"),
    default: t("props.table.default"),
    required: t("props.table.required"),
    description: t("props.table.description"),
  }
}

/**
 * Uma linha da tabela de props.
 *
 * O NOME é desta stack (`className`, `children`); a descrição vem do conteúdo
 * compartilhado, que a escreve sem citar API nenhuma.
 */
function propsRow(t: (key: string) => string, name: string, key: string) {
  return {
    name,
    type: t(`props.table.${key}.type`),
    defaultValue: t(`props.table.${key}.default`),
    required: t(`props.table.${key}.required`),
    description: toPlainText(t(`props.table.${key}.description`)),
  }
}

interface PasswordDemoProps {
  /** Distingue a demonstração da composição no GA4. Valor estável. */
  location: DemoLocation
  label: string
  revealLabel: string
  hideLabel: string
}

/**
 * A demonstração: um campo de senha com a alternância no addon final.
 *
 * É a composição que prova a decisão que mais custa quando se erra — o que age
 * dentro da moldura é um BOTÃO, e o que ele fez é contado pela PALAVRA, não
 * pelo desenho do ícone.
 *
 * O payload carrega só valor estável (slug, variante, lugar); texto traduzido
 * ali partiria um evento em três no GA4.
 */
function PasswordDemo({
  location,
  label,
  revealLabel,
  hideLabel,
}: PasswordDemoProps) {
  const [visible, setVisible] = useState(false)
  const id = `input-group-${location}-password`

  return (
    <div className="nds-stack nds-w-full" data-spacing="sm">
      <label className="nds-label" htmlFor={id}>
        {label}
      </label>
      <InputGroup aria-label={label}>
        <InputGroupInput id={id} type={visible ? "text" : "password"} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={visible ? hideLabel : revealLabel}
            onClick={() => {
              track("button_click", {
                component: SLUG,
                variant: visible ? "hide" : "reveal",
                location,
              })
              setVisible(!visible)
            }}
          >
            {visible ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
