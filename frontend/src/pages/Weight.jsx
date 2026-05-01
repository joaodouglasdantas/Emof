import { useState, useEffect, useCallback, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import Modal from '../components/Modal'
import { getWeight, addWeight, deleteWeight } from '../api'
import { useProfile } from '../App'
import { useToast } from '../App'
import { today, fmtFull, fmtShort, calcBMI, bmiCategory } from '../utils'

Chart.register(...registerables)

export default function Weight() {
  const { profile } = useProfile()
  const showToast = useToast()
  const [weights, setWeights] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ date: today(), weight: '', note: '' })
  const chartRef = useRef(null)
  const chartInst = useRef(null)

  const load = useCallback(() => getWeight().then(setWeights).catch(() => {}), [])
  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!chartRef.current) return
    if (chartInst.current) chartInst.current.destroy()
    const data = [...weights].sort((a, b) => a.date.localeCompare(b.date)).slice(-30)
    if (!data.length) return
    chartInst.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: data.map(w => fmtShort(w.date)),
        datasets: [{
          label: 'Peso (kg)', data: data.map(w => w.weight),
          borderColor: '#00d884', backgroundColor: 'rgba(0,216,132,.08)',
          borderWidth: 2.5, pointBackgroundColor: '#00d884', pointRadius: 4,
          fill: true, tension: .4,
        }],
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

  const sorted = [...weights].sort((a, b) => b.date.localeCompare(a.date))

  const handleSave = async () => {
    if (!form.date || !form.weight) return showToast('Preencha data e peso', 'error')
    try {
      await addWeight({ date: form.date, weight: parseFloat(form.weight), note: form.note })
      load(); setModalOpen(false); showToast('Peso registrado!')
    } catch { showToast('Erro ao registrar', 'error') }
  }

  const handleDelete = async (date) => {
    try { await deleteWeight(date); load(); showToast('Registro removido') }
    catch { showToast('Erro ao remover', 'error') }
  }

  const wvals = sorted.map(w => parseFloat(w.weight))
  const totalChange = sorted.length >= 2
    ? (parseFloat(sorted[0].weight) - parseFloat(sorted[sorted.length - 1].weight)).toFixed(1)
    : null

  return (
    <div>
      <div className="page-header fx-between">
        <div>
          <div className="page-title">Controle de Peso</div>
          <div className="page-sub">Acompanhe sua evolução</div>
        </div>
        <button className="btn btn-green" onClick={() => { setForm({ date: today(), weight: '', note: '' }); setModalOpen(true) }}>+ Registrar Peso</button>
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-title">📉 Evolução (últimos 30 registros)</div>
          {sorted.length > 0
            ? <div className="chart-wrap"><canvas ref={chartRef} /></div>
            : <div className="empty" style={{ padding: 32 }}><p>Registre seu peso para ver o gráfico</p></div>
          }
        </div>
        <div className="card">
          <div className="card-title">📊 Estatísticas</div>
          {sorted.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhum registro ainda</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13.5 }}>
              <div className="fx-between"><span className="c-muted">Peso atual</span><strong>{sorted[0].weight} kg</strong></div>
              {totalChange !== null && (
                <div className="fx-between">
                  <span className="c-muted">Variação total</span>
                  <strong style={{ color: parseFloat(totalChange) < 0 ? 'var(--green)' : 'var(--red)' }}>
                    {parseFloat(totalChange) > 0 ? '+' : ''}{totalChange} kg
                  </strong>
                </div>
              )}
              <div className="fx-between"><span className="c-muted">Mínimo</span><strong>{Math.min(...wvals)} kg</strong></div>
              <div className="fx-between"><span className="c-muted">Máximo</span><strong>{Math.max(...wvals)} kg</strong></div>
              <div className="fx-between"><span className="c-muted">Registros</span><strong>{sorted.length}</strong></div>
              {profile?.height && (
                <div className="fx-between">
                  <span className="c-muted">IMC atual</span>
                  <strong style={{ color: bmiCategory(calcBMI(sorted[0].weight, profile.height)).color }}>
                    {calcBMI(sorted[0].weight, profile.height).toFixed(1)} — {bmiCategory(calcBMI(sorted[0].weight, profile.height)).label}
                  </strong>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card mt6">
        <div className="card-title">Histórico</div>
        {sorted.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">⚖️</div>
            <h3>Nenhum registro de peso</h3>
            <p>Registre seu peso diariamente para ver sua evolução</p>
          </div>
        ) : (
          <table className="table">
            <thead><tr><th>Data</th><th>Peso</th><th>Variação</th><th>IMC</th><th>Nota</th><th></th></tr></thead>
            <tbody>
              {sorted.map((w, i) => {
                const prev = sorted[i + 1]
                const diff = prev ? (parseFloat(w.weight) - parseFloat(prev.weight)).toFixed(1) : null
                const bmi = profile?.height ? calcBMI(w.weight, profile.height).toFixed(1) : '—'
                return (
                  <tr key={w.id}>
                    <td>{fmtFull(w.date)}</td>
                    <td><strong>{w.weight} kg</strong></td>
                    <td>{diff !== null ? <span style={{ color: diff > 0 ? 'var(--red)' : 'var(--green)' }}>{diff > 0 ? '+' : ''}{diff} kg</span> : '—'}</td>
                    <td>{bmi}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{w.note || '—'}</td>
                    <td><button className="btn btn-red btn-sm" onClick={() => handleDelete(w.date)}>✕</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="⚖️ Registrar Peso" width={420}>
        <div className="form-group">
          <label className="form-label">Data *</label>
          <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Peso (kg) *</label>
          <input className="form-input" type="number" step="0.1" placeholder="ex: 75.5" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Observação</label>
          <input className="form-input" placeholder="opcional" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
        </div>
        <div className="fx-end">
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
          <button className="btn btn-green" onClick={handleSave}>Registrar</button>
        </div>
      </Modal>
    </div>
  )
}
