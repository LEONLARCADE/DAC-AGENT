import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const ParticleBackground = ({ isSmall }) => {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = (container) => {
        console.log("Particles loaded", container);
    };

    const options = {
        fullScreen: {
            enable: !isSmall,
            zIndex: 0
        },
        background: {
            color: { value: "transparent" },
        },
        fpsLimit: 120,
        interactivity: {
            events: {
                onClick: { enable: true, mode: "push" },
                onHover: { enable: true, mode: "repulse" },
                resize: true,
            },
            modes: {
                push: { quantity: 4 },
                repulse: { distance: 100, duration: 0.4 },
            },
        },
        particles: {
            color: { value: ["#D0A1FF", "#ec4899", "#3b82f6"] },
            links: {
                color: "#D0A1FF",
                distance: 150,
                enable: !isSmall,
                opacity: 0.2,
                width: 1,
            },
            move: {
                direction: "none",
                enable: true,
                outModes: { default: "bounce" },
                random: false,
                speed: isSmall ? 1 : 2,
                straight: false,
            },
            number: {
                density: { enable: true, area: 800 },
                value: isSmall ? 20 : 80,
            },
            opacity: { value: 0.5 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: isSmall ? 2 : 4 } },
        },
        detectRetina: true,
    };

    if (!init) return null;

    return (
        <div className={`transition-all duration-1000 ease-in-out absolute pointer-events-none ${isSmall
                ? "w-24 h-24 rounded-full overflow-hidden shadow-[0_0_30px_rgba(208,161,255,0.3)] bg-[#15171C] top-8 left-1/2 -translate-x-1/2 opacity-80"
                : "inset-0 w-full h-full opacity-40 mix-blend-screen"
            }`}>
            <Particles
                id="tsparticles"
                particlesLoaded={particlesLoaded}
                options={options}
                className="w-full h-full"
            />
        </div>
    );
};

export default ParticleBackground;
