import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { Link } from "react-router-dom";
import { Dices, RotateCw, ArrowRight } from "lucide-react";

const games = [
  {
    title: "Dice Roller",
    description:
      "Throw 3D dice onto the table. Roll a classic d6, a D20, a custom die or flip coins.",
    path: "/games/dice-roller",
    icon: Dices,
  },
  {
    title: "Spin the Wheel",
    description:
      "Add your own options and spin the wheel for 8+ seconds of suspense to pick a winner.",
    path: "/games/spin-wheel",
    icon: RotateCw,
  },
];

export default function Games() {
  return (
    <>
      <Navbar />

      <div className="relative min-h-screen overflow-hidden bg-page text-text">
        {/* Background Glow */}
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />

        <div className="relative mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-center text-5xl font-black tracking-tight">
            Games & Decision Tools
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-muted">
            Roll dice, flip a coin or spin a wheel to make a choice. Fast, fun
            and free to use.
          </p>

          <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
            {games.map((game) => {
              const Icon = game.icon;

              return (
                <Link
                  key={game.title}
                  to={game.path}
                  className="group relative overflow-hidden rounded-3xl border border-border/70 bg-surface/70 p-8 backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:border-accent hover:shadow-[0_0_35px_color-mix(in_srgb,var(--theme-brand)_15%,transparent)]"
                >
                  {/* Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand/0 via-brand/0 to-accent/0 transition-all duration-500 group-hover:from-brand/5 group-hover:to-accent/10" />

                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent shadow-lg">
                      <Icon className="h-8 w-8 text-text" />
                    </div>

                    <h2 className="mt-6 text-2xl font-bold">{game.title}</h2>

                    <p className="mt-3 leading-relaxed text-muted">
                      {game.description}
                    </p>

                    <div className="mt-8 flex items-center gap-2 font-semibold text-brand">
                      Play Now
                      <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}