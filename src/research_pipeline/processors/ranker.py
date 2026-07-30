"""Ranking processor for findings."""

from research_pipeline.processors.base import BaseProcessor
from research_pipeline.models import Research, Finding


class RankingProcessor(BaseProcessor):
    """Ranks and filters findings by relevance, credibility, and recency."""

    def __init__(self, max_results: int = 20, min_combined_score: float = 0.0):
        """
        Initialize ranker.

        Args:
            max_results: Maximum findings to keep
            min_combined_score: Minimum combined score threshold (0.0-1.0)
        """
        self.max_results = max_results
        self.min_combined_score = min_combined_score

    async def process(self, research: Research) -> Research:
        """Rank findings by combined score and filter."""
        # Filter by minimum score
        filtered = [
            f for f in research.findings
            if f.combined_score >= self.min_combined_score
        ]

        # Sort by combined score (descending)
        ranked = sorted(
            filtered,
            key=lambda f: f.combined_score,
            reverse=True
        )[:self.max_results]

        research.findings = ranked
        return research
