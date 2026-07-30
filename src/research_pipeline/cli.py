"""CLI for the research pipeline."""

import asyncio
from pathlib import Path
import typer
from typing import Optional
import sys

from research_pipeline.collectors.orchestrator import DataCollectionOrchestrator
from research_pipeline.processors.orchestrator import ProcessingOrchestrator
from research_pipeline.reporters.orchestrator import ReportingOrchestrator
from research_pipeline.config import get_config

app = typer.Typer(
    name="pipeline",
    help="Research Pipeline: collect, organize, rank, and output research findings.",
)


@app.command()
def run(
    topic: str = typer.Argument(..., help="Research topic to investigate"),
    output: Optional[str] = typer.Option(
        None,
        "--output", "-o",
        help="Output file path (supports .docx, .md). Default: topic_name.docx"
    ),
    max_results: int = typer.Option(
        20,
        "--max-results", "-m",
        help="Maximum research findings to include"
    ),
    format: str = typer.Option(
        "docx",
        "--format", "-f",
        help="Output format: docx or markdown"
    ),
    knowledge_base: bool = typer.Option(
        True,
        "--knowledge-base/--no-knowledge-base",
        help="Include cross-reference with Project 10 knowledge base"
    ),
    similarity_threshold: float = typer.Option(
        0.85,
        "--similarity", "-s",
        help="Deduplication threshold (0.0-1.0)",
        min=0.0,
        max=1.0
    ),
    min_score: float = typer.Option(
        0.0,
        "--min-score",
        help="Minimum combined score filter (0.0-1.0)",
        min=0.0,
        max=1.0
    ),
):
    """Run the complete research pipeline on a topic."""
    try:
        asyncio.run(_run_async(
            topic=topic,
            output=output,
            max_results=max_results,
            format=format,
            knowledge_base=knowledge_base,
            similarity_threshold=similarity_threshold,
            min_score=min_score
        ))
    except KeyboardInterrupt:
        typer.echo("\n⚠️  Pipeline interrupted by user", err=True)
        sys.exit(1)
    except Exception as e:
        typer.echo(f"❌ Pipeline failed: {e}", err=True)
        sys.exit(1)


async def _run_async(
    topic: str,
    output: Optional[str],
    max_results: int,
    format: str,
    knowledge_base: bool,
    similarity_threshold: float,
    min_score: float,
):
    """Async implementation of pipeline."""
    typer.echo("🔬 Research Pipeline")
    typer.echo(f"📌 Topic: {topic}")
    typer.echo(f"📊 Max results: {max_results}")
    typer.echo(f"📄 Format: {format}")
    typer.echo(f"🧠 Knowledge base: {'enabled' if knowledge_base else 'disabled'}")
    typer.echo()

    # Validate configuration
    try:
        config = get_config()
    except ValueError as e:
        typer.echo(f"❌ Configuration error: {e}", err=True)
        typer.echo("   Set ANTHROPIC_API_KEY environment variable", err=True)
        raise typer.Exit(code=1)

    # Set default output path if not provided
    if not output:
        safe_topic = topic.lower().replace(" ", "_")[:50]
        output = f"{safe_topic}.{format if format.lower() in ['md', 'markdown'] else 'docx'}"

    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Step 1: Collect
    typer.echo("⏳ Step 1/3: Collecting research...")
    try:
        collector = DataCollectionOrchestrator()
        connections = await collector.validate_all_connections()
        if not connections.get("perplexity"):
            typer.echo("⚠️  Warning: Perplexity connection failed", err=True)
        if not connections.get("project_10") and knowledge_base:
            typer.echo("⚠️  Warning: Project 10 connection failed", err=True)

        research = await collector.collect_all(
            topic=topic,
            max_web_results=max_results,
            max_kb_results=10,
            include_knowledge_base=knowledge_base
        )
        typer.echo(f"✅ Collected {len(research.findings)} findings")
    except Exception as e:
        typer.echo(f"❌ Collection failed: {e}", err=True)
        raise

    # Step 2: Process
    typer.echo("⏳ Step 2/3: Processing findings...")
    try:
        processor = ProcessingOrchestrator(
            similarity_threshold=similarity_threshold,
            max_results=max_results,
            min_score=min_score
        )
        research = await processor.process(research)
        typer.echo(f"✅ Processed to {len(research.findings)} unique, ranked findings")
    except Exception as e:
        typer.echo(f"❌ Processing failed: {e}", err=True)
        raise

    # Step 3: Generate Report
    typer.echo("⏳ Step 3/3: Generating report...")
    try:
        reporter = ReportingOrchestrator()
        result_path = await reporter.generate(
            research=research,
            output_path=str(output_path),
            format=format
        )
        typer.echo(f"✅ Report generated: {result_path}")
    except Exception as e:
        typer.echo(f"❌ Report generation failed: {e}", err=True)
        raise

    # Summary
    typer.echo()
    typer.echo("=" * 60)
    typer.echo("✨ Pipeline Complete!")
    typer.echo(f"   Topic: {topic}")
    typer.echo(f"   Findings: {len(research.findings)}")
    typer.echo(f"   Report: {result_path}")
    typer.echo("=" * 60)


@app.command()
def validate():
    """Validate pipeline configuration and connections."""
    typer.echo("🔍 Validating Research Pipeline...\n")

    # Check configuration
    try:
        config = get_config()
        typer.echo("✅ Configuration loaded")
    except ValueError as e:
        typer.echo(f"❌ Configuration error: {e}")
        raise typer.Exit(code=1)

    # Check connections
    typer.echo("🔌 Checking data source connections...")
    try:
        orchestrator = DataCollectionOrchestrator()
        connections = asyncio.run(orchestrator.validate_all_connections())

        for source, valid in connections.items():
            status = "✅" if valid else "❌"
            typer.echo(f"   {status} {source.replace('_', ' ').title()}")

        if all(connections.values()):
            typer.echo("\n✨ All systems operational!")
        else:
            typer.echo("\n⚠️  Some connections unavailable", err=True)
            raise typer.Exit(code=1)

    except typer.Exit:
        raise
    except Exception as e:
        typer.echo(f"❌ Validation failed: {e}", err=True)
        raise typer.Exit(code=1)


@app.command()
def version():
    """Show version information."""
    from research_pipeline import __version__
    typer.echo(f"Research Pipeline v{__version__}")


if __name__ == "__main__":
    app()
