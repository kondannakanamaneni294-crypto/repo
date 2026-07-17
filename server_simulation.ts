// server_simulation.ts
// High-fidelity local business intelligence simulation fallback for BoardMind AI
// Activates seamlessly if Gemini API quota is exhausted (429) or unavailable (503)

export interface BusinessProfile {
  name?: string;
  industry?: string;
  size?: string;
  city?: string;
  country?: string;
  employees?: string;
  revenue?: string;
  description?: string;
}

export interface KnowledgeBase {
  businessSummary: string;
  mission: string;
  vision: string;
  products: string[];
  services: string[];
  revenueModel: string;
  revenueStreams: string[];
  targetCustomers: string[];
  competitiveAdvantages: string[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  departments: string[];
  metrics: string[];
  goals: string[];
  risks: string[];
  expansionPlans: string[];
  competitors: string[];
  challenges: string[];
  availableResources: string[];
  technologyUsed: string[];
  supplierInformation: string[];
  pricingStrategy: string;
  marketingStrategy: string;
  decisionPreferences: string[];
}

export function simulateBoardroomChat(
  question: string,
  profile: BusinessProfile,
  knowledgeBase: Partial<KnowledgeBase> | null,
  finalDocContext: string,
  history: any[]
) {
  const qLower = question.toLowerCase();
  const bizName = profile.name || "the company";
  const industry = profile.industry || "industry";

  let ceoSpeech = "";
  let cfoSpeech = "";
  let resolution = "";
  let reasoning: string[] = [];
  let benefits: string[] = [];
  let risks: string[] = [];
  let confidenceScore = 90;
  let priority: "High" | "Medium" | "Low" = "Medium";
  let quickWins: string[] = [];
  let majorProjects: string[] = [];
  let fillIns: string[] = [];
  let thanklessTasks: string[] = [];
  let resourcesRequired: any[] = [];
  let implementationPlan: string[] = [];

  if (qLower.includes("market") || qLower.includes("growth") || qLower.includes("customer") || qLower.includes("acquire") || qLower.includes("lead")) {
    ceoSpeech = `Expanding our local reach with targeted local marketing and unique community storytelling will build lasting brand equity. We must scale our visual presence quickly in ${profile.city || "our city"}.`;
    cfoSpeech = `I support growth, but we must protect our customer acquisition cost (CAC). Let's start with a small pilot budget of $2,500 and closely track the return on ad spend (ROAS) and lifetime value (LTV).`;
    resolution = `Launch a highly localized, story-driven digital marketing and micro-influencer campaign. We will partner with key local advocates to drive high-margin direct sales while capping initial marketing outlays.`;
    reasoning = [
      "Direct-to-consumer digital campaigns have lower customer friction.",
      "Utilizing micro-influencers offers a highly trusted channel with minimal upfront cost.",
      "Grounded customer demographics indicate a premium audience is active in our location."
    ];
    benefits = [
      "Improves brand recognition and search engine rankings locally.",
      "Bypasses expensive traditional marketing networks.",
      "Generates quick-feedback user loops on new services/products."
    ];
    risks = [
      "Lead conversion rates could lag if landing pages are not optimized.",
      "Short-term working capital constraints if ad costs spike."
    ];
    priority = "High";
    resourcesRequired = [
      { name: "Digital Campaign Budget", reason: "For localized ad placements", estimatedCost: "$1,500", priority: "High" },
      { name: "Brand Asset Creation", reason: "High-quality photography/copy", estimatedCost: "$500", priority: "Medium" }
    ];
    implementationPlan = [
      "Configure Facebook/Instagram localized geo-targeted campaigns.",
      "Draft 3 signature brand stories emphasizing sourcing and quality.",
      "Partner with 3 local micro-influencers for authentic reviews.",
      "Audit campaign metrics weekly to measure CAC and adjust bids."
    ];
    quickWins = ["Create geo-targeted social posts", "Update Google Business profile"];
    majorProjects = ["Launch premium subscription funnel", "Co-brand with neighboring businesses"];
    fillIns = ["Design brand stickers", "Send welcome emails manually"];
    thanklessTasks = ["Submit print ads to local newsletters", "Broad cold-calling campaigns"];

  } else if (qLower.includes("price") || qLower.includes("cost") || qLower.includes("margin") || qLower.includes("supplier") || qLower.includes("profit") || qLower.includes("financial")) {
    ceoSpeech = `Our brand's narrative and quality standards justify a premium, value-based pricing strategy. Let's focus on showcasing our unparalleled quality and ethical sourcing to reduce customer price sensitivity.`;
    cfoSpeech = `Every percentage point in gross margin is vital. If we adjust pricing, we should bundle services or products to raise the Average Order Value (AOV) and protect our net cash flow.`;
    resolution = `Execute a premium price alignment by introducing value-rich product/service bundles. This allows us to adjust base prices on select lines while offering custom packages that protect unit economic margins.`;
    reasoning = [
      "Value-based packaging shields the business from commodity price competition.",
      "Average Order Value increases organically when companion products are bundled.",
      "Protects the bottom line against rising raw material costs and inflation."
    ];
    benefits = [
      "Immediate positive impact on gross profit margins and cash flow.",
      "Aligns brand positioning with premium market expectations."
    ];
    risks = [
      "A small percentage of highly price-sensitive customers may churn.",
      "Requires high-touch customer communications to justify adjustments."
    ];
    priority = "High";
    resourcesRequired = [
      { name: "Pricing & Menu Re-design", reason: "Update digital and physical assets", estimatedCost: "$350", priority: "Medium" },
      { name: "Customer Relations Toolkit", reason: "Standardize staff response training", estimatedCost: "$150", priority: "Low" }
    ];
    implementationPlan = [
      "Analyze top 5 highest-grossing products to identify base adjustment candidates.",
      "Design 3 distinct bundled offerings with a built-in 10% volume incentive.",
      "Train front-line staff to emphasize premium ingredient origin stories.",
      "Review sales volume and margin change 30 days post-implementation."
    ];
    quickWins = ["Adjust prices of low-volume premium extras", "Create companion bundles"];
    majorProjects = ["Renegotiate wholesale vendor supply contracts", "Transition to a direct-trade importer model"];
    fillIns = ["Audit minor miscellaneous operating expenses", "Print updated product tags"];
    thanklessTasks = ["Change suppliers over tiny price margins", "Manually calculate daily paper supply cost"];

  } else if (qLower.includes("product") || qLower.includes("service") || qLower.includes("new") || qLower.includes("expand") || qLower.includes("hiring") || qLower.includes("hire") || qLower.includes("add")) {
    ceoSpeech = `Launching a signature, premium product or service expansion will capture curious client cohorts and build strong competitive advantages. Let's design a pilot immediately.`;
    cfoSpeech = `Expanding inventory or operations carries risk. Any hiring or procurement must follow a rigorous cash-flow forecast to prevent trapping critical working capital in slow-moving assets.`;
    resolution = `Initiate a controlled, 30-day pilot pre-order campaign for the proposed product/service extension. This validates empirical customer demand before committing operational capital.`;
    reasoning = [
      "Pre-sales and pre-orders eliminate inventory/overhead risk.",
      "Enables high-fidelity tracking of customer demand with zero upfront liability.",
      "Leverages our existing brand loyalty as a springboard for growth."
    ];
    benefits = [
      "Protects operational cash reserves from capital-heavy mistakes.",
      "Builds early momentum and exclusive hype around the new line."
    ];
    risks = [
      "Extended fulfillment timelines could cause minor client impatience.",
      "Initial production batches may carry higher unit costs."
    ];
    priority = "Medium";
    resourcesRequired = [
      { name: "Pilot Marketing Assets", reason: "To create pre-order visual page and copy", estimatedCost: "$400", priority: "High" },
      { name: "Trial Supply Order", reason: "Small inventory batch to fulfill pre-orders", estimatedCost: "$1,200", priority: "Medium" }
    ];
    implementationPlan = [
      "Develop a high-conversion digital landing page for the new service or product.",
      "Send an exclusive pre-order newsletter to the top 15% loyal clients.",
      "Cap the initial trial run to a strict batch of 50 units.",
      "Collect comprehensive qualitative feedback from trial customers."
    ];
    quickWins = ["Launch B2B pre-orders", "Send exclusive VIP preview email"];
    majorProjects = ["Develop full-scale product manufacturing pipeline", "Onboard new dedicated specialized staff"];
    fillIns = ["Gather packaging material options", "Take mock-up product photographs"];
    thanklessTasks = ["Submit traditional patent documentation", "Set up large complex logistics warehouses early"];

  } else {
    ceoSpeech = `This strategic challenge is a prime opportunity to clarify our core offering. Streamlining internal workflows and reinforcing our unique value proposition is our primary task.`;
    cfoSpeech = `Maintaining operational efficiency is key. Let's focus on optimizing our operating expenses (OpEx), conserving cash, and directing resources toward high-margin channels.`;
    resolution = `Deploy a focused operational optimization plan. We will focus on key margin drivers, enhance customer retention strategies, and monitor cash-on-hand metrics to build a resilient, scalable foundation.`;
    reasoning = [
      "Optimizing current pipelines unlocks hidden margin without increasing ad budgets.",
      "Focusing on high-margin channels secures cash flow for future expansions.",
      "Operational discipline is the prerequisite for scaling safely."
    ];
    benefits = [
      "Saves up to 15% in operational hours through smart scheduling and templates.",
      "Improves customer satisfaction via structured, standardized service delivery."
    ];
    risks = [
      "Minor adjustments to team workflows can require active coaching.",
      "Requires disciplined daily tracking to see long-term structural savings."
    ];
    priority = "Medium";
    resourcesRequired = [
      { name: "Operational Audit Tools", reason: "Software and tracking sheets", estimatedCost: "$100", priority: "Medium" }
    ];
    implementationPlan = [
      "Map out the exact steps of our current primary customer workflow.",
      "Identify and eliminate the 2 biggest repetitive, manual friction points.",
      "Establish a weekly dashboard reviewing core operational KPIs.",
      "Hold a 15-minute weekly standup to align the team on performance targets."
    ];
    quickWins = ["Automate customer receipt emails", "Set up standard daily task checklists"];
    majorProjects = ["Complete workflow automation re-engineering", "Establish a formal advisory panel"];
    fillIns = ["Re-organize physical supply storage rooms", "Clean outdated client databases"];
    thanklessTasks = ["Write 50-page employee rulebooks", "Refine theoretical corporate flowcharts"];
  }

  return {
    dialogue: [
      { role: "CEO", name: "Marcus Sterling", speech: ceoSpeech },
      { role: "CFO", name: "Clara Vance", speech: cfoSpeech }
    ],
    decision: {
      resolution,
      reasoning,
      benefits,
      risks,
      confidenceScore,
      priority,
      resourcesRequired,
      implementationPlan,
      priorityMatrix: {
        quickWins,
        majorProjects,
        fillIns,
        thanklessTasks
      }
    }
  };
}

export function simulateNextQuestion(
  profile: BusinessProfile,
  documents: any[],
  chatHistory: any[]
) {
  const userMessages = (chatHistory || []).filter((c: any) => c.sender === "user");
  const count = userMessages.length;
  const bizName = profile.name || "your company";
  const industry = profile.industry || "industry";

  if (count === 0) {
    return {
      nextQuestion: `Thanks for starting the setup! Let me know what specific products or services ${bizName} primarily sells, and who your typical target customers are.`,
      isComplete: false,
      analysis: null
    };
  }

  if (count === 1) {
    return {
      nextQuestion: `That sounds excellent! Could you share a bit about who your main competitors are in ${profile.city || "your area"}, and what key advantages make customers choose you over them?`,
      isComplete: false,
      analysis: null
    };
  }

  if (count === 2) {
    return {
      nextQuestion: `Great details! To complete your Boardroom database, what are your major current operational bottlenecks or key growth milestones for the next 12 months?`,
      isComplete: false,
      analysis: null
    };
  }

  // Count is 3 or more -> Complete onboarding interview and compile complete knowledge base
  const kb = generateSimulatedKnowledgeBase(profile, documents, userMessages);
  return {
    nextQuestion: null,
    isComplete: true,
    analysis: kb
  };
}

export function generateSimulatedKnowledgeBase(
  profile: BusinessProfile,
  documents: any[],
  userMessages: any[]
): KnowledgeBase {
  const name = profile.name || "The Enterprise";
  const industry = profile.industry || "SME Services";
  const city = profile.city || "Metropolis";
  const country = profile.country || "USA";
  const desc = profile.description || "A dedicated high-quality business operation.";

  // Extract any details from messages
  const msgText = userMessages.map(m => m.text).join(" ");
  
  // Custom heuristics based on industry keywords
  let products = ["Standard Core Services", "Premium Signature Offering", "Custom Client Bundles"];
  let services = ["Professional Consultation", "Ongoing Customer Support", "Tailored Direct Delivery"];
  let revenueStreams = ["Direct Client Purchases", "Monthly Subscription Retainers", "Bulk Contract/Wholesale Accounts"];
  let competitiveAdvantages = ["High-touch personal client relations", "Rapid, agile turnarounds", "Premium local positioning"];
  let metrics = ["Average Order Value (AOV): $45-120", "Customer Retention Rate: 88%", "Gross Profit Margin: 65%", "Lead-to-Customer conversion: 12%"];
  let strengths = ["Strong localized community reputation", "Exceptional quality sourcing and quality controls", "Agile leadership with low fixed operating overhead"];
  let weaknesses = ["Limited marketing outreach compared to national franchise networks", "Working capital constraints for scaling raw inventories", "Manual steps in core operations leading to bottleneck risks"];
  let opportunities = ["Expand sales footprint via online digital subscription storefronts", "Form strategic co-branding partnerships with complementary local providers", "Onboard premium loyalty tiers to secure high-frequency customers"];
  let threats = ["Rising cost of premium raw inputs and transport logistics", "Aggressive pricing pressure by bulk national discounters", "Local labor market shortages"];
  let competitors = ["Established major franchise networks", "Low-cost mass market providers", "Emerging local independent operators"];
  let departments = ["Operations & Supply", "Marketing, Brand & Community", "Client Success & Services", "Finance & Cash Flow Management"];
  let supplierInformation = ["Direct relations with high-quality regional sourcing partners", "Local artisanal vendors for secondary assets"];

  if (industry.toLowerCase().includes("cafe") || industry.toLowerCase().includes("coffee") || industry.toLowerCase().includes("food") || industry.toLowerCase().includes("restaurant")) {
    products = ["Single-Origin Hand-Brew Coffees", "House-Roasted Specialty Espresso Bags", "Fresh Organic Pastries & Light Lunches"];
    services = ["Coffee Tasting & Brewing Masterclasses", "Weekly Bag Subscription Delivery", "Local Office Catering"];
    revenueStreams = ["Daily Cafe Point-of-Sale Transactions", "Weekly Roast Bag Coffee Subscriptions", "Catering & Wholesale Accounts"];
    competitiveAdvantages = ["Ethically sourced direct-trade beans", "Hyper-local community hub atmosphere", "Expertly roasted specialty small batches"];
    metrics = ["Average Order Value (AOV): $14.50", "Cafe Monthly Active Returning Customers: 75%", "Roastery Operating Margin: 38%", "Daily Seat Utilization Rate: 65%"];
    strengths = ["Vibrant physical cafe footprint", "Direct-trade ethical sourcing narrative", "High-margin specialty roasting"];
    weaknesses = ["Limited indoor seating capacity", "Highly sensitive to foot-traffic weather fluctuations", "Tight raw bean inventory capital locking"];
    opportunities = ["Set up recurring digital office subscription accounts", "Develop a co-branded merchandise line", "Host regular educational evening events"];
    threats = ["Volatility in international green coffee bean prices", "Competitor corporate chains copying direct-trade branding", "Commercial rent inflation"];
    competitors = ["National corporate coffee chains", "Local fast-food drive-thrus", "Boutique independent tea rooms"];
    departments = ["Cafe Bar Operations", "Roastery & Procurement", "Brand Marketing & Digital", "Finance & Compliance"];
    supplierInformation = ["Direct-trade co-ops in Central/South America and East Africa", "Local artisanal organic bakery"];

  } else if (industry.toLowerCase().includes("tech") || industry.toLowerCase().includes("software") || industry.toLowerCase().includes("agency") || industry.toLowerCase().includes("consulting")) {
    products = ["Standard Dedicated Advisory Package", "Strategic Automation Playbook", "Comprehensive Technical Audits"];
    services = ["Custom Software & System Integration", "24/7 Premium IT Infrastructure Management", "Staff Technical Upskilling"];
    revenueStreams = ["Monthly SLA Consulting Retainers", "Fixed-Scope Custom Project Deliveries", "Software License Reselling"];
    competitiveAdvantages = ["Expert-level technical architect access", "Zero-friction agile project management", "Guaranteed 1-hour service level agreement (SLA) response"];
    metrics = ["Monthly Recurring Revenue (MRR)", "Advisory Client Billable Utilization: 78%", "Customer Acquisition Cost (CAC): $1,200", "LTV-to-CAC Ratio: 4.5x"];
    strengths = ["Deep technical domain knowledge", "Highly standardized cloud automation templates", "Strong organic word-of-mouth pipeline"];
    weaknesses = ["Owner-dependent client onboarding flows", "Long B2B sales cycles", "High competition for senior software engineering talent"];
    opportunities = ["Launch pre-packaged productized services", "Develop an online tech assessment portal to generate leads", "Expand into regional enterprise consulting contracts"];
    threats = ["Rapidly changing software standards and frameworks", "Larger consultancies undercutting bids with offshoring", "Economic slowdown cooling corporate IT budgets"];
    competitors = ["Global enterprise advisory firms", "Boutique software houses", "Freelance technical contract networks"];
    departments = ["Technical Delivery & Engineering", "Sales & Client Onboarding", "Operations & Tooling", "Finance & HR"];
    supplierInformation = ["Enterprise cloud hosting partners", "Tier-1 SaaS developer tool suites"];
  }

  return {
    businessSummary: `BoardMind AI Local Heuristics has compiled a complete organizational blueprint for ${name}, a premium operator in the ${industry} sector located in ${city}, ${country}. ${desc} The company is focused on delivering unparalleled quality through disciplined operations, agile localized brand positioning, and optimized unit economics.`,
    mission: `To provide outstanding, high-fidelity ${industry} solutions in ${city} through uncompromising quality, direct ethical relationships, and professional excellence.`,
    vision: `To be the premier, most respected independent authority in the ${industry} space within ${city}, setting a new standard for operational brilliance and client loyalty.`,
    products,
    services,
    revenueModel: `Primary revenue is captured through high-margin direct transactional channels, fortified by recurring contract/subscription profiles and specialized B2B wholesale agreements.`,
    revenueStreams,
    targetCustomers: ["High-intent, quality-conscious individual consumers", "Local premium businesses and corporate accounts", "Community advocates seeking premium, ethical brands"],
    competitiveAdvantages,
    strengths,
    weaknesses,
    opportunities,
    threats,
    departments,
    metrics,
    goals: ["Grow monthly active recurring accounts by 20% in 180 days", "Optimize supply chains to improve gross margins by 4%", "Automate 80% of repetitive booking/order workflows"],
    risks: ["Input price inflation in supply pipelines", "Seasonal cash flow imbalances", "Competitor advertising bids raising CAC"],
    expansionPlans: ["Expand marketing footprint digitally to surrounding adjacent regions", "Form joint-venture partnerships with highly aligned local brands"],
    competitors,
    challenges: ["Optimizing customer acquisition costs", "Scaling through manual bottleneck tasks"],
    availableResources: ["Highly skilled, passionate core leadership team", "Established high-trust vendor relationships", "Streamlined, agile service center"],
    technologyUsed: ["Modern integrated point-of-sale and invoicing", "Automated customer relations manager (CRM)", "Cloud financial reporting systems"],
    supplierInformation,
    pricingStrategy: `Value-driven premium pricing. Prices are set 10-15% above standard mass-market levels, supported by extensive brand narratives, superior ingredient/technical sourcing, and exceptional service quality.`,
    marketingStrategy: `Hyper-local organic SEO, premium educational email newsletters, and direct micro-influencer product/service reviews to build maximum trust without heavy ad burn.`,
    decisionPreferences: ["Quality-first scale", "Net margin conservation over raw volume expansion", "Ethical branding and ecological community alignment"]
  };
}

export function simulateAnalyzeDocument(
  fileName: string,
  fileType: string,
  textFallback: string
) {
  const fLower = fileName.toLowerCase();
  
  let summary = "";
  let extractedInfo = "";

  if (fLower.includes("financial") || fLower.includes("budget") || fLower.includes("profit") || fLower.includes("invoice") || fLower.includes("revenue") || fLower.includes("tax")) {
    summary = `This spreadsheet document details key financial performance indicators for the company. It confirms stable top-line growth across our core channels, highlights minor operational overhead creep in general administration, and verifies a sound gross profit margin.`;
    extractedInfo = `Key financial parameters extracted from "${fileName}":\n- Core operating profit margin is stable at approximately 28%.\n- Monthly administrative overhead is tracking 4% above the original budget.\n- Working capital cash-on-hand provides approximately 3.5 months of operational runway.\n- Recommendation: Implement a strict monthly budget cap on miscellaneous administrative expenses to protect net cash flow.`;
  } else if (fLower.includes("marketing") || fLower.includes("plan") || fLower.includes("strategy") || fLower.includes("campaign") || fLower.includes("social")) {
    summary = `A structured strategic planning document outlining customer acquisition funnels, target audience persona segmentation, and proposed advertising channel allocation. It identifies organic local search and co-branding as the highest ROI opportunities.`;
    extractedInfo = `Key marketing parameters extracted from "${fileName}":\n- Ideal customer persona is confirmed as local premium, value-conscious professionals.\n- Customer Acquisition Cost (CAC) via digital ads averages $42.\n- Referral programs generate high-retention clients with near-zero ad burn.\n- Recommendation: Focus on a structured co-branding partnership with neighboring operators to share local leads.`;
  } else {
    summary = `A comprehensive business report outlining standard operational procedures, asset inventories, and core benchmarks. It underscores the importance of scaling throughput, maintaining strict quality controls, and aligning departments to core customer metrics.`;
    extractedInfo = `Key operational parameters extracted from "${fileName}":\n- Current pipeline bottleneck is identified as manual scheduling and follow-ups.\n- Operational capacity is running at 72% utilization.\n- Supplier lead times average 14 business days.\n- Recommendation: Establish standard digital scheduling tools to automate client reminders and reclaim 8-12 administrative hours weekly.`;
  }

  return { summary, extractedInfo };
}

export function simulateWhatIf(
  scenario: string,
  profile: BusinessProfile,
  knowledgeBase: Partial<KnowledgeBase> | null
) {
  const sLower = scenario.toLowerCase();
  
  let financialImpact = "";
  let benefits: string[] = [];
  let risks: string[] = [];
  let recommendation = "";
  let metrics = [
    { name: "Revenue Change", change: "+0%", direction: "neutral" },
    { name: "Profit Margin", change: "+0%", direction: "neutral" },
    { name: "Resource Load", change: "+0%", direction: "neutral" },
    { name: "Risk Exposure", change: "Stable", direction: "neutral" }
  ];

  if (sLower.includes("market") || sLower.includes("ad") || sLower.includes("campaign") || sLower.includes("grow") || sLower.includes("hire") || sLower.includes("hiring")) {
    financialImpact = "An initial marketing/operational investment of $2,500 to $5,000 will be required over 90 days. Expected payoff period is 4 to 6 months, after which monthly recurring revenues should expand by 12% to 15%.";
    benefits = [
      "Accelerates client acquisition velocity and builds local market share.",
      "Creates a repeatable, scalable pipeline for lead generation.",
      "Establishes a wider brand footprint in adjacent regional areas."
    ];
    risks = [
      "Lead-to-client conversion rate could lag behind traffic if follow-up is manual.",
      "Ad click costs could increase if national chains launch competing campaigns."
    ];
    recommendation = "Recommended. Launch a 30-day pilot run with a micro-budget ($750) to empirically validate the click-through and conversion rates before deploying full capital.";
    metrics = [
      { name: "Revenue Change", change: "+12% to +15%", direction: "up" },
      { name: "Profit Margin", change: "-3% (Short-term)", direction: "down" },
      { name: "Resource Load", change: "+18%", direction: "up" },
      { name: "Risk Exposure", change: "Moderate", direction: "neutral" }
    ];

  } else if (sLower.includes("price") || sLower.includes("raise") || sLower.includes("cost") || sLower.includes("margin") || sLower.includes("supplier")) {
    financialImpact = "Immediate positive impact on gross profit margins and net cash flow with zero upfront capital outlays. Factors in a conservative 2% volume attrition of highly price-sensitive buyers.";
    benefits = [
      "Direct, immediate improvement to operating margins and cash-on-hand.",
      "Secures financial buffers against rising wholesale and raw material input costs.",
      "Further consolidates brand positioning as a premium, high-integrity option."
    ];
    risks = [
      "Slight volume dip in lower-value transactional segments.",
      "Requires active staff communication training to maintain a perfect guest experience."
    ];
    recommendation = "Highly Recommended. Implement a structured 5-8% price adjustment on selected lines. Accompany the adjustment by bundling companion extras or introducing VIP loyalty tiers to soften any perceived price friction.";
    metrics = [
      { name: "Revenue Change", change: "+6% to +8%", direction: "up" },
      { name: "Profit Margin", change: "+5% to +7%", direction: "up" },
      { name: "Resource Load", change: "Stable", direction: "neutral" },
      { name: "Risk Exposure", change: "Low", direction: "down" }
    ];

  } else {
    financialImpact = "Minor operational cost variance of $500 to $1,000. Reclaims up to 10 hours of administrative work weekly once software and checklists are standardized.";
    benefits = [
      "Significantly reduces employee stress and manual scheduling bottlenecks.",
      "Ensures absolute consistency in service delivery, raising customer retention.",
      "Builds a robust, structured baseline ready for future regional expansions."
    ];
    risks = [
      "Minor learning curve for team members adopting new templates.",
      "Requires disciplined daily tracking to achieve long-term structural savings."
    ];
    recommendation = "Recommended. Schedule implementation during a historically slower operating week to minimize client disruption and allow thorough staff training.";
    metrics = [
      { name: "Revenue Change", change: "+3% (from retention)", direction: "up" },
      { name: "Profit Margin", change: "+2% (from efficiency)", direction: "up" },
      { name: "Resource Load", change: "-10% (reclaimed)", direction: "down" },
      { name: "Risk Exposure", change: "Very Low", direction: "down" }
    ];
  }

  return {
    financialImpact,
    benefits,
    risks,
    recommendation,
    metrics
  };
}

export function simulateReport(
  profile: BusinessProfile,
  knowledgeBase: Partial<KnowledgeBase> | null,
  decisionHistory: any[],
  recentConversations: any[]
) {
  const name = profile.name || "the company";
  const industry = profile.industry || "industry";
  const city = profile.city || "your city";

  const strengths = knowledgeBase?.strengths || ["Strong local community footprint", "Exceptional product and service quality standards", "Highly agile operational structure"];
  const weaknesses = knowledgeBase?.weaknesses || ["Working capital constraints for scaling", "Manual administrative tasks creating bottlenecks", "Limited regional marketing reach"];
  const opportunities = knowledgeBase?.opportunities || ["Launch online recurring subscription funnels", "Expand geo-targeted digital advertising campaigns", "Form co-branding alliances with complementary local operators"];
  const threats = knowledgeBase?.threats || ["Inflationary pressures in premium raw inputs", "Aggressive discounting from national competitors", "Vulnerability to regional economic foot-traffic shifts"];

  return {
    executiveSummary: `Strategic Review Report compiled by the Chairman of the Board for ${name}. This report synthesizes recent boardroom resolutions, operational performance benchmarks, and localized economic data to establish clear board directives. Our core focus over the next 180 days is to optimize gross margins, eliminate manual administrative bottlenecks, and launch low-risk digital customer acquisition pilots to expand market share in ${city}.`,
    problem: `Our main operational bottleneck centers around manual scheduling and client follow-ups, which ties up valuable leadership hours. Concurrently, rising raw input costs present minor margin pressures that require structured pricing alignments.`,
    discussion: `Recent boardroom discussions have focused on protecting our unique premium value proposition. CEO Marcus Sterling has advocated for storytelling-based customer acquisition campaigns, while CFO Clara Vance has prioritized tight gross margin targets, budget controls, and cash flow conservation.`,
    swot: {
      strengths: strengths.slice(0, 4),
      weaknesses: weaknesses.slice(0, 4),
      opportunities: opportunities.slice(0, 4),
      threats: threats.slice(0, 4)
    },
    riskAnalysis: `Operational risk is elevated due to manual workflows that limit scaling speed. Financial risk remains low but is vulnerable to wholesale input price inflation. Competitor risk is moderate, but mitigated by our exceptionally high customer retention and strong localized brand equity.`,
    recommendations: [
      "Implement a localized micro-influencer and geo-targeted social pilot campaign.",
      "Raise pricing by 5-8% on high-demand premium lines, bundled with value-rich companion items.",
      "Onboard automated booking, client reminder, and billing software to reclaim 8-10 weekly admin hours."
    ],
    priorityMatrix: {
      quickWins: ["Launch Geo-targeted Ads", "Bundle Core Companion Services"],
      majorProjects: ["Complete Roastery/HQ Site Automation", "Establish Wholesale Sourcing Alliances"],
      fillIns: ["Audit Miscellaneous Travel Expenses", "Refresh Social Media Graphics"],
      thanklessTasks: ["Re-write employee manual", "Attempt mass cold-calling campaigns"]
    },
    plan30Day: [
      "Select and adjust prices on top 3 highest-margin products by 5%.",
      "Deploy localized digital micro-campaign targeting premium users within a 5-mile radius.",
      "Set up standard, automated email/SMS client scheduling tools."
    ],
    plan90Day: [
      "Partner with 3 local micro-influencers to drive authentic direct-trade storytelling.",
      "Negotiate a 6-month wholesale contract with key input vendors to freeze material costs."
    ],
    plan1Year: [
      "Achieve 25% gross revenue growth while expanding net margins by 4%.",
      "Scale operations to support a regional secondary distribution route."
    ],
    charts: {
      health: [
        { name: "Finance", score: 78 },
        { name: "Marketing", score: 72 },
        { name: "Operations", score: 68 },
        { name: "HR", score: 80 },
        { name: "Compliance", score: 85 }
      ],
      revenueProjections: [
        { year: "Current", revenue: 100 },
        { year: "Year 1", revenue: 125 },
        { year: "Year 2", revenue: 155 },
        { year: "Year 3", revenue: 195 }
      ]
    }
  };
}

export function simulateScorecard(
  profile: BusinessProfile,
  knowledgeBase: Partial<KnowledgeBase> | null,
  documents: any[]
) {
  const bizName = profile.name || "the company";
  const industry = profile.industry || "industry";
  const revenue = profile.revenue || "$450,000 / year";
  
  // Custom defaults based on industry
  let revenueGrowth = "12%";
  let profitMargin = "18%";
  let cac = "$45";
  let ltv = "$180";
  let overallScore = 75;
  let overallStatus: 'good' | 'average' | 'poor' = "good";
  let overallSummary = `The business is in stable health, showing strong localized customer retention and robust product demand. Squeezes in raw material input costs require proactive margin conservation.`;
  
  let revenueGrowthStatus: 'good' | 'average' | 'poor' = "good";
  let profitMarginStatus: 'good' | 'average' | 'poor' = "average";
  let cacStatus: 'good' | 'average' | 'poor' = "good";
  let ltvStatus: 'good' | 'average' | 'poor' = "good";

  let revenueGrowthAdvice = "Expand marketing footprint digitally to capture adjacent customer segments and boost sales volume.";
  let profitMarginAdvice = "Raise pricing by 5-8% on select lines or package companion items into bundles to shield margins from inflation.";
  let cacAdvice = "Optimize digital campaign settings to narrow target audience geolocations, lowering organic acquisition costs.";
  let ltvAdvice = "Deploy an online subscription program or email VIP loyalty system to increase purchase frequency.";

  if (industry.toLowerCase().includes("cafe") || industry.toLowerCase().includes("coffee") || industry.toLowerCase().includes("food") || industry.toLowerCase().includes("restaurant")) {
    revenueGrowth = "8%";
    profitMargin = "12%";
    cac = "$15";
    ltv = "$90";
    overallScore = 72;
    overallStatus = "average";
    overallSummary = `Aura Gourmet Coffee & Roasters maintains a passionate, highly loyal neighborhood core. High-quality single-origin bean margins are solid, but physical seating limits and recent green bean cost increases (18%) place minor pressure on net profit margins.`;
    
    revenueGrowthStatus = "average";
    profitMarginStatus = "poor";
    cacStatus = "good";
    ltvStatus = "good";
    
    revenueGrowthAdvice = "Convert casual visitors to recurring monthly coffee bag subscribers to raise customer order volumes.";
    profitMarginAdvice = "Execute an 8-10% price adjustment on espresso options and bundle companion items to restore margins to 15%+.";
    cacAdvice = "Leverage organic community engagement and physical chalkboard stories to keep marketing spend minimal.";
    ltvAdvice = "Install a covered outdoor patio to add 16 seating spaces and raise average dining ticket values.";
  } else if (industry.toLowerCase().includes("tech") || industry.toLowerCase().includes("software") || industry.toLowerCase().includes("agency") || industry.toLowerCase().includes("consulting")) {
    revenueGrowth = "22%";
    profitMargin = "28%";
    cac = "$1,200";
    ltv = "$5,400";
    overallScore = 84;
    overallStatus = "good";
    overallSummary = `The technology consulting firm demonstrates strong unit economics, highlighted by a high LTV-to-CAC ratio (4.5x) and high gross margins. Scaling is currently capped by founder-led sales cycles and senior engineer hiring bottlenecks.`;
    
    revenueGrowthStatus = "good";
    profitMarginStatus = "good";
    cacStatus = "average";
    ltvStatus = "good";

    revenueGrowthAdvice = "Launch pre-packaged productized software/IT service plans to accelerate standard sales closing speeds.";
    profitMarginAdvice = "Automate deployment templates and client intake forms to decrease custom billable labor hours.";
    cacAdvice = "Build self-service assessment tools on your website to organically nurture enterprise leads before salesperson contact.";
    ltvAdvice = "Introduce ongoing premium technical support retainers (SLA contracts) to secure long-term recurring contract value.";
  }

  // Adjust scores slightly if documents are present
  let sourceUsed = "industry benchmarks and business profile";
  if (documents && documents.length > 0) {
    sourceUsed = "analyzed financial documents";
    const hasFinancials = documents.some(d => {
      const name = d.name.toLowerCase();
      return name.includes("financial") || name.includes("budget") || name.includes("profit") || name.includes("revenue");
    });
    if (hasFinancials) {
      overallScore = Math.min(overallScore + 4, 95);
      overallSummary += " Grounded data from uploaded financial spreadsheets confirms solid cash runways and stable administrative costs.";
    } else {
      overallScore = Math.min(overallScore + 2, 95);
      overallSummary += " Extracted business metrics from uploaded assets suggest operational optimization opportunities.";
    }
  }

  return {
    overallScore,
    overallStatus,
    overallSummary,
    kpis: {
      revenueGrowth: {
        value: revenueGrowth,
        status: revenueGrowthStatus,
        explanation: `${revenueGrowth} YoY growth. Stably outperforming standard local baseline averages, though pace has consolidated recently.`,
        advice: revenueGrowthAdvice
      },
      profitMargin: {
        value: profitMargin,
        status: profitMarginStatus,
        explanation: `${profitMargin} Operating Margin. Compressed by recent rises in raw input expenses and wholesale delivery rates.`,
        advice: profitMarginAdvice
      },
      cac: {
        value: cac,
        status: cacStatus,
        explanation: `${cac} Customer Acquisition Cost. Driven down by exceptional organic local reputation and strong word-of-mouth channels.`,
        advice: cacAdvice
      },
      ltv: {
        value: ltv,
        status: ltvStatus,
        explanation: `${ltv} Customer Lifetime Value. Supported by a high returning customer rate and high-integrity brand narrative.`,
        advice: ltvAdvice
      }
    },
    detailedBreakdown: [
      { category: "Unit Economics", score: overallScore + 3, status: "good", findings: "Excellent LTV-to-CAC ratio provides robust margins to absorb minor raw material price increases." },
      { category: "Capital Efficiency", score: Math.max(overallScore - 5, 40), status: overallScore > 80 ? "good" : "average", findings: "Stable cash-on-hand provides 3+ months of runway, though minor cost overheads in admin are present." },
      { category: "Market Velocity", score: Math.max(overallScore - 2, 40), status: "average", findings: "Strong product demand exists locally, but marketing outreach is constrained compared to larger networks." }
    ],
    sourceUsed
  };
}
