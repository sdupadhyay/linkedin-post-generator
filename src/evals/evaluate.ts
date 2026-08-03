import { evaluate } from "langsmith/evaluation";
import { Client } from "langsmith";
import { generatePost } from "../services/analyzer";
import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// We will dynamically create a dataset in LangSmith before evaluating
const examplesData = [
  {
    inputs: {
      topicTitle: "How AI is changing digital marketing in 2024",
      topicReasoning: "A highly relevant topic combining technology and business strategy.",
      tone: "professional and informative",
      wordCount: 200,
    }
  },
  {
    inputs: {
      topicTitle: "Top 3 mistakes junior developers make on their first job",
      topicReasoning: "A strong listicle that developers love engaging with.",
      tone: "casual, direct, and slightly provocative",
      wordCount: 150,
    }
  }
];

// 2. Wrap our main logic so LangSmith can feed inputs into it
async function targetApp(inputs: any) {
  // Mocking the DNA profile just for the sake of the evaluation test
  const mockDna = {
    tone: { value: inputs.tone, confidence: 1 },
    length: { value: inputs.wordCount, confidence: 1 },
    topic: { value: [], confidence: 1 },
    hook_type: { value: "question", confidence: 1 },
    call_to_action: { value: "Follow for more", confidence: 1 },
    emoji_frequency: { value: "medium", confidence: 1 },
    writing_type: { value: "educational", confidence: 1 }
  };
  
  // Call our actual generation service
  const post = await generatePost(
    mockDna as any, 
    { title: inputs.topicTitle, reasoning: inputs.topicReasoning }, 
    undefined, 
    undefined, 
    "groq" // You can switch this to 'ollama' to test how Ollama performs!
  );
  
  return { generated_post: post };
}

// 3. Define the LLM-as-a-Judge Evaluator
async function toneEvaluator(run: any, example: any) {
  const generatedText = run.outputs?.generated_post;
  const targetTone = example.inputs?.tone;
  
  // We use Llama 3 70b as a strict judge
  const llm = new ChatGroq({ model: "llama3-70b-8192", temperature: 0 });
  
  const schema = z.object({
    score: z.number().min(0).max(1).describe("1 if the text perfectly matches the requested tone, 0 if it completely fails. Fractional scores like 0.8 are allowed."),
    reasoning: z.string().describe("Explanation for why this score was given.")
  });
  
  const evaluatorLlm = llm.withStructuredOutput(schema);
  
  const prompt = `You are an expert LinkedIn Content Grader.
Please evaluate how well the following generated LinkedIn post matches the requested target tone.
Target Tone: "${targetTone}"

Generated Post:
${generatedText}
`;

  try {
    const result = await evaluatorLlm.invoke(prompt);
    return {
      key: "tone_match",
      score: result.score,
      comment: result.reasoning
    };
  } catch (error: any) {
    console.error("Evaluator LLM failed:", error);
    return { key: "tone_match", score: 0, comment: "Eval LLM failed to parse." };
  }
}

// 4. Run the Experiment!
async function runEvals() {
  console.log("Starting evaluations...");
  if (!process.env.LANGCHAIN_API_KEY) {
    console.error("Error: LANGCHAIN_API_KEY is not set in .env!");
    process.exit(1);
  }

  const client = new Client();
  const datasetName = "LinkedIn-Tone-Eval-" + Date.now();
  console.log(`Creating dataset: ${datasetName}`);
  
  await client.createDataset(datasetName);
  await Promise.all(
    examplesData.map((ex) =>
      client.createExample(ex.inputs, {}, { datasetName })
    )
  );

  const results = await evaluate(targetApp, {
    data: datasetName,
    evaluators: [toneEvaluator],
    experimentPrefix: "LinkedIn-Tone-Eval",
    maxConcurrency: 2,
  });
  
  console.log("Evals finished! Check your LangSmith dashboard.");
}

runEvals().catch(console.error);
