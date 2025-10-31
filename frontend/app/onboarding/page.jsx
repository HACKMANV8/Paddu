"use client";
import React from "react";
import OnboardingFlow from "../../components/OnboardingFlow";

export default function OnboardingPage() {
	function handleComplete(formData) {
		// Replace with navigation or API call after onboarding if needed
		console.log("Onboarding complete:", formData);
	}

	return <OnboardingFlow onComplete={handleComplete} />;
}


