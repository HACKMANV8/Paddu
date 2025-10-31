"use client";
import React from "react";
import OnboardingFlow from "../../components/OnboardingFlow";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  function handleComplete(formData) {
    console.log("Onboarding complete:", formData);

    // 👇 Navigate to the chat page
    router.push("/chat");
  }

  return <OnboardingFlow onComplete={handleComplete} />;
}
