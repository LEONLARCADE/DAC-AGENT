import React, { useState } from 'react';
import { Play, Sparkles, SlidersHorizontal, Settings2, Loader2, CheckCircle2, Circle, ChevronLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ParticleBackground from './ParticleBackground';

const MainContent = ({ toggleSidebar, isSidebarOpen }) => {
    const [step, setStep] = useState(1);
    const [topic, setTopic] = useState("");
    const [loopCount, setLoopCount] = useState(1);
    const [paperCount, setPaperCount] = useState(50);
    const [loading, setLoading] = useState(false);
    const [pipelineHistory, setPipelineHistory] = useState([]);
    const [finalResult, setFinalResult] = useState(null);
    const [error, setError] = useState(null);

    const handleNext = () => {
        if (topic) setStep(2);
    };

    const handleBack = () => {
        if (step > 1 && !loading) {
            setStep(step - 1);
        }
    };

    const handleStart = async () => {
        setStep(3);
        setLoading(true);
        setPipelineHistory([]);
        setFinalResult(null);
        setError(null);

        try {
            const response = await fetch("http://127.0.0.1:8000/run-pipeline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, loop_count: parseInt(loopCount), paper_count: parseInt(paperCount) })
            });

            if (!response.ok) throw new Error("Pipeline returned an error");

            const data = await response.json();

            // Simulate slow arrival of history steps for UI animation
            data.pipeline_history.forEach((stepItem, index) => {
                setTimeout(() => {
                    setPipelineHistory(prev => [...prev, stepItem]);
                }, index * 400);
            });

            setTimeout(() => {
                setFinalResult(data.final_result);
                setLoading(false);
            }, data.pipeline_history.length * 400);

        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const isRunning = step === 3;

    return (
        <div className="flex-1 relative overflow-y-auto overflow-x-hidden flex flex-col items-center custom-scrollbar h-screen pb-12">
            {/* Particle Background */}
            <ParticleBackground isSmall={isRunning} />

            {/* Background glow Orb */}
            <div className={`bg-glow-orb h-[500px] w-[500px] rounded-full filter blur-[100px] absolute top-[-100px] transition-opacity duration-1000 ${isRunning ? 'opacity-10' : 'opacity-40'}`}></div>

            {/* Top Bar with Sidebar Toggle & Back Arrow */}
            <div className="w-full p-6 flex justify-between items-center z-10 min-h-[80px] sticky top-0 bg-[#0B0D13]/50 backdrop-blur-md">
                <div className="flex items-center">
                    <button onClick={toggleSidebar} className="p-2 bg-surface hover:bg-surfaceHover rounded-full transition-colors mr-3 border border-borderContent">
                        {isSidebarOpen ? <PanelLeftClose size={20} className="text-white" /> : <PanelLeftOpen size={20} className="text-white" />}
                    </button>
                    {step > 1 && (
                        <button onClick={handleBack} disabled={loading} className="p-2 bg-surface hover:bg-surfaceHover rounded-full transition-colors mr-3 disabled:opacity-50 border border-borderContent">
                            <ChevronLeft size={20} className="text-white" />
                        </button>
                    )}
                    <span className="text-white font-medium text-sm hidden sm:block">AI Assistant</span>
                </div>
                <button className="flex items-center space-x-2 bg-surface border border-borderContent px-3 py-1.5 rounded-full text-sm font-medium hover:bg-surfaceHover transition-colors">
                    <span>AI Menu</span>
                    <Settings2 size={14} className="text-textMuted" />
                </button>
            </div>

            <div className="flex-1 w-full max-w-4xl px-8 pt-6 flex flex-col items-center justify-start z-10 transition-all duration-500">

                {/* --- SCREEN 1: TOPIC INPUT --- */}
                {step === 1 && (
                    <div className="flex flex-col items-center w-full animate-[slideIn_0.4s_ease-out]">
                        {/* Logo */}
                        <div className="w-24 h-24 rounded-full shadow-[0_0_40px_rgba(59,130,246,0.6)] bg-gradient-to-tr from-[#3b82f6] to-[#6366f1] p-[2px] mb-6">
                            <div className="w-full h-full rounded-full bg-[#15171C] flex items-center justify-center relative overflow-hidden">
                                <Sparkles size={36} className="text-[#3b82f6]" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-semibold text-white/90 mb-2">Welcome To</h1>
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] bg-clip-text text-transparent mb-12">Elite AI Research</h2>

                        <p className="text-textMuted mb-6 font-medium text-sm">Start chatting and researching with Elite AI now</p>

                        <div className="w-full max-w-md glass-panel p-2 flex items-center mb-8 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                            <input
                                type="text"
                                placeholder="Enter research topic..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                className="flex-1 bg-transparent border-none text-white outline-none placeholder:text-textMuted px-4 text-sm"
                            />
                            <button
                                onClick={handleNext}
                                disabled={!topic}
                                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white p-2.5 rounded-full transition-colors disabled:opacity-50"
                            >
                                <ChevronLeft size={18} className="rotate-180" />
                            </button>
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={!topic}
                            className="w-full max-w-md bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium py-3.5 rounded-full transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 text-sm"
                        >
                            Next Step
                        </button>
                    </div>
                )}

                {/* --- SCREEN 2: CONFIGURATION --- */}
                {step === 2 && (
                    <div className="flex flex-col items-center w-full animate-[slideIn_0.4s_ease-out]">
                        <h2 className="text-2xl font-semibold text-white mb-8">Configure your AI Agents</h2>

                        <div className="grid grid-cols-2 gap-4 w-full max-w-xl mb-6">
                            <div className={`bg-surface border-2 rounded-2xl p-5 cursor-pointer transition-all ${loopCount === 1 ? 'border-[#3B82F6] shadow-[0_0_20px_rgba(59,130,246,0.2)] bg-[#3B82F6]/5' : 'border-borderContent hover:border-[#3B82F6]/50'}`} onClick={() => setLoopCount(1)}>
                                <div className="w-10 h-10 rounded-full bg-[#3B82F6]/20 flex items-center justify-center mb-4">
                                    <Sparkles size={18} className="text-[#3B82F6]" />
                                </div>
                                <h3 className="text-white font-medium mb-1 text-sm">Standard Search</h3>
                                <p className="text-xs text-textMuted leading-relaxed">1 Iteration loop. Fast data gathering and initial synthesis.</p>
                            </div>

                            <div className={`bg-surface border-2 rounded-2xl p-5 cursor-pointer transition-all ${loopCount === 3 ? 'border-[#3B82F6] shadow-[0_0_20px_rgba(59,130,246,0.2)] bg-[#3B82F6]/5' : 'border-borderContent hover:border-[#3B82F6]/50'}`} onClick={() => setLoopCount(3)}>
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                                    <SlidersHorizontal size={18} className="text-purple-400" />
                                </div>
                                <h3 className="text-white font-medium mb-1 text-sm">Deep Analysis</h3>
                                <p className="text-xs text-textMuted leading-relaxed">3 Iteration loops. Generator & Critic iteratively refine results.</p>
                            </div>
                        </div>

                        <div className="w-full max-w-xl bg-surface border border-borderContent rounded-2xl p-4 mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-medium text-sm">Custom Loop Count</h3>
                                <p className="text-[11px] text-textMuted mt-0.5">Set a specific number of iterations (1-10)</p>
                            </div>
                            <input
                                type="number"
                                min="1" max="10"
                                value={loopCount}
                                onChange={e => setLoopCount(Number(e.target.value))}
                                className="bg-[#0B0D13] border border-borderContent text-white px-3 py-2 rounded-xl w-16 text-center outline-none focus:border-[#3B82F6] transition-colors text-sm"
                            />
                        </div>

                        <div className="w-full max-w-xl bg-surface border border-borderContent rounded-2xl p-4 mb-8 flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-medium text-sm">Number of Research Papers</h3>
                                <p className="text-[11px] text-textMuted mt-0.5">How many papers to fetch from the Collector</p>
                            </div>
                            <input
                                type="number"
                                min="1" max="500"
                                value={paperCount}
                                onChange={e => setPaperCount(Number(e.target.value))}
                                className="bg-[#0B0D13] border border-borderContent text-white px-3 py-2 rounded-xl w-24 text-center outline-none focus:border-[#3B82F6] transition-colors text-sm"
                            />
                        </div>

                        <button
                            onClick={handleStart}
                            className="w-full max-w-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium py-3.5 rounded-full transition-all shadow-[0_0_30px_rgba(59,130,246,0.4)] flex justify-center items-center space-x-2 text-sm"
                        >
                            <Play size={16} className="fill-current" />
                            <span>Start Research Chat</span>
                        </button>
                    </div>
                )}

                {/* --- SCREEN 3: PIPELINE EXECUTION --- */}
                {step === 3 && (
                    <div className="flex flex-col items-center w-full animate-[slideIn_0.4s_ease-out]">
                        <div className="w-full max-w-2xl mb-4 flex justify-end">
                            <div className="bg-surface/80 border border-borderContent rounded-xl px-4 py-3 inline-block shadow-md">
                                <p className="text-sm text-textMain">Analyze topic: <span className="text-[#3B82F6] font-medium">"{topic}"</span> with {loopCount} loop(s).</p>
                            </div>
                        </div>

                        <div className="w-full max-w-2xl glass-panel p-6 flex flex-col space-y-6">
                            {error && <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/50">{error}</div>}

                            <div className="space-y-4">
                                {pipelineHistory.map((stepItem, idx) => (
                                    <div key={idx} className="flex items-start space-x-3">
                                        <div className="mt-1"><CheckCircle2 size={16} className="text-[#3B82F6]" /></div>
                                        <div>
                                            <div className="text-sm font-semibold text-white">{stepItem.agent}</div>
                                            <div className="text-xs text-textMuted mt-0.5">Task completed successfully.</div>
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex items-center space-x-3 text-textMuted animate-pulse pt-2">
                                        <Circle size={16} className="text-[#3B82F6]/50" />
                                        <span className="text-xs font-medium">Agents are analyzing...</span>
                                    </div>
                                )}
                            </div>

                            {finalResult && (
                                <div className="mt-8 mb-12 space-y-6 bg-[#0B0D13]/60 border border-borderContent rounded-2xl p-6 shadow-2xl backdrop-blur-xl w-full">
                                    <div className="flex items-center space-x-3 mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#6366f1] flex items-center justify-center p-[1px]">
                                            <div className="w-full h-full rounded-full bg-[#0B0D13] flex items-center justify-center">
                                                <Sparkles size={14} className="text-[#3b82f6]" />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white/90">Final Insight Synthesis</h3>
                                    </div>

                                    <div className="space-y-8 pl-11">
                                        {Object.entries(finalResult).map(([key, value], index) => {
                                            if (key === 'previous_data' || key === 'agent') return null;

                                            const formattedKey = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                            const delay = `${0.3 + (index * 0.15)}s`;

                                            if (Array.isArray(value)) {
                                                return (
                                                    <div key={key} className="animate-slide-up" style={{ animationDelay: delay }}>
                                                        <h4 className="text-[13px] font-bold text-[#818CF8] mb-3 uppercase tracking-wider">{formattedKey}</h4>
                                                        <ul className="list-none space-y-3">
                                                            {value.map((item, i) => (
                                                                <li key={i} className="flex items-start text-[14.5px] text-white/80 leading-relaxed bg-white/5 rounded-lg p-3 border border-white/5">
                                                                    <span className="text-[#3b82f6] mr-3 mt-0.5 font-bold">•</span>
                                                                    {item}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )
                                            }

                                            if (typeof value === 'object' && value !== null) {
                                                return null;
                                            }

                                            return (
                                                <div key={key} className="animate-slide-up" style={{ animationDelay: delay }}>
                                                    <h4 className="text-[13px] font-bold text-[#818CF8] mb-2 uppercase tracking-wider">{formattedKey}</h4>
                                                    <p className="text-[14.5px] text-white/80 leading-relaxed bg-white/5 rounded-lg p-4 border border-white/5">
                                                        {value}
                                                    </p>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Keep Raw JSON as a toggleable dev tool / details panel at the bottom */}
                                    <details className="animate-slide-up mt-8 border-t border-white/10 pt-4" style={{ animationDelay: '1.5s' }}>
                                        <summary className="text-xs text-textMuted cursor-pointer hover:text-white transition-colors">Developer Payload Details</summary>
                                        <div className="border border-borderContent rounded-xl bg-[#0B0D13] p-4 mt-3 relative">
                                            <div className="absolute top-2 right-2 text-[10px] font-mono font-medium text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-1 rounded">Raw JSON</div>
                                            <pre className="text-[11px] text-[#A5B4FC] overflow-x-auto font-mono leading-relaxed mt-2 custom-scrollbar">
                                                {JSON.stringify(finalResult, null, 2)}
                                            </pre>
                                        </div>
                                    </details>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainContent;
