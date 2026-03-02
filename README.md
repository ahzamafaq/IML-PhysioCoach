# 🏋️ IML PhysioCoach

> An Interactive Machine Learning web application for real-time exercise form classification using your webcam — no server, no setup, just open and train.

---

## What is IML PhysioCoach?

IML PhysioCoach is a browser-based **Interactive Machine Learning (IML)** application built for the IML course project. It lets you train a personalized AI model to recognize whether you are performing an exercise with **good or bad form** — all in real time, directly from your webcam feed.

Unlike traditional ML systems where a model is pre-trained and fixed, IML PhysioCoach puts **you** in the loop. You teach the model by providing labelled examples, watch it learn instantly, and correct its mistakes to continuously improve it. No cloud, no GPU, no latency — everything runs in your browser.

---

## How It Works

The application is built on a two-stage ML pipeline:

```
Webcam → MobileNet (feature extraction) → KNN Classifier → Real-time Prediction
```

1. **MobileNet** — A pre-trained CNN (transfer learning) converts each webcam frame into a compact 1024-dimensional feature vector that captures the visual structure of your pose.
2. **K-Nearest Neighbors (KNN)** — A lightweight, interpretable classifier that trains instantly by storing your labelled examples and finds the closest match at prediction time.

This combination means the model trains in **milliseconds**, works with as few as **5–10 examples per class**, and updates the moment you add or remove a sample.

---

## Features

| Feature | Description |
|---|---|
| 🎯 **Real-time Predictions** | Color-coded live predictions (green = good form, red = bad form) with animated confidence display |
| 🦴 **Pose Overlay** | MoveNet skeleton overlay drawn on the webcam feed to visualize detected joint positions |
| 🔊 **Audio Feedback** | Browser speech synthesis reads the prediction aloud so you can focus on your form |
| 📸 **Auto-Capture** | Hands-free data collection at 2.5s intervals — captures while you hold a pose |
| 🔍 **Review Tab** | Quality-control step: approve, relabel, or reject auto-captured samples before they enter the training set |
| 🏋️ **Coach Feedback Loop** | Confirm or correct predictions on the Results tab — corrections become new training data (active learning) |
| 📊 **Evaluation Metrics** | Live confusion matrix, per-class precision, recall, and F1 score — all updated from coach feedback |
| 📈 **Confidence Chart** | Real-time line chart showing prediction confidence history over time |
| 💾 **Save / Load Dataset** | Persist your training data in browser localStorage and reload it across sessions |
| ➕ **Custom Exercises** | Add any exercise dynamically beyond the 5 built-in presets — auto-generates Good/Bad labels |

---

## Built-in Exercises

The app comes with 5 pre-configured exercises, each with Good/Bad label pairs:

- 🏋️ Squat
- 💪 Bicep Curl
- 🙆 Shoulder Press
- 🪨 Plank
- 🚶 Lunge

You can also add your own — type any exercise name (e.g., "Deadlift") and the app auto-creates the labels.

---

## Use Cases

- **Personal fitness** — Get instant feedback on your form while training alone at home
- **Physical therapy** — Monitor exercise compliance and form quality during rehabilitation
- **Sports coaching** — Quickly build a custom model for any sport-specific movement
- **ML education** — Understand how Interactive ML, transfer learning, and active learning work hands-on
- **Research** — A prototype for human-in-the-loop data annotation and model refinement

---

## Tech Stack

| Technology | Role |
|---|---|
| [Marcelle.js](https://marcelle.dev) | IML framework — reactive UI components, webcam, KNN, dataset |
| MobileNet (TensorFlow.js) | Transfer learning for visual feature extraction |
| MoveNet (TensorFlow.js) | Real-time pose estimation (17 keypoints) |
| Chart.js | Confidence history visualization |
| Web Speech API | Audio feedback (no external library) |
| Vite + TypeScript | Build tooling and type safety |
| Svelte | Marcelle's internal UI rendering |
| LocalStorage | Clientside dataset persistence |

---

## Getting Started

### Prerequisites
- Node.js (v16 or newer)
- A webcam

### Installation

```bash
# Clone the repo
git clone https://github.com/ahzamafaq/IML-PhysioCoach.git
cd IML-PhysioCoach

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Workflow

1. **Training tab** → Select an exercise, activate webcam, and capture good and bad form examples
2. **Review tab** → Approve or reject auto-captured samples for quality control
3. **Training tab** → Click "Train Model" to build the classifier
4. **Results tab** → Enable predictions and use Coach Mode to correct mistakes
5. **Evaluation tab** → View the confusion matrix and precision/recall/F1 metrics
6. **Analytics tab** → Monitor prediction confidence over time

---

## Project Structure

```
IML-PhysioCoach/
├── index.html          # Entry point + CDN scripts (TF.js, MoveNet, Chart.js)
├── package.json        # Dependencies
├── src/
│   ├── index.ts        # All application logic
│   └── style.css       # Custom design system
├── vite.config.ts      # Build config
└── tsconfig.json       # TypeScript config
```

---

## License

MIT — free to use, modify, and distribute.
