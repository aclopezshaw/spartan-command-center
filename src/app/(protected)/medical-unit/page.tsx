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
    weekRequiredTotal: number;
    weekRequiredComplete: number;
    weekOptionalTotal: number;
    weekOptionalComplete: number;
    quarterRequiredTotal: number;
    quarterRequiredComplete: number;
    quarterOptionalTotal: number;
    quarterOptionalComplete: number;
    overdueCount: number;
    skippedCount: number;
    nextExam: string | null;
    weekMinutes: number;
    weekOptionalMinutes: number;
    weekRequiredMinutes: number;
    next: string;
};

type PipelineResponse = {
    pipeline: PipelineCourse[];
};

type QuarterSummary = {
    name: string;
    credits: number;
    startDate: string | null;
    endDate: string | null;
};

type QuarterResponse = {
    active: QuarterSummary | null;
    upNext: QuarterSummary | null;
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
    className = "",
    children,
}: {
    title: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <section
            className={`border border-cyan-700/50 bg-black/60 p-5 ${className}`}
        >
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                {title}
            </p>
            <div className="mt-5">{children}</div>
        </section>
    );
}

function ProgressBar({
    requiredTotal,
    requiredComplete,
    optionalTotal,
    optionalComplete,
}: {
    requiredTotal: number;
    requiredComplete: number;
    optionalTotal: number;
    optionalComplete: number;
}) {
    const total = requiredTotal + optionalTotal;
    const requiredWidth = total ? (requiredTotal / total) * 100 : 0;
    const requiredFill = total ? (requiredComplete / total) * 100 : 0;
    const optionalFill = total ? (optionalComplete / total) * 100 : 0;

    return (
        <div
            className="relative mt-2 h-2 w-full overflow-hidden rounded-sm border border-cyan-700/50 bg-slate-800"
            aria-label={`${requiredComplete} of ${requiredTotal} required assignments and ${optionalComplete} of ${optionalTotal} optional assignments completed`}
        >
            <div
                className="absolute inset-y-0 left-0 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                style={{ width: `${requiredFill}%` }}
            />
            <div
                className="absolute inset-y-0 bg-white"
                style={{
                    left: `${requiredWidth}%`,
                    width: `${optionalFill}%`,
                }}
            />
            {requiredTotal > 0 && optionalTotal > 0 && (
                <div
                    className="absolute inset-y-0 w-px bg-slate-300/80 shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                    style={{ left: `${requiredWidth}%` }}
                />
            )}
        </div>
    );
}

function CourseRow({
    code,
    name,
    next,
    weekComplete,
    weekTotal,
    quarterComplete,
    quarterTotal,
    weekRequiredTotal,
    weekRequiredComplete,
    weekOptionalTotal,
    weekOptionalComplete,
    quarterRequiredTotal,
    quarterRequiredComplete,
    quarterOptionalTotal,
    quarterOptionalComplete,
}: {
    code: string;
    name: string;
    next: string;
    weekComplete: number;
    weekTotal: number;
    quarterComplete: number;
    quarterTotal: number;
    weekRequiredTotal: number;
    weekRequiredComplete: number;
    weekOptionalTotal: number;
    weekOptionalComplete: number;
    quarterRequiredTotal: number;
    quarterRequiredComplete: number;
    quarterOptionalTotal: number;
    quarterOptionalComplete: number;
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
                    <ProgressBar
                        requiredTotal={weekRequiredTotal}
                        requiredComplete={weekRequiredComplete}
                        optionalTotal={weekOptionalTotal}
                        optionalComplete={weekOptionalComplete}
                    />
                </div>

                <div>
                    <div className="mb-1 flex justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                        <span>Quarter</span>
                        <span>{quarterComplete} / {quarterTotal}</span>
                    </div>
                    <ProgressBar
                        requiredTotal={quarterRequiredTotal}
                        requiredComplete={quarterRequiredComplete}
                        optionalTotal={quarterOptionalTotal}
                        optionalComplete={quarterOptionalComplete}
                    />
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
    onFocus,
    isFocusing = false,
}: {
    id: string;
    title: string;
    meta: string;
    priority: string;
    onComplete: (id: string) => void;
    onFocus?: (id: string) => void;
    isFocusing?: boolean;
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

            <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold ${color}`}>{title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {meta}
                </p>
                {onFocus && (
                    <button
                        type="button"
                        onClick={() => onFocus(id)}
                        disabled={isFocusing}
                        aria-label={`Add ${title} to Focus Queue`}
                        title="Add to Focus Queue"
                        className="mt-2 text-[10px] uppercase tracking-[0.2em] text-cyan-500/70 transition hover:text-cyan-200 disabled:cursor-wait disabled:text-slate-600"
                    >
                        {isFocusing ? "Adding…" : "+ Focus"}
                    </button>
                )}
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
    const [focusingAssignmentId, setFocusingAssignmentId] = useState<string | null>(null);
    const [focusError, setFocusError] = useState<string | null>(null);
    const [quarter, setQuarter] = useState<QuarterSummary | null>(null);
    const [nextQuarter, setNextQuarter] = useState<QuarterSummary | null>(null);

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

    async function loadQuarter() {
        const response = await fetch("/api/smu/quarter", {
            cache: "no-store",
        });

        if (!response.ok) {
            return;
        }

        const data: QuarterResponse = await response.json();
        setQuarter(data.active);
        setNextQuarter(data.upNext);
    }

    useEffect(() => {
        loadOrders();
        loadPipeline();
        loadQuarter();
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

    async function addToFocusQueue(id: string) {
        setFocusingAssignmentId(id);
        setFocusError(null);

        try {
            const response = await fetch("/api/smu/orders/focus", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error ?? "Unable to update the focus queue");
            }

            await loadOrders();
        } catch (error) {
            setFocusError(
                error instanceof Error
                    ? error.message
                    : "Unable to update the focus queue"
            );
        } finally {
            setFocusingAssignmentId(null);
        }
    }

    const totalWeekMinutes = pipeline.reduce(
        (total, course) => total + course.weekMinutes,
        0
    );
    const priorityTarget = orders.focusQueue[0] ?? null;

    return (
        <main className="h-screen overflow-y-auto bg-black p-6 font-mono text-slate-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="mx-auto max-w-6xl space-y-6">
                <NavBar />

                <section className="border border-cyan-600/60 bg-slate-950/90 p-6 shadow-[0_0_30px_rgba(8,145,178,0.25)]">
                    <PageHeader
                        eyebrow="SCC Academic Medical Division"
                        title="Spartan Medical Unit"
                    />

                    <div className="mt-6 grid gap-4 md:grid-cols-5">
                        <StatBlock
                            label="Quarter"
                            value={quarter?.name ?? "Not configured"}
                        />
                        <StatBlock
                            label="Start Date"
                            value={
                                quarter?.startDate
                                    ? formatDueDate(quarter.startDate)
                                    : "—"
                            }
                        />
                        <StatBlock
                            label="End Date"
                            value={
                                quarter?.endDate
                                    ? formatDueDate(quarter.endDate)
                                    : "—"
                            }
                        />
                        <StatBlock
                            label="Current Credits"
                            value={
                                quarter
                                    ? String(quarter.credits)
                                    : "—"
                            }
                        />
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
                                            weekComplete={course.weekComplete}
                                            weekTotal={course.weekTotal}
                                            quarterComplete={course.quarterComplete}
                                            quarterTotal={course.quarterTotal}
                                            weekRequiredTotal={
                                                course.weekRequiredTotal
                                            }
                                            weekRequiredComplete={
                                                course.weekRequiredComplete
                                            }
                                            weekOptionalTotal={
                                                course.weekOptionalTotal
                                            }
                                            weekOptionalComplete={
                                                course.weekOptionalComplete
                                            }
                                            quarterRequiredTotal={
                                                course.quarterRequiredTotal
                                            }
                                            quarterRequiredComplete={
                                                course.quarterRequiredComplete
                                            }
                                            quarterOptionalTotal={
                                                course.quarterOptionalTotal
                                            }
                                            quarterOptionalComplete={
                                                course.quarterOptionalComplete
                                            }
                                            next={course.next}
                                        />
                                    ))}
                                </div>
                            </Panel>

                            <Panel title="Today's Orders">
                                {focusError && (
                                    <p className="mb-3 text-xs text-amber-300">
                                        {focusError}
                                    </p>
                                )}
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
                                                    onFocus={addToFocusQueue}
                                                    isFocusing={focusingAssignmentId === item.id}
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
                                                onFocus={addToFocusQueue}
                                                isFocusing={focusingAssignmentId === item.id}
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

                        <div className="flex flex-col space-y-6">
                            <Panel title="Academic Intelligence">
                                <div className="space-y-3">
                                    {pipeline.map((course) => (
                                        <div
                                            key={course.course}
                                            className="flex justify-between border-b border-cyan-900/60 pb-2 text-sm last:border-b-0 last:pb-0"
                                        >
                                            <span className="font-bold text-cyan-100">
                                                {course.course}
                                            </span>
                                            <span className="text-right text-xs">
                                                <span className="block">
                                                    <span className="text-red-300">
                                                        {course.overdueCount} Overdue
                                                    </span>
                                                    <span className="text-amber-300">
                                                        {" "}· {course.skippedCount} Skipped
                                                    </span>
                                                </span>
                                                <span className="mt-1 block text-emerald-300">
                                                    Next Exam:{" "}
                                                    {course.nextExam
                                                        ? formatDueDate(course.nextExam)
                                                        : "None"}
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Panel>

                            <Panel title="Study Load Forecast">
                                <p className="text-3xl font-black text-cyan-300">
                                    {totalWeekMinutes} min
                                </p>
                                <p className="mt-2 text-sm text-slate-400">
                                    Remaining estimated time for unfinished assignments
                                    due this week.
                                </p>
                                <div className="mt-4 space-y-2 text-xs">
                                    {pipeline.map((course) => {
                                        const percent = totalWeekMinutes
                                            ? Math.round(
                                                (course.weekMinutes /
                                                    totalWeekMinutes) *
                                                    100
                                            )
                                            : 0;

                                        return (
                                            <div
                                                key={course.course}
                                                className="flex justify-between border-b border-cyan-900/60 pb-1 text-slate-400"
                                            >
                                                <span>{course.course}</span>
                                                <span className="text-cyan-200">
                                                    {course.weekMinutes} min · {percent}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Panel>

                            <Panel title="SMU Recommendation">
                                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                                    Priority Target
                                </p>
                                <p className="mt-2 text-2xl font-bold text-amber-400">
                                    {priorityTarget?.course ?? "No Priority Target"}
                                </p>
                                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                                    {priorityTarget
                                        ? `${orders.focusQueue.length} focused assignment${orders.focusQueue.length === 1 ? "" : "s"} currently require attention.`
                                        : "No assignments are currently in the Focus Queue."}
                                </p>
                            </Panel>

                            <Panel title="Upcoming Clinical Ops">
                                <p className="text-sm text-slate-400">
                                    No authoritative clinical operations source is
                                    connected yet.
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

                            <Panel title="Next Quarter Outlook">
                                <p className="text-xl font-bold text-cyan-100">
                                    {nextQuarter?.name ?? "Not configured"}
                                </p>
                                <p className="mt-2 text-sm text-slate-400">
                                    {nextQuarter?.startDate && nextQuarter.endDate
                                        ? `${formatDueDate(nextQuarter.startDate)} – ${formatDueDate(nextQuarter.endDate)}`
                                        : "Dates unavailable"}
                                </p>
                                <p className="mt-2 text-sm text-slate-400">
                                    {nextQuarter
                                        ? `${nextQuarter.credits} credits planned for the upcoming quarter.`
                                        : "No upcoming quarter is marked in Notion."}
                                </p>
                                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                                    Course list not connected
                                </p>
                            </Panel>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
