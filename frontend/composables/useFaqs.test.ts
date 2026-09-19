import { describe, it, expect, beforeEach } from 'vitest';
import { registerEndpoint } from '@nuxt/test-utils/runtime';
import { useFaqs } from './useFaqs';

// useFaqs() shares its two useState() keys across every call in this test
// file's single Nuxt app instance -- reset both before each test so
// "hasFetched" from a previous test doesn't make fetchSuggestedQuestions()
// a silent no-op here.
beforeEach(() => {
  useState<string[]>('faq-suggested-questions', () => []).value = [];
  useState<boolean>('faq-suggested-questions-fetched', () => false).value = false;
});

describe('useFaqs', () => {
  it('starts with an empty list before fetching', () => {
    const { suggestedQuestions } = useFaqs();

    expect(suggestedQuestions.value).toEqual([]);
  });

  it('populates suggestedQuestions with the FAQ questions from the API', async () => {
    registerEndpoint('/api/faqs', () => ({
      member: [
        { question: 'Question un ?', highlighted: true },
        { question: 'Question deux ?', highlighted: true },
      ],
    }));

    const { suggestedQuestions, fetchSuggestedQuestions } = useFaqs();
    await fetchSuggestedQuestions();

    expect(suggestedQuestions.value).toEqual(['Question un ?', 'Question deux ?']);
  });

  it('keeps only the highlighted FAQs as suggested questions', async () => {
    registerEndpoint('/api/faqs', () => ({
      member: [
        { question: 'Mise en avant ?', highlighted: true },
        { question: 'Pas mise en avant ?', highlighted: false },
      ],
    }));

    const { suggestedQuestions, fetchSuggestedQuestions } = useFaqs();
    await fetchSuggestedQuestions();

    expect(suggestedQuestions.value).toEqual(['Mise en avant ?']);
  });

  it('only calls the API once even if fetchSuggestedQuestions is called again', async () => {
    let callCount = 0;
    registerEndpoint('/api/faqs', () => {
      callCount += 1;

      return { member: [{ question: 'Only once ?' }] };
    });

    const { fetchSuggestedQuestions } = useFaqs();
    await fetchSuggestedQuestions();
    await fetchSuggestedQuestions();

    expect(callCount).toBe(1);
  });

  it('leaves the list empty and does not throw when the API call fails', async () => {
    registerEndpoint('/api/faqs', {
      handler: () => {
        throw new Error('boom');
      },
    });

    const { suggestedQuestions, fetchSuggestedQuestions } = useFaqs();
    await expect(fetchSuggestedQuestions()).resolves.toBeUndefined();

    expect(suggestedQuestions.value).toEqual([]);
  });

  it('shares state across independent useFaqs() calls (single fetch feeds both)', async () => {
    registerEndpoint('/api/faqs', () => ({
      member: [{ question: 'Shared ?', highlighted: true }],
    }));

    const first = useFaqs();
    const second = useFaqs();
    await first.fetchSuggestedQuestions();

    expect(second.suggestedQuestions.value).toEqual(['Shared ?']);
  });
});
