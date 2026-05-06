import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import type { ApiStudent, ReportEntry, ParentDashboardEntry } from "@/lib/api";
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  BellRing,
  TrendingUp,
  BarChart3,
  ClipboardList,
  Bot,
  Link as LinkIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <DashboardLayout>
        {user?.role === "teacher" && <TeacherOverview />}
        {user?.role === "hod" && <HodOverview />}
        {user?.role === "parent" && <ParentOverview />}
      </DashboardLayout>
    </AuthGuard>
  );
}

/* ───────────────── TEACHER OVERVIEW ───────────────── */
function TeacherOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [classes, setClasses] = useState<{ grade: string; section: string }[]>([]);

  useEffect(() => {
    Promise.all([api.students.list(), api.students.grades()])
      .then(([s, g]) => {
        setStudents(s.students);
        setClasses(g.classes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const weeklyData = [
    { day: "Mon", pct: 92 },
    { day: "Tue", pct: 88 },
    { day: "Wed", pct: 95 },
    { day: "Thu", pct: 91 },
    { day: "Fri", pct: 87 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Welcome back, {user?.first_name ?? "Teacher"} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here's an overview of your classes today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value={loading ? "…" : String(students.length)}
          accent="primary"
        />
        <StatCard
          icon={ClipboardList}
          label="Classes"
          value={loading ? "…" : String(classes.length)}
          accent="chart-2"
        />
        <StatCard
          icon={UserCheck}
          label="Avg. Attendance"
          value="91.4%"
          sub="↑ 2.1% this week"
          accent="success"
        />
        <StatCard
          icon={AlertTriangle}
          label="At-Risk (<75%)"
          value="4"
          sub="needs attention"
          accent="warning"
        />
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Weekly Attendance Trend</h2>
            <span className="text-xs text-muted-foreground">This Week</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 13,
                }}
              />
              <Bar dataKey="pct" name="Attendance %" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate({ to: "/dashboard/teacher" })}
            className="w-full rounded-2xl border border-border bg-card p-6 shadow-soft text-left hover:shadow-elegant transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-colors">
                <ClipboardList className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold">Mark Attendance</p>
                <p className="text-xs text-muted-foreground">Start today's roll call</p>
              </div>
            </div>
          </button>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <BellRing className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold">Alerts Sent Today</p>
                <p className="text-xs text-muted-foreground">via Telegram</p>
              </div>
            </div>
            <p className="font-display text-3xl font-semibold">12</p>
          </div>

          <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
            <p className="text-xs font-semibold text-warning mb-1">⚠️ At-Risk Alert</p>
            <p className="text-sm text-muted-foreground">
              4 students have attendance below the 75% red-flag threshold this month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── HOD OVERVIEW ───────────────── */
function HodOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const deptData = [
    { dept: "CSE-A", pct: 93 },
    { dept: "CSE-B", pct: 88 },
    { dept: "ECE-A", pct: 91 },
    { dept: "ECE-B", pct: 85 },
    { dept: "MECH", pct: 78 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Admin Dashboard 📊
        </h1>
        <p className="mt-1 text-muted-foreground">
          Departmental overview and faculty management.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Students" value="248" accent="primary" />
        <StatCard icon={UserCheck} label="Present Today" value="219" sub="88.3%" accent="success" />
        <StatCard icon={UserX} label="Absent Today" value="29" sub="11.7%" accent="destructive" />
        <StatCard icon={TrendingUp} label="Monthly Avg" value="91.2%" sub="↑ 1.4% vs last month" accent="chart-2" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold mb-4">Section-wise Attendance</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deptData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="dept" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 13,
                }}
              />
              <Bar dataKey="pct" name="Attendance %" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate({ to: "/dashboard/hod" })}
            className="w-full rounded-2xl border border-border bg-card p-6 shadow-soft text-left hover:shadow-elegant transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-colors">
                <BarChart3 className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold">View Full Reports</p>
                <p className="text-xs text-muted-foreground">Detailed analytics & exports</p>
              </div>
            </div>
          </button>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="font-display text-sm font-semibold mb-3">Quick Actions</h3>
            <button
              onClick={() => alert("Link Student & Parent feature coming soon!")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant transition hover:opacity-90"
            >
              <LinkIcon className="h-4 w-4" />
              Link Student & Parent
            </button>
            <p className="mt-3 text-xs text-muted-foreground text-center">
              Manually map parent accounts to students.
            </p>
          </div>

          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
            <p className="text-xs font-semibold text-destructive mb-1">🚨 Critical</p>
            <p className="text-sm text-muted-foreground">
              MECH section has fallen to 78% — below the 80% department threshold.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── PARENT OVERVIEW ───────────────── */
function ParentOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<ParentDashboardEntry[]>([]);

  useEffect(() => {
    api.parents.dashboard().then((res) => {
      setDashboardData(res.dashboard);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const DONUT_COLORS = ["var(--success)", "var(--destructive)", "var(--warning)"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Hello, {user?.first_name ?? "Parent"} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Stay updated on your child's attendance and alerts.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Donut */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold mb-1">Monthly Breakdown</h2>
          <p className="text-xs text-muted-foreground mb-4">Last 30 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: "Present", value: dashboardData.reduce((acc, d) => acc + d.recent_stats.present_days, 0) || 1 },
                  { name: "Absent", value: dashboardData.reduce((acc, d) => acc + d.recent_stats.absent_days, 0) },
                  { name: "Late", value: dashboardData.reduce((acc, d) => acc + d.recent_stats.late_days, 0) },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {DONUT_COLORS.map((color, i) => (
                  <Cell key={i} fill={color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 13,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success" />Present</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-destructive" />Absent</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning" />Late</span>
          </div>
        </div>

        {/* Stats cards */}
        <div className="space-y-4">
          <StatCard icon={UserCheck} label="Attendance Rate" value="88.5%" sub="This month" accent="success" />
          <StatCard icon={BellRing} label="Alerts Received" value="3" sub="via Telegram" accent="warning" />
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold">My Children</p>
                <p className="text-xs text-muted-foreground">{dashboardData.length} linked student(s)</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : dashboardData.length > 0 ? (
                dashboardData.map((entry) => (
                  <div key={entry.student.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                    <div>
                      <p className="font-semibold text-sm">{entry.student.first_name} {entry.student.last_name}</p>
                      <p className="text-xs text-muted-foreground">Class: {entry.student.grade} {entry.student.section}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-display">{entry.recent_stats.attendance_percentage}%</p>
                      <p className="text-xs text-muted-foreground">Attendance</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No children linked to this account yet.</p>
              )}
            </div>
            
            <button
              onClick={() => navigate({ to: "/dashboard/parent" })}
              className="mt-4 w-full text-center text-sm font-medium text-primary hover:underline"
            >
              View Detailed Reports
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold">Telegram Bot</p>
                <p className="text-xs text-muted-foreground">Connected & active</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Ask the bot anything — "Was my kid in class today?" 
            </p>
          </div>

          <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
            <p className="text-xs font-semibold text-warning mb-1">⚠️ Recent Alert</p>
            <p className="text-sm text-muted-foreground">
              Attendance dropped to 72% last week — below the 75% threshold.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── SHARED STAT CARD ───────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${accent}/10 text-${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
