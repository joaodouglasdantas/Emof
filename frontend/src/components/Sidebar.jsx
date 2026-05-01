import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/',          icon: '🏠', label: 'Dashboard'  },
  { to: '/refeicoes', icon: '🍽️', label: 'Refeições'  },
  { to: '/alimentos', icon: '🥦', label: 'Alimentos'  },
  { to: '/peso',      icon: '⚖️', label: 'Peso'       },
  { to: '/fotos',     icon: '📸', label: 'Fotos'      },
  { to: '/insights',  icon: '💡', label: 'Insights'   },
  { to: '/perfil',    icon: '👤', label: 'Perfil'     },
]

export default function Sidebar({ profile }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">emof</div>
        <div className="sidebar-logo-sub">Controle de Calorias</div>
      </div>

      <div className="sidebar-links">
        {LINKS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link--active' : ''}`}
          >
            <span className="sidebar-link-icon">{icon}</span>
            <span className="sidebar-link-label">{label}</span>
          </NavLink>
        ))}
      </div>

      <div className="sidebar-user">
        <div className="sidebar-user-avatar">🏋️</div>
        <div className="sidebar-user-name">{profile?.name || 'Meu Perfil'}</div>
      </div>
    </nav>
  )
}
