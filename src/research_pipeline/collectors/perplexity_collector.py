"""Perplexity MCP collector for real-time web research."""

import asyncio
import json
from datetime import datetime
from typing import Optional

from research_pipeline.collectors.base import BaseCollector
from research_pipeline.models import Finding, Source
from research_pipeline.config import Config


class PerplexityCollector(BaseCollector):
    """Collects research findings via Perplexity MCP server."""

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        """
        Initialize Perplexity collector.

        Args:
            api_key: Perplexity API key (defaults to env var PERPLEXITY_API_KEY)
            base_url: MCP server URL (defaults to env var PERPLEXITY_MCP_URL)
        """
        self.api_key = api_key or Config.PERPLEXITY_API_KEY
        self.base_url = base_url or Config.PERPLEXITY_MCP_URL
        self._client = None

        if not self.api_key:
            raise ValueError("PERPLEXITY_API_KEY not set in environment or constructor")

    async def _get_client(self):
        """Lazy initialize the Anthropic client (handles MCP)."""
        if not self._client:
            from anthropic import Anthropic
            self._client = Anthropic(api_key=self.api_key)
        return self._client

    async def validate_connection(self) -> bool:
        """Validate connection to Perplexity MCP."""
        try:
            # Try a simple test query to verify connectivity
            result = await asyncio.to_thread(
                self._test_connection
            )
            return result
        except Exception as e:
            print(f"❌ Perplexity connection failed: {e}")
            return False

    def _test_connection(self) -> bool:
        """Test connection (runs in thread)."""
        try:
            client = Anthropic(api_key=self.api_key)
            # A minimal test message to verify the API key works
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=10,
                messages=[{"role": "user", "content": "hi"}],
            )
            return bool(response.content)
        except Exception:
            return False

    async def collect(self, query: str, max_results: int = 20) -> list[Finding]:
        """
        Collect research findings from Perplexity.

        Args:
            query: Research topic/query string
            max_results: Maximum number of findings to return

        Returns:
            List of Finding objects with sources and scores
        """
        try:
            findings = await asyncio.to_thread(
                self._query_perplexity,
                query,
                max_results
            )
            return findings
        except Exception as e:
            print(f"❌ Perplexity query failed: {e}")
            return []

    def _query_perplexity(self, query: str, max_results: int) -> list[Finding]:
        """Query Perplexity via Anthropic client (runs in thread)."""
        client = Anthropic(api_key=self.api_key)

        system_prompt = f"""You are a research assistant. For the given query, provide research findings as a JSON array.
Each finding should have:
- text: The finding/fact
- source_url: URL where this was found (if available)
- source_title: Title or name of the source
- source_domain: Domain of the source
- relevance: 0.0-1.0 score for relevance to query
- credibility: 0.0-1.0 score for source credibility

Return ONLY valid JSON, no markdown or extra text.
Limit to {max_results} most relevant findings."""

        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": f"Research query: {query}"
                }
            ]
        )

        findings = []
        try:
            # Extract JSON from response
            response_text = response.content[0].text
            data = json.loads(response_text)

            if not isinstance(data, list):
                data = [data]

            for item in data[:max_results]:
                source = Source(
                    url=item.get("source_url", ""),
                    title=item.get("source_title", "Unknown"),
                    domain=item.get("source_domain", ""),
                    retrieved_at=datetime.utcnow()
                )
                finding = Finding(
                    text=item.get("text", ""),
                    source=source,
                    relevance_score=float(item.get("relevance", 0.5)),
                    credibility_score=float(item.get("credibility", 0.7)),
                    recency_score=0.8  # Default; could be improved with date parsing
                )
                findings.append(finding)

        except (json.JSONDecodeError, KeyError, ValueError) as e:
            print(f"⚠️  Could not parse Perplexity response: {e}")

        return findings
