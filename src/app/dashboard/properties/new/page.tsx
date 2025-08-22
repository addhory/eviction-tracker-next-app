import { PropertyForm } from "@/components/forms/property-form";

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Property</h1>
        <p className="text-muted-foreground">
          Add a new rental property to your portfolio
        </p>
      </div>

      <PropertyForm />
    </div>
  );
}
