# Research Pipeline Web App - Deployment Guide

A beautiful, mobile-friendly web interface for the Research Pipeline. Deploy to Vercel in 5 minutes!

## Features

✅ **Search Form** - Enter any research topic  
✅ **Real-time Results** - Web research + knowledge base  
✅ **Quality Scores** - Relevance, credibility, recency ratings  
✅ **Search History** - Saved in browser (localStorage)  
✅ **Settings Panel** - Customize max results, quality threshold, etc.  
✅ **Download Reports** - Export as Markdown or Word  
✅ **Mobile Responsive** - Perfect on phone, tablet, desktop  

## Quick Start (Vercel)

### Step 1: Push to GitHub (Required for Vercel)

```bash
cd /Users/benaheto/Library/CloudStorage/GoogleDrive-akaheto@gmail.com/My\ Drive/Claude/Code/Research\ Pipeline

# If not already a git repo
git init
git add -A
git commit -m "Add web app for Research Pipeline"

# Push to GitHub (you'll need a GitHub account)
git remote add origin https://github.com/YOUR_USERNAME/research-pipeline.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Click "New Project"**
3. **Import your GitHub repo** (`research-pipeline`)
4. **Root Directory:** Set to `web/`
5. **Environment Variables:** Add
   - `ANTHROPIC_API_KEY` = your API key
6. **Click Deploy** ✨

Done! Your app will be live at `https://your-project.vercel.app`

### Step 3: Add to Home Screen (Mobile)

On your iPhone or Android:
1. Open the Vercel URL in your browser
2. Tap **Share** → **Add to Home Screen**
3. App appears as an icon on your home screen
4. Open like a native app!

## Local Development

Want to test locally first?

```bash
cd web

# Install dependencies
npm install

# Run dev server
npm run dev

# Visit http://localhost:3000
```

## Current Features

### Search
- Enter any topic
- Pulls from Perplexity (web) + Project 10 (knowledge base)
- Real-time results with quality scores

### Settings
- **Max Results** (5-50): How many findings to include
- **Similarity Threshold** (0.7-0.99): Duplicate detection
- **Min Quality Score** (0-1.0): Filter low-quality findings
- **Include Knowledge Base**: Toggle on/off

### Results Display
- **Summary** of research
- **Key Findings** with quality scores and source links
- **Knowledge Base Insights** if enabled
- **Score bars** showing combined quality

### History
- **Recent Searches** saved in browser
- Click to reload any past search
- 20 most recent stored

### Download
- **Markdown** (.md) for sharing and embedding
- **Word** (.docx) for formal reports
- One click to download

## How It Works

```
Browser (Next.js Frontend)
         ↓
    API Routes
   /api/research  → Calls Python backend
   /api/export    → Generates reports
         ↓
   Python Pipeline (Runs locally or on backend)
   - DataCollectionOrchestrator
   - ProcessingOrchestrator
   - ReportingOrchestrator
         ↓
    Results displayed beautifully
```

## Production Notes

### Current Demo Mode
- The web app includes mock data for testing
- In production, connect to the real Python API

### To Connect Real Python Backend

Edit `web/app/api/research/route.ts`:

```typescript
// Replace performResearch() with actual API call
const response = await fetch('http://your-python-api/research', {
  method: 'POST',
  body: JSON.stringify(params)
});
const result = await response.json();
```

### Backend Options

1. **Local Server** (during dev)
   ```bash
   cd /path/to/pipeline
   python3 -m research_pipeline.cli run --api
   ```

2. **Railway/Render** (free tier)
   - Deploy Python Flask/FastAPI server
   - Set `PYTHON_API_URL` environment variable

3. **AWS Lambda/Cloud Functions**
   - Serverless Python deployment
   - Set `PYTHON_API_URL` in Vercel env

## Environment Variables

Set in Vercel dashboard (Settings → Environment Variables):

```
ANTHROPIC_API_KEY=your-key-here
PYTHON_API_URL=https://your-backend-api.com (optional)
```

## Troubleshooting

**"Research failed" error?**
- Check `ANTHROPIC_API_KEY` is set in Vercel environment
- Verify the Python backend is running (if you connected one)

**Downloads not working?**
- Ensure browser allows downloads
- Try different format (Markdown vs Word)

**No history showing?**
- Browser localStorage disabled?
- Try incognito/private mode
- History is per-browser, not cloud-synced

**Mobile app slow?**
- First load initializes the app
- Subsequent searches are faster
- Check internet connection

## Customization

### Change Branding
Edit `web/app/page.tsx`:
- Line 1: `const [topic, setTopic] = useState("");` 
- Change header emoji, title, colors

### Adjust Styling
Edit `web/app/page.module.css`:
- Colors: Change `#667eea` hex codes
- Layout: Adjust padding, margins
- Fonts: Modify font-family

### Add Features
- More settings options
- Export to PDF
- Email reports
- Scheduled research
- Sharing links

## Support

For issues:
1. Check Vercel deployment logs (Deployments → View)
2. Check browser console (F12 → Console)
3. Verify environment variables are set
4. Test locally with `npm run dev` first

## Next Steps

1. ✅ Deploy web app to Vercel
2. ✅ Add to home screen on mobile
3. ✅ Connect to real Python backend (optional)
4. ✅ Customize branding & styling
5. ✅ Share URL with others

---

**Made with 🔬 Research Pipeline**
