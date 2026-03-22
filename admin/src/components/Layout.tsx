import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/users', icon: '👥', label: 'Users' },
  { to: '/kyc', icon: '🪪', label: 'KYC' },
  { to: '/transfers', icon: '💸', label: 'Transfers' },
  { to: '/rates', icon: '💱', label: 'Rates' },
]

export default function Layout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleLogout() {
    localStorage.removeItem('zuripay_admin_token')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ backgroundColor: '#1A1A2E' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            Z
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">ZuriPay</p>
            <p className="text-gray-400 text-xs mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
              }
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 border-t border-white/10 pt-4">
          <button
            onClick={handleLogout}
            className="sidebar-link sidebar-link-inactive w-full text-left hover:bg-red-500/20 hover:text-red-300"
          >
            <span className="text-base">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 bg-white border-b border-gray-100 px-4 lg:px-6 h-14 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {/* Hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-gray-800 font-semibold text-base">ZuriPay Admin</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live</span>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
