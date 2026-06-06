import { NavLink } from 'react-router-dom'
import { LayoutDashboard, UtensilsCrossed, Salad, Scale, Camera, BarChart2, UserCircle, User } from 'lucide-react'

const LINKS = [
  { to: '/',          Icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/refeicoes', Icon: UtensilsCrossed, label: 'Refeições'  },
  { to: '/alimentos', Icon: Salad,           label: 'Alimentos'  },
  { to: '/peso',      Icon: Scale,           label: 'Peso'       },
  { to: '/fotos',     Icon: Camera,          label: 'Fotos'      },
  { to: '/insights',  Icon: BarChart2,       label: 'Insights'   },
  { to: '/perfil',    Icon: UserCircle,      label: 'Perfil'     },
]

export default function Sidebar({ profile }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">emof</div>
        <div className="sidebar-logo-sub">Controle de Calorias</div>
      </div>

      <div className="sidebar-links">
        {LINKS.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link--active' : ''}`}
          >
            <span className="sidebar-link-icon"><Icon size={18} /></span>
            <span className="sidebar-link-label">{label}</span>
          </NavLink>
        ))}
      </div>

      <div className="sidebar-user">
        <div className="sidebar-user-avatar"><User size={16} /></div>
        <div className="sidebar-user-name">{profile?.name || 'Meu Perfil'}</div>
      </div>
    </nav>
  )
}
