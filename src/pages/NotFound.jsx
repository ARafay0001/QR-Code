import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Home, RotateCcw, Gamepad2 } from "lucide-react";
import Navbar from "../components/common/Navbar";

const GRAVITY = 0.28;
const GAME_MIN_WIDTH = 760;

function useIsDesktop(minWidth) {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= minWidth
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const handler = (e) => setIsDesktop(e.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [minWidth]);

  return isDesktop;
}

export default function NotFound() {
  const isDesktop = useIsDesktop(GAME_MIN_WIDTH);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);

  // mutable game state that doesn't need re-renders every frame
  const stateRef = useRef({
    W: 0,
    H: 0,
    archerX: 70,
    postX: 0,
    postH: 0,
    appleBob: 0,
    apple: { r: 14 },
    arrow: null,
    aiming: false,
    dragStart: null,
    dragCurrent: null,
    particles: [],
    score: 0,
    level: 1,
    lives: 3,
    gameOver: false,
  });

  const groundY = () => stateRef.current.H - 40;
  const archerY = () => groundY() - 30;
  const bowPos = () => ({ x: stateRef.current.archerX, y: archerY() - 34 });

  const newTarget = () => {
    const s = stateRef.current;
    const minX = s.W * 0.5;
    const maxX = s.W * 0.86;
    const t = Math.min(1, (s.level - 1) / 8);
    s.postX = minX + (maxX - minX) * Math.min(1, t + Math.random() * 0.3);
    s.postH = 90 + Math.random() * 40;
    s.appleBob = Math.random() * Math.PI * 2;
  };

  const resetArrow = () => {
    const s = stateRef.current;
    s.arrow = null;
    s.aiming = false;
    s.dragStart = null;
    s.dragCurrent = null;
  };

  const spawnHitParticles = (x, y) => {
    const s = stateRef.current;
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1 + Math.random() * 3;
      s.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1,
        life: 30 + Math.random() * 10,
        color: Math.random() > 0.5 ? "#f87171" : "#4ade80",
      });
    }
  };

  const loseLife = () => {
    const s = stateRef.current;
    s.lives -= 1;
    setLives(s.lives);
    resetArrow();
    if (s.lives <= 0) {
      s.gameOver = true;
      setGameOver(true);
    }
  };

  const restartGame = () => {
    const s = stateRef.current;
    s.score = 0;
    s.level = 1;
    s.lives = 3;
    s.gameOver = false;
    setScore(0);
    setLevel(1);
    setLives(3);
    setGameOver(false);
    resetArrow();
    newTarget();
  };

  // setup canvas, resize handling, input, animation loop
  useEffect(() => {
    if (!isDesktop) return;

    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const s = stateRef.current;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      s.W = stage.clientWidth;
      s.H = stage.clientHeight;
      canvas.width = s.W * dpr;
      canvas.height = s.H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!s.postX) newTarget();
    };
    resize();
    window.addEventListener("resize", resize);

    const toLocal = (evt) => {
      const rect = stage.getBoundingClientRect();
      const cx = evt.touches ? evt.touches[0].clientX : evt.clientX;
      const cy = evt.touches ? evt.touches[0].clientY : evt.clientY;
      return { x: cx - rect.left, y: cy - rect.top };
    };

    const onDown = (evt) => {
      if (s.gameOver || s.arrow) return;
      const p = toLocal(evt);
      const bow = bowPos();
      const d = Math.hypot(p.x - bow.x, p.y - bow.y);
      if (d < 90) {
        s.aiming = true;
        s.dragStart = bow;
        s.dragCurrent = p;
      }
    };
    const onMove = (evt) => {
      if (!s.aiming) return;
      s.dragCurrent = toLocal(evt);
    };
    const onUp = () => {
      if (!s.aiming) return;
      const bow = s.dragStart;
      const cur = s.dragCurrent;
      const dx = bow.x - cur.x;
      const dy = bow.y - cur.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 12) {
        s.aiming = false;
        s.dragStart = null;
        s.dragCurrent = null;
        return;
      }
      const maxPull = 110;
      const pull = Math.min(dist, maxPull);
      const power = 7 + (pull / maxPull) * 13;
      const angle = Math.atan2(dy, dx);
      s.arrow = {
        x: bow.x,
        y: bow.y,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power,
        angle,
        trail: [],
      };
      s.aiming = false;
      s.dragStart = null;
      s.dragCurrent = null;
    };

    stage.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    stage.addEventListener("touchstart", onDown, { passive: true });
    stage.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);

    const update = () => {
      if (s.gameOver) return;

      if (s.arrow) {
        const a = s.arrow;
        a.trail.push({ x: a.x, y: a.y });
        if (a.trail.length > 14) a.trail.shift();

        a.x += a.vx;
        a.y += a.vy;
        a.vy += GRAVITY;
        a.angle = Math.atan2(a.vy, a.vx);

        const appleCX = s.postX;
        const appleCY = groundY() - s.postH - 6 + Math.sin(s.appleBob) * 3;
        const r = s.apple.r + 4;

        const d = Math.hypot(a.x - appleCX, a.y - appleCY);
        if (d < r) {
          s.score += 10;
          setScore(s.score);
          spawnHitParticles(appleCX, appleCY);
          s.arrow = null;
          s.level += 1;
          setLevel(s.level);
          newTarget();
        } else if (a.y > groundY() + 10 || a.x > s.W + 30 || a.x < -30) {
          spawnHitParticles(Math.min(a.x, s.W - 10), groundY());
          loseLife();
        }
      }

      s.appleBob += 0.03;

      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= 1;
        if (p.life <= 0) s.particles.splice(i, 1);
      }
    };

    const drawBackground = () => {
      ctx.clearRect(0, 0, s.W, s.H);
      ctx.strokeStyle = "rgba(148,163,184,0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < s.W; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, s.H);
        ctx.stroke();
      }
      for (let y = 0; y < s.H; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(s.W, y);
        ctx.stroke();
      }
      const gy = groundY();
      const grad = ctx.createLinearGradient(0, gy, s.W, gy);
      grad.addColorStop(0, "#60a5fa");
      grad.addColorStop(0.5, "#a78bfa");
      grad.addColorStop(1, "#60a5fa");
      ctx.fillStyle = grad;
      ctx.fillRect(0, gy, s.W, 2);
      ctx.fillStyle = "#05070f";
      ctx.fillRect(0, gy + 2, s.W, s.H - gy - 2);
    };

    const drawArcher = () => {
      const x = s.archerX;
      const y = archerY();
      ctx.save();
      ctx.strokeStyle = "#cbd5e1";
      ctx.fillStyle = "#94a3b8";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 8, y + 24);
      ctx.moveTo(x, y);
      ctx.lineTo(x + 8, y + 24);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 26);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y - 34, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#e2e8f0";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x, y - 20);
      ctx.lineTo(x, y - 34);
      ctx.stroke();

      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 34, 30, -1.1, 1.1);
      ctx.stroke();

      ctx.restore();
    };

    const drawAimGuide = () => {
      if (!s.aiming) return;
      const bow = s.dragStart;
      const cur = s.dragCurrent;
      const dx = bow.x - cur.x;
      const dy = bow.y - cur.y;
      const dist = Math.min(Math.hypot(dx, dy), 110);
      const angle = Math.atan2(dy, dx);

      ctx.strokeStyle = "rgba(203,213,225,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bow.x + Math.cos(angle + 1.15) * 30, bow.y + Math.sin(angle + 1.15) * 30);
      ctx.lineTo(cur.x, cur.y);
      ctx.lineTo(bow.x + Math.cos(angle - 1.15) * 30, bow.y + Math.sin(angle - 1.15) * 30);
      ctx.stroke();

      const power = 7 + (dist / 110) * 13;
      let px = bow.x,
        py = bow.y;
      let vx = Math.cos(angle) * power,
        vy = Math.sin(angle) * power;
      ctx.fillStyle = "rgba(96,165,250,0.5)";
      for (let i = 0; i < 24; i++) {
        px += vx;
        py += vy;
        vy += GRAVITY;
        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        if (py > groundY()) break;
      }
    };

    const drawTarget = () => {
      const gy = groundY();
      const x = s.postX;
      const postTop = gy - s.postH;

      ctx.strokeStyle = "#78716c";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x, postTop);
      ctx.stroke();

      const appleYPos = postTop - 6 + Math.sin(s.appleBob) * 3;
      ctx.save();
      ctx.translate(x, appleYPos);
      ctx.fillStyle = "#f87171";
      ctx.beginPath();
      ctx.arc(0, 0, s.apple.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#4d7c0f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -s.apple.r);
      ctx.lineTo(3, -s.apple.r - 6);
      ctx.stroke();
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.ellipse(6, -s.apple.r - 4, 5, 2.5, 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawArrow = () => {
      if (!s.arrow) return;
      const a = s.arrow;

      ctx.strokeStyle = "rgba(96,165,250,0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      a.trail.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(6, 0);
      ctx.stroke();
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(2, -3);
      ctx.lineTo(2, 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#f87171";
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(-22, -4);
      ctx.moveTo(-16, 0);
      ctx.lineTo(-22, 4);
      ctx.stroke();
      ctx.restore();
    };

    const drawParticles = () => {
      s.particles.forEach((p) => {
        ctx.globalAlpha = Math.max(p.life / 40, 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      update();
      drawBackground();
      drawTarget();
      drawArcher();
      drawAimGuide();
      drawArrow();
      drawParticles();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      stage.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      stage.removeEventListener("touchstart", onDown);
      stage.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop]);

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Navbar />

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-red-600/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16">
        {/* 404 */}
        <div className="text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.4em] text-blue-400">
            FreeQRify
          </p>

          <h1 className="text-[120px] font-black leading-none tracking-tight sm:text-[170px]">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
              404
            </span>
          </h1>

          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Page Not Found</h2>

          <p className="mx-auto mt-4 max-w-lg text-slate-400">
            Looks like this page got lost somewhere. While you're here, try
            shooting some apples.
          </p>
        </div>

        {/* Game (desktop / wider screens only) */}
        {isDesktop ? (
          <div className="mt-10 w-full max-w-2xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-400">
                MINI GAME
              </span>

              <div className="flex gap-2">
                <span className="rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-sm font-bold">
                  Score: <span className="text-blue-400">{score}</span>
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-sm font-bold">
                  Lvl: <span className="text-purple-400">{level}</span>
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-sm font-bold">
                  Lives: <span className="text-red-400">{lives}</span>
                </span>
              </div>
            </div>

            <div
              ref={stageRef}
              className="relative h-72 overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl"
              style={{ cursor: "crosshair" }}
            >
              <canvas ref={canvasRef} className="block h-full w-full" />

              {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/80 backdrop-blur-sm">
                  <h3 className="text-3xl font-black text-red-400">Game Over</h3>
                  <p className="text-sm text-slate-300">Final score: {score}</p>
                  <button
                    onClick={restartGame}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold transition hover:bg-blue-500"
                  >
                    <RotateCcw size={16} />
                    Try Again
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 text-center text-sm text-slate-500">
              Drag back from the{" "}
              <span className="font-semibold text-slate-300">bow</span> to aim,
              release to fire. The farther you pull, the harder you shoot.
            </div>
          </div>
        ) : (
          <div className="mt-10 flex w-full max-w-md flex-col items-center gap-2 rounded-3xl border border-slate-800 bg-slate-900/60 px-6 py-8 text-center">
            <Gamepad2 size={28} className="text-slate-500" />
            <p className="text-sm font-semibold text-slate-300">
              The mini game needs a bit more room
            </p>
            <p className="text-sm text-slate-500">
              Open this page on a screen wider than {GAME_MIN_WIDTH}px to play.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500"
          >
            <Home size={18} />
            Back Home
          </Link>

          {isDesktop && (
            <button
              onClick={restartGame}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 font-semibold transition hover:border-blue-500 hover:bg-slate-800"
            >
              <RotateCcw size={18} />
              Restart Game
            </button>
          )}
        </div>
      </main>
    </div>
  );
}