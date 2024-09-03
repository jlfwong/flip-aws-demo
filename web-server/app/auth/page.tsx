import { login } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect_to?: string };
}) {
  const redirectTo = searchParams.redirect_to
    ? decodeURIComponent(searchParams.redirect_to)
    : "";

  return (
    <form>
      <label htmlFor="email">Email:</label>
      <input id="email" name="email" type="email" required />
      <input type="hidden" name="redirect_to" value={redirectTo} />
      <button formAction={login}>Log in</button>
    </form>
  );
}
