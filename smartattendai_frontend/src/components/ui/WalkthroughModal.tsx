import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface WalkthroughModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Student {
  id: string;
  name: string;
  rollNo: string;
  present: boolean;
}

const MOCK_STUDENTS: Student[] = [
  { id: "1", name: "Harshitha K U", rollNo: "4VM24MC012", present: true },
  { id: "2", name: "Sanjana H D", rollNo: "4VM24MC021", present: true },
  { id: "3", name: "Shadini K J", rollNo: "4VM24MC022", present: false },
];

export function WalkthroughModal({ open, onOpenChange }: WalkthroughModalProps) {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [submitted, setSubmitted] = useState(false);

  const toggleAttendance = (id: string) => {
    setStudents(
      students.map((s) => (s.id === id ? { ...s, present: !s.present } : s))
    );
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      onOpenChange(false);
      setSubmitted(false);
      setStudents(MOCK_STUDENTS);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>✓</span>
            Mark Attendance
          </DialogTitle>
          <DialogDescription>
            Track attendance for your class. {user && `${user.first_name} ${user.last_name} (${user.role})`}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-5xl mb-4">✓</div>
            <h3 className="text-lg font-semibold">Attendance Marked</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Successfully recorded attendance for {students.filter((s) => s.present).length} students
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Class, Subject, Date Selection */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2nd-sem-mca-a">2nd Sem MCA A</SelectItem>
                    <SelectItem value="2nd-sem-mca-b">2nd Sem MCA B</SelectItem>
                    <SelectItem value="4th-sem-bca">4th Sem BCA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="nlp">Natural Language Processing</SelectItem>
                    <SelectItem value="web">Web Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            {/* Attendance Buttons */}
            <div className="flex gap-3 border-b border-border pb-4">
              <Button
                size="sm"
                className="bg-success hover:bg-success/90 text-white"
                onClick={() => setStudents(students.map((s) => ({ ...s, present: true })))}
              >
                ✓ ALL PRESENT
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => setStudents(students.map((s) => ({ ...s, present: false })))}
              >
                ✕ ALL ABSENT
              </Button>
            </div>

            {/* Student List */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Student List</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.rollNo}</p>
                    </div>
                    <button
                      onClick={() => toggleAttendance(student.id)}
                      className="ml-4 flex items-center justify-center"
                    >
                      {student.present ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-surface/50">
              <div>
                <p className="text-xs text-muted-foreground">Present Today</p>
                <p className="text-2xl font-bold text-success">
                  {students.filter((s) => s.present).length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Absent Today</p>
                <p className="text-2xl font-bold text-destructive">
                  {students.filter((s) => !s.present).length}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              size="lg"
              className="w-full bg-gradient-primary shadow-elegant"
              disabled={!selectedClass || !selectedSubject}
            >
              SUBMIT ATTENDANCE
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
