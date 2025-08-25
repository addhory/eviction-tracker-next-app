import { LoginForm } from "@/components/forms/login-form";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-svh grid grid-cols-1 md:grid-cols-5 bg-gray-50">
      <div className="w-full flex flex-col my-auto space-y-8 col-span-2">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Eviction Tracker
          </h1>
          <p className="text-gray-600">Eviction Management System</p>
        </div>
        <LoginForm />
      </div>
      <div className="relative col-span-3">
        <Image
          src="https://images.unsplash.com/photo-1524813686514-a57563d77965?q=80&w=3132&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Eviction"
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
}
