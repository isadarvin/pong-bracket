import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-semibold">Ping Pong Bracket</span>
          <span className="uppercase text-xs tracking-[0.3em] text-[var(--ink-soft)]">
            Double Elimination
          </span>
        </div>

      </header>

      <div className="grid md:grid-cols-2 min-h-[80vh]">
        <section
          className="relative overflow-hidden flex items-center justify-center text-sand-50 px-8 py-16"
          style={{ backgroundColor: "#4f8b44" }}
        >
          <CourtLines />
          <div className="max-w-xl w-full relative z-10 text-left flex flex-col justify-between gap-10 min-h-[320px]">
            <p className="uppercase text-lg md:text-xl tracking-[0.3em] text-white">
              Players
            </p>
            <div className="pt-8">
              <Link
                href="/player"
                className="inline-flex items-center justify-center rounded-full bg-white text-court-700 px-7 h-12 font-semibold hover:bg-sand-100 transition-colors shadow-card"
              >
                Enter as Player
              </Link>
            </div>
          </div>
        </section>

        <section
          className="relative overflow-hidden flex items-center justify-center text-sand-50 px-8 py-16"
          style={{ backgroundColor: "#c95e3f" }}
        >
          <NetLines />
          <div className="max-w-xl w-full relative z-10 text-left flex flex-col justify-between gap-10 min-h-[320px]">
            <p className="uppercase text-lg md:text-xl tracking-[0.3em] text-white">
              Organizers
            </p>
            <div className="pt-8">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-full bg-white text-clay-700 px-7 h-12 font-semibold hover:bg-sand-100 transition-colors shadow-card"
              >
                Enter as Admin
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function CourtLines() {
  return (
    <>
      <div className="absolute inset-8 border-2 border-white/35 rounded-[22px]" />
      <div className="absolute inset-y-10 left-1/2 w-[3px] bg-white/30" />
      <div className="absolute top-1/2 left-12 right-12 h-[2px] bg-white/20" />
      <div className="absolute right-[-30px] top-16 w-28 h-28 bg-white/8 blur-3xl" />
    </>
  );
}

function NetLines() {
  return (
    <>
      <div className="absolute inset-10 border-2 border-white/30 rounded-[22px]" />
      <div className="absolute left-8 right-8 top-1/2 h-[3px] bg-white/35" />
      <div className="absolute left-10 right-10 top-[45%] h-px bg-white/20" />
      <div className="absolute left-10 right-10 top-[55%] h-px bg-white/20" />
      <div className="absolute left-6 bottom-10 w-40 h-40 bg-white/8 blur-3xl" />
    </>
  );
}
