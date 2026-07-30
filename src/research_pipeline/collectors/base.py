"""Base collector interface."""

from abc import ABC, abstractmethod
from research_pipeline.models import Finding


class BaseCollector(ABC):
    """Abstract base for data collectors."""

    @abstractmethod
    async def collect(self, query: str) -> list[Finding]:
        """Collect findings for a query. Returns list of Finding objects."""
        pass

    @abstractmethod
    async def validate_connection(self) -> bool:
        """Validate that the collector can connect to its source."""
        pass
