import { createFileRoute } from "@tanstack/react-router";
import { PasswordRecoveryPage } from "@/components/PasswordRecoveryPage";

export const Route = createFileRoute("/admin/forgot-password")({
  head: () => ({ meta: [{ title: "Admin password recovery — RSS Sales Manager" }] }),
  component: () => <PasswordRecoveryPage isAdmin />,
});
