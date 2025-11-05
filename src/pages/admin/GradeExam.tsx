import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Answer {
  id: string;
  question_id: string;
  text_answer: string;
  awarded_marks: number | null;
  is_graded: boolean;
  question: {
    question_text: string;
    marks: number;
  };
}

interface Attempt {
  id: string;
  student_id: string;
  submitted_at: string;
  profile: {
    full_name: string;
    email: string;
  };
  answers: Answer[];
}

const GradeExam = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [examTitle, setExamTitle] = useState("");

  useEffect(() => {
    loadAttempt();
  }, []);

  const loadAttempt = async () => {
    const { data, error } = await supabase
      .from("exam_attempts")
      .select(`
        id,
        student_id,
        submitted_at,
        exam_id,
        profile:profiles!exam_attempts_student_id_fkey (
          full_name,
          email
        ),
        answers (
          id,
          question_id,
          text_answer,
          awarded_marks,
          is_graded,
          question:questions (
            question_text,
            marks,
            question_type
          )
        )
      `)
      .eq("id", attemptId)
      .single();

    if (error) {
      toast.error("Failed to load attempt");
      navigate("/dashboard");
      return;
    }

    if (data) {
      // Filter only long text answers that need grading
      const longTextAnswers = data.answers.filter(
        (a: any) => a.question.question_type === 'long_text'
      );
      
      setAttempt({
        ...data,
        answers: longTextAnswers,
      } as any);

      // Load exam title
      const { data: exam } = await supabase
        .from("exams")
        .select("title")
        .eq("id", data.exam_id)
        .single();

      if (exam) setExamTitle(exam.title);

      // Initialize grades
      const initialGrades: Record<string, number> = {};
      longTextAnswers.forEach((answer: any) => {
        if (answer.awarded_marks !== null) {
          initialGrades[answer.id] = answer.awarded_marks;
        }
      });
      setGrades(initialGrades);
    }
  };

  const handleGradeChange = (answerId: string, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setGrades(prev => ({ ...prev, [answerId]: numValue }));
    }
  };

  const handleSubmitGrades = async () => {
    if (!attempt) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update all answer grades
    const updatePromises = attempt.answers.map(answer =>
      supabase
        .from("answers")
        .update({
          awarded_marks: grades[answer.id] || 0,
          is_graded: true,
          graded_by: user.id,
          graded_at: new Date().toISOString(),
        })
        .eq("id", answer.id)
    );

    const results = await Promise.all(updatePromises);
    const hasError = results.some(r => r.error);

    if (hasError) {
      toast.error("Failed to save grades");
      return;
    }

    // Calculate total score for this attempt
    const { data: allAnswers } = await supabase
      .from("answers")
      .select("awarded_marks, is_correct, question:questions(marks)")
      .eq("attempt_id", attemptId);

    if (!allAnswers) return;

    let totalScore = 0;
    let totalMarks = 0;

    allAnswers.forEach((answer: any) => {
      totalMarks += answer.question.marks;
      if (answer.awarded_marks !== null) {
        totalScore += answer.awarded_marks;
      } else if (answer.is_correct) {
        totalScore += answer.question.marks;
      }
    });

    const percentage = (totalScore / totalMarks) * 100;

    // Get passing marks
    const { data: attemptData } = await supabase
      .from("exam_attempts")
      .select("exam_id")
      .eq("id", attemptId)
      .single();

    if (!attemptData) return;

    const { data: exam } = await supabase
      .from("exams")
      .select("passing_marks")
      .eq("id", attemptData.exam_id)
      .single();

    const passed = exam ? totalScore >= exam.passing_marks : false;

    // Update attempt
    await supabase
      .from("exam_attempts")
      .update({
        score: totalScore,
        total_marks: totalMarks,
        percentage,
        passed,
        grading_completed: true,
      })
      .eq("id", attemptId);

    toast.success("Grades submitted successfully!");
    navigate("/dashboard");
  };

  if (!attempt) {
    return <div className="min-h-screen bg-background p-8">Loading...</div>;
  }

  const allGraded = attempt.answers.every(answer => grades[answer.id] !== undefined);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Grade Exam: {examTitle}</h1>
            <p className="text-muted-foreground">
              Student: {attempt.profile.full_name} ({attempt.profile.email})
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {attempt.answers.map((answer, index) => (
            <Card key={answer.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Question {index + 1} (Max: {answer.question.marks} marks)
                  </CardTitle>
                  {answer.is_graded && (
                    <Badge variant="default">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Graded
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="font-semibold">Question:</Label>
                  <p className="text-foreground mt-1">{answer.question.question_text}</p>
                </div>

                <div>
                  <Label className="font-semibold">Student's Answer:</Label>
                  <div className="mt-2 p-4 bg-muted rounded-md">
                    <p className="whitespace-pre-wrap text-foreground">
                      {answer.text_answer || "(No answer provided)"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor={`grade-${answer.id}`}>Award Marks:</Label>
                    <Input
                      id={`grade-${answer.id}`}
                      type="number"
                      min="0"
                      max={answer.question.marks}
                      value={grades[answer.id] ?? ''}
                      onChange={(e) => handleGradeChange(answer.id, e.target.value)}
                      placeholder={`0 - ${answer.question.marks}`}
                      className="mt-1"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground pt-6">
                    out of {answer.question.marks}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Graded: {Object.keys(grades).length} / {attempt.answers.length}
              </p>
              <Button 
                onClick={handleSubmitGrades} 
                size="lg"
                disabled={!allGraded}
              >
                Submit Grades
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GradeExam;
