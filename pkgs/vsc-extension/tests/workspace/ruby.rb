require "bundler/setup"
require "openai"

openai = OpenAI::Client.new()

chat_completion = openai.chat.completions.create(
  messages: [{role: "user", content: "Say this is a test"}],
  model: :"gpt-5.1"
)

puts(chat_completion)

stream = openai.responses.stream(
  input: "Write a haiku about OpenAI.",
  model: :"gpt-5.1"
)

stream.each do |event|
  puts(event.type)
end