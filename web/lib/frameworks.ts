export interface Framework {
  id: string;
  name: string;
  description: string;
  icon: string;
  queries: FrameworkQuery[];
  synthesisPrompt?: string;
}

export interface FrameworkQuery {
  label: string;
  query: string;
  description?: string;
}

export const frameworks: Framework[] = [
  {
    id: "investment-analysis",
    name: "📊 Investment Analysis",
    description: "Analyze investment opportunities comprehensively",
    icon: "📊",
    queries: [
      {
        label: "Market Size & Growth",
        query: "What is the current market size and growth rate? Include revenue projections and CAGR."
      },
      {
        label: "Competitive Landscape",
        query: "Who are the major competitors and what are their market shares, strengths, and weaknesses?",
      },
      {
        label: "Industry Trends & Drivers",
        query: "What are the key industry trends, growth drivers, and headwinds affecting this market?",
      },
      {
        label: "Risks & Opportunities",
        query: "What are the main risks, regulatory concerns, and untapped opportunities in this space?",
      },
      {
        label: "Valuation Benchmarks",
        query: "What are typical valuation multiples (P/E, EV/EBITDA, P/S) for companies in this sector?",
      },
    ],
    synthesisPrompt: `Synthesize the following investment research into a structured analysis. Organize as:

1. **Market Overview** - size, growth, projections
2. **Competitive Position** - key players, market share, competitive advantages
3. **Growth Drivers** - trends, tailwinds, catalysts
4. **Risk Assessment** - regulatory, competitive, market risks
5. **Valuation Framework** - relevant multiples, comparable companies
6. **Investment Thesis** - summary recommendation

Preserve all tables and data. Add analytical commentary connecting findings.`,
  },
  {
    id: "competitive-analysis",
    name: "🏆 Competitive Analysis",
    description: "Deep-dive comparison of competing solutions",
    icon: "🏆",
    queries: [
      {
        label: "Feature Comparison",
        query: "Compare key features and capabilities of these solutions. Create a feature matrix.",
      },
      {
        label: "Pricing & Value",
        query: "Compare pricing models, total cost of ownership, and value propositions.",
      },
      {
        label: "Market Position",
        query: "How do these companies position themselves? What are their target markets and customer segments?",
      },
      {
        label: "Strengths & Weaknesses",
        query: "What are the strengths and weaknesses of each competitor? Who wins in different scenarios?",
      },
      {
        label: "Customer Reviews & Satisfaction",
        query: "What do customers say about these solutions? Compare satisfaction, NPS, or review ratings.",
      },
    ],
    synthesisPrompt: `Synthesize this competitive analysis into an executive summary:

1. **Feature Scorecard** - capabilities matrix
2. **Pricing Comparison** - cost structure and value
3. **Market Positioning** - who targets whom
4. **Strengths & Weaknesses** - by solution
5. **Best Use Cases** - which solution fits what scenario
6. **Verdict** - winner by use case

Keep all tables and structured data. Add analysis on positioning and differentiation.`,
  },
  {
    id: "market-research",
    name: "📈 Market Research",
    description: "Comprehensive market sizing and segmentation",
    icon: "📈",
    queries: [
      {
        label: "Total Addressable Market",
        query: "What is the TAM (Total Addressable Market) and how is it segmented by region, customer type, and use case?",
      },
      {
        label: "Market Growth & Forecasts",
        query: "What are market growth rates, forecasts, and projections for the next 3-5 years?",
      },
      {
        label: "Customer Segments",
        query: "Who are the primary customer segments? What are their needs, pain points, and buying behavior?",
      },
      {
        label: "Distribution Channels",
        query: "What are the main distribution channels and go-to-market strategies in this market?",
      },
      {
        label: "Market Dynamics",
        query: "What forces are shaping this market? M&A activity, consolidation, emerging players, disruption?",
      },
    ],
    synthesisPrompt: `Create a comprehensive market analysis covering:

1. **Market Size** - TAM and segmentation
2. **Growth Trajectory** - historical and projected growth
3. **Customer Landscape** - segments, needs, personas
4. **Go-to-Market** - distribution, channels, strategies
5. **Market Dynamics** - consolidation, disruption, emerging trends
6. **Market Outlook** - opportunities and challenges

Preserve data tables and add strategic analysis.`,
  },
  {
    id: "technology-stack",
    name: "🛠️ Technology Stack",
    description: "Compare tech solutions and architecture approaches",
    icon: "🛠️",
    queries: [
      {
        label: "Technology Comparison",
        query: "Compare these technologies: architecture, performance, scalability, and use cases.",
      },
      {
        label: "Pros & Cons Analysis",
        query: "What are the advantages and disadvantages of each? When should you choose each?",
      },
      {
        label: "Integration & Compatibility",
        query: "How do these technologies integrate with other tools? What's the ecosystem maturity?",
      },
      {
        label: "Community & Support",
        query: "Compare community size, documentation, support resources, and adoption trends.",
      },
      {
        label: "Learning Curve & Migration",
        query: "What's the learning curve for developers? How difficult is migrating from alternatives?",
      },
    ],
    synthesisPrompt: `Synthesize this technology comparison into a developer guide:

1. **Technology Matrix** - features and capabilities
2. **Performance & Scalability** - benchmarks and limits
3. **Developer Experience** - learning curve, ecosystem
4. **Integration Landscape** - compatibility and plugins
5. **When to Use Each** - decision framework by scenario
6. **Migration Guide** - ease of switching

Preserve all comparison tables. Add practical guidance.`,
  },
  {
    id: "product-launch",
    name: "🚀 Product Launch Strategy",
    description: "Plan a product launch with market and competitive analysis",
    icon: "🚀",
    queries: [
      {
        label: "Market Opportunity",
        query: "What is the market opportunity for this product? Size, growth, and underserved segments?",
      },
      {
        label: "Competitive Positioning",
        query: "Who are direct and indirect competitors? How should this product differentiate?",
      },
      {
        label: "Target Customer Profile",
        query: "Who is the ideal customer? What are their pain points and buying criteria?",
      },
      {
        label: "Go-to-Market Strategy",
        query: "What are successful go-to-market strategies in this market? Pricing, channels, partnerships?",
      },
      {
        label: "Key Risks & Success Factors",
        query: "What are critical success factors and main risks for launching this product?",
      },
    ],
    synthesisPrompt: `Create a launch strategy document covering:

1. **Market Opportunity** - sizing and timing
2. **Competitive Landscape** - positioning strategy
3. **Target Customer** - persona, needs, buying journey
4. **Launch Plan** - positioning, pricing, channels
5. **Success Metrics** - KPIs and milestones
6. **Risk Mitigation** - key risks and contingencies

Preserve data and add strategic recommendations.`,
  },
];

export function getFramework(id: string): Framework | undefined {
  return frameworks.find((f) => f.id === id);
}
