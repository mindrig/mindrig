import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.ChatModel;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.responses.Response;
import com.openai.models.responses.ResponseCreateParams;
import com.openai.core.http.StreamResponse;
import com.openai.models.responses.ResponseStreamEvent;

public class Demo {
    public static void main(String[] args) throws Exception {
        OpenAIClient client = OpenAIOkHttpClient.fromEnv();

        ChatCompletionCreateParams chatParams = ChatCompletionCreateParams.builder()
                .addUserMessage("Say this is a test")
                .model(ChatModel.GPT_5_2)
                .build();
        ChatCompletion chatCompletion = client.chat().completions().create(chatParams);
        System.out.println(chatCompletion.choices().get(0).message().content().orElse(""));

        ResponseCreateParams respParams = ResponseCreateParams.builder()
                .input("Write a haiku about OpenAI.")
                .model(ChatModel.GPT_5_2)
                .build();
        try (StreamResponse<ResponseStreamEvent> stream = client.responses().createStreaming(respParams)) {
            stream.stream().forEach(event -> {
                System.out.println(event.event());
            });
        }

        String name = "World";
        String helloPrompt = String.format("Hello, %s", name);
        // @prompt
        String system = "You are a helpful assistant.";
    }
}

