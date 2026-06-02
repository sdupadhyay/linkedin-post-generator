import { tavily } from "@tavily/core";

export function getSearchTool() {
  try {
    // Tavily reads TAVILY_API_KEY from process.env automatically.
    return tavily();
  } catch (e) {
    console.warn("Tavily initialization failed:", e);
    return null;
  }
}
