import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Award } from "lucide-react";

interface ExamStats {
  id: string;
  title: string;
  attempts: number;
  passRate: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
}

export default function Analytics() {
  const [examStats, setExamStats] = useState<ExamStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    const { data: exams } = await supabase
      .from("exams")
      .select("id, title")
      .order("created_at", { ascending: false });

    if (exams) {
      const stats = await Promise.all(
        exams.map(async (exam) => {
          const { data: attempts } = await supabase
            .from("exam_attempts")
            .select("percentage, passed")
            .eq("exam_id", exam.id)
            .not("percentage", "is", null);

          if (!attempts || attempts.length === 0) {
            return {
              ...exam,
              attempts: 0,
              passRate: 0,
              averageScore: 0,
              highestScore: 0,
              lowestScore: 0,
            };
          }

          const passedCount = attempts.filter((a) => a.passed).length;
          const percentages = attempts.map((a) => a.percentage);

          return {
            ...exam,
            attempts: attempts.length,
            passRate: (passedCount / attempts.length) * 100,
            averageScore:
              percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
            highestScore: Math.max(...percentages),
            lowestScore: Math.min(...percentages),
          };
        })
      );

      setExamStats(stats);
    }
    setLoading(false);
  };

  const overallStats = {
    totalAttempts: examStats.reduce((sum, e) => sum + e.attempts, 0),
    averagePassRate:
      examStats.length > 0
        ? examStats.reduce((sum, e) => sum + e.passRate, 0) / examStats.length
        : 0,
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics & Reports</h1>
        <p className="text-muted-foreground">
          Comprehensive performance analytics across all examinations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Exam Attempts
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">Across all exams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Average Pass Rate
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.averagePassRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam-wise Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading analytics...</p>
          ) : examStats.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No exam data available
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Title</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Pass Rate</TableHead>
                  <TableHead>Avg Score</TableHead>
                  <TableHead>Highest</TableHead>
                  <TableHead>Lowest</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examStats.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell>{exam.attempts}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={exam.passRate >= 60 ? "default" : "destructive"}
                        >
                          {exam.passRate.toFixed(1)}%
                        </Badge>
                        {exam.passRate >= 60 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{exam.averageScore.toFixed(1)}%</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {exam.highestScore.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-red-600 font-medium">
                      {exam.lowestScore.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
