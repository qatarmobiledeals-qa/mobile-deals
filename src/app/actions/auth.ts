"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  signAdminPayload,
  verifyAdminToken,
  ADMIN_COOKIE_NAME,
} from "@/lib/auth/admin-session";

export async function adminLoginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Please enter both email and password." };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  try {
    const supabase = createAdminClient();

    // 1. Authenticate strictly against Supabase Auth (Users created in Supabase Dashboard -> Authentication -> Users)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (authError || !authData.session) {
      return {
        success: false,
        error: authError?.message || "Invalid admin credentials. Please check your email and password.",
      };
    }

    const signedToken = signAdminPayload({
      email: authData.user?.email || cleanEmail,
      id: authData.user?.id || "admin",
      role: "admin",
      loggedAt: new Date().toISOString(),
    });

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Authentication error." };
  }
}

export async function adminLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}

export async function getAdminSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    return verifyAdminToken(sessionCookie.value);
  } catch {
    return null;
  }
}
