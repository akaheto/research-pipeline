"""Data models for research pipeline."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class Source(BaseModel):
    """A source for research findings."""
    url: str
    title: str
    domain: str
    retrieved_at: datetime = Field(default_factory=datetime.utcnow)


class Finding(BaseModel):
    """A single research finding with context."""
    text: str
    source: Source
    relevance_score: float = Field(ge=0.0, le=1.0)
    credibility_score: float = Field(ge=0.0, le=1.0)
    recency_score: float = Field(ge=0.0, le=1.0)

    @property
    def combined_score(self) -> float:
        """Weighted combined score for ranking."""
        return (self.relevance_score * 0.5 +
                self.credibility_score * 0.3 +
                self.recency_score * 0.2)


class Research(BaseModel):
    """A complete research output with findings and metadata."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    topic: str
    findings: list[Finding]
    summary: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PipelineConfig(BaseModel):
    """Configuration for pipeline execution."""
    topic: str
    output_format: str = "docx"  # "docx" or "markdown"
    output_path: str
    max_results: int = 20
