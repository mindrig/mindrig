<?php
require 'vendor/autoload.php';

use OpenAI\Client as OpenAI;

$apiKey = getenv('OPENAI_API_KEY');
$client = OpenAI::client($apiKey);

$chatResponse = $client->chat()->create([
    'model' => 'gpt-5.1',
    'messages' => [
        ['role' => 'user', 'content' => 'Say this is a test'],
    ],
]);
$assistantMessage = $chatResponse->choices[0]->message->content;
echo $assistantMessage . PHP_EOL;

$stream = $client->responses()->createStreamed([
    'model' => 'gpt-5.1',
    'input' => 'Write a haiku about OpenAI.',
]);
foreach ($stream as $event) {
    echo $event->event . PHP_EOL;
}

$name = 'World';
$helloPrompt = "Hello, {$name}";
// @prompt
$system = 'You are a helpful assistant.';
