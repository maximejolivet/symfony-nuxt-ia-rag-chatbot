<?php

declare(strict_types=1);

namespace App\Tests\AiProvider;

use App\AiProvider\Client\ApiEndpoint\OpenAiCompatibleLlmClient;
use App\AiProvider\Client\ChatMessage;
use App\AiProvider\Client\LlmRateLimitedException;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

final class OpenAiCompatibleLlmClientTest extends TestCase
{
    public function testCompleteTranslatesUpstream429IntoRateLimitedException(): void
    {
        $client = $this->clientReplying(429, '{"error":"rate limited"}');

        $this->expectException(LlmRateLimitedException::class);
        $client->complete([new ChatMessage(role: 'user', content: 'Salut')]);
    }

    public function testStreamTranslatesUpstream429IntoRateLimitedException(): void
    {
        $client = $this->clientReplying(429, '{"error":"rate limited"}');

        $this->expectException(LlmRateLimitedException::class);
        foreach ($client->stream([new ChatMessage(role: 'user', content: 'Salut')]) as $_) {
            // Drain the stream: the 429 surfaces on the first chunk.
        }
    }

    public function testOtherUpstreamErrorsAreNotTranslated(): void
    {
        $client = $this->clientReplying(500, '{"error":"boom"}');

        $this->expectException(\Symfony\Component\HttpClient\Exception\ServerException::class);
        $client->complete([new ChatMessage(role: 'user', content: 'Salut')]);
    }

    public function testFallbackModelsAreSentAsOpenRouterModelsArray(): void
    {
        $sent = [];
        $http = new MockHttpClient(function (string $method, string $url, array $options) use (&$sent): MockResponse {
            $sent[] = json_decode((string) $options['body'], true);

            return new MockResponse('{"choices":[{"message":{"content":"ok"},"finish_reason":"stop"}]}');
        });
        $client = new OpenAiCompatibleLlmClient(
            apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
            apiKey: 'test-key',
            model: 'primary/model:free',
            httpClient: $http,
            fallbackModels: ['backup/one:free', 'backup/two:free'],
        );

        $client->complete([new ChatMessage(role: 'user', content: 'Salut')]);

        $payload = is_array($sent[0]) ? $sent[0] : [];
        self::assertSame(['primary/model:free', 'backup/one:free', 'backup/two:free'], $payload['models'] ?? null);
    }

    public function testNoModelsFieldWhenNoFallbackConfigured(): void
    {
        $sent = [];
        $http = new MockHttpClient(function (string $method, string $url, array $options) use (&$sent): MockResponse {
            $sent[] = json_decode((string) $options['body'], true);

            return new MockResponse('{"choices":[{"message":{"content":"ok"},"finish_reason":"stop"}]}');
        });
        $client = new OpenAiCompatibleLlmClient(
            apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
            apiKey: 'test-key',
            model: 'primary/model:free',
            httpClient: $http,
        );

        $client->complete([new ChatMessage(role: 'user', content: 'Salut')]);

        $payload = is_array($sent[0]) ? $sent[0] : [];
        self::assertArrayNotHasKey('models', $payload);
    }

    private function clientReplying(int $status, string $body): OpenAiCompatibleLlmClient
    {
        return new OpenAiCompatibleLlmClient(
            apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
            apiKey: 'test-key',
            model: 'test/model:free',
            httpClient: new MockHttpClient(new MockResponse($body, ['http_code' => $status])),
        );
    }
}
