"""Formatting processor for findings."""

import json
from research_pipeline.processors.base import BaseProcessor
from research_pipeline.models import Research, Finding


class FormattingProcessor(BaseProcessor):
    """Normalizes and formats findings for output."""

    async def process(self, research: Research) -> Research:
        """Normalize text, ensure consistency, prepare for output."""
        for finding in research.findings:
            # Strip and normalize whitespace
            finding.text = " ".join(finding.text.split())
            finding.source.title = finding.source.title.strip()

            # Ensure scores are in valid range
            finding.relevance_score = max(0.0, min(1.0, finding.relevance_score))
            finding.credibility_score = max(0.0, min(1.0, finding.credibility_score))
            finding.recency_score = max(0.0, min(1.0, finding.recency_score))

        # Generate summary if not present
        if not research.summary:
            research.summary = self._generate_summary(research)

        return research

    @staticmethod
    def _generate_summary(research: Research) -> str:
        """Generate a brief summary of findings."""
        if not research.findings:
            return f"No findings for topic: {research.topic}"

        top_insight = research.findings[0].text if research.findings else "N/A"
        count = len(research.findings)
        return f"Found {count} key insights on '{research.topic}'. Top finding: {top_insight[:100]}..."

    def to_json(self, research: Research) -> str:
        """Serialize research to JSON for intermediate storage."""
        data = {
            "topic": research.topic,
            "summary": research.summary,
            "created_at": research.created_at.isoformat(),
            "findings_count": len(research.findings),
            "knowledge_base_insights": research.knowledge_base_insights,
            "findings": [
                {
                    "text": f.text,
                    "source": {
                        "url": f.source.url,
                        "title": f.source.title,
                        "domain": f.source.domain,
                        "retrieved_at": f.source.retrieved_at.isoformat()
                    },
                    "scores": {
                        "relevance": round(f.relevance_score, 3),
                        "credibility": round(f.credibility_score, 3),
                        "recency": round(f.recency_score, 3),
                        "combined": round(f.combined_score, 3)
                    }
                }
                for f in research.findings
            ]
        }
        return json.dumps(data, indent=2)
