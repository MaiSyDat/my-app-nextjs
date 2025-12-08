/**
 * Component Form đăng nhập
 * 
 * Component này:
 * - Input fields cho email và password
 * - Validation và error handling
 * - Gửi request đến /api/auth/login
 * - Lưu user info vào localStorage
 * - Redirect về /discord sau khi đăng nhập thành công
 * - Link đến trang đăng ký
 */

"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/app/ui/common/Icon";

// Component form đăng nhập với toggle password visibility
export default function LoginForm() {
  // State quản lý UI và form
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Xử lý submit form đăng nhập
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Lưu token vào localStorage
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        // Chuyển hướng đến trang Discord
        router.push("/discord");
      } else {
        const data = await res.json();
        setError(data.message || "Login failed.");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Container form với gradient background và animation
    <div
      style={{ animation: "slideInFromLeft 1s ease-out" }}
      className="max-w-md w-full bg-linear-to-r from-blue-800 to-purple-600 rounded-xl shadow-2xl overflow-hidden p-8 space-y-8"
    >
      {/* Nút back về trang chủ */}
      <Link
        href="/"
        className="inline-flex items-center text-white/80 hover:text-white transition-colors mb-4 group"
      >
        <Icon src="arrow-left.svg" className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" size={20} />
        <span className="text-sm font-medium">Back to home</span>
      </Link>

      {/* Header form */}
      <h2
        style={{ animation: "appear 2s ease-out" }}
        className="text-center text-4xl font-extrabold text-white"
      >
        Welcome
      </h2>

      <p
        style={{ animation: "appear 3s ease-out" }}
        className="text-center text-gray-200"
      >
        Sign in to your account
      </p>

      {/* Form đăng nhập */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input email với icon và floating label */}
        <div className="relative group">
          <div className="absolute left-0 top-2.5 text-gray-400 group-focus-within:text-purple-400 transition-colors">
            <Icon src="email.svg" className="h-5 w-5" size={20} />
          </div>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
            className="peer h-10 w-full pl-8 border-b-2 border-gray-300 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-purple-500 transition-colors"
          />
          <label
            htmlFor="email"
            className="absolute left-8 -top-3.5 text-gray-500 text-sm transition-all
                      peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2
                      peer-focus:-top-3.5 peer-focus:text-purple-500 peer-focus:text-sm"
          >
            Email address
          </label>
        </div>

        {/* Input password với toggle show/hide */}
        <div className="relative group">
          <div className="absolute left-0 top-2.5 text-gray-400 group-focus-within:text-purple-400 transition-colors">
            <Icon src="lock.svg" className="h-5 w-5" size={20} />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="off"
            required
            className="peer h-10 w-full pl-8 pr-10 border-b-2 border-gray-300 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-purple-500 transition-colors"
          />
          <label
            htmlFor="password"
            className="absolute left-8 -top-3.5 text-gray-500 text-sm transition-all
                      peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2
                      peer-focus:-top-3.5 peer-focus:text-purple-500 peer-focus:text-sm"
          >
            Password
          </label>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-2.5 text-gray-400 hover:text-purple-400 transition-colors focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <Icon src="eye.svg" className="h-5 w-5" size={20} />
            ) : (
              <Icon src="eye-off.svg" className="h-5 w-5" size={20} />
            )}
          </button>
        </div>

        {/* Checkbox Remember me và link Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center text-sm text-gray-200 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
              />
              {/* Custom checkbox với styling đẹp */}
              <div
                className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                  rememberMe
                    ? "bg-purple-500 border-purple-500 shadow-lg shadow-purple-500/50"
                    : "bg-transparent border-gray-400 group-hover:border-purple-400"
                }`}
              >
                {rememberMe && (
                  <Icon src="check.svg" className="w-3.5 h-3.5 text-white" size={14} />
                )}
              </div>
            </div>
            <span className="ml-3 select-none group-hover:text-purple-200 transition-colors">
              Remember me
            </span>
          </label>
          <a
            href="#"
            className="text-sm text-purple-200 hover:text-purple-100 hover:underline transition-colors"
          >
            Forgot your password?
          </a>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-red-400 text-sm text-center font-bold bg-red-900/20 py-2 rounded">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-purple-500 hover:bg-purple-700 active:bg-purple-800 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg shadow-lg text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Footer với link đến trang đăng ký */}
      <div className="text-center text-gray-300">
        Don&apos;t have an account?
        <Link
          href={"/register"}
          className="text-purple-300 hover:underline ml-1"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
