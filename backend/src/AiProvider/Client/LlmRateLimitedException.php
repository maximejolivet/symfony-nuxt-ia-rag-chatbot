<?php

declare(strict_types=1);

namespace App\AiProvider\Client;

use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

/**
 * The upstream LLM provider answered HTTP 429 (typically OpenRouter's free
 * tier limits, shared across all its users). Thrown by OpenAiCompatibleLlmClient
 * instead of leaking the raw provider error: the stream controller turns it
 * into an `error` frame with code `rate_limited` (the widget then asks the
 * visitor to wait a moment), and the other endpoints answer 503.
 */
final class LlmRateLimitedException extends ServiceUnavailableHttpException
{
    public function __construct(?\Throwable $previous = null)
    {
        parent::__construct(null, 'The AI model is rate-limited by its provider.', $previous);
    }
}
