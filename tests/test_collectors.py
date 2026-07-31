"""Tests for data collectors."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch, create_autospec
from datetime import datetime

from research_pipeline.models import Finding, Source
from research_pipeline.collectors.perplexity_collector import PerplexityCollector
from research_pipeline.collectors.orchestrator import DataCollectionOrchestrator


class TestPerplexityCollector:
    """Tests for Perplexity collector."""

    def test_init_with_api_key(self):
        """Test initialization with explicit API key."""
        collector = PerplexityCollector(api_key="test-key")
        assert collector.api_key == "test-key"

    def test_init_missing_api_key(self):
        """Test initialization fails without API key."""
        with patch.dict("os.environ", {}, clear=True):
            with pytest.raises(ValueError, match="PERPLEXITY_API_KEY"):
                PerplexityCollector()

    @pytest.mark.asyncio
    async def test_validate_connection_success(self):
        """Test successful connection validation."""
        collector = PerplexityCollector(api_key="test-key")
        with patch.object(collector, "_test_connection", return_value=True):
            result = await collector.validate_connection()
            assert result is True

    @pytest.mark.asyncio
    async def test_validate_connection_failure(self):
        """Test failed connection validation."""
        collector = PerplexityCollector(api_key="test-key")
        with patch.object(collector, "_test_connection", return_value=False):
            result = await collector.validate_connection()
            assert result is False

    @pytest.mark.asyncio
    async def test_collect_success(self):
        """Test successful data collection."""
        collector = PerplexityCollector(api_key="test-key")
        mock_findings = [
            Finding(
                text="Test finding",
                source=Source(
                    url="https://example.com",
                    title="Example",
                    domain="example.com"
                ),
                relevance_score=0.9,
                credibility_score=0.8,
                recency_score=0.7
            )
        ]
        with patch.object(collector, "_query_perplexity", return_value=mock_findings):
            result = await collector.collect("test query")
            assert len(result) == 1
            assert result[0].text == "Test finding"

    @pytest.mark.asyncio
    async def test_collect_error_handling(self):
        """Test error handling during collection."""
        collector = PerplexityCollector(api_key="test-key")
        with patch.object(collector, "_query_perplexity", side_effect=Exception("API error")):
            result = await collector.collect("test query")
            assert result == []


class TestDataCollectionOrchestrator:
    """Tests for collection orchestrator."""

    @pytest.mark.asyncio
    async def test_validate_all_connections(self):
        """Test connection validation across all sources."""
        with patch("research_pipeline.collectors.orchestrator.PerplexityCollector") as mock_perp:
            mock_perp_instance = AsyncMock()
            mock_perp.return_value = mock_perp_instance
            mock_perp_instance.validate_connection = AsyncMock(return_value=True)

            orchestrator = DataCollectionOrchestrator()
            result = await orchestrator.validate_all_connections()
            assert result["perplexity"] is True

    @pytest.mark.asyncio
    async def test_collect_all(self):
        """Test collection from Perplexity."""
        with patch("research_pipeline.collectors.orchestrator.PerplexityCollector") as mock_perp:
            mock_perp_instance = AsyncMock()
            mock_perp.return_value = mock_perp_instance

            mock_web = [
                Finding(
                    text="Web finding",
                    source=Source(url="https://example.com", title="Example", domain="example.com"),
                    relevance_score=0.9,
                    credibility_score=0.8,
                    recency_score=0.7
                )
            ]
            mock_perp_instance.collect = AsyncMock(return_value=mock_web)

            orchestrator = DataCollectionOrchestrator()
            result = await orchestrator.collect_all("test")
            assert len(result.findings) == 1
            assert result.findings[0].text == "Web finding"
