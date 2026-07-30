"""Project 10 knowledge system collector for contextual reference."""

import asyncio
import json
from datetime import datetime
from typing import Optional

from research_pipeline.collectors.base import BaseCollector
from research_pipeline.models import Finding, Source
from research_pipeline.config import Config


class Project10Collector(BaseCollector):
    """Collects contextual knowledge from Project 10 knowledge system via MCP."""

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        """
        Initialize Project 10 collector.

        Args:
            api_key: Project 10 API key (from ANTHROPIC_API_KEY or PROJECT_10_API_KEY)
            base_url: MCP server URL (defaults to env var PROJECT_10_MCP_URL)
        """
        self.api_key = api_key or Config.ANTHROPIC_API_KEY
        self.base_url = base_url or Config.PROJECT_10_MCP_URL
        self._client = None

        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not set in environment or constructor")

    async def _get_client(self):
        """Lazy initialize the Anthropic client (handles MCP)."""
        if not self._client:
            from anthropic import Anthropic
            self._client = Anthropic(api_key=self.api_key)
        return self._client

    async def validate_connection(self) -> bool:
        """Validate connection to Project 10 MCP."""
        try:
            result = await asyncio.to_thread(
                self._test_connection
            )
            return result
        except Exception as e:
            print(f"❌ Project 10 connection failed: {e}")
            return False

    def _test_connection(self) -> bool:
        """Test connection (runs in thread)."""
        try:
            client = Anthropic(api_key=self.api_key)
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=10,
                messages=[{"role": "user", "content": "test"}],
            )
            return bool(response.content)
        except Exception:
            return False

    async def collect(self, query: str, max_results: int = 10) -> list[Finding]:
        """
        Collect contextual knowledge from Project 10.

        Args:
            query: Research topic/query string
            max_results: Maximum number of findings to return

        Returns:
            List of Finding objects from knowledge base
        """
        try:
            findings = await asyncio.to_thread(
                self._query_knowledge_base,
                query,
                max_results
            )
            return findings
        except Exception as e:
            print(f"❌ Project 10 query failed: {e}")
            return []

    def _query_knowledge_base(self, query: str, max_results: int) -> list[Finding]:
        """Query Project 10 knowledge base (runs in thread)."""
        client = Anthropic(api_key=self.api_key)

        system_prompt = f"""You are a knowledge assistant. Search the Project 10 knowledge base for information relevant to the query.
Return findings as a JSON array. Each item should have:
- text: The knowledge/insight from the base
- source_title: Title or document name in knowledge base
- source_domain: "project-10-kb" (constant)
- relevance: 0.0-1.0 relevance to query
- credibility: 1.0 (internal knowledge trusted)

Return ONLY valid JSON, no markdown.
Limit to {max_results} most relevant items."""

        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": f"Query Project 10 knowledge base for: {query}"
                }
            ]
        )

        findings = []
        try:
            response_text = response.content[0].text
            data = json.loads(response_text)

            if not isinstance(data, list):
                data = [data]

            for item in data[:max_results]:
                source = Source(
                    url=f"project-10://knowledge-base/{item.get('source_title', 'unknown').lower().replace(' ', '-')}",
                    title=item.get("source_title", "Project 10 Knowledge"),
                    domain=item.get("source_domain", "project-10-kb"),
                    retrieved_at=datetime.utcnow()
                )
                finding = Finding(
                    text=item.get("text", ""),
                    source=source,
                    relevance_score=float(item.get("relevance", 0.7)),
                    credibility_score=float(item.get("credibility", 1.0)),
                    recency_score=0.9  # Internal knowledge usually recent
                )
                findings.append(finding)

        except (json.JSONDecodeError, KeyError, ValueError) as e:
            print(f"⚠️  Could not parse Project 10 response: {e}")

        return findings
