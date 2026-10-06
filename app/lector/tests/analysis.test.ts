import { expect, it } from 'vitest';
import { validateAnalysis } from '../src/sentence-analysis';
import { validateReading } from '../src/model';
import { demo, demoSource } from '../src/demo';
import { analysis } from './analysis-fixture';
it('validates analysis against the exact source and rejects fabricated components', () => {
  expect(validateAnalysis(analysis, demoSource)).toEqual(analysis);
  expect(() => validateAnalysis({ ...analysis, analysis_text: '違う文' }, demoSource)).toThrow(
    '原文',
  );
  expect(() =>
    validateAnalysis(
      { ...analysis, structure: [{ ...analysis.structure[0], text: '猫' }] },
      demoSource,
    ),
  ).toThrow('成分');
  expect(() => validateAnalysis({ ...analysis, correct: false }, demoSource)).toThrow('修正');
});
it('accepts preprocessing with only segmentation and ruby', () => {
  const minimal = {
    language: 'ja',
    sentences: demo.sentences.map((s) => ({
      tokens: s.tokens.map((t) => ({
        text: t.text,
        kind: t.kind,
        ruby: t.ruby,
      })),
    })),
  };
  expect(validateReading(minimal, demoSource).sentences[0].tokens[0].meaning).toBe('');
});
