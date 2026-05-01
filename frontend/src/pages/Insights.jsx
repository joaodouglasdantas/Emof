import { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { getMealSummary, getWeight } from '../api'
import { useProfile } from '../App'
import { today, fmtShort, calcTDEE, getLast14Days } from '../utils'

Chart.register(...registerables)

export default function Insights() {
  const { profile } = useProfile()
  const [calData, setCalData] = useState([])
  const [weights, setWeights] = useState([])
  const [mealDist, setMealDist] = useState(null)
  const calChartRef = useRef(null)
  const calChartInst = useRef(null)
  const distChartRef = useRef(null)
  const distChartInst = useRef(null)

  const goal = profile?.goal || calcTDEE(profile || {}) || 2000
  const days14 = getLast14Days()

  useEffect(() => {
    getMealSummary(days14[0], days14[days14.length - 1]).then(setCalData).catch(() => {})
    getWeight().then(setWeights).catch(() => {})

    Promise.all(days14.map(d =>
      fetch(`/api/meals?date=${d}`).then(r => r.json()).catch(() => ({}))
    )).then(results => {
      const dist = { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 }
      results.forEach(day => {
        Object.keys(dist).forEach(k => {
          (day[k] || []).forEach(i => { dist[k] += i.total_cals || 0 })
        })
      })
      setMealDist(dist)
    })
  }, [])

  useEffect(() => {
    if (!calChartRef.current) return
    if (calChartInst.current) calChartInst.current.destroy()
    const byDate = Object.fromEntries(calData.map(r => [r.date, r.total_cals]))
    const vals = days14.map(d => byDate[d] || 0)
    calChartInst.current = new Chart(calChartRef.current, {
      type: 'bar',
      data: {
        labels: days14.map(d => fmtShort(d)),
        datasets: [
          {
            label: 'Calorias', data: vals,
            backgroundColor: vals.map(v => v > goal ? 'rgba(255,71,87,.7)' : 'rgba(0,216,132,.65)'),
            borderRadius: 6,
          },
          {
            label: 'Meta', data: days14.map(() => goal), type: 'line',
            borderColor: 'rgba(255,211,42,.8)', borderDash: [5, 5],
            borderWidth: 2, pointRadius: 0, fill: false,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#5a5a7a', font: { size: 11 } } } },
        scales: {
          x: { grid: { color: '#1a1a30' }, ticks: { color: '#5a5a7a', font: { size: 10 } } },
          y: { grid: { color: '#1a1a30' }, ticks: { color: '#5a5a7a' } },
        },
      },
    })
    return () => calChartInst.current?.destroy()
  }, [calData, goal])

  useEffect(() => {
    if (!distChartRef.current || !mealDist) return
    if (distChartInst.current) distChartInst.current.destroy()
    const total = Object.values(mealDist).reduce((s, v) => s + v, 0)
    if (!total) return
    distChartInst.current = new Chart(distChartRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Café da Manhã', 'Almoço', 'Jantar', 'Lanches'],
        datasets: [{ data: Object.values(mealDist), backgroundColor: ['#ffd32a', '#00d884', '#4a9eff', '#ff4757'], borderWidth: 0, hoverOffset: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#5a5a7a', padding: 14, font: { size: 11 } } } },
      },
    })
    return () => distChartInst.current?.destroy()
  }, [mealDist])

  const byDate = Object.fromEntries(calData.map(r => [r.date, r.total_cals]))
  const activeDays = days14.filter(d => byDate[d] > 0)
  const avgCals = activeDays.length ? Math.round(activeDays.reduce((s, d) => s + byDate[d], 0) / activeDays.length) : 0
  const avgDeficit = goal - avgCals

  const sortedW = [...weights].sort((a, b) => a.date.localeCompare(b.date))
  const totalLoss = sortedW.length >= 2
    ? (parseFloat(sortedW[0].weight) - parseFloat(sortedW[sortedW.length - 1].weight)).toFixed(1)
    : 0
  const estLoss = (avgDeficit * 14 / 7700).toFixed(2)

  const tips = []
  if (avgCals > 0 && avgCals < goal * 0.75) tips.push({ i: '⚠️', t: 'Sua ingestão está muito abaixo da meta. Um déficit excessivo pode prejudicar sua saúde e metabolismo.' })
  if (avgCals > goal * 1.15) tips.push({ i: '🔴', t: 'Sua média calórica está acima da meta. Tente reduzir porções ou substituir alimentos calóricos.' })
  if (avgCals >= goal * 0.85 && avgCals <= goal * 1.1) tips.push({ i: '✅', t: 'Parabéns! Sua ingestão calórica está dentro da meta. Continue assim!' })
  if (weights.length < 3) tips.push({ i: '📝', t: 'Registre seu peso com mais frequência para análises mais precisas da sua evolução.' })
  if (parseFloat(totalLoss) > 0) tips.push({ i: '🎉', t: `Você perdeu ${totalLoss} kg desde o início dos seus registros. Excelente progresso!` })
  if (activeDays.length < 10) tips.push({ i: '📋', t: 'Tente registrar suas refeições todos os dias para obter análises mais confiáveis.' })
  if (!tips.length) tips.push({ i: '💪', t: 'Continue mantendo seus registros! Com mais dados, os insights ficarão cada vez mais detalhados.' })

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Insights</div>
        <div className="page-sub">Análise dos últimos 14 dias</div>
      </div>

      <div className="g4">
        <div className="insight-card card">
          <div style={{ fontSize: 26, marginBottom: 8 }}>🔥</div>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1 }}>{avgCals}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Média kcal/dia ({activeDays.length} dias registrados)</div>
        </div>
        <div className="insight-card card">
          <div style={{ fontSize: 26, marginBottom: 8 }}>{avgDeficit > 0 ? '✅' : '⚠️'}</div>
          <div style={{ fontSize: 34, fontWeight: 900, color: avgDeficit > 0 ? 'var(--green)' : 'var(--red)', letterSpacing: -1 }}>
            {avgDeficit > 0 ? '-' : '+'}{Math.abs(avgDeficit)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Déficit calórico médio (kcal)</div>
        </div>
        <div className="insight-card card">
          <div style={{ fontSize: 26, marginBottom: 8 }}>⚖️</div>
          <div style={{ fontSize: 34, fontWeight: 900, color: parseFloat(totalLoss) > 0 ? 'var(--green)' : 'var(--muted)', letterSpacing: -1 }}>
            {parseFloat(totalLoss) > 0 ? '-' : ''}{Math.abs(totalLoss)} kg
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Perda total registrada</div>
        </div>
        <div className="insight-card card">
          <div style={{ fontSize: 26, marginBottom: 8 }}>📉</div>
          <div style={{ fontSize: 34, fontWeight: 900, color: parseFloat(estLoss) > 0 ? 'var(--green)' : 'var(--muted)', letterSpacing: -1 }}>
            {parseFloat(estLoss) > 0 ? '-' : ''}{Math.abs(estLoss)} kg
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Perda estimada pelos déficits</div>
        </div>
      </div>

      <div className="g2 mt6">
        <div className="card">
          <div className="card-title">🔥 Calorias por Dia</div>
          <div className="chart-wrap"><canvas ref={calChartRef} /></div>
        </div>
        <div className="card">
          <div className="card-title">🍽️ Distribuição por Refeição</div>
          {mealDist && Object.values(mealDist).some(v => v > 0)
            ? <div className="chart-wrap"><canvas ref={distChartRef} /></div>
            : <div className="empty" style={{ padding: 32 }}><p>Sem dados suficientes</p></div>
          }
        </div>
      </div>

      <div className="card mt6">
        <div className="card-title">💡 Dicas e Análise</div>
        {tips.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{t.i}</span>
            <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>{t.t}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
