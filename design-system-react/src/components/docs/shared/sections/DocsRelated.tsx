import { Button } from '@/components/ui/button';

export interface DocsRelatedItem {
  name: string;
  description: string;
  path: string;
}

export interface DocsRelatedProps {
  title: string;
  items: DocsRelatedItem[];
  /**
   * Slug do componente para tracking GA4 (ex.: "alert"). Quando presente, cada
   * card relacionado recebe `data-track="related"` +
   * `data-track-id="{slug}:related:{item.name.slug}"` +
   * `data-track-label={item.name}`. Se ausente, omite `data-track-id`.
   */
  componentSlug?: string;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-');
}

export function DocsRelated({ title, items, componentSlug }: DocsRelatedProps) {
  return (
    <section id="relacionados">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, i) => {
          const trackId = componentSlug ? `${componentSlug}:related:${slugify(item.name)}` : undefined;
          return (
            <Button
              key={i}
              nativeButton={false}
              render={
                <a
                  href={item.path}
                  target="_top"
                  data-track="related"
                  data-track-id={trackId}
                  data-track-label={item.name}
                />
              }
              variant="ghost"
              className="text-left h-auto p-4 border bg-card hover:bg-muted/50 w-full flex-col items-start space-y-1 whitespace-normal"
            >
              <p className="text-sm font-semibold text-primary">{item.name}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
