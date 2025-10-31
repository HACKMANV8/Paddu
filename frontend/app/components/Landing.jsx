"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Permanent_Marker } from "next/font/google";
import { Bricolage_Grotesque } from "next/font/google";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700"],
});


const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
});



function StarryBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let w, h, focalLength;
    let numStars = 1000;
    let stars = [];

    // Helper function to initialize or re-initialize stars
    const initStars = () => {
      stars = Array.from({ length: numStars }, () => ({
        x: Math.random() * w - w / 2,
        y: Math.random() * h - h / 2,
        z: Math.random() * w,
        o: Math.random(),
      }));
    };

    // Main resize function
    const resizeCanvas = () => {
      // Get the device pixel ratio for high-resolution screens
      const dpr = window.devicePixelRatio || 1;

      // Set canvas size, scaled for pixel ratio
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr); // Scale context to match canvas size

      focalLength = w / 2;
      initStars();
    };

    // Animation loop
    const animate = () => {
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < numStars; i++) {
        const star = stars[i];
        star.z -= 5;
        if (star.z <= 0) star.z = w;

        const k = focalLength / star.z;
        const px = star.x * k + w / 2;
        const py = star.y * k + h / 2;

        if (px >= 0 && px <= w && py >= 0 && py <= h) {
          const size = (1 - star.z / w) * 2.7;
          const brightness = (1 - star.z / w) * 1.0 + 0.2;

          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 192, 220, ${brightness})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = "white";
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Initial setup and event listeners
    resizeCanvas();
    animate();
    window.addEventListener("resize", resizeCanvas);

    
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
    />
  );
}

function Title() {
  return (
    
    <div className="">
      <div className={`${permanentMarker.className}  min-h-screen relative z-10 flex flex-col items-center justify-center  text-center px-6`}>
         <h1 className= "text-4xl md:text-8xl font-extrabold mb-8 bg-linear-to-r from-violet-500 via-violet-700 to-fuchsia-900  bg-clip-text text-transparent drop-shadow-2xl">
        Khoj
      </h1>
      <p className="text-lg md:text-2xl text-gray-300 mb-25 font-light">
        A structured way to tunnel your curiosity !!
      </p>
      {/* Login Button */}
      <Link href="/Login" passHref>
        <button className={ `${bricolageGrotesque.className}group relative px-10 py-4 text-lg font-semibold rounded-full overflow-hidden transition-all hover:scale-105 mb-4 border-none outline-none`}>
        <div className="absolute inset-0 bg-linear-to-r from-violet-900 via-violet-700 to-fuchsia-900"></div>
        <div className="absolute inset-0 bg-linear-to-r from-violet-600 via-white-600 to-grey-600 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity"></div>
        <span className="relative z-10">Login</span>
      </button>
      </Link>
      
      {/* Sign up hint */}
      <p className="text-gray-400 text-lg">
        Not signed up?{" "}
        <a
          href="/SignUp" 
          className="text-violet-400 hover:text-fuchsia-300 transition-colors"
        >
          Sign up
        </a>
      </p>
      </div>
     
      {/* Features Section */}
      <section className={`${bricolageGrotesque.className} min-h-screen relative z-10 flex flex-col items-center justify-center  text-center px-6`}>
        <div className="max-w-7xl mx-auto">
          <h2 className={`${bricolageGrotesque.className} text-5xl md:text-6xl font-bold mb-16 text-center bg-linear-to-r from-violet-500 via-violet-700 to-fuchsia-600 bg-clip-text text-transparent`}>
            Our Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon:  <Image src="/calendar(3).png" alt="icon" width={48} height={48} className="mx-auto" />,
                title: "Personalized Schedule",
                desc: "Smart timetables that adapt to your goals, pace, and daily routine, just like a personal coach. ",
              },
              {
                icon:  <Image src="/books.png" alt="icon" width={48} height={48} className="mx-auto" />,
                title: "Curated learning resources",
                desc: "Hand-picked courses, videos, and articles customized to your interests and progress..",
              },
              {
                icon:  <Image src="/progress.png" alt="icon" width={48} height={48} className="mx-auto" />,
                title: "Progress Tracker",
                desc: "Track your progress , evaluate your learning , and stay motivated",
              },
              {
                icon:  <Image src="/bell.png" alt="icon" width={48} height={48} className="mx-auto" />,
                title: "Custom Reminders",
                desc: "Stay consistent with reminders sent via Email or WhatsApp at your chosen frequency.",
              },
              {
                icon:  <Image src="/cross.png" alt="icon" width={48} height={48} className="mx-auto" />,
                title: "Quizzes",
                desc: "Quizzes that help you test your knowledge, know your weak points and help retain your learning.",
              },
              {
                icon:  <Image src="/bot.png" alt="icon" width={48} height={48} className="mx-auto" />,
                title: "All in one platform",
                desc: "A platform which helps you stay curious, persistant and motivated.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative p-8 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-violet-500/50 transition-all duration-500 hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-linear-to-br from-violet-600/10 to-fuchsia-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-2xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Named exports for reuse in other components
export { StarryBackground, Title };

// Default export for Next.js page
export default function Landing() {
  return (
    <>
      <StarryBackground />
      <Title />
    </>
  );
}
