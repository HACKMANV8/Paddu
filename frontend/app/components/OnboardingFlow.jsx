"use client";
import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * OnboardingFlow.jsx (Next.js local copy)
 */
export default function OnboardingFlow({ onComplete }) {
	const [stepIndex, setStepIndex] = useState(0);
	const [formData, setFormData] = useState({
		learningPreference: ['Videos', 'Documents', 'Conversations with the AI'],
		preferredHours: '',
		reminderFrequency: '',
		factsNotifications: '', // Yes | No
	});

	const steps = useMemo(() => ([
		{
			key: 'learningPreference',
			label: 'How do you prefer to learn? Arrange by priority',
			render: (value, onChange) => {
				const items = Array.isArray(value) && value.length
					? value
					: ['Videos', 'Documents', 'Conversations with the AI'];
				function move(from, to) {
					if (to < 0 || to >= items.length) return;
					const next = [...items];
					const [m] = next.splice(from, 1);
					next.splice(to, 0, m);
					onChange(next);
				}
				return (
					<div className="space-y-3">
						{items.map((opt, idx) => (
							<div
								key={opt}
								className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
							>
								<div className="flex items-center gap-3">
									<div className="h-8 w-8 flex items-center justify-center rounded-md bg-white/10 text-white/80 text-sm">
										{idx + 1}
									</div>
									<span className="text-sm sm:text-base">{opt}</span>
								</div>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => move(idx, idx - 1)}
										disabled={idx === 0}
										className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40"
									>
										↑
									</button>
									<button
										type="button"
										onClick={() => move(idx, idx + 1)}
										disabled={idx === items.length - 1}
										className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40"
									>
										↓
									</button>
								</div>
							</div>
						))}
					</div>
				);
			},
		},
		{
			key: 'preferredHours',
			label: 'What are your preferred hours and time?',
			render: (value, onChange) => (
				<input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="e.g., evenings 6–7"
					className="w-full rounded-lg bg-white/5 focus:bg-white/10 text-white placeholder-white/40 border border-white/10 focus:border-violet-400/60 outline-none px-4 py-3 transition"
				/>
			),
		},
		{
			key: 'reminderFrequency',
			label: 'How often would you like to be reminded?',
			render: (value, onChange) => (
				<select
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="w-full rounded-lg bg-white/5 focus:bg-white/10 text-white border border-white/10 focus:border-violet-400/60 outline-none px-4 py-3 transition"
				>
					<option value="" className="bg-slate-900">Select one</option>
					<option value="Daily" className="bg-slate-900">Daily</option>
					<option value="3x/week" className="bg-slate-900">3 times a week</option>
					<option value="Weekly" className="bg-slate-900">Weekly</option>
					<option value="Never" className="bg-slate-900">Never</option>
				</select>
			),
		},
		{
			key: 'factsNotifications',
			label: 'Would you like facts notifications about your topic?',
			render: (value, onChange) => (
				<select
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="w-full rounded-lg bg-white/5 focus:bg-white/10 text-white border border-white/10 focus:border-fuchsia-400/60 outline-none px-4 py-3 transition"
				>
					<option value="" className="bg-slate-900">Select one</option>
					<option value="Yes" className="bg-slate-900">Yes</option>
					<option value="No" className="bg-slate-900">No</option>
				</select>
			),
		},
	]), []);

	const currentStep = steps[stepIndex];
	const totalSteps = steps.length;
	const currentValue = formData[currentStep.key] ?? '';

	function updateField(nextValue) {
		setFormData((prev) => ({ ...prev, [currentStep.key]: nextValue }));
	}

	function handleNext() {
		if (stepIndex < totalSteps - 1) {
			setStepIndex((i) => i + 1);
		} else {
			if (typeof onComplete === 'function') onComplete(formData);
		}
	}

	function handleBack() {
		if (stepIndex > 0) setStepIndex((i) => i - 1);
	}

	const canProceed = Array.isArray(currentValue)
		? currentValue.length > 0
		: String(currentValue).trim().length > 0;

	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-[#0a0014] to-[#1a0033] text-white flex items-center justify-center p-4 relative overflow-hidden">
			<div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-neutral-600/20 blur-3xl" />

			<div className="w-full max-w-lg">
				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={currentStep.key}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.4, ease: 'easeOut' }}
						className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_-10px_rgba(217,70,239,0.35)] ring-1 ring-fuchsia-500/10 p-6 sm:p-8"
					>
						<div className="mb-5 sm:mb-6">
							<h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
								{currentStep.label}
							</h2>
						</div>

						<div className="mb-6">
							{currentStep.render(currentValue, updateField)}
						</div>

						<div className="flex items-center justify-between gap-3">
							<button
								onClick={handleBack}
								disabled={stepIndex === 0}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-400/70 focus:ring-offset-white/0 disabled:opacity-40 disabled:cursor-not-allowed ${
									stepIndex === 0
										? 'bg-white/10 text-white/70 border border-white/10'
										: 'bg-black-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white border border-white/10 shadow-[0_0_20px_-6px_rgba(255,255,255,0.4)]'
								}`}
							>
								← Back
							</button>

							<button
								onClick={handleNext}
								disabled={!canProceed}
								className={`px-4 py-2 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-400/70 focus:ring-offset-white/0 disabled:opacity-40 disabled:cursor-not-allowed bg-linear-to-r from-violet-700 via-violet-600 to-indigo-600 hover:shadow-[0_0_24px_-4px_rgba(217,70,239,0.8)]`}
							>
								{stepIndex === totalSteps - 1 ? 'Finish →' : 'Next →'}
							</button>
						</div>
					</motion.div>
				</AnimatePresence>

				<div className="text-center mt-4 text-xs sm:text-sm text-white/60">
					Step {stepIndex + 1} of {totalSteps}
				</div>
			</div>
		</div>
	);
}


