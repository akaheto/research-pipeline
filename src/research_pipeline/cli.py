"""CLI for the research pipeline."""

from pathlib import Path
import typer
from typing import Optional

app = typer.Typer(
    name="pipeline",
    help="Research Pipeline: collect, organize, rank, and output research findings.",
)


@app.command()
def run(
    topic: str = typer.Argument(..., help="Research topic to investigate"),
    output: Optional[str] = typer.Option(
        "research_report.docx",
        "--output", "-o",
        help="Output file path (supports .docx, .md)"
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
):
    """Run the complete research pipeline on a topic."""
    typer.echo(f"🔬 Research Pipeline")
    typer.echo(f"📌 Topic: {topic}")
    typer.echo(f"📊 Max results: {max_results}")
    typer.echo(f"📄 Output: {output}")
    typer.echo(f"🧠 Knowledge base: {'enabled' if knowledge_base else 'disabled'}")
    typer.echo()
    typer.echo("⏳ Pipeline execution not yet implemented (Epic B–E)")
    typer.echo("✅ CLI scaffolding complete")


@app.command()
def list_topics():
    """List previously researched topics (placeholder)."""
    typer.echo("📚 Saved research topics (not yet implemented)")


@app.command()
def version():
    """Show version information."""
    from research_pipeline import __version__
    typer.echo(f"Research Pipeline v{__version__}")


if __name__ == "__main__":
    app()
