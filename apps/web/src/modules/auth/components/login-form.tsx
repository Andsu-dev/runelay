import { SETUP_TOKEN_HEADER } from "@runeley/shared";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { type FormEvent, useState } from "react";
import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/action/button";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/lib/query-client";
import { toast } from "@/lib/toast";
import { meQuery } from "@/modules/auth/api/session.api";
import { LOGIN_COPY } from "@/modules/auth/constants/login.constants";

const FIELD_SURFACE = "h-11 bg-card shadow-xs ring-1 ring-border/70 hover:bg-card dark:bg-card dark:hover:bg-card";

interface LoginFormProps {
  mode: "signin" | "signup";
  setupToken?: string;
}

const EASE_OUT = [0.2, 0, 0, 1] as const;

export function LoginForm({ mode, setupToken }: LoginFormProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const copy = LOGIN_COPY[mode];

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setPending(true);
    const { error } =
      mode === "signup"
        ? await authClient.signUp.email(
            { name: String(form.get("name")), email, password },
            { headers: setupToken ? { [SETUP_TOKEN_HEADER]: setupToken } : {} },
          )
        : await authClient.signIn.email({ email, password });
    setPending(false);
    if (error) {
      toast(error.message ?? copy.fallbackError, "error");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: meQuery.queryKey });
    await router.invalidate();
    navigate({ to: "/overview" });
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className="flex w-full max-w-sm flex-col gap-6"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-xl bg-app-icon shadow-lg">
          <LogoMark className="size-8" entrance />
        </span>
        <div className="grid">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="flex flex-col gap-1 [grid-area:1/1]"
            >
              <h1 className="text-xl font-semibold tracking-[-0.02em]">{copy.title}</h1>
              <p className="text-[13px] text-muted-foreground">{copy.description}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col">
        <AnimatePresence initial={false}>
          {mode === "signup" && (
            <motion.div
              key="name"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="-m-1 overflow-hidden p-1"
            >
              <Field label="Nome" className="pb-3">
                <Input className={FIELD_SURFACE} name="name" required autoComplete="name" />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-col gap-3">
          <Field label="E-mail">
            <Input className={FIELD_SURFACE} name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label="Senha" hint={mode === "signup" ? "Pelo menos 8 caracteres." : undefined}>
            <Input
              className={FIELD_SURFACE}
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </Field>
        </div>
      </div>

      <Button type="submit" size="lg" loading={pending}>
        {copy.submit}
      </Button>

      <p className="text-center text-[13px] text-muted-foreground">
        {copy.switchPrompt}{" "}
        <Link
          to="/login"
          search={{ mode: mode === "signup" ? "signin" : "signup" }}
          replace
          className="font-medium text-foreground underline-offset-4 outline-none transition-colors duration-200 hover:underline focus-visible:underline"
        >
          {copy.switch}
        </Link>
      </p>
    </motion.form>
  );
}
