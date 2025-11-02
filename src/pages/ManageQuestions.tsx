import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { questionSchema } from "@/lib/validations";

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

const ManageQuestions = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examTitle, setExamTitle] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadExam();
    loadQuestions();
  }, []);

  const loadExam = async () => {
    const { data } = await supabase
      .from("exams")
      .select("title")
      .eq("id", examId)
      .single();

    if (data) setExamTitle(data.title);
  };

  const loadQuestions = async () => {
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", examId)
      .order("created_at", { ascending: true });

    if (data) setQuestions(data);
  };

  const handleAddQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Validate input
    const rawData = {
      question_text: formData.get("question") as string,
      option_a: formData.get("option_a") as string,
      option_b: formData.get("option_b") as string,
      option_c: formData.get("option_c") as string,
      option_d: formData.get("option_d") as string,
      correct_answer: formData.get("correct_answer") as "A" | "B" | "C" | "D",
      marks: parseInt(formData.get("marks") as string),
    };

    const validation = questionSchema.safeParse(rawData);
    
    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(", ");
      toast.error(errors);
      return;
    }

    const { error } = await supabase.from("questions").insert({
      exam_id: examId,
      question_text: validation.data.question_text,
      option_a: validation.data.option_a,
      option_b: validation.data.option_b,
      option_c: validation.data.option_c,
      option_d: validation.data.option_d,
      correct_answer: validation.data.correct_answer,
      marks: validation.data.marks,
    });

    if (error) {
      toast.error("Failed to add question");
    } else {
      toast.success("Question added successfully");
      setShowAddForm(false);
      loadQuestions();
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (error) {
      toast.error("Failed to delete question");
    } else {
      toast.success("Question deleted");
      loadQuestions();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{examTitle} - Manage Questions</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Questions ({questions.length})</CardTitle>
              <Button onClick={() => setShowAddForm(!showAddForm)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          {showAddForm && (
            <CardContent>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    name="question"
                    required
                    placeholder="Enter your question"
                    rows={3}
                    maxLength={1000}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="option_a">Option A</Label>
                    <Input id="option_a" name="option_a" required maxLength={500} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="option_b">Option B</Label>
                    <Input id="option_b" name="option_b" required maxLength={500} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="option_c">Option C</Label>
                    <Input id="option_c" name="option_c" required maxLength={500} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="option_d">Option D</Label>
                    <Input id="option_d" name="option_d" required maxLength={500} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="correct_answer">Correct Answer</Label>
                    <Select name="correct_answer" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marks">Marks</Label>
                    <Input
                      id="marks"
                      name="marks"
                      type="number"
                      required
                      min="1"
                      max="100"
                      defaultValue="1"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Question</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">
                      Question {index + 1} ({question.marks} {question.marks === 1 ? "mark" : "marks"})
                    </h3>
                    <p className="text-foreground mb-3">{question.question_text}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className={question.correct_answer === "A" ? "text-accent font-semibold" : ""}>
                        A. {question.option_a}
                      </div>
                      <div className={question.correct_answer === "B" ? "text-accent font-semibold" : ""}>
                        B. {question.option_b}
                      </div>
                      <div className={question.correct_answer === "C" ? "text-accent font-semibold" : ""}>
                        C. {question.option_c}
                      </div>
                      <div className={question.correct_answer === "D" ? "text-accent font-semibold" : ""}>
                        D. {question.option_d}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteQuestion(question.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageQuestions;