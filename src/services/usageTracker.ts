import { createAuthClient } from "../utils/supabaseClient";

const DAILY_TOKEN_LIMIT = 20000;

/**
 * Checks if the user has exceeded their daily token limit.
 * Implements a "lazy reset" strategy: if > 24h since last reset, it resets daily_tokens_used to 0.
 * Throws an error if the limit is exceeded.
 */
export const checkRateLimit = async (token: string, userId: string): Promise<void> => {
    const supabase = createAuthClient(token);
    
    // Fetch current limit data
    let { data: limitData, error } = await supabase
        .from('user_token_limits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.error("Error fetching token limits:", error);
        throw new Error("Unable to verify rate limit.");
    }

    if (!limitData) {
        // First time generating for this user, insert fresh row
        const { error: insertError } = await supabase
            .from('user_token_limits')
            .insert([{ user_id: userId, daily_tokens_used: 0, total_tokens_used: 0 }]);
        if (insertError) {
            console.error("Error creating token limit profile:", insertError);
        }
        return; // Safe to proceed
    }

    const lastResetDate = new Date(limitData.last_reset);
    const now = new Date();
    const hoursSinceReset = Math.abs(now.getTime() - lastResetDate.getTime()) / 36e5;

    // Perform Lazy Reset if > 24 hours have passed
    if (hoursSinceReset >= 24) {
        limitData.daily_tokens_used = 0;
        
        const { error: updateError } = await supabase
            .from('user_token_limits')
            .update({ daily_tokens_used: 0, last_reset: new Date().toISOString() })
            .eq('user_id', userId);
            
        if (updateError) {
            console.error("Error resetting daily tokens:", updateError);
        }
    }

    // Validate limit
    if (limitData.daily_tokens_used >= DAILY_TOKEN_LIMIT) {
        throw new Error(`Your daily AI token limit (${DAILY_TOKEN_LIMIT} tokens) has been exhausted. It will renew automatically 24 hours after your last reset.`);
    }
};

/**
 * Tracks the token usage in the database by updating the daily and total counts,
 * and inserting a historical log.
 */
export const trackUsage = async (token: string, userId: string, tokensUsed: number): Promise<void> => {
    if (tokensUsed <= 0) return;
    
    const supabase = createAuthClient(token);

    // 1. Insert into historical log
    await supabase.from('token_usage_logs').insert([{
        user_id: userId,
        tokens_used: tokensUsed
    }]);

    // 2. Fetch current limits to increment safely
    const { data: currentLimit } = await supabase
        .from('user_token_limits')
        .select('daily_tokens_used, total_tokens_used')
        .eq('user_id', userId)
        .maybeSingle();
        
    if (currentLimit) {
        await supabase
            .from('user_token_limits')
            .update({
                daily_tokens_used: currentLimit.daily_tokens_used + tokensUsed,
                total_tokens_used: currentLimit.total_tokens_used + tokensUsed
            })
            .eq('user_id', userId);
    }
};

/**
 * Returns a LangChain callback that intercepts the LLM result to extract total token usage.
 */
export const getUsageCallback = (token: string, userId: string) => {
    return {
        handleLLMEnd: async (output: any) => {
            try {
                let tokensUsed = 0;
                
                // 1. Check standard llmOutput
                if (output.llmOutput?.tokenUsage?.totalTokens) {
                    tokensUsed = output.llmOutput.tokenUsage.totalTokens;
                } 
                else if (output.llmOutput?.estimatedTokenUsage?.totalTokens) {
                    tokensUsed = output.llmOutput.estimatedTokenUsage.totalTokens;
                }
                
                // 2. Check modern AIMessage usage_metadata (used by Groq & Ollama in recent LangChain versions)
                if (tokensUsed === 0 && output.generations?.[0]?.[0]?.message?.usage_metadata?.total_tokens) {
                    tokensUsed = output.generations[0][0].message.usage_metadata.total_tokens;
                }

                console.log(`[Token Tracker] LLM Finished. Tokens extracted: ${tokensUsed}`);

                if (tokensUsed > 0) {
                    // Fire and forget, do not block the main response
                    trackUsage(token, userId, tokensUsed).catch(err => {
                        console.error("[Token Tracker] Failed to update Supabase:", err);
                    });
                } else {
                    console.warn("[Token Tracker] Could not find token metrics in LLM result:", JSON.stringify(output.llmOutput || {}));
                }
            } catch (err) {
                console.error("[Token Tracker] Failed to track LLM usage:", err);
            }
        }
    };
};
