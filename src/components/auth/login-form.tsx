"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/utils/password-input";
import { signInFormSchema } from "@/types/auth/sign-in";
import type { SignInFormData } from "@/types/auth/sign-in";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: SignInFormData) {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);
      toast({
        title: "Éxito",
        description: "Has iniciado sesión correctamente.",
      });
      router.push("/dashboard");
    } catch {
      toast({
        title: "Error",
        description: "Correo electrónico o contraseña inválidos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col space-y-2 text-left">
        <h1 className="text-2xl font-semibold tracking-tight">
          Iniciar Sesión
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresa tu correo electrónico y contraseña <br />
          para acceder a tu cuenta.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input placeholder="nombre@ejemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <div className="flex items-center justify-between">
                  <FormLabel>Contraseña</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-muted-foreground hover:opacity-75"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </form>
      </Form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Al hacer clic en iniciar sesión, aceptas nuestros{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 hover:text-primary"
        >
          Términos de Servicio
        </Link>{" "}
        y{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 hover:text-primary"
        >
          Política de Privacidad
        </Link>
        .
      </p>
    </Card>
  );
}
