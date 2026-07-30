"""Base reporter interface."""

from abc import ABC, abstractmethod
from pathlib import Path
from research_pipeline.models import Research


class BaseReporter(ABC):
    """Abstract base for report generators."""

    @abstractmethod
    async def generate(self, research: Research, output_path: Path) -> Path:
        """Generate report and save to output_path. Returns the written path."""
        pass
