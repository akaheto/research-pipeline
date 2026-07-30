"""Tests for CLI commands."""

import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
from typer.testing import CliRunner

from research_pipeline.cli import app
from research_pipeline.models import Finding, Source, Research


runner = CliRunner()


@pytest.fixture
def sample_research():
    """Create sample research for testing."""
    return Research(
        topic="test topic",
        findings=[
            Finding(
                text="Test finding",
                source=Source(
                    url="https://test.com",
                    title="Test Source",
                    domain="test.com"
                ),
                relevance_score=0.9,
                credibility_score=0.8,
                recency_score=0.85
            )
        ],
        knowledge_base_insights=["Test insight"],
        summary="Test summary"
    )


class TestRunCommand:
    """Tests for 'run' command."""

    def test_run_requires_topic(self):
        """Test that run command requires a topic."""
        result = runner.invoke(app, ["run"])
        assert result.exit_code != 0
        assert "TOPIC" in result.output or "Missing argument" in result.output

    def test_run_with_topic_help(self):
        """Test run command help."""
        result = runner.invoke(app, ["run", "--help"])
        assert result.exit_code == 0
        assert "Research topic" in result.output
        assert "--output" in result.output
        assert "--max-results" in result.output

    @patch("research_pipeline.cli.get_config")
    @patch("research_pipeline.cli.DataCollectionOrchestrator")
    @patch("research_pipeline.cli.ProcessingOrchestrator")
    @patch("research_pipeline.cli.ReportingOrchestrator")
    def test_run_full_pipeline(
        self,
        mock_reporter_class,
        mock_processor_class,
        mock_collector_class,
        mock_get_config,
        sample_research,
        tmp_path
    ):
        """Test complete run pipeline."""
        # Setup mocks
        mock_get_config.return_value = MagicMock()

        mock_collector = AsyncMock()
        mock_collector.validate_all_connections = AsyncMock(
            return_value={"perplexity": True, "project_10": True}
        )
        mock_collector.collect_all = AsyncMock(return_value=sample_research)
        mock_collector_class.return_value = mock_collector

        mock_processor = AsyncMock()
        mock_processor.process = AsyncMock(return_value=sample_research)
        mock_processor_class.return_value = mock_processor

        output_file = tmp_path / "report.docx"
        mock_reporter = AsyncMock()
        mock_reporter.generate = AsyncMock(return_value=output_file)
        mock_reporter_class.return_value = mock_reporter

        # Run command
        result = runner.invoke(app, [
            "run",
            "test topic",
            "--output", str(output_file),
            "--max-results", "15",
            "--format", "docx"
        ])

        # Verify success
        assert result.exit_code == 0
        assert "Research Pipeline" in result.output
        assert "test topic" in result.output
        assert "Pipeline Complete" in result.output

    @patch("research_pipeline.cli.get_config")
    def test_run_config_error(self, mock_get_config):
        """Test run handles configuration errors."""
        mock_get_config.side_effect = ValueError("Missing API key")

        result = runner.invoke(app, ["run", "test topic"])

        assert result.exit_code == 1
        assert "Configuration error" in result.output
        assert "API key" in result.output

    def test_run_output_path_default(self):
        """Test default output path generation."""
        with patch("research_pipeline.cli.get_config"), \
             patch("research_pipeline.cli.DataCollectionOrchestrator") as mock_collector_class, \
             patch("research_pipeline.cli.ProcessingOrchestrator") as mock_processor_class, \
             patch("research_pipeline.cli.ReportingOrchestrator") as mock_reporter_class:

            mock_collector = AsyncMock()
            mock_collector.validate_all_connections = AsyncMock(
                return_value={"perplexity": True, "project_10": True}
            )
            mock_collector.collect_all = AsyncMock(
                return_value=Research(topic="ai trends", findings=[])
            )
            mock_collector_class.return_value = mock_collector

            mock_processor = AsyncMock()
            mock_processor.process = AsyncMock(
                return_value=Research(topic="ai trends", findings=[])
            )
            mock_processor_class.return_value = mock_processor

            mock_reporter = AsyncMock()
            mock_reporter.generate = AsyncMock(return_value=Path("ai_trends.docx"))
            mock_reporter_class.return_value = mock_reporter

            result = runner.invoke(app, ["run", "AI trends"])

            # Should generate default output path
            assert "Pipeline Complete" in result.output or result.exit_code == 0

    def test_run_with_options(self):
        """Test run with various options."""
        with patch("research_pipeline.cli.get_config"), \
             patch("research_pipeline.cli.DataCollectionOrchestrator") as mock_collector_class, \
             patch("research_pipeline.cli.ProcessingOrchestrator") as mock_processor_class, \
             patch("research_pipeline.cli.ReportingOrchestrator") as mock_reporter_class:

            mock_collector = AsyncMock()
            mock_collector.validate_all_connections = AsyncMock(
                return_value={"perplexity": True, "project_10": True}
            )
            mock_collector.collect_all = AsyncMock(
                return_value=Research(topic="test", findings=[])
            )
            mock_collector_class.return_value = mock_collector

            mock_processor = AsyncMock()
            mock_processor.process = AsyncMock(
                return_value=Research(topic="test", findings=[])
            )
            mock_processor_class.return_value = mock_processor

            mock_reporter = AsyncMock()
            mock_reporter.generate = AsyncMock(return_value=Path("test.md"))
            mock_reporter_class.return_value = mock_reporter

            result = runner.invoke(app, [
                "run", "test",
                "-o", "custom_report.md",
                "-m", "10",
                "-f", "markdown",
                "--no-knowledge-base",
                "-s", "0.9",
                "--min-score", "0.5"
            ])

            # Verify arguments were passed
            assert result.exit_code == 0
            assert "custom_report.md" in result.output or "Pipeline Complete" in result.output


class TestValidateCommand:
    """Tests for 'validate' command."""

    def test_validate_help(self):
        """Test validate command help."""
        result = runner.invoke(app, ["validate", "--help"])
        assert result.exit_code == 0
        assert "Validate" in result.output or "validate" in result.output

    def test_validate_success(self):
        """Test validate with all connections OK."""
        with patch("research_pipeline.cli.get_config"), \
             patch("research_pipeline.cli.DataCollectionOrchestrator") as mock_collector_class:

            mock_collector = MagicMock()
            mock_collector.validate_all_connections = AsyncMock(
                return_value={"perplexity": True, "project_10": True}
            )
            mock_collector_class.return_value = mock_collector

            result = runner.invoke(app, ["validate"])

            assert result.exit_code == 0
            assert "operational" in result.output.lower()
            assert "Perplexity" in result.output
            assert "Project 10" in result.output

    @patch("research_pipeline.cli.get_config")
    @patch("research_pipeline.cli.DataCollectionOrchestrator")
    def test_validate_partial_failure(self, mock_collector_class, mock_get_config):
        """Test validate with some connections failed."""
        mock_get_config.return_value = MagicMock()

        mock_collector = AsyncMock()
        mock_collector.validate_all_connections = AsyncMock(
            return_value={"perplexity": True, "project_10": False}
        )
        mock_collector_class.return_value = mock_collector

        result = runner.invoke(app, ["validate"])

        assert result.exit_code == 1
        assert "unavailable" in result.output.lower()

    @patch("research_pipeline.cli.get_config")
    def test_validate_config_error(self, mock_get_config):
        """Test validate with configuration error."""
        mock_get_config.side_effect = ValueError("Missing configuration")

        result = runner.invoke(app, ["validate"])

        assert result.exit_code == 1
        assert "Configuration error" in result.output


class TestVersionCommand:
    """Tests for 'version' command."""

    def test_version(self):
        """Test version command."""
        result = runner.invoke(app, ["version"])

        assert result.exit_code == 0
        assert "Research Pipeline v" in result.output


class TestCLIHelp:
    """Tests for general CLI help."""

    def test_main_help(self):
        """Test main help output."""
        result = runner.invoke(app, ["--help"])

        assert result.exit_code == 0
        assert "Research Pipeline" in result.output
        assert "run" in result.output
        assert "validate" in result.output
        assert "version" in result.output

    def test_unknown_command(self):
        """Test unknown command."""
        result = runner.invoke(app, ["unknown"])

        assert result.exit_code != 0
