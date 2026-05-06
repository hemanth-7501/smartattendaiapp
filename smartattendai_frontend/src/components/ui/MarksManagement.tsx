import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2 } from "lucide-react";

interface StudentMarks {
  rollNo: string;
  name: string;
  examType: string;
  marks: number;
  totalMarks: number;
  credits: number;
  gradePoint: string;
  percentage: number;
}

const MOCK_MARKS_DATA: StudentMarks[] = [
  {
    rollNo: "4VM24MC021",
    name: "Sanjana H D",
    examType: "IA",
    marks: 40,
    totalMarks: 50,
    credits: 4,
    gradePoint: "8",
    percentage: 80.0,
  },
  {
    rollNo: "4VM24MC022",
    name: "Shadini K J",
    examType: "IA",
    marks: 44,
    totalMarks: 50,
    credits: 4,
    gradePoint: "9",
    percentage: 88.0,
  },
  {
    rollNo: "4VM24MC012",
    name: "Harshitha K U",
    examType: "IA",
    marks: 48,
    totalMarks: 50,
    credits: 4,
    gradePoint: "10",
    percentage: 96.0,
  },
];

export function MarksManagement() {
  const [selectedClass, setSelectedClass] = useState<string>("2nd-sem-mca");
  const [selectedSection, setSelectedSection] = useState<string>("a");
  const [selectedExam, setSelectedExam] = useState<string>("ia");
  const [selectedSubject, setSelectedSubject] = useState<string>("nlp");
  const [marksData, setMarksData] = useState<StudentMarks[]>(MOCK_MARKS_DATA);

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return "text-success";
    if (percentage >= 75) return "text-warning";
    return "text-destructive";
  };

  const getGradeColor = (grade: string) => {
    const gradeNum = parseInt(grade);
    if (gradeNum >= 9) return "bg-success/10 text-success";
    if (gradeNum >= 7) return "bg-warning/10 text-warning";
    return "bg-destructive/10 text-destructive";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <span className="text-xl">📊</span>
          Student Marks Management
        </h3>
        <div className="flex gap-2">
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            + ADD INDIVIDUAL MARKS
          </Button>
          <Button size="sm" variant="outline">
            📤 UPLOAD EXCEL
          </Button>
          <Button size="sm" variant="outline">
            ⚙️ MANAGE EXAM TYPES
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Class</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2nd-sem-mca">2nd Sem MCA</SelectItem>
              <SelectItem value="4th-sem-mca">4th Sem MCA</SelectItem>
              <SelectItem value="4th-sem-bca">4th Sem BCA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Section</label>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">A</SelectItem>
              <SelectItem value="b">B</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Exam Type</label>
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ia">IA</SelectItem>
              <SelectItem value="mid">Mid Term</SelectItem>
              <SelectItem value="final">Final</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Subject</label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nlp">Natural Language Processing</SelectItem>
              <SelectItem value="web">Web Development</SelectItem>
              <SelectItem value="db">Database</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="px-4 py-3 text-left text-xs font-semibold">ROLL NO</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">STUDENT NAME</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">EXAM TYPE</th>
                <th className="px-4 py-3 text-center text-xs font-semibold">MARKS</th>
                <th className="px-4 py-3 text-center text-xs font-semibold">CREDITS</th>
                <th className="px-4 py-3 text-center text-xs font-semibold">GRADE POINT</th>
                <th className="px-4 py-3 text-center text-xs font-semibold">PERCENTAGE</th>
                <th className="px-4 py-3 text-center text-xs font-semibold">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {marksData.map((student, idx) => (
                <tr
                  key={idx}
                  className="border-b border-border hover:bg-surface/30 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium">{student.rollNo}</td>
                  <td className="px-4 py-3 text-sm">{student.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{student.examType}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {student.marks}/{student.totalMarks}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">{student.credits}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={getGradeColor(student.gradePoint)}>
                      {student.gradePoint}
                    </Badge>
                  </td>
                  <td className={`px-4 py-3 text-sm text-center font-semibold ${getPercentageColor(student.percentage)}`}>
                    {student.percentage.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1 hover:bg-primary/10 rounded transition-colors">
                        <Edit2 className="h-4 w-4 text-primary" />
                      </button>
                      <button className="p-1 hover:bg-destructive/10 rounded transition-colors">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
