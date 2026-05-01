import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chart, registerables } from 'chart.js'
import { useProfile } from '../App'
import { getMeals, getWeight, getMealSummary } from '../api'
import { today, fmtLong, fmtShort, calcTDEE, calcBMI, bmiCategory, getLast14Days } from '../utils'

Chart.register(...registerables)

const MEAL_NAMES = { breakfast: '☀️ Café da Manhã', lunch: '🌞 Almoço', dinner: '🌙 Jantar', snacks: '🍎 Lanches' }

export default function Dashboard() {
  const { profile } = useProfile()
  const navigate = useNavigate()
  const [meals, setMeals] = useState({})
  const [weights, setWeights] = useState([])
  const [calSummary, setCalSummary] = useState([])
  const chartRef = useRef(null)
  const chartInst = useRef(null)

  const goal = profile?.goal || calcTDEE(profile || {}) || 2000

  const todayCals = Object.values(meals).flat().reduce((s, i) => s + (i.total_cals || 0), 0)
  const pct = Math.min(100, Math.round(todayCals / goal * 100))
  const remaining = goal - todayCals

  const latestWeight = weights[0]?.weight ?? null
  const bmi = latestWeight && profile?.height ? calcBMI(latestWeight, profile.height) : null

  useEffect(() => {
    const t = today()
    getMeals(t).then(setMeals).catch(() => {})
    getWeight().then(setWeights).catch(() => {})
    const days = getLast14Days()
    getMealSummary(days[0], days[days.length - 1]).then(setCalSummary).catch(() => {})
  }, [])

  useEffect(() => {
    if (!chartRef.current) return
    if (chartInst.current) chartInst.current.destroy()
    const data = [...weights].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
    if (!data.length) return
    chartInst.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: data.map(w => fmtShort(w.date)),
        datasets: [{ label: 'Peso (kg)', data: data.map(w => w.weight), borderColor: '#00d884', backgroundColor: 'rgba(0,216,132,.08)', borderWidth: 2.5, pointBackgroundColor: '#00d884', pointRadius: 4, fill: true, tension: .4 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#1a1a30' }, ticks: { color: '#5a5a7a', font: { size: 11 } } },
          y: { grid: { color: '#1a1a30' }, ticks: { color: '#5a5a7a' }, suggestedMin: Math.min(...data.map(w => w.weight)) - 3 },
        },
      },
    })
    return () => chartInst.current?.destroy()
  }, [weights])

  const calByDate = Object.fromEntries(calSummary.map(r => [r.date, r.total_cals]))

  return (
    <div>
      <div className="page-header fx-between">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">{fmtLong(today())}</div>
        </div>
        <button className="btn btn-green" onClick={() => navigate('/peso')}>+ Registrar Peso</button>
      </div>

      <div className="g4">
        <div className="stat-card green">
          <div className="stat-icon">🔥</div>
          <div className="stat-value c-green">{todayCals}</div>
          <div className="stat-label">kcal consumidas hoje</div>
          <div className="stat-sub c-muted">{pct}% da meta de {goal} kcal</div>
          <div className="progress mt3"><div className={`progress-fill ${pct > 100 ? 'pf-red' : 'pf-green'}`} style={{ width: Math.min(pct, 100) + '%' }} /></div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">⚖️</div>
          <div className="stat-value">{latestWeight ?? '--'}</div>
          <div className="stat-label">{latestWeight ? 'kg — peso atual' : 'Nenhum registro'}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon">📐</div>
          <div className="stat-value">{bmi ? bmi.toFixed(1) : '--'}</div>
          <div className="stat-label">{bmi ? bmiCategory(bmi).label : 'IMC — preencha perfil'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{goal}</div>
          <div className="stat-label">kcal meta diária</div>
          <div className="stat-sub" style={{ color: remaining < 0 ? 'var(--red)' : 'var(--green)' }}>
            {remaining >= 0 ? remaining + ' restantes' : Math.abs(remaining) + ' acima da meta'}
          </div>
        </div>
      </div>

      <div className="g2 mt6">
        <div className="card">
          <div className="card-title">🔥 Calorias de Hoje</div>
          <div style={{ fontSize: 56, fontWeight: 900, color: pct > 100 ? 'var(--red)' : 'var(--green)', letterSpacing: -2, lineHeight: 1 }}>{todayCals}</div>
          <div style={{ color: 'var(--muted)', margin: '6px 0 18px', fontSize: 14 }}>kcal de {goal} kcal</div>
          <div className="progress" style={{ height: 12 }}>
            <div className={`progress-fill ${pct > 100 ? 'pf-red' : 'pf-green'}`} style={{ width: Math.min(pct, 100) + '%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
            <span>0</span><span>{goal} kcal</span>
          </div>
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: remaining < 0 ? 'rgba(255,71,87,.1)' : 'rgba(0,216,132,.08)', border: `1px solid ${remaining < 0 ? 'rgba(255,71,87,.3)' : 'rgba(0,216,132,.2)'}`, fontSize: 13.5, color: remaining < 0 ? 'var(--red)' : 'var(--green)' }}>
            {remaining >= 0 ? `✅ Ainda pode consumir ${remaining} kcal hoje` : `⚠️ Ultrapassou ${Math.abs(remaining)} kcal da meta`}
          </div>
        </div>

        <div className="card">
          <div className="card-title">📈 Evolução do Peso (últimos 14 dias)</div>
          {weights.length > 0
            ? <div className="chart-wrap"><canvas ref={chartRef} /></div>
            : <div className="empty" style={{ padding: 32 }}><p>Registre seu peso para ver o gráfico</p></div>
          }
        </div>
      </div>

      <div className="card mt6">
        <div className="fx-between mb4">
          <div className="card-title" style={{ marginBottom: 0 }}>🍽️ Resumo de Hoje</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/refeicoes')}>Ver completo →</button>
        </div>
        {Object.keys(meals).every(k => meals[k].length === 0) ? (
          <div className="empty" style={{ padding: 28 }}>
            <div className="empty-icon">🍽️</div>
            <p>Nenhuma refeição hoje. <span style={{ color: 'var(--green)', cursor: 'pointer' }} onClick={() => navigate('/refeicoes')}>Registrar agora →</span></p>
          </div>
        ) : (
          Object.entries(MEAL_NAMES).map(([key, name]) => {
            const items = meals[key] || []
            if (!items.length) return null
            const cal = items.reduce((s, i) => s + (i.total_cals || 0), 0)
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13.5 }}>
                <span>{name} <span style={{ color: 'var(--muted)', fontSize: 12 }}>({items.length} item{items.length > 1 ? 's' : ''})</span></span>
                <span className="badge badge-green">{cal} kcal</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
