import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/ollama";

export type LLMProvider = "groq" | "ollama";

export function getLLM(provider: LLMProvider = "ollama") {
	if (provider === "ollama") {
		return new ChatOllama({
			baseUrl: process.env.OLLAMA_BASE_URL || "",
			model: process.env.OLLAMA_MODEL || "llama3",
			temperature: 0,
			maxRetries: 2,
			// If the cloud service requires an API key in the headers
			...(process.env.OLLAMA_API_KEY && {
				headers: {
					Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
				},
			}),
		});
	}

	// Fallback to Groq
	return new ChatGroq({
		model: "llama-3.3-70b-versatile",
		temperature: 0,
		maxRetries: 2,
	});
}
