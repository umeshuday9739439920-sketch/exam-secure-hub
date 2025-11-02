import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plus, BookOpen, Users, FileText, BarChart } from "lucide-react";
import { toast } from "sonner";
import CreateExamDialog from "@/components/admin/CreateExamDialog";

interface Exam {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  is_active: boolean;
  _count?: { questions: number };
}

interface Stats {
  totalExams: number;
  totalStudents: number;
  totalAttempts: number;
}

const AdminDashboard = ({ user }: { user: User }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [stats, setStats] = useState<Stats>({ totalExams: 0, totalStudents: 0, totalAttempts: 0 });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verify admin access server-side by attempting to fetch admin-only data
    verifyAdminAccess();
    loadExams();
    loadStats();
  }, []);

  const verifyAdminAccess = async () => {
    // Attempt to fetch data that only admins can access
    // If this fails due to RLS, user is not an admin
    const { error } = await supabase
      .from("user_roles")
      .select("id")
      .limit(1);

    if (error) {
      toast.error("Access denied. Redirecting...");
      navigate("/dashboard");
    }
  };

  const loadExams = async () => {
    const { data } = await supabase
      .from("exams")
      .select("*, questions(count)")
      .order("created_at", { ascending: false });

    if (data) {
      const examsWithCounts = data.map(exam => ({
        ...exam,
        _count: { questions: exam.questions?.[0]?.count || 0 }
      }));
      setExams(examsWithCounts as any);
    }
  };

  const loadStats = async () => {
    const [examsData, studentsData, attemptsData] = await Promise.all([
      supabase.from("exams").select("id", { count: "exact" }),
      supabase.from("user_roles").select("id", { count: "exact" }).eq("role", "student"),
      supabase.from("exam_attempts").select("id", { count: "exact" })
    ]);

    setStats({
      totalExams: examsData.count || 0,
      totalStudents: studentsData.count || 0,
      totalAttempts: attemptsData.count || 0
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const toggleExamStatus = async (examId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("exams")
      .update({ is_active: !currentStatus })
      .eq("id", examId);

    if (error) {
      toast.error("Failed to update exam status");
    } else {
      toast.success(`Exam ${!currentStatus ? "activated" : "deactivated"}`);
      loadExams();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
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
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExams}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttempts}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Manage Exams
                </CardTitle>
                <CardDescription>Create and manage your exams</CardDescription>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Exam
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {exams.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No exams created yet</p>
            ) : (
              exams.map(exam => (
                <Card key={exam.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{exam.title}</h3>
                          <Badge variant={exam.is_active ? "default" : "secondary"}>
                            {exam.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{exam.description}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{exam.duration_minutes} minutes</span>
                          <span>{exam.total_marks} marks</span>
                          <span>{exam._count?.questions || 0} questions</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/exam/${exam.id}`)}
                      >
                        Manage Questions
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExamStatus(exam.id, exam.is_active)}
                      >
                        {exam.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/results/${exam.id}`)}
                      >
                        View Results
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </main>

      <CreateExamDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={loadExams}
      />
    </div>
  );
};

export default AdminDashboard;