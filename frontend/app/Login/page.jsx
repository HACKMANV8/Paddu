"use client";
import { motion } from "framer-motion";
import { Bricolage_Grotesque } from "next/font/google";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700"],
});

export default function Login() {
  return (
    <div className= {`${bricolageGrotesque.className} min-h-screen flex items-center justify-center bg-black text-white`}>
      {/* Outer container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative bg-gray-900/60 backdrop-blur-lg rounded-2xl shadow-[0_0_40px_rgba(0,0,0)] p-10 w-[90%] max-w-md border border-white/10"
      >
        {/* Subtle glowing border effect */}
        <div className="absolute -inset-0.5 bg-linear-to-r from-violet-900 to-neutral-600 rounded-2xl opacity-0 blur-lg"></div>

        {/* Inner content */}
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-center mb-8 bg-linear-to-r from-violet-50 to-violet-100 bg-clip-text text-transparent">
            Login
          </h2>

          <form className="space-y-5">
            

            {/* Email / Phone */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Email or Phone
              </label>
              <input
                type="text"
                placeholder="Enter your email or phone"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-gray-100 placeholder-gray-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-gray-100 placeholder-gray-500"
              />
            </div>

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="relative w-full py-3 mt-4 font-semibold rounded-full overflow-hidden"
            >
              <div className="absolute inset-0 bg-violet-900"></div>
              <div className="absolute inset-0 bg-linear-to-r from-violet-600 to-cyan-800 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity"></div>
              <span className="relative z-10 text-white">Login</span>
            </motion.button>
          </form>

          {/* Sign-up link */}
          <p className="text-center text-sm text-gray-400 mt-6">
            Don’t have an account?{" "}
            <a
              href="/SignUp"
              className="text-violet-400 hover:text-fuchsia-300 transition-colors"
            >
              Sign up
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
