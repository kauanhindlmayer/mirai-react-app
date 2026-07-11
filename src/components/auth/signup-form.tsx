import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"
import { CheckIcon, CircleIcon } from "lucide-react"
import { z } from "zod"

import { registerUser } from "@/api/users"
import type { RegisterRequest } from "@/types/users"
import { getGitHubSignInUrl } from "@/lib/github-oauth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

const signupSchema = z
  .object({
    confirmPassword: z.string().min(1, "Please confirm your password."),
    email: z.email("Enter a valid email address."),
    firstName: z
      .string()
      .min(1, "First name is required.")
      .max(50, "First name must be less than 50 characters.")
      .regex(
        /^[\p{L}\p{M}\s'-]+$/u,
        "First name can only contain letters, spaces, hyphens, and apostrophes."
      ),
    lastName: z
      .string()
      .min(1, "Last name is required.")
      .max(100, "Last name must be less than 100 characters.")
      .regex(
        /^[\p{L}\p{M}\s'-]+$/u,
        "Last name can only contain letters, spaces, hyphens, and apostrophes."
      ),
    hasAcceptedTerms: z.boolean().refine((value) => value, {
      message: "Please accept the terms and conditions.",
    }),
    password: z
      .string()
      .min(8, "Must be at least 8 characters long.")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Must contain at least one lowercase letter.")
      .regex(/[0-9]/, "Must contain at least one number."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

type SignupFormValues = RegisterRequest & {
  confirmPassword: string
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate()
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const form = useForm<SignupFormValues>({
    defaultValues: {
      confirmPassword: "",
      email: "",
      firstName: "",
      lastName: "",
      hasAcceptedTerms: false,
      password: "",
    },
    resolver: zodResolver(signupSchema),
  })

  const signupMutation = useMutation({
    mutationFn: registerUser,
    onError: (error) => {
      toast.error("Sign up failed.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
    onSuccess: () => {
      toast.success("Account created successfully. Please log in.")
      navigate("/login")
    },
  })

  const password = form.watch("password")
  const passwordRules = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
  ]

  async function handleSubmit(values: SignupFormValues) {
    const { email, firstName, lastName, password, hasAcceptedTerms } = values

    try {
      await signupMutation.mutateAsync({
        email,
        firstName,
        lastName,
        password,
        hasAcceptedTerms,
      })
    } catch {
      // handled by signupMutation's onError
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={form.handleSubmit(handleSubmit)}
      noValidate
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Fill in the form below to create your account
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="first-name">First Name</FieldLabel>
            <Input
              id="first-name"
              type="text"
              placeholder="John"
              className="bg-background"
              aria-invalid={!!form.formState.errors.firstName}
              {...form.register("firstName")}
            />
            <FieldError errors={[form.formState.errors.firstName]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
            <Input
              id="last-name"
              type="text"
              placeholder="Doe"
              className="bg-background"
              aria-invalid={!!form.formState.errors.lastName}
              {...form.register("lastName")}
            />
            <FieldError errors={[form.formState.errors.lastName]} />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            className="bg-background"
            aria-invalid={!!form.formState.errors.email}
            {...form.register("email")}
          />
          <FieldError errors={[form.formState.errors.email]} />
          <FieldDescription>
            We&apos;ll use this to contact you. We will not share your email
            with anyone else.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            className="bg-background"
            aria-invalid={!!form.formState.errors.password}
            {...form.register("password")}
            onFocus={() => setIsPasswordFocused(true)}
            onBlur={(event) => {
              form.register("password").onBlur(event)
              setIsPasswordFocused(false)
            }}
          />
          <FieldError errors={[form.formState.errors.password]} />
          {isPasswordFocused || password ? (
            <ul className="flex flex-col gap-0.5">
              {passwordRules.map((rule) => (
                <li
                  key={rule.label}
                  className={cn(
                    "flex items-center gap-1.5 text-xs/relaxed",
                    rule.met
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  )}
                >
                  {rule.met ? (
                    <CheckIcon className="size-3" />
                  ) : (
                    <CircleIcon className="size-3" />
                  )}
                  {rule.label}
                </li>
              ))}
            </ul>
          ) : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            className="bg-background"
            aria-invalid={!!form.formState.errors.confirmPassword}
            {...form.register("confirmPassword")}
          />
          <FieldError errors={[form.formState.errors.confirmPassword]} />
        </Field>
        <Field orientation="horizontal">
          <Controller
            control={form.control}
            name="hasAcceptedTerms"
            render={({ field }) => (
              <Checkbox
                id="accept-terms"
                checked={field.value}
                aria-invalid={!!form.formState.errors.hasAcceptedTerms}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
          />
          <FieldLabel htmlFor="accept-terms" className="font-normal">
            I have read the Terms and Conditions
          </FieldLabel>
          <FieldError errors={[form.formState.errors.hasAcceptedTerms]} />
        </Field>
        <Field>
          <Button type="submit" disabled={signupMutation.isPending}>
            {signupMutation.isPending ? (
              <Spinner data-icon="inline-end" />
            ) : null}
            Create Account
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              window.location.href = getGitHubSignInUrl()
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                fill="currentColor"
              />
            </svg>
            Sign up with GitHub
          </Button>
          <FieldDescription className="px-6 text-center">
            Already have an account? <Link to="/login">Sign in</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
