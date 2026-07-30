"""Tests for data processors."""

import pytest
import json
from datetime import datetime

from research_pipeline.models import Finding, Source, Research
from research_pipeline.processors.deduplicator import DeduplicationProcessor
from research_pipeline.processors.ranker import RankingProcessor
from research_pipeline.processors.formatter import FormattingProcessor
from research_pipeline.processors.orchestrator import ProcessingOrchestrator


@pytest.fixture
def sample_findings():
    """Create sample findings for testing."""
    return [
        Finding(
            text="AI is transforming industries",
            source=Source(url="https://example1.com", title="Tech News 1", domain="example1.com"),
            relevance_score=0.9,
            credibility_score=0.8,
            recency_score=0.9
        ),
        Finding(
            text="AI is transforming industries",  # Duplicate
            source=Source(url="https://example2.com", title="Tech News 2", domain="example2.com"),
            relevance_score=0.85,
            credibility_score=0.75,
            recency_score=0.8
        ),
        Finding(
            text="Machine learning advances in NLP",
            source=Source(url="https://example3.com", title="AI Weekly", domain="example3.com"),
            relevance_score=0.7,
            credibility_score=0.9,
            recency_score=0.6
        ),
        Finding(
            text="Low relevance finding about dogs",
            source=Source(url="https://example4.com", title="Random", domain="example4.com"),
            relevance_score=0.2,
            credibility_score=0.5,
            recency_score=0.3
        ),
    ]


@pytest.fixture
def sample_research(sample_findings):
    """Create sample research object."""
    return Research(topic="AI trends", findings=sample_findings.copy())


class TestDeduplicationProcessor:
    """Tests for deduplication processor."""

    @pytest.mark.asyncio
    async def test_removes_duplicates(self, sample_research):
        """Test that near-duplicate findings are removed."""
        processor = DeduplicationProcessor(similarity_threshold=0.9)
        result = await processor.process(sample_research)

        # Should have 3 items (duplicate removed, best-scoring one kept)
        assert len(result.findings) == 3
        # First finding should be kept (highest score)
        assert "AI is transforming industries" in result.findings[0].text

    @pytest.mark.asyncio
    async def test_keeps_high_scoring_duplicate(self, sample_research):
        """Test that when duplicates exist, highest-scoring is kept."""
        processor = DeduplicationProcessor(similarity_threshold=0.85)
        result = await processor.process(sample_research)

        # Find the AI finding
        ai_findings = [f for f in result.findings if "AI is transforming" in f.text]
        assert len(ai_findings) == 1
        # Should keep the 0.9 relevance score one
        assert ai_findings[0].relevance_score == 0.9

    @pytest.mark.asyncio
    async def test_empty_findings(self):
        """Test deduplication with no findings."""
        processor = DeduplicationProcessor()
        research = Research(topic="test", findings=[])
        result = await processor.process(research)
        assert len(result.findings) == 0

    def test_text_similarity(self):
        """Test text similarity calculation."""
        processor = DeduplicationProcessor()
        assert processor._text_similarity("hello world", "hello world") == 1.0
        assert processor._text_similarity("hello world", "hello there") > 0.6
        assert processor._text_similarity("abc", "xyz") < 0.1


class TestRankingProcessor:
    """Tests for ranking processor."""

    @pytest.mark.asyncio
    async def test_sorts_by_combined_score(self, sample_research):
        """Test that findings are sorted by combined score."""
        processor = RankingProcessor(max_results=20)
        result = await processor.process(sample_research)

        # Should be sorted descending by score
        scores = [f.combined_score for f in result.findings]
        assert scores == sorted(scores, reverse=True)

    @pytest.mark.asyncio
    async def test_limits_max_results(self, sample_research):
        """Test that results are limited to max_results."""
        processor = RankingProcessor(max_results=2)
        result = await processor.process(sample_research)

        assert len(result.findings) == 2

    @pytest.mark.asyncio
    async def test_filters_by_min_score(self, sample_research):
        """Test that findings below min score are filtered."""
        processor = RankingProcessor(max_results=20, min_combined_score=0.5)
        result = await processor.process(sample_research)

        # Should filter out "dogs" finding (combined score ~0.33)
        for finding in result.findings:
            assert finding.combined_score >= 0.5

    @pytest.mark.asyncio
    async def test_empty_findings(self):
        """Test ranking with no findings."""
        processor = RankingProcessor()
        research = Research(topic="test", findings=[])
        result = await processor.process(research)
        assert len(result.findings) == 0


class TestFormattingProcessor:
    """Tests for formatting processor."""

    @pytest.mark.asyncio
    async def test_normalizes_whitespace(self, sample_research):
        """Test that whitespace is normalized."""
        sample_research.findings[0].text = "AI  is   transforming    industries"
        processor = FormattingProcessor()
        result = await processor.process(sample_research)

        assert result.findings[0].text == "AI is transforming industries"

    @pytest.mark.asyncio
    async def test_clamps_scores(self, sample_research):
        """Test that scores are clamped to 0.0-1.0."""
        sample_research.findings[0].relevance_score = 1.5
        sample_research.findings[1].credibility_score = -0.1

        processor = FormattingProcessor()
        result = await processor.process(sample_research)

        assert result.findings[0].relevance_score == 1.0
        assert result.findings[1].credibility_score == 0.0

    @pytest.mark.asyncio
    async def test_generates_summary(self, sample_research):
        """Test that summary is generated if missing."""
        sample_research.summary = None
        processor = FormattingProcessor()
        result = await processor.process(sample_research)

        assert result.summary is not None
        assert "AI trends" in result.summary
        assert "4" in result.summary  # Number of findings

    def test_to_json_serialization(self, sample_research):
        """Test JSON serialization."""
        processor = FormattingProcessor()
        json_str = processor.to_json(sample_research)

        # Parse and validate structure
        data = json.loads(json_str)
        assert data["topic"] == "AI trends"
        assert len(data["findings"]) == 4
        assert "scores" in data["findings"][0]
        assert "combined" in data["findings"][0]["scores"]

    def test_json_score_rounding(self, sample_research):
        """Test that scores are rounded to 3 decimals in JSON."""
        processor = FormattingProcessor()
        json_str = processor.to_json(sample_research)
        data = json.loads(json_str)

        # Check rounding
        finding = data["findings"][0]
        relevance = finding["scores"]["relevance"]
        assert isinstance(relevance, float)
        # Should be 3 decimal places
        assert len(str(relevance).split(".")[-1]) <= 3


class TestProcessingOrchestrator:
    """Tests for processing orchestrator."""

    @pytest.mark.asyncio
    async def test_complete_pipeline(self, sample_research):
        """Test that pipeline runs all stages."""
        orchestrator = ProcessingOrchestrator(
            similarity_threshold=0.9,
            max_results=20,
            min_score=0.0
        )
        result = await orchestrator.process(sample_research)

        # Should have deduplicated (3 items), ranked, and formatted
        assert len(result.findings) == 3
        assert result.summary is not None
        # Should be sorted by score
        scores = [f.combined_score for f in result.findings]
        assert scores == sorted(scores, reverse=True)

    @pytest.mark.asyncio
    async def test_pipeline_with_filtering(self, sample_research):
        """Test pipeline with min score filtering."""
        orchestrator = ProcessingOrchestrator(
            max_results=20,
            min_score=0.5
        )
        result = await orchestrator.process(sample_research)

        # All results should be above min score
        for finding in result.findings:
            assert finding.combined_score >= 0.5

    @pytest.mark.asyncio
    async def test_pipeline_respects_max_results(self, sample_research):
        """Test that pipeline limits to max_results."""
        orchestrator = ProcessingOrchestrator(max_results=2)
        result = await orchestrator.process(sample_research)

        assert len(result.findings) <= 2

    def test_orchestrator_to_json(self, sample_research):
        """Test JSON export via orchestrator."""
        orchestrator = ProcessingOrchestrator()
        json_str = orchestrator.to_json(sample_research)

        data = json.loads(json_str)
        assert "topic" in data
        assert "findings" in data
        assert len(data["findings"]) == len(sample_research.findings)
