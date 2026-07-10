"use client";

import { formatDueDate } from "../../../lib/date";
import { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import PageHeader from "../../components/PageHeader";

type OrderItem = {
    id: string;
    title: string;
    course: string;
    dueDate: string | null;
    priority: string;
    status: string;
    focusQueue: boolean;
    estimatedMinutes: number;
};

type OrdersResponse = {
    focusQueue: OrderItem[];
    dueSoon: OrderItem[];
    nextCritical: OrderItem[];
};

type PipelineCourse = {
    course: string;
    name: string;
    weekProgress: number;
    quarterProgress: number;
    weekComplete: number;
    weekTotal: number;
    quarterComplete: number;
    quarterTotal: number;
    next: string;
};

type PipelineResponse = {
    pipeline: PipelineCourse[];
};

function getCourseName(courseCode: string) {
    const courseNames: Record<string, string> = {
        "GPS 2100": "Galen Pathway to Success",
        "BIO 2100": "Microbiology",
        "SOC 1305": "Introduction to Sociology",
        "AID 1080": "AI and Digital Literacy",
    };

    return courseNames[courseCode] ?? courseCode;
}

function Panel({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="border border-cyan-700/50 bg-black/60 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                {title}
            </p>
            <div className="mt-5">{children}</div>
        </section>
    );
}

function ProgressBar({ value }: { value: number }) {
    return (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-sm border border-cyan-700/50 bg-slate-800">
            <div
                className="h-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                style={{ width: `${value}%` }}
            />
        </div>
    );
}

function CourseRow({
    code,
    name,
    weekProgress,
    quarterProgress,
    next,
    weekComplete,
    weekTotal,
    quarterComplete,
    quarterTotal,
}: {
    code: string;
    name: string;
    weekProgress: number;
    quarterProgress: number;
    next: string;
    weekComplete: number;
    weekTotal: number;
    quarterComplete: number;
    quarterTotal: number;
}) {
    return (
        <div className="border-b border-cyan-900/60 pb-4 last:border-b-0 last:pb-0">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-cyan-100">{code}</p>
                    <p className="mt-1 text-sm text-slate-400">{name}</p>
                </div>
                <p className="text-right text-xs uppercase tracking-[0.2em] text-slate-500">
                    {next}
                </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                    <div className="mb-1 flex justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                        <span>This Week</span>
                        <span>{weekComplete} / {weekTotal}</span>
                    </div>
                    <ProgressBar value={weekProgress} />
                </div>

                <div>
                    <div className="mb-1 flex justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                        <span>Quarter</span>
                        <span>{quarterComplete} / {quarterTotal}</span>
                    </div>
                    <ProgressBar value={quarterProgress} />
                </div>
            </div>
        </div>
    );
}

function OrderColumn({
    title,
    count,
    children,
}: {
    title: string;
    count: number;
    children: React.ReactNode;
}) {
    return (
        <div className="border border-cyan-900/60 bg-slate-950/70 p-4">
            <div className="mb-4 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">
                    {title}
                </p>
                <span className="text-xs text-slate-500">{count}</span>
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function AssignmentItem({
    id,
    title,
    meta,
    priority,
    onComplete,
}: {
    id: string;
    title: string;
    meta: string;
    priority: string;
    onComplete: (id: string) => void;
}) {
    const color =
        priority?.toLowerCase() === "high"
            ? "text-red-400"
            : priority?.toLowerCase() === "medium"
            ? "text-amber-300"
            : "text-cyan-300";

    return (
        <div className="flex gap-3 border-b border-cyan-900/60 pb-3 last:border-b-0 last:pb-0">
            <button
                type="button"
                onClick={() => onComplete(id)}
                className="mt-1 h-5 w-5 shrink-0 border border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]"
            />

            <div>
                <p className={`text-sm font-bold ${color}`}>{title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {meta}
                </p>
            </div>
        </div>
    );
}

function StatBlock({ label, value }: { label: string; value: string }) {
    return (
        <div className="border border-cyan-900/60 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">
                {label}
            </p>
            <p className="mt-3 text-2xl font-bold text-white">{value}</p>
        </div>
    );
}

function getPriorityColor(priority: string) {
    switch (priority.toLowerCase()) {
        case "high":
            return "text-red-400";
        case "medium":
            return "text-amber-300";
        case "low":
        default:
            return "text-cyan-300";
    }
}

export const dynamic = "force-dynamic";
//export const revalidate = 0;

export default function MedicalUnitPage() {
    const [orders, setOrders] = useState<OrdersResponse>({
        focusQueue: [],
        dueSoon: [],
        nextCritical: [],
    });
    const [pipeline, setPipeline] = useState<PipelineCourse[]>([]);

    async function loadOrders() {
        const response = await fetch("/api/smu/orders");
        const data = await response.json();
        setOrders(data);
    }

    async function loadPipeline() {
        const response = await fetch("/api/smu/pipeline", {
            cache: "no-store",
        });

        const data: PipelineResponse = await response.json();
        setPipeline(data.pipeline);
    }

    useEffect(() => {
        loadOrders();
        loadPipeline();
    }, []);

    async function completeAssignment(id: string) {
        await fetch("/api/smu/orders/complete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id }),
        });

        await Promise.all([loadOrders(), loadPipeline()]);
    }

    return (
        <main className="min-h-screen bg-black p-6 font-mono text-slate-100">
            <div className="mx-auto max-w-7xl space-y-6">
                <NavBar />

                <section className="border border-cyan-600/60 bg-slate-950/90 p-6 shadow-[0_0_30px_rgba(8,145,178,0.25)]">
                    <PageHeader
                        eyebrow="SCC Academic Medical Division"
                        title="Spartan Medical Unit"
                    />

                    <div className="mt-6 grid gap-4 md:grid-cols-6">
                        <StatBlock label="Quarter" value="Fall '26" />
                        <StatBlock label="Start Date" value="7/6/26" />
                        <StatBlock label="End Date" value="999" />
                        <StatBlock label="Current Credits" value="999" />
                        <StatBlock label="GPA" value="999" />
                        <StatBlock label="Est. Graduation" value="Winter '28" />
                    </div>

                    <div className="mt-6">
                        <Panel title="Degree Progress">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-cyan-100">
                                        Bachelor's of Science in Nursing
                                    </p>
                                    <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-500">
                                        Nursing Training Pipeline
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-cyan-400">
                                        29%
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        42 / 120 Credits
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 h-4 w-full overflow-hidden rounded-sm border border-cyan-700/50 bg-slate-900">
                                <div
                                    className="h-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.75)] transition-all duration-500"
                                    style={{ width: "29%" }}
                                />
                            </div>
                            <div className="mt-4 flex justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                                <span>General Education</span>
                                <span>Clinical Phase</span>
                                <span>Graduation</span>
                            </div>
                        </Panel>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-6">
                            <Panel title="Active Training Pipeline">
                                <div className="space-y-4">
                                    {pipeline.map((course) => (
                                        <CourseRow
                                            key={course.course}
                                            code={course.course}
                                            name={getCourseName(course.course)}
                                            weekProgress={course.weekProgress}
                                            quarterProgress={course.quarterProgress}
                                            weekComplete={course.weekComplete}
                                            weekTotal={course.weekTotal}
                                            quarterComplete={course.quarterComplete}
                                            quarterTotal={course.quarterTotal}
                                            next={course.next}
                                        />
                                    ))}
                                </div>
                            </Panel>

                            <Panel title="Today's Orders">
                                <div className="grid gap-4 lg:grid-cols-3">
                                    <OrderColumn title="Focus Queue" count={orders.focusQueue.length}>
                                        {orders.focusQueue.length > 0 ? (
                                            orders.focusQueue.map((item) => (
                                                <AssignmentItem
                                                    key={item.id}
                                                    title={item.title}
                                                    meta={`${item.course} • ${formatDueDate(item.dueDate)}`}
                                                    id={item.id}
                                                    priority={item.priority}
                                                    onComplete={completeAssignment}
                                                />
                                            ))
                                        ) : (
                                            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                                                ✓ Clear
                                            </p>
                                        )}
                                    </OrderColumn>

                                    <OrderColumn title="Due Soon" count={orders.dueSoon.length}>
                                        {orders.dueSoon.length > 0 ? (
                                            orders.dueSoon.map((item) => (
                                                <AssignmentItem
                                                    key={item.id}
                                                    title={item.title}
                                                    meta={`${item.course} • ${formatDueDate(item.dueDate)}`}
                                                    id={item.id}
                                                    priority={item.priority}
                                                    onComplete={completeAssignment}
                                                />
                                            ))
                                        ) : (
                                            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                                                ✓ Clear
                                            </p>
                                        )}
                                    </OrderColumn>

                                    <OrderColumn
                                        title="Plan Ahead"
                                        count={orders.nextCritical.length}
                                        >
                                        {orders.nextCritical.length > 0 ? (
                                            orders.nextCritical.map((item) => (
                                            <AssignmentItem
                                                key={item.id}
                                                title={item.title}
                                                meta={`${item.course} • ${formatDueDate(item.dueDate)}`}
                                                id={item.id}
                                                priority={item.priority}
                                                onComplete={completeAssignment}
                                            />
                                            ))
                                        ) : (
                                            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                                            ✓ Clear
                                            </p>
                                        )}
                                    </OrderColumn>
                                </div>
                            </Panel>
                        </div>

                        <div className="space-y-6">
                            <Panel title="Academic Intelligence">
                                <div className="space-y-3">
                                    {[
                                        ["NURS 210", "Stable"],
                                        ["BIO 201", "Stable"],
                                        ["MATH 134", "Attention Recommended"],
                                        ["ENG 121", "Stable"],
                                    ].map(([course, status]) => (
                                        <div
                                            key={course}
                                            className="flex justify-between border-b border-cyan-900/60 pb-2 text-sm last:border-b-0 last:pb-0"
                                        >
                                            <span className="font-bold text-cyan-100">
                                                {course}
                                            </span>
                                            <span className="text-slate-400">
                                                {status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Panel>

                            <Panel title="Upcoming Clinical Ops">
                                <div className="space-y-3 text-sm">
                                    {[
                                        "Jul 07 — Pharmacology Quiz 2",
                                        "Jul 11 — Clinical Rotation",
                                        "Jul 15 — Midterm Exam",
                                        "Jul 20 — Skills Assessment",
                                    ].map((item) => (
                                        <div
                                            key={item}
                                            className="border-b border-cyan-900/60 pb-3 text-slate-300 last:border-b-0 last:pb-0"
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </Panel>

                            <Panel title="SMU Recommendation">
                                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                                    Priority Target
                                </p>
                                <p className="mt-2 text-2xl font-bold text-amber-400">
                                    MATH 134
                                </p>
                                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                                    Two assignments are due within the next 72
                                    hours. Current course status is below target
                                    readiness threshold.
                                </p>
                            </Panel>

                            <Panel title="Medical Service Record">
                                <div className="grid gap-3 text-sm">
                                    <div className="flex justify-between border-b border-cyan-900/60 pb-2">
                                        <span className="text-slate-500">
                                            Assignments Completed
                                        </span>
                                        <span className="text-cyan-100">187</span>
                                    </div>
                                    <div className="flex justify-between border-b border-cyan-900/60 pb-2">
                                        <span className="text-slate-500">
                                            Study Streak
                                        </span>
                                        <span className="text-cyan-100">8 Days</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">
                                            Clinical Hours
                                        </span>
                                        <span className="text-cyan-100">68</span>
                                    </div>
                                </div>
                            </Panel>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}