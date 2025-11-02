import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { examSchema } from "@/lib/validations";

interface CreateExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateExamDialog = ({ open, onOpenChange, onSuccess }: CreateExamDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("You must be logged in");
      setIsLoading(false);
      return;
    }

    // Validate input
    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string || "",
      duration: parseInt(formData.get("duration") as string),
      total_marks: parseInt(formData.get("total_marks") as string),
      passing_marks: parseInt(formData.get("passing_marks") as string),
    };

    const validation = examSchema.safeParse(rawData);
    
    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(", ");
      toast.error(errors);
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.from("exams").insert({
      title: validation.data.title,
      description: validation.data.description,
      duration_minutes: validation.data.duration,
      total_marks: validation.data.total_marks,
      passing_marks: validation.data.passing_marks,
      created_by: user.id,
    });

    setIsLoading(false);

    if (error) {
      toast.error("Failed to create exam");
    } else {
      toast.success("Exam created successfully");
      onOpenChange(false);
      onSuccess();
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Exam</DialogTitle>
          <DialogDescription>Add details for your new examination</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Exam Title</Label>
            <Input id="title" name="title" required placeholder="e.g., Mathematics Final Exam" maxLength={200} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief description of the exam"
              rows={3}
              maxLength={1000}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (mins)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                required
                min="1"
                max="300"
                placeholder="60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_marks">Total Marks</Label>
              <Input
                id="total_marks"
                name="total_marks"
                type="number"
                required
                min="1"
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passing_marks">Passing Marks</Label>
              <Input
                id="passing_marks"
                name="passing_marks"
                type="number"
                required
                min="1"
                placeholder="40"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Exam"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExamDialog;