"""Orchestrates data collection from multiple sources."""

import asyncio
from research_pipeline.collectors.perplexity_collector import PerplexityCollector
from research_pipeline.collectors.project10_collector import Project10Collector
from research_pipeline.models import Finding, Research


class DataCollectionOrchestrator:
    """Manages parallel collection from Perplexity and Project 10."""

    def __init__(self):
        self.perplexity = PerplexityCollector()
        self.project10 = Project10Collector()

    async def validate_all_connections(self) -> dict[str, bool]:
        """Validate connections to all data sources."""
        perp_valid, proj10_valid = await asyncio.gather(
            self.perplexity.validate_connection(),
            self.project10.validate_connection()
        )
        return {
            "perplexity": perp_valid,
            "project_10": proj10_valid
        }

    async def collect_all(
        self,
        topic: str,
        max_web_results: int = 20,
        max_kb_results: int = 10,
        include_knowledge_base: bool = True
    ) -> Research:
        """
        Collect research from all sources in parallel.

        Args:
            topic: Research topic
            max_web_results: Max findings from Perplexity
            max_kb_results: Max insights from Project 10
            include_knowledge_base: Whether to query Project 10

        Returns:
            Research object with all findings
        """
        # Collect from Perplexity
        web_findings = await self.perplexity.collect(topic, max_web_results)

        # Collect from Project 10 if enabled
        kb_findings = []
        kb_insights = []
        if include_knowledge_base:
            kb_findings = await self.project10.collect(topic, max_kb_results)
            kb_insights = [f.text for f in kb_findings]

        # Combine all findings
        all_findings = web_findings + kb_findings

        research = Research(
            topic=topic,
            findings=all_findings,
            knowledge_base_insights=kb_insights
        )

        return research
