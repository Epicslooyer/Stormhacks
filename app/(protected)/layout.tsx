import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // Create a Convex HTTP client (server-side)
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const verification = await convex.query(api.authHelpers.getUserVerificationStatus, {});

  if (verification && !verification.emailVerified) {
    redirect("/verify-email");
  }

  return <>{children}</>;
}
