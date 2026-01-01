import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface AIAutocompleteOptions {
  debounceMs: number;
  minChars: number;
  enabled: boolean;
}

export interface AIAutocompleteStorage {
  suggestion: string | null;
  isLoading: boolean;
  decorationSet: DecorationSet;
}

const pluginKey = new PluginKey('aiAutocomplete');

export const AIAutocomplete = Extension.create<AIAutocompleteOptions, AIAutocompleteStorage>({
  name: 'aiAutocomplete',

  addOptions() {
    return {
      debounceMs: 500,
      minChars: 10,
      enabled: true,
    };
  },

  addStorage() {
    return {
      suggestion: null,
      isLoading: false,
      decorationSet: DecorationSet.empty,
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const suggestion = this.storage.suggestion;
        if (suggestion) {
          // Insert the suggestion
          editor.commands.insertContent(suggestion);
          // Clear the suggestion
          this.storage.suggestion = null;
          this.storage.decorationSet = DecorationSet.empty;
          return true;
        }
        return false;
      },
      Escape: () => {
        if (this.storage.suggestion) {
          this.storage.suggestion = null;
          this.storage.decorationSet = DecorationSet.empty;
          this.editor.view.dispatch(this.editor.state.tr);
          return true;
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    let debounceTimer: NodeJS.Timeout | null = null;
    let abortController: AbortController | null = null;

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, decorationSet) {
            // If there's a suggestion, map the decorations
            if (extension.storage.suggestion) {
              return extension.storage.decorationSet.map(tr.mapping, tr.doc);
            }
            return DecorationSet.empty;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
        view() {
          return {
            update: (view, prevState) => {
              if (!extension.options.enabled) return;

              // Check if content changed
              if (prevState.doc.eq(view.state.doc)) return;

              // Clear existing suggestion on new input
              if (extension.storage.suggestion) {
                extension.storage.suggestion = null;
                extension.storage.decorationSet = DecorationSet.empty;
              }

              // Cancel previous request
              if (abortController) {
                abortController.abort();
              }

              // Clear previous timer
              if (debounceTimer) {
                clearTimeout(debounceTimer);
              }

              // Get current text context
              const { state } = view;
              const { selection } = state;
              const { $from } = selection;

              // Only trigger at end of text
              if (!selection.empty) return;

              // Get text before cursor (last 2000 chars for context)
              const textBefore = state.doc.textBetween(
                Math.max(0, $from.pos - 2000),
                $from.pos,
                '\n'
              );

              // Don't trigger if not enough text
              if (textBefore.length < extension.options.minChars) return;

              // Don't trigger if ends with newline or whitespace
              if (/[\n\r\s]$/.test(textBefore)) return;

              // Debounce the API call
              debounceTimer = setTimeout(async () => {
                try {
                  abortController = new AbortController();
                  extension.storage.isLoading = true;

                  const response = await fetch('/api/ai/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ context: textBefore }),
                    signal: abortController.signal,
                  });

                  if (!response.ok) throw new Error('Failed to get completion');

                  const reader = response.body?.getReader();
                  if (!reader) throw new Error('No response body');

                  const decoder = new TextDecoder();
                  let suggestion = '';

                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    suggestion += decoder.decode(value);
                  }

                  // Clean up the suggestion
                  suggestion = suggestion.trim();

                  if (suggestion && view.state.selection.$from.pos === $from.pos) {
                    extension.storage.suggestion = suggestion;
                    extension.storage.isLoading = false;

                    // Create decoration for ghost text
                    const cursorPos = view.state.selection.$from.pos;
                    const decoration = Decoration.widget(cursorPos, () => {
                      const span = document.createElement('span');
                      span.className = 'ai-suggestion';
                      span.textContent = suggestion;
                      return span;
                    });

                    extension.storage.decorationSet = DecorationSet.create(
                      view.state.doc,
                      [decoration]
                    );

                    // Trigger re-render
                    view.dispatch(view.state.tr);
                  }
                } catch (error) {
                  if ((error as Error).name !== 'AbortError') {
                    console.error('AI autocomplete error:', error);
                  }
                  extension.storage.isLoading = false;
                }
              }, extension.options.debounceMs);
            },
            destroy: () => {
              if (debounceTimer) clearTimeout(debounceTimer);
              if (abortController) abortController.abort();
            },
          };
        },
      }),
    ];
  },
});
