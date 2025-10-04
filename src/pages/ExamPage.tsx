import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
}

const ExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [duration, setDuration] = useState(0);
  const [examTitle, setExamTitle] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);

  useEffect(() => {
    loadExam();
    requestFullScreen();
    
    // Detect tab switches
    const handleVisibilityChange = () => {
      if (document.hidden && attemptId) {
        const newCount = tabSwitches + 1;
        setTabSwitches(newCount);
        toast.warning(`Warning: Tab switch detected (${newCount})`);
        
        // Update attempt with tab switch count
        supabase
          .from("exam_attempts")
          .update({ tab_switches: newCount })
          .eq("id", attemptId)
          .then();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [attemptId, tabSwitches]);

  useEffect(() => {
    if (timeLeft <= 0 && attemptId) {
      submitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, attemptId]);

  const requestFullScreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } catch (err) {
      toast.error("Please enable fullscreen mode for the exam");
    }
  };

  const loadExam = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Load exam details
    const { data: exam } = await supabase
      .from("exams")
      .select("*")
      .eq("id", examId)
      .single();

    if (!exam) {
      toast.error("Exam not found");
      navigate("/dashboard");
      return;
    }

    setExamTitle(exam.title);
    setDuration(exam.duration_minutes * 60);
    setTimeLeft(exam.duration_minutes * 60);

    // Load questions
    const { data: questionsData } = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", examId);

    if (questionsData) {
      setQuestions(questionsData);
    }

    // Create attempt
    const { data: attempt, error } = await supabase
      .from("exam_attempts")
      .insert({
        exam_id: examId,
        student_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error("You have already attempted this exam");
      navigate("/dashboard");
      return;
    }

    if (attempt) {
      setAttemptId(attempt.id);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const submitExam = useCallback(async () => {
    if (!attemptId) return;

    let score = 0;
    const answerInserts = questions.map(q => {
      const selectedAnswer = answers[q.id];
      const isCorrect = selectedAnswer === q.correct_answer;
      if (isCorrect) score += q.marks;

      return {
        attempt_id: attemptId,
        question_id: q.id,
        selected_answer: selectedAnswer || null,
        is_correct: isCorrect,
      };
    });

    // Insert all answers
    await supabase.from("answers").insert(answerInserts);

    // Calculate total marks
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    const percentage = (score / totalMarks) * 100;

    // Get passing marks
    const { data: exam } = await supabase
      .from("exams")
      .select("passing_marks")
      .eq("id", examId)
      .single();

    const passed = exam ? score >= exam.passing_marks : false;

    // Update attempt
    await supabase
      .from("exam_attempts")
      .update({
        submitted_at: new Date().toISOString(),
        score,
        total_marks: totalMarks,
        percentage,
        passed,
      })
      .eq("id", attemptId);

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    toast.success("Exam submitted successfully!");
    navigate("/dashboard");
  }, [attemptId, answers, questions, examId, navigate]);

  const progress = ((duration - timeLeft) / duration) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {tabSwitches > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Warning: {tabSwitches} tab switch(es) detected. Multiple switches may affect your result.
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{examTitle}</CardTitle>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="w-5 h-5" />
                <span className={timeLeft < 60 ? "text-destructive" : ""}>
                  {minutes}:{seconds.toString().padStart(2, "0")}
                </span>
              </div>
            </div>
            <Progress value={progress} className="mt-2" />
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  Question {index + 1} ({question.marks} {question.marks === 1 ? "mark" : "marks"})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-foreground">{question.question_text}</p>
                <RadioGroup
                  value={answers[question.id]}
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="A" id={`${question.id}-a`} />
                    <Label htmlFor={`${question.id}-a`} className="cursor-pointer">
                      A. {question.option_a}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="B" id={`${question.id}-b`} />
                    <Label htmlFor={`${question.id}-b`} className="cursor-pointer">
                      B. {question.option_b}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="C" id={`${question.id}-c`} />
                    <Label htmlFor={`${question.id}-c`} className="cursor-pointer">
                      C. {question.option_c}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="D" id={`${question.id}-d`} />
                    <Label htmlFor={`${question.id}-d`} className="cursor-pointer">
                      D. {question.option_d}
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Answered: {Object.keys(answers).length} / {questions.length}
              </p>
              <Button onClick={submitExam} size="lg">
                Submit Exam
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExamPage;