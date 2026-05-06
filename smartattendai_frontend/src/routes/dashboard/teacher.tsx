import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import type { ApiStudent, ClassAttendanceRecord } from "@/lib/api";
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
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Loader2,
  Users,
  Plus,
  Search,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/teacher")({
  component: TeacherDashboard,
});

type AttendanceStatus = "present" | "absent" | "late";

interface RollEntry {
  student: ApiStudent;
  status: AttendanceStatus;
  notes: string;
}

function TeacherDashboard() {
  return (
    <DashboardLayout>
      <TeacherContent />
    </DashboardLayout>
  );
}

function TeacherContent() {
  const [classes, setClasses] = useState<{ grade: string; section: string }[]>([]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [subject, setSubject] = useState("");
  const [period, setPeriod] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [roll, setRoll] = useState<RollEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Load classes on mount
  useEffect(() => {
    api.students.grades().then((r) => setClasses(r.classes)).catch(() => {});
  }, []);

  // Load students when class selected
  const loadStudents = async () => {
    if (!selectedGrade || !selectedSection) {
      toast.error("Please select a grade and section");
      return;
    }
    setLoading(true);
    try {
      const res = await api.students.list({
        grade: selectedGrade,
        section: selectedSection,
      });
      setStudents(res.students);
      setRoll(
        res.students.map((s) => ({
          student: s,
          status: "present" as AttendanceStatus,
          notes: "",
        }))
      );
    } catch (err) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (idx: number, status: AttendanceStatus) => {
    setRoll((prev) =>
      prev.map((entry, i) => (i === idx ? { ...entry, status } : entry))
    );
  };

  const markAllPresent = () => {
    setRoll((prev) => prev.map((e) => ({ ...e, status: "present" })));
  };

  const submitAttendance = async () => {
    if (roll.length === 0) {
      toast.error("No students to mark");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.attendance.mark({
        attendances: roll.map((r) => ({
          student_id: r.student.id,
          status: r.status,
          notes: r.notes || undefined,
        })),
        date: attendanceDate,
        subject: subject || undefined,
        period: period || undefined,
      });
      toast.success(
        `Attendance saved! ${res.alerts_triggered} alert(s) triggered.`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRoll = search
    ? roll.filter(
        (r) =>
          r.student.first_name.toLowerCase().includes(search.toLowerCase()) ||
          r.student.last_name.toLowerCase().includes(search.toLowerCase()) ||
          r.student.roll_number?.toLowerCase().includes(search.toLowerCase())
      )
    : roll;

  const presentCount = roll.filter((r) => r.status === "present").length;
  const absentCount = roll.filter((r) => r.status === "absent").length;
  const lateCount = roll.filter((r) => r.status === "late").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Mark Attendance
          </h1>
          <p className="mt-1 text-muted-foreground">
            Select a class and take the roll call.
          </p>
        </div>
        <Button onClick={() => setAddStudentOpen(true)} variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-display text-sm font-semibold mb-4">Select Class</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Grade</Label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
              <SelectContent>
                {[...new Set(classes.map((c) => c.grade))].map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Section</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>
                {classes
                  .filter((c) => c.grade === selectedGrade)
                  .map((c) => (
                    <SelectItem key={c.section} value={c.section}>{c.section}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input placeholder="e.g. Math" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={loadStudents} className="w-full bg-gradient-primary shadow-elegant gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Load Students
            </Button>
          </div>
        </div>
      </div>

      {/* Roll Call */}
      {roll.length > 0 && (
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Users className="h-4 w-4 text-muted-foreground" />
                {roll.length} students
              </span>
              <span className="text-xs text-success font-medium">{presentCount} present</span>
              <span className="text-xs text-destructive font-medium">{absentCount} absent</span>
              <span className="text-xs text-warning font-medium">{lateCount} late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student…"
                  className="pl-9 h-9 w-48"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={markAllPresent}>
                All Present
              </Button>
            </div>
          </div>

          {/* Student rows */}
          <div className="divide-y divide-border">
            {filteredRoll.map((entry, idx) => {
              const realIdx = roll.indexOf(entry);
              return (
                <div
                  key={entry.student.id}
                  className={`flex items-center justify-between gap-4 px-6 py-3 transition-colors ${
                    entry.status === "absent"
                      ? "bg-destructive/5"
                      : entry.status === "late"
                      ? "bg-warning/5"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                      {entry.student.roll_number || (idx + 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {entry.student.first_name} {entry.student.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {entry.student.student_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusButton
                      active={entry.status === "present"}
                      onClick={() => updateStatus(realIdx, "present")}
                      icon={CheckCircle2}
                      color="success"
                      label="P"
                    />
                    <StatusButton
                      active={entry.status === "absent"}
                      onClick={() => updateStatus(realIdx, "absent")}
                      icon={XCircle}
                      color="destructive"
                      label="A"
                    />
                    <StatusButton
                      active={entry.status === "late"}
                      onClick={() => updateStatus(realIdx, "late")}
                      icon={Clock}
                      color="warning"
                      label="L"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit bar */}
          <div className="flex items-center justify-between border-t border-border bg-surface/60 px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {presentCount}/{roll.length} marked present
            </p>
            <Button
              onClick={submitAttendance}
              disabled={submitting}
              className="bg-gradient-primary shadow-elegant gap-2"
              size="lg"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {submitting ? "Saving…" : "Submit Attendance"}
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {roll.length === 0 && !loading && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 font-display text-lg font-semibold text-muted-foreground">
            No students loaded
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a grade and section above, then click "Load Students" to begin.
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      )}

      {/* Add Student Modal */}
      <AddStudentModal open={addStudentOpen} onOpenChange={setAddStudentOpen} onCreated={loadStudents} />
    </div>
  );
}

/* ── Status Button ── */
function StatusButton({
  active,
  onClick,
  icon: Icon,
  color,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  color: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition-all ${
        active
          ? `bg-${color}/15 border-${color}/40 text-${color}`
          : "border-border text-muted-foreground hover:border-border/80"
      }`}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/* ── Add Student Modal ── */
function AddStudentModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    student_id: "",
    first_name: "",
    last_name: "",
    grade: "",
    section: "",
    roll_number: "",
    email: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.first_name || !form.last_name) {
      toast.error("Student ID, first name and last name are required");
      return;
    }
    setLoading(true);
    try {
      await api.students.create(form);
      toast.success("Student added successfully");
      onOpenChange(false);
      setForm({ student_id: "", first_name: "", last_name: "", grade: "", section: "", roll_number: "", email: "", phone: "" });
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>Enter student details to enrol them.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>First Name *</Label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Last Name *</Label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Student ID *</Label>
              <Input placeholder="e.g. STU001" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Roll No.</Label>
              <Input value={form.roll_number} onChange={(e) => setForm({ ...form, roll_number: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Grade</Label>
              <Input placeholder="e.g. 10" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Section</Label>
              <Input placeholder="e.g. A" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Button type="submit" className="w-full bg-gradient-primary shadow-elegant" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? "Adding…" : "Add Student"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
