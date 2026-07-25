import React from 'react';
import { Card } from '@/components/ui/card';

export interface DocsDoDontPair {
  doLabel: string;
  dontLabel: string;
  doPreview: React.ReactNode;
  dontPreview: React.ReactNode;
  doCaption: string;
  dontCaption: string;
}

export interface DocsDoDontProps {
  title: string;
  pairs: DocsDoDontPair[];
}

export function DocsDoDont({ title, pairs }: DocsDoDontProps) {
  return (
    <section id="do-dont">
      <h2 className="nds-section-title">{title}</h2>
      <Card className="nds-cluster nds-p-4 nds-mt-2">
          <div className="nds-stack nds-w-full" data-spacing="xl">
            {pairs.map((pair, index) => (
              <div key={index} className="nds-grid" data-cols="2" data-spacing="lg">
                {/* DO */}
                <div className="nds-stack" data-spacing="sm">
                  <div className="nds-cluster nds-text-success" data-spacing="sm">
                    <span className="nds-pill" data-tone="success">✓</span>
                    <span className="nds-text-body nds-font-semibold nds-uppercase nds-tracking-wider">{pair.doLabel}</span>
                  </div>
                  <Card className="nds-border-success-soft nds-bg-success-soft nds-shadow-none nds-p-4">
                    {pair.doPreview}
                  </Card>
                  <p className="nds-text-body nds-italic nds-px-1">{pair.doCaption}</p>
                </div>
                {/* DON'T */}
                <div className="nds-stack" data-spacing="sm">
                  <div className="nds-cluster nds-text-destructive" data-spacing="sm">
                    <span className="nds-pill" data-tone="destructive">✗</span>
                    <span className="nds-text-body nds-font-semibold nds-uppercase nds-tracking-wider">{pair.dontLabel}</span>
                  </div>
                  <Card className="nds-border-destructive-soft nds-bg-destructive-soft nds-shadow-none nds-p-4">
                    {pair.dontPreview}
                  </Card>
                  <p className="nds-text-body nds-italic nds-px-1">{pair.dontCaption}</p>
                </div>
              </div>
            ))}
          </div>
      </Card>
    </section>
  );
}
