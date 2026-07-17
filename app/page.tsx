"use client";

import { useState, useRef } from "react";

type Finding = {
  condition: string;
  plain_label: string;
  severity: string;
  dimension_3p: string;
  pillar_4c: string;
};

type DiagnosisResult = {
  summary: string;
  findings: Finding[];
  analyzed_at: string;
  error?: string;
};

const API_URL = "http://halt-diagnostic-backend-env.eba-yi23h39s.us-east-1.elasticbeanstalk.com/diagnose";

const SEVERITY_COLOR: Record<string, string> = {
  "Strongly present": "#E8791E",
  "Present": "#D4AF37",
  "Mildly present": "#8A877C",
};

const SEVERITY_WIDTH: Record<string, string> = {
  "Strongly present": "95%",
  "Present": "73%",
  "Mildly present": "55%",
};

export default function Home() {
  const [mode, setMode] = useState<"idle" | "recording" | "processing" | "result">("idle");
  const [typedText, setTypedText] = useState("");
  const [showTypeBox, setShowTypeBox] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolRef = useRef<HTMLDivElement>(null);

  function scrollToTool() {
    toolRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function sendToBackend(formData: FormData) {
    setMode("processing");
    setErrorMsg(null);
    try {
      const res = await fetch(API_URL, { method: "POST", body: formData });
      const data: DiagnosisResult = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
        setMode("idle");
        return;
      }
      setResult(data);
      setMode("result");
    } catch {
      setErrorMsg("Couldn't reach the diagnostic tool. Check that the backend is running.");
      setMode("idle");
    }
  }

  async function startRecording() {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "recording.webm");
        await sendToBackend(formData);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setMode("recording");
    } catch {
      setErrorMsg("Couldn't access your microphone. Check your browser's permission settings.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    await sendToBackend(formData);
  }

  async function handleTypeSubmit() {
    if (!typedText.trim()) return;
    const formData = new FormData();
    formData.append("text", typedText);
    await sendToBackend(formData);
  }

  function reset() {
    setResult(null);
    setTypedText("");
    setShowTypeBox(false);
    setMode("idle");
    setErrorMsg(null);
  }

  const steps = [
    {
      title: "Record or upload",
      body: "Capture a real conversation, or upload one you already have. Audio, video, PDF, or a Word doc all work.",
    },
    {
      title: "It listens closely",
      body: "What's said is checked against patterns drawn from research.",
    },
    {
      title: "Get a plain-English diagnosis",
      body: "See the scores, not just the words. Each one comes with a plain explanation of what it means, laid out visually so it's easy to read at a glance.",
    },
  ];

  return (
    <main style={{ background: "#201E1B" }}>

      <header style={{
        display: "flex", alignItems: "center", gap: 10, padding: "20px 48px",
        borderBottom: "1px solid #2E2B25",
      }}>
        <img src="/logo.png" alt="Rebel Hive" style={{ width: 32, height: 32 }} />
        <span style={{ fontSize: 13, color: "#C9C7C0", letterSpacing: 0.5 }}>REBEL HIVE</span>
      </header>

      <section style={{
        minHeight: "calc(100vh - 73px)", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        position: "relative", overflow: "hidden", padding: "40px 48px",
      }}>
        <img src="/logo.png" alt="" style={{
          position: "absolute", top: 80, right: "10%", width: 80, opacity: 0.3,
        }} />
        <img src="/logo.png" alt="" style={{
          position: "absolute", bottom: 60, left: "8%", width: 56, opacity: 0.25,
        }} />

        <h1 style={{ fontSize: 56, fontWeight: 500, margin: "0 0 24px", lineHeight: 1.15 }}>
          <span style={{ color: "#F2F1EC" }}>Rebel Hive</span> <span style={{ color: "#D4AF37" }}>Diagnostic</span>
        </h1>
        <p style={{
          fontSize: 20, color: "#B8B6AE", margin: "0 auto 48px", maxWidth: 620, lineHeight: 1.6,
        }}>
          Record a conversation and understand what's really slowing transformation down.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button
            onClick={scrollToTool}
            style={{
              background: "#E8791E", color: "#2A1400", fontSize: 16, fontWeight: 600,
              padding: "16px 36px", borderRadius: 10, border: "none", cursor: "pointer",
            }}
          >
            Start diagnosis
          </button>
          <a href="#how-it-works" style={{
            border: "1px solid #4A463C", color: "#C9C7C0", fontSize: 16, fontWeight: 500,
            padding: "16px 36px", borderRadius: 10, textDecoration: "none",
          }}>
            How it works
          </a>
        </div>
      </section>

      <section ref={toolRef} style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "80px 48px", borderTop: "1px solid #2E2B25",
      }}>
        <div style={{
          width: "100%", maxWidth: 880, margin: "0 auto", background: "#26241F", borderRadius: 20,
          border: "1px solid #2E2B25", padding: "72px 80px", position: "relative", overflow: "hidden",
        }}>

          {mode === "idle" && (
            <>
              <p style={{ fontSize: 13, letterSpacing: 1.5, color: "#8A877C", textAlign: "center", margin: "0 0 8px" }}>
                START A DIAGNOSIS
              </p>
              <p style={{ fontSize: 17, color: "#B8B6AE", textAlign: "center", margin: "0 0 44px" }}>
                Record a conversation to begin
              </p>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 40 }}>
                <button
                  onClick={startRecording}
                  aria-label="Start recording"
                  style={{
                    width: 120, height: 120, borderRadius: "50%", background: "#E8791E",
                    border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", marginBottom: 18, fontSize: 44,
                  }}
                >
                  🎙
                </button>
                <p style={{ fontSize: 16, color: "#F2F1EC", margin: 0, fontWeight: 500 }}>Tap to start recording</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 36px" }}>
                <div style={{ flex: 1, height: 1, background: "#2E2B25" }} />
                <span style={{ fontSize: 12, color: "#6B6658" }}>OR</span>
                <div style={{ flex: 1, height: 1, background: "#2E2B25" }} />
              </div>

              <div style={{ display: "flex", gap: 16, marginBottom: 22, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    flex: 1, border: "1px solid #3A362E", borderRadius: 12, padding: "20px 14px",
                    background: "transparent", color: "#C9C7C0", fontSize: 14.5, cursor: "pointer",
                  }}
                >
                  Upload a file
                </button>
                <button
                  onClick={() => setShowTypeBox(!showTypeBox)}
                  style={{
                    flex: 1, border: "1px solid #3A362E", borderRadius: 12, padding: "20px 14px",
                    background: "transparent", color: "#C9C7C0", fontSize: 14.5, cursor: "pointer",
                  }}
                >
                  Type instead
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*,.pdf,.docx"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />

              <p style={{ fontSize: 12.5, color: "#6B6658", textAlign: "center", margin: "0 0 4px" }}>
                Accepts audio, video, PDF, or Word documents
              </p>

              {showTypeBox && (
                <div style={{ marginTop: 28, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
                  <textarea
                    value={typedText}
                    onChange={(e) => setTypedText(e.target.value)}
                    placeholder="Paste or type what was said..."
                    style={{
                      width: "100%", minHeight: 150, padding: 16, borderRadius: 12,
                      border: "1px solid #3A362E", background: "#1A1917", color: "#F2F1EC",
                      fontSize: 14.5, marginBottom: 14, fontFamily: "inherit", resize: "vertical",
                    }}
                  />
                  <button
                    onClick={handleTypeSubmit}
                    style={{
                      width: "100%", padding: 16, borderRadius: 12, border: "none",
                      background: "#E8791E", color: "#2A1400", fontSize: 15, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Analyze
                  </button>
                </div>
              )}

              {errorMsg && <p style={{ color: "#E8791E", fontSize: 14, textAlign: "center", marginTop: 18 }}>{errorMsg}</p>}
            </>
          )}

          {mode === "recording" && (
            <div style={{ textAlign: "center", padding: "70px 0" }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", background: "#E8791E",
                margin: "0 auto 24px", animation: "pulse 1.5s infinite",
              }} />
              <p style={{ fontSize: 17, color: "#F2F1EC", marginBottom: 32 }}>Recording...</p>
              <button
                onClick={stopRecording}
                style={{
                  padding: "16px 36px", borderRadius: 12, border: "none",
                  background: "#E8791E", color: "#2A1400", fontSize: 15, fontWeight: 600, cursor: "pointer",
                }}
              >
                Stop and analyze
              </button>
            </div>
          )}

          {mode === "processing" && (
            <div style={{ textAlign: "center", padding: "90px 0" }}>
              <p style={{ fontSize: 17, color: "#D4AF37" }}>Analyzing what was said...</p>
            </div>
          )}

          {mode === "result" && result && (
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: "#E8E6E0", margin: "0 0 12px" }}>
                {result.summary}
              </p>
              {result.findings.length > 0 && (
                <p style={{ fontSize: 12.5, color: "#6B6658", margin: "0 0 28px", lineHeight: 1.5 }}>
                  Bars show how strongly each pattern came through, not a certainty rating.
                </p>
              )}

              {result.findings.length > 0 && (
                <>
                  <p style={{ fontSize: 12.5, color: "#8A877C", margin: "0 0 20px", letterSpacing: 0.5 }}>
                    WHAT WE FOUND
                  </p>
                  {result.findings.map((f, i) => (
                    <div key={i} style={{ marginBottom: 24 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                        <span style={{ fontSize: 15, color: "#F2F1EC" }}>{f.plain_label}</span>
                        <span style={{ fontSize: 12.5, color: SEVERITY_COLOR[f.severity] || "#8A877C" }}>
                          {f.severity}
                        </span>
                      </div>
                      <div style={{ height: 8, background: "#2E2B25", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                        <div style={{
                          height: "100%", width: SEVERITY_WIDTH[f.severity] || "50%",
                          background: SEVERITY_COLOR[f.severity] || "#8A877C", borderRadius: 4,
                        }} />
                      </div>
                      <p style={{ fontSize: 13, color: "#8A877C", margin: 0 }}>
                        {f.dimension_3p} · {f.pillar_4c}
                      </p>
                    </div>
                  ))}
                </>
              )}

              <button
                onClick={reset}
                style={{
                  width: "100%", padding: 16, borderRadius: 12, border: "1px solid #3A362E",
                  background: "transparent", color: "#C9C7C0", fontSize: 14.5, cursor: "pointer", marginTop: 16,
                }}
              >
                Start a new diagnosis
              </button>
            </div>
          )}
        </div>

        <p style={{ fontSize: 12, color: "#6B6658", textAlign: "center", marginTop: 32 }}>
          Prototype tool. Reflects patterns in what was said, not a validated prediction.
        </p>
      </section>

      <section id="how-it-works" style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "80px 48px", borderTop: "1px solid #2E2B25",
      }}>
        <p style={{ fontSize: 13, letterSpacing: 1.5, color: "#8A877C", textAlign: "center", margin: "0 0 10px" }}>
          HOW IT WORKS
        </p>
        <h2 style={{ fontSize: 34, fontWeight: 500, color: "#F2F1EC", textAlign: "center", margin: "0 0 72px" }}>
          Get result in three easy steps
        </h2>

        <div style={{
          display: "flex", gap: 64, maxWidth: 1200, margin: "0 auto", flexWrap: "wrap", justifyContent: "center",
        }}>
          {steps.map((step, i) => (
            <div key={i} style={{ flex: "1 1 300px", maxWidth: 340 }}>
              <div style={{
                width: 44, height: 38, background: "#D4AF37",
                clipPath: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 600, color: "#2A2000", marginBottom: 22,
              }}>
                {i + 1}
              </div>
              <p style={{ fontSize: 18, color: "#F2F1EC", margin: "0 0 10px", fontWeight: 500 }}>{step.title}</p>
              <p style={{ fontSize: 15, color: "#A8A59C", margin: 0, lineHeight: 1.7 }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </main>
  );
}