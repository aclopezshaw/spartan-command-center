"use client";

import { useEffect, useState } from "react";
import HudPanel from "../../components/HudPanel";
import NavBar from "../../components/NavBar";
import PageHeader from "../../components/PageHeader";

export default function TrainingReportsPage() {

    const [hydrationAmount, setHydrationAmount] = useState("");
    const [hydrationStatus, setHydrationStatus] = useState("");
    const [hydrationTotal, setHydrationTotal] = useState(0);
    const [workoutTotals, setWorkoutTotals] = useState({ minutes: 0, miles: 0 });
    const [phaseHydrationAverage, setPhaseHydrationAverage] = useState(0);
    const [weeklyWorkoutCount, setWeeklyWorkoutCount] = useState(0);
    const [workout, setWorkout] = useState({ type: "Strength", category: "Strength", duration: "", distance: "", rpe: "3", notes: "" });
    const [workoutStatus, setWorkoutStatus] = useState("");

    async function submitWorkout() {
        setWorkoutStatus("Submitting...");
        const response = await fetch("/api/workout-log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(workout) });
        setWorkoutStatus(response.ok ? "Workout logged." : "Unable to log workout.");
        if (response.ok) { setWorkout({ ...workout, duration: "", distance: "", notes: "" }); }
    }
    const hydrationProgress = hydrationTotal/96;

    useEffect(() => {
        loadHydrationTotal();
        fetch("/api/workout-summary", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((data) => data && setWorkoutTotals(data));
        fetch("/api/hydration-phase-average", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((data) => data && setPhaseHydrationAverage(data.average ?? 0));
        fetch("/api/workout-weekly-count", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((data) => data && setWeeklyWorkoutCount(data.count ?? 0));
    }, []);

    async function loadHydrationTotal() {
        const response = await fetch("/api/hydration-total");

        if (!response.ok) {
            console.error("Failed to load hydration total");
            return;
        }

        const data = await response.json();
        setHydrationTotal(data.total ?? 0);
    }

    async function submitHydration(amount: number) {
        setHydrationStatus("Submitting...");

        const response = await fetch("/api/hydration-log", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
            amount,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            setHydrationStatus(error.error ?? "Failed to log hydration.");
            return;
        }

        setHydrationStatus(`${amount} oz logged.`);
        setHydrationAmount("");

        loadHydrationTotal();
    }

  return (
    <main className="min-h-screen bg-[#020817] p-4 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <NavBar />
        <div className="border border-cyan-600/60 bg-slate-950/90 p-6 shadow-[0_0_30px_rgba(8,145,178,0.25)]">
            <PageHeader
            eyebrow="UNSC PHYSICAL TRAINING FILE"
            title="Training Reports"
            />

            <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <HudPanel title="Hydration Report">
                <div className="space-y-5">
                <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Current Intake
                    </p>

                    <p className="mt-2 text-4xl font-black text-cyan-300">
                    {hydrationTotal} / 96 oz
                    </p>

                    <div className="mt-3 h-3 border border-cyan-900/60 bg-black/50">
                        <div
                            className="h-full bg-cyan-400 transition-all duration-500"
                            style={{
                                width: `${Math.min(
                                100,
                                Math.round((hydrationTotal / 96) * 100)
                                )}%`,
                            }}
                        />
                    </div>

                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                    {hydrationTotal >= 96
                        ? "Hydration objective complete"
                        : "Hydration objective incomplete"}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {[4, 12, 20, 32].map((amount) => (
                    <button
                        key={amount}
                        onClick={() => submitHydration(amount)}
                        className="border border-cyan-900/60 bg-black/40 p-3 text-sm font-bold uppercase tracking-[0.2em] text-cyan-200 hover:bg-cyan-950/60"
                    >
                        +{amount} oz
                    </button>
                    ))}
                </div>

                <label className="block">
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Manual Amount
                    </span>

                    <input
                        type="number"
                        value={hydrationAmount}
                        onChange={(e) => setHydrationAmount(e.target.value)}
                        placeholder="0"
                        className="mt-2 w-full border border-cyan-900/60 bg-black/60 p-3 text-slate-100"
                    />
                </label>

                <button
                    onClick={() => submitHydration(Number(hydrationAmount))}
                    className="border border-cyan-500 bg-cyan-950/50 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-cyan-100 hover:bg-cyan-800/60"
                >
                    Submit Hydration
                </button>
                {hydrationStatus && (
                    <p className="text-sm text-cyan-300">
                        {hydrationStatus}
                    </p>
                )}
                </div>
            </HudPanel>

            <HudPanel title="Workout Report">
                <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Training Type
                    </span>

                    <select value={workout.category} onChange={(e) => setWorkout({ ...workout, category: e.target.value, type: e.target.value })} className="mt-2 w-full border border-cyan-900/60 bg-black/60 p-3 text-slate-100">
                    <option>Strength</option>
                    <option>Run</option>
                    <option>Walk</option>
                    <option>Run/Walk</option>
                    <option>Hike</option>
                    <option>Race</option>
                    </select>
                </label>

                <label className="block">
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Duration
                    </span>

                    <input value={workout.duration} onChange={(e) => setWorkout({ ...workout, duration: e.target.value })}
                    type="number"
                    placeholder="Minutes"
                    className="mt-2 w-full border border-cyan-900/60 bg-black/60 p-3 text-slate-100"
                    />
                </label>

                <label className="block">
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Distance
                    </span>

                    <input value={workout.distance} onChange={(e) => setWorkout({ ...workout, distance: e.target.value })}
                    type="number"
                    placeholder="Miles"
                    className="mt-2 w-full border border-cyan-900/60 bg-black/60 p-3 text-slate-100"
                    />
                </label>

                <label className="block">
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    RPE
                    </span>

                    <select value={workout.rpe} onChange={(e) => setWorkout({ ...workout, rpe: e.target.value })} className="mt-2 w-full border border-cyan-900/60 bg-black/60 p-3 text-slate-100">
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5</option>
                    </select>
                </label>

                <label className="block md:col-span-2">
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Field Notes
                    </span>

                    <textarea value={workout.notes} onChange={(e) => setWorkout({ ...workout, notes: e.target.value })}
                    rows={5}
                    placeholder="Workout notes..."
                    className="mt-2 w-full border border-cyan-900/60 bg-black/60 p-3 text-slate-100"
                    />
                </label>

                <div className="md:col-span-2">
                    <button onClick={submitWorkout} className="border border-green-500 bg-green-950/40 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-green-100 hover:bg-green-800/50">
                    Submit Workout
                    </button>
                    {workoutStatus && <p className="mt-2 text-sm text-green-300">{workoutStatus}</p>}
                </div>
                </div>
            </HudPanel>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-5">
            <HudPanel title="Hydration Goal">
                <p className="text-3xl font-black text-cyan-300">{Math.round(hydrationProgress * 100)}%</p>
                <p className="mt-2 text-sm text-slate-400">
                Daily hydration progress toward 96 oz objective.
                </p>
            </HudPanel>

            <HudPanel title="Phase Fluid Avg">
                <p className="text-3xl font-black text-cyan-300">{phaseHydrationAverage} oz</p>
                <p className="mt-2 text-sm text-slate-400">
                Average daily fluid intake across this phase.
                </p>
            </HudPanel>

            <HudPanel title="Weekly Workouts">
                <p className="text-3xl font-black text-green-300">{weeklyWorkoutCount} / 3</p>
                <p className="mt-2 text-sm text-slate-400">
                Workout operations completed this week.
                </p>
            </HudPanel>

            <HudPanel title="Phase Minutes">
                <p className="text-3xl font-black text-green-300">{workoutTotals.minutes}</p>
                <p className="mt-2 text-sm text-slate-400">
                Total workout minutes recorded this phase.
                </p>
            </HudPanel>

            <HudPanel title="Phase Miles">
                <p className="text-3xl font-black text-cyan-300">{workoutTotals.miles.toFixed(1)}</p>
                <p className="mt-2 text-sm text-slate-400">
                Total miles recorded this phase.
                </p>
            </HudPanel>
            </div>
        </div>
      </div>
    </main>
  );
}
