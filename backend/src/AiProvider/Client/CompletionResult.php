<?php

declare(strict_types=1);

namespace App\AiProvider\Client;

final readonly class CompletionResult
{
    /**
     * @param array<string, mixed> $usage
     * @param string|null          $finishReason the provider's own stop reason ("stop", "length", ...) when it
     *                                           reports one -- only used to explain an empty completion in logs
     */
    public function __construct(
        public ChatMessage $message,
        public array $usage,
        public ?string $finishReason = null,
    ) {}
}
