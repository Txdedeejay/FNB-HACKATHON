import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const applicationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(10, "Phone must be at least 10 characters").max(20, "Phone must be less than 20 characters"),
  position: z.string().trim().min(2, "Position is required").max(100, "Position must be less than 100 characters"),
  experience: z.coerce.number().min(0, "Experience must be 0 or more").max(50, "Experience must be less than 50 years"),
  skills: z.string().trim().min(2, "Skills are required").max(500, "Skills must be less than 500 characters"),
  education: z.string().trim().min(2, "Education is required").max(200, "Education must be less than 200 characters"),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const API_BASE_URL = "http://localhost:5000/api";

export const ApplicationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  });

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        skills: data.skills.split(",").map((s) => s.trim()),
      };

      const response = await fetch(`${API_BASE_URL}/applicants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Application Submitted!",
          description: `Your anonymous ID: ${result.anonymousId}. Save this to check your application status.`,
          duration: 10000,
        });
        reset();
      } else {
        throw new Error(result.error || "Submission failed");
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-[var(--shadow-card)] border-border transition-[var(--transition-smooth)] hover:shadow-[var(--shadow-elegant)]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-[var(--gradient-primary)] bg-clip-text text-transparent">
          Submit Your Application
        </CardTitle>
        <CardDescription>
          Your personal information will remain anonymous during the initial review process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register("name")}
                className="transition-[var(--transition-smooth)]"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register("email")}
                className="transition-[var(--transition-smooth)]"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 234 567 8900"
                {...register("phone")}
                className="transition-[var(--transition-smooth)]"
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position Applied For</Label>
              <Input
                id="position"
                placeholder="Software Engineer"
                {...register("position")}
                className="transition-[var(--transition-smooth)]"
              />
              {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                placeholder="5"
                {...register("experience")}
                className="transition-[var(--transition-smooth)]"
              />
              {errors.experience && <p className="text-sm text-destructive">{errors.experience.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Education</Label>
              <Input
                id="education"
                placeholder="Bachelor's in Computer Science"
                {...register("education")}
                className="transition-[var(--transition-smooth)]"
              />
              {errors.education && <p className="text-sm text-destructive">{errors.education.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Input
              id="skills"
              placeholder="JavaScript, React, Node.js, TypeScript"
              {...register("skills")}
              className="transition-[var(--transition-smooth)]"
            />
            {errors.skills && <p className="text-sm text-destructive">{errors.skills.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[var(--gradient-primary)] hover:opacity-90 transition-[var(--transition-smooth)]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
