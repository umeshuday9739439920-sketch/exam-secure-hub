import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ExamPage from "./pages/ExamPage";
import ManageQuestions from "./pages/ManageQuestions";
import ExamResults from "./pages/ExamResults";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentsManagement from "./pages/admin/StudentsManagement";
import ExamsManagement from "./pages/admin/ExamsManagement";
import Analytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/AdminSettings";
import GradeExam from "./pages/admin/GradeExam";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/exam/:examId" element={<ExamPage />} />
          
          {/* Admin routes with layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<StudentsManagement />} />
            <Route path="exams" element={<ExamsManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="exam/:examId" element={<ManageQuestions />} />
            <Route path="results/:examId" element={<ExamResults />} />
            <Route path="grade/:attemptId" element={<GradeExam />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
