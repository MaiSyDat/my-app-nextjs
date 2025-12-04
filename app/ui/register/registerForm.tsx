"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Icon Component helper
interface IconProps {
  src: string;
  className?: string;
  size?: number;
}

const Icon = ({ src, className = "w-6 h-6", size = 24 }: IconProps) => {
  return (
    <Image
      src={`/icon/${src}`}
      alt="icon"
      width={size}
      height={size}
      className={className}
      unoptimized
    />
  );
};

// Component form đăng ký với validation và visual feedback
export default function RegisterForm() {
  // State quản lý form data và UI
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  // Xử lý submit form với validation đầy đủ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation các trường bắt buộc
    if (!username || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    // Validation độ dài username
    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      setLoading(false);
      return;
    }

    // Validation định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format.");
      setLoading(false);
      return;
    }

    // Validation độ dài password
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    // Validation password match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Gửi request đăng ký đến API
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      if (res.ok) {
        // Reset form và chuyển hướng đến trang login
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setError("");
        router.push("/login");
      } else {
        const data = await res.json();
        setError(data.message || "Registration failed.");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.log("Error during registration: ", error);
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
        Register
      </h2>

      <p
        style={{ animation: "appear 3s ease-out" }}
        className="text-center text-gray-200"
      >
        Create your account
      </p>

      {/* Form với các input fields */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input username với icon và floating label */}
        <div className="relative group">
          <div className="absolute left-0 top-2.5 text-gray-400 group-focus-within:text-purple-400 transition-colors">
            <Icon src="user.svg" className="h-5 w-5" size={20} />
          </div>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="off"
            required
            className="peer h-10 w-full pl-8 border-b-2 border-gray-300 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-purple-500 transition-colors"
          />
          <label
            htmlFor="username"
            className="absolute left-8 -top-3.5 text-gray-500 text-sm transition-all
                      peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2
                      peer-focus:-top-3.5 peer-focus:text-purple-500 peer-focus:text-sm"
          >
            Username
          </label>
        </div>

        {/* Input email với icon và floating label */}
        <div className="relative group">
          <div className="absolute left-0 top-2.5 text-gray-400 group-focus-within:text-purple-400 transition-colors">
            <Icon src="email.svg" className="h-5 w-5" size={20} />
          </div>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            autoComplete="off"
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

        {/* Input confirm password với visual feedback khi match/không match */}
        <div className="relative group">
          <div className="absolute left-0 top-2.5 text-gray-400 group-focus-within:text-purple-400 transition-colors">
            <Icon src="lock.svg" className="h-5 w-5" size={20} />
          </div>
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            autoComplete="off"
            required
            className={`peer h-10 w-full pl-8 pr-10 border-b-2 text-white bg-transparent placeholder-transparent focus:outline-none transition-colors ${
              confirmPassword && password
                ? password === confirmPassword
                  ? "border-green-400 focus:border-green-400"
                  : "border-red-400 focus:border-red-400"
                : "border-gray-300 focus:border-purple-500"
            }`}
          />
          <label
            htmlFor="confirmPassword"
            className="absolute left-8 -top-3.5 text-gray-500 text-sm transition-all
                      peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2
                      peer-focus:-top-3.5 peer-focus:text-purple-500 peer-focus:text-sm"
          >
            Confirm Password
          </label>
          {/* Icon indicator hiển thị password match status */}
          {confirmPassword && password && (
            <div className="absolute right-10 top-2.5">
              {password === confirmPassword ? (
                <Icon src="check.svg" className="h-5 w-5 text-green-400" size={20} />
              ) : (
                <Icon src="x.svg" className="h-5 w-5 text-red-400" size={20} />
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-0 top-2.5 text-gray-400 hover:text-purple-400 transition-colors focus:outline-none"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? (
              <Icon src="eye.svg" className="h-5 w-5" size={20} />
            ) : (
              <Icon src="eye-off.svg" className="h-5 w-5" size={20} />
            )}
          </button>
        </div>

        {/* Error message display */}
        {error && (
          <div className="text-red-400 text-sm text-center font-bold bg-red-900/20 py-2 rounded">
            {error}
          </div>
        )}

        {/* Submit button với loading state */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-purple-500 hover:bg-purple-700 active:bg-purple-800 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg shadow-lg text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
        >
          {loading ? "Registering..." : "Sign Up"}
        </button>
      </form>

      {/* Footer với link đến trang login */}
      <div className="text-center text-gray-300">
        Already have an account?
        <Link href={"/login"} className="text-purple-300 hover:underline ml-1">
          Sign In
        </Link>
      </div>
    </div>
  );
}
