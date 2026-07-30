# Research Pipeline

An end-to-end research system that collects real-time web research, cross-references your existing knowledge base, organizes and ranks findings, and outputs structured reports.

## Quick Start

```bash
# Install dependencies
poetry install

# Run the pipeline on a topic
poetry run pipeline run --topic "AI trends 2024" --output report.docx
```

## Features

- **Real-time Web Research**: Query Perplexity via MCP for current web findings
- **Knowledge Integration**: Cross-reference your Project 10 knowledge base
- **Smart Organization**: Deduplicate and structure findings
- **Ranking**: Sort by relevance, recency, and credibility
- **Report Generation**: Output clean Markdown or Word documents (.docx)
- **Repeatable**: Run on different topics, save results, track trends

## Project Structure

```
src/research_pipeline/
  cli.py              # CLI entry point (Typer)
  pipeline.py         # Main orchestration
  collectors/         # Data collection modules
  processors/         # Data processing & ranking
  reporters/          # Report generation
  models.py           # Data models (Pydantic)
  config.py           # Configuration
tests/                # Test suite (pytest)
```

## Development

```bash
# Install with dev dependencies
poetry install

# Run tests
poetry run pytest

# Format code
poetry run black src/ tests/

# Lint
poetry run flake8 src/ tests/
```

## Configuration

See `config.py` for environment variables and settings.

## License

MIT
