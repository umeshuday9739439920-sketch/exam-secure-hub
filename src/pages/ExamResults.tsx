import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, AlertTriangle, Edit } from "lucide-react";

interface Result {
  id: string;
  score: number | null;
  total_marks: number;
  percentage: number | null;
  passed: boolean | null;
  tab_switches: number;
  started_at: string;
  requires_grading: boolean;
  grading_completed: boolean;
  profile: {
    full_name: string;
  };
}

const ExamResults = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<Result[]>([]);
  const [examTitle, setExamTitle] = useState("");

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    const { data: exam } = await supabase
      .from("exams")
      .select("title")
      .eq("id", examId)
      .single();

    if (exam) setExamTitle(exam.title);

    const { data } = await supabase
      .from("exam_attempts")
      .select("*, profile:profiles(full_name)")
      .eq("exam_id", examId)
      .not("submitted_at", "is", null) // Only show completed attempts
      .order("percentage", { ascending: false, nullsFirst: false });

    if (data) setResults(data as any);
  };

  const averageScore = results.length > 0
    ? results.filter(r => r.percentage !== null).reduce((sum, r) => sum + (r.percentage ?? 0), 0) / results.filter(r => r.percentage !== null).length
    : 0;

  const passedCount = results.filter(r => r.passed === true).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{examTitle} - Results</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {results.length > 0 ? ((passedCount / results.length) * 100).toFixed(1) : 0}%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No attempts yet</p>
              ) : (
                results.map((result) => (
                  <Card key={result.id}>
                    <CardContent className="pt-6">
                      {result.requires_grading && !result.grading_completed ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">{result.profile.full_name}</h3>
                              <Badge variant="secondary">Pending Manual Grading</Badge>
                            </div>
                          </div>
                          <Button
                            onClick={() => navigate(`/admin/grade/${result.id}`)}
                            size="sm"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Grade Answers
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold mb-2">{result.profile.full_name}</h3>
                              <div className="flex items-center gap-4 text-sm">
                                <span>
                                  Score: {result.score ?? 0} / {result.total_marks}
                                </span>
                                <Badge variant={result.passed ? "default" : "destructive"}>
                                  {result.percentage?.toFixed(1) ?? 0}%
                                </Badge>
                                {result.tab_switches > 0 && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {result.tab_switches} tab switches
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge variant={result.passed ? "default" : "secondary"}>
                            {result.passed ? "Passed" : "Failed"}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExamResults;