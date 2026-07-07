# 🧬 LinkedIn Post Generator AI

An advanced, end-to-end Agentic AI application designed to ghostwrite viral LinkedIn posts by perfectly mimicking a user's unique writing style. Built with a modern Node.js/Express backend, Vanilla JS frontend, LangChain, Groq LLMs, Tavily web search, and Supabase Authentication & PostgreSQL.

---

## 🚀 Features

- **Writing DNA Extraction**: Deeply analyzes your past LinkedIn posts to extract a strict JSON schema of your writing style (Tone, Hook Types, Emoji Frequency, Paragraph Sizing).
- **Real-Time Trend Analysis**: Uses the Tavily SDK to search the web for live, trending professional topics tailored specifically to your niche.
- **Interactive Outlining (HITL)**: Generates a Content Roadmap (core thesis, narrative flow, proof points, and LSI keywords) and lets you steer the AI with custom feedback before drafting.
- **SEO & Dwell Time Optimization**: Enforces viral rules including sub-10 word powerful hooks, maximum 2-sentence paragraphs, bullet lists, and natural LSI keyword integration.
- **Autonomous Self-Correction (Actor-Critic Review Loop)**: After drafting, an independent AI Reviewer evaluates the post against the Writing DNA across 6 dimensions (Tone, Word Count, Hook Quality, Writing Type, Paragraph Structure, Emoji Usage). If the post scores below 25/30, it automatically regenerates with specific critique instructions until high quality is achieved!
- **AI Ghostwriting**: Synthesizes your DNA profile, approved outline, and steering feedback to generate a pixel-perfect, highly engaging LinkedIn draft.
- **Supabase Integration**: Fully secured by Supabase Auth (Email + Google OAuth) and automatically persists your DNA profile to a PostgreSQL database.
- **Beautiful Premium UI**: A highly responsive, glassmorphism-inspired dark mode interface.

---

## 🧠 The AI Workflow Architecture

Here is a visual representation of the application's data flow:

```mermaid
graph TD
    A[User's Past Posts] -->|Input via UI| B(DNA Analyzer Engine)
    B -->|LangChain + Groq| C[DNA Profile Schema]
    C -->|Secure Save| D[(Supabase PostgreSQL)]
    
    C --> E(Tavily Core Search)
    E -->|Live Web Data| F[AI Trending Topics]
    
    F -->|User Selects Topic| G(Content Outlining Engine)
    G -->|Generates Roadmap + LSI Keywords| H[Interactive Outline UI]
    H -->|User Steering Feedback| I(Post Generation Engine)
    C -->|Enforces Tone & Format| I
    
    I -->|Draft Post| J(AI Content Reviewer / Critic)
    J -->|Score < 25/30: Critique & Recommendations| I
    J -->|Score >= 25/30| K[Final Ghostwritten Post]
```

The application relies on a sophisticated 5-step AI pipeline using LangChain and Groq's high-speed inference (Llama 3 70B Versatile):

### 1. The DNA Analyzer
The user submits 3 to 10 of their past LinkedIn posts. The backend uses `withStructuredOutput` alongside Zod schemas to force the LLM to return a highly structured JSON profile. The AI evaluates the input and extracts granular details (e.g., "Conversational Tone", "Question-based Hooks", "Heavy Emoji Usage") and assigns a **Confidence Score** and **Reasoning** to every single extracted metric.

### 2. Trend-Aware Topic Generation
Once the DNA is extracted, the backend triggers the **Tavily Core SDK**. It searches the live web for trending topics related to the user's core subjects. The LLM then correlates these live web results with the user's DNA profile to suggest 5 to 10 highly relevant post topics, complete with match confidence scores.

### 3. Interactive Outlining & SEO Roadmap (Human-In-The-Loop)
When a topic is selected, the AI acts as a Content Strategist and generates a topic-focused roadmap without style noise. It outputs the `core_thesis`, `target_audience_takeaway`, `narrative_arc`, `suggested_examples`, and 4 to 6 `target_lsi_keywords`. The user reviews this roadmap and can input custom steering instructions before authorizing the draft.

### 4. Precision Post Drafting & Dwell Time Boosting
The draft combines the user's Writing DNA, the approved roadmap, and the user's steering feedback. To maximize LinkedIn search discoverability and Dwell Time, the LLM is stringently forced to implement:
- A powerful hook under 10 words.
- Max 2 sentences per paragraph (generous white space).
- Clean bullet lists for complex concepts.
- Natural integration of 4+ LSI keywords and trending hashtags.

### 5. Autonomous Self-Correction & Quality Review (Actor-Critic Loop)
Before presenting the draft to the user, an independent AI Reviewer chain evaluates the generated post against the user's Writing DNA across 6 core criteria: Tone, Word Count, Hook Quality, Writing Type, Paragraph Structure, and Emoji Usage. Each attribute is scored from 0–5 (for a total out of 30). If the score falls below 25/30, the Reviewer outputs specific actionable recommendations, and the system automatically triggers a regeneration loop (up to 3 attempts) until the post achieves a high-confidence quality score.

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: HTML5, Vanilla CSS (Glassmorphism), Vanilla JavaScript
- **AI & Orchestration**: LangChain, Groq API (Llama 3)
- **Web Search**: Tavily SDK
- **Database & Auth**: Supabase (PostgreSQL + JWT Authentication)

---

## 🔌 API Reference

### 1. Get Configuration
Retrieves public Supabase configuration variables for the frontend client.
- **Endpoint**: `GET /api/config`
- **Auth Required**: No
- **Response**:
  ```json
  {
    "supabaseUrl": "https://xyz.supabase.co",
    "supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR..."
  }
  ```

### 2. Analyze Posts (Extract DNA)
Analyzes an array of strings (LinkedIn posts) and returns the user's Writing DNA. Automatically upserts the resulting profile into the Supabase PostgreSQL database.
- **Endpoint**: `POST /api/analyze`
- **Auth Required**: Yes (`Bearer <JWT>`)
- **Request Body**:
  ```json
  {
    "posts": [
      "Here is my first post...",
      "Here is my second post..."
    ]
  }
  ```
- **Response**:
  ```json
  {
    "tone": { "value": "Informative", "confidence": 0.9, "reasoning": "..." },
    "hoop_type": { "value": "Question", "confidence": 0.85, "reasoning": "..." },
    "avg_words": { "value": 150, "confidence": 0.95, "reasoning": "..." },
    "emoji_frequency": { "value": "Low", "confidence": 0.8, "reasoning": "..." },
    "paragraph_size": { "value": "Short", "confidence": 0.9, "reasoning": "..." },
    "writing_type": { "value": "Story-telling", "confidence": 0.88, "reasoning": "..." },
    "topic": { "value": ["AI", "Leadership"], "confidence": 0.92, "reasoning": "..." }
  }
  ```

### 3. Generate Trending Topics
Generates a list of suggested post topics using Tavily live search data mapped against the user's DNA.
- **Endpoint**: `POST /api/topics`
- **Auth Required**: Yes (`Bearer <JWT>`)
- **Request Body**:
  ```json
  {
    "dnaProfile": { /* Full DNA Object returned from /api/analyze */ }
  }
  ```
- **Response**:
  ```json
  {
    "topics": [
      {
        "topic_title": "The Future of AI in Leadership",
        "reasoning": "Matches your interest in AI and trend data shows high engagement.",
        "confidence": 0.91
      }
    ]
  }
  ```

### 4. Generate Content Outline (HITL Roadmap)
Generates a structured content outline and SEO LSI keywords for a chosen topic.
- **Endpoint**: `POST /api/outline`
- **Auth Required**: Yes (`Bearer <JWT>`)
- **Request Body**:
  ```json
  {
    "topic": {
      "title": "The Future of AI in Leadership",
      "reasoning": "Focus on how managers can use AI to empower their teams."
    }
  }
  ```
- **Response**:
  ```json
  {
    "core_thesis": "AI won't replace managers; it empowers them to focus on empathy.",
    "target_audience_takeaway": "Frameworks to start automating daily reports today.",
    "narrative_arc": ["1. State the administrative burnout problem", "2. Introduce AI co-pilots", "3. Give actionable steps"],
    "suggested_examples": ["Automating weekly 1-on-1 prep notes"],
    "target_lsi_keywords": ["agentic workflow", "leadership automation", "team productivity", "AI co-pilot"]
  }
  ```

### 5. Generate Final Post Draft
Ghostwrites the final LinkedIn post by combining DNA style rules, approved outline, steering feedback, and SEO discoverability rules.
- **Endpoint**: `POST /api/generate`
- **Auth Required**: Yes (`Bearer <JWT>`)
- **Request Body**:
  ```json
  {
    "dnaProfile": { /* Full DNA Object */ },
    "topic": {
      "title": "The Future of AI in Leadership",
      "reasoning": "Focus on how managers can use AI to empower their teams."
    },
    "outline": { /* Full Outline Object returned from /api/outline */ },
    "feedback": "Include a personal story about failing my startup in 2021 in step 2."
  }
  ```
- **Response**:
  ```json
  {
    "post": "Have you ever wondered how AI will reshape leadership? 🤔\n\nAs managers, we often focus on metrics, but the real power of AI lies in empowerment...\n\n#AgenticAI #Leadership #FutureOfWork"
  }
  ```

---

## 💻 Local Development Setup

1. **Clone the repository** and install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   GROQ_API_KEY="your_groq_api_key"
   TAVILY_API_KEY="your_tavily_api_key"
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_ANON_KEY="your_supabase_anon_key"
   ```

3. **Supabase Setup**:
   Ensure you have created a Supabase project and executed the following SQL in your Database to create the DNA mapping table:
   ```sql
   CREATE TABLE user_dna (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
     dna_profile JSONB NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   ALTER TABLE user_dna ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can manage their own DNA" ON user_dna FOR ALL USING (auth.uid() = user_id);
   ```

4. **Run the Application**:
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`.
