import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repository = process.env.GITHUB_REPOSITORY || "tomszhou/keval-release";
const token = process.env.GITHUB_TOKEN;
const outputPath = process.env.STATS_PATH || "site/data/stats.json";
const timeZone = "Asia/Shanghai";

function localDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function getAllReleases() {
  const releases = [];

  for (let page = 1; ; page += 1) {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/releases?per_page=100&page=${page}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "keval-download-stats",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}: ${await response.text()}`);
    }

    const pageItems = await response.json();
    releases.push(...pageItems);
    if (pageItems.length < 100) break;
  }

  return releases;
}

async function readExistingStats() {
  try {
    return JSON.parse(await readFile(outputPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

const releases = await getAllReleases();
const assets = releases
  .flatMap((release) =>
    release.assets.map((asset) => ({
      id: String(asset.id),
      tag: release.tag_name,
      name: asset.name,
      downloads: asset.download_count,
      size: asset.size,
      publishedAt: release.published_at,
      url: asset.browser_download_url,
    })),
  )
  .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

const counters = Object.fromEntries(assets.map((asset) => [asset.id, asset.downloads]));
const totalDownloads = assets.reduce((sum, asset) => sum + asset.downloads, 0);
const existing = await readExistingStats();
const today = localDate();

let history = existing?.history ? [...existing.history] : [];
let newDownloads = 0;

if (existing) {
  for (const [id, count] of Object.entries(counters)) {
    newDownloads += Math.max(0, count - (existing.assetCounters?.[id] ?? 0));
  }
}

const todayEntry = history.find((entry) => entry.date === today);
if (todayEntry) {
  todayEntry.downloads += newDownloads;
  todayEntry.totalDownloads = totalDownloads;
} else {
  history.push({
    date: today,
    downloads: existing ? newDownloads : 0,
    totalDownloads,
  });
}

history = history
  .sort((a, b) => a.date.localeCompare(b.date))
  .slice(-730);

const previousSnapshot = existing
  ? JSON.stringify({ assets: existing.assets, history: existing.history, totalDownloads: existing.totalDownloads })
  : null;
const currentSnapshot = JSON.stringify({ assets, history, totalDownloads });
const hasChanged = previousSnapshot !== currentSnapshot;

const stats = {
  repository,
  timeZone,
  trackingStartedAt: existing?.trackingStartedAt || new Date().toISOString(),
  generatedAt: hasChanged ? new Date().toISOString() : existing.generatedAt,
  totalDownloads,
  assets,
  history,
  assetCounters: counters,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(stats, null, 2)}\n`);

console.log(
  `Recorded ${totalDownloads} total downloads (${newDownloads} new) across ${assets.length} assets.`,
);
