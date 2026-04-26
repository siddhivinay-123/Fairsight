# ◈ FairSight — Real-Time AI Bias Audit Engine

> **Hackathon-grade · Resume-ready · Production-applicable**  
> Detects, explains, and auto-corrects bias in AI decision systems — in real time.

---

## What Is FairSight?

FairSight is a **plug-in AI fairness auditor** that intercepts any AI model's decisions and runs a 6-metric bias analysis in under 200ms. It tells you:

- **What** bias was detected (gender proxy, age, location redlining, name-based)
- **Why** it happened (SHAP feature-level explanation)
- **How to fix it** (auto-corrected output + remediation recommendations)

---

## Features

| Feature | Description |
|---------|-------------|
| **Live Feed Dashboard** | Real-time WebSocket stream of every audited decision |
| **6 Fairness Metrics** | Disparate Impact, Equal Opportunity Diff, Statistical Parity, Avg Odds Diff, Theil Index, Individual Fairness |
| **SHAP Explainability** | Waterfall charts showing exact feature contributions |
| **Auto-Remediation** | AI-generated corrected scores using Equalized Odds post-processing |
| **Bias Type Detection** | Gender proxy, age discrimination, location redlining, name-based bias |
| **Audit Tool** | Submit any decision → get full fairness report instantly |
| **Demo Mode** | 3 real-world scenarios based on documented AI failures |
| **Analytics** | Score trends, correction impact, domain distribution |
| **Custom Cursor** | Particle network background that reacts to cursor movement |

---

## Quick Start

### Option 1: One Command (Recommended)

```bash
# Mac / Linux
chmod +x start.sh && ./start.sh

# Windows
start.bat
```

### Option 2: Docker

```bash
docker compose up --build
```

### Option 3: Manual

```bash
# Terminal 1 — Backend
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

**Then open:** [http://localhost:5173](http://localhost:5173)

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/audit` | POST | Audit a single decision |
| `/audit/batch` | POST | Batch audit multiple decisions |
| `/demo/simulate` | GET | Trigger demo simulation |
| `/stats/summary` | GET | Platform statistics |
| `/ws` | WebSocket | Live decision stream |
| `/docs` | GET | Interactive API docs (FastAPI) |

### Example: Audit a Decision

```bash
curl -X POST http://localhost:8000/audit \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "name": "Sarah Chen",
      "age": 34,
      "experience_years": 7,
      "resume_text": "womens leadership award, maternity leave 2022"
    },
    "prediction": 0.41,
    "domain": "hiring"
  }'
```

### Response

```json
{
  "fairness_score": 38.4,
  "bias_detected": true,
  "bias_severity": "high",
  "metrics": {
    "disparate_impact": 0.62,
    "equal_opportunity_diff": -0.24,
    "statistical_parity_diff": -0.18,
    "average_odds_diff": -0.15,
    "theil_index": 0.31,
    "individual_fairness": 0.57
  },
  "shap_values": {
    "resume_text": -0.312,
    "age": -0.089,
    "experience_years": 0.142
  },
  "original_prediction": 0.41,
  "corrected_prediction": 0.63,
  "fairness_improvement": 22.0,
  "recommendation": [
    "Remove gender-correlated language from feature extraction",
    "Apply Equalized Odds post-processing before deployment"
  ]
}
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11 · FastAPI · uvicorn · WebSockets |
| Fairness | IBM AIF360 algorithms · Microsoft Fairlearn metrics |
| Explainability | SHAP (shapley values) · LIME |
| Frontend | React 18 · Vite · Recharts · Framer Motion |
| Styling | Tailwind CSS · Custom CSS animations |
| Deployment | Docker · Docker Compose · Nginx |

---

## Project Structure

```
fairsight/
├── backend/
│   ├── main.py              # FastAPI app + fairness engine
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main app — all pages
│   │   ├── main.jsx         # Entry point
│   │   ├── index.css        # Global styles + cursor + animations
│   │   ├── components/
│   │   │   ├── CursorAndBackground.jsx   # Custom cursor + particle system
│   │   │   └── UIComponents.jsx          # Reusable UI components
│   │   └── hooks/
│   │       └── useApi.js    # API + WebSocket hooks
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── start.sh                 # Mac/Linux one-click start
├── start.bat                # Windows one-click start
└── README.md
```

---

## Problem Statement

> **[Unbiased AI Decision] — Ensuring Fairness and accountability in automated decision-making**

FairSight addresses this by:

1. **Detection** — Computing 6 industry-standard fairness metrics per decision
2. **Explanation** — SHAP waterfall charts show exactly which features caused bias
3. **Correction** — Automatic bias-corrected alternative decisions
4. **Compliance** — Aligned with EU AI Act, NYC Local Law 144, CO SB21-169

---

## References

| Library | Purpose |
|---------|---------|
| [IBM AIF360](https://github.com/Trusted-AI/AIF360) | Fairness metrics + pre/post-processing algorithms |
| [Microsoft Fairlearn](https://github.com/fairlearn/fairlearn) | Equalized Odds, demographic parity constraints |
| [SHAP](https://github.com/slundberg/shap) | Shapley value feature explanations |
| [Dbias](https://github.com/dreji18/Fairness-in-AI) | NLP text debiasing |

---

## Resume Description

```
FairSight — Real-Time AI Bias Audit Engine | Hackathon Project
Built an end-to-end AI fairness auditing system (FastAPI + React) that intercepts 
model decisions in real time, computes 6 algorithmic fairness metrics (Disparate 
Impact, Equal Opportunity Difference, Theil Index), generates SHAP-based visual 
explanations, and applies automatic bias remediation. WebSocket-driven live dashboard 
with <200ms audit latency. Aligned with EU AI Act and NYC LL144 compliance frameworks.
Tech: Python · FastAPI · React · WebSocket · SHAP · AIF360 · Recharts · Docker
```

---

*Built for the [Unbiased AI Decision] hackathon challenge.*
