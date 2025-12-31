using System;
using System.Threading.Tasks;
using OpenAI.Chat;
using OpenAI.Responses;

public class Demo
{
    public static async Task Main()
    {
        var chatClient = new ChatClient(
            model: "gpt-5.1",
            apiKey: Environment.GetEnvironmentVariable("OPENAI_API_KEY"));

        var completion = chatClient.CompleteChat("Say this is a test.");
        Console.WriteLine(completion.Content[0].Text);

        var responseClient = new OpenAIResponseClient(
            model: "gpt-5.1",
            apiKey: Environment.GetEnvironmentVariable("OPENAI_API_KEY"));

        await foreach (StreamingResponseUpdate update in responseClient.CreateResponseStreamingAsync(
            userInputText: "Write a haiku about OpenAI.",
            options: new ResponseCreationOptions()))
        {
            Console.WriteLine(update.GetType().Name);
        }

        string name = "World";
        string helloPrompt = $"Hello, {name}";

        // @prompt
        string system = "You are a helpful assistant.";
    }
}
