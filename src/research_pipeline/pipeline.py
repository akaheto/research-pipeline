"""Main pipeline orchestration."""

from research_pipeline.models import Research, PipelineConfig


class ResearchPipeline:
    """Orchestrates the research pipeline: collect → process → report."""

    def __init__(self, config: PipelineConfig):
        self.config = config

    async def run(self) -> Research:
        """
        Execute the complete pipeline.

        Steps:
        1. Collect real-time research from Perplexity
        2. Cross-reference with Project 10 knowledge base
        3. Process & rank findings
        4. Generate report
        """
        # TODO: Implement in Epic B–E
        raise NotImplementedError("Pipeline execution in progress (Epic B–E)")
