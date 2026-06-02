import { ChatGroq } from "@langchain/groq";

export function getLLM() {
  // Lazily creates a Groq LLM instance. dotenv should have loaded GROQ_API_KEY before this runs.
  return new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    maxRetries: 2,
  });
}
