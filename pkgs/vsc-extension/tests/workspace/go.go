package main

import (
    "context"
    "fmt"
    
    openai "github.com/openai/openai-go/v3"
    "github.com/openai/openai-go/v3/option"
)

func main() {
    client := openai.NewClient(
        option.WithAPIKey("YOUR_OPENAI_API_KEY"),
    )

    chatCompletion, err := client.Chat.Completions.New(context.TODO(), openai.ChatCompletionNewParams{
        Messages: []openai.ChatCompletionMessageParamUnion{
            openai.UserMessage("Say this is a test"),
        },
        Model: openai.ChatModelGPT5_2,
    })
    if err != nil {
        panic(err)
    }
    fmt.Println(chatCompletion.Choices[0].Message.Content)

    stream := client.Chat.Completions.NewStreaming(context.TODO(), openai.ChatCompletionNewParams{
        Messages: []openai.ChatCompletionMessageParamUnion{
            openai.UserMessage("Write a haiku about OpenAI."),
        },
        Model: openai.ChatModelGPT5_2,
    })
    for stream.Next() {
        chunk := stream.Current()
        if len(chunk.Choices) > 0 {
            fmt.Print(chunk.Choices[0].Delta.Content)
        }
    }
    if err := stream.Err(); err != nil {
        panic(err)
    }

    name := "World"
    helloPrompt := fmt.Sprintf("Hello, %s", name)
    fmt.Println("\n" + helloPrompt)
    // @prompt
    system := "You are a helpful assistant. asd"
}