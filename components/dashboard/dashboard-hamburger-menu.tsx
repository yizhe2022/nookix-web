"use client"

interface DashboardHamburgerMenuProps {
  onClick: () => void
}

export default function DashboardHamburgerMenu({ onClick }: DashboardHamburgerMenuProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
      aria-label="Toggle menu"
    >
      <svg
        className="w-6 h-6 text-gray-700"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </svg>
    </button>
  )
}
