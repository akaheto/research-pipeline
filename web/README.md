# Research Pipeline Web App

Beautiful, mobile-friendly web interface for the Research Pipeline.

## Quick Start

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

## Deploy to Vercel

See [WEB_DEPLOYMENT.md](../WEB_DEPLOYMENT.md) for complete deployment instructions.

**TL;DR:**
1. Push to GitHub
2. Connect to Vercel
3. Add `ANTHROPIC_API_KEY` environment variable
4. Done! Live on `vercel.app` URL

## Features

- 🔍 Search research topics
- 📊 Quality scores (relevance, credibility, recency)
- 💾 Search history
- ⚙️ Customizable settings
- 📥 Download as Markdown or Word
- 📱 Mobile responsive
- ✨ Beautiful UI

## Project Structure

```
web/
├── app/
│   ├── api/
│   │   ├── research/        # Research API endpoint
│   │   └── export/          # Download/export endpoint
│   ├── page.tsx             # Main page component
│   ├── layout.tsx           # Root layout
│   ├── page.module.css      # Styles
│   └── globals.css          # Global styles
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** CSS Modules
- **Storage:** Browser localStorage
- **Deployment:** Vercel

## Environment Variables

```
ANTHROPIC_API_KEY=your-key-here
PYTHON_API_URL=http://localhost:3001  # Optional, for local backend
```

## API Routes

### `/api/research` (POST)

Research a topic.

**Request:**
```json
{
  "topic": "AI trends 2024",
  "max_results": 20,
  "similarity_threshold": 0.85,
  "min_score": 0
}
```

**Response:**
```json
{
  "topic": "AI trends 2024",
  "findings": [...],
  "summary": "...",
  "created_at": "2024-07-30T..."
}
```

### `/api/export` (POST)

Export results as report.

**Request:**
```json
{
  "result": {...},
  "format": "markdown" | "docx"
}
```

**Response:** Binary file (Markdown or Word)

## Development

```bash
# Install
npm install

# Dev server (auto-reload)
npm run dev

# Build for production
npm build

# Start production server
npm start

# Lint code
npm run lint
```

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Performance

- **First Load:** ~2-3 seconds
- **Search:** ~30-60 seconds (depends on network)
- **History Load:** Instant (localStorage)
- **Download:** <1 second

## Future Enhancements

- [ ] PDF export
- [ ] Email reports
- [ ] Scheduled research
- [ ] Sharing links
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Advanced filtering

## Support

See [WEB_DEPLOYMENT.md](../WEB_DEPLOYMENT.md) for troubleshooting.

---

Made with 🔬 Research Pipeline
