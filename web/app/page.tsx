"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

interface Finding {
  text: string;
  source: {
    url: string;
    title: string;
    domain: string;
    retrieved_at: string;
  };
  scores: {
    relevance: number;
    credibility: number;
    recency: number;
    combined: number;
  };
}

interface Research {
  topic: string;
  findings: Finding[];
  summary: string;
  knowledge_base_insights: string[];
}

interface SearchHistory {
  id: string;
  topic: string;
  timestamp: number;
  data: Research;
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Research | null>(null);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [maxResults, setMaxResults] = useState(20);
  const [includeKB, setIncludeKB] = useState(true);
  const [similarity, setSimilarity] = useState(0.85);
  const [minScore, setMinScore] = useState(0);
  const [error, setError] = useState("");

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("researchHistory");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem("researchHistory", JSON.stringify(history));
  }, [history]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          max_results: maxResults,
          include_knowledge_base: includeKB,
          similarity_threshold: similarity,
          min_score: minScore,
        }),
      });

      if (!response.ok) {
        throw new Error("Research failed. Make sure ANTHROPIC_API_KEY is set.");
      }

      const data = await response.json();
      setResult(data);

      // Add to history
      const newEntry: SearchHistory = {
        id: Date.now().toString(),
        topic,
        timestamp: Date.now(),
        data,
      };
      setHistory([newEntry, ...history.slice(0, 19)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistory = (entry: SearchHistory) => {
    setResult(entry.data);
    setTopic(entry.topic);
  };

  const handleDownload = async (format: "docx" | "markdown") => {
    if (!result) return;

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, format }),
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result.topic.replace(/\s+/g, "_")}.${format === "docx" ? "docx" : "md"}`;
      a.click();
    } catch (err) {
      setError("Download failed");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🔬 Research Pipeline</h1>
        <p>Real-time web + knowledge base research</p>
      </header>

      <main className={styles.main}>
        {/* Search Form */}
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a research topic..."
            className={styles.input}
            disabled={loading}
          />
          <button
            type="submit"
            className={styles.button}
            disabled={loading || !topic.trim()}
          >
            {loading ? "Researching..." : "Search"}
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={styles.settingsButton}
          >
            ⚙️
          </button>
        </form>

        {error && <div className={styles.error}>{error}</div>}

        {/* Settings Panel */}
        {showSettings && (
          <div className={styles.settings}>
            <h3>Settings</h3>
            <label>
              Max Results: <strong>{maxResults}</strong>
              <input
                type="range"
                min="5"
                max="50"
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
              />
            </label>

            <label>
              Similarity Threshold: <strong>{similarity.toFixed(2)}</strong>
              <input
                type="range"
                min="0.7"
                max="0.99"
                step="0.05"
                value={similarity}
                onChange={(e) => setSimilarity(Number(e.target.value))}
              />
            </label>

            <label>
              Min Quality Score: <strong>{minScore.toFixed(1)}</strong>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
              />
            </label>

            <label>
              <input
                type="checkbox"
                checked={includeKB}
                onChange={(e) => setIncludeKB(e.target.checked)}
              />
              Include Knowledge Base
            </label>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className={styles.results}>
            <div className={styles.header2}>
              <h2>{result.topic}</h2>
              <div className={styles.downloadButtons}>
                <button onClick={() => handleDownload("markdown")} className={styles.downloadBtn}>
                  📝 Markdown
                </button>
                <button onClick={() => handleDownload("docx")} className={styles.downloadBtn}>
                  📄 Word
                </button>
              </div>
            </div>

            {result.summary && (
              <div className={styles.summary}>
                <h3>Summary</h3>
                <p>{result.summary}</p>
              </div>
            )}

            {result.knowledge_base_insights.length > 0 && (
              <div className={styles.insights}>
                <h3>📚 Knowledge Base Insights</h3>
                <ul>
                  {result.knowledge_base_insights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.findings}>
              <h3>Key Findings ({result.findings.length})</h3>
              {result.findings.map((finding, i) => (
                <div key={i} className={styles.finding}>
                  <div className={styles.findingContent}>
                    <p className={styles.findingText}>{finding.text}</p>
                    <div className={styles.scoreBar}>
                      <div
                        className={styles.scoreIndicator}
                        style={{ width: `${finding.scores.combined * 100}%` }}
                      />
                    </div>
                    <div className={styles.scores}>
                      <span>Relevance: {(finding.scores.relevance * 100).toFixed(0)}%</span>
                      <span>Credibility: {(finding.scores.credibility * 100).toFixed(0)}%</span>
                      <span>Recency: {(finding.scores.recency * 100).toFixed(0)}%</span>
                      <span className={styles.combined}>
                        Combined: {(finding.scores.combined * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className={styles.source}>
                    <a href={finding.source.url} target="_blank" rel="noopener noreferrer">
                      {finding.source.title}
                    </a>
                    <p>{finding.source.domain}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && !result && (
          <div className={styles.history}>
            <h3>📜 Recent Searches</h3>
            <div className={styles.historyList}>
              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleLoadHistory(entry)}
                  className={styles.historyItem}
                >
                  <span className={styles.historyTopic}>{entry.topic}</span>
                  <span className={styles.historyDate}>
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                  <span className={styles.historyCount}>{entry.data.findings.length} findings</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>Research Pipeline • Powered by AI</p>
      </footer>
    </div>
  );
}
