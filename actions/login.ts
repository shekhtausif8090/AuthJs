"use server";

import * as z from "zod";
import { AuthError } from "next-auth";

import { prisma } from "@/lib/db";
import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { error } from "console";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
// import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
// import { sendVerificationEmail, sendTwoFactorTokenEmail } from "@/lib/mail";
// import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
// import {
//   generateVerificationToken,
//   generateTwoFactorToken,
// } from "@/lib/tokens";
// import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";

export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null
) => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }
  const { email, password, code } = validatedFields.data;
  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return {
      error: "Email does not exist!",
    };
  }
  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(
      existingUser.email
    );
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );

    return {
      success: "Confirmation email sent!",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    throw error;
  }
};
