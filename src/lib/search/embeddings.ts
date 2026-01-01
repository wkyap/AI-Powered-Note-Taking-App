'use client';

import { pipeline } from '@huggingface/transformers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EmbeddingPipeline = any;

let embeddingPipeline: EmbeddingPipeline | null = null;
let isLoading = false;
let loadPromise: Promise<EmbeddingPipeline> | null = null;

export async function getEmbeddingPipeline(): Promise<EmbeddingPipeline> {
  if (embeddingPipeline) {
    return embeddingPipeline;
  }

  if (loadPromise) {
    return loadPromise;
  }

  if (isLoading) {
    // Wait for loading to complete
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (embeddingPipeline) {
          clearInterval(check);
          resolve(embeddingPipeline);
        }
      }, 100);
    });
  }

  isLoading = true;

  loadPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    dtype: 'fp32',
  });

  embeddingPipeline = await loadPromise;
  isLoading = false;

  return embeddingPipeline;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) {
    return [];
  }

  try {
    const pipe = await getEmbeddingPipeline();

    // Truncate text to ~500 words to avoid memory issues
    const truncatedText = text.slice(0, 2000);

    const output = await pipe(truncatedText, {
      pooling: 'mean',
      normalize: true,
    });

    // Convert to regular array - handle different output formats
    if (output && typeof output === 'object' && 'data' in output) {
      return Array.from(output.data as Float32Array);
    }

    return [];
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
}

// Preload the model in the background
export function preloadEmbeddingModel(): void {
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback if available, otherwise setTimeout
    const schedulePreload = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));
    schedulePreload(() => {
      getEmbeddingPipeline().catch(console.error);
    });
  }
}
