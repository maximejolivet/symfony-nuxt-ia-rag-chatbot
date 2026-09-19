<?php

declare(strict_types=1);

namespace App\Chat;

use App\Entity\Faq;
use App\Repository\FaqRepository;

/**
 * Short-circuits the LLM when the visitor's message is exactly an active
 * FAQ question -- typically a click on a suggested question (see
 * frontend/composables/useFaqs.ts). Without this, the admin-written
 * Faq::$answer was never used: the question went through RAG + LLM like any
 * other and the model improvised its own answer.
 *
 * Exact match only, after normalization (case, accents, punctuation,
 * whitespace): a near-miss falls through to the normal RAG + LLM flow rather
 * than risk answering a different question with a canned reply.
 */
final readonly class FaqAnswerMatcher
{
    public function __construct(private FaqRepository $faqRepository) {}

    public function findAnswer(string $userMessage): ?string
    {
        $needle = self::normalize($userMessage);
        if ('' === $needle) {
            return null;
        }

        foreach ($this->faqRepository->findActive() as $faq) {
            $answer = trim($faq->getAnswer());
            if ('' !== $answer && self::normalize($faq->getQuestion()) === $needle) {
                return $answer;
            }
        }

        return null;
    }

    private static function normalize(string $text): string
    {
        $text = mb_strtolower($text);
        // Strip diacritics (NFD splits "é" into "e" + combining accent).
        $decomposed = \Normalizer::normalize($text, \Normalizer::FORM_D);
        if (false !== $decomposed) {
            $text = preg_replace('/\p{Mn}+/u', '', $decomposed) ?? $decomposed;
        }
        // Punctuation -> space, then collapse whitespace.
        $text = preg_replace('/[^\p{L}\p{N}]+/u', ' ', $text) ?? $text;

        return trim($text);
    }
}
