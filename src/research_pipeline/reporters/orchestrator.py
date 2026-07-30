"""Orchestrates report generation."""

from pathlib import Path
from research_pipeline.reporters.markdown_reporter import MarkdownReporter
from research_pipeline.reporters.docx_reporter import DocxReporter
from research_pipeline.models import Research


class ReportingOrchestrator:
    """Manages report generation in multiple formats."""

    def __init__(self):
        self.markdown_reporter = MarkdownReporter()
        self.docx_reporter = DocxReporter()

    async def generate(
        self,
        research: Research,
        output_path: str,
        format: str = "docx"
    ) -> Path:
        """
        Generate report in specified format.

        Args:
            research: Research object to report on
            output_path: Where to save the report
            format: "docx" or "markdown"

        Returns:
            Path to generated report
        """
        output_path = Path(output_path)

        if format.lower() in ["md", "markdown"]:
            # Ensure .md extension
            if output_path.suffix.lower() != ".md":
                output_path = output_path.with_suffix(".md")
            return await self.markdown_reporter.generate(research, output_path)

        elif format.lower() in ["docx", "doc", "word"]:
            # Ensure .docx extension
            if output_path.suffix.lower() != ".docx":
                output_path = output_path.with_suffix(".docx")
            return await self.docx_reporter.generate(research, output_path)

        else:
            raise ValueError(f"Unsupported format: {format}. Use 'docx' or 'markdown'")

    async def generate_both(
        self,
        research: Research,
        output_dir: str = "./output"
    ) -> dict[str, Path]:
        """
        Generate reports in both formats.

        Args:
            research: Research object
            output_dir: Directory to save reports

        Returns:
            Dict with 'markdown' and 'docx' paths
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        base_name = research.topic.lower().replace(" ", "_")[:50]

        md_path = await self.generate(
            research,
            output_dir / f"{base_name}.md",
            format="markdown"
        )
        docx_path = await self.generate(
            research,
            output_dir / f"{base_name}.docx",
            format="docx"
        )

        return {
            "markdown": md_path,
            "docx": docx_path
        }
