"""Tests for data models."""

from datetime import datetime
from research_pipeline.models import Source, Finding, Research


def test_finding_combined_score():
    """Test that Finding.combined_score computes correctly."""
    source = Source(
        url="https://example.com",
        title="Example",
        domain="example.com"
    )
    finding = Finding(
        text="Test finding",
        source=source,
        relevance_score=1.0,
        credibility_score=0.8,
        recency_score=0.6
    )
    # 1.0 * 0.5 + 0.8 * 0.3 + 0.6 * 0.2 = 0.5 + 0.24 + 0.12 = 0.86
    assert abs(finding.combined_score - 0.86) < 0.001


def test_research_creation():
    """Test that Research can be created with findings."""
    source = Source(
        url="https://example.com",
        title="Example",
        domain="example.com"
    )
    finding = Finding(
        text="Test",
        source=source,
        relevance_score=1.0,
        credibility_score=1.0,
        recency_score=1.0
    )
    research = Research(topic="Test topic", findings=[finding])
    assert research.topic == "Test topic"
    assert len(research.findings) == 1
