import { createFileRoute } from "@tanstack/react-router";
import { PasswordRecoveryPage } from "@/components/PasswordRecoveryPage";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — RSS Sales Manager" }] }),
  component: () => <PasswordRecoveryPage />,
});
