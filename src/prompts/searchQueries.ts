export const searchQueriesSystemPrompt = `You are generating web search queries to find content ideas for a LinkedIn creator.

Creator's topics: {topics}
Creator's audience: {target_audience}

Generate 3 search queries that would surface REAL PROBLEMS, MISTAKES, or CONFUSIONS this audience faces around these topics — not industry news or product announcements.

Bad example: a query that just asks for "latest trends in X"
Good example: a query that asks about a specific problem, mistake, or confusion this audience experiences

Output structure of response:
{{
    "queries": [
        "query 1",
        "query 2",
        "query 3"
    ]
}}
IMPORTANT: Output ONLY valid JSON. Do NOT wrap the response in markdown blocks (e.g., \`\`\`json). Return the raw JSON object and nothing else.`;
