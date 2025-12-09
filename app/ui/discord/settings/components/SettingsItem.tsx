/**
 * Component Settings Item - Item trong sidebar settings
 */

"use client";

interface SettingsItemProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  danger?: boolean;
}

export default function SettingsItem({
  label,
  active,
  onClick,
  danger,
}: SettingsItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left text-sm rounded-r-full transition-colors ${
        active
          ? "bg-[#E3E5E8] text-[#060607]"
          : danger
          ? "text-red-500 hover:bg-[#E3E5E8] hover:text-red-600"
          : "text-[#747F8D] hover:bg-[#E3E5E8] hover:text-[#060607]"
      }`}
    >
      {label}
    </button>
  );
}

