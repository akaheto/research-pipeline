"""Orchestrates data collection from multiple sources."""

from research_pipeline.collectors.perplexity_collector import PerplexityCollector
from research_pipeline.models import Research


class DataCollectionOrchestrator:
    """Manages data collection from Perplexity."""

    def __init__(self):
        self.perplexity = PerplexityCollector()

    async def validate_all_connections(self) -> dict[str, bool]:
        """Validate connections to all data sources."""
        perp_valid = await self.perplexity.validate_connection()
        return {"perplexity": perp_valid}

    async def collect_all(
        self,
        topic: str,
        max_web_results: int = 20
    ) -> Research:
        """
        Collect research from Perplexity.

        Args:
            topic: Research topic
            max_web_results: Max findings from Perplexity

        Returns:
            Research object with findings
        """
        findings = await self.perplexity.collect(topic, max_web_results)

        research = Research(
            topic=topic,
            findings=findings
        )

        return research
