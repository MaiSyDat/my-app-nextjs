/**
 * Component Tab Account - Hiển thị thông tin tài khoản và form chỉnh sửa
 */

"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/app/ui/toast";

interface AccountTabProps {
  user: {
    username: string;
    email: string;
    id: string;
  } | null;
  onUserUpdate?: (updatedUser: any) => void;
}

export default function AccountTab({ user, onUserUpdate }: AccountTabProps) {
  const { showSuccess, showError } = useToast();

  // State để lưu thông tin user đầy đủ
  const [fullUser, setFullUser] = useState<{
    id: string;
    username: string;
    email: string;
    avatar?: string;
    displayName?: string;
    phoneNumber?: string;
  } | null>(null);

  // State để quản lý editing mode
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    displayName?: string;
    username?: string;
    email?: string;
    phoneNumber?: string;
  }>({});

  // State để hiển thị email và phone (masked/unmasked)
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  // State để upload avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Fetch full user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/users/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setFullUser(data.user);
        } else {
          setFullUser({
            id: user.id,
            username: user.username,
            email: user.email,
          });
        }
      } catch (error) {
        setFullUser({
          id: user.id,
          username: user.username,
          email: user.email,
        });
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Lấy chữ cái đầu của tên cho avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  // Bắt đầu edit field: set editingField và load giá trị hiện tại vào editValues
  const handleStartEdit = (field: string) => {
    if (!fullUser) return;

    setEditingField(field);
    if (field === "displayName") {
      setEditValues({ displayName: fullUser.displayName || fullUser.username || "" });
    } else if (field === "username") {
      setEditValues({ username: fullUser.username || "" });
    } else if (field === "email") {
      setEditValues({ email: fullUser.email || "" });
    } else if (field === "phoneNumber") {
      setEditValues({ phoneNumber: fullUser.phoneNumber || "" });
    }
  };

  // Lưu thay đổi: gửi API PUT, cập nhật localStorage và dispatch event để các component khác biết
  const handleSave = async (field: string) => {
    if (!fullUser) return;

    try {
      const updateData: any = {};
      if (field === "displayName" && editValues.displayName !== undefined) {
        updateData.displayName = editValues.displayName;
      } else if (field === "username" && editValues.username !== undefined) {
        updateData.username = editValues.username;
      } else if (field === "email" && editValues.email !== undefined) {
        updateData.email = editValues.email;
      } else if (field === "phoneNumber" && editValues.phoneNumber !== undefined) {
        updateData.phoneNumber = editValues.phoneNumber;
      }

      const response = await fetch(`/api/users/${fullUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        setFullUser(data.user);

        const userData = localStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          localStorage.setItem("user", JSON.stringify({ ...parsedUser, ...data.user }));
          // Dispatch custom event để các components khác biết user đã được update
          window.dispatchEvent(new Event("userUpdated"));
        }

        onUserUpdate?.(data.user);
        showSuccess("Information updated successfully");
        setEditingField(null);
        setEditValues({});
      } else {
        const errorData = await response.json();
        showError(errorData.message || "Unable to update information");
      }
    } catch (error) {
      showError("An error occurred while updating information");
    }
  };

  // Hủy edit: reset editingField và editValues
  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValues({});
  };

  // Xóa số điện thoại: gửi API PUT với phoneNumber = null
  const handleRemovePhone = async () => {
    if (!fullUser) return;

    try {
      const response = await fetch(`/api/users/${fullUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: null }),
      });

      if (response.ok) {
        const data = await response.json();
        setFullUser(data.user);
        onUserUpdate?.(data.user);
        showSuccess("Phone number removed successfully");
      } else {
        showError("Unable to remove phone number");
      }
    } catch (error) {
      showError("An error occurred");
    }
  };

  // Ẩn email: chỉ hiển thị 2 ký tự đầu + *****@domain
  const maskEmail = (email: string) => {
    if (!email) return "";
    const [local, domain] = email.split("@");
    if (local.length <= 3) return "***@" + domain;
    return local.substring(0, 2) + "*****@" + domain;
  };

  // Ẩn phone: chỉ hiển thị 4 số cuối
  const maskPhone = (phone: string) => {
    if (!phone) return "";
    if (phone.length <= 4) return "****" + phone;
    return "****" + phone.slice(-4);
  };

  // Upload avatar: validate file type/size, upload file, sau đó update user với avatarUrl
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!fullUser) return;

    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showError("Only image files are accepted (JPEG, PNG, GIF, WebP)");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showError("File size is too large. Maximum 5MB");
      return;
    }

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", fullUser.id);

      const uploadResponse = await fetch("/api/users/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        showError(errorData.message || "Unable to upload avatar");
        return;
      }

      const uploadData = await uploadResponse.json();
      const avatarUrl = uploadData.avatarUrl;

      const updateResponse = await fetch(`/api/users/${fullUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar: avatarUrl }),
      });

      if (updateResponse.ok) {
        const data = await updateResponse.json();
        setFullUser(data.user);

        const userData = localStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          localStorage.setItem("user", JSON.stringify({ ...parsedUser, ...data.user }));
          // Dispatch custom event để các components khác biết user đã được update
          window.dispatchEvent(new Event("userUpdated"));
        }

        onUserUpdate?.(data.user);
        showSuccess("Avatar updated successfully");
      } else {
        const errorData = await updateResponse.json();
        showError(errorData.message || "Unable to update avatar");
      }
    } catch (error) {
      showError("An error occurred while uploading avatar");
    } finally {
      setUploadingAvatar(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  // Trigger file input click để mở file picker
  const triggerAvatarUpload = () => {
    const input = document.getElementById("avatar-upload-input") as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  if (!fullUser) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[#747F8D]">Loading information...</span>
        </div>
      </div>
    );
  }

  const avatarInitial = getInitials(fullUser.displayName || fullUser.username);
  const displayName = fullUser.displayName || fullUser.username;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        {/* Banner gradient */}
        <div className="h-24 bg-linear-to-r from-[#5865F2] via-[#7289DA] to-[#99AAB5] relative">
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Profile section */}
        <div className="relative px-6 pb-6">
          {/* Avatar overlap */}
          <div className="absolute -top-12 left-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl bg-linear-to-br from-[#5865F2] to-[#7289DA] flex items-center justify-center overflow-hidden">
                {fullUser.avatar ? (
                  <img
                    src={fullUser.avatar || "/placeholder.svg"}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">{avatarInitial}</span>
                )}
              </div>
              {/* Hover overlay */}
              <div
                onClick={triggerAvatarUpload}
                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
              >
                {uploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>

          <input
            id="avatar-upload-input"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
          />

          {/* User info và button */}
          <div className="pt-14 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
              <p className="text-sm text-gray-500">@{fullUser.username}</p>
            </div>
            <button className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-lg transition-colors">
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 bg-linear-to-r from-gray-50 to-white border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Account Information</h3>
        </div>

        {/* Tên hiển thị */}
        <div className="px-6 py-5 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Display Name</label>
              {editingField === "displayName" ? (
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="text"
                    value={editValues.displayName || ""}
                    onChange={(e) => setEditValues({ ...editValues, displayName: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]/30 focus:border-[#5865F2] transition-all"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSave("displayName")}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-medium text-gray-900">{displayName}</p>
                  <button
                    onClick={() => handleStartEdit("displayName")}
                    className="px-4 py-1.5 text-[#5865F2] hover:bg-[#5865F2]/10 text-sm font-medium rounded-lg transition-all"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tên đăng nhập */}
        <div className="px-6 py-5 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Username</label>
              {editingField === "username" ? (
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="text"
                    value={editValues.username || ""}
                    onChange={(e) => setEditValues({ ...editValues, username: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]/30 focus:border-[#5865F2] transition-all"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSave("username")}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-medium text-gray-900">{fullUser.username}</p>
                  <button
                    onClick={() => handleStartEdit("username")}
                    className="px-4 py-1.5 text-[#5865F2] hover:bg-[#5865F2]/10 text-sm font-medium rounded-lg transition-all"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="px-6 py-5 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
              {editingField === "email" ? (
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="email"
                    value={editValues.email || ""}
                    onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]/30 focus:border-[#5865F2] transition-all"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSave("email")}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-medium text-gray-900">
                    {showEmail ? fullUser.email : maskEmail(fullUser.email)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowEmail(!showEmail)}
                      className="px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 text-sm rounded-lg transition-all"
                    >
                      {showEmail ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={() => handleStartEdit("email")}
                      className="px-4 py-1.5 text-[#5865F2] hover:bg-[#5865F2]/10 text-sm font-medium rounded-lg transition-all"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Số Điện Thoại */}
        <div className="px-6 py-5 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone Number</label>
              {editingField === "phoneNumber" ? (
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="tel"
                    value={editValues.phoneNumber || ""}
                    onChange={(e) => setEditValues({ ...editValues, phoneNumber: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]/30 focus:border-[#5865F2] transition-all"
                    placeholder="Enter phone number"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSave("phoneNumber")}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-medium text-gray-900">
                    {fullUser.phoneNumber ? (
                      showPhone ? (
                        fullUser.phoneNumber
                      ) : (
                        maskPhone(fullUser.phoneNumber)
                      )
                    ) : (
                      <span className="text-gray-400 italic">Not added</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    {fullUser.phoneNumber && (
                      <>
                        <button
                          onClick={() => setShowPhone(!showPhone)}
                          className="px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 text-sm rounded-lg transition-all"
                        >
                          {showPhone ? "Hide" : "Show"}
                        </button>
                        <button
                          onClick={handleRemovePhone}
                          className="px-3 py-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 text-sm rounded-lg transition-all"
                        >
                          Remove
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleStartEdit("phoneNumber")}
                      className="px-4 py-1.5 text-[#5865F2] hover:bg-[#5865F2]/10 text-sm font-medium rounded-lg transition-all"
                    >
                      {fullUser.phoneNumber ? "Edit" : "Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 bg-linear-to-r from-gray-50 to-white border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Password & Security</h3>
        </div>
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Change Password</p>
            <p className="text-xs text-gray-500 mt-0.5">Update your password to protect your account</p>
          </div>
          <button className="px-5 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-lg transition-colors">
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}
