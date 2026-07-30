"""Orchestrates data processing pipeline."""

from research_pipeline.processors.deduplicator import DeduplicationProcessor
from research_pipeline.processors.ranker import RankingProcessor
from research_pipeline.processors.formatter import FormattingProcessor
from research_pipeline.models import Research


class ProcessingOrchestrator:
    """Chains multiple processors in sequence: deduplicate → rank → format."""

    def __init__(
        self,
        similarity_threshold: float = 0.85,
        max_results: int = 20,
        min_score: float = 0.0
    ):
        """
        Initialize processing pipeline.

        Args:
            similarity_threshold: For deduplication (0.0-1.0)
            max_results: Maximum findings to keep
            min_score: Minimum combined score filter
        """
        self.deduplicator = DeduplicationProcessor(similarity_threshold)
        self.ranker = RankingProcessor(max_results, min_score)
        self.formatter = FormattingProcessor()

    async def process(self, research: Research) -> Research:
        """
        Run the complete processing pipeline.

        Steps:
        1. Deduplicate findings
        2. Rank by combined score
        3. Format and normalize

        Returns:
            Processed Research object
        """
        research = await self.deduplicator.process(research)
        research = await self.ranker.process(research)
        research = await self.formatter.process(research)
        return research

    def to_json(self, research: Research) -> str:
        """Serialize processed research to JSON."""
        return self.formatter.to_json(research)
