import { Profile } from "@/types";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();
    profile = profileData;
  }

  // Define protected and public routes
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/contractor");

  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");

  // Redirect to login if not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Role-based redirections for authenticated users
  if (
    user &&
    isPublicRoute &&
    request.nextUrl.pathname !== "/" &&
    profile?.role === "landlord"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    isPublicRoute &&
    request.nextUrl.pathname !== "/" &&
    profile?.role === "contractor"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/contractor/dashboard";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    isPublicRoute &&
    request.nextUrl.pathname === "/" &&
    profile?.role === "admin"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    isPublicRoute &&
    request.nextUrl.pathname === "/" &&
    profile?.role === "contractor"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/contractor/dashboard";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    switch (profile?.role) {
      case "landlord":
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      case "admin":
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      case "contractor":
        url.pathname = "/contractor/dashboard";
        return NextResponse.redirect(url);
      default:
        // If no role is set or profile is null, allow access to login page
        // This prevents infinite redirect loops
        break;
    }
  }

  // Protect contractor routes - only contractors can access
  if (
    user &&
    request.nextUrl.pathname.startsWith("/contractor") &&
    profile?.role !== "contractor"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Protect admin routes - only admins can access
  if (
    user &&
    request.nextUrl.pathname.startsWith("/admin") &&
    profile?.role !== "admin"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Protect landlord dashboard - only landlords can access
  if (
    user &&
    request.nextUrl.pathname.startsWith("/dashboard") &&
    profile?.role !== "landlord"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
