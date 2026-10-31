import { Link } from "@tanstack/react-router";

export function ForgotPassword({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <div className="mt-5 text-sm">
      <Link
        to={isAdmin ? "/admin/forgot-password" : "/forgot-password"}
        className="font-semibold text-primary underline underline-offset-4 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Forgot password?
      </Link>
    </div>
  );
}
