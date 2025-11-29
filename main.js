/**************************************************
 * PLAYER ERA VISUAL + TEAM AGE VISUAL (UNCHANGED)
 **************************************************/

// ✅ Your teammate's JavaScript already works as-is.
// ✅ KEEP your teammate’s entire JS ABOVE THIS LINE
// ✅ (Use the code you pasted previously for players & team age charts)


// ===================================================
// ===================================================
// ✅ SECTION 3: LEAGUE PERFORMANCE LINE CHART (YOURS)
// ===================================================
// ===================================================

let fullData = [];
let currentLeague = "All";
let currentTeam = "All";
let currentMetric = "runs";

const tooltip = d3.select("#tooltip");

// Load Teams CSV
d3.csv("Teams.csv", d3.autoType).then(data => {
  fullData = data.filter(d => d.yearID >= 1960 && d.G && d.R && d.H && d.SO);

  fullData.forEach(d => {
    d.runsPerGame = d.R / d.G;
    d.hitsPerGame = d.H / d.G;
    d.strikeoutsPerGame = d.SO / d.G;
  });

  setupLeagueFilter();
  setupTeamFilter();
  setupMetricControls();
  setupLineSlider();
  updateLine();
});

// ---------------- MEDIA FILTERS ----------------

function getLeagueFilteredData() {
  if (currentLeague === "All") return fullData;
  return fullData.filter(d => d.lgID === currentLeague);
}

function setupLeagueFilter() {
  document.getElementById("leagueFilter").onchange = e => {
    currentLeague = e.target.value;
    setupTeamFilter();
    updateLine();
  };
}

function setupTeamFilter() {
  const select = document.getElementById("teamFilter");
  select.innerHTML = `<option value="All">All Teams</option>`;

  const teams = [...new Set(getLeagueFilteredData().map(d => d.name))].sort();
  teams.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    select.appendChild(opt);
  });

  select.onchange = e => {
    currentTeam = e.target.value;
    updateLine();
  };
}

function setupMetricControls() {
  document.querySelectorAll('input[name="metric"]').forEach(r => {
    r.onchange = () => {
      currentMetric = r.value;
      updateLine();
    };
  });
}

function setupLineSlider() {
  const years = fullData.map(d => d.yearID);
  const min = Math.min(...years);
  const max = Math.max(...years);

  const minInput = document.getElementById("lineYearMin");
  const maxInput = document.getElementById("lineYearMax");

  minInput.min = min;
  maxInput.min = min;
  minInput.max = max;
  maxInput.max = max;

  minInput.value = min;
  maxInput.value = max;

  minInput.oninput = updateLine;
  maxInput.oninput = updateLine;
}

// ---------------- LINE CHART ----------------

function metricValue(d) {
  if (currentMetric === "batting") return d.hitsPerGame;
  if (currentMetric === "so") return d.strikeoutsPerGame;
  return d.runsPerGame;
}

function metricLabel() {
  if (currentMetric === "batting") return "Hits/Game";
  if (currentMetric === "so") return "Strikeouts/Game";
  return "Runs/Game";
}

function updateLine() {
  const minY = +lineYearMin.value;
  const maxY = +lineYearMax.value;

  lineYearLabel.textContent = `${minY} – ${maxY}`;
  lineChartTitle.textContent = `League Average ${metricLabel()} by Year`;

  const base = getLeagueFilteredData()
    .filter(d => d.yearID >= minY && d.yearID <= maxY);

  d3.select("#linechart").selectAll("*").remove();
  drawLine(base);
}

function drawLine(data) {
  const svg = d3.select("#linechart");
  const w = svg.node().clientWidth || 900;
  const h = 400;
  const m = { top: 30, right: 140, bottom: 50, left: 60 };

  const g = svg
    .attr("height", h)
    .append("g")
    .attr("transform", `translate(${m.left},${m.top})`);

  const W = w - m.left - m.right;
  const H = h - m.top - m.bottom;

  const grouped = d3.rollup(data, v => d3.mean(v, d => metricValue(d)), d => d.yearID);
  const series = Array.from(grouped, ([year, val]) => ({ year, val })).sort((a,b)=>a.year-b.year);

  const x = d3.scaleLinear().domain(d3.extent(series, d => d.year)).range([0, W]);
  const y = d3.scaleLinear().domain(d3.extent(series, d => d.val)).nice().range([H, 0]);

  g.append("g").attr("transform", `translate(0,${H})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
  g.append("g").call(d3.axisLeft(y));

  const line = d3.line().x(d => x(d.year)).y(d => y(d.val));

  // League line
  g.append("path")
    .datum(series)
    .attr("fill", "none")
    .attr("stroke", "#2563eb")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Team overlay
  if (currentTeam !== "All") {
    const team = data.filter(d => d.name === currentTeam);
    const teamGrouped = d3.rollup(team, v => d3.mean(v, d => metricValue(d)), d => d.yearID);
    const teamSeries = Array.from(teamGrouped, ([year, val]) => ({ year, val })).sort((a,b)=>a.year-b.year);

    g.append("path")
      .datum(teamSeries)
      .attr("fill","none")
      .attr("stroke","orange")
      .attr("stroke-width",2.5)
      .attr("d",line);
  }

  // Legend
  const legend = g.append("g").attr("transform", `translate(${W+10}, 10)`);
  legend.append("rect").attr("width",12).attr("height",12).attr("fill","#2563eb");
  legend.append("text").attr("x",18).attr("y",10).text("League");

  legend.append("rect").attr("y",20).attr("width",12).attr("height",12).attr("fill","orange");
  legend.append("text").attr("x",18).attr("y",30).text("Selected Team");
}
