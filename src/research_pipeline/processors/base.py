"""Base processor interface."""

from abc import ABC, abstractmethod
from research_pipeline.models import Research


class BaseProcessor(ABC):
    """Abstract base for data processors."""

    @abstractmethod
    async def process(self, research: Research) -> Research:
        """Process research data. Returns modified Research object."""
        pass
