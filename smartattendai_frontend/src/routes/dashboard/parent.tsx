import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ParentDashboardLayout } from "@/components/ParentDashboardLayout";
import { api } from "@/lib/api";
import type { ParentDashboardEntry, ApiAttendance, ApiNotification, ApiMapping, ApiStudent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  UserCheck, UserX, Clock, Bot, BellRing, Link2, Loader2, Users,
  AlertTriangle, MessageSquare, CheckCircle2, XCircle, Calendar,
  TrendingUp, Send,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/parent")({ component: ParentDashboard });

function ParentDashboard() {
  return (
    <AuthGuard>
      <ParentContent />
    </AuthGuard>
  );
}

function ParentContent() {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<ParentDashboardEntry[]>([]);
  const [children, setChildren] = useState<{ student: ApiStudent; mapping: ApiMapping }[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [childAttendance, setChildAttendance] = useState<ApiAttendance[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [linkInfo, setLinkInfo] = useState<{ bot_link: string; bot_message: string; bot_username: string } | null>(null);
  const [loadingLinkInfo, setLoadingLinkInfo] = useState(false);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, childRes, notifRes] = await Promise.all([
        api.parents.dashboard(), api.parents.children(), api.parents.notifications(),
      ]);
      setDashboard(dashRes.dashboard);
      setChildren(childRes.children);
      setNotifications(notifRes.notifications);
      if (dashRes.dashboard.length > 0) setSelectedChild(dashRes.dashboard[0].student.id);
    } catch { toast.error("Failed to load dashboard"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedChild && tab === "reports") loadChildAttendance(selectedChild);
  }, [selectedChild, tab]);

  const loadChildAttendance = async (studentId: number) => {
    setLoadingAttendance(true);
    try {
      const res = await api.parents.childAttendance(studentId);
      setChildAttendance(res.attendances);
    } catch { toast.error("Failed to load attendance"); }
    finally { setLoadingAttendance(false); }
  };

  const handleGenerateTelegramLink = async () => {
    if (!phoneNumber) {
      toast.error("Enter your phone number to generate the Telegram link.");
      return;
    }

    setLoadingLinkInfo(true);
    try {
      const info = await api.parents.telegramLinkInfo(phoneNumber);
      setLinkInfo(info);
      toast.success("Telegram link generated. Open Telegram and follow the instructions.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate Telegram link");
      setLinkInfo(null);
    } finally {
      setLoadingLinkInfo(false);
    }
  };

  const getPercentageLabel = (pct: number) => {
    if (pct >= 90) return "Excellent";
    if (pct >= 75) return "Good";
    if (pct >= 60) return "Average";
    return "At Risk";
  };
  
  const getPercentageEmoji = (pct: number) => {
    if (pct >= 90) return "🔥";
    if (pct >= 75) return "👍";
    if (pct >= 60) return "⚠️";
    return "🚨";
  };

  if (loading) {
    return (
      <ParentDashboardLayout activeTab="overview" onTabChange={setTab}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </ParentDashboardLayout>
    );
  }

  return (
    <ParentDashboardLayout activeTab={tab} onTabChange={setTab}>
      {/* ── OVERVIEW / DASHBOARD TAB ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              🏠 Parent Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Welcome back! Here's your children's attendance overview</p>
          </div>

          {dashboard.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-lg font-semibold text-gray-500">No children linked</p>
              <p className="mt-1 text-sm text-gray-400">Contact your school admin to link your account.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {dashboard.map((entry) => {
                const { student, recent_stats, today_attendance, alert_status } = entry;
                const pct = recent_stats.attendance_percentage;
                const isPresent = today_attendance?.status === "present";
                const isAbsent = today_attendance?.status === "absent";

                return (
                  <div
                    key={student.id}
                    className={`bg-white rounded-2xl shadow-sm border ${alert_status === "critical" ? "border-red-200" : "border-gray-100"} overflow-hidden hover:shadow-xl hover:border-indigo-100 transition-all duration-300`}
                  >
                    {/* Student Info Row */}
                    <div className="flex items-center justify-between px-6 pt-5 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg shadow">
                          {student.first_name?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-base">{student.first_name} {student.last_name}</p>
                          <p className="text-xs text-gray-500">Roll No: {student.roll_number}</p>
                          <p className="text-xs text-gray-500">Class: {student.grade} {student.section}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-gray-400 font-medium mb-1">Today's Status</p>
                        {today_attendance ? (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            isPresent ? "bg-green-500 text-white" :
                            isAbsent ? "bg-red-500 text-white" :
                            "bg-yellow-500 text-white"
                          }`}>
                            {isPresent && <CheckCircle2 className="h-3 w-3" />}
                            {isAbsent && <XCircle className="h-3 w-3" />}
                            {!isPresent && !isAbsent && <Clock className="h-3 w-3" />}
                            {today_attendance.status.charAt(0).toUpperCase() + today_attendance.status.slice(1)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">
                            Not Marked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-5 gap-3 px-6 pb-4">
                      {/* Total Days */}
                      <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
                        <Calendar className="h-5 w-5 text-indigo-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                        <p className="text-xl font-bold text-gray-900">{recent_stats.total_days}</p>
                        <p className="text-[11px] text-gray-500">Total Days</p>
                      </div>
                      {/* Present */}
                      <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                        <p className="text-xl font-bold text-green-600">{recent_stats.present_days}</p>
                        <p className="text-[11px] text-gray-500">Present</p>
                      </div>
                      {/* Absent */}
                      <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
                        <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                        <p className="text-xl font-bold text-red-600">{recent_stats.absent_days ?? 0}</p>
                        <p className="text-[11px] text-gray-500">Absent</p>
                      </div>
                      {/* Percentage */}
                      <div className="col-span-2 rounded-xl p-3 text-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:-translate-y-1 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 group cursor-default flex flex-col items-center justify-center">
                        <TrendingUp className="h-6 w-6 mx-auto mb-1 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                        <p className="text-2xl font-bold">{pct.toFixed(1)}%</p>
                        <p className="text-xs opacity-90">{getPercentageEmoji(pct)} {getPercentageLabel(pct)}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-6 pb-2">
                      <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                        <span>Attendance Progress</span>
                        <span>{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 75 ? "bg-green-500" : "bg-red-500"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="px-6 py-4">
                      <button
                        onClick={() => { setSelectedChild(student.id); setTab("reports"); }}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 rounded-xl transition-all text-sm shadow-md hover:shadow-lg"
                      >
                        <TrendingUp className="h-4 w-4" />
                        VIEW DETAILED ATTENDANCE
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CHILDREN TAB ── */}
      {tab === "children" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">👨‍👩‍👧 My Children</h2>
          {children.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-gray-400">No children linked to your account.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {children.map((c) => (
                <div key={c.student.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {c.student.first_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{c.student.first_name} {c.student.last_name}</p>
                      <p className="text-xs text-gray-500">Roll: {c.student.roll_number} · {c.student.grade} {c.student.section}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.mapping.relationship} · {c.mapping.is_primary ? "Primary" : "Secondary"}</p>
                    </div>
                  </div>
                  {c.mapping.telegram_chat_id ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px] gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Telegram Linked
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-400 text-[11px] gap-1">
                      <XCircle className="h-3 w-3" /> Not Linked
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MARKS TAB ── */}
      {tab === "marks" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">📊 Marks & Grades</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <BarChart2Icon className="mx-auto h-12 w-12 text-gray-200" />
            <p className="mt-3 text-gray-500 font-medium">Marks view coming soon</p>
            <p className="text-sm text-gray-400 mt-1">Ask your school admin to publish marks.</p>
          </div>
        </div>
      )}

      {/* ── ALERTS TAB ── */}
      {tab === "alerts" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">🔔 Alerts</h2>
          {notifications.filter(n => n.message_type === "alert").length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <BellRing className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-gray-400">No alerts yet. You're good!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.filter(n => n.message_type === "alert").map((n) => (
                <div key={n.id} className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{n.message}</p>
                      <p className="text-[11px] text-gray-400 mt-2">{new Date(n.sent_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REPORTS TAB ── */}
      {tab === "reports" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">📋 Attendance Reports</h2>
            {children.length > 1 && (
              <div className="flex gap-2">
                {children.map((c) => (
                  <Button
                    key={c.student.id}
                    size="sm"
                    variant={selectedChild === c.student.id ? "default" : "outline"}
                    onClick={() => { setSelectedChild(c.student.id); loadChildAttendance(c.student.id); }}
                  >
                    {c.student.first_name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {loadingAttendance ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          ) : childAttendance.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <p className="text-gray-400">No attendance records found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Date</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childAttendance.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.date}</TableCell>
                      <TableCell className="text-gray-500">{a.subject || "—"}</TableCell>
                      <TableCell className="text-gray-500">{a.period || "—"}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`text-[10px] ${
                          a.status === "present" ? "bg-green-100 text-green-700 border-green-200" :
                          a.status === "absent" ? "bg-red-100 text-red-700 border-red-200" :
                          "bg-yellow-100 text-yellow-700 border-yellow-200"
                        }`}>
                          {a.status === "present" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {a.status === "absent" && <XCircle className="h-3 w-3 mr-1" />}
                          {a.status === "late" && <Clock className="h-3 w-3 mr-1" />}
                          {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">{a.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* ── TELEGRAM TAB ── */}
      {tab === "telegram" && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-gray-900">✈️ Telegram Integration</h2>

          {/* Bot info banner */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Send className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-lg">@smartattend_ai_bot</p>
              <p className="text-sm opacity-80">Use the generated link below, or search for this bot on Telegram and send <code className="bg-white/20 px-1 rounded">/start</code> to begin linking your account.</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Link Telegram */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">Link using Your Phone Number</h3>
                  <p className="text-xs text-gray-400">Enter your registered mobile number to generate the Telegram bot link and message.</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="phone-number" className="text-xs">Your Phone Number</Label>
                  <Input
                    id="phone-number"
                    placeholder="e.g. +919535960697"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1 text-sm h-9"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Use the same number registered with the school. This will generate your personal Telegram bot link and connect message.
                  </p>
                </div>
                <Button
                  onClick={handleGenerateTelegramLink}
                  disabled={loadingLinkInfo || !phoneNumber}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white gap-2 h-9"
                >
                  {loadingLinkInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  {loadingLinkInfo ? "Generating…" : "Generate Telegram Link"}
                </Button>
                {linkInfo && (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-gray-800">
                    <p className="font-semibold text-gray-900">Send this from your phone:</p>
                    <p className="mt-3">
                      <span className="block text-[11px] text-gray-500">Bot link</span>
                      <a href={linkInfo.bot_link} target="_blank" rel="noreferrer" className="text-indigo-700 underline break-all">
                        {linkInfo.bot_link}
                      </a>
                    </p>
                    <p className="mt-3">
                      <span className="block text-[11px] text-gray-500">Message to send</span>
                      <code className="block rounded bg-white px-2 py-1 text-xs text-indigo-700">{linkInfo.bot_message}</code>
                    </p>
                    <p className="mt-3 text-[11px] text-gray-500">
                      Open the bot link in Telegram and send the above message if needed. The bot will link your account automatically using your phone.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Connection Status</h3>
              <div className="space-y-3">
                {children.map((c) => (
                  <div key={c.student.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.student.first_name} {c.student.last_name}</p>
                      <p className="text-xs text-gray-400">{c.mapping.relationship}</p>
                    </div>
                    {c.mapping.telegram_chat_id ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1 text-gray-400">
                        <XCircle className="h-3 w-3" /> Not linked
                      </Badge>
                    )}
                  </div>
                ))}
                {children.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No children linked.</p>}
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">How It Works</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { step: "1", title: "Open the Bot", desc: "Search @smartattend_ai_bot on Telegram and tap /start. Share your phone number to link automatically." },
                { step: "2", title: "Auto Monitoring", desc: "When your child's attendance drops below 75%, the system triggers an alert." },
                { step: "3", title: "Instant Alerts", desc: "Receive real-time Telegram messages with attendance details and action steps." },
              ].map((s) => (
                <div key={s.step} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                    {s.step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">Available Bot Commands:</p>
              <div className="grid grid-cols-2 gap-1">
                {["/start", "/attendance", "/today", "/weekly", "/monthly", "/detailed", "/marks", "/dashboard"].map(cmd => (
                  <code key={cmd} className="text-[11px] bg-white border border-gray-200 rounded px-2 py-0.5 text-indigo-600">{cmd}</code>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </ParentDashboardLayout>
  );
}

function BarChart2Icon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 16v-4m4 4V8m4 8V6" />
    </svg>
  );
}
