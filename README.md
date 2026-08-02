# Research Pipeline

AI-powered research application that combines Perplexity web research with Claude synthesis to provide transparent, verifiable, cost-effective research insights.

## ✨ Features

### Core Research Methods
- **Perplexity + Claude**: Deep analysis with web research + AI synthesis ($0.03-0.10 per search)
- **Perplexity Only**: Fast, direct web research ($0.01-0.02 per search)
- **Framework Research**: 5 structured templates for investment, competitive, market analysis
- **Multi-Search Synthesis**: Combine 2-10 past searches into unified analysis

### Analysis & Verification
- **Source Evaluation**: Automatic credibility scoring (0-100%) for 40+ domain types
- **Claim Verification**: Extract factual assertions, track citations, detect conflicts
- **Custom Frameworks**: Create personal research templates with 1-10 queries
- **Annotations**: Add notes and insights to research results

### Tracking & Comparison
- **30-day History**: Persistent research storage (auto-delete after 30 days)
- **Timeline Comparison**: Compare research over time, detect changes
- **Activity Logging**: Track all searches and operations
- **Cost Transparency**: Real token counting and actual pricing

### Export & Sharing
- **Multiple Formats**: Markdown, Word (.docx), PDF
- **Citation Styles**: None, APA, MLA, Chicago
- **Full Metadata**: Sources, claims, credibility scores included

## 🚀 Quick Start

### 1. Visit the App
Open: https://research-pipeline-58y2c5zds-ben-a.vercel.app

### 2. Enter Your Topic
Type what you want to research:
```
"best project management tools for remote teams"
"competitive analysis of email marketing platforms"
"AI market trends in 2024"
```

### 3. Choose Your Method
- 🔬 **Perplexity + Claude**: For deep analysis
- 📰 **Perplexity Only**: For quick facts
- 🎯 **Frameworks**: For structured research

### 4. View Results
Get findings organized by:
- Summary and key takeaways
- Detailed findings with sources
- Cost breakdown
- Credibility scores

### 5. Export or Share
Download as Markdown, Word, or PDF with your choice of citation format.

## 📊 How It Works

```
Input Topic
    ↓
Perplexity API (Web Search)
    ↓
[Optional] Claude API (Synthesis)
    ↓
Post-Processing:
  • Extract citations
  • Score credibility
  • Extract claims
  • Detect conflicts
    ↓
Display Results
    ↓
Save to Supabase (30 days)
    ↓
Export or Compare
```

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + TypeScript |
| Framework | Next.js 14+ (App Router) |
| Styling | CSS Modules (scoped) |
| Database | Supabase PostgreSQL |
| Storage | Browser LocalStorage |
| APIs | Perplexity AI, Claude Opus |
| Deployment | Vercel (serverless) |

## 📋 Project Status

### ✅ Completed Phases (7/7)

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Custom Research Frameworks | ✅ Complete |
| 2 | Research Synthesis | ✅ Complete |
| 3 | Source Evaluation | ✅ Complete |
| 4 | Claim Verification | ✅ Complete |
| 5 | Custom Templates | ✅ Complete |
| 6 | Annotations & Notes | ✅ Complete |
| 7 | Research Timeline | ✅ Complete |

## 📖 Documentation

- **[USER_GUIDE.md](./USER_GUIDE.md)** - How to use the app (30 min read)
- **[TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md)** - Architecture & design decisions
- **[VISUAL_STYLE_GUIDE.md](./VISUAL_STYLE_GUIDE.md)** - Design system & components
- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** - Project scope & deliverables
- **[ENHANCEMENTS.md](./ENHANCEMENTS.md)** - Feature roadmap & future plans
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history & changes

## 🎯 Use Cases

### For Investors
- Analyze market opportunities
- Evaluate competitive landscape
- Track market trends
- Verify claims with source credibility

### For Analysts
- Gather competitive intelligence
- Synthesize multiple sources
- Create detailed reports
- Track changes over time

### For Researchers
- Structured research frameworks
- Citation tracking
- Cross-research synthesis
- Historical comparison

## 💰 Pricing (Pay-as-you-go)

| Method | Cost | Best For |
|--------|------|----------|
| Perplexity Only | $0.01-0.02 | Quick facts |
| Perplexity + Claude | $0.03-0.10 | Deep analysis |
| Framework | $0.05-0.20 | Structured research |
| Multi-Synthesis | $0.02-0.05 | Cross-search analysis |

*Transparent pricing: Pay only for what you use*

## 🔐 Security & Privacy

- **No authentication required** (MVP design choice)
- **30-day data retention**: Automatic deletion after 30 days
- **Exportable**: Download your research to keep permanently
- **Secure APIs**: Keys never exposed to frontend
- **No tracking**: We don't sell or share your research

## 🚀 Deployment

Deployed on **Vercel** with automatic git-push-to-production:

```bash
# Push to main → Auto-deployed to production
git push origin main
```

Production URL: https://research-pipeline-58y2c5zds-ben-a.vercel.app

## 🛠️ Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

### Build for Production
```bash
npm run build
npm start
```

### Run Linter
```bash
npm run lint
```

## 📝 Environment Variables

Required (in `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_...
SUPABASE_SERVICE_KEY=sb_secret_...
PERPLEXITY_API_KEY=sk_...
ANTHROPIC_API_KEY=sk_...
```

## 🤝 Contributing

To contribute improvements:

1. Clone the repo
2. Create a feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📞 Support

### Getting Help
- Check [USER_GUIDE.md](./USER_GUIDE.md) for common questions
- Review [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md) for architecture questions
- Check browser console for error messages

### Report Bugs
- Describe what happened
- Include your research topic
- Note browser and OS
- Provide error messages if any

## 📊 Metrics

### Performance
- Average search time: 10-90 seconds (method dependent)
- Page load: <2 seconds
- SSE streaming: <100ms latency
- 30-day history: 100 item limit

### Reliability
- 30-day research retention
- Graceful error handling
- Fallback for failed API calls
- Auto-delete old data

### Cost Efficiency
- Transparent per-operation pricing
- Real token counting
- No surprise charges
- Optional advanced features

## 🗺️ Roadmap

### Planned (High Priority, 1-3 months)
- User authentication (optional)
- Email export
- Advanced search filters
- Team collaboration features
- Mobile app optimization

### Considered (Medium Priority, 3-6 months)
- Research templates marketplace
- Real-time alerts
- AI-powered claim verification
- Multi-language support
- Custom data source integration

See [ENHANCEMENTS.md](./ENHANCEMENTS.md) for full roadmap.

## 📜 License

MIT License - See LICENSE file for details

## 🙏 Credits

- **Perplexity API** - Web research
- **Anthropic Claude** - AI synthesis & evaluation
- **Supabase** - Database & infrastructure
- **Vercel** - Deployment & hosting
- **React** - UI framework
- **Next.js** - Full-stack framework

---

**Ready to research smarter?** [Start here](https://research-pipeline-58y2c5zds-ben-a.vercel.app) 🚀

*Built with React 18, Next.js 14+, TypeScript, and Supabase*
