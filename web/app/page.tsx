"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { getSearchAnalytics, getTimeAgo } from "@/lib/analytics";
import { deduplicateFindings } from "@/lib/deduplication";
import { frameworks } from "@/lib/frameworks";
import { extractCitations, aggregateSources, detectContradictions, getCredibilityColor, getCredibilityLabel } from "@/lib/sources";
import { aggregateClaims, detectConflicts, getClaimConfidence, getConfidenceColor } from "@/lib/claims";

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
  synthesis?: string;
  method?: "perplexity-only" | "perplexity-claude" | "framework-synthesis" | "multi-search-synthesis";
  framework?: string;
  frameworkId?: string;
  searchCount?: number;
  searches?: any[];
  cost?: any;
  created_at?: string;
}

interface SearchHistory {
  id: string;
  topic: string;
  timestamp: number;
  findingsCount: number;
  data: Research;
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [result, setResult] = useState<Research | null>(null);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [maxResults, setMaxResults] = useState(20);
  const [similarity, setSimilarity] = useState(0.85);
  const [minScore, setMinScore] = useState(0);
  const [citationFormat, setCitationFormat] = useState<"none" | "apa" | "mla" | "chicago">("none");
  const [showGrouped, setShowGrouped] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [supabaseHistory, setSupabaseHistory] = useState<any[]>([]);
  const [matrixView, setMatrixView] = useState(true);
  const [showFrameworks, setShowFrameworks] = useState(false);
  const [selectedHistoryItems, setSelectedHistoryItems] = useState<Set<string>>(new Set());
  const [synthesisMode, setSynthesisMode] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [sources, setSources] = useState<any>(null);
  const [contradictions, setContradictions] = useState<any[]>([]);
  const [showClaims, setShowClaims] = useState(false);
  const [claims, setClaims] = useState<any[]>([]);
  const [claimConflicts, setClaimConflicts] = useState<any[]>([]);

  // Load history from Supabase on mount
  useEffect(() => {
    fetchSupabaseHistory();
  }, []);

  const fetchSupabaseHistory = async () => {
    try {
      const res = await fetch("/api/research-history/get");
      if (res.ok) {
        const data = await res.json();
        setSupabaseHistory(data);
      }
    } catch (e) {
      console.log("Failed to load history");
    }
  };

  const deleteFromHistory = async (id: string) => {
    try {
      const res = await fetch(`/api/research-history/delete?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSupabaseHistory(supabaseHistory.filter((item) => item.id !== id));
      }
    } catch (e) {
      console.log("Failed to delete");
    }
  };

  const loadFromHistory = (item: any) => {
    setTopic(item.topic);
    setResult(item);
    setShowHistory(false);
  };

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("researchHistory");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem("researchHistory", JSON.stringify(history));
  }, [history]);

  // Extract and analyze sources when result changes
  useEffect(() => {
    if (result && result.synthesis) {
      const extractedSources = aggregateSources([
        { topic: result.topic, content: result.synthesis },
      ]);
      setSources(extractedSources);

      const foundContradictions = detectContradictions(extractedSources);
      setContradictions(foundContradictions);

      // Extract claims
      const extractedClaims = aggregateClaims([
        { topic: result.topic, content: result.synthesis },
      ]);
      setClaims(extractedClaims);

      const foundConflicts = detectConflicts(extractedClaims);
      setClaimConflicts(foundConflicts);
    }
  }, [result]);

  const handleSearch = async (e: React.FormEvent, researchMethod: "perplexity-only" | "perplexity-claude" = "perplexity-claude") => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setProgress("");
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          researchMethod,
          max_results: maxResults,
          similarity_threshold: similarity,
          min_score: minScore,
        }),
      });

      if (!response.ok) {
        throw new Error("Research failed. Make sure ANTHROPIC_API_KEY is set.");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is empty");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7);
            const dataLine = lines[lines.indexOf(line) + 1];

            if (dataLine?.startsWith("data: ")) {
              const data = JSON.parse(dataLine.slice(6));

              if (eventType === "progress") {
                setProgress(data.message);
              } else if (eventType === "complete") {
                setResult(data);
                const newEntry: SearchHistory = {
                  id: Date.now().toString(),
                  topic,
                  timestamp: Date.now(),
                  findingsCount: data.findings.length,
                  data,
                };
                setHistory([newEntry, ...history.slice(0, 19)]);
              } else if (eventType === "error") {
                setError(data.message);
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const handleLoadHistory = (entry: SearchHistory) => {
    setResult(entry.data);
    setTopic(entry.topic);
  };

  const toggleHistorySelection = (id: string) => {
    const newSelected = new Set(selectedHistoryItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedHistoryItems(newSelected);
  };

  const handleSynthesizeSelected = async () => {
    if (selectedHistoryItems.size < 2) {
      setError("Select at least 2 searches to synthesize");
      return;
    }

    setLoading(true);
    setProgress("");
    setError("");
    setResult(null);
    setSynthesisMode(false);

    try {
      const selectedSearches = supabaseHistory.filter((item) =>
        selectedHistoryItems.has(item.id)
      );

      const response = await fetch("/api/synthesis/combine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searches: selectedSearches,
          title: `Synthesis: ${selectedSearches.map((s) => s.topic).join(" + ")}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Synthesis failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is empty");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7);
            const dataLine = lines[lines.indexOf(line) + 1];

            if (dataLine?.startsWith("data: ")) {
              const data = JSON.parse(dataLine.slice(6));

              if (eventType === "progress") {
                setProgress(data.message);
              } else if (eventType === "complete") {
                setResult(data);
                setSelectedHistoryItems(new Set());
              } else if (eventType === "error") {
                setError(data.message);
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const handleRunFramework = async (frameworkId: string) => {
    if (!topic.trim()) return;

    setLoading(true);
    setProgress("");
    setError("");
    setResult(null);
    setShowFrameworks(false);

    try {
      const response = await fetch("/api/frameworks/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, frameworkId }),
      });

      if (!response.ok) {
        throw new Error("Framework execution failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is empty");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7);
            const dataLine = lines[lines.indexOf(line) + 1];

            if (dataLine?.startsWith("data: ")) {
              const data = JSON.parse(dataLine.slice(6));

              if (eventType === "progress") {
                setProgress(data.message);
              } else if (eventType === "complete") {
                setResult(data);
                const newEntry: SearchHistory = {
                  id: Date.now().toString(),
                  topic,
                  timestamp: Date.now(),
                  findingsCount: data.findings.length,
                  data,
                };
                setHistory([newEntry, ...history.slice(0, 19)]);
              } else if (eventType === "error") {
                setError(data.message);
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const loadDebugInfo = async () => {
    setDebugLoading(true);
    try {
      const response = await fetch("/api/debug");
      const data = await response.json();
      setDebugInfo(data);
    } catch (err) {
      setDebugInfo({ error: err instanceof Error ? err.message : "Failed to load debug info" });
    } finally {
      setDebugLoading(false);
    }
  };

  const handleDownload = async (format: "docx" | "markdown" | "pdf") => {
    if (!result) return;

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, format, citationFormat }),
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      if (format === "pdf") {
        // For PDF, open in browser first then print
        const pdfWindow = window.open(url);
        if (pdfWindow) {
          pdfWindow.addEventListener("load", () => {
            pdfWindow.print();
          });
        }
      } else {
        a.download = `${result.topic.replace(/\s+/g, "_")}.${format === "docx" ? "docx" : "md"}`;
        a.click();
      }
    } catch (err) {
      setError("Download failed");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🔬 Research Pipeline</h1>
        <p>Real-time web research powered by Perplexity</p>
      </header>

      <main className={styles.main}>
        {/* Search Form */}
        <form onSubmit={(e) => handleSearch(e, "perplexity-claude")} className={styles.searchForm}>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a research topic..."
            className={styles.input}
            disabled={loading}
          />
          <div className={styles.buttonGroup}>
            <button
              type="submit"
              className={styles.button}
              disabled={loading || !topic.trim()}
              title="Perplexity researches, Claude evaluates and synthesizes"
            >
              {loading ? "Researching..." : "🔬 Perplexity + Claude"}
            </button>
            <button
              type="button"
              className={styles.button}
              disabled={loading || !topic.trim()}
              onClick={(e) => handleSearch(e as any, "perplexity-only")}
              title="Use Perplexity's native research format directly"
            >
              {loading ? "Researching..." : "📰 Perplexity Only"}
            </button>
            <button
              type="button"
              className={styles.button}
              disabled={loading || !topic.trim()}
              onClick={() => setShowFrameworks(true)}
              title="Run a research framework with multiple focused searches"
            >
              {loading ? "Researching..." : "🎯 Frameworks"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={styles.settingsButton}
          >
            ⚙️
          </button>
          <button
            type="button"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={styles.settingsButton}
            title="Analytics"
          >
            📊
          </button>
          <button
            type="button"
            onClick={() => {
              setShowDebug(true);
              loadDebugInfo();
            }}
            className={styles.settingsButton}
            title="Debug Info"
          >
            🔧
          </button>
          <button
            type="button"
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) fetchSupabaseHistory();
            }}
            className={styles.settingsButton}
            title="Research History"
          >
            📚
          </button>
        </form>

        {error && <div className={styles.error}>{error}</div>}

        {/* Progress Display */}
        {loading && progress && (
          <div className={styles.progress}>
            <div className={styles.progressSpinner} />
            <p>{progress}</p>
          </div>
        )}

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
          </div>
        )}

        {/* Analytics Modal */}
        {showAnalytics && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>📊 Search Analytics</h3>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className={styles.modalClose}
                >
                  ✕
                </button>
              </div>

              {history.length === 0 ? (
                <p className={styles.emptyState}>Start searching to see analytics</p>
              ) : (
                <>
                  {(() => {
                    const analytics = getSearchAnalytics(
                      history.map((h) => ({
                        topic: h.topic,
                        timestamp: h.timestamp,
                        findingsCount: h.findingsCount,
                      }))
                    );

                    return (
                      <>
                        <div className={styles.analyticsStats}>
                          <div className={styles.stat}>
                            <div className={styles.statValue}>{analytics.totalSearches}</div>
                            <div className={styles.statLabel}>Total Searches</div>
                          </div>
                          <div className={styles.stat}>
                            <div className={styles.statValue}>{analytics.uniqueTopics}</div>
                            <div className={styles.statLabel}>Unique Topics</div>
                          </div>
                        </div>

                        {analytics.trending.length > 0 && (
                          <div className={styles.analyticsSection}>
                            <h4>🔥 Trending Topics</h4>
                            <ul className={styles.analyticsList}>
                              {analytics.trending.map((item, i) => (
                                <li key={i}>
                                  <span className={styles.trendingTopic}>{item.topic}</span>
                                  <span className={styles.trendingCount}>{item.count}x</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analytics.topSearches.length > 0 && (
                          <div className={styles.analyticsSection}>
                            <h4>⭐ Top Searches</h4>
                            <ul className={styles.analyticsList}>
                              {analytics.topSearches.map((item, i) => (
                                <li key={i}>
                                  <span className={styles.trendingTopic}>{item.topic}</span>
                                  <span className={styles.trendingCount}>{item.count}x</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analytics.recentActivity.length > 0 && (
                          <div className={styles.analyticsSection}>
                            <h4>📅 Recent Activity</h4>
                            <ul className={styles.analyticsList}>
                              {analytics.recentActivity.map((item, i) => (
                                <li key={i} className={styles.activityItem}>
                                  <span className={styles.activityTopic}>{item.topic}</span>
                                  <span className={styles.activityMeta}>
                                    {item.findings} findings • {getTimeAgo(item.timestamp)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        )}

        {/* History Panel */}
        {showHistory && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>📚 Research History</h3>
                {selectedHistoryItems.size > 0 && (
                  <div className={styles.synthesisControls}>
                    <span className={styles.selectionCount}>{selectedHistoryItems.size} selected</span>
                    {selectedHistoryItems.size >= 2 && (
                      <button
                        className={styles.synthesizeButton}
                        onClick={handleSynthesizeSelected}
                        disabled={loading}
                        title="Synthesize selected searches"
                      >
                        ✨ Synthesize
                      </button>
                    )}
                  </div>
                )}
                <button onClick={() => setShowHistory(false)} className={styles.modalClose}>
                  ✕
                </button>
              </div>

              {supabaseHistory.length === 0 ? (
                <p className={styles.emptyState}>No saved research yet</p>
              ) : (
                <div className={styles.historyList}>
                  {supabaseHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`${styles.historyItem} ${selectedHistoryItems.has(item.id) ? styles.historyItemSelected : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedHistoryItems.has(item.id)}
                        onChange={() => toggleHistorySelection(item.id)}
                        className={styles.historyCheckbox}
                      />
                      <div
                        className={styles.historyItemContent}
                        onClick={() => !synthesisMode && loadFromHistory(item)}
                        style={{ cursor: synthesisMode ? "default" : "pointer" }}
                      >
                        <h4>{item.topic}</h4>
                        <p className={styles.historyMeta}>
                          {item.method === "perplexity-claude" ? "🔬 P+C" : item.method === "framework-synthesis" ? "🎯 Framework" : "📰 P"} •{" "}
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        className={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFromHistory(item.id);
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Frameworks Modal */}
        {showFrameworks && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>🎯 Research Frameworks</h3>
                <button onClick={() => setShowFrameworks(false)} className={styles.modalClose}>
                  ✕
                </button>
              </div>

              <div className={styles.frameworksGrid}>
                {frameworks.map((fw) => (
                  <div
                    key={fw.id}
                    className={styles.frameworkCard}
                    onClick={() => handleRunFramework(fw.id)}
                  >
                    <div className={styles.frameworkIcon}>{fw.icon}</div>
                    <h4>{fw.name}</h4>
                    <p>{fw.description}</p>
                    <div className={styles.frameworkQueries}>
                      <small>{fw.queries.length} focused searches</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sources Evaluation Panel */}
        {showSources && sources && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>📚 Sources & Credibility</h3>
                {contradictions.length > 0 && (
                  <span className={styles.contradictionBadge}>⚠️ {contradictions.length} conflicts</span>
                )}
                <button onClick={() => setShowSources(false)} className={styles.modalClose}>
                  ✕
                </button>
              </div>

              {selectedSource ? (
                <div className={styles.sourceDetail}>
                  <button onClick={() => setSelectedSource(null)} className={styles.backButton}>
                    ← Back to Sources
                  </button>
                  <div className={styles.sourceDetailHeader}>
                    <a href={selectedSource.url} target="_blank" rel="noopener noreferrer" className={styles.sourceTitle}>
                      {selectedSource.title}
                    </a>
                    <span className={styles.sourceDomain}>{selectedSource.domain}</span>
                  </div>

                  <div className={styles.credibilityPanel}>
                    <h4>Credibility Assessment</h4>
                    <div className={styles.credibilityScore}>
                      <div
                        className={styles.credibilityBar}
                        style={{
                          width: `${selectedSource.credibilityScore * 100}%`,
                          backgroundColor: getCredibilityColor(selectedSource.credibilityScore),
                        }}
                      />
                      <span className={styles.credibilityText}>
                        {getCredibilityLabel(selectedSource.credibilityScore)} ({selectedSource.credibilityScore.toFixed(2)})
                      </span>
                    </div>

                    <div className={styles.credibilityFactors}>
                      <div className={styles.factor}>
                        <strong>Domain Reputation:</strong> {(selectedSource.credibilityFactors.domainReputation * 100).toFixed(0)}%
                      </div>
                      <div className={styles.factor}>
                        <strong>Academic Credibility:</strong> {(selectedSource.credibilityFactors.academicCredibility * 100).toFixed(0)}%
                      </div>
                      <div className={styles.factor}>
                        <strong>Authority:</strong> {(selectedSource.credibilityFactors.authoritative * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div className={styles.appearancesPanel}>
                    <h4>Where This Source Appears ({selectedSource.appearances.length})</h4>
                    {selectedSource.appearances.map((appearance: any, i: number) => (
                      <div key={i} className={styles.appearanceItem}>
                        <strong>{appearance.searchTopic}</strong>
                        <p className={styles.context}>{appearance.context}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {contradictions.length > 0 && (
                    <div className={styles.contradictionsPanel}>
                      <h4>⚠️ Potential Conflicts</h4>
                      {contradictions.slice(0, 3).map((conflict: any, i: number) => (
                        <div key={i} className={styles.contradictionItem}>
                          <div className={styles.conflictSources}>
                            <span className={styles.conflictBadge}>{conflict.source1.domain}</span>
                            <span className={styles.conflictVs}>vs</span>
                            <span className={styles.conflictBadge}>{conflict.source2.domain}</span>
                          </div>
                          <p>{conflict.conflictDescription}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.sourcesList}>
                    <h4>All Sources ({Object.keys(sources).length})</h4>
                    {Object.values(sources)
                      .sort((a: any, b: any) => b.credibilityScore - a.credibilityScore)
                      .map((source: any) => (
                        <div
                          key={source.url}
                          className={styles.sourceItem}
                          onClick={() => setSelectedSource(source)}
                        >
                          <div className={styles.sourceItemContent}>
                            <div className={styles.sourceItemTitle}>{source.title}</div>
                            <div className={styles.sourceItemMeta}>
                              {source.domain} • Cited {source.citationCount}x
                            </div>
                          </div>
                          <div
                            className={styles.credibilityBadge}
                            style={{
                              backgroundColor: getCredibilityColor(source.credibilityScore),
                              color: "white",
                            }}
                            title={getCredibilityLabel(source.credibilityScore)}
                          >
                            {(source.credibilityScore * 100).toFixed(0)}%
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Claims Verification Panel */}
        {showClaims && claims.length > 0 && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>🔍 Claim Verification</h3>
                {claimConflicts.length > 0 && (
                  <span className={styles.contradictionBadge}>⚠️ {claimConflicts.length} conflicts</span>
                )}
                <button onClick={() => setShowClaims(false)} className={styles.modalClose}>
                  ✕
                </button>
              </div>

              {claimConflicts.length > 0 && (
                <div className={styles.conflictsPanel}>
                  <h4>⚠️ Conflicting Claims</h4>
                  {claimConflicts.slice(0, 3).map((conflict: any, i: number) => (
                    <div key={i} className={styles.conflictClaimItem}>
                      <div className={styles.claimText}>"{conflict.claim1.text}"</div>
                      <div className={styles.claimVsText}>vs</div>
                      <div className={styles.claimText}>"{conflict.claim2.text}"</div>
                      <p className={styles.conflictReason}>{conflict.reason}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.claimsList}>
                <h4>All Claims ({claims.length})</h4>
                {claims
                  .sort((a: any, b: any) => {
                    const confA = getClaimConfidence(a);
                    const confB = getClaimConfidence(b);
                    const order = { high: 0, medium: 1, low: 2 };
                    return order[confA] - order[confB];
                  })
                  .map((claim: any, i: number) => {
                    const confidence = getClaimConfidence(claim);
                    return (
                      <div key={i} className={styles.claimItem}>
                        <div className={styles.claimItemHeader}>
                          <div
                            className={styles.confidenceBadge}
                            style={{ backgroundColor: getConfidenceColor(confidence) }}
                            title={`Appears ${claim.appearanceCount}x, ${claim.citations.length} citations`}
                          >
                            {confidence.toUpperCase()}
                          </div>
                          <div className={styles.claimItemMeta}>
                            {claim.isSupported ? "✓ Cited" : "✗ Unsupported"} • {claim.appearanceCount} search
                            {claim.appearanceCount !== 1 ? "es" : ""}
                          </div>
                        </div>
                        <p className={styles.claimText}>"{claim.text}"</p>
                        {claim.citations.length > 0 && (
                          <div className={styles.claimCitations}>
                            <small>Sources: {claim.citations.map((c: any) => c.title).join(", ")}</small>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Debug Modal */}
        {showDebug && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>🔧 Diagnostics</h3>
                <button onClick={() => setShowDebug(false)} className={styles.modalClose}>
                  ✕
                </button>
              </div>

              {debugLoading ? (
                <p className={styles.emptyState}>Loading diagnostics...</p>
              ) : debugInfo?.error ? (
                <div className={styles.error}>{debugInfo.error}</div>
              ) : debugInfo ? (
                <div className={styles.debugContent}>
                  <div className={styles.debugSection}>
                    <h4>Environment</h4>
                    <div className={styles.debugItem}>
                      <span className={styles.debugLabel}>PERPLEXITY_API_KEY:</span>
                      <span
                        className={
                          debugInfo.environment.perplexityKeySet ? styles.success : styles.warning
                        }
                      >
                        {debugInfo.environment.perplexityKeySet
                          ? `✓ Set (${debugInfo.environment.perplexityKeyLength} chars, starts with ${debugInfo.environment.perplexityKeyPrefix})`
                          : "✗ NOT SET"}
                      </span>
                    </div>
                    <div className={styles.debugItem}>
                      <span className={styles.debugLabel}>Node Environment:</span>
                      <span>{debugInfo.environment.nodeEnv}</span>
                    </div>
                  </div>

                  <div className={styles.debugSection}>
                    <h4>Perplexity Connection Test</h4>
                    {debugInfo.tests.perplexityConnection ? (
                      <>
                        <div className={styles.debugItem}>
                          <span className={styles.debugLabel}>Status:</span>
                          <span
                            className={
                              debugInfo.tests.perplexityConnection.status === "SUCCESS"
                                ? styles.success
                                : styles.error
                            }
                          >
                            {debugInfo.tests.perplexityConnection.status}
                          </span>
                        </div>
                        {debugInfo.tests.perplexityConnection.statusCode && (
                          <div className={styles.debugItem}>
                            <span className={styles.debugLabel}>HTTP Status:</span>
                            <span>{debugInfo.tests.perplexityConnection.statusCode}</span>
                          </div>
                        )}
                        {debugInfo.tests.perplexityConnection.responseTime && (
                          <div className={styles.debugItem}>
                            <span className={styles.debugLabel}>Response Time:</span>
                            <span>{debugInfo.tests.perplexityConnection.responseTime}ms</span>
                          </div>
                        )}
                        {debugInfo.tests.perplexityConnection.error && (
                          <div className={styles.debugSection}>
                            <h5>Error Details:</h5>
                            <pre className={styles.debugPre}>
                              {debugInfo.tests.perplexityConnection.error}
                            </pre>
                          </div>
                        )}
                        {debugInfo.tests.perplexityConnection.responsePreview && (
                          <div className={styles.debugSection}>
                            <h5>Response Preview:</h5>
                            <pre className={styles.debugPre}>
                              {debugInfo.tests.perplexityConnection.responsePreview}
                            </pre>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className={styles.emptyState}>No test data available</p>
                    )}
                  </div>

                  <div className={styles.debugSection}>
                    <p className={styles.debugTimestamp}>
                      Last checked: {new Date(debugInfo.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className={styles.results}>
            <div className={styles.header2}>
              <h2>{result.topic}</h2>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {result.method === "perplexity-only" && (
                  <button
                    onClick={() => setMatrixView(!matrixView)}
                    className={styles.toggleButton}
                    title="Toggle between table and prose view"
                  >
                    {matrixView ? "📝 Prose View" : "📊 Matrix View"}
                  </button>
                )}
                {sources && Object.keys(sources).length > 0 && (
                  <button
                    onClick={() => setShowSources(true)}
                    className={styles.toggleButton}
                    title="View sources and credibility analysis"
                  >
                    📚 Sources ({Object.keys(sources).length})
                    {contradictions.length > 0 && <span style={{ marginLeft: "6px", color: "#f44336" }}>⚠️</span>}
                  </button>
                )}
                {claims.length > 0 && (
                  <button
                    onClick={() => setShowClaims(true)}
                    className={styles.toggleButton}
                    title="Verify claims and detect conflicts"
                  >
                    🔍 Claims ({claims.length})
                    {claimConflicts.length > 0 && <span style={{ marginLeft: "6px", color: "#f44336" }}>⚠️</span>}
                  </button>
                )}
              </div>
              <div className={styles.downloadSection}>
                <div className={styles.citationFormat}>
                  <label htmlFor="citation">Citations:</label>
                  <select
                    id="citation"
                    value={citationFormat}
                    onChange={(e) => setCitationFormat(e.target.value as any)}
                    className={styles.citationSelect}
                  >
                    <option value="none">None</option>
                    <option value="apa">APA</option>
                    <option value="mla">MLA</option>
                    <option value="chicago">Chicago</option>
                  </select>
                </div>
                <div className={styles.downloadButtons}>
                  <button onClick={() => handleDownload("markdown")} className={styles.downloadBtn}>
                    📝 Markdown
                  </button>
                  <button onClick={() => handleDownload("docx")} className={styles.downloadBtn}>
                    📄 Word
                  </button>
                  <button onClick={() => handleDownload("pdf")} className={styles.downloadBtn}>
                    📕 PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            {result.cost && (
              <div className={styles.costBreakdown}>
                <h4>📊 Research Cost</h4>
                <div className={styles.costDetails}>
                  {result.method === "multi-search-synthesis" ? (
                    <div>
                      <div className={styles.costSection}>
                        <strong>Multi-Search Synthesis:</strong>
                        <div className={styles.costRow}>
                          <span>Synthesizing {result.searchCount} searches</span>
                          <span className={styles.costAmount}>{result.cost.estimated_cost}</span>
                        </div>
                      </div>
                      <div className={styles.costTotal}>
                        <strong>Total: {result.cost.estimated_cost}</strong>
                      </div>
                    </div>
                  ) : result.method === "framework-synthesis" ? (
                    <div>
                      <div className={styles.costSection}>
                        <strong>Perplexity Searches:</strong>
                        <div className={styles.costRow}>
                          <span>Multiple focused queries</span>
                          <span className={styles.costAmount}>{result.cost.perplexity_cost}</span>
                        </div>
                      </div>
                      <div className={styles.costSection}>
                        <strong>Claude Synthesis:</strong>
                        <div className={styles.costRow}>
                          <span>Framework synthesis & organization</span>
                          <span className={styles.costAmount}>{result.cost.claude_cost}</span>
                        </div>
                      </div>
                      <div className={styles.costTotal}>
                        <strong>Total: {result.cost.total_estimated_cost}</strong>
                      </div>
                    </div>
                  ) : result.method === "perplexity-only" ? (
                    <div>
                      <div className={styles.costRow}>
                        <span>Model: {result.cost.model}</span>
                        <span className={styles.costAmount}>{result.cost.estimated_cost}</span>
                      </div>
                      <div className={styles.costMeta}>
                        {result.cost.prompt_tokens} in | {result.cost.completion_tokens} out
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className={styles.costSection}>
                        <strong>Perplexity:</strong>
                        <div className={styles.costRow}>
                          <span>{result.cost.perplexity.model}</span>
                          <span className={styles.costAmount}>{result.cost.perplexity.estimated_cost}</span>
                        </div>
                        <div className={styles.costMeta}>
                          {result.cost.perplexity.prompt_tokens} in | {result.cost.perplexity.completion_tokens} out
                        </div>
                      </div>
                      <div className={styles.costSection}>
                        <strong>Claude:</strong>
                        <div className={styles.costRow}>
                          <span>{result.cost.claude.model}</span>
                          <span className={styles.costAmount}>{result.cost.claude.estimated_cost}</span>
                        </div>
                        <div className={styles.costMeta}>
                          {result.cost.claude.input_tokens} in | {result.cost.claude.output_tokens} out
                        </div>
                      </div>
                      <div className={styles.costTotal}>
                        <strong>Total: {result.cost.total_estimated_cost}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.synthesis ? (
              <div className={styles.summary}>
                <h3>
                  {result.method === "multi-search-synthesis"
                    ? `✨ Multi-Search Synthesis (${result.searchCount} searches)`
                    : "Framework Synthesis"}
                </h3>
                {result.method === "multi-search-synthesis" && result.searches && (
                  <div style={{ marginBottom: "16px", padding: "12px", background: "#f5f5f5", borderRadius: "6px", fontSize: "0.9em", color: "#666" }}>
                    <strong>Source Searches:</strong> {result.searches.map((s: any) => s.topic).join(" → ")}
                  </div>
                )}
                <div className={styles.summaryContent}>
                  {result.synthesis.split('\n').map((para, i) => (
                    para.trim() && <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            ) : result.summary && (
              <div className={styles.summary}>
                {matrixView && result.summary.includes('|') ? (
                  <div>
                    <h3>Comparison Matrix</h3>
                    <div className={styles.tableContainer}>
                      {result.summary.split('\n').map((line, i) =>
                        line.includes('|') ? (
                          <div key={i} className={styles.tableLine}>
                            {line}
                          </div>
                        ) : line.trim() ? (
                          <p key={i} className={styles.tableCaption}>{line}</p>
                        ) : null
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <h3>Comprehensive Assessment</h3>
                    <div className={styles.summaryContent}>
                      {result.summary.split('\n').map((para, i) => (
                        para.trim() && <p key={i}>{para}</p>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className={styles.findings}>
              <div className={styles.findingsHeader}>
                <h3>Key Findings ({result.findings.length})</h3>
                {(() => {
                  const grouped = deduplicateFindings(result.findings);
                  return (
                    <>
                      {deduplicateFindings(result.findings).some((g) => g.duplicates.length > 0) && (
                        <button
                          onClick={() => setShowGrouped(!showGrouped)}
                          className={styles.toggleButton}
                        >
                          {showGrouped ? "📋 Flat View" : "🔗 Group Similar"}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>

              {showGrouped
                ? (() => {
                    const grouped = deduplicateFindings(result.findings);
                    return grouped.map((group, i) => (
                      <div key={i} className={styles.findingGroup}>
                        <div
                          className={styles.finding}
                          onClick={() => {
                            const newExpanded = new Set(expandedGroups);
                            if (newExpanded.has(i)) {
                              newExpanded.delete(i);
                            } else {
                              newExpanded.add(i);
                            }
                            setExpandedGroups(newExpanded);
                          }}
                        >
                          {group.duplicates.length > 0 && (
                            <div className={styles.groupBadge}>
                              {expandedGroups.has(i) ? "−" : "+"} {group.duplicates.length}
                            </div>
                          )}
                          <div className={styles.findingContent}>
                            <p className={styles.findingText}>{group.primary.text}</p>
                            <div className={styles.scoreBar}>
                              <div
                                className={styles.scoreIndicator}
                                style={{
                                  width: `${group.primary.scores.combined * 100}%`,
                                }}
                              />
                            </div>
                            <div className={styles.scores}>
                              <span>Relevance: {(group.primary.scores.relevance * 100).toFixed(0)}%</span>
                              <span>Credibility: {(group.primary.scores.credibility * 100).toFixed(0)}%</span>
                              <span>Recency: {(group.primary.scores.recency * 100).toFixed(0)}%</span>
                              <span className={styles.combined}>
                                Combined: {(group.primary.scores.combined * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className={styles.source}>
                            <a
                              href={group.primary.source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {group.primary.source.title}
                            </a>
                            <p>{group.primary.source.domain}</p>
                          </div>
                        </div>

                        {expandedGroups.has(i) &&
                          group.duplicates.map((dup, j) => (
                            <div key={`dup-${j}`} className={styles.duplicate}>
                              <div className={styles.findingContent}>
                                <p className={styles.findingText}>{dup.text}</p>
                                <div className={styles.scores}>
                                  <span>Relevance: {(dup.scores.relevance * 100).toFixed(0)}%</span>
                                  <span>Credibility: {(dup.scores.credibility * 100).toFixed(0)}%</span>
                                  <span>Recency: {(dup.scores.recency * 100).toFixed(0)}%</span>
                                </div>
                              </div>
                              <div className={styles.source}>
                                <a
                                  href={dup.source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {dup.source.title}
                                </a>
                                <p>{dup.source.domain}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    ));
                  })()
                : result.findings.map((finding, i) => (
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
