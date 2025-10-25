import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface Applicant {
  anonymousId: string;
  position: string;
  experience: number;
  skills: string[];
  education: string;
  submittedAt: string;
}

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
}

const API_BASE_URL = "http://localhost:5000/api";

export const ApplicationList = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedContacts, setRevealedContacts] = useState<Record<string, ContactInfo>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/applicants`);
      const data = await response.json();
      setApplicants(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const revealContactInfo = async (anonymousId: string) => {
    if (revealedContacts[anonymousId]) {
      // Hide contact info
      const { [anonymousId]: _, ...rest } = revealedContacts;
      setRevealedContacts(rest);
      return;
    }

    setRevealingId(anonymousId);
    try {
      const response = await fetch(`${API_BASE_URL}/applicants/${anonymousId}`);
      const data = await response.json();

      if (response.ok) {
        setRevealedContacts((prev) => ({
          ...prev,
          [anonymousId]: data,
        }));
        toast({
          title: "Contact Information Revealed",
          description: "You can now see the applicant's personal details",
        });
      } else {
        throw new Error(data.error || "Failed to reveal contact info");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reveal contact information",
        variant: "destructive",
      });
    } finally {
      setRevealingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-[var(--gradient-primary)] bg-clip-text text-transparent">
            Applications
          </h2>
          <p className="text-muted-foreground mt-1">
            Review anonymized applications. Click to reveal contact information.
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {applicants.length} Total
        </Badge>
      </div>

      {applicants.length === 0 ? (
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No applications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {applicants.map((applicant) => {
            const isRevealed = !!revealedContacts[applicant.anonymousId];
            const contactInfo = revealedContacts[applicant.anonymousId];

            return (
              <Card
                key={applicant.anonymousId}
                className="shadow-[var(--shadow-card)] transition-[var(--transition-smooth)] hover:shadow-[var(--shadow-elegant)] border-border"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{applicant.position}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        ID: {applicant.anonymousId}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-secondary/10">
                      {applicant.experience}y exp
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Education</p>
                    <p className="text-sm">{applicant.education}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {applicant.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {isRevealed && contactInfo && (
                    <div className="pt-4 border-t border-border space-y-2 animate-in fade-in duration-300">
                      <p className="text-sm font-medium text-accent">Contact Information:</p>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Name:</span> {contactInfo.name}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Email:</span> {contactInfo.email}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Phone:</span> {contactInfo.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    variant={isRevealed ? "outline" : "default"}
                    className="w-full transition-[var(--transition-smooth)]"
                    onClick={() => revealContactInfo(applicant.anonymousId)}
                    disabled={revealingId === applicant.anonymousId}
                  >
                    {revealingId === applicant.anonymousId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : isRevealed ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Hide Contact
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Reveal Contact
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Submitted {new Date(applicant.submittedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
