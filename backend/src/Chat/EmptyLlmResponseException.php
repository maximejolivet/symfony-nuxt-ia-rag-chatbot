<?php

declare(strict_types=1);

namespace App\Chat;

use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

/**
 * The model answered with nothing (even after ChatOrchestrationService's one
 * retry with a larger token budget) and no tool had run that could explain
 * it. Thrown instead of persisting/streaming a blank assistant message: the
 * stream controller turns it into an `error` frame with code `empty_response`
 * (the widget then offers "Réessayer"), and the other endpoints answer 503.
 */
final class EmptyLlmResponseException extends ServiceUnavailableHttpException
{
    public function __construct()
    {
        parent::__construct(null, 'The AI model returned an empty response.');
    }
}
