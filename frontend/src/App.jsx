import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:8000";

// ─── Human-readable feature name map ───────────────────────────
const FEATURE_LABELS = {
  G2: "Period 2 Grade", G1: "Period 1 Grade",
  avg_grade: "Average Grade (P1+P2)", grade_trend: "Grade Trend (P2 − P1)",
  absences: "Number of Absences", failures: "Past Course Failures",
  studytime: "Weekly Study Time", study_efficiency: "Study Efficiency Score",
  social_risk: "Social Risk Score", support_score: "Academic Support Score",
  parent_edu: "Parental Education Level", goout: "Goes Out Frequently",
  Dalc: "Weekday Alcohol Use", Walc: "Weekend Alcohol Use",
  famrel: "Family Relationship Quality", freetime: "Free Time After School",
  health: "Health Status", higher: "Aims for Higher Education",
  internet: "Internet Access at Home", romantic: "In a Romantic Relationship",
  activities: "Extracurricular Activities", schoolsup: "Extra School Support",
  famsup: "Family Academic Support", paid: "Paid Extra Classes",
  Medu: "Mother's Education Level", Fedu: "Father's Education Level",
  age: "Student Age", absences_norm: "Normalised Absences",
  traveltime: "Travel Time to School", sex: "Gender",
  address: "Home Location (Urban/Rural)", famsize: "Family Size",
  Pstatus: "Parents' Cohabitation Status",
};

function readableFeature(key) {
  return FEATURE_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Readable impact level for teachers ─────────────────────────
function impactLabel(shapVal) {
  const abs = Math.abs(shapVal);
  if (abs >= 1.5) return { text: "Critical impact", emoji: "🔴" };
  if (abs >= 0.8) return { text: "High impact",     emoji: "🟠" };
  if (abs >= 0.4) return { text: "Moderate impact", emoji: "🟡" };
  return                { text: "Low impact",        emoji: "🟢" };
}

// ─── 30 Demo students across all risk tiers ─────────────────────
const DEMO_STUDENTS_RAW = [
  // HIGH RISK (10 students)
  { name:"Riya Sharma",    roll:"CS21001", dept:"CSE", school:0,sex:0,age:17,address:1,famsize:1,Pstatus:1,Medu:2,Fedu:1,Mjob:2,Fjob:0,reason:1,guardian:0,traveltime:2,studytime:1,failures:2,schoolsup:0,famsup:0,paid:0,activities:0,nursery:1,higher:0,internet:1,romantic:0,famrel:3,freetime:4,goout:4,Dalc:2,Walc:3,health:3,absences:18,G1:5,G2:4,subject:0 },
  { name:"Aryan Verma",    roll:"ME21002", dept:"ME",  school:0,sex:1,age:18,address:0,famsize:0,Pstatus:0,Medu:1,Fedu:1,Mjob:0,Fjob:0,reason:3,guardian:2,traveltime:4,studytime:1,failures:3,schoolsup:0,famsup:0,paid:0,activities:0,nursery:0,higher:0,internet:0,romantic:1,famrel:1,freetime:5,goout:5,Dalc:4,Walc:5,health:1,absences:24,G1:4,G2:3,subject:0 },
  { name:"Pooja Desai",    roll:"EC21003", dept:"ECE", school:0,sex:0,age:17,address:0,famsize:1,Pstatus:0,Medu:1,Fedu:2,Mjob:0,Fjob:1,reason:2,guardian:1,traveltime:3,studytime:1,failures:2,schoolsup:0,famsup:0,paid:0,activities:0,nursery:1,higher:0,internet:0,romantic:0,famrel:2,freetime:4,goout:4,Dalc:3,Walc:4,health:2,absences:20,G1:6,G2:5,subject:1 },
  { name:"Rahul Singh",    roll:"CS21004", dept:"CSE", school:1,sex:1,age:19,address:0,famsize:0,Pstatus:0,Medu:1,Fedu:1,Mjob:0,Fjob:0,reason:3,guardian:0,traveltime:4,studytime:1,failures:3,schoolsup:0,famsup:0,paid:0,activities:0,nursery:0,higher:0,internet:0,romantic:1,famrel:1,freetime:5,goout:5,Dalc:5,Walc:5,health:1,absences:28,G1:3,G2:3,subject:0 },
  { name:"Divya Iyer",     roll:"CE21005", dept:"CE",  school:0,sex:0,age:17,address:0,famsize:1,Pstatus:1,Medu:2,Fedu:1,Mjob:2,Fjob:0,reason:2,guardian:1,traveltime:2,studytime:1,failures:1,schoolsup:0,famsup:0,paid:0,activities:0,nursery:1,higher:0,internet:1,romantic:1,famrel:2,freetime:4,goout:4,Dalc:2,Walc:3,health:2,absences:16,G1:7,G2:6,subject:1 },
  { name:"Siddharth Roy",  roll:"ME21006", dept:"ME",  school:1,sex:1,age:18,address:0,famsize:0,Pstatus:0,Medu:1,Fedu:1,Mjob:0,Fjob:2,reason:3,guardian:2,traveltime:3,studytime:1,failures:2,schoolsup:0,famsup:0,paid:0,activities:0,nursery:0,higher:0,internet:0,romantic:0,famrel:2,freetime:5,goout:5,Dalc:3,Walc:4,health:2,absences:22,G1:5,G2:5,subject:0 },
  { name:"Ananya Das",     roll:"CS21007", dept:"CSE", school:0,sex:0,age:17,address:1,famsize:1,Pstatus:0,Medu:2,Fedu:1,Mjob:1,Fjob:0,reason:1,guardian:1,traveltime:2,studytime:1,failures:1,schoolsup:0,famsup:1,paid:0,activities:0,nursery:1,higher:0,internet:1,romantic:1,famrel:3,freetime:4,goout:4,Dalc:2,Walc:3,health:3,absences:15,G1:6,G2:6,subject:1 },
  { name:"Vikram Joshi",   roll:"EC21008", dept:"ECE", school:0,sex:1,age:18,address:0,famsize:0,Pstatus:0,Medu:1,Fedu:1,Mjob:0,Fjob:0,reason:3,guardian:0,traveltime:4,studytime:1,failures:3,schoolsup:0,famsup:0,paid:0,activities:0,nursery:0,higher:0,internet:0,romantic:0,famrel:1,freetime:5,goout:5,Dalc:4,Walc:5,health:1,absences:25,G1:4,G2:4,subject:0 },
  { name:"Nisha Pillai",   roll:"CE21009", dept:"CE",  school:0,sex:0,age:17,address:0,famsize:1,Pstatus:1,Medu:1,Fedu:2,Mjob:0,Fjob:1,reason:2,guardian:1,traveltime:3,studytime:1,failures:2,schoolsup:0,famsup:0,paid:0,activities:0,nursery:1,higher:0,internet:1,romantic:0,famrel:2,freetime:4,goout:4,Dalc:2,Walc:3,health:2,absences:19,G1:5,G2:5,subject:1 },
  { name:"Aditya Gupta",   roll:"CS21010", dept:"CSE", school:0,sex:1,age:18,address:0,famsize:0,Pstatus:0,Medu:1,Fedu:1,Mjob:0,Fjob:0,reason:3,guardian:2,traveltime:4,studytime:1,failures:2,schoolsup:0,famsup:0,paid:0,activities:0,nursery:0,higher:0,internet:0,romantic:1,famrel:1,freetime:5,goout:5,Dalc:3,Walc:4,health:1,absences:21,G1:5,G2:4,subject:0 },

  // MODERATE RISK (10 students)
  { name:"Sneha Rao",      roll:"EC21011", dept:"ECE", school:0,sex:0,age:16,address:1,famsize:1,Pstatus:1,Medu:3,Fedu:2,Mjob:2,Fjob:1,reason:0,guardian:1,traveltime:2,studytime:2,failures:1,schoolsup:1,famsup:0,paid:0,activities:1,nursery:1,higher:1,internet:1,romantic:0,famrel:3,freetime:3,goout:3,Dalc:1,Walc:2,health:3,absences:9,G1:9,G2:8,subject:1 },
  { name:"Manish Kumar",   roll:"ME21012", dept:"ME",  school:1,sex:1,age:17,address:0,famsize:1,Pstatus:1,Medu:2,Fedu:2,Mjob:1,Fjob:1,reason:1,guardian:1,traveltime:3,studytime:2,failures:1,schoolsup:0,famsup:1,paid:0,activities:0,nursery:1,higher:1,internet:0,romantic:0,famrel:3,freetime:3,goout:3,Dalc:2,Walc:2,health:3,absences:10,G1:8,G2:8,subject:0 },
  { name:"Kavya Nair",     roll:"CS21013", dept:"CSE", school:0,sex:0,age:16,address:1,famsize:1,Pstatus:1,Medu:3,Fedu:2,Mjob:3,Fjob:2,reason:0,guardian:1,traveltime:1,studytime:2,failures:0,schoolsup:0,famsup:1,paid:1,activities:1,nursery:1,higher:1,internet:1,romantic:1,famrel:3,freetime:3,goout:3,Dalc:1,Walc:2,health:4,absences:8,G1:10,G2:9,subject:0 },
  { name:"Rohit Patil",    roll:"CE21014", dept:"CE",  school:0,sex:1,age:17,address:0,famsize:0,Pstatus:1,Medu:2,Fedu:2,Mjob:1,Fjob:1,reason:2,guardian:1,traveltime:2,studytime:2,failures:1,schoolsup:1,famsup:0,paid:0,activities:0,nursery:1,higher:1,internet:1,romantic:0,famrel:3,freetime:3,goout:3,Dalc:1,Walc:2,health:3,absences:11,G1:9,G2:9,subject:1 },
  { name:"Simran Kaur",    roll:"CS21015", dept:"CSE", school:0,sex:0,age:17,address:1,famsize:1,Pstatus:1,Medu:3,Fedu:2,Mjob:2,Fjob:2,reason:1,guardian:1,traveltime:2,studytime:2,failures:0,schoolsup:0,famsup:1,paid:0,activities:1,nursery:1,higher:1,internet:1,romantic:0,famrel:4,freetime:3,goout:3,Dalc:1,Walc:2,health:4,absences:7,G1:10,G2:9,subject:1 },
  { name:"Deepak Tiwari",  roll:"ME21016", dept:"ME",  school:1,sex:1,age:18,address:0,famsize:1,Pstatus:0,Medu:2,Fedu:2,Mjob:0,Fjob:1,reason:3,guardian:1,traveltime:3,studytime:2,failures:1,schoolsup:0,famsup:0,paid:0,activities:0,nursery:0,higher:1,internet:0,romantic:0,famrel:3,freetime:3,goout:3,Dalc:2,Walc:2,health:3,absences:10,G1:9,G2:8,subject:0 },
  { name:"Shreya Menon",   roll:"EC21017", dept:"ECE", school:0,sex:0,age:16,address:1,famsize:1,Pstatus:1,Medu:3,Fedu:3,Mjob:3,Fjob:2,reason:0,guardian:1,traveltime:1,studytime:2,failures:0,schoolsup:1,famsup:1,paid:0,activities:1,nursery:1,higher:1,internet:1,romantic:1,famrel:3,freetime:3,goout:3,Dalc:1,Walc:2,health:4,absences:8,G1:10,G2:9,subject:1 },
  { name:"Nikhil Saxena",  roll:"CE21018", dept:"CE",  school:0,sex:1,age:17,address:0,famsize:1,Pstatus:1,Medu:2,Fedu:2,Mjob:1,Fjob:1,reason:2,guardian:0,traveltime:2,studytime:2,failures:1,schoolsup:0,famsup:1,paid:0,activities:0,nursery:1,higher:1,internet:1,romantic:0,famrel:3,freetime:3,goout:3,Dalc:2,Walc:2,health:3,absences:9,G1:9,G2:8,subject:0 },
  { name:"Tanvi Bhatt",    roll:"CS21019", dept:"CSE", school:0,sex:0,age:16,address:1,famsize:1,Pstatus:1,Medu:3,Fedu:2,Mjob:2,Fjob:2,reason:1,guardian:1,traveltime:1,studytime:2,failures:0,schoolsup:1,famsup:1,paid:1,activities:1,nursery:1,higher:1,internet:1,romantic:0,famrel:4,freetime:3,goout:3,Dalc:1,Walc:1,health:4,absences:6,G1:11,G2:10,subject:1 },
  { name:"Suresh Reddy",   roll:"ME21020", dept:"ME",  school:1,sex:1,age:17,address:0,famsize:0,Pstatus:1,Medu:2,Fedu:1,Mjob:1,Fjob:0,reason:2,guardian:1,traveltime:3,studytime:2,failures:1,schoolsup:0,famsup:0,paid:0,activities:0,nursery:1,higher:1,internet:0,romantic:0,famrel:3,freetime:3,goout:3,Dalc:2,Walc:2,health:3,absences:10,G1:9,G2:8,subject:0 },

  // LOW RISK (10 students)
  { name:"Arjun Patel",    roll:"CS21021", dept:"CSE", school:0,sex:1,age:16,address:1,famsize:1,Pstatus:1,Medu:4,Fedu:3,Mjob:3,Fjob:3,reason:0,guardian:1,traveltime:1,studytime:3,failures:0,schoolsup:0,famsup:1,paid:1,activities:1,nursery:1,higher:1,internet:1,romantic:0,famrel:4,freetime:2,goout:2,Dalc:1,Walc:1,health:5,absences:2,G1:15,G2:16,subject:0 },
  { name:"Priya Nair",     roll:"CS21022", dept:"CSE", school:0,sex:0,age:17,address:1,famsize:1,Pstatus:1,Medu:4,Fedu:4,Mjob:4,Fjob:3,reason:1,guardian:1,traveltime:1,studytime:4,failures:0,schoolsup:0,famsup:1,paid:1,activities:1,nursery:1,higher:1,internet:1,romantic:0,famrel:5,freetime:2,goout:1,Dalc:1,Walc:1,health:5,absences:1,G1:17,G2:18,subject:1 },
  { name:"Karan Mehta",    roll:"ME21023", dept:"ME",  school:1,sex:1,age:15,address:1,famsize:1,Pstatus:1,Medu:3,Fedu:2,Mjob:1,Fjob:3,reason:0,guardian:1,traveltime:1,studytime:3,failures:0,schoolsup:1,famsup:1,paid:0,activities:1,nursery:1,higher:1,internet:1,romantic:0,famrel:4,freetime:3,goout:2,Dalc:1,Walc:2,health:4,absences:4,G1:13,G2:14,subject:0 },
  { name:"Aarav Sharma",   roll:"EC21024", dept:"ECE", school:0,sex:1,age:16,address:1,famsize:1,Pstatus:1,Medu:4,Fedu:4,Mjob:4,Fjob:4,reason:0,guardian:1,traveltime:1,studytime:4,failures:0,schoolsup:1,famsup:1,paid:1,activities:1,nursery:1,higher:1,internet:1,romantic:0,famrel:5,freetime:2,goout:1,Dalc:1,Walc:1,health:5,absences:0,G1:18,G2:19,subject:1 },
  { name:"Ishaan Kapoor",  roll:"CE21025", dept:"CE",  school:0,sex:1,age:16,address:1,famsize:1,Pstatus:1,Medu:3,Fedu:3,Mjob:2,Fjob:3,reason:1,guardian:1,traveltime:1,studytime:3,failures:0,schoolsup:0,famsup:1,paid:1,activities:1,nursery:1,higher:1,internet:1,romantic:0,famrel:4,freetime:2,goout:2,Dalc:1,Walc:1,health:5,absences:3,G1:14,G2:15,subject:0 },
  { name:"Meera Krishnan", roll:"CS21026", dept:"CSE", school:0,sex:0,age:16,address:1,famsize:1,Pstatus:1,Medu:4,Fedu:3,Mjob:3,Fjob:3,reason:0,guardian:1,traveltime:1,studytime:4,failures:0,schoolsup:0,famsup:1,paid:1,activities:1,nursery:1,higher:1,internet:1,romantic:0,famrel:5,freetime:2,goout:1,Dalc:1,Walc:1,health:5,absences:2,G1:16,G2:17,subject:1 },
  { name:"Rohan Bose",     roll:"ME21027", dept:"ME",  school:0,sex:1,age:15,address:1,famsize:1,Pstatus:1,Medu:3,Fedu:3,Mjob:2,Fjob:2,reason:0,guardian:1,traveltime:1,studytime:3,failures:0,schoolsup:1,famsup:1,paid:0,activities:1,nursery:1,higher:1,internet:1,romantic:0,famrel:4,freetime:3,goout:2,Dalc:1,Walc:1,health:4,absences:3,G1:13,G2:14,subject:0 },
  { name:"Sanika Joshi",   roll:"EC21028", dept:"ECE", school:0,sex:0,age:16,address:1,famsize:1,Pstatus:1,Medu:3,Fedu:3,Mjob:3,Fjob:2,reason:1,guardian:1,traveltime:1,studytime:3,failures:0,schoolsup:0,famsup:1,paid:1,activities:1,nursery:1,higher:1,internet:1,romantic:0,famrel:5,freetime:2,goout:2,Dalc:1,Walc:1,health:5,absences:2,G1:14,G2:15,subject:1 },
  { name:"Vivaan Malhotra", roll:"CS21029", dept:"CSE", school:0,sex:1,age:16,address:1,famsize:1,Pstatus:1,Medu:4,Fedu:3,Mjob:4,Fjob:3,reason:0,guardian:1,traveltime:1,studytime:4,failures:0,schoolsup:1,famsup:1,paid:1,activities:1,nursery:1,higher:1,internet:1,romantic:0,famrel:4,freetime:2,goout:1,Dalc:1,Walc:1,health:5,absences:1,G1:17,G2:17,subject:0 },
  { name:"Ananya Singh",   roll:"CE21030", dept:"CE",  school:0,sex:0,age:17,address:1,famsize:1,Pstatus:1,Medu:3,Fedu:3,Mjob:2,Fjob:3,reason:1,guardian:1,traveltime:1,studytime:3,failures:0,schoolsup:0,famsup:1,paid:1,activities:1,nursery:1,higher:1,internet:1,romantic:0,famrel:4,freetime:2,goout:2,Dalc:1,Walc:1,health:5,absences:2,G1:15,G2:15,subject:1 },
];

// ─── Required CSV columns ────────────────────────────────────────
const REQUIRED_COLS = ["G1","G2","absences","failures","studytime","school","sex","age",
  "address","famsize","Pstatus","Medu","Fedu","Mjob","Fjob","reason","guardian",
  "traveltime","schoolsup","famsup","paid","activities","nursery","higher",
  "internet","romantic","famrel","freetime","goout","Dalc","Walc","health","subject"];

// ─── Encode categorical string → integer ─────────────────────────
function encodeRow(row) {
  const mappings = {
    school:    { GP:0, MS:1 },
    sex:       { F:0, M:1 },
    address:   { U:1, R:0 },
    famsize:   { GT3:1, LE3:0 },
    Pstatus:   { T:1, A:0 },
    Mjob:      { at_home:0, health:1, other:2, services:3, teacher:4 },
    Fjob:      { at_home:0, health:1, other:2, services:3, teacher:4 },
    reason:    { course:0, home:1, other:2, reputation:3 },
    guardian:  { father:0, mother:1, other:2 },
    schoolsup: { yes:1, no:0 },
    famsup:    { yes:1, no:0 },
    paid:      { yes:1, no:0 },
    activities:{ yes:1, no:0 },
    nursery:   { yes:1, no:0 },
    higher:    { yes:1, no:0 },
    internet:  { yes:1, no:0 },
    romantic:  { yes:1, no:0 },
    subject:   { math:0, por:1, portuguese:1 },
  };
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (mappings[k] && typeof v === "string") {
      out[k] = mappings[k][v.toLowerCase().trim()] ?? 0;
    } else {
      const n = Number(v);
      out[k] = isNaN(n) ? 0 : n;
    }
  }
  return out;
}

// ─── Risk colour scheme ─────────────────────────────────────────
function riskColor(score) {
  if (score >= 0.65) return { bg:"#2d0f0f", border:"#7f1d1d", accent:"#ef4444", label:"HIGH RISK",     badge:"#fee2e2", badgeText:"#991b1b" };
  if (score >= 0.38) return { bg:"#2d1f0a", border:"#78350f", accent:"#f59e0b", label:"MODERATE RISK", badge:"#fef3c7", badgeText:"#92400e" };
  return                     { bg:"#0a1f0f", border:"#14532d", accent:"#22c55e", label:"LOW RISK",      badge:"#dcfce7", badgeText:"#15803d" };
}

// ─── Personalised intervention plan builder ──────────────────────
function buildInterventionPlan(student) {
  const risk   = student.risk_score;
  const col    = riskColor(risk);
  const issues = student.interventions || [];
  const name   = student.name.split(" ")[0]; // first name for friendlier text

  const immediate = [];
  const shortTerm = [];
  const referrals = [];

  // ── Grade-based issues ──
  const gradeIssues = issues.filter(i =>
    ["period 2","period 1","avg","average","grade"].some(k => i.issue.toLowerCase().includes(k))
  );
  const hasGradeIssue = gradeIssues.length > 0;

  const absenceIssue = issues.find(i => i.issue.toLowerCase().includes("absences"));
  const failureIssue = issues.find(i => i.issue.toLowerCase().includes("failures") || i.issue.toLowerCase().includes("past course"));
  const studyIssue   = issues.find(i => i.issue.toLowerCase().includes("study"));
  const socialIssue  = issues.find(i =>
    ["going out","alcohol","social"].some(k => i.issue.toLowerCase().includes(k))
  );
  const familyIssue  = issues.find(i =>
    ["family","parent","cohabitation"].some(k => i.issue.toLowerCase().includes(k))
  );

  if (hasGradeIssue) {
    const topGrade = gradeIssues[0];
    if (topGrade.shap_impact >= 1.5) {
      immediate.push(`Schedule an urgent 1-on-1 academic review for ${name} — current grades are critically low and represent the highest dropout risk factor. Contact the subject teacher today.`);
      referrals.push("Head of Department: Critical grade deterioration — immediate remedial plan needed.");
    } else {
      immediate.push(`Arrange supplementary tutoring for ${name} to address weak grades in P1/P2. Set a target of ≥10/20 for the next assessment.`);
      shortTerm.push(`Review ${name}'s grade progress every two weeks. Trigger re-escalation if P2 drops below P1.`);
    }
  }

  if (absenceIssue) {
    const count = student.raw?.absences;
    immediate.push(`Contact ${name}'s parent/guardian within 48 hours regarding attendance — ${count !== undefined ? `${count} absences recorded this term` : "recurring absences flagged"}. Document the reason.`);
    shortTerm.push(`Implement weekly attendance check-in for ${name}. Flag automatically if absences exceed 2 per week.`);
    referrals.push("Student Counsellor: Persistent absences may signal personal, health, or family issues.");
  }

  if (failureIssue) {
    immediate.push(`Enrol ${name} in the remedial support programme this week — a history of course failures is a strong predictor of dropout.`);
    shortTerm.push(`Assign an academic mentor (senior peer or faculty) to ${name} for structured weekly sessions throughout this semester.`);
  }

  if (studyIssue) {
    shortTerm.push(`Provide ${name} with a structured weekly study timetable. Recommend 2–3 hour focused blocks using the Pomodoro technique.`);
    shortTerm.push(`Connect ${name} with library resources, subject revision materials, and peer study groups.`);
  }

  if (socialIssue) {
    shortTerm.push(`Book a counselling session for ${name} focusing on time management, social balance, and how lifestyle choices affect academic performance.`);
    referrals.push("Student Welfare Office: Social behaviour patterns correlating with academic underperformance identified.");
  }

  if (familyIssue) {
    shortTerm.push(`Involve the family support coordinator for ${name} — parental engagement has been flagged as a contributing risk factor.`);
  }

  // Add remaining moderate-impact items not yet covered
  issues.forEach(item => {
    const alreadyCovered = [hasGradeIssue, absenceIssue, failureIssue, studyIssue, socialIssue, familyIssue]
      .some(Boolean) && item.shap_impact < 0.5;
    if (!alreadyCovered && item.shap_impact >= 0.3 && shortTerm.length < 4) {
      shortTerm.push(`Discuss "${item.issue}" with ${name} during the next academic counselling session — this has a notable impact on risk.`);
    }
  });

  if (immediate.length === 0 && risk >= 0.65) {
    immediate.push(`Conduct a comprehensive academic review with ${name} — overall risk score is HIGH (${student.risk_percent}). Immediate faculty attention required.`);
  }

  const checkpoints = [
    { week:"Week 2",          check:`Confirm initial interventions are in place. Verify attendance improvement for ${name}.` },
    { week:"Week 4",          check:`Review next assessment result. Adjust plan if ${name} is below target grade.` },
    { week:"Week 8",          check:`Mid-semester evaluation — confirm ${name} is on a passing trajectory.` },
    { week:"End of Semester", check:`Target: ${name} achieves passing grade (≥10/20) in the final examination.` },
  ];

  const dedup = arr => [...new Set(arr)];
  return {
    riskLevel:  col.label,
    riskScore:  student.risk_percent,
    immediate:  dedup(immediate).slice(0, 4),
    shortTerm:  dedup(shortTerm).slice(0, 4),
    referrals:  dedup(referrals).slice(0, 3),
    checkpoints,
    issueCount: issues.length,
  };
}

// ─── Sub-components ─────────────────────────────────────────────

function RiskGauge({ score }) {
  const pct = Math.round(score * 100);
  const col = riskColor(score);
  const r=48, cx=64, cy=64, half=Math.PI*r, filled=(pct/100)*half;
  const x1=cx-r, x2=cx+r, y=cy;
  return (
    <div style={{textAlign:"center"}}>
      <svg width={128} height={72} viewBox="0 0 128 72">
        <path d={`M ${x1} ${y} A ${r} ${r} 0 0 1 ${x2} ${y}`} fill="none" stroke="#1e293b" strokeWidth={12} strokeLinecap="round"/>
        <path d={`M ${x1} ${y} A ${r} ${r} 0 0 1 ${x2} ${y}`} fill="none" stroke={col.accent}
          strokeWidth={12} strokeLinecap="round"
          strokeDasharray={`${filled} ${half}`}
          style={{transition:"stroke-dasharray 0.7s ease"}}/>
        <text x={cx} y={cy-4} textAnchor="middle" fill={col.accent} fontSize={24} fontWeight={800} fontFamily="monospace">{pct}%</text>
        <text x={cx} y={cy+13} textAnchor="middle" fill={col.accent} fontSize={10} letterSpacing={1} fontFamily="monospace">{col.label}</text>
      </svg>
    </div>
  );
}

// ─── Improved FeatureBar: shows readable impact instead of raw number ──
function FeatureBar({ feature, value, maxVal, rawData }) {
  const label   = readableFeature(feature);
  const isRisk  = value > 0;
  const pct     = Math.min(100, (Math.abs(value) / maxVal) * 100);
  const color   = isRisk ? "#ef4444" : "#22c55e";
  const impact  = impactLabel(value);

  // Human-readable interpretation of the actual value
  function interpretValue(feat, raw) {
    if (raw === undefined || raw === null) return null;
    const v = Number(raw);
    if (feat === "absences")   return `${v} absences this term`;
    if (feat === "failures")   return `${v} course failure${v!==1?"s":""}`;
    if (feat === "studytime")  return ["<2 hrs/week","2–5 hrs/week","5–10 hrs/week",">10 hrs/week"][v-1] || `${v}`;
    if (feat === "G1")         return `P1 grade: ${v}/20`;
    if (feat === "G2")         return `P2 grade: ${v}/20`;
    if (feat === "avg_grade")  return `Average grade: ${v.toFixed?.(1)??v}/20`;
    if (feat === "health")     return ["Very poor","Poor","Fair","Good","Excellent"][v-1] || `${v}/5`;
    if (feat === "famrel")     return ["Very bad","Bad","Neutral","Good","Excellent"][v-1] || `${v}/5`;
    if (feat === "goout")      return ["Very low","Low","Moderate","High","Very high"][v-1] || `${v}/5`;
    if (feat === "Dalc")       return ["Never","Rarely","Sometimes","Often","Very often"][v-1] || `${v}/5`;
    if (feat === "Walc")       return ["Never","Rarely","Sometimes","Often","Very often"][v-1] || `${v}/5`;
    if (feat === "freetime")   return ["Very little","Little","Moderate","Plenty","A lot"][v-1] || `${v}/5`;
    if (feat === "traveltime") return ["<15 min","15–30 min","30–60 min",">1 hour"][v-1] || `${v}`;
    if (feat === "Medu" || feat === "Fedu") return ["None","Primary","Middle school","Secondary","Higher ed"][v] || `${v}`;
    if (feat === "higher")     return v===1 ? "Wants higher ed" : "No higher ed plans";
    if (feat === "internet")   return v===1 ? "Has internet" : "No internet at home";
    if (feat === "romantic")   return v===1 ? "In a relationship" : "Not in a relationship";
    if (feat === "schoolsup")  return v===1 ? "Gets school support" : "No school support";
    if (feat === "famsup")     return v===1 ? "Family support available" : "No family support";
    if (feat === "paid")       return v===1 ? "Has paid tutoring" : "No paid tutoring";
    if (feat === "activities") return v===1 ? "In extracurriculars" : "No extracurriculars";
    return null;
  }

  const valueText = rawData ? interpretValue(feature, rawData[feature]) : null;

  return (
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4,gap:8}}>
        <div>
          <span style={{fontSize:13,color:"#cbd5e1",fontWeight:600}}>{label}</span>
          {valueText && (
            <span style={{fontSize:11,color:"#64748b",marginLeft:8}}>{valueText}</span>
          )}
        </div>
        <span style={{fontSize:11,color,fontWeight:700,whiteSpace:"nowrap",background: isRisk?"#2d0f0f":"#0a1f0f",border:`1px solid ${color}33`,padding:"2px 8px",borderRadius:20,flexShrink:0}}>
          {impact.emoji} {impact.text}
        </span>
      </div>
      <div style={{height:7,background:"#1e293b",borderRadius:4,overflow:"hidden"}}>
        <div style={{width:pct+"%",height:"100%",background:color,borderRadius:4,transition:"width 0.6s ease",opacity:0.9}}/>
      </div>
    </div>
  );
}

function PlanSection({ icon, title, items, accent }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span style={{fontSize:16}}>{icon}</span>
        <span style={{fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:accent,textTransform:"uppercase"}}>{title}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {items.map((item,i) => (
          <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",background:"#0f172a",border:"1px solid #1e293b",borderRadius:8,padding:"10px 14px"}}>
            <span style={{color:accent,fontWeight:700,fontSize:13,minWidth:20,fontFamily:"monospace"}}>{i+1}.</span>
            <span style={{fontSize:13,color:"#94a3b8",lineHeight:1.6}}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chip({ val, label, color }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <span style={{fontSize:16,fontWeight:800,color,fontFamily:"monospace"}}>{val}</span>
      <span style={{fontSize:11,color:"#475569"}}>{label}</span>
    </div>
  );
}

// ─── Risk Trend Tab ─────────────────────────────────────────────
function RiskTrendTab({ student }) {
  // Simulate semester trend data from P1→P2 grades
  const g1 = student.raw?.G1 ?? 10;
  const g2 = student.raw?.G2 ?? 10;
  const abs = student.raw?.absences ?? 0;

  // Generate simulated weekly trend over 8 weeks
  const weeks = ["Wk 1","Wk 2","Wk 3","Wk 4","Wk 5","Wk 6","Wk 7","Wk 8"];
  const baseRisk = student.risk_score;

  // Interpolate risk trend based on grade trajectory
  const gradeDiff = g2 - g1;
  const trendPoints = weeks.map((_, i) => {
    const progress = i / 7;
    const gradeEffect = gradeDiff < 0
      ? baseRisk - (1 - progress) * 0.15
      : baseRisk + (1 - progress) * 0.10;
    const noise = (Math.sin(i * 2.3 + student.id) * 0.04);
    return Math.max(0.05, Math.min(0.98, gradeEffect + noise));
  });

  const maxRisk = Math.max(...trendPoints);
  const minRisk = Math.min(...trendPoints);
  const latest  = trendPoints[trendPoints.length - 1];
  const earliest = trendPoints[0];
  const trend    = latest > earliest + 0.05 ? "↑ Worsening" : latest < earliest - 0.05 ? "↓ Improving" : "→ Stable";
  const trendColor = latest > earliest + 0.05 ? "#ef4444" : latest < earliest - 0.05 ? "#22c55e" : "#f59e0b";

  const chartW = 420, chartH = 140, padL = 40, padB = 28, padT = 16;
  const plotW = chartW - padL - 16, plotH = chartH - padB - padT;

  const points = trendPoints.map((v, i) => {
    const x = padL + (i / (weeks.length - 1)) * plotW;
    const y = padT + (1 - (v - minRisk + 0.05) / (maxRisk - minRisk + 0.1)) * plotH;
    return [x, y];
  });
  const polyline = points.map(([x,y]) => `${x},${y}`).join(" ");
  const area = `${points[0][0]},${chartH - padB} ${polyline} ${points[points.length-1][0]},${chartH - padB}`;

  const colFn = (v) => riskColor(v).accent;

  // Grade progression bars
  const gradeMax = 20;

  return (
    <div style={{display:"grid",gap:16}}>
      {/* Trend header */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        {[
          { label:"Current Risk", val: student.risk_percent, color: riskColor(student.risk_score).accent },
          { label:"Semester Trend", val: trend, color: trendColor },
          { label:"Absences This Term", val: `${abs} days`, color: abs > 15 ? "#ef4444" : abs > 8 ? "#f59e0b" : "#22c55e" },
        ].map((c,i) => (
          <div key={i} style={{background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:10,padding:"14px 16px"}}>
            <div style={{fontSize:10,color:"#475569",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>{c.label}</div>
            <div style={{fontSize:18,fontWeight:800,color:c.color,fontFamily:"monospace"}}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Risk over semester chart */}
      <div style={{background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:14,padding:"20px 22px"}}>
        <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:700,color:"#f8fafc"}}>📈 Risk Score — Semester Trajectory</h3>
        <p style={{margin:"0 0 16px",fontSize:12,color:"#475569"}}>Estimated weekly risk based on grade trend, attendance, and model output.</p>
        <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={{overflow:"visible"}}>
          {/* Y-axis grid lines */}
          {[0.25,0.5,0.65,0.75].map(thresh => {
            const y = padT + (1 - (thresh - minRisk + 0.05) / (maxRisk - minRisk + 0.1)) * plotH;
            return (
              <g key={thresh}>
                <line x1={padL} y1={y} x2={chartW-16} y2={y} stroke="#1e293b" strokeDasharray="4 4"/>
                <text x={padL-4} y={y+4} textAnchor="end" fill="#334155" fontSize={9}>{Math.round(thresh*100)}%</text>
              </g>
            );
          })}
          {/* Area fill */}
          <polygon points={area} fill={`${riskColor(student.risk_score).accent}18`}/>
          {/* Line */}
          <polyline points={polyline} fill="none" stroke={riskColor(student.risk_score).accent} strokeWidth={2.5} strokeLinejoin="round"/>
          {/* Dots + labels */}
          {points.map(([x,y],i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={4} fill={colFn(trendPoints[i])} stroke="#020817" strokeWidth={1.5}/>
              <text x={x} y={chartH - padB + 14} textAnchor="middle" fill="#475569" fontSize={9}>{weeks[i]}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Grade P1 vs P2 bar comparison */}
      <div style={{background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:14,padding:"20px 22px"}}>
        <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:700,color:"#f8fafc"}}>📊 Grade Comparison: P1 vs P2</h3>
        <p style={{margin:"0 0 16px",fontSize:12,color:"#475569"}}>Academic performance across the two graded periods.</p>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[
            { label:"Period 1 Grade", val: g1, color: g1 >= 10 ? "#22c55e" : g1 >= 7 ? "#f59e0b" : "#ef4444" },
            { label:"Period 2 Grade", val: g2, color: g2 >= 10 ? "#22c55e" : g2 >= 7 ? "#f59e0b" : "#ef4444" },
          ].map((g,i) => (
            <div key={i}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:13,color:"#cbd5e1",fontWeight:500}}>{g.label}</span>
                <span style={{fontSize:13,color:g.color,fontWeight:700,fontFamily:"monospace"}}>{g.val}/20 ({Math.round((g.val/20)*100)}%)</span>
              </div>
              <div style={{height:10,background:"#1e293b",borderRadius:5,overflow:"hidden"}}>
                <div style={{width:`${(g.val/gradeMax)*100}%`,height:"100%",background:g.color,borderRadius:5,transition:"width 0.6s"}}/>
              </div>
            </div>
          ))}
          {gradeDiff < 0 && (
            <div style={{background:"#2d0f0f",border:"1px solid #7f1d1d",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#fca5a5",marginTop:4}}>
              ⚠️ Grade declined by {Math.abs(gradeDiff)} points from P1 to P2 — this is a strong risk indicator.
            </div>
          )}
          {gradeDiff >= 0 && (
            <div style={{background:"#0a1f0f",border:"1px solid #14532d",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#86efac",marginTop:4}}>
              ✅ Grade improved or held steady from P1 to P2 — positive indicator.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CSV Template Download ────────────────────────────────────────
function downloadTemplate() {
  const header = ["name","roll","dept","subject","school","sex","age","address","famsize","Pstatus",
    "Medu","Fedu","Mjob","Fjob","reason","guardian","traveltime","studytime","failures",
    "schoolsup","famsup","paid","activities","nursery","higher","internet","romantic",
    "famrel","freetime","goout","Dalc","Walc","health","absences","G1","G2"];
  const example = ["Example Student","CS21099","CSE","math","GP","M","17","U","GT3","T",
    "3","2","other","other","course","mother","2","2","0",
    "no","yes","no","yes","yes","yes","yes","no",
    "4","3","2","1","2","4","5","12","11"];
  const csv = [header.join(","), example.join(",")].join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "failsafe_student_template.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ─── Main App ────────────────────────────────────────────────────
export default function Failsafe() {
  const [view, setView]         = useState("upload");
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [plan, setPlan]         = useState(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setTab]     = useState("analysis");
  const [error, setError]       = useState("");
  const [filterRisk, setFilter] = useState("ALL");
  const [csvFileName, setCsvFileName] = useState("");
  const fileRef = useRef(null);

  useEffect(() => { setPlan(null); setTab("analysis"); }, [selected?.id]);

  // ── Call API for a batch ──────────────────────────────────────
  async function predictBatch(rawStudents) {
    setView("loading"); setProgress(0); setError("");
    try {
      const results = [];
      for (let i = 0; i < rawStudents.length; i++) {
        const { name, roll, dept, ...rawFeatures } = rawStudents[i];
        const features = encodeRow(rawFeatures);
        const res = await fetch(`${API_BASE}/predict`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify(features),
        });
        if (!res.ok) {
          const e = await res.json();
          throw new Error(e.detail || `HTTP ${res.status}`);
        }
        const data = await res.json();
        const top_risk_factors       = data.top_risk_factors || [];
        const top_protective_factors = data.top_protective_factors || [];
        const interventions = top_risk_factors.map(f => ({
          issue: readableFeature(f.feature),
          shap_impact: f.shap_impact
        }));
        results.push({
          name: name || `Student ${i+1}`,
          roll: roll || `S${String(i+1).padStart(3,"0")}`,
          dept: dept || "—",
          risk_score:   data.risk_score,
          risk_level:   data.risk_level,
          risk_percent: data.risk_percent,
          top_risk_factors,
          top_protective_factors,
          interventions,
          raw: rawFeatures,      // ← store raw values for interpretation
          id: i + 1,
        });
        setProgress(Math.round(((i+1)/rawStudents.length)*100));
      }
      results.sort((a,b) => b.risk_score - a.risk_score);
      setStudents(results);
      setSelected(results[0]);
      setView("dashboard");
    } catch(e) {
      setError("API Error: " + (e.message || "Could not reach FastAPI. Run: uvicorn api.main:app --reload --port 8000"));
      setView("upload");
    }
  }

  // ── Parse CSV ─────────────────────────────────────────────────
  function handleCSV(file) {
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) { setError("CSV must have a header row and at least one data row."); return; }
      const headers = lines[0].split(",").map(h => h.trim());
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(",").map(v => v.trim());
        if (vals.length < headers.length) continue;
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = vals[idx]; });
        rows.push(obj);
      }
      if (rows.length === 0) { setError("No valid data rows found in the CSV."); return; }
      predictBatch(rows);
    };
    reader.readAsText(file);
  }

  // ── Filter sidebar ────────────────────────────────────────────
  const filtered = students.filter(s => {
    if (filterRisk === "ALL") return true;
    if (filterRisk === "HIGH")     return s.risk_score >= 0.65;
    if (filterRisk === "MODERATE") return s.risk_score >= 0.38 && s.risk_score < 0.65;
    if (filterRisk === "LOW")      return s.risk_score < 0.38;
    return true;
  });

  // ─────────────────────────────────────────────────────────────
  // UPLOAD SCREEN
  // ─────────────────────────────────────────────────────────────
  if (view === "upload") return (
    <div style={{background:"#020817",minHeight:"100vh",fontFamily:"'Inter',system-ui,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px"}}>
      <div style={{width:"100%",maxWidth:520}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,background:"linear-gradient(135deg,#3b82f6,#06b6d4)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:26,fontWeight:900,color:"#fff",letterSpacing:-1}}>FS</div>
          <h1 style={{fontSize:36,fontWeight:900,color:"#f8fafc",letterSpacing:"-0.03em",margin:"0 0 6px"}}>FAILSAFE</h1>
          <p style={{color:"#475569",fontSize:13,letterSpacing:"0.06em",textTransform:"uppercase",margin:0}}>Student Academic Risk Detection · XGBoost + SHAP</p>
        </div>

        {/* Upload box — clicking the box but NOT child buttons triggers file picker */}
        <div
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor="#3b82f6"; }}
          onDragLeave={e => { e.currentTarget.style.borderColor="#1e293b"; }}
          onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor="#1e293b"; handleCSV(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
          style={{background:"#0f172a",border:"2px dashed #1e293b",borderRadius:16,padding:"36px 28px",textAlign:"center",cursor:"pointer",marginBottom:16,transition:"border-color 0.2s"}}>
          {/* Hidden input — clicking the div triggers this */}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{display:"none"}}
            onChange={e => { if (e.target.files[0]) handleCSV(e.target.files[0]); }}
          />
          <div style={{fontSize:36,marginBottom:12}}>📂</div>
          <p style={{color:"#94a3b8",fontSize:15,fontWeight:600,margin:"0 0 6px"}}>
            {csvFileName ? `✅ ${csvFileName}` : "Drop a CSV file here or click to browse"}
          </p>
          <p style={{color:"#475569",fontSize:13,margin:0}}>Must include: G1, G2, absences, failures, studytime, subject…</p>
        </div>

        {/* Template download — stopPropagation so it doesn't open the file picker */}
        <button
          onClick={e => { e.stopPropagation(); downloadTemplate(); }}
          style={{width:"100%",background:"transparent",border:"1px solid #1e293b",color:"#64748b",padding:"10px",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:12}}>
          ⬇ Download CSV Template
        </button>

        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <div style={{flex:1,height:1,background:"#1e293b"}}/>
          <span style={{color:"#334155",fontSize:12}}>OR</span>
          <div style={{flex:1,height:1,background:"#1e293b"}}/>
        </div>

        <button onClick={() => predictBatch(DEMO_STUDENTS_RAW)}
          style={{width:"100%",background:"linear-gradient(135deg,#3b82f6,#06b6d4)",border:"none",color:"#fff",padding:"14px",borderRadius:10,cursor:"pointer",fontSize:15,fontWeight:700,letterSpacing:"0.02em"}}>
          ▶ &nbsp;Run Demo — 30 Sample Students
        </button>

        {error && (
          <div style={{background:"#2d0f0f",border:"1px solid #7f1d1d",borderRadius:10,padding:"12px 16px",color:"#fca5a5",fontSize:13,marginTop:16}}>
            {error}
          </div>
        )}

        <p style={{textAlign:"center",marginTop:20,fontSize:12,color:"#334155"}}>
          <span style={{color:"#22c55e"}}>●</span>&nbsp; Connects to FastAPI at localhost:8000
        </p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // LOADING SCREEN
  // ─────────────────────────────────────────────────────────────
  if (view === "loading") return (
    <div style={{background:"#020817",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:64,height:64,background:"linear-gradient(135deg,#3b82f6,#06b6d4)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",fontSize:26,fontWeight:900,color:"#fff"}}>FS</div>
        <h2 style={{color:"#f8fafc",fontSize:20,fontWeight:700,marginBottom:8}}>Analysing students…</h2>
        <p style={{color:"#475569",fontSize:13,marginBottom:32}}>Running XGBoost predictions + SHAP explanations</p>
        <div style={{width:320,height:8,background:"#0f172a",borderRadius:4,overflow:"hidden",margin:"0 auto 12px",border:"1px solid #1e293b"}}>
          <div style={{width:progress+"%",height:"100%",background:"linear-gradient(90deg,#3b82f6,#06b6d4)",borderRadius:4,transition:"width 0.4s ease"}}/>
        </div>
        <p style={{color:"#3b82f6",fontSize:13,fontFamily:"monospace"}}>{progress}% complete</p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────
  const stats = {
    total: students.length,
    high:  students.filter(s => s.risk_score >= 0.65).length,
    mod:   students.filter(s => s.risk_score >= 0.38 && s.risk_score < 0.65).length,
    low:   students.filter(s => s.risk_score < 0.38).length,
  };
  const col     = riskColor(selected.risk_score);
  const allShap = [...(selected.top_risk_factors||[]), ...(selected.top_protective_factors||[])];
  const maxShap = Math.max(...allShap.map(f => Math.abs(f.shap_impact)), 0.001);
  const initials = selected.name.split(" ").map(n=>n[0]).join("").slice(0,2);

  return (
    <div style={{background:"#020817",minHeight:"100vh",color:"#e2e8f0",fontFamily:"'Inter',system-ui,sans-serif",display:"flex",flexDirection:"column"}}>

      {/* ── Top Nav ── */}
      <nav style={{background:"#0a0f1e",borderBottom:"1px solid #1e293b",padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,background:"linear-gradient(135deg,#3b82f6,#06b6d4)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff"}}>FS</div>
          <span style={{fontWeight:800,fontSize:16,letterSpacing:"0.05em",color:"#f8fafc"}}>FAILSAFE</span>
          <span style={{color:"#334155",fontSize:12,marginLeft:4}}>Early Intervention System</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:20}}>
          <div style={{display:"flex",gap:16}}>
            <Chip val={stats.total} label="Total"     color="#64748b"/>
            <Chip val={stats.high}  label="High Risk" color="#ef4444"/>
            <Chip val={stats.mod}   label="Moderate"  color="#f59e0b"/>
            <Chip val={stats.low}   label="Low Risk"  color="#22c55e"/>
          </div>
          <button onClick={()=>setView("upload")} style={{background:"transparent",border:"1px solid #1e293b",color:"#64748b",padding:"6px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>
            ← New Session
          </button>
        </div>
      </nav>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* ── Sidebar ── */}
        <aside style={{width:270,background:"#0a0f1e",borderRight:"1px solid #1e293b",overflowY:"auto",flexShrink:0,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"10px 12px",borderBottom:"1px solid #1e293b",display:"flex",gap:4,flexWrap:"wrap"}}>
            {["ALL","HIGH","MODERATE","LOW"].map(f => (
              <button key={f} onClick={()=>setFilter(f)} style={{
                flex:1, background: filterRisk===f ? "#1e293b" : "transparent",
                border:"1px solid #1e293b",color: filterRisk===f ? "#f8fafc" : "#475569",
                padding:"4px 2px",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:700,letterSpacing:"0.06em",
              }}>{f}</button>
            ))}
          </div>

          <div style={{padding:"10px 16px 6px",fontSize:10,fontWeight:700,color:"#334155",letterSpacing:"0.12em",textTransform:"uppercase"}}>
            {filtered.length} students · ranked by risk
          </div>

          {filtered.map(s => {
            const c = riskColor(s.risk_score);
            const active = s.id === selected.id;
            const ini = s.name.split(" ").map(n=>n[0]).join("").slice(0,2);
            return (
              <div key={s.id} onClick={()=>setSelected(s)} style={{
                padding:"11px 16px", cursor:"pointer",
                borderBottom:"1px solid #0f172a",
                background: active ? "#111827" : "transparent",
                borderLeft: active ? `3px solid ${c.accent}` : "3px solid transparent",
              }}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:34,height:34,borderRadius:"50%",background:c.bg,border:`1px solid ${c.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:c.accent,flexShrink:0}}>{ini}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:active?"#f8fafc":"#cbd5e1",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</div>
                    <div style={{fontSize:11,color:"#475569",marginTop:2}}>{s.roll} · {s.dept}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:14,fontWeight:800,color:c.accent,fontFamily:"monospace"}}>{s.risk_percent}</div>
                    <div style={{fontSize:9,fontWeight:700,color:c.accent,background:c.bg,border:`1px solid ${c.border}`,padding:"1px 4px",borderRadius:4,marginTop:2,whiteSpace:"nowrap"}}>{c.label}</div>
                  </div>
                </div>
                <div style={{height:3,background:"#1e293b",borderRadius:2,marginTop:8,overflow:"hidden"}}>
                  <div style={{width:s.risk_percent,height:"100%",background:c.accent,borderRadius:2}}/>
                </div>
              </div>
            );
          })}
        </aside>

        {/* ── Main Panel ── */}
        <main style={{flex:1,overflowY:"auto",padding:24}}>

          {/* Student header */}
          <div style={{background:"#0a0f1e",border:`1px solid ${col.border}`,borderRadius:14,padding:"20px 24px",marginBottom:20,display:"flex",alignItems:"center",gap:20}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:col.bg,border:`2px solid ${col.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:col.accent,flexShrink:0}}>{initials}</div>
            <div style={{flex:1}}>
              <h2 style={{margin:0,fontSize:22,fontWeight:800,color:"#f8fafc"}}>{selected.name}</h2>
              <p style={{margin:"4px 0 0",fontSize:13,color:"#64748b"}}>{selected.roll} &nbsp;·&nbsp; {selected.dept} &nbsp;·&nbsp; Academic Risk Report</p>
            </div>
            <RiskGauge score={selected.risk_score}/>
          </div>

          {/* Summary chips */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
            {[
              { label:"Risk Score",     val: selected.risk_percent,                                    color: col.accent },
              { label:"Risk Factors",   val: (selected.top_risk_factors||[]).length + " factors",      color:"#ef4444" },
              { label:"Protectors",     val: (selected.top_protective_factors||[]).length + " factors",color:"#22c55e" },
            ].map((c,i) => (
              <div key={i} style={{background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:10,padding:"14px 16px"}}>
                <div style={{fontSize:11,color:"#475569",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>{c.label}</div>
                <div style={{fontSize:20,fontWeight:800,color:c.color,fontFamily:"monospace"}}>{c.val}</div>
              </div>
            ))}
          </div>

          {/* Tabs — now 3 */}
          <div style={{display:"flex",gap:4,marginBottom:20,background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:10,padding:4,width:"fit-content"}}>
            {[["analysis","📊 Risk Analysis"],["trend","📈 Risk Trend"],["plan","📋 Intervention Plan"]].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)} style={{
                background: activeTab===id ? "#1e293b" : "transparent",
                border:"none", color: activeTab===id ? "#f8fafc" : "#64748b",
                padding:"8px 20px", borderRadius:8, cursor:"pointer",
                fontSize:13, fontWeight:600, transition:"all 0.15s",
              }}>{label}</button>
            ))}
          </div>

          {/* ── Risk Analysis Tab ── */}
          {activeTab === "analysis" && (
            <div style={{display:"grid",gap:16}}>
              {selected.top_risk_factors.length > 0 && (
                <div style={{background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:14,padding:"20px 22px"}}>
                  <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:700,color:"#ef4444"}}>▲ Risk-Increasing Factors</h3>
                  <p style={{margin:"0 0 18px",fontSize:12,color:"#475569"}}>What is pushing {selected.name} toward academic failure — ranked by importance.</p>
                  {selected.top_risk_factors.map(f=>(
                    <FeatureBar key={f.feature} feature={f.feature} value={f.shap_impact} maxVal={maxShap} rawData={selected.raw}/>
                  ))}
                </div>
              )}

              {selected.top_protective_factors.length > 0 && (
                <div style={{background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:14,padding:"20px 22px"}}>
                  <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:700,color:"#22c55e"}}>▼ Protective Factors</h3>
                  <p style={{margin:"0 0 18px",fontSize:12,color:"#475569"}}>What is working in {selected.name}'s favour — reducing predicted risk.</p>
                  {selected.top_protective_factors.map(f=>(
                    <FeatureBar key={f.feature} feature={f.feature} value={f.shap_impact} maxVal={maxShap} rawData={selected.raw}/>
                  ))}
                </div>
              )}

              {selected.interventions.length === 0 && (
                <div style={{background:"#0a1f0f",border:"1px solid #14532d",borderRadius:14,padding:"20px 22px",display:"flex",alignItems:"center",gap:16}}>
                  <span style={{fontSize:28}}>✅</span>
                  <div>
                    <p style={{margin:0,fontWeight:700,color:"#22c55e",fontSize:15}}>No interventions required</p>
                    <p style={{margin:"4px 0 0",fontSize:13,color:"#475569"}}>This student is performing well. Continue standard monitoring.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Risk Trend Tab ── */}
          {activeTab === "trend" && (
            <RiskTrendTab student={selected}/>
          )}

          {/* ── Intervention Plan Tab ── */}
          {activeTab === "plan" && (
            <div>
              {!plan ? (
                <div style={{background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:14,padding:"32px",textAlign:"center"}}>
                  <span style={{fontSize:36,display:"block",marginBottom:16}}>📋</span>
                  <h3 style={{color:"#f8fafc",fontWeight:700,marginBottom:8}}>Generate Intervention Plan</h3>
                  <p style={{color:"#475569",fontSize:14,marginBottom:24,maxWidth:420,margin:"0 auto 24px",lineHeight:1.7}}>
                    FAILSAFE will analyse <strong style={{color:"#3b82f6"}}>{selected.name}</strong>'s risk profile and generate a personalised, structured action plan for faculty.
                  </p>
                  <button onClick={()=>setPlan(buildInterventionPlan(selected))} style={{background:"linear-gradient(135deg,#3b82f6,#06b6d4)",border:"none",color:"#fff",padding:"12px 32px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700}}>
                    Generate Plan for {selected.name}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{background:"#0a0f1e",border:`1px solid ${col.border}`,borderRadius:14,padding:"18px 22px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <h3 style={{margin:0,color:"#f8fafc",fontSize:16,fontWeight:700}}>Intervention Plan — {selected.name}</h3>
                      <p style={{margin:"4px 0 0",fontSize:12,color:"#475569"}}>{selected.roll} · Risk: <span style={{color:col.accent,fontWeight:700}}>{plan.riskScore} {plan.riskLevel}</span> · {plan.issueCount} issues flagged</p>
                    </div>
                    <button onClick={()=>setPlan(null)} style={{background:"transparent",border:"1px solid #1e293b",color:"#64748b",padding:"6px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>↩ Reset</button>
                  </div>

                  <div style={{background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:14,padding:"22px 24px"}}>
                    <PlanSection icon="⚡" title="Immediate Actions (within 1 week)"  items={plan.immediate}  accent="#ef4444"/>
                    <PlanSection icon="📅" title="Short-Term Plan (2–4 weeks)"        items={plan.shortTerm}  accent="#f59e0b"/>
                    <PlanSection icon="🔗" title="Referrals"                          items={plan.referrals}  accent="#a78bfa"/>

                    <div style={{marginBottom:20}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                        <span>📍</span>
                        <span style={{fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:"#06b6d4",textTransform:"uppercase"}}>Monitoring Checkpoints</span>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {plan.checkpoints.map((cp,i)=>(
                          <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",background:"#0f172a",border:"1px solid #1e293b",borderRadius:8,padding:"10px 14px"}}>
                            <span style={{color:"#06b6d4",fontWeight:700,fontSize:12,minWidth:90,fontFamily:"monospace"}}>{cp.week}</span>
                            <span style={{fontSize:13,color:"#94a3b8",lineHeight:1.6}}>{cp.check}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:8,padding:"12px 16px",fontSize:12,color:"#475569"}}>
                      ℹ️ This plan was generated using SHAP model explanations from a trained XGBoost classifier. All recommendations should be reviewed by faculty before implementation.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
