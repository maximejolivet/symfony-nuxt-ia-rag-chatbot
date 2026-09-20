import { describe, it, expect } from 'vitest';
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import Chatbot from './Chatbot.vue';

// Chatbot's composables fetch on mount -- give them something to resolve.
registerEndpoint('/api/ai_agents', () => ({ member: [] }));
registerEndpoint('/api/chat/llm-status', () => ({ status: 'not_running' }));
registerEndpoint('/api/faqs', () => ({ member: [] }));

describe('Chatbot: free model notice', () => {
  it.each(['page', 'widget'] as const)(
    'is shown under the input in the %s variant',
    async (variant) => {
      const wrapper = await mountSuspended(Chatbot, { props: { variant } });
      const notice = wrapper.find('[data-testid="free-model-notice"]');

      expect(notice.exists()).toBe(true);
      expect(notice.text()).toContain('modèle gratuit');
      expect(notice.text()).toContain('renvoyer votre question');
    },
  );

  it('stays visible once the conversation has started (unlike the empty state)', async () => {
    const wrapper = await mountSuspended(Chatbot, { props: { variant: 'widget' } });
    useState<{ messages: unknown[] }>('chatbot-state').value.messages = [
      { id: '1', role: 'user', content: 'Bonjour', timestamp: new Date() },
    ];
    await nextTick();

    expect(wrapper.find('[data-testid="free-model-notice"]').exists()).toBe(true);
  });
});
