import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Clock, BookOpen, Award } from "lucide-react";
import { toast } from "sonner";

interface Exam {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  score: number;
  total_marks: number;
  percentage: number;
  passed: boolean;
  exam: { title: string };
}

const StudentDashboard = ({ user }: { user: User }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadExams();
    loadAttempts();
  }, []);

  const loadExams = async () => {
    const { data } = await supabase
      .from("exams")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (data) setExams(data);
  };

  const loadAttempts = async () => {
    const { data } = await supabase
      .from("exam_attempts")
      .select("*, exam:exams(title)")
      .eq("student_id", user.id)
      .not("submitted_at", "is", null) // Only show completed attempts
      .order("started_at", { ascending: false });

    if (data) setAttempts(data as any);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const startExam = async (examId: string) => {
    // Check if already attempted
    const existing = attempts.find(a => a.exam_id === examId);
    if (existing) {
      toast.error("You have already attempted this exam");
      return;
    }

    navigate(`/exam/${examId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Student Portal</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Available Exams
              </CardTitle>
              <CardDescription>Select an exam to start</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {exams.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No exams available</p>
              ) : (
                exams.map(exam => (
                  <Card key={exam.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{exam.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{exam.description}</p>
                          <div className="flex gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {exam.duration_minutes} mins
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="w-4 h-4" />
                              {exam.total_marks} marks
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => startExam(exam.id)}
                        className="w-full"
                        disabled={attempts.some(a => a.exam_id === exam.id)}
                      >
                        {attempts.some(a => a.exam_id === exam.id) ? "Already Attempted" : "Start Exam"}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                My Results
              </CardTitle>
              <CardDescription>Your exam performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {attempts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No attempts yet</p>
              ) : (
                attempts.map(attempt => (
                  <Card key={attempt.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{attempt.exam.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Score: {attempt.score ?? 0} / {attempt.total_marks}
                          </p>
                        </div>
                        <Badge variant={attempt.passed ? "default" : "destructive"}>
                          {attempt.percentage?.toFixed(1) ?? 0}%
                        </Badge>
                      </div>
                      <Badge variant={attempt.passed ? "default" : "secondary"}>
                        {attempt.passed ? "Passed" : "Failed"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;