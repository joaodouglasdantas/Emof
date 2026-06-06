import { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { Flame, TrendingDown, Scale, BarChart2, UtensilsCrossed, Lightbulb, AlertTriangle, AlertCircle, CheckCircle, ClipboardList, Trophy, Dumbbell, Target } from 'lucide-react'
import { getMealSummary, getWeight } from '../api'
import { useProfile } from '../App'
import { today, fmtShort, calcTDEE, getLast14Days } from '../utils'

Chart.register(...registerables)

const PERIODS = [
  { label: '1 semana',  days: 7   },
  { label: '2 semanas', days: 14  },
  { label: '1 mês',     days: 30  },
  { label: '3 meses',   days: 90  },
]

function shiftDateStr(base, days) {
  const d = new Date(base + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function Insights() {
  const { profile } = useProfile()
  const [calData, setCalData]     = useState([])
  const [weights, setWeights]     = useState([])
  const [mealDist, setMealDist]   = useState(null)
  const calChartRef  = useRef(null)
  const calChartInst = useRef(null)
  const distChartRef  = useRef(null)
  const distChartInst = useRef(null)
  const projChartRef  = useRef(null)
  const projChartInst = useRef(null)

  const goal   = profile?.goal || calcTDEE(profile || {}) || 2000
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
          ;(day[k] || []).forEach(i => { dist[k] += i.total_cals || 0 })
        })
      })
      setMealDist(dist)
    })
  }, [])

  /* ── Calorias chart ── */
  useEffect(() => {
    if (!calChartRef.current) return
    if (calChartInst.current) calChartInst.current.destroy()
    const byDate = Object.fromEntries(calData.map(r => [r.date, r.total_cals]))
    const vals   = days14.map(d => byDate[d] || 0)
    calChartInst.current = new Chart(calChartRef.current, {
      type: 'bar',
      data: {
        labels: days14.map(d => fmtShort(d)),
        datasets: [
          { label: 'Calorias', data: vals, backgroundColor: vals.map(v => v > goal ? 'rgba(255,71,87,.7)' : 'rgba(0,216,132,.65)'), borderRadius: 6 },
          { label: 'Meta', data: days14.map(() => goal), type: 'line', borderColor: 'rgba(255,211,42,.8)', borderDash: [5,5], borderWidth: 2, pointRadius: 0, fill: false },
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

  /* ── Distribuição chart ── */
  useEffect(() => {
    if (!distChartRef.current || !mealDist) return
    if (distChartInst.current) distChartInst.current.destroy()
    const total = Object.values(mealDist).reduce((s, v) => s + v, 0)
    if (!total) return
    distChartInst.current = new Chart(distChartRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Café da Manhã', 'Almoço', 'Jantar', 'Lanches'],
        datasets: [{ data: Object.values(mealDist), backgroundColor: ['#ffd32a','#00d884','#4a9eff','#ff4757'], borderWidth: 0, hoverOffset: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#5a5a7a', padding: 14, font: { size: 11 } } } },
      },
    })
    return () => distChartInst.current?.destroy()
  }, [mealDist])

  /* ── Derivações ── */
  const byDate     = Object.fromEntries(calData.map(r => [r.date, r.total_cals]))
  const activeDays = days14.filter(d => byDate[d] > 0)
  const avgCals    = activeDays.length ? Math.round(activeDays.reduce((s, d) => s + byDate[d], 0) / activeDays.length) : 0
  const avgDeficit = goal - avgCals   // positivo = déficit, negativo = superávit

  const sortedW   = [...weights].sort((a, b) => a.date.localeCompare(b.date))
  const totalLoss = sortedW.length >= 2
    ? (parseFloat(sortedW[0].weight) - parseFloat(sortedW[sortedW.length - 1].weight)).toFixed(1)
    : 0
  const estLoss   = (avgDeficit * 14 / 7700).toFixed(2)

  /* ── Previsão de peso ── */
  const currentWeight = sortedW.length ? parseFloat(sortedW[sortedW.length - 1].weight) : null
  const hasEnoughData = activeDays.length >= 3 && currentWeight !== null

  const predictWeight = (days) => {
    if (!hasEnoughData) return null
    return Math.max(0, currentWeight - (avgDeficit * days / 7700))
  }

  const deltaStr = (days) => {
    const pred = predictWeight(days)
    if (pred === null) return null
    const delta = pred - currentWeight
    return { value: pred.toFixed(1), delta: delta.toFixed(1), positive: delta <= 0 }
  }

  /* ── Gráfico de projeção ── */
  useEffect(() => {
    if (!projChartRef.current || !hasEnoughData) return
    if (projChartInst.current) projChartInst.current.destroy()

    const histData = sortedW.slice(-14)
    const histLabels = histData.map(w => fmtShort(w.date))
    const histVals   = histData.map(w => parseFloat(w.weight))

    // projetar 30 dias a partir de hoje
    const todayStr = today()
    const projLabels = []
    const projVals   = []
    for (let d = 1; d <= 30; d++) {
      projLabels.push(fmtShort(shiftDateStr(todayStr, d)))
      projVals.push(parseFloat(predictWeight(d).toFixed(2)))
    }

    // ponto de junção: último peso histórico repetido no início da projeção
    const junctionLabel = histLabels[histLabels.length - 1]
    const junctionVal   = histVals[histVals.length - 1]

    projChartInst.current = new Chart(projChartRef.current, {
      type: 'line',
      data: {
        labels: [...histLabels, ...projLabels],
        datasets: [
          {
            label: 'Histórico',
            data: [...histVals, ...Array(projLabels.length).fill(null)],
            borderColor: '#00d884',
            backgroundColor: 'rgba(0,216,132,.08)',
            borderWidth: 2.5,
            pointBackgroundColor: '#00d884',
            pointRadius: 3,
            fill: true,
            tension: .4,
          },
          {
            label: 'Projeção',
            data: [...Array(histLabels.length - 1).fill(null), junctionVal, ...projVals],
            borderColor: avgDeficit > 0 ? '#00d884' : '#ff4757',
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: false,
            tension: .3,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#5a5a7a', font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)} kg`,
            },
          },
        },
        scales: {
          x: { grid: { color: '#1a1a30' }, ticks: { color: '#5a5a7a', font: { size: 10 }, maxTicksLimit: 10 } },
          y: { grid: { color: '#1a1a30' }, ticks: { color: '#5a5a7a', callback: v => v + ' kg' } },
        },
      },
    })
    return () => projChartInst.current?.destroy()
  }, [weights, avgDeficit, hasEnoughData])

  /* ── Tips ── */
  const tips = []
  if (avgCals > 0 && avgCals < goal * 0.75) tips.push({ Icon: AlertTriangle, color: 'var(--yellow)', t: 'Sua ingestão está muito abaixo da meta. Um déficit excessivo pode prejudicar sua saúde e metabolismo.' })
  if (avgCals > goal * 1.15)                tips.push({ Icon: AlertCircle,   color: 'var(--red)',    t: 'Sua média calórica está acima da meta. Tente reduzir porções ou substituir alimentos calóricos.' })
  if (avgCals >= goal * 0.85 && avgCals <= goal * 1.1) tips.push({ Icon: CheckCircle, color: 'var(--green)', t: 'Parabéns! Sua ingestão calórica está dentro da meta. Continue assim!' })
  if (weights.length < 3)    tips.push({ Icon: ClipboardList, color: 'var(--blue)',   t: 'Registre seu peso com mais frequência para análises mais precisas da sua evolução.' })
  if (parseFloat(totalLoss) > 0) tips.push({ Icon: Trophy, color: 'var(--yellow)', t: `Você perdeu ${totalLoss} kg desde o início dos seus registros. Excelente progresso!` })
  if (activeDays.length < 10)    tips.push({ Icon: ClipboardList, color: 'var(--blue)', t: 'Tente registrar suas refeições todos os dias para obter análises mais confiáveis.' })
  if (!tips.length) tips.push({ Icon: Dumbbell, color: 'var(--green)', t: 'Continue mantendo seus registros! Com mais dados, os insights ficarão cada vez mais detalhados.' })

  const confidencePct = Math.min(100, Math.round((activeDays.length / 14) * 100))
  const confidenceColor = confidencePct >= 70 ? 'var(--green)' : confidencePct >= 40 ? 'var(--yellow)' : 'var(--red)'

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Insights</div>
        <div className="page-sub">Análise dos últimos 14 dias</div>
      </div>

      {/* Cards de resumo */}
      <div className="g4">
        <div className="insight-card card">
          <div style={{ marginBottom: 8, color: 'var(--red)' }}><Flame size={26} /></div>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1 }}>{avgCals}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Média kcal/dia ({activeDays.length} dias registrados)</div>
        </div>
        <div className="insight-card card">
          <div style={{ marginBottom: 8, color: avgDeficit > 0 ? 'var(--green)' : 'var(--red)' }}>
            <TrendingDown size={26} />
          </div>
          <div style={{ fontSize: 34, fontWeight: 900, color: avgDeficit > 0 ? 'var(--green)' : 'var(--red)', letterSpacing: -1 }}>
            {avgDeficit > 0 ? '-' : '+'}{Math.abs(avgDeficit)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Déficit calórico médio (kcal)</div>
        </div>
        <div className="insight-card card">
          <div style={{ marginBottom: 8, color: 'var(--blue)' }}><Scale size={26} /></div>
          <div style={{ fontSize: 34, fontWeight: 900, color: parseFloat(totalLoss) > 0 ? 'var(--green)' : 'var(--muted)', letterSpacing: -1 }}>
            {parseFloat(totalLoss) > 0 ? '-' : ''}{Math.abs(totalLoss)} kg
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Perda total registrada</div>
        </div>
        <div className="insight-card card">
          <div style={{ marginBottom: 8, color: 'var(--green)' }}><TrendingDown size={26} /></div>
          <div style={{ fontSize: 34, fontWeight: 900, color: parseFloat(estLoss) > 0 ? 'var(--green)' : 'var(--muted)', letterSpacing: -1 }}>
            {parseFloat(estLoss) > 0 ? '-' : ''}{Math.abs(estLoss)} kg
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Perda estimada pelos déficits</div>
        </div>
      </div>

      {/* Gráficos históricos */}
      <div className="g2 mt6">
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flame size={14} /> Calorias por Dia
          </div>
          <div className="chart-wrap"><canvas ref={calChartRef} /></div>
        </div>
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <UtensilsCrossed size={14} /> Distribuição por Refeição
          </div>
          {mealDist && Object.values(mealDist).some(v => v > 0)
            ? <div className="chart-wrap"><canvas ref={distChartRef} /></div>
            : <div className="empty" style={{ padding: 32 }}><p>Sem dados suficientes</p></div>
          }
        </div>
      </div>

      {/* ── Previsão de Peso ── */}
      <div className="card mt6">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Target size={14} /> Previsão de Peso
        </div>

        {!hasEnoughData ? (
          <div className="empty" style={{ padding: 32 }}>
            <div className="empty-icon"><Target size={40} strokeWidth={1} /></div>
            <h3>Dados insuficientes</h3>
            <p>Registre pelo menos 3 dias de refeições e seu peso atual para ver a previsão.</p>
          </div>
        ) : (
          <>
            {/* Cabeçalho da previsão */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Peso atual</div>
                <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>{currentWeight} <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--muted)' }}>kg</span></div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  Média de <strong style={{ color: avgDeficit > 0 ? 'var(--green)' : 'var(--red)' }}>
                    {avgDeficit > 0 ? '-' : '+'}{Math.abs(avgDeficit)} kcal/dia
                  </strong> em relação à meta
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Confiança da previsão</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: confidenceColor }}>{confidencePct}%</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{activeDays.length}/14 dias com dados</div>
              </div>
            </div>

            {/* Cards por período */}
            <div className="g4" style={{ marginBottom: 24 }}>
              {PERIODS.map(({ label, days }) => {
                const d = deltaStr(days)
                if (!d) return null
                const losing = d.positive
                return (
                  <div key={days} style={{
                    background: 'var(--bg)',
                    border: `1px solid ${losing ? 'rgba(0,216,132,.25)' : 'rgba(255,71,87,.25)'}`,
                    borderRadius: 14,
                    padding: '16px 18px',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5, fontWeight: 700 }}>{label}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, color: losing ? 'var(--green)' : 'var(--red)' }}>
                      {d.value} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>kg</span>
                    </div>
                    <div style={{ fontSize: 12.5, marginTop: 6, color: losing ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                      {parseFloat(d.delta) > 0 ? '+' : ''}{d.delta} kg
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Gráfico histórico + projeção */}
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <TrendingDown size={13} /> Histórico + Projeção (próximos 30 dias)
            </div>
            <div className="chart-wrap"><canvas ref={projChartRef} /></div>

            {/* Aviso */}
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 10, fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
              Previsão baseada na média de {activeDays.length} dias registrados. Fórmula: 1 kg de gordura ≈ 7.700 kcal. Fatores como retenção hídrica, músculo e metabolismo podem variar os resultados reais.
            </div>
          </>
        )}
      </div>

      {/* Dicas */}
      <div className="card mt6">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lightbulb size={14} /> Dicas e Análise
        </div>
        {tips.map((tip, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
            <span style={{ color: tip.color, flexShrink: 0, marginTop: 1 }}><tip.Icon size={20} /></span>
            <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>{tip.t}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
