import { ApplicationForm } from "@/components/ApplicationForm";
import { ApplicationList } from "@/components/ApplicationList";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-[var(--gradient-primary)] bg-clip-text text-transparent">
                FairHire
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Anonymous hiring for unbiased recruitment
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-secondary animate-pulse" />
              <span className="text-sm text-muted-foreground">Fair & Anonymous</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-16">
        <section className="space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold">Apply with Confidence</h2>
            <p className="text-muted-foreground text-lg">
              Your identity stays hidden during the initial review. We evaluate skills and
              experience, not names or backgrounds.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <ApplicationForm />
          </div>
        </section>

        <Separator className="max-w-4xl mx-auto" />

        <section>
          <ApplicationList />
        </section>
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 FairHire. Building a more equitable hiring process.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
