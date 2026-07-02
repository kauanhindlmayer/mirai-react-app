import { Link } from "react-router-dom"

export default function DashboardPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-12">
      <section className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Signed in
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Welcome to Mirai</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This is a placeholder route to confirm routing is wired up.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Back to login
        </Link>
      </section>
    </main>
  )
}
