"""Configuration management for the research pipeline."""

import os
from pathlib import Path


class Config:
    """Pipeline configuration from environment variables."""

    # API Keys
    PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

    # API Endpoints
    PERPLEXITY_API_BASE_URL = os.getenv("PERPLEXITY_API_BASE_URL", "https://api.perplexity.ai/v1")
    PROJECT_10_MCP_URL = os.getenv("PROJECT_10_MCP_URL", "http://localhost:3002")

    # Output paths
    OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "./output"))
    TEMP_DIR = Path(os.getenv("TEMP_DIR", "./tmp"))

    # Pipeline defaults
    DEFAULT_MAX_RESULTS = int(os.getenv("DEFAULT_MAX_RESULTS", 20))
    DEFAULT_OUTPUT_FORMAT = os.getenv("DEFAULT_OUTPUT_FORMAT", "docx")

    # Scoring weights
    RELEVANCE_WEIGHT = float(os.getenv("RELEVANCE_WEIGHT", 0.5))
    CREDIBILITY_WEIGHT = float(os.getenv("CREDIBILITY_WEIGHT", 0.3))
    RECENCY_WEIGHT = float(os.getenv("RECENCY_WEIGHT", 0.2))

    @classmethod
    def validate(cls) -> bool:
        """Validate required configuration."""
        required = ["ANTHROPIC_API_KEY"]
        missing = [key for key in required if not getattr(cls, key)]
        if missing:
            raise ValueError(f"Missing required config: {', '.join(missing)}")
        return True

    @classmethod
    def ensure_dirs(cls) -> None:
        """Create necessary directories."""
        cls.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        cls.TEMP_DIR.mkdir(parents=True, exist_ok=True)


def get_config() -> Config:
    """Get configuration instance with validation."""
    Config.validate()
    Config.ensure_dirs()
    return Config
