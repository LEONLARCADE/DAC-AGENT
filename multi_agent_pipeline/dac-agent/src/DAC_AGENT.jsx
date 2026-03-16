import { useEffect, useRef, useState, useCallback } from "react";

export default function DacAgentApp() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0, tX: 0, tY: 0 });

  const vertSrc = `precision mediump float;varying vec2 vUv;attribute vec2 a_position;void main(){vUv=.5*(a_position+1.);gl_Position=vec4(a_position,0.,1.);}`;
  const fragSrc = `
    precision mediump float;
    varying vec2 vUv;
    uniform float u_time,u_ratio,u_scroll_progress;
    uniform vec2 u_pointer_position;
    vec2 rot(vec2 uv,float th){return mat2(cos(th),sin(th),-sin(th),cos(th))*uv;}
    float neuro(vec2 uv,float t,float p){
      vec2 sa=vec2(0.),res=vec2(0.);float sc=8.;
      for(int j=0;j<15;j++){uv=rot(uv,1.);sa=rot(sa,1.);
        vec2 l=uv*sc+float(j)+sa-t;sa+=sin(l)+2.4*p;
        res+=(.5+.5*cos(l))/sc;sc*=1.2;}
      return res.x+res.y;}
    void main(){
      vec2 uv=.5*vUv;uv.x*=u_ratio;
      vec2 ptr=vUv-u_pointer_position;ptr.x*=u_ratio;
      float p=clamp(length(ptr),0.,1.);p=.5*pow(1.-p,2.);
      float t=.001*u_time,n=neuro(uv,t,p);
      n=1.2*pow(n,3.);n+=pow(n,10.);n=max(0.,n-.5);
      n*=(1.-length(vUv-.5));
      vec3 c=vec3(0.45,0.05,0.85)+vec3(0.2,0.,0.4)*sin(3.*u_scroll_progress+1.5);
      gl_FragColor=vec4(c*n,n);}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;
    const mk = (src, type) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, mk(vertSrc, gl.VERTEX_SHADER));
    gl.attachShader(prog, mk(fragSrc, gl.FRAGMENT_SHADER));
    gl.linkProgram(prog); gl.useProgram(prog);
    const u = {}; const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(prog, i).name; u[nm] = gl.getUniformLocation(prog, nm); }
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const resize = () => { const d = Math.min(window.devicePixelRatio, 2); canvas.width = innerWidth * d; canvas.height = innerHeight * d; gl.uniform1f(u.u_ratio, canvas.width / canvas.height); gl.viewport(0, 0, canvas.width, canvas.height); };
    resize(); window.addEventListener("resize", resize);
    const render = () => { const p = pointerRef.current; p.x += (p.tX - p.x) * .2; p.y += (p.tY - p.y) * .2; gl.uniform1f(u.u_time, performance.now()); gl.uniform2f(u.u_pointer_position, p.x / innerWidth, 1 - p.y / innerHeight); gl.uniform1f(u.u_scroll_progress, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); animRef.current = requestAnimationFrame(render); };
    render();
    const mv = e => { pointerRef.current.tX = e.clientX; pointerRef.current.tY = e.clientY; };
    const tc = e => { pointerRef.current.tX = e.touches[0].clientX; pointerRef.current.tY = e.touches[0].clientY; };
    window.addEventListener("pointermove", mv); window.addEventListener("touchmove", tc); window.addEventListener("click", mv);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", mv); window.removeEventListener("touchmove", tc); window.removeEventListener("click", mv); };
  }, []);

  // ── Phase flow: intro → opening → welcome → configure → app ──
  const [active, setActive] = useState("chat");
  const [phase, setPhase] = useState("intro");
  const [welcomeInput, setWelcomeInput] = useState("");
  const [ripples, setRipples] = useState([]);
  const rippleId = useRef(0);

  // ── Configure state — both start EMPTY; user types any number they want ──
  // IMPORTANT: do NOT put a default number like useState(50) or useState(1) here.
  // The user must type their own value. Validation enforces min=1 on submit.
  const [loopCount, setLoopCount] = useState("");   // e.g. user types "3"
  const [paperCount, setPaperCount] = useState("");   // e.g. user types "8"
  const [cfgErrors, setCfgErrors] = useState({});

  const handleEnter = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const id = rippleId.current++;
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(rr => rr.id !== id)), 900);
    setTimeout(() => setPhase("opening"), 300);
    setTimeout(() => setPhase("welcome"), 2000);
  }, []);

  const handleLaunch = useCallback(() => {
    const errs = {};
    if (!loopCount || isNaN(loopCount) || Number(loopCount) < 1) errs.loop = "Required — enter a valid loop count";
    if (!paperCount || isNaN(paperCount) || Number(paperCount) < 1) errs.paper = "Required — enter a valid number";
    if (Object.keys(errs).length) { setCfgErrors(errs); return; }
    setCfgErrors({});
    setPhase("app");
  }, [loopCount, paperCount]);

  // ── Chat state ──
  const [msgs, setMsgs] = useState([
    { r: "bot", t: "Greetings, warrior. I am DAC AGENT — your AI ronin. How may I forge your path today?" },
    { r: "user", t: "What can you do?" },
    { r: "bot", t: "I wield language, vision, code generation, and autonomous task execution. Speak your command." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = useCallback(async () => {
    const txt = chatInput.trim(); if (!txt) return;
    setChatInput(""); setLoading(true);
    setMsgs(m => [...m, { r: "user", t: txt }]);
    await new Promise(r => setTimeout(r, 800));
    setMsgs(m => [...m, { r: "bot", t: "Command received. Processing through the neural matrix…" }]);
    setLoading(false);
  }, [chatInput]);

  // ── Shared design tokens ──
  const SF = "'Yuji Syuku','Kaisei HarunoUmi',serif";
  const SFD = "'Yuji Syuku','Kaisei HarunoUmi',serif";

  const liqBase = {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(60px) saturate(210%) brightness(1.06)",
    WebkitBackdropFilter: "blur(60px) saturate(210%) brightness(1.06)",
    boxShadow: [
      "0 0 0 1px rgba(255,255,255,0.18) inset",
      "0 -1px 0 1px rgba(180,120,255,0.12) inset",
      "0 2px 0 0 rgba(100,200,255,0.08) inset",
      "0 32px 64px rgba(0,0,0,0.38)",
      "0 2px 6px rgba(168,85,247,0.12)",
    ].join(", "),
    border: "1px solid rgba(255,255,255,0.18)",
    borderTop: "1px solid rgba(255,255,255,0.30)",
  };

  const liqCard = {
    background: "rgba(255,255,255,0.055)",
    backdropFilter: "blur(30px) saturate(180%)",
    WebkitBackdropFilter: "blur(30px) saturate(180%)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderTop: "1px solid rgba(255,255,255,0.22)",
    boxShadow: "0 0 0 0.5px rgba(255,255,255,0.06) inset, 0 4px 16px rgba(0,0,0,0.22)",
  };

  // Default: 14px, serif font
  const txt = (op = 0.9, sz = 14, w = 400) => ({
    fontFamily: SF, fontSize: sz, fontWeight: w,
    color: `rgba(255,255,255,${op})`, letterSpacing: "-0.01em",
  });
  const label = {
    fontFamily: SF, fontSize: 10, fontWeight: 600,
    color: "rgba(255,255,255,0.3)", letterSpacing: "0.09em", textTransform: "uppercase",
  };

  // ── Input style helper ──
  const inputStyle = (hasErr) => ({
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    border: hasErr ? "1px solid rgba(255,100,100,0.55)" : "1px solid rgba(139,92,246,0.3)",
    borderTop: hasErr ? "1px solid rgba(255,120,120,0.55)" : "1px solid rgba(192,132,252,0.42)",
    borderRadius: 14,
    padding: "13px 18px",
    color: "rgba(255,255,255,0.88)",
    fontFamily: SF, fontSize: 14,
    outline: "none",
    boxShadow: hasErr
      ? "0 0 0 1px rgba(255,100,100,0.1) inset, 0 0 14px rgba(255,80,80,0.1)"
      : "0 0 0 1px rgba(139,92,246,0.1) inset",
    transition: "border 0.2s, box-shadow 0.2s",
  });

  const NAV = [
    { id: "chat", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z", label: "Chat" },
  ];

  // ── DAC Logo SVG (reused) ──
  const DACLogo = ({ size = 52, maskId = "dacMask" }) => (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <mask id={maskId}>
          <rect width="200" height="200" fill="white" />
          <path d="M72 52 L72 148 Q132 148 160 124 Q178 108 178 100 Q178 92 160 76 Q132 52 72 52 Z" fill="black" />
          <rect x="0" y="89" width="200" height="22" fill="black" />
          <polygon points="52,82 22,100 52,118" fill="black" />
          <polygon points="148,82 178,100 148,118" fill="black" />
        </mask>
      </defs>
      <path d="M50 28 L72 28 Q140 28 172 72 Q192 88 192 100 Q192 112 172 128 Q140 172 72 172 L50 172 Z" fill="#b0aaf5" mask={`url(#${maskId})`} />
      <rect x="22" y="89" width="156" height="22" fill="#b0aaf5" />
      <polygon points="22,100 52,80 52,120" fill="#b0aaf5" />
      <polygon points="178,100 148,80 148,120" fill="#b0aaf5" />
    </svg>
  );

  // ── Chat Screen ──
  const ChatScreen = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Agent header */}
      <div style={{ ...liqCard, borderRadius: 16, padding: "12px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, flexShrink: 0, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)" }} />
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(147,51,234,0.4)", border: "1px solid rgba(255,255,255,0.18)", borderTop: "1px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>✦</div>
        <div>
          <div style={{ ...txt(0.92, 14, 600), fontFamily: SFD }}>DAC Agent 1.0</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
            <span style={{ ...txt(0.5, 11, 400) }}>Online · Neural matrix active</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4, marginBottom: 14 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.r === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 10 }}>
            {m.r === "bot" && (
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(147,51,234,0.35)", border: "1px solid rgba(255,255,255,0.15)", borderTop: "1px solid rgba(255,255,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", flexShrink: 0 }}>✦</div>
            )}
            <div style={{
              maxWidth: "68%", padding: "11px 16px",
              borderRadius: m.r === "user" ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
              background: m.r === "user" ? "rgba(147,51,234,0.3)" : "rgba(255,255,255,0.07)",
              border: m.r === "user" ? "1px solid rgba(192,132,252,0.3)" : "1px solid rgba(255,255,255,0.1)",
              borderTop: m.r === "user" ? "1px solid rgba(220,180,255,0.45)" : "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(40px) saturate(200%)", WebkitBackdropFilter: "blur(40px) saturate(200%)",
              boxShadow: m.r === "user"
                ? "0 0 0 0.5px rgba(192,132,252,0.12) inset, 0 4px 16px rgba(147,51,234,0.15)"
                : "0 0 0 0.5px rgba(255,255,255,0.05) inset, 0 4px 16px rgba(0,0,0,0.15)",
              fontFamily: SF, fontSize: 14, fontWeight: 400,
              color: "rgba(255,255,255,0.9)", lineHeight: 1.7,
            }}>{m.t}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(147,51,234,0.35)", border: "1px solid rgba(255,255,255,0.15)", borderTop: "1px solid rgba(255,255,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", flexShrink: 0 }}>✦</div>
            <div style={{ ...liqCard, borderRadius: 20, padding: "12px 18px", display: "flex", gap: 6, alignItems: "center" }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.5)", animation: `liqDot .9s ease ${i * .22}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Chat input */}
      <div style={{ display: "flex", gap: 10, paddingBottom: 4, flexShrink: 0 }}>
        <input
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") send(); }}
          placeholder="Send a command to DAC Agent…"
          style={{ flex: 1, ...inputStyle(false), padding: "12px 18px" }}
        />
        <button onClick={send} style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(147,51,234,0.55)", border: "1px solid rgba(192,132,252,0.35)", borderTop: "1px solid rgba(220,180,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)", boxShadow: "0 0 14px rgba(147,51,234,0.4)", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(220,180,255,0.95)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );

  const titleMap = { chat: "CHAT ROOM" };
  const PANEL_H = "62vh";
  const PANEL_W = "min(900px, 80vw)";

  // ── Shared ambient dots + connector SVG for welcome/configure ──
  const AmbientDots = () => (
    <>
      {[...Array(16)].map((_, i) => (
        <div key={i} style={{ position: "absolute", width: i % 4 === 0 ? 4 : 2, height: i % 4 === 0 ? 4 : 2, borderRadius: "50%", background: i % 2 === 0 ? "rgba(192,132,252,0.55)" : "rgba(100,200,255,0.4)", left: `${5 + ((i * 23 + 11) % 88)}%`, top: `${10 + ((i * 37 + 7) % 80)}%`, boxShadow: `0 0 ${i % 3 === 0 ? 8 : 4}px rgba(168,85,247,0.4)`, animation: `nodeFloat ${2.5 + i * .35}s ease-in-out ${i * .2}s infinite`, pointerEvents: "none" }} />
      ))}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.11 }}>
        {[[10, 25, 30, 45], [30, 45, 55, 30], [55, 30, 75, 55], [75, 55, 90, 35], [20, 65, 45, 75], [45, 75, 70, 60]].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke="rgba(168,85,247,0.9)" strokeWidth="1" />
        ))}
      </svg>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Yuji+Syuku&family=Kaisei+HarunoUmi:wght@400;500;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{width:100%;height:100%;overflow:hidden;background:#000;font-family:'Yuji Syuku','Kaisei HarunoUmi',serif;font-size:14px}
        ::placeholder{color:rgba(255,255,255,0.25);font-family:'Yuji Syuku','Kaisei HarunoUmi',serif;letter-spacing:0.06em;font-size:14px}
        input,button{font-family:'Yuji Syuku','Kaisei HarunoUmi',serif;font-size:14px}
        @keyframes liqDot{0%,100%{opacity:.15;transform:scale(.65)}50%{opacity:.9;transform:scale(1)}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
        @keyframes introPulse{
          0%,100%{box-shadow:0 0 30px rgba(168,85,247,0.5),0 0 80px rgba(147,51,234,0.25),inset 0 1px 0 rgba(255,255,255,0.22);}
          50%{box-shadow:0 0 60px rgba(168,85,247,0.9),0 0 140px rgba(147,51,234,0.5),inset 0 1px 0 rgba(255,255,255,0.22);}
        }
        @keyframes floatBtn{0%,100%{transform:translateY(0px);}50%{transform:translateY(-10px);}}
        @keyframes rippleOut{0%{transform:scale(0);opacity:.7;}100%{transform:scale(4);opacity:0;}}
        @keyframes touchHint{0%,100%{opacity:.3;transform:scale(1);}50%{opacity:.8;transform:scale(1.08);}}
        @keyframes particleDrift{0%{transform:translateY(0) translateX(0) scale(1);opacity:.6;}100%{transform:translateY(-120px) translateX(var(--dx)) scale(0);opacity:0;}}
        @keyframes introFadeIn{from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);}}
        @keyframes doorLeft{0%{transform:translateX(0);}15%{transform:translateX(-2%);}100%{transform:translateX(-100%);}}
        @keyframes doorRight{0%{transform:translateX(0);}15%{transform:translateX(2%);}100%{transform:translateX(100%);}}
        @keyframes doorGlow{0%{opacity:0;}20%{opacity:1;}80%{opacity:1;}100%{opacity:0;}}
        @keyframes doorDust{0%{opacity:0;transform:scaleX(0);}20%{opacity:.6;transform:scaleX(1);}100%{opacity:0;transform:scaleX(1) translateY(-40px);}}
        @keyframes appReveal{from{opacity:0;transform:scale(0.96);}to{opacity:1;transform:scale(1);}}
        @keyframes welcomeFadeIn{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
        @keyframes configFadeIn{from{opacity:0;transform:translateY(28px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}}
        @keyframes nodeFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
        @keyframes kanji1{0%,100%{opacity:.06;}50%{opacity:.14;}}
        @keyframes kanji2{0%,100%{opacity:.04;}60%{opacity:.1;}}
        @keyframes scanLine{0%{transform:translateY(-100%);}100%{transform:translateY(500%);}}
        input:focus{
          border-color:rgba(192,132,252,0.65)!important;
          border-top-color:rgba(220,180,255,0.75)!important;
          box-shadow:0 0 0 1px rgba(192,132,252,0.18) inset,0 0 24px rgba(147,51,234,0.2)!important;
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        input[type=number]{-moz-appearance:textfield}
      `}</style>

      {/* ── WebGL canvas ── */}
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", background: "#000", zIndex: 0 }} />

      {/* ── Purple glow orb ── */}
      <div style={{ position: "fixed", top: "-22%", left: "50%", transform: "translateX(-50%)", width: "80vw", height: "60vw", maxWidth: 900, maxHeight: 680, background: "radial-gradient(ellipse at 50% 40%,rgba(147,51,234,0.85) 0%,rgba(109,40,217,0.5) 35%,rgba(76,29,149,0.2) 65%,transparent 100%)", borderRadius: "50%", filter: "blur(3px)", zIndex: 1, pointerEvents: "none" }} />

      {/* ════════════════════ INTRO ════════════════════ */}
      {phase === "intro" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "introFadeIn 0.8s ease both" }}>
          {/* Floating particles */}
          {[...Array(18)].map((_, i) => (
            <div key={i} style={{ position: "absolute", left: `${10 + ((i * 17 + 7) % 80)}%`, top: `${20 + ((i * 31 + 13) % 60)}%`, width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2, borderRadius: "50%", background: i % 2 === 0 ? "rgba(192,132,252,0.7)" : "rgba(100,200,255,0.5)", "--dx": `${((i * 19 - 9) % 60) - 30}px`, animation: `particleDrift ${2 + (i % 3)}s ease-in ${(i % 5) * .4}s infinite`, pointerEvents: "none" }} />
          ))}
          {/* Background kanji */}
          <div style={{ position: "absolute", top: "8%", left: "6%", fontSize: "8rem", color: "rgba(192,132,252,0.08)", fontFamily: SF, animation: "kanji1 4s ease-in-out infinite", pointerEvents: "none", userSelect: "none" }}>武</div>
          <div style={{ position: "absolute", bottom: "10%", right: "6%", fontSize: "6rem", color: "rgba(192,132,252,0.06)", fontFamily: SF, animation: "kanji2 5s ease-in-out 1s infinite", pointerEvents: "none", userSelect: "none" }}>道</div>
          <div style={{ position: "absolute", top: "15%", right: "10%", fontSize: "4rem", color: "rgba(147,51,234,0.07)", fontFamily: SF, animation: "kanji1 6s ease-in-out 2s infinite", pointerEvents: "none", userSelect: "none" }}>侍</div>
          <div style={{ position: "absolute", bottom: "20%", left: "9%", fontSize: "5rem", color: "rgba(147,51,234,0.05)", fontFamily: SF, animation: "kanji2 4.5s ease-in-out 0.5s infinite", pointerEvents: "none", userSelect: "none" }}>龍</div>
          {/* Horizontal rule lines */}
          <div style={{ position: "absolute", top: "38%", left: 0, right: 0, height: 1, background: "linear-gradient(to right,transparent 5%,rgba(192,132,252,0.12) 30%,rgba(192,132,252,0.12) 70%,transparent 95%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "62%", left: 0, right: 0, height: 1, background: "linear-gradient(to right,transparent 5%,rgba(192,132,252,0.08) 30%,rgba(192,132,252,0.08) 70%,transparent 95%)", pointerEvents: "none" }} />

          {/* Logo */}
          <div style={{ marginBottom: 28, animation: "nodeFloat 3s ease-in-out infinite" }}>
            <DACLogo size={120} maskId="dm_intro" />
          </div>

          <div style={{ fontFamily: SF, fontSize: 14, letterSpacing: "0.55em", color: "rgba(192,132,252,0.45)", marginBottom: 42, textTransform: "uppercase" }}>✦ &nbsp; Autonomous AI Ronin &nbsp; ✦</div>

          <button onClick={handleEnter} style={{ position: "relative", overflow: "hidden", padding: "28px 72px", borderRadius: 20, border: "1px solid rgba(192,132,252,0.35)", borderTop: "1px solid rgba(220,190,255,0.55)", background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px) saturate(200%)", WebkitBackdropFilter: "blur(40px) saturate(200%)", cursor: "pointer", animation: "introPulse 2.8s ease-in-out infinite, floatBtn 3.5s ease-in-out infinite", boxShadow: "0 0 40px rgba(168,85,247,0.55),0 0 100px rgba(147,51,234,0.28),inset 0 1px 0 rgba(255,255,255,0.22)" }}>
            {ripples.map(rp => (
              <span key={rp.id} style={{ position: "absolute", left: rp.x, top: rp.y, width: 20, height: 20, marginLeft: -10, marginTop: -10, borderRadius: "50%", background: "rgba(192,132,252,0.5)", animation: "rippleOut 0.9s ease-out both", pointerEvents: "none" }} />
            ))}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.09) 50%,transparent 65%)", pointerEvents: "none" }} />
            <div style={{ fontFamily: SF, fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 700, letterSpacing: "0.28em", color: "#fff", textShadow: "0 0 24px rgba(192,132,252,0.9),0 0 60px rgba(147,51,234,0.6)", position: "relative", zIndex: 1, userSelect: "none" }}>DAC AGENT</div>
          </button>

          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ animation: "touchHint 2s ease-in-out infinite" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9 11.5V6.5a1.5 1.5 0 013 0v3m0 0a1.5 1.5 0 013 0v1m0 0a1.5 1.5 0 013 0v3.5a6 6 0 01-6 6H9.5A5.5 5.5 0 014 14.5v-2a1.5 1.5 0 013 0" stroke="rgba(192,132,252,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div style={{ fontFamily: SF, fontSize: 14, letterSpacing: "0.35em", color: "rgba(192,132,252,0.35)" }}>TOUCH TO ENTER</div>
          </div>
        </div>
      )}

      {/* ════════════════════ DOJO DOORS ════════════════════ */}
      {phase === "opening" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, marginLeft: -1, background: "rgba(220,180,255,0.9)", filter: "blur(6px)", animation: "doorGlow 1.8s ease both", zIndex: 62 }} />
          {/* Left door */}
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "50%", background: "rgba(8,2,18,0.96)", backdropFilter: "blur(2px)", animation: "doorLeft 1.7s cubic-bezier(0.7,0,0.85,1) 0.1s both", zIndex: 61, overflow: "hidden" }}>
            {[...Array(8)].map((_, i) => <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: `${(i + 1) * 12.5}%`, width: 1, background: "rgba(192,132,252,0.07)" }} />)}
            {[...Array(12)].map((_, i) => <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${(i + 1) * 8.33}%`, height: 1, background: "rgba(192,132,252,0.07)" }} />)}
            <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 6, background: "linear-gradient(to left,rgba(192,132,252,0.3),transparent)" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "5rem", color: "rgba(192,132,252,0.12)", fontFamily: SF, userSelect: "none" }}>武</div>
          </div>
          {/* Right door */}
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "50%", background: "rgba(8,2,18,0.96)", backdropFilter: "blur(2px)", animation: "doorRight 1.7s cubic-bezier(0.7,0,0.85,1) 0.1s both", zIndex: 61, overflow: "hidden" }}>
            {[...Array(8)].map((_, i) => <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: `${(i + 1) * 12.5}%`, width: 1, background: "rgba(192,132,252,0.07)" }} />)}
            {[...Array(12)].map((_, i) => <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${(i + 1) * 8.33}%`, height: 1, background: "rgba(192,132,252,0.07)" }} />)}
            <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 6, background: "linear-gradient(to right,rgba(192,132,252,0.3),transparent)" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "5rem", color: "rgba(192,132,252,0.12)", fontFamily: SF, userSelect: "none" }}>道</div>
          </div>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 120, marginLeft: -60, background: "radial-gradient(ellipse at 50% 50%,rgba(220,180,255,0.35) 0%,transparent 70%)", animation: "doorDust 1.7s ease both", zIndex: 63 }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 60, marginLeft: -30, background: "radial-gradient(ellipse at 50% 50%,rgba(255,255,255,0.25) 0%,transparent 70%)", animation: "doorDust 1.4s ease 0.1s both", zIndex: 63 }} />
        </div>
      )}

      {/* ════════════════════ WELCOME ════════════════════ */}
      {phase === "welcome" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "welcomeFadeIn 0.7s ease both" }}>
          <AmbientDots />

          {/* Logo orb */}
          <div style={{ width: 90, height: 90, borderRadius: "50%", background: "rgba(10,5,20,0.85)", border: "2px solid rgba(139,92,246,0.6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28, boxShadow: "0 0 30px rgba(139,92,246,0.4), 0 0 60px rgba(139,92,246,0.15)", animation: "nodeFloat 3s ease-in-out infinite" }}>
            <DACLogo size={52} maskId="wdm" />
          </div>

          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: SF, fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.85)", letterSpacing: "0.06em", marginBottom: 8 }}>Welcome To</div>
            <div style={{ fontFamily: SF, fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 700, letterSpacing: "0.12em", background: "linear-gradient(135deg,#818cf8,#a855f7,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1.2 }}>DAC AGENT</div>
          </div>

          <div style={{ fontFamily: SF, fontSize: 14, color: "rgba(255,255,255,0.38)", letterSpacing: "0.04em", marginBottom: 36, textAlign: "center" }}>
            Start chatting and researching with DAC AGENT now
          </div>

          <div style={{ width: "min(540px,80vw)", display: "flex", gap: 10, marginBottom: 16, position: "relative" }}>
            <input
              value={welcomeInput}
              onChange={e => setWelcomeInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") setPhase("configure"); }}
              placeholder="Enter research topic..."
              style={{ flex: 1, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(139,92,246,0.3)", borderTop: "1px solid rgba(192,132,252,0.42)", borderRadius: 14, padding: "14px 54px 14px 20px", color: "rgba(255,255,255,0.85)", fontFamily: SF, fontSize: 14, outline: "none", boxShadow: "0 0 0 1px rgba(139,92,246,0.1) inset" }}
            />
            <button onClick={() => setPhase("configure")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: 10, background: "rgba(147,51,234,0.55)", border: "1px solid rgba(192,132,252,0.35)", borderTop: "1px solid rgba(220,180,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)", boxShadow: "0 0 14px rgba(147,51,234,0.4)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(220,180,255,0.95)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>

          <button onClick={() => setPhase("configure")} style={{ width: "min(540px,80vw)", padding: "15px", borderRadius: 999, background: "rgba(147,51,234,0.25)", backdropFilter: "blur(30px) saturate(180%)", WebkitBackdropFilter: "blur(30px) saturate(180%)", border: "1px solid rgba(192,132,252,0.35)", borderTop: "1px solid rgba(220,180,255,0.5)", color: "rgba(220,180,255,0.95)", fontFamily: SF, fontSize: 14, fontWeight: 600, letterSpacing: "0.12em", cursor: "pointer", boxShadow: "0 0 0 0.5px rgba(192,132,252,0.15) inset, 0 8px 32px rgba(147,51,234,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(192,132,252,0.6)" }} />
            Next Step
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(192,132,252,0.6)" }} />
          </button>
        </div>
      )}

      {/* ════════════════════ CONFIGURE YOUR AI AGENTS ════════════════════ */}
      {phase === "configure" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "configFadeIn 0.65s cubic-bezier(0.22,1,0.36,1) both" }}>
          <AmbientDots />

          {/* Background kanji for this slide */}
          <div style={{ position: "absolute", top: "6%", right: "5%", fontSize: "7rem", color: "rgba(192,132,252,0.05)", fontFamily: SF, animation: "kanji1 5s ease-in-out infinite", pointerEvents: "none", userSelect: "none" }}>設</div>
          <div style={{ position: "absolute", bottom: "8%", left: "5%", fontSize: "5.5rem", color: "rgba(147,51,234,0.04)", fontFamily: SF, animation: "kanji2 4.5s ease-in-out 1.2s infinite", pointerEvents: "none", userSelect: "none" }}>定</div>

          {/* ── Card ── */}
          <div style={{ width: "min(580px,88vw)", ...liqCard, borderRadius: 24, padding: "40px 40px 36px", position: "relative", overflow: "hidden", boxShadow: "0 0 0 1px rgba(255,255,255,0.1) inset, 0 0 80px rgba(147,51,234,0.2), 0 40px 80px rgba(0,0,0,0.55)" }}>

            {/* Top shimmer */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent 5%,rgba(255,255,255,0.48) 35%,rgba(192,132,252,0.32) 60%,transparent 95%)" }} />

            {/* Subtle scan-line */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60, background: "linear-gradient(to bottom,transparent,rgba(192,132,252,0.025),transparent)", animation: "scanLine 5s linear infinite", pointerEvents: "none" }} />

            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
              <div style={{ width: 50, height: 50, borderRadius: 15, background: "rgba(147,51,234,0.35)", border: "1px solid rgba(255,255,255,0.15)", borderTop: "1px solid rgba(255,255,255,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 22px rgba(147,51,234,0.3)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(192,132,252,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14M15.54 8.46a5 5 0 010 7.07M8.46 8.46a5 5 0 000 7.07" />
                </svg>
              </div>
              <div>
                {/* Bold title at 14px using default font */}
                <div style={{ fontFamily: SF, fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.93)", letterSpacing: "0.07em", textTransform: "uppercase", textShadow: "0 0 18px rgba(192,132,252,0.45)" }}>
                  Configure Your AI Agents
                </div>
                <div style={{ fontFamily: SF, fontSize: 14, color: "rgba(255,255,255,0.30)", marginTop: 5 }}>
                  Set parameters before launching the neural matrix
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "linear-gradient(to right,transparent,rgba(192,132,252,0.22),rgba(100,200,255,0.12),transparent)", marginBottom: 28 }} />

            {/* ── Two evenly-spaced fields ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>

              {/* Custom Loop Count */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 6, background: "rgba(147,51,234,0.3)", border: "1px solid rgba(192,132,252,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(192,132,252,0.85)" strokeWidth="2.5" strokeLinecap="round"><path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" /></svg>
                  </div>
                  {/* Bold label at default 14px */}
                  <label style={{ fontFamily: SF, fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.78)", letterSpacing: "0.03em" }}>
                    Custom Loop Count&nbsp;<span style={{ color: "rgba(255,100,100,0.85)", fontWeight: 700 }}>*</span>
                  </label>
                </div>
                <input
                  type="number"
                  value={loopCount}
                  onChange={e => { setLoopCount(e.target.value); setCfgErrors(err => ({ ...err, loop: undefined })); }}
                  placeholder="Type any number, e.g. 3"
                  style={inputStyle(!!cfgErrors.loop)}
                />
                {cfgErrors.loop && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: SF, fontSize: 14, color: "rgba(255,100,100,0.85)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {cfgErrors.loop}
                  </div>
                )}
              </div>

              {/* Number of Research Papers */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 6, background: "rgba(147,51,234,0.3)", border: "1px solid rgba(192,132,252,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(192,132,252,0.85)" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  </div>
                  {/* Bold label at default 14px */}
                  <label style={{ fontFamily: SF, fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.78)", letterSpacing: "0.03em" }}>
                    Research Papers&nbsp;<span style={{ color: "rgba(255,100,100,0.85)", fontWeight: 700 }}>*</span>
                  </label>
                </div>
                <input
                  type="number"
                  value={paperCount}
                  onChange={e => { setPaperCount(e.target.value); setCfgErrors(err => ({ ...err, paper: undefined })); }}
                  placeholder="Type any number, e.g. 8"
                  style={inputStyle(!!cfgErrors.paper)}
                />
                {cfgErrors.paper && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: SF, fontSize: 14, color: "rgba(255,100,100,0.85)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {cfgErrors.paper}
                  </div>
                )}
              </div>
            </div>

            {/* Mandatory notice */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 28, padding: "10px 14px", borderRadius: 10, background: "rgba(192,132,252,0.05)", border: "1px solid rgba(192,132,252,0.1)" }}>
              <span style={{ color: "rgba(255,100,100,0.75)", fontSize: 14, lineHeight: 1 }}>*</span>
              <span style={{ fontFamily: SF, fontSize: 14, color: "rgba(255,255,255,0.28)" }}>All fields are mandatory to proceed</span>
            </div>

            {/* Launch button */}
            <button onClick={handleLaunch} style={{ width: "100%", padding: "16px", borderRadius: 999, background: "rgba(147,51,234,0.28)", backdropFilter: "blur(30px) saturate(180%)", WebkitBackdropFilter: "blur(30px) saturate(180%)", border: "1px solid rgba(192,132,252,0.4)", borderTop: "1px solid rgba(220,180,255,0.55)", color: "rgba(220,180,255,0.95)", fontFamily: SF, fontSize: 14, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 0 0 0.5px rgba(192,132,252,0.2) inset, 0 8px 32px rgba(147,51,234,0.38)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.07) 50%,transparent 65%)", pointerEvents: "none" }} />
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              Launch Agent
            </button>

            {/* Back link */}
            <button onClick={() => setPhase("welcome")} style={{ width: "100%", marginTop: 14, padding: "10px", background: "transparent", border: "none", cursor: "pointer", fontFamily: SF, fontSize: 14, color: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
              Back to Welcome
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════ MAIN APP ════════════════════ */}
      {phase === "app" && (
        <div style={{ animation: "appReveal 0.6s ease both" }}>
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, 20%)", width: PANEL_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, zIndex: 10 }}>

            {/* Title */}
            <div style={{ textAlign: "center", pointerEvents: "none", width: "100%" }}>
              <div style={{ fontFamily: SF, fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 700, letterSpacing: "0.22em", color: "#fff", textShadow: "0 0 28px rgba(168,85,247,0.95),0 0 70px rgba(147,51,234,0.6)", whiteSpace: "nowrap", textAlign: "center" }}>
                DAC AGENT
              </div>
            </div>

            {/* Main window */}
            <div style={{ width: "100%", height: PANEL_H, display: "flex", flexDirection: "column", borderRadius: 20, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)" }}>

              {/* Title bar */}
              <div style={{ ...liqBase, borderRadius: "0", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 16px", height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent 2%,rgba(255,255,255,0.55) 35%,rgba(200,160,255,0.35) 60%,transparent 98%)", pointerEvents: "none" }} />
                <div style={{ width: 58 }} />
                <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
                  <span style={{ fontFamily: SF, fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em" }}>{titleMap[active]}</span>
                </div>
                <div style={{ width: 58 }} />
              </div>

              {/* Sidebar + content */}
              <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

                {/* Sidebar */}
                <div style={{ ...liqBase, borderRadius: 0, borderRight: "1px solid rgba(255,255,255,0.07)", borderLeft: "none", borderTop: "none", width: 220, flexShrink: 0, display: "flex", flexDirection: "column", padding: "18px 12px", gap: 4, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 1, background: "linear-gradient(to bottom,transparent 5%,rgba(200,160,255,0.25) 30%,rgba(100,200,255,0.15) 60%,transparent 95%)", pointerEvents: "none" }} />
                  <div style={{ padding: "8px 10px 18px" }}>
                    <div style={{ fontFamily: SFD, fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.03em", textShadow: "0 0 20px rgba(192,132,252,0.5)" }}>DAC AGENT</div>
                    <div style={{ ...label, marginTop: 3 }}>Forge Your Legacy</div>
                  </div>
                  <div style={{ ...label, paddingLeft: 10, marginBottom: 4 }}>Navigation</div>
                  {NAV.map(item => (
                    <button key={item.id} onClick={() => setActive(item.id)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 12, border: "none", cursor: "pointer", width: "100%", textAlign: "left", background: active === item.id ? "rgba(147,51,234,0.22)" : "transparent", borderLeft: active === item.id ? "2px solid rgba(192,132,252,0.7)" : "2px solid transparent", backdropFilter: active === item.id ? "blur(20px)" : "none", transition: "all 0.18s", color: active === item.id ? "rgba(220,180,255,0.95)" : "rgba(255,255,255,0.38)", boxShadow: active === item.id ? "0 0 0 1px rgba(192,132,252,0.1) inset" : "none" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
                      <span style={{ fontFamily: SF, fontSize: 14, fontWeight: active === item.id ? 600 : 400, letterSpacing: "0.01em" }}>{item.label}</span>
                    </button>
                  ))}
                  <div style={{ flex: 1 }} />

                  {/* Config summary pill */}
                  <div style={{ ...liqCard, borderRadius: 12, padding: "10px 14px", marginBottom: 8, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)" }} />
                    <div style={{ fontFamily: SF, fontSize: 14, fontWeight: 700, color: "rgba(192,132,252,0.7)", marginBottom: 6, letterSpacing: "0.04em" }}>Agent Config</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: SF, fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Loops</span>
                        <span style={{ fontFamily: SF, fontSize: 14, fontWeight: 700, color: "rgba(192,132,252,0.85)" }}>{loopCount}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: SF, fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Papers</span>
                        <span style={{ fontFamily: SF, fontSize: 14, fontWeight: 700, color: "rgba(192,132,252,0.85)" }}>{paperCount}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ ...liqCard, borderRadius: 12, padding: "12px 14px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80", flexShrink: 0 }} />
                      <span style={{ fontFamily: SF, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>System Online&nbsp;<span style={{ fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>v1.0</span></span>
                    </div>
                  </div>
                </div>

                {/* Content area */}
                <div style={{ ...liqBase, borderRadius: 0, borderLeft: "none", borderTop: "none", borderRight: "none", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent 2%,rgba(255,255,255,0.12) 40%,rgba(200,160,255,0.1) 65%,transparent 98%)", pointerEvents: "none", zIndex: 1 }} />
                  <div style={{ padding: "12px 24px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontFamily: SFD, fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{titleMap[active]}</div>
                    <div style={{ fontFamily: SF, fontSize: 14, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit", year: "numeric" })}</div>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 0", display: "flex", flexDirection: "column" }}>
                    {active === "chat" && <ChatScreen />}
                  </div>
                </div>
              </div>

              {/* Status bar */}
              <div style={{ ...liqBase, borderRadius: "0", borderTop: "1px solid rgba(255,255,255,0.07)", height: 32, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 18px", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent 2%,rgba(255,255,255,0.18) 40%,rgba(200,160,255,0.1) 65%,transparent 98%)", pointerEvents: "none" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 5px #4ade80" }} />
                  <span style={{ ...txt(0.5, 14, 500) }}>Online</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontFamily: SF, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Sessions: 47</span>
                  <span style={{ fontFamily: SF, fontSize: 10, color: "rgba(255,255,255,0.18)" }}>|</span>
                  <span style={{ fontFamily: SF, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Tasks: 312</span>
                  <span style={{ fontFamily: SF, fontSize: 10, color: "rgba(255,255,255,0.18)" }}>|</span>
                  <span style={{ fontFamily: SF, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}