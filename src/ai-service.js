import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.OPENAI_API_BASE,
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function analyzeHistory(data) {
  try {
    const categorySummary = data.categories
      .map(([category, count]) => `${category}: ${count} visits`)
      .join('\n');
    
    const activeHours = data.visitsByTime
      .map((count, hour) => ({hour, count}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(({hour}) => hour);
    
    const prompt = `Analyze this user's browsing history and provide insights in markdown format:

    Category breakdown:
    ${categorySummary}
    
    Most active hours: ${activeHours.join(', ')}

    Please provide a detailed analysis.
    Use markdown formatting with headers, lists, and emphasis where appropriate.
    Keep it engaging but be short and concise. Three sentences should be enough.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a digital wellbeing assistant providing markdown-formatted insights about browsing habits. Use headers (###), lists (-), emphasis (*bold*), and maintain a positive, encouraging tone by adding some emojis."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('AI analysis error:', error);
    return "### Analysis Temporarily Unavailable\n\nI'm having trouble generating insights right now. Please try again later!";
  }
}