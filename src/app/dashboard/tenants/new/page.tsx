import { TenantForm } from "@/components/forms/tenant-form";

export default function NewTenantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Tenant</h1>
        <p className="text-muted-foreground">
          Add a new tenant to one of your properties
        </p>
      </div>

      <TenantForm />
    </div>
  );
}
