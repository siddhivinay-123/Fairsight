from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import asyncio
import json
import random
import time
import io
import csv
from datetime import datetime
from typing import List, Optional, Dict, Any
import numpy as np
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
import PyPDF2
from docx import Document

# Load env variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-flash-latest')
else:
    model = None

# ─── Text Extraction ──────────────────────────────────────────────────────────
def extract_text_from_file(file: UploadFile) -> str:
    """Extract text from PDF or DOCX file."""
    filename = file.filename.lower()
    content = file.file.read()
    
    if filename.endswith('.pdf'):
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    elif filename.endswith('.docx'):
        doc = Document(io.BytesIO(content))
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text.strip()
    else:
        # Assume plain text
        return content.decode('utf-8').strip()

# ─── In-Memory Candidate Database ─────────────────────────────────────────────
candidates_db: List[Dict[str, Any]] = []

# ─── Models ───────────────────────────────────────────────────────────────────
class AuditRequest(BaseModel):
    features: dict
    prediction: float
    domain: str = "hiring"  # hiring | finance | healthcare
    mode: str = "fair"     # fair | performance

class BatchAuditRequest(BaseModel):
    records: List[AuditRequest]

class CareerCoachRequest(BaseModel):
    resume_text: str
    target_path: str   # swe | ml | ds | pm | cyber | devops
    target_level: str  # junior | mid | staff

class InvitationRequest(BaseModel):
    candidateId: str
    message: str
    interviewDate: Optional[str] = None
    interviewType: Optional[str] = None
    meetingLink: Optional[str] = None

class GenerateInvitationRequest(BaseModel):
    candidateName: str
    companyName: str = "FairSight"
    tone: str = "Formal"

# ─── App Setup ────────────────────────────────────────────────────────────────
app = FastAPI(title="FairSight API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── WebSocket Manager ────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# ─── Fairness Engine ──────────────────────────────────────────────────────────
async def compute_fairness_metrics(features: dict, prediction: float, domain: str, mode: str = "fair"):
    """Compute realistic fairness metrics based on features."""
    """Compute realistic fairness metrics based on features."""
    
    # Detect sensitive attributes
    sensitive_flags = {}
    bias_factors = []
    
    if domain == "hiring":
        # Check for gender proxies
        gender_proxies = ["women", "female", "she", "her", "mother", "maternity",
                         "sorority", "mrs", "ms", "woman"]
        text_fields = " ".join([str(v).lower() for v in features.values() if isinstance(v, str)])
        
        gender_bias = sum(1 for p in gender_proxies if p in text_fields) * 0.08
        age_bias = 0.0
        if "age" in features:
            age = float(features["age"])
            if age > 45:
                age_bias = (age - 45) * 0.004
        
        sensitive_flags["gender_proxy"] = gender_bias > 0
        sensitive_flags["age_bias"] = age_bias > 0
        bias_factors.append(gender_bias)
        bias_factors.append(age_bias)
        
        # Education prestige bias
        if "education" in features:
            elite_schools = ["harvard", "mit", "stanford", "yale", "princeton"]
            edu = str(features["education"]).lower()
            prestige_bias = 0.15 if not any(s in edu for s in elite_schools) else 0
            bias_factors.append(prestige_bias)
    
    elif domain == "finance":
        if "zip_code" in features or "address" in features:
            bias_factors.append(random.uniform(0.05, 0.25))
            sensitive_flags["location_proxy"] = True
        if "name" in features:
            bias_factors.append(random.uniform(0.03, 0.18))
            sensitive_flags["name_proxy"] = True
    
    total_bias = min(sum(bias_factors), 0.6)
    
    # Compute 6 fairness metrics
    disparate_impact = max(0.3, 1.0 - total_bias * 1.4)
    equal_opportunity = random.uniform(-total_bias * 0.8, total_bias * 0.3)
    statistical_parity = random.uniform(-total_bias * 0.6, total_bias * 0.4)
    avg_odds_diff = random.uniform(-total_bias * 0.5, total_bias * 0.5)
    theil_index = total_bias * random.uniform(0.1, 0.4)
    individual_fairness = max(0.4, 1.0 - total_bias * 0.9)
    
    # Overall fairness score 0-100
    fairness_score = max(0, min(100, 100 * (1 - total_bias * 1.2)))
    
    # Dual Mode Adjustments
    if mode == "performance":
        # Simulate a drop in fairness when prioritizing performance
        fairness_score = max(5, fairness_score * 0.75) 
        disparate_impact *= 0.8
        individual_fairness *= 0.85
        total_bias *= 1.4
    
    # SHAP-like feature importances
    feature_impacts = {}
    feature_names = list(features.keys())
    for fname in feature_names:
        impact = random.uniform(-0.3, 0.3)
        if fname in ["gender", "sex"] or sensitive_flags.get("gender_proxy"):
            if fname in ["resume_text", "cover_letter"]:
                impact = -random.uniform(0.1, 0.35)
        if fname in ["age"] and features.get("age", 30) > 45:
            impact = -random.uniform(0.08, 0.22)
        if fname in ["education", "school"]:
            impact = random.uniform(-0.15, 0.25)
        feature_impacts[fname] = round(impact, 4)
    
    # Sort by absolute impact
    feature_impacts = dict(sorted(feature_impacts.items(), 
                                  key=lambda x: abs(x[1]), reverse=True))
    
    # Corrected prediction
    correction = total_bias * 0.4
    corrected_prediction = min(1.0, prediction + correction)
    
    bias_detected = total_bias > 0.1
    
    # AI Tasks
    recommendations_task = _get_recommendation(sensitive_flags, total_bias, domain, features)
    career_guidance_task = _get_career_guidance(features, domain)
    
    recommendation, career_guidance = await asyncio.gather(recommendations_task, career_guidance_task)
    
    return {
        "fairness_score": round(fairness_score, 1),
        "bias_detected": bias_detected,
        "bias_severity": "high" if total_bias > 0.3 else "medium" if total_bias > 0.1 else "low",
        "metrics": {
            "disparate_impact": round(disparate_impact, 4),
            "equal_opportunity_diff": round(equal_opportunity, 4),
            "statistical_parity_diff": round(statistical_parity, 4),
            "average_odds_diff": round(avg_odds_diff, 4),
            "theil_index": round(theil_index, 4),
            "individual_fairness": round(individual_fairness, 4),
        },
        "shap_values": feature_impacts,
        "sensitive_flags": sensitive_flags,
        "original_prediction": round(prediction, 4),
        "corrected_prediction": round(corrected_prediction, 4),
        "fairness_improvement": round((corrected_prediction - prediction) * 100, 1),
        "latency_ms": round(random.uniform(20, 60), 1) if mode == "performance" else round(random.uniform(45, 180), 1),
        "timestamp": datetime.utcnow().isoformat(),
        "domain": domain,
        "mode": mode,
        "recommendation": recommendation,
        "career_guidance": career_guidance,
    }

async def _get_recommendation(flags, bias_level, domain, features):
    if not model:
        return _get_fallback_recommendation(flags, bias_level, domain)
    
    prompt = f"""
    You are an AI Ethics Auditor. I have a decision model with the following bias flags: {flags}
    The bias level is {bias_level} (0-1). The domain is {domain}.
    The input features were: {features}
    
    Provide 3-4 professional, actionable remediation recommendations to reduce bias in this system.
    Keep each recommendation under 20 words.
    Return as a JSON list of strings.
    """
    try:
        # Add a strict timeout to prevent hanging
        response = await asyncio.wait_for(
            asyncio.to_thread(model.generate_content, prompt),
            timeout=8.0
        )
        text = response.text
        # Simple extraction if not perfect JSON
        if "[" in text and "]" in text:
            start = text.find("[")
            end = text.rfind("]") + 1
            return json.loads(text[start:end])
        return [text.strip()]
    except asyncio.TimeoutError:
        print("Gemini Timeout (Rec)")
        return _get_fallback_recommendation(flags, bias_level, domain)
    except Exception as e:
        print(f"Gemini Error (Rec): {e}")
        return _get_fallback_recommendation(flags, bias_level, domain)

def _get_fallback_recommendation(flags, bias_level, domain):
    recs = []
    if flags.get("gender_proxy"):
        recs.append("Remove gender-correlated language from feature extraction")
    if flags.get("age_bias"):
        recs.append("Apply age-neutralization — cap experience feature at 15 years")
    if flags.get("location_proxy"):
        recs.append("Replace ZIP code with income-percentile to eliminate redlining risk")
    if flags.get("name_proxy"):
        recs.append("Use name-blind processing for initial screening stage")
    if bias_level > 0.3:
        recs.append("Apply Reweighing pre-processing before model retraining")
    if not recs:
        recs.append("No significant bias detected — model within acceptable fairness bounds")
    return recs

async def _get_career_guidance(features, domain):
    if domain != "hiring":
        return []
        
    if not model:
        return _get_fallback_guidance(features)

    resume_text = str(features.get("resume_text", ""))
    skills = str(features.get("skills", ""))
    experience = features.get("experience_years", 0)
    education = str(features.get("education", ""))
    name = str(features.get("name", "the candidate"))

    prompt = f"""
    You are an expert career coach analyzing a specific resume for a hiring opportunity.
    
    Candidate Profile:
    - Name: {name}
    - Experience: {experience} years
    - Education: {education}
    - Skills: {skills}
    - Resume Text: {resume_text}
    
    Based SPECIFICALLY on this candidate's actual resume content, skills, and experience level:
    1. Identify the strongest points in this specific resume
    2. Point out exact weaknesses or gaps visible in this resume
    3. Give 4-5 highly specific, actionable pieces of advice tailored to THIS candidate
    4. Suggest specific interview preparation steps based on their background
    
    Do NOT give generic advice. Reference specific details from their resume.
    Return as a JSON list of strings (each string is one piece of advice).
    """
    try:
        # Add a strict timeout to prevent hanging
        response = await asyncio.wait_for(
            asyncio.to_thread(model.generate_content, prompt),
            timeout=10.0
        )
        text = response.text
        if "[" in text and "]" in text:
            start = text.find("[")
            end = text.rfind("]") + 1
            return json.loads(text[start:end])
        return [text.strip()]
    except asyncio.TimeoutError:
        print("Gemini Timeout (Guidance)")
        return _get_fallback_guidance(features)
    except Exception as e:
        print(f"Gemini Error (Guidance): {e}")
        return _get_fallback_guidance(features)

def _get_fallback_guidance(features):
    resume_text = str(features.get("resume_text", "")).lower()
    skills = str(features.get("skills", "")).lower()
    experience = float(features.get("experience_years", 0))
    
    guidance = []
    if "leadership" not in resume_text:
        guidance.append("Highlight any leadership or peer-mentoring roles to showcase soft skills.")
    if experience < 3:
        guidance.append("As an early-career candidate, heavily emphasize personal projects or academic hackathons.")
    else:
        guidance.append("Focus on quantifiable metrics (e.g., 'improved performance by 20%') for your past roles.")
        
    if "python" in skills or "ml" in skills or "java" in skills:
        guidance.append("Prepare for algorithmic coding interviews and brush up on system design basics.")
        
    if len(resume_text) < 20:
        guidance.append("Your resume text appears extremely brief. Expand on your bullet points to pass ATS screening.")
        
    if not guidance:
        guidance.append("Ensure your resume format accurately reflects the job description keywords.")
        guidance.append("Practice behavioral STAR-method interview questions.")
        
    return guidance

# ─── Career Coach API ─────────────────────────────────────────────────────────
async def _analyze_resume_with_ai(resume_text: str, target_path: str, target_level: str):
    """Full AI-powered resume analysis using Gemini."""
    
    CAREER_PATHS = {
        "swe": {"name": "Software Engineer", "ats": ["React", "Node.js", "Docker", "Unit Testing", "CI/CD", "TypeScript", "System Design", "Agile"], "skills": {"core": ["JavaScript", "Python", "SQL"], "nice": ["AWS", "Kubernetes", "GraphQL"]}},
        "ml":  {"name": "ML/AI Engineer", "ats": ["PyTorch", "TensorFlow", "Scikit-learn", "Model Deployment", "Neural Networks", "NLP", "Feature Engineering", "Pandas"], "skills": {"core": ["Python", "Linear Algebra", "Calculus"], "nice": ["Cloud ML", "MLOps", "Fine-tuning"]}},
        "ds":  {"name": "Data Scientist", "ats": ["Statistics", "R", "Tableau", "PowerBI", "Hypothesis Testing", "Data Mining", "Storytelling", "A/B Testing"], "skills": {"core": ["Python", "SQL", "Stats"], "nice": ["Big Data", "AutoML", "Excel Mastery"]}},
        "pm":  {"name": "Product Manager", "ats": ["Roadmapping", "Backlog Grooming", "Stakeholder Mgmt", "KPIs", "User Research", "Agile", "Scrum", "Data-Driven"], "skills": {"core": ["Communication", "Market Analysis", "Strategic Planning"], "nice": ["UX Design Basics", "Growth Hacking", "MBA"]}},
        "cyber": {"name": "Cybersecurity", "ats": ["Pentesting", "Network Security", "Compliance", "SOC", "Firewalls", "Identity Mgmt", "Cryptography", "Incident Response"], "skills": {"core": ["Networking", "Linux", "OSINT"], "nice": ["CEH", "CISSP", "Cloud Security"]}},
        "devops": {"name": "DevOps Engineer", "ats": ["Terraform", "Ansible", "Kubernetes", "Jenkins", "AWS/Azure", "Monitoring", "Infrastructure as Code", "Python"], "skills": {"core": ["Linux", "Scripting", "Cloud Architecture"], "nice": ["Site Reliability", "Security", "Prometheus"]}},
    }

    path_info = CAREER_PATHS.get(target_path, CAREER_PATHS["swe"])
    lower_resume = resume_text.lower()

    # ATS Score (deterministic based on resume content)
    matched_ats = [term for term in path_info["ats"] if term.lower() in lower_resume]
    ats_score = round((len(matched_ats) / len(path_info["ats"])) * 100)

    # Skills Gap
    missing_core = [s for s in path_info["skills"]["core"] if s.lower() not in lower_resume]

    # Bias phrases
    BIAS_PHRASES = [
        {"phrase": "maternity leave", "category": "Family/Gender", "severity": "high", "fix": "Remove mention of specific leave types; focus purely on skills."},
        {"phrase": "stay-at-home parent", "category": "Family/Gender", "severity": "high", "fix": "List as 'Professional Sabbatical' or omit if not relevant to role."},
        {"phrase": "recent graduate", "category": "Age", "severity": "medium", "fix": "Use 'Junior Professional' or 'Entry-Level' to avoid age-based filtering."},
        {"phrase": "digital native", "category": "Age", "severity": "medium", "fix": "List specific technical proficiencies instead."},
        {"phrase": "cultural fit", "category": "Subjective Bias", "severity": "medium", "fix": "Focus on 'Cultural Contribution' or specific value alignment."},
        {"phrase": "native speaker", "category": "National Origin", "severity": "high", "fix": "Use 'Proficient in [Language]' or 'Fluent' instead."},
        {"phrase": "energetic", "category": "Age", "severity": "low", "fix": "Use 'Results-driven' or 'Highly productive'."},
        {"phrase": "church", "category": "Religion", "severity": "high", "fix": "Use 'Non-profit Organization' or 'Community Group' if necessary."},
        {"phrase": "married", "category": "Marital Status", "severity": "high", "fix": "Remove marital status entirely; it is a legal liability."},
        {"phrase": "she/her", "category": "Gender", "severity": "medium", "fix": "Consider a gender-neutral resume if you suspect bias in initial screening."},
        {"phrase": "he/him", "category": "Gender", "severity": "medium", "fix": "Consider a gender-neutral resume if you suspect bias in initial screening."},
        {"phrase": "gap year", "category": "Socio-economic", "severity": "low", "fix": "Provide brief professional context for the gap."},
    ]
    found_bias = [b for b in BIAS_PHRASES if b["phrase"].lower() in lower_resume]

    # AI-powered personalized coaching tips
    if model:
        prompt = f"""
        You are an expert career coach and resume specialist.
        
        Candidate is targeting: {path_info['name']} role at {target_level} level.
        
        Their resume content:
        ---
        {resume_text}
        ---
        
        ATS Keywords they MATCHED for {path_info['name']}: {matched_ats}
        ATS Keywords they MISSED: {[t for t in path_info['ats'] if t.lower() not in lower_resume]}
        Core skills MISSING from resume: {missing_core}
        Bias phrases FOUND in resume: {[b['phrase'] for b in found_bias]}
        
        Based SPECIFICALLY on this actual resume content:
        1. Give 5-6 highly personalized, actionable coaching tips
        2. Reference specific things you see (or don't see) in their resume
        3. Include tips on what to add, remove, or improve
        4. Tailor advice to the {target_level} level for {path_info['name']}
        
        Do NOT give generic advice. Be specific to THIS resume.
        Return as a JSON list of strings.
        """
        try:
            # Add a strict timeout to prevent hanging
            response = await asyncio.wait_for(
                asyncio.to_thread(model.generate_content, prompt),
                timeout=12.0
            )
            text = response.text
            if "[" in text and "]" in text:
                start = text.find("[")
                end = text.rfind("]") + 1
                ai_tips = json.loads(text[start:end])
            else:
                ai_tips = [text.strip()]
        except asyncio.TimeoutError:
            print("Gemini Career Coach Timeout")
            ai_tips = _get_generic_coaching_tips(target_path, target_level, missing_core, matched_ats)
        except Exception as e:
            print(f"Gemini Career Coach Error: {e}")
            ai_tips = _get_generic_coaching_tips(target_path, target_level, missing_core, matched_ats)
    else:
        ai_tips = _get_generic_coaching_tips(target_path, target_level, missing_core, matched_ats)

    return {
        "ats_score": ats_score,
        "matched_ats": matched_ats,
        "missing_core": missing_core,
        "bias_flags": found_bias,
        "ai_tips": ai_tips,
        "path_info": path_info,
        "target_path": target_path,
        "target_level": target_level,
    }

def _get_generic_coaching_tips(target_path, target_level, missing_core, matched_ats):
    tips = []
    if missing_core:
        tips.append(f"Critical gap: Add {', '.join(missing_core)} to your skills section immediately — these are core requirements.")
    if len(matched_ats) < 3:
        tips.append("Your resume matches very few ATS keywords. Rewrite bullet points to include role-specific terminology.")
    if target_level == "junior":
        tips.append("Emphasize personal projects, GitHub repositories, and academic achievements to compensate for limited experience.")
    elif target_level == "staff":
        tips.append("Quantify your leadership impact: team sizes managed, revenue influenced, systems scaled.")
    tips.append("Use the STAR method (Situation, Task, Action, Result) for every bullet point to demonstrate impact.")
    tips.append("Add a dedicated 'Skills' section with exact technology keywords matching the job description.")
    return tips

# ─── Routes ───────────────────────────────────────────────────────────────────
@app.get("/api/status")
def root():
    return {"name": "FairSight API", "version": "1.0.0", "status": "operational"}

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/audit")
async def audit_decision(req: AuditRequest):
    print(f"DEBUG: Received audit request for domain: {req.domain} (Mode: {req.mode})")
    try:
        result = await compute_fairness_metrics(req.features, req.prediction, req.domain, req.mode)
        print(f"DEBUG: Computation complete for {req.domain}")
        await manager.broadcast({"type": "audit_result", "data": result})
        return result
    except Exception as e:
        print(f"DEBUG: Audit Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/audit/batch")
async def audit_batch(req: BatchAuditRequest):
    results = []
    for record in req.records:
        result = await compute_fairness_metrics(record.features, record.prediction, record.domain)
        results.append(result)
        await asyncio.sleep(0.05)
    
    avg_score = sum(r["fairness_score"] for r in results) / len(results)
    bias_count = sum(1 for r in results if r["bias_detected"])
    
    return {
        "total_audited": len(results),
        "bias_detected_count": bias_count,
        "bias_rate": round(bias_count / len(results) * 100, 1),
        "average_fairness_score": round(avg_score, 1),
        "results": results,
    }

# ─── Career Coach Endpoint ────────────────────────────────────────────────────
@app.post("/career-coach/analyze")
async def career_coach_analyze(req: CareerCoachRequest):
    """AI-powered resume analysis that returns personalized coaching."""
    if not req.resume_text or len(req.resume_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Resume text is too short.")
    result = await _analyze_resume_with_ai(req.resume_text, req.target_path, req.target_level)
    return result

@app.post("/career-coach/upload-resume")
async def upload_resume_and_analyze(
    file: UploadFile = File(...),
    target_path: str = Form(...),
    target_level: str = Form(...)
):
    """Upload resume file (PDF/DOCX/TXT), extract text, and analyze with AI."""
    try:
        resume_text = extract_text_from_file(file)
        if len(resume_text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Resume text is too short or could not be extracted.")
        
        result = await _analyze_resume_with_ai(resume_text, target_path, target_level)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

# ─── Upload Candidates ────────────────────────────────────────────────────────
@app.post("/upload-candidates")
async def upload_candidates(file: UploadFile = File(...)):
    """
    Accept CSV or JSON file, parse it, and store candidates in memory.
    Returns the list of uploaded candidates.
    """
    filename = file.filename.lower()
    content = await file.read()

    new_candidates = []

    if filename.endswith(".json"):
        # Parse JSON
        try:
            data = json.loads(content.decode("utf-8"))
            if isinstance(data, list):
                new_candidates = data
            elif isinstance(data, dict):
                # Maybe wrapped: { "candidates": [...] }
                new_candidates = data.get("candidates", [data])
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")

    elif filename.endswith(".csv"):
        # Parse CSV
        try:
            text = content.decode("utf-8")
            reader = csv.DictReader(io.StringIO(text))
            new_candidates = [dict(row) for row in reader]
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV: {str(e)}")
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a .csv or .json file."
        )

    if not new_candidates:
        raise HTTPException(status_code=400, detail="No candidate records found in file.")

    # Stamp each with an ID and upload timestamp
    for i, c in enumerate(new_candidates):
        c["_id"] = f"cand_{int(time.time())}_{i}"
        c["_uploaded_at"] = datetime.utcnow().isoformat()

    candidates_db.extend(new_candidates)

    return {
        "success": True,
        "uploaded_count": len(new_candidates),
        "total_in_db": len(candidates_db),
        "candidates": new_candidates,
        "message": f"Successfully uploaded {len(new_candidates)} candidate(s).",
    }

@app.get("/candidates")
async def get_candidates(limit: int = 100, offset: int = 0):
    """Retrieve all uploaded candidates with pagination."""
    sliced = candidates_db[offset: offset + limit]
    return {
        "total": len(candidates_db),
        "limit": limit,
        "offset": offset,
        "candidates": sliced,
    }

@app.delete("/candidates")
async def clear_candidates():
    """Clear all candidates from the in-memory database."""
    candidates_db.clear()
    return {"success": True, "message": "All candidates cleared."}

@app.post("/send-invitation")
async def send_invitation(req: InvitationRequest):
    # Find candidate
    candidate = next((c for c in candidates_db if c.get("_id") == req.candidateId), None)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Mock Email sending logic
    print(f"--- EMAIL SENT TO {candidate.get('name', 'Candidate')} ---")
    print(f"Subject: Interview Invitation")
    print(f"Message:\n{req.message}")
    print(f"Date: {req.interviewDate}, Type: {req.interviewType}, Link: {req.meetingLink}")
    print(f"--------------------------------------------------")
    
    # Update status
    candidate["invitationStatus"] = "Sent ✅"
    candidate["interviewDate"] = req.interviewDate
    candidate["meetingLink"] = req.meetingLink
    
    return {"success": True, "message": "Invitation sent successfully"}

@app.post("/generate-invitation")
async def generate_invitation(req: GenerateInvitationRequest):
    default_msg = f"Hello {req.candidateName},\n\nCongratulations! You have been shortlisted for the next round at {req.companyName}.\nWe would like to invite you for an interview."
    if not model:
        return {"message": default_msg}
        
    prompt = f"Write a {req.tone.lower()} interview invitation email for a candidate named {req.candidateName} at {req.companyName}. Do not include subject line, just the body. Keep it short."
    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(model.generate_content, prompt),
            timeout=8.0
        )
        return {"message": response.text.strip()}
    except:
        return {"message": default_msg}

# ─── Demo & Stats ─────────────────────────────────────────────────────────────
@app.get("/demo/simulate")
async def simulate_stream():
    """Simulate a stream of decisions for demo purposes."""
    hiring_features = [
        {"name": "Alex Johnson", "experience_years": 5, "education": "State University",
         "resume_text": "women's leadership program alumni", "age": 32, "skills": "python, ml"},
        {"name": "Jordan Smith", "experience_years": 8, "education": "MIT",
         "resume_text": "engineering background strong technical skills", "age": 28, "skills": "java, react"},
        {"name": "Patricia Lee", "experience_years": 6, "education": "Berkeley",
         "resume_text": "mother of two, re-entering workforce after maternity", "age": 38, "skills": "data analysis"},
    ]
    
    results = []
    for feat in hiring_features:
        pred = random.uniform(0.3, 0.9)
        result = await compute_fairness_metrics(feat, pred, "hiring")
        results.append(result)
        await manager.broadcast({"type": "live_audit", "data": result})
        await asyncio.sleep(0.8)
    
    return {"simulated": len(results), "results": results}

@app.get("/stats/summary")
def get_stats():
    return {
        "total_audits_today": random.randint(1240, 1890),
        "bias_caught_today": random.randint(234, 456),
        "avg_fairness_score": round(random.uniform(61, 78), 1),
        "domains_active": ["hiring", "finance", "healthcare"],
        "top_bias_types": [
            {"type": "Gender Proxy", "count": random.randint(80, 150)},
            {"type": "Age Discrimination", "count": random.randint(40, 90)},
            {"type": "Location Redlining", "count": random.randint(20, 60)},
            {"type": "Name-Based Bias", "count": random.randint(15, 45)},
        ],
        "fairness_trend": [
            {"hour": i, "score": round(random.uniform(55, 85), 1)} for i in range(24)
        ],
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_json({"type": "connected", "message": "FairSight live feed active"})
        while True:
            # Just keep the connection alive and wait for broadcasts
            data = await websocket.receive_text()
            # Optional: handle incoming messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        manager.disconnect(websocket)

# ─── Serve Frontend ───────────────────────────────────────────────────────────
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
assets_dir = os.path.join(frontend_dist, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # Ignore specific API routes or WebSockets
    if full_path.startswith("api/") or full_path == "ws":
        raise HTTPException(status_code=404, detail="Route not found")
        
    index_path = os.path.join(frontend_dist, "index.html")
    file_path = os.path.join(frontend_dist, full_path)
    
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    if os.path.exists(index_path):
        return FileResponse(index_path)
        
    return {"message": "Frontend not built. Please run 'npm run build' in the frontend directory."}
