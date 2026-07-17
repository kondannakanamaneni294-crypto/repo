import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  simulateBoardroomChat, 
  simulateNextQuestion, 
  simulateAnalyzeDocument, 
  simulateWhatIf, 
  simulateReport,
  simulateScorecard
} from './server_simulation';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helper to call Gemini with exponential backoff retries for transient 503/429/UNAVAILABLE errors
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  maxRetries = 3,
  initialDelay = 1000
): Promise<any> {
  let attempt = 0;
  let delay = initialDelay;
  let currentModel = params.model;
  
  while (attempt <= maxRetries) {
    try {
      return await ai.models.generateContent({
        ...params,
        model: currentModel
      });
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      const isTransient = errorMsg.includes('503') || 
                          errorMsg.includes('UNAVAILABLE') || 
                          errorMsg.includes('429') || 
                          errorMsg.includes('RESOURCE_EXHAUSTED') ||
                          errorMsg.includes('high demand') ||
                          errorMsg.includes('Overloaded') ||
                          errorMsg.includes('temp') ||
                          error?.status === 503 ||
                          error?.status === 429;

      if (isTransient && attempt < maxRetries) {
        attempt++;
        
        // Alternate model on transient errors if using a standard flash model
        if (currentModel === 'gemini-3.5-flash') {
          currentModel = 'gemini-flash-latest';
          console.warn(`Transient error on gemini-3.5-flash. Falling back to gemini-flash-latest for retry ${attempt}/${maxRetries}. Error: ${errorMsg}`);
        } else if (currentModel === 'gemini-flash-latest') {
          currentModel = 'gemini-3.1-flash-lite';
          console.warn(`Transient error on gemini-flash-latest. Falling back to gemini-3.1-flash-lite for retry ${attempt}/${maxRetries}. Error: ${errorMsg}`);
        } else if (currentModel === 'gemini-3.1-flash-lite') {
          currentModel = 'gemini-3.5-flash';
          console.warn(`Transient error on gemini-3.1-flash-lite. Falling back to gemini-3.5-flash for retry ${attempt}/${maxRetries}. Error: ${errorMsg}`);
        }
        
        console.warn(`Gemini call failed with transient error (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms... Error: ${errorMsg}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
  throw new Error('Retries exhausted');
}

// Simple text search utility for documents
function searchDocuments(query: string, documents: any[]): string {
  if (!documents || documents.length === 0) {
    return "No documents uploaded. Rely on the business profile and general knowledge.";
  }
  
  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (keywords.length === 0) {
    return documents.map(d => `Document "${d.name}" (${d.type}): ${d.summary || 'Business details'}`).join('\n');
  }

  const matches: { text: string; docName: string; score: number }[] = [];
  for (const doc of documents) {
    const textContent = doc.content || doc.text || '';
    if (!textContent) continue;

    // Split by paragraph/sentences
    const paragraphs = textContent.split(/\n+|\. /).filter((p: string) => p.trim().length > 15);
    for (const p of paragraphs) {
      let score = 0;
      for (const kw of keywords) {
        if (p.toLowerCase().includes(kw)) {
          score += 1;
        }
      }
      if (score > 0) {
        matches.push({ text: p.trim(), docName: doc.name, score });
      }
    }
  }

  if (matches.length === 0) {
    return documents.map(d => `Uploaded Asset: "${d.name}" (Type: ${d.type})`).join('\n');
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 6).map(m => `[From Document "${m.docName}"]: ${m.text}`).join('\n\n');
}

// 1. Boardroom Discussion Endpoint
app.post('/api/boardroom/chat', async (req, res) => {
  const { question, profile, knowledgeBase, documents, docContext, history } = req.body;
  const finalDocContext = docContext || searchDocuments(question, documents || []);
  try {
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `
You are an experienced, senior business consultant presiding over a virtual boardroom discussion for "${profile.name || 'Your Company'}" in the "${profile.industry || 'SME'}" sector.
Rely heavily on the compiled Business Knowledge Base:
${JSON.stringify(knowledgeBase || {})}

And these grounded uploaded documents:
${finalDocContext}

And recent boardroom decisions:
${JSON.stringify(history || [])}

The user's question: "${question}"

You MUST follow this exact reasoning process internally before answering:
1. Understand the business profile, size, location, model, and operational details deeply.
2. Identify if there is any critical missing context or parameters to answer the user's specific question confidently.
3. Retrieve relevant data from the Knowledge Base (KPIs, Strengths, Pricing, Competitors, Suppliers).
4. Retrieve relevant snippets from uploaded documents.
5. Reason step-by-step through the problem without using consultant jargon, MBA terminology, or flowery AI language. Use short, simple sentences and highly practical advice.
6. Mention the user's own business, products, or specific metrics (from setup/documents) to personalize the advice.

CRITICAL: If you lack critical information/context to answer the user's question confidently:
- You must ask a targeted follow-up question instead of guessing.
- In the JSON output, set the "decision.resolution" to a direct, friendly follow-up question starting with "Before we can give you a final recommendation, we need to clarify..." and list what's missing.
- Set the dialogue characters' comments to discuss the necessity of this missing information.
- Set the confidenceScore to a low score (e.g. below 50) and specify "Missing Information" as a key risk.

If you have enough information:
- Provide high-quality, practical recommendations.
- Keep sentences short. Avoid MBA-speak.
- Generate dialogue for CEO Marcus Sterling (focusing on strategy and growth, 1-2 short sentences) and CFO Clara Vance (focusing on margins, financial costs, and cash flow, 1-2 short sentences).

The output MUST be valid JSON matching this schema exactly (no markdown wrapping):
{
  "dialogue": [
    { "role": "CEO", "name": "Marcus Sterling", "speech": "Strategic comment (1-2 short sentences)." },
    { "role": "CFO", "name": "Clara Vance", "speech": "Cost/margin/financial comment (1-2 short sentences)." }
  ],
  "decision": {
    "resolution": "Crisp direct final recommendation or follow-up question (2-3 simple sentences).",
    "reasoning": ["Practical reason 1", "Practical reason 2"],
    "benefits": ["Benefit 1", "Benefit 2"],
    "risks": ["Risk 1", "Risk 2"],
    "confidenceScore": 90,
    "priority": "High" | "Medium" | "Low",
    "resourcesRequired": [
      { "name": "Resource name", "reason": "Why needed", "estimatedCost": "Cost", "priority": "High" | "Medium" | "Low" }
    ],
    "implementationPlan": ["Simple verb action 1", "Simple verb action 2"],
    "priorityMatrix": {
      "quickWins": ["Easy high-ROI task"],
      "majorProjects": ["Hard high-ROI project"],
      "fillIns": ["Easy low-ROI task"],
      "thanklessTasks": ["Hard low-ROI task"]
    }
  }
}
`;

    // Construct simple query contents
    const contents: any[] = [];
    
    // Add minimized past history
    if (history && history.length > 0) {
      const historyStr = history.map((h: any) => `Q: ${h.question}\nResolution: ${h.resolution}`).join('\n\n');
      contents.push({ text: `Recent Saved Decisions:\n${historyStr}` });
    }

    // Add minimal business context
    const contextStr = `
Business Context:
- Profile: Name: ${profile.name || ''}, Industry: ${profile.industry || ''}, Size: ${profile.size || ''}, Location: ${profile.city || ''}, ${profile.country || ''}
- Products: ${JSON.stringify(knowledgeBase?.products || [])}
- Goals: ${JSON.stringify(knowledgeBase?.goals || [])}
- Challenges: ${JSON.stringify(knowledgeBase?.challenges || [])}
- Grounded Document Snippets: ${finalDocContext}
`;
    contents.push({ text: contextStr });
    
    // Add current question
    contents.push({ text: `Current Business Dilemma to Solve: "${question}"` });

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.4
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    console.warn('[Simulation Fallback] Gemini API experienced a quota or service error. Initiating BoardMind AI Local Heuristics engine... Error:', error.message);
    try {
      const simulated = simulateBoardroomChat(question, profile, knowledgeBase, finalDocContext || '', history || []);
      res.json(simulated);
    } catch (simError: any) {
      console.error('Fallback simulation failed:', simError);
      res.status(500).json({ error: error.message || 'An error occurred during boardroom discussion.' });
    }
  }
});

// 2. Onboarding AI Discovery Interview
app.post('/api/discover/next-question', async (req, res) => {
  const { profile, documents, chatHistory } = req.body;
  try {
    if (!profile) {
      return res.status(400).json({ error: 'Profile is required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `
You are an experienced senior business consultant onboarding "${profile.name}" in "${profile.industry}".
Review the basic business setup:
- Name: ${profile.name}
- Industry: ${profile.industry}
- Location: ${profile.city}, ${profile.country}
- Employees: ${profile.employees}
- Revenue: ${profile.revenue}
- Description: ${profile.description}

Review the analyzed uploaded business documents:
${JSON.stringify(documents || [])}

And the chat history of the interview so far:
${JSON.stringify(chatHistory || [])}

First, evaluate if enough information exists to compile a deep, comprehensive Business Knowledge Graph of the company.
If critical information is missing, generate exactly ONE conversational, friendly, practical follow-up question.
Examples:
- "I noticed you manufacture non-woven bags. Who are your biggest customers?"
- "What makes customers choose you over competitors?"
- "How many bags can you produce each day?"
Never ask unnecessary questions. Ask only information that is missing. Do not use consultant jargon or MBA terms. Use short, simple sentences.

If enough information is gathered (or if you have had 5 or more interview turns already, to prevent user fatigue), set "isComplete" to true, "nextQuestion" to null, and construct a complete Knowledge Base in "analysis" with these exact fields:
{
  "nextQuestion": "The next single sharp question" or null,
  "isComplete": boolean,
  "analysis": {
    "businessSummary": "A highly detailed, professional overview of the company.",
    "mission": "Direct custom mission statement.",
    "vision": "A compelling future vision statement.",
    "products": ["Key product/service offerings"],
    "services": ["Key services offered if B2B/service-based, or list details"],
    "revenueModel": "Detailed revenue generation model.",
    "revenueStreams": ["Stripe/cash/wholesale stream descriptions (for UI)"],
    "targetCustomers": ["Ideal customer segments"],
    "competitiveAdvantages": ["Specific custom edge or secret sauce"],
    "strengths": ["Organizational strength"],
    "weaknesses": ["Operational/financial weakness"],
    "opportunities": ["Growth/expansion opportunities"],
    "threats": ["Competitive or market threats"],
    "departments": ["Specific departments to structure (Operations, Sales, etc.)"],
    "metrics": ["Vital KPIs with estimated realistic benchmarks based on setup/docs"],
    "goals": ["Short and long term milestones"],
    "risks": ["Risk factors (supply, cash flow, competition)"],
    "expansionPlans": ["How they plan to scale or grow"],
    "competitors": ["Realistic named or description of competitor types"],
    "challenges": ["Specific immediate bottlenecks"],
    "availableResources": ["Current resources (machinery, cash, talent)"],
    "technologyUsed": ["Software, POS, or specialized tech used"],
    "supplierInformation": ["Input supply chains, raw materials, or suppliers"],
    "pricingStrategy": "Current and proposed pricing approach.",
    "marketingStrategy": "Customer acquisition and branding strategy.",
    "decisionPreferences": ["Operational priorities (e.g. margin conservation, speed)"]
  } or null
}

Ensure the output is strictly JSON and matches this structure exactly, with NO markdown code block wrapper or text before/after.
`;

    const contents = [
      { text: `Current Chat History of the Interview:\n${JSON.stringify(chatHistory || [])}` }
    ];

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.5
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    console.warn('[Simulation Fallback] Gemini API experienced a quota or service error. Initiating Discovery Interview Local Heuristics engine... Error:', error.message);
    try {
      const simulated = simulateNextQuestion(profile, documents || [], chatHistory || []);
      res.json(simulated);
    } catch (simError: any) {
      console.error('Fallback simulation failed:', simError);
      res.status(500).json({ error: error.message || 'An error occurred during discovery interview.' });
    }
  }
});

// 2.5 Document Deep Analysis Endpoint
app.post('/api/gemini/analyze-document', async (req, res) => {
  const { fileName, fileType, base64Data, textFallback } = req.body;
  try {
    const ai = getGeminiClient();

    let contents: any[] = [];
    let systemInstruction = `
You are a senior business consultant analyzing a document uploaded by a business owner.
Analyze the document carefully and extract:
1. Useful business information (metrics, operations, products, suppliers, customers, financial data).
2. A comprehensive, actionable summary of the document's relevance to the business.

Your response MUST be JSON matching this exact schema (no markdown):
{
  "summary": "A detailed, professional summary of the document, including key business parameters, metrics, or insights extracted.",
  "extractedInfo": "A concise breakdown of the most valuable information extracted from this file, written in simple, actionable terms."
}
`;

    if (base64Data) {
      let mimeType = fileType || 'application/octet-stream';
      const supportedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf', 'text/plain', 'text/csv', 'application/json'];
      
      if (supportedMimes.includes(mimeType)) {
        contents.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
        contents.push({ text: `Analyze this file named "${fileName}".` });
      } else {
        contents.push({ text: `Analyze this document named "${fileName}" with content:\n${textFallback || ''}` });
      }
    } else {
      contents.push({ text: `Analyze this document named "${fileName}" with content:\n${textFallback || ''}` });
    }

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    console.warn('[Simulation Fallback] Gemini API experienced a quota or service error. Initiating Document Analysis Local Heuristics... Error:', error.message);
    try {
      const simulated = simulateAnalyzeDocument(fileName || 'document', fileType || 'text/plain', textFallback || '');
      res.json(simulated);
    } catch (simError: any) {
      console.error('Fallback simulation failed:', simError);
      res.status(500).json({ error: error.message || 'An error occurred during document analysis.' });
    }
  }
});

// 3. What-If Scenario Simulator
app.post('/api/gemini/what-if', async (req, res) => {
  const { scenario, profile, knowledgeBase } = req.body;
  try {
    if (!scenario) {
      return res.status(400).json({ error: 'Scenario is required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `
You are the quantitative simulation engine of BoardMind AI.
Analyze this "What If" scenario: "${scenario}" for "${profile.name}" (${profile.industry} industry).
Rely on their profile and knowledge base to customize financial, operational, and risk projections. Keep language crisp, direct, and straightforward.

Return exactly this JSON schema (no markdown):
{
  "financialImpact": "A detailed 1-paragraph projection of revenue, costs, and upfront investment.",
  "benefits": ["Personalised benefit 1", "Personalised benefit 2"],
  "risks": ["Personalised risk 1", "Personalised risk 2"],
  "recommendation": "Direct proceed/avoid advisory statement.",
  "metrics": [
    { "name": "Revenue Change", "change": "+5% to +10%", "direction": "up" },
    { "name": "Profit Margin", "change": "-2%", "direction": "down" },
    { "name": "Resource Load", "change": "+15%", "direction": "up" },
    { "name": "Risk Exposure", "change": "Moderate", "direction": "neutral" }
  ]
}
`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: [{ text: `Scenario query: "${scenario}"` }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.6
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    console.warn('[Simulation Fallback] Gemini API experienced a quota or service error. Initiating What-If Simulation Local Heuristics... Error:', error.message);
    try {
      const simulated = simulateWhatIf(scenario, profile, knowledgeBase);
      res.json(simulated);
    } catch (simError: any) {
      console.error('Fallback simulation failed:', simError);
      res.status(500).json({ error: error.message || 'An error occurred during scenario simulation.' });
    }
  }
});

// 4. Report Content Generator
app.post('/api/gemini/report', async (req, res) => {
  const { profile, knowledgeBase, decisionHistory, recentConversations } = req.body;
  try {
    const ai = getGeminiClient();

    const systemInstruction = `
You are the Chairman of the Board at BoardMind AI.
Generate a structured, board-ready Strategic Review Report for:
- Company Name: ${profile.name}
- Industry: ${profile.industry}
- Scale: ${profile.size}, ${profile.employees} employees, operating in ${profile.city}, ${profile.country}.

Keep descriptions direct, crisp, and extremely specific to their business, industry, and strategic context.

Return exactly this JSON schema (no markdown):
{
  "executiveSummary": "1-2 paragraphs of clear strategic direction and core board directives.",
  "problem": "Operational bottlenecks and main issues facing the business.",
  "discussion": "Summary of active boardroom conversations discussing margins and positioning.",
  "swot": {
    "strengths": ["...", "..."],
    "weaknesses": ["...", "..."],
    "opportunities": ["...", "..."],
    "threats": ["...", "..."]
  },
  "riskAnalysis": "Analysis of operational, financial, and competitor risks with direct mitigations.",
  "recommendations": ["Initiative 1", "Initiative 2", "Initiative 3"],
  "priorityMatrix": {
    "quickWins": ["Easy high-value action"],
    "majorProjects": ["Harder high-value project"],
    "fillIns": ["Easy lower priority task"],
    "thanklessTasks": ["Hard low return task to avoid"]
  },
  "plan30Day": ["Task 1", "Task 2"],
  "plan90Day": ["Milestone 1", "Milestone 2"],
  "plan1Year": ["Goal 1", "Goal 2"],
  "charts": {
    "health": [
      { "name": "Finance", "score": 75 },
      { "name": "Marketing", "score": 80 },
      { "name": "Operations", "score": 70 },
      { "name": "HR", "score": 75 },
      { "name": "Compliance", "score": 85 }
    ],
    "revenueProjections": [
      { "year": "Current", "revenue": 100 },
      { "year": "Year 1", "revenue": 125 },
      { "year": "Year 2", "revenue": 155 },
      { "year": "Year 3", "revenue": 195 }
    ]
  }
}
All scores are integers out of 100.
`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: [{ text: `Generate full board review report. Current decisions count: ${decisionHistory?.length || 0}.` }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    console.warn('[Simulation Fallback] Gemini API experienced a quota or service error. Initiating Report Generation Local Heuristics... Error:', error.message);
    try {
      const simulated = simulateReport(profile, knowledgeBase, decisionHistory || [], recentConversations || []);
      res.json(simulated);
    } catch (simError: any) {
      console.error('Fallback simulation failed:', simError);
      res.status(500).json({ error: error.message || 'An error occurred during report generation.' });
    }
  }
});

// 5. Business Health Scorecard Endpoint
app.post('/api/dashboard/scorecard', async (req, res) => {
  const { profile, knowledgeBase, documents } = req.body;
  try {
    const ai = getGeminiClient();

    const systemInstruction = `
You are a Senior Financial Analyst and business health strategist specializing in small and medium-sized enterprises (SMEs).
Analyze this business profile and any uploaded grounded documents carefully to calculate or estimate specific Business Health KPIs:
1. Revenue Growth (percentage and trend description)
2. Profit Margin (percentage and trend description)
3. Customer Acquisition Cost (CAC) (value in currency and description)
4. Customer Lifetime Value (LTV) (value in currency and description)

Rely on exact figures mentioned in the uploaded documents if available.
If no documents are uploaded, or if they don't contain specific financial tables, you MUST estimate realistic, industry-standard values for this business size, location, and sector.
Assign rating status: "good" (healthy, positive performance), "average" (stable but requires attention), "poor" (underperforming, requires immediate intervention) based on standard industry benchmarks.

The output MUST be valid JSON matching this schema exactly (no markdown wrapping, no text before/after):
{
  "overallScore": 78,
  "overallStatus": "good" | "average" | "poor",
  "overallSummary": "Summary of overall business health based on the data (1-2 sentences).",
  "kpis": {
    "revenueGrowth": {
      "value": "15%",
      "status": "good" | "average" | "poor",
      "explanation": "Explanation of YoY growth trend and how it benchmarks against their sector.",
      "advice": "Specific actionable suggestion to improve this metric (1 short sentence)."
    },
    "profitMargin": {
      "value": "12%",
      "status": "good" | "average" | "poor",
      "explanation": "Explanation of Operating Profit Margin and current pressure factors.",
      "advice": "Specific actionable suggestion to improve this metric (1 short sentence)."
    },
    "cac": {
      "value": "$45",
      "status": "good" | "average" | "poor",
      "explanation": "Explanation of customer acquisition costs and current efficiency.",
      "advice": "Specific actionable suggestion to improve this metric (1 short sentence)."
    },
    "ltv": {
      "value": "$180",
      "status": "good" | "average" | "poor",
      "explanation": "Explanation of customer lifetime value and purchase frequency.",
      "advice": "Specific actionable suggestion to improve this metric (1 short sentence)."
    }
  },
  "detailedBreakdown": [
    { "category": "Unit Economics", "score": 82, "status": "good" | "average" | "poor", "findings": "Findings..." },
    { "category": "Capital Efficiency", "score": 75, "status": "good" | "average" | "poor", "findings": "Findings..." },
    { "category": "Market Velocity", "score": 70, "status": "good" | "average" | "poor", "findings": "Findings..." }
  ],
  "sourceUsed": "specific documents" | "industry benchmarks" | "profile data"
}
`;

    const contents = [
      { text: `Business Profile: ${JSON.stringify(profile || {})}
Knowledge Base: ${JSON.stringify(knowledgeBase || {})}
Uploaded Documents content snippets: ${documents ? documents.map((d: any) => `Document "${d.name}": ${d.content?.slice(0, 3000) || d.summary}`).join('\n\n') : 'None'}` }
    ];

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    console.warn('[Simulation Fallback] Gemini API experienced an error calculating scorecard. Initiating Local Heuristics... Error:', error.message);
    try {
      const simulated = simulateScorecard(profile, knowledgeBase, documents || []);
      res.json(simulated);
    } catch (simError: any) {
      console.error('Fallback scorecard calculation failed:', simError);
      res.status(500).json({ error: error.message || 'An error occurred during scorecard calculation.' });
    }
  }
});

// Vite middleware or client delivery integration
const isProd = process.env.NODE_ENV === 'production';
if (!isProd) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const port = 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
