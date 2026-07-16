const numberFormat = new Intl.NumberFormat("zh-CN");
const dateFormat = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "long",
  day: "numeric",
});
const dateTimeFormat = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function previousDate(dateString) {
  const date = new Date(`${dateString}T12:00:00+08:00`);
  date.setUTCDate(date.getUTCDate() - 1);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function renderChart(history) {
  const container = document.querySelector("#chart");
  const data = history.slice(-30);
  if (!data.length) {
    container.innerHTML = '<div class="empty-chart">数据积累中</div>';
    return;
  }

  const width = 1000;
  const height = 285;
  const padding = { top: 18, right: 18, bottom: 38, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(1, ...data.map((item) => item.downloads));
  const roundedMax = Math.max(4, Math.ceil(maxValue / 4) * 4);
  const x = (index) => padding.left + (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth);
  const y = (value) => padding.top + plotHeight - (value / roundedMax) * plotHeight;
  const points = data.map((item, index) => `${x(index)},${y(item.downloads)}`).join(" ");
  const areaPoints = `${padding.left},${padding.top + plotHeight} ${points} ${x(data.length - 1)},${padding.top + plotHeight}`;

  const grid = [0, 1, 2, 3, 4]
    .map((step) => {
      const value = (roundedMax / 4) * step;
      const position = y(value);
      return `<line class="grid-line" x1="${padding.left}" y1="${position}" x2="${width - padding.right}" y2="${position}" />
        <text class="chart-label" x="${padding.left - 10}" y="${position + 4}" text-anchor="end">${numberFormat.format(value)}</text>`;
    })
    .join("");

  const labelIndexes = [...new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])];
  const labels = labelIndexes
    .map((index) => {
      const label = data[index].date.slice(5).replace("-", "/");
      return `<text class="chart-label" x="${x(index)}" y="${height - 9}" text-anchor="middle">${label}</text>`;
    })
    .join("");

  const dots = data
    .map(
      (item, index) =>
        `<circle class="chart-dot" cx="${x(index)}" cy="${y(item.downloads)}" r="4"><title>${item.date}：${item.downloads} 次</title></circle>`,
    )
    .join("");

  container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2b6b49" stop-opacity="0.22"/><stop offset="100%" stop-color="#2b6b49" stop-opacity="0"/></linearGradient></defs>
    ${grid}
    <polygon class="chart-area" points="${areaPoints}" />
    <polyline class="chart-line" points="${points}" vector-effect="non-scaling-stroke" />
    ${dots}
    ${labels}
  </svg>`;
}

function render(stats) {
  const history = stats.history || [];
  const todayEntry = history.at(-1);
  const yesterdayEntry = todayEntry
    ? history.find((entry) => entry.date === previousDate(todayEntry.date))
    : null;
  const releaseCount = new Set(stats.assets.map((asset) => asset.tag)).size;

  document.querySelector("#today-downloads").textContent = numberFormat.format(todayEntry?.downloads ?? 0);
  document.querySelector("#yesterday-downloads").textContent = yesterdayEntry
    ? numberFormat.format(yesterdayEntry.downloads)
    : "—";
  document.querySelector("#total-downloads").textContent = numberFormat.format(stats.totalDownloads);
  document.querySelector("#release-count").textContent = numberFormat.format(releaseCount);
  document.querySelector("#today-date").textContent = todayEntry
    ? dateFormat.format(new Date(`${todayEntry.date}T12:00:00+08:00`))
    : "北京时间";
  document.querySelector("#last-updated").textContent = `更新于 ${dateTimeFormat.format(new Date(stats.generatedAt))}`;
  document.querySelector("#baseline-note").textContent =
    `每日趋势从 ${dateFormat.format(new Date(stats.trackingStartedAt))} 开始记录；此前只能获得累计下载量，无法从 GitHub 补回每日明细。`;

  document.querySelector("#asset-rows").innerHTML = stats.assets
    .map(
      (asset) => `<tr>
        <td><span class="version-pill">${escapeHtml(asset.tag)}</span></td>
        <td><a class="asset-link" href="${escapeHtml(asset.url)}">${escapeHtml(asset.name)}</a></td>
        <td>${dateFormat.format(new Date(asset.publishedAt))}</td>
        <td class="number"><strong>${numberFormat.format(asset.downloads)}</strong></td>
      </tr>`,
    )
    .join("");

  renderChart(history);
}

fetch(`./data/stats.json?${Date.now()}`)
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(render)
  .catch((error) => {
    console.error(error);
    document.querySelector("#today-date").textContent = "数据暂时无法读取";
    document.querySelector("#chart").innerHTML = '<div class="empty-chart">统计数据加载失败，请稍后刷新</div>';
  });
