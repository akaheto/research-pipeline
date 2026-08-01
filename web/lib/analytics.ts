interface SearchRecord {
  topic: string;
  timestamp: number;
  findingsCount: number;
}

export function getSearchAnalytics(records: SearchRecord[]) {
  if (records.length === 0) {
    return {
      totalSearches: 0,
      uniqueTopics: 0,
      trending: [],
      topSearches: [],
      recentActivity: [],
    };
  }

  // Count searches by topic
  const topicCounts = new Map<string, number>();
  const topicDates = new Map<string, number[]>();

  records.forEach((record) => {
    const key = record.topic.toLowerCase();
    topicCounts.set(key, (topicCounts.get(key) || 0) + 1);

    if (!topicDates.has(key)) {
      topicDates.set(key, []);
    }
    topicDates.get(key)!.push(record.timestamp);
  });

  // Trending: topics searched multiple times, sorted by recency
  const trending = Array.from(topicCounts.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => {
      const aLatest = Math.max(...topicDates.get(a[0])!);
      const bLatest = Math.max(...topicDates.get(b[0])!);
      return bLatest - aLatest;
    })
    .slice(0, 5)
    .map(([topic, count]) => ({
      topic: topic.charAt(0).toUpperCase() + topic.slice(1),
      count,
      lastSearched: Math.max(...topicDates.get(topic)!),
    }));

  // Top searches: most frequent
  const topSearches = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({
      topic: topic.charAt(0).toUpperCase() + topic.slice(1),
      count,
    }));

  // Recent activity: last 5 searches
  const recentActivity = [...records]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
    .map((record) => ({
      topic: record.topic,
      timestamp: record.timestamp,
      findings: record.findingsCount,
    }));

  return {
    totalSearches: records.length,
    uniqueTopics: topicCounts.size,
    trending,
    topSearches,
    recentActivity,
  };
}

export function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}
