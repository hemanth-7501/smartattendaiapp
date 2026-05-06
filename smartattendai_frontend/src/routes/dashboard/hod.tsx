import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import type { ApiUser, ReportEntry } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Users,
  Search,
  Download,
  Loader2,
  Shield,
  ShieldOff,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/dashboard/hod")({
  component: HodDashboard,
});

function HodDashboard() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <HodContent />
      </DashboardLayout>
    </AuthGuard>
  );
}

function HodContent() {
  const [tab, setTab] = useState("reports");
  const [classes, setClasses] = useState<{ grade: string; section: string }[]>([]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [reportData, setReportData] = useState<ReportEntry[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  const [teachers, setTeachers] = useState<ApiUser[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  useEffect(() => {
    api.students.grades().then((r) => setClasses(r.classes)).catch(() => {});
  }, []);

  const loadReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select date range");
      return;
    }
    setLoadingReport(true);
    try {
      const params: Record<string, string> = {
        start_date: startDate,
        end_date: endDate,
      };
      if (selectedGrade) params.grade = selectedGrade;
      if (selectedSection) params.section = selectedSection;
      const res = await api.attendance.getReport(params);
      setReportData(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoadingReport(false);
    }
  };

  const loadTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const res = await api.users.list({ role: "teacher" });
      setTeachers(res.users);
    } catch {
      toast.error("Failed to load teachers");
    } finally {
      setLoadingTeachers(false);
    }
  };

  useEffect(() => {
    if (tab === "faculty") loadTeachers();
  }, [tab]);

  const toggleTeacher = async (teacher: ApiUser) => {
    try {
      await api.users.update(teacher.id, { is_active: !teacher.is_active });
      toast.success(
        `${teacher.first_name} ${teacher.last_name} ${teacher.is_active ? "deactivated" : "activated"}`
      );
      loadTeachers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const avgAttendance =
    reportData.length > 0
      ? (
          reportData.reduce((s, r) => s + r.summary.attendance_percentage, 0) /
          reportData.length
        ).toFixed(1)
      : "—";

  const atRiskStudents = reportData.filter(
    (r) => r.summary.attendance_percentage < 75
  );

  const chartData = reportData
    .slice(0, 20)
    .map((r) => ({
      name: `${r.student.first_name} ${r.student.last_name?.charAt(0) || ""}.`,
      pct: r.summary.attendance_percentage,
    }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Reports & Analytics
        </h1>
        <p className="mt-1 text-muted-foreground">
          Departmental insights, attendance reports, and faculty management.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Attendance Reports
          </TabsTrigger>
          <TabsTrigger value="faculty" className="gap-2">
            <Users className="h-4 w-4" /> Faculty Management
          </TabsTrigger>
        </TabsList>

        {/* ── REPORTS TAB ── */}
        <TabsContent value="reports" className="space-y-6">
          {/* Filters */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-display text-sm font-semibold mb-4">Filter Report</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Grades</SelectItem>
                    {[...new Set(classes.map((c) => c.grade))].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Sections</SelectItem>
                    {classes
                      .filter((c) => !selectedGrade || selectedGrade === "__all__" || c.grade === selectedGrade)
                      .map((c) => (
                        <SelectItem key={c.section} value={c.section}>{c.section}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button onClick={loadReport} className="w-full bg-gradient-primary shadow-elegant gap-2" disabled={loadingReport}>
                  {loadingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Generate
                </Button>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          {reportData.length > 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Users className="h-5 w-5" />
                    </span>
                    <p className="text-xs font-medium text-muted-foreground">Total Students</p>
                  </div>
                  <p className="mt-3 font-display text-2xl font-semibold">{reportData.length}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                      <TrendingUp className="h-5 w-5" />
                    </span>
                    <p className="text-xs font-medium text-muted-foreground">Avg Attendance</p>
                  </div>
                  <p className="mt-3 font-display text-2xl font-semibold">{avgAttendance}%</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <p className="text-xs font-medium text-muted-foreground">At-Risk (&lt;75%)</p>
                  </div>
                  <p className="mt-3 font-display text-2xl font-semibold">{atRiskStudents.length}</p>
                </div>
              </div>

              {/* Chart */}
              {chartData.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <h3 className="font-display text-lg font-semibold mb-4">
                    Student-wise Attendance
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        angle={-35}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          fontSize: 13,
                        }}
                      />
                      <Bar dataKey="pct" name="Attendance %" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Table */}
              <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <h3 className="font-display text-lg font-semibold">Detailed Report</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead className="text-center">Present</TableHead>
                      <TableHead className="text-center">Absent</TableHead>
                      <TableHead className="text-center">Late</TableHead>
                      <TableHead className="text-center">%</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((entry) => (
                      <TableRow key={entry.student.id}>
                        <TableCell className="font-medium">
                          {entry.student.first_name} {entry.student.last_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {entry.student.student_id}
                        </TableCell>
                        <TableCell className="text-center text-success font-medium">
                          {entry.summary.present_days}
                        </TableCell>
                        <TableCell className="text-center text-destructive font-medium">
                          {entry.summary.absent_days}
                        </TableCell>
                        <TableCell className="text-center text-warning font-medium">
                          {entry.summary.late_days}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {entry.summary.attendance_percentage}%
                        </TableCell>
                        <TableCell>
                          {entry.summary.attendance_percentage < 75 ? (
                            <Badge variant="destructive" className="text-[10px]">At Risk</Badge>
                          ) : entry.summary.attendance_percentage >= 90 ? (
                            <Badge className="bg-success/15 text-success border-success/30 text-[10px]">Excellent</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Good</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {loadingReport && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          )}

          {reportData.length === 0 && !loadingReport && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 font-display text-lg font-semibold text-muted-foreground">
                No report generated
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Select filters above and click "Generate" to see attendance analytics.
              </p>
            </div>
          )}
        </TabsContent>

        {/* ── FACULTY TAB ── */}
        <TabsContent value="faculty" className="space-y-6">
          {loadingTeachers ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
              <div className="border-b border-border px-6 py-4">
                <h3 className="font-display text-lg font-semibold">
                  Faculty ({teachers.length})
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        {t.first_name} {t.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{t.username}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{t.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">{t.role}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {t.is_active ? (
                          <Badge className="bg-success/15 text-success border-success/30 text-[10px]">Active</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTeacher(t)}
                          className="gap-1.5 text-xs"
                        >
                          {t.is_active ? (
                            <>
                              <ShieldOff className="h-3.5 w-3.5" /> Deactivate
                            </>
                          ) : (
                            <>
                              <Shield className="h-3.5 w-3.5" /> Activate
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {teachers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No teachers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
