export function ForgotPassword({ isAdmin = false }: { isAdmin?: boolean }) {
  const recoveryPath = isAdmin
    ? `${import.meta.env.BASE_URL}admin/forgot-password`
    : `${import.meta.env.BASE_URL}forgot-password`;

  return (
    <div className="mt-5 text-sm">
      <a
        href={recoveryPath}
        className="font-semibold text-primary underline underline-offset-4 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Forgot password?
      </a>
    </div>
  );
}
