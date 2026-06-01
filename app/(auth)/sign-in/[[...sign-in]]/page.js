"use client";

import { SignIn } from "@clerk/nextjs";
import DemoLoginButton from "@/components/demo-login-button";

const SignInPage = () => {
  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-md">
      <SignIn />

      {/* Divider */}
      <div className="flex items-center gap-3 w-full max-w-[380px] px-2">
        <div className="flex-1 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
        <span className="text-xs text-white/30 font-medium uppercase tracking-widest">
          or
        </span>
        <div className="flex-1 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <DemoLoginButton />
    </div>
  );
};

export default SignInPage;
