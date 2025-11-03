import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Settings, BarChart, Clock } from "lucide-react";
import CreateExamDialog from "@/components/admin/CreateExamDialog";
import { useToast } from "@/hooks/use-toast";

interface Exam {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  is_active: boolean;
  created_at: string;
  questions: { count: number }[];
}

export default function ExamsManagement() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    const { data } = await supabase
      .from("exams")
      .select("*, questions(count)")
      .order("created_at", { ascending: false });

    if (data) setExams(data as any);
  };

  const toggleExamStatus = async (examId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("exams")
      .update({ is_active: !currentStatus })
      .eq("id", examId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update exam status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Exam ${!currentStatus ? "activated" : "deactivated"}`,
      });
      loadExams();
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Exams Management</h1>
          <p className="text-muted-foreground">
            Create and manage all examination papers
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Exam
        </Button>
      </div>

      <div className="grid gap-4">
        {exams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No exams created yet. Click "Create Exam" to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          exams.map((exam) => (
            <Card key={exam.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{exam.title}</CardTitle>
                      <Badge variant={exam.is_active ? "default" : "secondary"}>
                        {exam.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {exam.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active</span>
                    <Switch
                      checked={exam.is_active}
                      onCheckedChange={() =>
                        toggleExamStatus(exam.id, exam.is_active)
                      }
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{exam.duration_minutes} min</span>
                    </div>
                    <div>
                      <span className="font-medium">{exam.total_marks}</span>{" "}
                      marks
                    </div>
                    <div>
                      Pass: <span className="font-medium">{exam.passing_marks}</span>
                    </div>
                    <div>
                      <span className="font-medium">
                        {exam.questions?.[0]?.count || 0}
                      </span>{" "}
                      questions
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/exam/${exam.id}`)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Questions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/results/${exam.id}`)}
                    >
                      <BarChart className="h-4 w-4 mr-2" />
                      View Results
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateExamDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={loadExams}
      />
    </div>
  );
}
