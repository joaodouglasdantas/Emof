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
    <nav style={{
      width: 'var(--side-w)', background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      display: 'flex', flexDirection: 'column', zIndex: 100,
    }}>
      <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          fontSize: 30, fontWeight: 900, letterSpacing: -2,
          background: 'linear-gradient(135deg, var(--green), var(--red))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>emof</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: .5 }}>
          Controle de Calorias
        </div>
      </div>

      <div style={{ padding: '12px 0', flex: 1 }}>
        {LINKS.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            padding: '11px 20px 11px 22px',
            display: 'flex', alignItems: 'center', gap: 13,
            fontSize: 13.5, textDecoration: 'none',
            color: isActive ? 'var(--green)' : 'var(--muted)',
            borderLeft: `3px solid ${isActive ? 'var(--green)' : 'transparent'}`,
            background: isActive ? 'rgba(0,216,132,.06)' : 'transparent',
            transition: 'all .15s',
          })}>
            <span style={{ fontSize: 17, minWidth: 22, textAlign: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34,
          background: 'linear-gradient(135deg, var(--green2), var(--blue))',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
        }}>🏋️</div>
        <div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {profile?.name || 'Meu Perfil'}
        </div>
      </div>
    </nav>
  )
}
