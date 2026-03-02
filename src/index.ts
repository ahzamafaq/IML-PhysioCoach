/**
 * IML PhysioCoach — Enhanced Interactive ML Application
 * Features:
 *  1. On-screen prediction display (animated, color-coded)
 *  2. Prediction history chart (Chart.js)
 *  3. Pose overlay (MoveNet skeleton)
 *  4. Audio feedback (Web Speech API)
 *  5. Save / Load dataset (localStorage)
 *  6. Multi-class exercise selector (presets)
 */

import '@marcellejs/core/dist/marcelle.css';
import './style.css';
import * as marcelle from '@marcellejs/core';

const { dashboard, webcam, button, text, textInput, toggle, dataset, datasetBrowser, mobileNet, knnClassifier } = marcelle;

// ─── Toast Notification System (replaces alert) ──────────────────────────────
function showToast(message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info', durationMs = 4000) {
  console.log(`📢 Toast [${type}]: ${message}`);
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(container);
  }
  const colors = { success: '#28a745', warning: '#ff9800', info: '#4361ee', error: '#dc3545' };
  const icons = { success: '✅', warning: '⚠️', info: 'ℹ️', error: '❌' };
  const toast = document.createElement('div');
  toast.style.cssText = `
    background:${colors[type]}; color:#fff; padding:14px 22px; border-radius:12px;
    font-family:'Inter',system-ui,sans-serif; font-size:0.95rem; font-weight:500;
    box-shadow:0 8px 24px rgba(0,0,0,0.2); max-width:380px; pointer-events:auto;
    transform:translateX(120%); transition:transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s;
    line-height:1.5; word-break:break-word;
  `;
  toast.textContent = `${icons[type]} ${message}`;
  container.appendChild(toast);
  requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, durationMs);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
const dash = dashboard({
  title: '🏥 IML PhysioCoach',
  author: 'IML Course',
});

// ─── Shared ML Components ─────────────────────────────────────────────────────
const input = webcam();
const featureExtractor = mobileNet();
const trainingDataset = dataset('training-set-physiotherapy');
const classifier = knnClassifier();

// ─── FIX: Enable multi-remove so "Delete class" works in dataset browser ──────
// Marcelle's default memory store doesn't allow bulk remove (remove(null, query)).
// The dataset browser's "Delete class" action needs this. We patch the underlying
// feathers service options after the dataset is ready.
trainingDataset.ready.then(() => {
  const svc = (trainingDataset as unknown as { instanceService: { options: { multi: boolean | string[] } } }).instanceService;
  if (svc && svc.options) {
    svc.options.multi = true;
    console.log('✅ Enabled multi-remove for dataset service (Delete class fix)');
  }
}).catch(() => { /* dataset connection error handled elsewhere */ });

// ─── FEATURE 6: Exercise Class Presets ────────────────────────────────────────
const exercisePresets: Record<string, string[]> = {
  'Squat': ['Good Squat', 'Bad Squat'],
  'Bicep Curl': ['Good Curl', 'Bad Curl'],
  'Shoulder Press': ['Good Press', 'Bad Press'],
  'Plank': ['Good Plank', 'Bad Plank'],
  'Lunge': ['Good Lunge', 'Bad Lunge'],
};

let activeExercise = 'Squat';

const exerciseSelectorDisplay = text('');
exerciseSelectorDisplay.title = '🏃 Exercise Type';

const labelsDisplay = text('');
labelsDisplay.title = 'Step 1: Labels';

function renderLabelsDisplay() {
  const labels = exercisePresets[activeExercise];
  labelsDisplay.$value.set(`
    <div style="display:flex;gap:10px;">
      <button id="label-good-btn" onclick="window.__selectLabel('good')" style="
        flex:1;padding:10px 16px;border-radius:10px;border:2px solid #4361ee;
        font-weight:700;cursor:pointer;font-size:0.9rem;font-family:Inter,sans-serif;
        background:#4361ee;color:#fff;transition:all 0.2s;
      ">Label: ${labels[0]}</button>
      <button id="label-bad-btn" onclick="window.__selectLabel('bad')" style="
        flex:1;padding:10px 16px;border-radius:10px;border:2px solid #e4e7ec;
        font-weight:500;cursor:pointer;font-size:0.9rem;font-family:Inter,sans-serif;
        background:#fff;color:#4a4a68;transition:all 0.2s;
      ">Label: ${labels[1]}</button>
    </div>
  `);
}

(window as unknown as Record<string, unknown>).__selectLabel = (which: string) => {
  const labels = exercisePresets[activeExercise];
  label.$value.set(which === 'good' ? labels[0] : labels[1]);
  // Update button styles
  setTimeout(() => {
    const goodBtn = document.getElementById('label-good-btn') as HTMLElement | null;
    const badBtn = document.getElementById('label-bad-btn') as HTMLElement | null;
    if (goodBtn) {
      goodBtn.style.background = which === 'good' ? '#4361ee' : '#fff';
      goodBtn.style.color = which === 'good' ? '#fff' : '#4a4a68';
      goodBtn.style.borderColor = which === 'good' ? '#4361ee' : '#e4e7ec';
      goodBtn.style.fontWeight = which === 'good' ? '700' : '500';
    }
    if (badBtn) {
      badBtn.style.background = which === 'bad' ? '#4361ee' : '#fff';
      badBtn.style.color = which === 'bad' ? '#fff' : '#4a4a68';
      badBtn.style.borderColor = which === 'bad' ? '#4361ee' : '#e4e7ec';
      badBtn.style.fontWeight = which === 'bad' ? '700' : '500';
    }
  }, 30);
};

// ─── Label & Training Controls ────────────────────────────────────────────────
const label = textInput('Good Squat');
label.title = 'Class Label';

const captureButton = button('📸 Capture Sample');
captureButton.title = 'Step 2: Capture';

const trainButton = button('🎓 Train Model');
trainButton.title = 'Step 3: Train';

const clearButton = button('🗑️ Clear Dataset');
clearButton.title = '';

// ─── FEATURE 5: Save / Load ────────────────────────────────────────────────────
const saveButton = button('💾 Save Dataset');
saveButton.title = 'Persistence';

const loadButton = button('📂 Load Dataset');
loadButton.title = '';

const trainingSetBrowser = datasetBrowser(trainingDataset);
trainingSetBrowser.title = 'Training Samples';

// ─── Sample counter text ───────────────────────────────────────────────────────
const sampleCountDisplay = text('No samples yet. Capture some to get started!');
sampleCountDisplay.title = '📊 Dataset Status';

// ─── FEATURE 7: Auto-Capture with Review ──────────────────────────────────────
const autoCapButton = button('▶ Start Auto-Capture');
autoCapButton.title = 'Auto-Capture (2.5s interval)';

const autoCapStatusDisplay = text('<div style="padding:10px;color:#8e8ea0;text-align:center;">Auto-capture is off. Click the button above to start.</div>');
autoCapStatusDisplay.title = '📷 Auto-Capture Status';

interface PendingItem {
  id: string;
  features: unknown;
  label: string;
  thumbnailUrl: string;
  timestamp: number;
}
let pendingReviewItems: PendingItem[] = [];
let autoCapInterval: ReturnType<typeof setInterval> | null = null;
let autoCapRunning = false;
let autoCapCount = 0;
let approvedCount = 0;
let rejectedCount = 0;

// Review tab display
const reviewDisplay = text('<div style="text-align:center;padding:2rem;color:#8e8ea0;">No pending samples to review.<br>Use Auto-Capture on the Training tab to collect samples.</div>');
reviewDisplay.title = '🔍 Review Pending Samples';

const reviewStatsDisplay = text('');
reviewStatsDisplay.title = '📊 Review Statistics';

const approveAllButton = button('✅ Approve All Pending');
approveAllButton.title = '';

// ─── FEATURE 8: Coach Feedback Loop ───────────────────────────────────────────
const therapistFeedbackDisplay = text(`
  <div style="text-align:center;padding:1.5rem;color:#8e8ea0;border:2px dashed #dee2e6;border-radius:12px;">
    <div style="font-size:1.1rem;font-weight:600;">🏋️ Coach Feedback</div>
    <div style="font-size:0.9rem;margin-top:6px;">Enable predictions to provide feedback on model accuracy</div>
  </div>`);
therapistFeedbackDisplay.title = '🏋️ Coach Mode';

const therapistStatsDisplay = text('');
therapistStatsDisplay.title = '';

let therapistCorrectCount = 0;
let therapistRelabelCount = 0;
let lastPredictedLabel = '';
let lastPredictedFeats: unknown = null;
let showRelabelOptions = false;

// ─── FEATURE 9: Evaluation Metrics ─────────────────────────────────────────────
// Confusion matrix: confusionMatrix[predicted][actual] = count
const confusionMatrix: Record<string, Record<string, number>> = {};

function recordConfusion(predicted: string, actual: string) {
  if (!confusionMatrix[predicted]) confusionMatrix[predicted] = {};
  confusionMatrix[predicted][actual] = (confusionMatrix[predicted][actual] || 0) + 1;
}

function getAllConfusionLabels(): string[] {
  const labelSet = new Set<string>();
  for (const pred of Object.keys(confusionMatrix)) {
    labelSet.add(pred);
    for (const act of Object.keys(confusionMatrix[pred])) {
      labelSet.add(act);
    }
  }
  return Array.from(labelSet).sort();
}

function computeMetrics() {
  const labels = getAllConfusionLabels();
  const total = therapistCorrectCount + therapistRelabelCount;
  const accuracy = total > 0 ? therapistCorrectCount / total : 0;

  const perClass: Record<string, { tp: number; fp: number; fn: number; precision: number; recall: number; f1: number }> = {};

  for (const lbl of labels) {
    let tp = 0, fp = 0, fn = 0;
    // TP: predicted = lbl AND actual = lbl
    tp = confusionMatrix[lbl]?.[lbl] || 0;
    // FP: predicted = lbl AND actual ≠ lbl
    for (const act of labels) {
      if (act !== lbl) fp += confusionMatrix[lbl]?.[act] || 0;
    }
    // FN: predicted ≠ lbl AND actual = lbl
    for (const pred of labels) {
      if (pred !== lbl) fn += confusionMatrix[pred]?.[lbl] || 0;
    }
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
    perClass[lbl] = { tp, fp, fn, precision, recall, f1 };
  }
  return { accuracy, perClass, labels, total };
}

// Evaluation display components
const evaluationOverviewDisplay = text('<div style="text-align:center;padding:2rem;color:#8e8ea0;">Use coach feedback on the Results tab to generate evaluation metrics.</div>');
evaluationOverviewDisplay.title = '📊 Model Accuracy';

const confusionMatrixDisplay = text('');
confusionMatrixDisplay.title = '🔢 Confusion Matrix (Coach Feedback)';

const perClassMetricsDisplay = text('');
perClassMetricsDisplay.title = '📈 Per-Class Metrics';

function renderEvaluationDisplays() {
  const { accuracy, perClass, labels, total } = computeMetrics();

  if (total === 0) {
    evaluationOverviewDisplay.$value.set('<div style="text-align:center;padding:2rem;color:#8e8ea0;">Use coach feedback on the Results tab to generate evaluation metrics.</div>');
    confusionMatrixDisplay.$value.set('');
    perClassMetricsDisplay.$value.set('');
    return;
  }

  const accPct = (accuracy * 100).toFixed(1);
  const accColor = accuracy >= 0.8 ? '#28a745' : accuracy >= 0.6 ? '#ff9800' : '#dc3545';

  // Overview: big accuracy number + summary
  evaluationOverviewDisplay.$value.set(`
    <div style="text-align:center;padding:1.5rem;">
      <div style="font-size:3.5rem;font-weight:800;color:${accColor};line-height:1;">${accPct}%</div>
      <div style="font-size:0.9rem;color:#8e8ea0;margin-top:6px;">Coach-Verified Accuracy</div>
      <div style="display:flex;gap:20px;justify-content:center;margin-top:16px;">
        <div style="text-align:center;">
          <div style="font-size:1.5rem;font-weight:700;color:#28a745;">${therapistCorrectCount}</div>
          <div style="font-size:0.75rem;color:#8e8ea0;">Correct</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:1.5rem;font-weight:700;color:#dc3545;">${therapistRelabelCount}</div>
          <div style="font-size:0.75rem;color:#8e8ea0;">Corrected</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:1.5rem;font-weight:700;color:#4361ee;">${total}</div>
          <div style="font-size:0.75rem;color:#8e8ea0;">Total Evaluated</div>
        </div>
      </div>
    </div>`);

  // Confusion Matrix table
  if (labels.length > 0) {
    const maxVal = Math.max(1, ...labels.flatMap(p => labels.map(a => confusionMatrix[p]?.[a] || 0)));
    let tableHtml = '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
    tableHtml += '<tr><th style="padding:10px;border:1px solid #dee2e6;background:#f8f9fa;color:#8e8ea0;font-size:0.75rem;">Predicted \ Actual</th>';
    labels.forEach(a => { tableHtml += `<th style="padding:10px;border:1px solid #dee2e6;background:#f8f9fa;font-weight:600;">${a}</th>`; });
    tableHtml += '</tr>';
    labels.forEach(pred => {
      tableHtml += `<tr><td style="padding:10px;border:1px solid #dee2e6;background:#f8f9fa;font-weight:600;">${pred}</td>`;
      labels.forEach(act => {
        const val = confusionMatrix[pred]?.[act] || 0;
        const isDiag = pred === act;
        const intensity = val / maxVal;
        const bg = isDiag
          ? `rgba(40,167,69,${0.1 + intensity * 0.5})`
          : val > 0 ? `rgba(220,53,69,${0.1 + intensity * 0.4})` : '#fff';
        const fontWeight = isDiag ? '700' : '500';
        tableHtml += `<td style="padding:10px;border:1px solid #dee2e6;text-align:center;background:${bg};font-weight:${fontWeight};font-size:1.1rem;">${val}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</table></div>';
    tableHtml += '<div style="font-size:0.75rem;color:#8e8ea0;margin-top:8px;text-align:center;">Rows = model prediction, Columns = coach-verified truth.<br>Green diagonal = correct, Red off-diagonal = errors.</div>';
    confusionMatrixDisplay.$value.set(tableHtml);
  }

  // Per-class precision/recall/F1
  const classRows = labels.map(lbl => {
    const m = perClass[lbl];
    const pPct = (m.precision * 100).toFixed(0);
    const rPct = (m.recall * 100).toFixed(0);
    const fPct = (m.f1 * 100).toFixed(0);
    const gradP = `linear-gradient(90deg,#4361ee ${pPct}%,#e9ecef ${pPct}%)`;
    const gradR = `linear-gradient(90deg,#28a745 ${rPct}%,#e9ecef ${rPct}%)`;
    const gradF = `linear-gradient(90deg,#7c3aed ${fPct}%,#e9ecef ${fPct}%)`;

    return `
      <div style="margin-bottom:16px;padding:12px;background:#f8f9fa;border-radius:10px;">
        <div style="font-weight:700;font-size:1rem;margin-bottom:8px;">${lbl} <span style="font-size:0.8rem;color:#8e8ea0;font-weight:400;">(TP:${m.tp} FP:${m.fp} FN:${m.fn})</span></div>
        <div style="margin:4px 0;">
          <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:2px;"><span>Precision</span><span style="font-weight:600;color:#4361ee;">${pPct}%</span></div>
          <div style="height:18px;border-radius:6px;background:${gradP};"></div>
        </div>
        <div style="margin:4px 0;">
          <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:2px;"><span>Recall</span><span style="font-weight:600;color:#28a745;">${rPct}%</span></div>
          <div style="height:18px;border-radius:6px;background:${gradR};"></div>
        </div>
        <div style="margin:4px 0;">
          <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:2px;"><span>F1 Score</span><span style="font-weight:600;color:#7c3aed;">${fPct}%</span></div>
          <div style="height:18px;border-radius:6px;background:${gradF};"></div>
        </div>
      </div>`;
  }).join('');
  perClassMetricsDisplay.$value.set(classRows || '<div style="color:#8e8ea0;text-align:center;">No per-class data yet.</div>');
}


// Keep sample count updated
async function updateSampleCount() {
  const items = await trainingDataset.items().toArray();
  const byClass: Record<string, number> = {};
  items.forEach(item => { byClass[item.y] = (byClass[item.y] || 0) + 1; });
  if (items.length === 0) {
    sampleCountDisplay.$value.set('No samples yet. Capture some to get started!');
    return;
  }
  const rows = Object.entries(byClass)
    .map(([cls, n]) => `<span style="display:inline-block;background:#eef2ff;border-radius:6px;padding:3px 10px;margin:3px;font-weight:600;color:#4361ee;">${cls}: ${n}</span>`)
    .join(' ');
  sampleCountDisplay.$value.set(`<b>Total: ${items.length}</b><br/><br/>${rows}`);
}

// Auto-refresh dataset status whenever the dataset changes (debounced to handle rapid bulk operations)
let _sampleCountTimer: ReturnType<typeof setTimeout> | null = null;
trainingDataset.ready.then(() => {
  trainingDataset.$changes.subscribe(() => {
    if (_sampleCountTimer) clearTimeout(_sampleCountTimer);
    _sampleCountTimer = setTimeout(() => updateSampleCount(), 300);
  });
});

// ─── FEATURE 6: Preset Handlers ────────────────────────────────────────────────
function updateExerciseUI() {
  const labels = exercisePresets[activeExercise];
  // Update the label text input to the first label of the new exercise
  label.$value.set(labels[0]);
  // Re-render the side-by-side label buttons
  renderLabelsDisplay();
  const exKeys = Object.keys(exercisePresets);
  exerciseSelectorDisplay.$value.set(
    exKeys.map(ex =>
      `<span style="display:inline-flex;align-items:center;margin:4px;position:relative;">
        <button onclick="window.__setExercise('${ex}')" style="
          padding:8px 16px; border-radius:8px; border:2px solid;
          font-weight:600; cursor:pointer; font-size:0.9rem; transition:all 0.2s;
          background:${ex === activeExercise ? '#4361ee' : '#f8f9fa'};
          color:${ex === activeExercise ? '#fff' : '#495057'};
          border-color:${ex === activeExercise ? '#4361ee' : '#dee2e6'};
        ">${ex}</button>${exKeys.length > 1 ? `<button onclick="window.__removeExercise('${ex}')" title="Delete ${ex}" style="
          position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;
          border:none;background:#e74c3c;color:#fff;font-size:11px;line-height:18px;
          text-align:center;cursor:pointer;padding:0;opacity:0.7;transition:opacity 0.2s;
        " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">×</button>` : ''}
      </span>`
    ).join('') +
    `<div style="margin-top:10px;display:flex;gap:6px;align-items:center;">
       <input id="new-exercise-input" type="text" placeholder="New exercise name…"
         style="flex:1;padding:7px 12px;border:1.5px solid #e4e7ec;border-radius:8px;font-size:0.85rem;font-family:Inter,sans-serif;outline:none;"
         onkeydown="if(event.key==='Enter')window.__addExercise()"
       />
       <button onclick="window.__addExercise()" style="
         padding:7px 14px;border:none;border-radius:8px;background:#4361ee;color:#fff;
         font-weight:600;cursor:pointer;font-size:0.85rem;white-space:nowrap;
       ">+ Add</button>
     </div>`
  );
}

(window as unknown as Record<string, unknown>).__setExercise = (ex: string) => {
  activeExercise = ex;
  updateExerciseUI();
};

// Dynamic exercise creation
(window as unknown as Record<string, unknown>).__addExercise = () => {
  const input = document.getElementById('new-exercise-input') as HTMLInputElement | null;
  if (!input) return;
  const name = input.value.trim();
  if (!name) { showToast('Please enter an exercise name!', 'warning'); return; }
  if (exercisePresets[name]) { showToast(`"${name}" already exists!`, 'warning'); return; }
  exercisePresets[name] = [`Good ${name}`, `Bad ${name}`];
  activeExercise = name;
  updateExerciseUI();
  renderLabelsDisplay();
  showToast(`Added "${name}" with labels: Good ${name} / Bad ${name}`, 'success');
};

// Dynamic exercise deletion
(window as unknown as Record<string, unknown>).__removeExercise = (ex: string) => {
  const keys = Object.keys(exercisePresets);
  if (keys.length <= 1) { showToast('Cannot delete the last exercise!', 'warning'); return; }
  delete exercisePresets[ex];
  if (activeExercise === ex) {
    activeExercise = Object.keys(exercisePresets)[0];
  }
  updateExerciseUI();
  renderLabelsDisplay();
  showToast(`Removed "${ex}"`, 'info');
};

// Render the labels display on startup
setTimeout(() => renderLabelsDisplay(), 300);

updateExerciseUI();

// ─── Capture Handler ────────────────────────────────────────────────────────────
captureButton.$click.subscribe(async () => {
  if (!input.$active?.value) { showToast('Please start the webcam first!', 'warning'); return; }
  const currentLabel = label.$value.value;
  if (!currentLabel?.trim()) { showToast('Please enter a label!', 'warning'); return; }
  const img = input.$images.value;
  if (img) {
    const feats = await featureExtractor.process(img);
    await trainingDataset.create({ x: feats, y: currentLabel, thumbnail: input.$thumbnails.value });
    updateSampleCount();
  }
});

// ─── FEATURE 7: Auto-Capture Logic ────────────────────────────────────────────
function getVideoThumbnailDataUrl(): string {
  try {
    const videoEl = document.querySelector('.webcam-container video, .webcam video, video') as HTMLVideoElement | null;
    if (!videoEl || !videoEl.videoWidth) return '';
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 90;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(videoEl, 0, 0, 120, 90);
    return canvas.toDataURL('image/jpeg', 0.6);
  } catch { return ''; }
}

function updateAutoCapStatus() {
  const status = autoCapRunning
    ? `<div style="padding:12px;background:#d4edda;border-radius:10px;border-left:4px solid #28a745;">
         <span style="font-weight:700;color:#28a745;">⏺ Recording...</span>
         <span style="float:right;font-weight:600;">${autoCapCount} captured</span>
       </div>`
    : `<div style="padding:12px;background:#f8f9fa;border-radius:10px;text-align:center;color:#8e8ea0;">
         Auto-capture stopped. ${autoCapCount} frames captured → go to <b>Review</b> tab.
       </div>`;
  autoCapStatusDisplay.$value.set(status);
}

function updateReviewStats() {
  reviewStatsDisplay.$value.set(`
    <div style="display:flex;gap:16px;justify-content:center;padding:12px;background:#f8f9fa;border-radius:10px;">
      <div style="text-align:center;"><div style="font-size:1.6rem;font-weight:700;color:#ff9800;">${pendingReviewItems.length}</div><div style="font-size:0.8rem;color:#8e8ea0;">Pending</div></div>
      <div style="text-align:center;"><div style="font-size:1.6rem;font-weight:700;color:#28a745;">${approvedCount}</div><div style="font-size:0.8rem;color:#8e8ea0;">Approved</div></div>
      <div style="text-align:center;"><div style="font-size:1.6rem;font-weight:700;color:#dc3545;">${rejectedCount}</div><div style="font-size:0.8rem;color:#8e8ea0;">Rejected</div></div>
    </div>`);
}

function renderReviewGallery() {
  if (pendingReviewItems.length === 0) {
    reviewDisplay.$value.set('<div style="text-align:center;padding:2rem;color:#8e8ea0;">✅ All samples reviewed! No pending items.<br>Use Auto-Capture on the Training tab to collect more.</div>');
    updateReviewStats();
    return;
  }
  const cards = pendingReviewItems.map((item, idx) => `
    <div style="display:inline-block;width:200px;margin:8px;padding:10px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);vertical-align:top;border:2px solid #dee2e6;">
      <img src="${item.thumbnailUrl}" style="width:100%;height:auto;border-radius:8px;background:#eee;min-height:60px;" alt="Sample ${idx + 1}">
      <div style="margin-top:8px;font-weight:600;font-size:0.9rem;color:#1a1a2e;text-align:center;">${item.label}</div>
      <div style="font-size:0.75rem;color:#999;text-align:center;">${new Date(item.timestamp).toLocaleTimeString()}</div>
      <div style="display:flex;gap:4px;margin-top:8px;">
        <button onclick="window.__reviewAction('approve', '${item.id}')" style="flex:1;padding:6px;border:none;background:#28a745;color:#fff;border-radius:6px;cursor:pointer;font-size:0.8rem;font-weight:600;">✅ OK</button>
        <button onclick="window.__reviewAction('relabel', '${item.id}')" style="flex:1;padding:6px;border:none;background:#4361ee;color:#fff;border-radius:6px;cursor:pointer;font-size:0.8rem;font-weight:600;">✏️ Edit</button>
        <button onclick="window.__reviewAction('reject', '${item.id}')" style="flex:1;padding:6px;border:none;background:#dc3545;color:#fff;border-radius:6px;cursor:pointer;font-size:0.8rem;font-weight:600;">❌</button>
      </div>
    </div>
  `).join('');
  reviewDisplay.$value.set(`<div style="max-height:500px;overflow-y:auto;padding:8px;">${cards}</div>`);
  updateReviewStats();
}

// Global handlers for review buttons (called from inline onclick)
(window as unknown as Record<string, unknown>).__reviewAction = async (action: string, id: string) => {
  const idx = pendingReviewItems.findIndex(item => item.id === id);
  if (idx === -1) return;
  const item = pendingReviewItems[idx];

  if (action === 'approve') {
    await trainingDataset.create({ x: item.features, y: item.label, thumbnail: item.thumbnailUrl });
    pendingReviewItems.splice(idx, 1);
    approvedCount++;
    updateSampleCount();
    showToast(`Approved: ${item.label}`, 'success', 2000);
  } else if (action === 'reject') {
    pendingReviewItems.splice(idx, 1);
    rejectedCount++;
    showToast('Sample rejected', 'info', 2000);
  } else if (action === 'relabel') {
    // Cycle through available labels for current exercise
    const labels = exercisePresets[activeExercise];
    const currentIdx = labels.indexOf(item.label);
    const newLabel = labels[(currentIdx + 1) % labels.length];
    item.label = newLabel;
    showToast(`Relabelled to: ${newLabel}`, 'info', 2000);
  }
  renderReviewGallery();
};

autoCapButton.$click.subscribe(async () => {
  if (autoCapRunning) {
    // Stop
    autoCapRunning = false;
    if (autoCapInterval) { clearInterval(autoCapInterval); autoCapInterval = null; }
    // Update button text via DOM
    setTimeout(() => {
      document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent?.includes('Stop Auto-Capture')) {
          btn.textContent = '▶ Start Auto-Capture';
        }
      });
    }, 100);
    updateAutoCapStatus();
    showToast(`Auto-capture stopped. ${autoCapCount} samples pending review.`, 'info');
    return;
  }

  // Start
  if (!input.$active?.value) { showToast('Please start the webcam first!', 'warning'); return; }
  autoCapRunning = true;
  autoCapCount = 0;
  // Update button text
  setTimeout(() => {
    document.querySelectorAll('button').forEach(btn => {
      if (btn.textContent?.includes('Start Auto-Capture')) {
        btn.textContent = '⏹ Stop Auto-Capture';
      }
    });
  }, 100);
  showToast('Auto-capture started! Change your pose — capturing every 2.5s', 'success');

  autoCapInterval = setInterval(async () => {
    if (!autoCapRunning || !input.$active?.value || !input.$images?.value) return;
    try {
      const img = input.$images.value;
      const feats = await featureExtractor.process(img);
      const thumbUrl = getVideoThumbnailDataUrl();
      const currentLabel = label.$value.value || exercisePresets[activeExercise][0];

      pendingReviewItems.push({
        id: `ac-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        features: feats,
        label: currentLabel,
        thumbnailUrl: thumbUrl,
        timestamp: Date.now(),
      });
      autoCapCount++;
      updateAutoCapStatus();
    } catch (err) {
      console.error('Auto-capture error:', err);
    }
  }, 2500);
  updateAutoCapStatus();
});

approveAllButton.$click.subscribe(async () => {
  if (pendingReviewItems.length === 0) { showToast('No pending samples to approve!', 'info'); return; }
  const count = pendingReviewItems.length;
  for (const item of pendingReviewItems) {
    await trainingDataset.create({ x: item.features, y: item.label, thumbnail: item.thumbnailUrl });
    approvedCount++;
  }
  pendingReviewItems = [];
  updateSampleCount();
  renderReviewGallery();
  showToast(`Approved all ${count} samples!`, 'success');
});

// ─── Train Handler ─────────────────────────────────────────────────────────────
async function handleTrain() {
  console.log('🎓 Train button clicked!');
  try {
    const items = await trainingDataset.items().toArray();
    console.log(`🎓 Found ${items.length} items in dataset`);
    if (items.length === 0) {
      showToast('Please capture some samples first!', 'warning');
      return;
    }
    // Count per class
    const classCount: Record<string, number> = {};
    items.forEach(it => { classCount[it.y] = (classCount[it.y] || 0) + 1; });
    const summary = Object.entries(classCount).map(([c, n]) => `${c}: ${n}`).join(', ');
    showToast(`Model ready with ${items.length} samples! (${summary}) — Go to Results tab`, 'success', 5000);
  } catch (err) {
    console.error('🎓 Train handler error:', err);
    showToast('Error checking dataset. See browser console.', 'error');
  }
}

trainButton.$click.subscribe(() => { handleTrain(); });

// Backup: also listen via DOM in case Marcelle observable misses clicks
setTimeout(() => {
  document.querySelectorAll('.marcelle-button, button.marcelle-component').forEach(btn => {
    if (btn.textContent?.includes('Train Model')) {
      btn.addEventListener('click', (e) => {
        // Only fire if Marcelle didn't already handle it
        console.log('🎓 DOM-level train click detected');
        handleTrain();
      });
    }
  });
}, 2000);

// ─── Clear Handler ─────────────────────────────────────────────────────────────
clearButton.$click.subscribe(async () => {
  const items = await trainingDataset.items().toArray();
  if (items.length === 0) { showToast('Dataset is already empty!', 'info'); return; }
  for (const item of items) await trainingDataset.remove(item.id);
  classifier.clear();
  updateSampleCount();
  showToast('Dataset cleared!', 'success');
});

// ─── FEATURE 5: Save / Load via localStorage ───────────────────────────────────
const STORAGE_KEY = 'physio-coach-dataset-v1';

// Generate a small colored placeholder thumbnail for loaded samples
function generatePlaceholderThumbnail(label: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 60;
  canvas.height = 60;
  const ctx = canvas.getContext('2d')!;
  const isGood = label.toLowerCase().includes('good');
  ctx.fillStyle = isGood ? '#d4edda' : '#f8d7da';
  ctx.fillRect(0, 0, 60, 60);
  ctx.fillStyle = isGood ? '#28a745' : '#dc3545';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const shortLabel = label.length > 10 ? label.slice(0, 9) + '…' : label;
  ctx.fillText(shortLabel, 30, 30);
  return canvas.toDataURL('image/png');
}

saveButton.$click.subscribe(async () => {
  const items = await trainingDataset.items().toArray();
  if (items.length === 0) { showToast('Nothing to save!', 'warning'); return; }
  // Store x, y, and thumbnail
  const serialisable = items.map(it => ({
    x: Array.from(it.x as Float32Array),
    y: it.y,
    thumbnail: it.thumbnail || '',
  }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialisable));
    showToast(`Saved ${items.length} samples to browser storage!`, 'success');
  } catch (e) {
    // If thumbnails make it too large, retry without them
    console.warn('Save with thumbnails failed, retrying without:', e);
    const small = items.map(it => ({ x: Array.from(it.x as Float32Array), y: it.y, thumbnail: '' }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(small));
    showToast(`Saved ${items.length} samples (without thumbnails)`, 'success');
  }
});

loadButton.$click.subscribe(async () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { showToast('No saved dataset found!', 'warning'); return; }
  const saved: { x: number[]; y: string; thumbnail?: string }[] = JSON.parse(raw);
  // Clear first
  const existing = await trainingDataset.items().toArray();
  for (const item of existing) await trainingDataset.remove(item.id);
  // Re-insert with thumbnails
  for (const s of saved) {
    const thumb = s.thumbnail || generatePlaceholderThumbnail(s.y);
    await trainingDataset.create({ x: new Float32Array(s.x), y: s.y, thumbnail: thumb });
  }
  updateSampleCount();
  showToast(`Loaded ${saved.length} samples from browser storage!`, 'success');
  // Force dataset browser to fully rebuild after a short delay
  // (allows Svelte render cycle to complete before triggering full refresh)
  setTimeout(() => {
    trainingDataset.$changes.set([{ level: 'dataset', type: 'created', data: null } as any]);
  }, 500);
});

// Delete saved dataset from localStorage
const deleteSavedButton = button('🗑 Delete Saved Data');
deleteSavedButton.title = '';
deleteSavedButton.$click.subscribe(() => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { showToast('No saved data to delete!', 'info'); return; }
  localStorage.removeItem(STORAGE_KEY);
  showToast('Saved data deleted from browser storage!', 'success');
});

// Auto-load on startup
(async () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    await trainingDataset.ready; // Wait for dataset service to initialize
    const saved: { x: number[]; y: string; thumbnail?: string }[] = JSON.parse(raw);
    for (const s of saved) {
      const thumb = s.thumbnail || generatePlaceholderThumbnail(s.y);
      await trainingDataset.create({ x: new Float32Array(s.x), y: s.y, thumbnail: thumb });
    }
    console.log(`🔄 Auto-restored ${saved.length} saved samples`);
    updateSampleCount();
    // Force dataset browser to fully rebuild
    setTimeout(() => {
      trainingDataset.$changes.set([{ level: 'dataset', type: 'created', data: null } as any]);
    }, 500);
  }
})();

// ─── Results Page Components ────────────────────────────────────────────────────
const predictionToggle = toggle('🔮 Enable Prediction');

// FEATURE 4: Audio toggle
const audioToggle = toggle('🔊 Audio Feedback');
audioToggle.title = 'Voice';

// FEATURE 3: Pose overlay toggle
const poseToggle = toggle('🦴 Pose Overlay');
poseToggle.title = 'Skeleton';

const predictionDisplay = text('Waiting for predictions...');
predictionDisplay.title = '🎯 Current Prediction';

const confidenceDisplay = text('Enable predictions to start');
confidenceDisplay.title = '📊 Confidence Score';

const allClassesDisplay = text('');
allClassesDisplay.title = '📈 All Classes';

// ─── FEATURE 4: Audio Feedback ─────────────────────────────────────────────────
let audioEnabled = false;
let lastSpokenLabel = '';
let lastSpeakTime = 0;

audioToggle.$checked.subscribe(enabled => { audioEnabled = enabled; });

function speak(text: string) {
  if (!audioEnabled) return;
  const now = Date.now();
  if (text === lastSpokenLabel && now - lastSpeakTime < 3000) return;
  lastSpokenLabel = text;
  lastSpeakTime = now;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// ─── FEATURE 3: Pose Overlay (MoveNet) ────────────────────────────────────────
let poseEnabled = false;
let poseDetector: unknown = null;
let poseAnimFrame: number | null = null;
let poseCanvas: HTMLCanvasElement | null = null;

poseToggle.$checked.subscribe(async (enabled) => {
  poseEnabled = enabled;
  if (enabled) {
    await initPoseDetector();
    startPoseLoop();
  } else {
    if (poseAnimFrame) cancelAnimationFrame(poseAnimFrame);
    if (poseCanvas) {
      const ctx = poseCanvas.getContext('2d');
      ctx?.clearRect(0, 0, poseCanvas.width, poseCanvas.height);
    }
  }
});

async function initPoseDetector() {
  if (poseDetector) return;
  try {
    const pd = (window as unknown as Record<string, unknown>).poseDetection as {
      createDetector: (model: unknown, config: unknown) => Promise<unknown>;
      SupportedModels: Record<string, unknown>;
    };
    if (!pd) { console.warn('poseDetection not available yet'); return; }
    poseDetector = await pd.createDetector(pd.SupportedModels.MoveNet, {
      modelType: 'SinglePose.Lightning',
    });
    console.log('✅ MoveNet pose detector ready');
  } catch (e) {
    console.error('Pose detector init failed:', e);
  }
}

const POSE_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4], [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
];

function startPoseLoop() {
  const loop = async () => {
    if (!poseEnabled) return;
    // Use correct Marcelle DOM selectors for webcam
    const videoEl = document.querySelector('.webcam-container video, .webcam video, video') as HTMLVideoElement | null;
    if (videoEl && poseDetector) {
      // Create or get overlay canvas
      if (!poseCanvas) {
        poseCanvas = document.createElement('canvas');
        poseCanvas.style.cssText = `
          position:absolute; top:0; left:0; width:100%; height:100%;
          pointer-events:none; z-index:10; border-radius:10px;
        `;
        const webcamEl = (videoEl.closest('.webcam-container') || videoEl.closest('.webcam') || videoEl.parentElement) as HTMLElement | null;
        if (webcamEl) {
          webcamEl.style.position = 'relative';
          webcamEl.appendChild(poseCanvas);
          console.log('🦴 Pose canvas attached to:', webcamEl.className);
        }
      }
      poseCanvas.width = videoEl.videoWidth || 320;
      poseCanvas.height = videoEl.videoHeight || 240;
      try {
        const detector = poseDetector as { estimatePoses: (v: HTMLVideoElement) => Promise<{ keypoints: { x: number; y: number; score: number; name: string }[] }[]> };
        const poses = await detector.estimatePoses(videoEl);
        const ctx = poseCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);
        if (poses.length > 0) {
          const keypoints = poses[0].keypoints;
          // Draw connections
          ctx.strokeStyle = 'rgba(0,200,100,0.85)';
          ctx.lineWidth = 3;
          POSE_CONNECTIONS.forEach(([i, j]) => {
            const kp1 = keypoints[i], kp2 = keypoints[j];
            if (kp1.score > 0.3 && kp2.score > 0.3) {
              ctx.beginPath();
              ctx.moveTo(kp1.x, kp1.y);
              ctx.lineTo(kp2.x, kp2.y);
              ctx.stroke();
            }
          });
          // Draw keypoints
          keypoints.forEach(kp => {
            if (kp.score > 0.3) {
              ctx.beginPath();
              ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
              ctx.fillStyle = 'rgba(0,180,255,0.9)';
              ctx.fill();
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          });
        }
      } catch (_) { /* ignore per-frame errors */ }
    }
    poseAnimFrame = requestAnimationFrame(loop);
  };
  loop();
}

// ─── FEATURE 2: Prediction History Chart ───────────────────────────────────────
const CHART_MAX_POINTS = 30;
const historyLabels: string[] = [];
let chartInstance: unknown = null;
let chartCanvas: HTMLCanvasElement | null = null;

const analyticsDisplay = text('');
analyticsDisplay.title = '📈 Prediction Confidence History';

function ensureChart() {
  if (chartCanvas) return;
  chartCanvas = document.createElement('canvas');
  chartCanvas.id = 'prediction-history-chart';
  chartCanvas.style.cssText = 'width:100%;max-height:300px;margin-top:12px;';

  const ChartJS = (window as unknown as Record<string, unknown>).Chart as {
    new(el: HTMLCanvasElement, config: unknown): unknown;
  };
  if (!ChartJS) return;

  chartInstance = new ChartJS(chartCanvas, {
    type: 'line',
    data: { labels: historyLabels, datasets: [] },
    options: {
      responsive: true,
      animation: false,
      scales: {
        y: {
          min: 0, max: 100,
          ticks: { callback: (v: number) => `${v}%` },
          title: { display: true, text: 'Confidence (%)' },
        },
        x: { title: { display: true, text: 'Predictions over time' } },
      },
      plugins: { legend: { position: 'bottom' } },
    },
  });

  // Inject canvas into analytics component via DOM (use correct Marcelle selectors)
  setTimeout(() => {
    document.querySelectorAll('.card').forEach(el => {
      if (el.textContent?.includes('Prediction Confidence History')) {
        const body = el.querySelector('.card-container') as HTMLElement | null;
        if (body && chartCanvas && !body.contains(chartCanvas)) body.appendChild(chartCanvas);
      }
    });
  }, 500);
}

const CLASS_COLORS = [
  'rgba(0,123,255,0.8)', 'rgba(220,53,69,0.8)', 'rgba(40,167,69,0.8)',
  'rgba(255,193,7,0.8)', 'rgba(111,66,193,0.8)', 'rgba(23,162,184,0.8)',
];

function pushChartData(confidences: Record<string, number>) {
  const ChartJS = (window as unknown as Record<string, unknown>).Chart;
  if (!ChartJS || !chartInstance) return;

  const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  historyLabels.push(now);
  if (historyLabels.length > CHART_MAX_POINTS) historyLabels.shift();

  const chart = chartInstance as {
    data: { labels: string[]; datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string; tension: number; pointRadius: number }[] };
    update: () => void;
  };

  Object.entries(confidences).forEach(([cls, conf]) => {
    let ds = chart.data.datasets.find(d => d.label === cls);
    if (!ds) {
      const colorIdx = chart.data.datasets.length % CLASS_COLORS.length;
      ds = {
        label: cls, data: [],
        borderColor: CLASS_COLORS[colorIdx],
        backgroundColor: CLASS_COLORS[colorIdx].replace('0.8', '0.1'),
        tension: 0.4, pointRadius: 3,
      };
      chart.data.datasets.push(ds);
    }
    ds.data.push(Math.round(conf * 100));
    if (ds.data.length > CHART_MAX_POINTS) ds.data.shift();
  });

  chart.update();
}

// ─── Prediction Engine ─────────────────────────────────────────────────────────
let predictionInterval: ReturnType<typeof setInterval> | null = null;

function updateResultUI(label: string, confidence: string, confidences: Record<string, number>) {
  const isGood = label.toLowerCase().includes('good') || label.toLowerCase().includes('correct');
  const accentColor = isGood ? '#28a745' : '#dc3545';
  const bgColor = isGood ? '#d4edda' : '#f8d7da';

  // Use Marcelle text component $value API directly (much more reliable than DOM selectors)
  predictionDisplay.$value.set(`
    <div style="text-align:center;padding:1.5rem;background:${bgColor};border-radius:12px;border-left:5px solid ${accentColor};animation:fadeIn 0.3s ease;">
      <div style="font-size:2.2rem;font-weight:700;color:${accentColor};">${label}</div>
      <div style="font-size:0.9rem;color:#8e8ea0;margin-top:4px;">${isGood ? '✅ Great form!' : '⚠️ Adjust your form'}</div>
    </div>`);

  confidenceDisplay.$value.set(`
    <div style="text-align:center;padding:1.2rem;background:#f8f9fa;border-radius:12px;border:2px solid ${accentColor};">
      <div style="font-size:3rem;font-weight:800;color:${accentColor};line-height:1;">${confidence}%</div>
      <div style="font-size:0.85rem;color:#8e8ea0;margin-top:4px;">model confidence</div>
    </div>`);

  const sorted = Object.entries(confidences).sort((a, b) => b[1] - a[1]);
  allClassesDisplay.$value.set(sorted.map(([cls, conf]) => {
    const pct = (conf * 100).toFixed(1);
    const isTop = cls === label;
    const barColor = cls.toLowerCase().includes('good') || cls.toLowerCase().includes('correct')
      ? 'linear-gradient(90deg,#28a745,#20c997)'
      : 'linear-gradient(90deg,#dc3545,#e83e8c)';
    return `
      <div style="margin:10px 0;padding:8px;background:${isTop ? '#f8f9fa' : 'transparent'};border-radius:8px;${isTop ? 'box-shadow:0 2px 8px rgba(0,0,0,0.07);' : ''}">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
          <span style="font-weight:${isTop ? 700 : 500};font-size:1rem;">${isTop ? '▶ ' : ''}${cls}</span>
          <span style="font-weight:600;color:#4361ee;">${pct}%</span>
        </div>
        <div style="background:#e9ecef;border-radius:6px;height:22px;overflow:hidden;">
          <div style="background:${barColor};height:100%;width:${pct}%;border-radius:6px;transition:width 0.4s ease;"></div>
        </div>
      </div>`;
  }).join(''));
}

predictionToggle.$checked.subscribe(async (enabled) => {
  console.log('🔮 Prediction toggle changed:', enabled);
  if (enabled) {
    ensureChart();
    console.log('🔮 Starting prediction interval...');
    predictionInterval = setInterval(async () => {
      try {
        // Step 1: Check webcam
        const isActive = input.$active?.value;
        const hasImages = !!input.$images?.value;
        if (!isActive || !hasImages) {
          console.log('🔮 Webcam not ready. active:', isActive, 'hasImages:', hasImages);
          return;
        }

        // Step 2: Get image and extract features
        const img = input.$images.value;
        console.log('🔮 Processing image for prediction...');
        const feats = await featureExtractor.process(img);
        console.log('🔮 Features extracted, length:', feats.length);

        // Step 3: Get training data
        const trainingItems = await trainingDataset.items().toArray();
        console.log('🔮 Training items:', trainingItems.length);
        if (trainingItems.length === 0) {
          console.warn('🔮 No training data available!');
          return;
        }

        // Step 4: Distance-weighted KNN (produces continuous confidence scores)
        const distances = trainingItems.map(item => {
          let sum = 0;
          const itemFeats = item.x as unknown as number[] | Float32Array;
          for (let i = 0; i < feats.length; i++) { const d = feats[i] - (itemFeats[i] || 0); sum += d * d; }
          return { distance: Math.sqrt(sum), label: item.y as string };
        });
        const K = Math.min(7, trainingItems.length);
        const nearest = distances.sort((a, b) => a.distance - b.distance).slice(0, K);

        // Inverse-distance weighting: closer neighbours have much more influence
        const EPSILON = 1e-6;
        const weightedVotes: Record<string, number> = {};
        nearest.forEach(n => {
          const weight = 1.0 / (n.distance + EPSILON);
          weightedVotes[n.label] = (weightedVotes[n.label] || 0) + weight;
        });

        // Softmax to get smooth probability distribution
        const allLabels = Object.keys(weightedVotes);
        const maxWeight = Math.max(...Object.values(weightedVotes));
        const expWeights: Record<string, number> = {};
        let expSum = 0;
        for (const lbl of allLabels) {
          const e = Math.exp((weightedVotes[lbl] - maxWeight) * 2); // scale factor for sharper distribution
          expWeights[lbl] = e;
          expSum += e;
        }

        const confidences: Record<string, number> = {};
        let predictedLabel = '', maxConf = 0;
        for (const lbl of allLabels) {
          confidences[lbl] = expWeights[lbl] / expSum;
          if (confidences[lbl] > maxConf) { maxConf = confidences[lbl]; predictedLabel = lbl; }
        }

        const confidencePct = (maxConf * 100).toFixed(1);
        console.log(`🎯 Prediction: ${predictedLabel} (${confidencePct}%)`);

        updateResultUI(predictedLabel, confidencePct, confidences);
        pushChartData(confidences);
        speak(predictedLabel);

        // FEATURE 8: Update therapist feedback panel with current prediction
        lastPredictedLabel = predictedLabel;
        lastPredictedFeats = feats;
        const isGoodPred = predictedLabel.toLowerCase().includes('good');
        const predColor = isGoodPred ? '#28a745' : '#dc3545';
        const exerciseLabels = Object.keys(exercisePresets).flatMap(ex => exercisePresets[ex]);
        const relabelOptions = exerciseLabels
          .filter(l => l !== predictedLabel)
          .map(l => `<button onclick="window.__therapistAction('relabel','${l}')" style="padding:6px 12px;margin:3px;border:1px solid #dee2e6;background:#fff;border-radius:6px;cursor:pointer;font-size:0.85rem;">${l}</button>`)
          .join('');
        const relabelVisible = showRelabelOptions ? 'block' : 'none';
        therapistFeedbackDisplay.$value.set(`
          <div style="padding:16px;background:#f8f9fa;border-radius:12px;border:2px solid ${predColor};">
            <div style="text-align:center;font-weight:700;font-size:1rem;margin-bottom:10px;color:${predColor};">Model says: ${predictedLabel} (${confidencePct}%)</div>
            <div style="text-align:center;font-size:0.9rem;color:#8e8ea0;margin-bottom:12px;">Is this correct?</div>
            <div style="display:flex;gap:10px;justify-content:center;margin-bottom:10px;">
              <button onclick="window.__therapistAction('correct','')" style="padding:10px 24px;border:none;background:#28a745;color:#fff;border-radius:8px;cursor:pointer;font-weight:700;font-size:1rem;">✅ Correct</button>
              <button onclick="window.__therapistAction('showRelabel','')" style="padding:10px 24px;border:none;background:#dc3545;color:#fff;border-radius:8px;cursor:pointer;font-weight:700;font-size:1rem;">❌ Wrong</button>
            </div>
            <div id="relabel-options" style="display:${relabelVisible};text-align:center;padding:8px;background:#fff;border-radius:8px;border:1px solid #dee2e6;">
              <div style="font-size:0.85rem;color:#8e8ea0;margin-bottom:6px;">Select the correct label:</div>
              ${relabelOptions}
            </div>
          </div>`);
        updateTherapistStats();
      } catch (err) {
        console.error('🔮 Prediction error:', err);
      }
    }, 800);
  } else {
    if (predictionInterval) { clearInterval(predictionInterval); predictionInterval = null; }
    predictionDisplay.$value.set('<div style="text-align:center;padding:2rem;color:#8e8ea0;font-size:1.1rem;">Enable the toggle to start predictions</div>');
    confidenceDisplay.$value.set('<div style="text-align:center;color:#8e8ea0;padding:1rem;">—</div>');
    allClassesDisplay.$value.set('');
    therapistFeedbackDisplay.$value.set(`
      <div style="text-align:center;padding:1.5rem;color:#8e8ea0;border:2px dashed #dee2e6;border-radius:12px;">
        <div style="font-size:1.1rem;font-weight:600;">🏋️ Coach Feedback</div>
        <div style="font-size:0.9rem;margin-top:6px;">Enable predictions to provide feedback on model accuracy</div>
      </div>`);
  }
});

// ─── FEATURE 8: Coach Feedback Handlers ─────────────────────────────────────────
function updateTherapistStats() {
  const total = therapistCorrectCount + therapistRelabelCount;
  if (total === 0) {
    therapistStatsDisplay.$value.set('');
    return;
  }
  therapistStatsDisplay.$value.set(`
    <div style="display:flex;gap:16px;justify-content:center;padding:10px;background:#f0f4ff;border-radius:10px;margin-top:8px;">
      <div style="text-align:center;"><div style="font-size:1.4rem;font-weight:700;color:#28a745;">${therapistCorrectCount}</div><div style="font-size:0.75rem;color:#8e8ea0;">Confirmed</div></div>
      <div style="text-align:center;"><div style="font-size:1.4rem;font-weight:700;color:#dc3545;">${therapistRelabelCount}</div><div style="font-size:0.75rem;color:#8e8ea0;">Corrected</div></div>
      <div style="text-align:center;"><div style="font-size:1.4rem;font-weight:700;color:#4361ee;">${total}</div><div style="font-size:0.75rem;color:#8e8ea0;">Total</div></div>
    </div>`);
}

(window as unknown as Record<string, unknown>).__therapistAction = async (action: string, value: string) => {
  if (!lastPredictedFeats) { showToast('No prediction available yet', 'warning'); return; }

  if (action === 'correct') {
    // Add current frame with predicted label as confirmed training data
    const thumbUrl = getVideoThumbnailDataUrl();
    await trainingDataset.create({ x: lastPredictedFeats, y: lastPredictedLabel, thumbnail: thumbUrl });
    therapistCorrectCount++;
    recordConfusion(lastPredictedLabel, lastPredictedLabel);
    updateSampleCount();
    updateTherapistStats();
    renderEvaluationDisplays();
    showToast(`✅ Confirmed: ${lastPredictedLabel}`, 'success', 2000);

    const total = therapistCorrectCount + therapistRelabelCount;
    if (total % 5 === 0) {
      showToast(`🧠 Model improved with ${total} coach-verified samples!`, 'info', 4000);
    }
  } else if (action === 'showRelabel') {
    // Toggle relabel options visibility via state flag
    showRelabelOptions = !showRelabelOptions;
    const el = document.getElementById('relabel-options');
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  } else if (action === 'relabel') {
    // Add with corrected label
    const thumbUrl = getVideoThumbnailDataUrl();
    await trainingDataset.create({ x: lastPredictedFeats, y: value, thumbnail: thumbUrl });
    therapistRelabelCount++;
    recordConfusion(lastPredictedLabel, value);
    updateSampleCount();
    updateTherapistStats();
    renderEvaluationDisplays();
    showToast(`✏️ Corrected to: ${value}`, 'warning', 2000);

    const total = therapistCorrectCount + therapistRelabelCount;
    if (total % 5 === 0) {
      showToast(`🧠 Model improved with ${total} coach-verified samples!`, 'info', 4000);
    }
    // Hide relabel options
    showRelabelOptions = false;
    const el = document.getElementById('relabel-options');
    if (el) el.style.display = 'none';
  }
};

// ─── Overview Page ─────────────────────────────────────────────────────────────
const welcomeHeader = text(`
<div style="text-align:center;padding:8px 0;">
  <div style="font-size:2rem;font-weight:800;letter-spacing:-0.5px;background:linear-gradient(135deg,#4361ee,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">IML PhysioCoach</div>
  <div style="font-size:1rem;color:#8e8ea0;margin-top:6px;">Train an AI model to provide real-time feedback on your exercise form using your webcam and machine learning.</div>
</div>
`);
welcomeHeader.title = '';

const howItWorksSection = text(`
<div style="font-size:1.1rem;font-weight:700;margin-bottom:10px;color:#1a1a2e;">⚙️ HOW IT WORKS</div>
<div style="color:#4a4a68;line-height:1.7;margin-bottom:12px;">
  This application uses <b>K-Nearest Neighbors (KNN)</b> machine learning to learn what "correct" and "incorrect" exercise form looks like from examples you provide. MobileNet extracts visual features from your webcam, and KNN classifies your form in real-time.
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
  <div style="padding:8px 12px;background:#eef2ff;border-radius:8px;border-left:3px solid #4361ee;">
    <b style="color:#4361ee;">Feature 1:</b> <span style="color:#1a1a2e;">On-screen predictions</span><br><small style="color:#8e8ea0;">Color-coded: green = good, red = bad form</small>
  </div>
  <div style="padding:8px 12px;background:#eef2ff;border-radius:8px;border-left:3px solid #4361ee;">
    <b style="color:#4361ee;">Feature 2:</b> <span style="color:#1a1a2e;">Confidence history chart</span><br><small style="color:#8e8ea0;">Live line chart on the Analytics tab</small>
  </div>
  <div style="padding:8px 12px;background:#eef2ff;border-radius:8px;border-left:3px solid #4361ee;">
    <b style="color:#4361ee;">Feature 3:</b> <span style="color:#1a1a2e;">Pose overlay</span><br><small style="color:#8e8ea0;">MoveNet skeleton drawn on webcam</small>
  </div>
  <div style="padding:8px 12px;background:#eef2ff;border-radius:8px;border-left:3px solid #4361ee;">
    <b style="color:#4361ee;">Feature 4:</b> <span style="color:#1a1a2e;">Audio feedback</span><br><small style="color:#8e8ea0;">Voice reads out your form label aloud</small>
  </div>
  <div style="padding:8px 12px;background:#eef2ff;border-radius:8px;border-left:3px solid #4361ee;">
    <b style="color:#4361ee;">Feature 5:</b> <span style="color:#1a1a2e;">Save &amp; load dataset</span><br><small style="color:#8e8ea0;">Persist your training data between sessions</small>
  </div>
  <div style="padding:8px 12px;background:#eef2ff;border-radius:8px;border-left:3px solid #4361ee;">
    <b style="color:#4361ee;">Feature 6:</b> <span style="color:#1a1a2e;">Exercise presets</span><br><small style="color:#8e8ea0;">Squat, Bicep Curl, Shoulder Press, Plank, Lunge</small>
  </div>
  <div style="padding:8px 12px;background:#eef2ff;border-radius:8px;border-left:3px solid #4361ee;">
    <b style="color:#4361ee;">Feature 7:</b> <span style="color:#1a1a2e;">Auto-capture + Review</span><br><small style="color:#8e8ea0;">Hands-free data collection with quality control</small>
  </div>
  <div style="padding:8px 12px;background:#eef2ff;border-radius:8px;border-left:3px solid #4361ee;">
    <b style="color:#4361ee;">Feature 8:</b> <span style="color:#1a1a2e;">Coach feedback loop</span><br><small style="color:#8e8ea0;">Confirm or correct predictions (active learning)</small>
  </div>
  <div style="padding:8px 12px;background:#f3eeff;border-radius:8px;border-left:3px solid #7c3aed;grid-column:1 / -1;">
    <b style="color:#7c3aed;">Feature 9:</b> <span style="color:#1a1a2e;">Evaluation metrics</span><br><small style="color:#8e8ea0;">Confusion matrix, precision/recall/F1 from coach feedback + Leave-One-Out cross-validation to assess training data quality</small>
  </div>
</div>
`);
howItWorksSection.title = '';

const trainingSteps = text(`
<div style="font-size:1.1rem;font-weight:700;margin-bottom:10px;color:#1a1a2e;">📋 WORKFLOW</div>

<div style="margin-bottom:14px;padding:12px;background:#f0faf0;border-radius:8px;border-left:3px solid #28a745;">
  <div style="font-weight:700;color:#28a745;margin-bottom:4px;">1 · Manual Capture</div>
  <div style="color:#1a1a2e;font-size:0.9rem;">Select exercise → choose label → 📸 capture samples → 🎓 Train Model</div>
</div>

<div style="margin-bottom:14px;padding:12px;background:#fff8e6;border-radius:8px;border-left:3px solid #ff9800;">
  <div style="font-weight:700;color:#ff9800;margin-bottom:4px;">2 · Auto-Capture with Review</div>
  <div style="color:#1a1a2e;font-size:0.9rem;">
    Select exercise &amp; label → ▶ Start Auto-Capture (every 2.5s) → go to <b>Review</b> tab → approve/reject/relabel each sample → 🎓 Train → go to Results
  </div>
</div>

<div style="margin-bottom:14px;padding:12px;background:#fde8e8;border-radius:8px;border-left:3px solid #dc3545;">
  <div style="font-weight:700;color:#dc3545;margin-bottom:4px;">3 · Coach Feedback (Active Learning)</div>
  <div style="color:#1a1a2e;font-size:0.9rem;">
    On the <b>Results</b> tab with predictions running, click ✅ Correct or ❌ Wrong → select the right label. Corrections feed back into training data automatically.
  </div>
</div>

<div style="margin-bottom:14px;padding:12px;background:#f3eeff;border-radius:8px;border-left:3px solid #7c3aed;">
  <div style="font-weight:700;color:#7c3aed;margin-bottom:4px;">4 · Evaluate Your Model</div>
  <div style="color:#1a1a2e;font-size:0.9rem;">
    Go to the <b>Evaluation</b> tab to see accuracy, confusion matrix, precision/recall/F1 from coach feedback. Click <b>🧪 Run Leave-One-Out CV</b> to test how well the training data separates your classes.
  </div>
</div>
`);
trainingSteps.title = '';

const tabGuide = text(`
<div style="font-size:1.1rem;font-weight:700;margin-bottom:10px;color:#1a1a2e;">🗂️ TAB GUIDE</div>
<table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
  <tr style="background:#f8f9fa;"><td style="padding:8px;font-weight:700;border:1px solid #dee2e6;">Training</td><td style="padding:8px;border:1px solid #dee2e6;">Capture samples, select exercises, train the KNN model, save/load datasets</td></tr>
  <tr><td style="padding:8px;font-weight:700;border:1px solid #dee2e6;">Review</td><td style="padding:8px;border:1px solid #dee2e6;">Quality-check auto-captured samples before they enter training data</td></tr>
  <tr style="background:#f8f9fa;"><td style="padding:8px;font-weight:700;border:1px solid #dee2e6;">Results</td><td style="padding:8px;border:1px solid #dee2e6;">Live predictions, pose overlay, audio feedback, coach feedback buttons</td></tr>
  <tr><td style="padding:8px;font-weight:700;border:1px solid #dee2e6;">Analytics</td><td style="padding:8px;border:1px solid #dee2e6;">Confidence history chart showing prediction trends over time</td></tr>
  <tr style="background:#f3eeff;"><td style="padding:8px;font-weight:700;border:1px solid #dee2e6;color:#7c3aed;">Evaluation</td><td style="padding:8px;border:1px solid #dee2e6;">Accuracy, confusion matrix, precision/recall/F1, leave-one-out CV</td></tr>
</table>
`);
tabGuide.title = '';

const tipsSection = text(`
<div style="font-size:1.1rem;font-weight:700;margin-bottom:10px;color:#1a1a2e;">💡 PRO TIPS</div>
<div style="color:#4a4a68;font-size:0.9rem;line-height:1.8;">
  ✦ Capture <b>at least 10–15 samples per class</b> for reliable predictions<br>
  ✦ Vary your position and angle slightly between captures for robustness<br>
  ✦ Use <b>Auto-Capture</b> for faster data collection, then <b>Review</b> to clean it<br>
  ✦ The <b>coach feedback loop</b> continuously improves accuracy over time<br>
  ✦ Check the <b>Evaluation</b> tab for confusion matrix, precision, recall and F1<br>
  ✦ <b>Save your dataset</b> before closing the browser to avoid losing progress
</div>
`);
tipsSection.title = '';

dash.page('Overview').use(welcomeHeader, howItWorksSection, trainingSteps, tabGuide, tipsSection);

// ─── Training Page ─────────────────────────────────────────────────────────────
dash
  .page('Training')
  .sidebar(input, label)
  .use(
    exerciseSelectorDisplay,
    labelsDisplay,
    captureButton,
    autoCapButton, autoCapStatusDisplay,
    trainButton, clearButton,
    saveButton, loadButton, deleteSavedButton,
    sampleCountDisplay,
    trainingSetBrowser,
  );

// ─── Review Page (Feature 7) ──────────────────────────────────────────────────
dash
  .page('Review')
  .use(
    reviewStatsDisplay,
    reviewDisplay,
    approveAllButton,
  );

// ─── Results Page ──────────────────────────────────────────────────────────────
dash
  .page('Results')
  .sidebar(input)
  .use(
    predictionToggle,
    audioToggle,
    poseToggle,
    predictionDisplay,
    confidenceDisplay,
    allClassesDisplay,
    therapistFeedbackDisplay,
    therapistStatsDisplay,
  );

// ─── Analytics Page ────────────────────────────────────────────────────────────
dash.page('Analytics').use(analyticsDisplay);

// ─── Evaluation Page (Feature 9) ──────────────────────────────────────────────
dash
  .page('Evaluation')
  .use(
    evaluationOverviewDisplay,
    confusionMatrixDisplay,
    perClassMetricsDisplay,
  );

// ─── Show Dashboard ────────────────────────────────────────────────────────────
dash.show();

// Ensure chart canvas is injected once the analytics tab is visited
document.addEventListener('click', () => {
  setTimeout(() => {
    // Chart injection for Analytics tab
    document.querySelectorAll('.card').forEach(el => {
      if (el.textContent?.includes('Prediction Confidence History')) {
        const body = el.querySelector('.card-container') as HTMLElement | null;
        if (body && chartCanvas && !body.contains(chartCanvas)) {
          body.appendChild(chartCanvas);
        }
      }
    });
    // Re-render review gallery when Review tab is visited
    if (window.location.hash === '#review') {
      renderReviewGallery();
    }
  }, 200);
});

console.log('🎉 Enhanced Physiotherapy Coach ready! All 9 features loaded (incl. Evaluation Metrics).');
