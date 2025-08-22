import { LegalCaseForm } from "@/components/forms/legal-case-form";

export default function NewLegalCasePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Legal Case</h1>
        <p className="text-muted-foreground">
          Start a new eviction case for one of your properties
        </p>
      </div>

      <LegalCaseForm />
    </div>
  );
}
