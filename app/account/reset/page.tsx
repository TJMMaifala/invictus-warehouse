import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata: Metadata = { title: "New password", robots: { index: false } };
export default function Page() { return <AuthForm mode="reset" enabled />; }
