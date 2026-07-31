"""Perplexity API collector for real-time web research."""

import asyncio
import json
from datetime import datetime
from typing import Optional

import requests

from research_pipeline.collectors.base import BaseCollector
from research_pipeline.models import Finding, Source
from research_pipeline.config import Config


class PerplexityCollector(BaseCollector):
    """Collects research findings via Perplexity API."""

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        """
        Initialize Perplexity collector.

        Args:
            api_key: Perplexity API key (defaults to env var PERPLEXITY_API_KEY)
            base_url: Perplexity API base URL (defaults to https://api.perplexity.ai/v1)
        """
        self.api_key = api_key or Config.PERPLEXITY_API_KEY
        self.base_url = base_url or "https://api.perplexity.ai/v1"
        self.model = "pplx-70b-online"

        if not self.api_key:
            raise ValueError("PERPLEXITY_API_KEY not set in environment or constructor")

    async def validate_connection(self) -> bool:
        """Validate connection to Perplexity API."""
        try:
            result = await asyncio.to_thread(self._test_connection)
            return result
        except Exception as e:
            print(f"❌ Perplexity connection failed: {e}")
            return False

    def _test_connection(self) -> bool:
        """Test connection (runs in thread)."""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": "test"}],
                    "max_tokens": 10,
                },
                timeout=10,
            )
            return response.status_code == 200
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
                self._query_perplexity, query, max_results
            )
            return findings
        except Exception as e:
            print(f"❌ Perplexity query failed: {e}")
            return []

    def _query_perplexity(self, query: str, max_results: int) -> list[Finding]:
        """Query Perplexity API (runs in thread)."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        system_prompt = f"""You are a research assistant. Research the query thoroughly and provide findings as a JSON array.
Each finding should have:
- text: The research finding or insight
- source_url: URL where found
- source_title: Source name/title
- source_domain: Domain
- relevance: 0.0-1.0 relevance score
- credibility: 0.0-1.0 credibility score

Return ONLY valid JSON, no markdown. Limit to {max_results} findings."""

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Research this topic: {query}"},
                    ],
                    "max_tokens": 2000,
                },
                timeout=30,
            )

            if response.status_code != 200:
                print(f"❌ Perplexity API error: {response.status_code}")
                return []

            data = response.json()
            response_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

            findings = []
            try:
                # Parse JSON from response
                json_data = json.loads(response_text)
                if not isinstance(json_data, list):
                    json_data = [json_data]

                for item in json_data[:max_results]:
                    source = Source(
                        url=item.get("source_url", ""),
                        title=item.get("source_title", "Unknown"),
                        domain=item.get("source_domain", ""),
                        retrieved_at=datetime.utcnow(),
                    )
                    finding = Finding(
                        text=item.get("text", ""),
                        source=source,
                        relevance_score=float(item.get("relevance", 0.5)),
                        credibility_score=float(item.get("credibility", 0.7)),
                        recency_score=0.8,
                    )
                    findings.append(finding)

            except (json.JSONDecodeError, KeyError, ValueError) as e:
                print(f"⚠️  Could not parse Perplexity response: {e}")

            return findings

        except requests.RequestException as e:
            print(f"❌ Perplexity request failed: {e}")
            return []
