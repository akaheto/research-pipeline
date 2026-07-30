"""Deduplication processor for findings."""

from difflib import SequenceMatcher
from research_pipeline.processors.base import BaseProcessor
from research_pipeline.models import Research


class DeduplicationProcessor(BaseProcessor):
    """Removes duplicate or near-duplicate findings."""

    def __init__(self, similarity_threshold: float = 0.85):
        """
        Initialize deduplicator.

        Args:
            similarity_threshold: 0.0-1.0, similarity score to consider duplicates
        """
        self.similarity_threshold = similarity_threshold

    async def process(self, research: Research) -> Research:
        """Deduplicate findings, keeping highest-scoring variants."""
        deduplicated = []
        seen_texts = []

        for finding in sorted(research.findings, key=lambda f: f.combined_score, reverse=True):
            is_duplicate = False
            for seen_text in seen_texts:
                similarity = self._text_similarity(finding.text, seen_text)
                if similarity >= self.similarity_threshold:
                    is_duplicate = True
                    break

            if not is_duplicate:
                deduplicated.append(finding)
                seen_texts.append(finding.text)

        research.findings = deduplicated
        return research

    @staticmethod
    def _text_similarity(text1: str, text2: str) -> float:
        """Calculate text similarity ratio (0.0-1.0)."""
        return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
