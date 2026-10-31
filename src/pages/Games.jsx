import Footer from "../components/common/Footer";
import { Dices, RotateCw } from "lucide-react";
import ToolArticle from "../components/common/ToolArticle";
import ToolFAQ from "../components/common/ToolFAQ";
import { GamesArticle as Article, GamesFAQ as FAQ } from "../data/seoContent.js";
import ToolSubCard from "../components/ui/ToolSubCard";

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

      <div className="relative min-h-screen overflow-hidden bg-page text-text">
        {/* Background Glow */}
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />

        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
          <h1 className="text-center text-4xl font-black tracking-tight sm:text-5xl">
            Games & Decision Tools
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-muted">
            Roll dice, flip a coin or spin a wheel to make a choice. Fast, fun
            and free to use.
          </p>

          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:mt-16 sm:gap-8 md:grid-cols-2">
            {games.map((game) => (
              <ToolSubCard
                key={game.title}
                {...game}
                actionLabel="Play Now"
              />
            ))}
          </div>
        </div>
      </div>

      <ToolArticle {...Article} />
      <ToolFAQ faqs={FAQ} />
      <Footer />
    </>
  );
}