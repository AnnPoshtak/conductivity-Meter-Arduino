let currentId = 'tap';
let currentName = 'Вода з-під крана';
let state = 'idle';
let activeTimer = null;
let buffer = [];
const saved = {};

const ctx = document.getElementById('chart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      data: [],
      borderColor: '#1d4ed8',
      backgroundColor: 'rgba(29, 78, 216, 0.1)',
      borderWidth: 2.5,
      pointRadius: 0,
      fill: true,
      tension: 0.15
    }]
  },
  options: {
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        min: 0,
        max: 1023,
        border: { color: '#94a3b8' },
        grid: { color: '#e2e8f0' },
        ticks: { color: '#475569', font: { family: 'monospace' } }
      },
      x: {
        border: { color: '#94a3b8' },
        grid: { display: false },
        ticks: { color: '#64748b', maxTicksLimit: 10, font: { family: 'monospace' } }
      }
    }
  }
});

function clearChart() {
  chart.data.labels = [];
  chart.data.datasets[0].data = [];
  chart.update();
}

document.querySelectorAll('.sample-item').forEach(btn => {
  btn.addEventListener('click', () => {
    if (state !== 'idle') return;
    document.querySelectorAll('.sample-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentId = btn.dataset.id;
    currentName = btn.dataset.name;
  });
});

const recordBtn = document.getElementById('recordBtn');
const timerBanner = document.getElementById('timerBanner');
const openReportBtn = document.getElementById('openReportBtn');

recordBtn.addEventListener('click', () => {
  if (state === 'idle') {
    startPrepPhase();
  } else if (state === 'prep') {
    clearInterval(activeTimer);
    resetControls();
  } else if (state === 'recording') {
    clearInterval(activeTimer);
    saveAndFinish();
  }
});

function startPrepPhase() {
  state = 'prep';
  clearChart();
  let sec = 1;
  recordBtn.innerText = 'Скасувати';
  recordBtn.className = 'btn btn-outline';
  timerBanner.style.display = 'block';
  timerBanner.className = 'timer-banner timer-prep';
  timerBanner.innerText = `Приготування: ${sec}`;

  activeTimer = setInterval(() => {
    sec++;
    if (sec <= 5) {
      timerBanner.innerText = `Приготування: ${sec}`;
    } else {
      clearInterval(activeTimer);
      startRecordingPhase();
    }
  }, 1000);
}

function startRecordingPhase() {
  state = 'recording';
  buffer = [];
  clearChart();
  let sec = 1;
  recordBtn.innerText = 'Стоп';
  recordBtn.className = 'btn btn-stop';
  timerBanner.className = 'timer-banner timer-rec';
  timerBanner.innerText = `Замір: ${sec}`;

  activeTimer = setInterval(() => {
    sec++;
    if (sec <= 10) {
      timerBanner.innerText = `Замір: ${sec}`;
    } else {
      clearInterval(activeTimer);
      saveAndFinish();
    }
  }, 1000);
}

function saveAndFinish() {
  if (buffer.length > 0) {
    const avg = Math.round(buffer.reduce((a, b) => a + b, 0) / buffer.length);
    saved[currentId] = { name: currentName, avg };
    document.getElementById('pill-' + currentId).innerText = avg;
    openReportBtn.style.display = 'block';
  }
  resetControls();
}

function resetControls() {
  state = 'idle';
  clearChart();
  recordBtn.innerText = 'Записати замір';
  recordBtn.className = 'btn';
  timerBanner.style.display = 'none';
}

openReportBtn.addEventListener('click', () => {
  const tbody = document.getElementById('reportBody');
  tbody.innerHTML = '';

  ['tap', 'sugar', 'soda', 'salt'].forEach(id => {
    if (!saved[id]) return;
    const item = saved[id];
    const pct = Math.min(100, Math.round((item.avg / 1023) * 100));
    const info = classify(item.avg);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.name}</strong></td>
      <td class="mono">${item.avg} / 1023</td>
      <td>
        <div class="bar-wrap"><div class="bar-fill" style="width:${pct}%"></div></div>
        <span class="mono" style="font-size:12px;">${pct}%</span>
      </td>
      <td>${info.label} — <span style="color:#475569;">${info.desc}</span></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('measureScreen').style.display = 'none';
  document.getElementById('resultsScreen').style.display = 'block';
});

document.getElementById('backBtn').addEventListener('click', () => {
  document.getElementById('resultsScreen').style.display = 'none';
  document.getElementById('measureScreen').style.display = 'grid';
});

function classify(val) {
  if (val < 50) return { label: 'Струму немає', desc: 'діелектрик / відсутні іони' };
  if (val < 350) return { label: 'Слабкий струм', desc: 'низька концентрація іонів' };
  if (val < 750) return { label: 'Середній струм', desc: 'помірний електроліт' };
  return { label: 'Сильний струм', desc: 'висока концентрація іонів' };
}

setInterval(async () => {
  try {
    const res = await fetch('/data');
    const num = parseInt(await res.text());
    if (!isNaN(num)) {
      document.getElementById('valDisplay').innerText = num;
      document.getElementById('statusDisplay').innerText = classify(num).label;

      if (state === 'recording') {
        buffer.push(num);

        const t = new Date().toLocaleTimeString().slice(0, 8);
        chart.data.labels.push(t);
        chart.data.datasets[0].data.push(num);
        if (chart.data.labels.length > 35) {
          chart.data.labels.shift();
          chart.data.datasets[0].data.shift();
        }
        chart.update();
      }
    }
  } catch (e) {}
}, 350);