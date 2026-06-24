import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-black p-6 font-mono text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center">
        <section className="w-full border border-cyan-600/60 bg-slate-950/90 p-8 shadow-[0_0_40px_rgba(8,145,178,0.35)]">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.45em] text-cyan-400">
              UNSC Spartan Candidate Program
            </p>

            <div className="mx-auto mt-6 flex justify-center">
              <Image
                src="/images/scp-emblem-trans.png"
                alt="Spartan Candidate Program Emblem"
                width={180}
                height={180}
                priority
              />
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight">
              Personnel Access Terminal
            </h1>

            <p className="mt-2 text-sm uppercase tracking-[0.25em] text-slate-500">
              Restricted System
            </p>
          </div>

          <form action="/api/login" method="POST" className="mt-8 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.25em] text-cyan-400">
                Service Number
              </label>
              <input
                name="designation"
                defaultValue="ALEX-225"
                className="mt-2 w-full border border-cyan-800 bg-black/70 px-4 py-3 text-cyan-100 outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.25em] text-cyan-400">
                Access Code
              </label>
              <input
                name="password"
                type="password"
                className="mt-2 w-full border border-cyan-800 bg-black/70 px-4 py-3 text-cyan-100 outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              className="w-full border border-cyan-400 bg-cyan-400 px-4 py-3 font-bold uppercase tracking-[0.25em] text-black hover:bg-cyan-300"
            >
              Authenticate
            </button>
          </form>

          <div className="mt-8 border border-cyan-900/60 bg-black/40 p-4 text-xs uppercase tracking-[0.2em] text-slate-500">
            <p>System Status: Online</p>
            <p>Security Level: Restricted</p>
            <p>Facility: Reach Training Command</p>
            <p className="mt-3 text-yellow-400">
              Unauthorized access is prohibited.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}