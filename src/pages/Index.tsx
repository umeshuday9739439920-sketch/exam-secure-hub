import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Shield, Clock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-6">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Online Examination Portal
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A secure and efficient platform for conducting online examinations with
            comprehensive anti-cheating measures
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">For Students</h3>
            <p className="text-muted-foreground">
              Take exams seamlessly with an intuitive interface. View your results
              and track your progress.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Anti-Cheating</h3>
            <p className="text-muted-foreground">
              Full-screen mode, tab switching detection, and time limits ensure
              exam integrity.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">For Teachers</h3>
            <p className="text-muted-foreground">
              Create and manage exams, add questions, and evaluate student
              performance with ease.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
