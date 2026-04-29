import { useState, useEffect } from 'react'
import { updateProfile } from '../api'
import { useProfile } from '../App'
import { useToast } from '../App'
import { calcBMR, calcTDEE, calcBMI, bmiCategory } from '../utils'

export default function Profile() {
  const { profile, refreshProfile } = useProfile()
  const showToast = useToast()
  const [form, setForm] = useState({ name: '', sex: 'male', age: '', weight: '', height: '', activity: '1.55', goal: '' })

  useEffect(() => {
    if (profile) setForm({ name: profile.name || '', sex: profile.sex || 'male', age: profile.age || '', weight: profile.weight || '', height: profile.height || '', activity: String(profile.activity || 1.55), goal: profile.goal || '' })
  }, [profile])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    try {
      await updateProfile({ ...form, age: parseInt(form.age)||0, weight: parseFloat(form.weight)||0, height: parseFloat(form.height)||0, activity: parseFloat(form.activity)||1.55, goal: parseInt(form.goal)||0 })
      refreshProfile(); showToast('Perfil salvo!')
    } catch { showToast('Erro ao salvar', 'error') }
  }

  const bmr  = Math.round(calcBMR(form))
  const tdee = Math.round(calcTDEE(form))
  const bmi  = form.weight && form.height ? calcBMI(form.weight, form.height) : null
  const cat  = bmi ? bmiCategory(bmi) : null
  const bmiPct = bmi ? Math.min(100, Math.max(0, ((bmi - 15) / (45 - 15)) * 100)) : 50
  const hm = parseFloat(form.height) / 100

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Perfil</div>
        <div className="page-sub">Suas informações pessoais e metas</div>
      </div>

      <div className="g2">
        {/* Form */}
        <div className="card">
          <div className="card-title">👤 Dados Pessoais</div>
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input className="form-input" placeholder="Seu nome" value={form.name} onChange={set('name')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sexo</label>
              <select className="form-input" value={form.sex} onChange={set('sex')}>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Idade</label>
              <input className="form-input" type="number" placeholder="anos" value={form.age} onChange={set('age')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Peso Atual (kg)</label>
              <input className="form-input" type="number" step="0.1" placeholder="kg" value={form.weight} onChange={set('weight')} />
            </div>
            <div className="form-group">
              <label className="form-label">Altura (cm)</label>
              <input className="form-input" type="number" placeholder="cm" value={form.height} onChange={set('height')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Nível de Atividade</label>
            <select className="form-input" value={form.activity} onChange={set('activity')}>
              <option value="1.2">😴 Sedentário — pouco ou sem exercício</option>
              <option value="1.375">🚶 Levemente ativo — 1-3x/semana</option>
              <option value="1.55">🏃 Moderadamente ativo — 3-5x/semana</option>
              <option value="1.725">💪 Muito ativo — 6-7x/semana</option>
              <option value="1.9">🔥 Extremamente ativo — 2x/dia</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              Meta calórica diária (kcal) <span className="c-muted">— deixe em branco para calcular</span>
            </label>
            <input className="form-input" type="number" placeholder="Ex: 1800" value={form.goal} onChange={set('goal')} />
          </div>
          <button className="btn btn-green w-full" onClick={handleSave}>💾 Salvar Perfil</button>
        </div>

        {/* Calculations */}
        <div>
          {/* BMI */}
          <div className="card mb4">
            <div className="card-title">📐 IMC — Índice de Massa Corporal</div>
            {bmi ? (
              <>
                <div style={{ fontSize: 54, fontWeight: 900, color: cat.color, letterSpacing: -2, lineHeight: 1 }}>{bmi.toFixed(1)}</div>
                <div style={{ color: cat.color, fontSize: 15, margin: '8px 0 14px', fontWeight: 600 }}>{cat.label}</div>
                <div className="bmi-gauge"><div className="bmi-needle" style={{ left: bmiPct + '%' }} /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--muted)', marginTop: 4 }}>
                  <span>Abaixo &lt;18.5</span><span>Normal</span><span>Sobre &gt;25</span><span>Obeso &gt;30</span>
                </div>
                <div style={{ marginTop: 14, padding: 12, background: 'rgba(255,255,255,.04)', borderRadius: 10, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.8 }}>
                  Peso ideal (IMC 18.5–24.9):{' '}
                  <strong style={{ color: 'var(--text)' }}>{Math.round(18.5 * hm * hm)}–{Math.round(24.9 * hm * hm)} kg</strong>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Preencha peso e altura para calcular</p>
            )}
          </div>

          {/* TDEE */}
          <div className="card">
            <div className="card-title">🔥 Gasto Calórico Estimado</div>
            {bmr ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13.5 }}>
                <div className="fx-between">
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>TMB (Taxa Metabólica Basal)</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Calorias em repouso absoluto</div>
                  </div>
                  <strong>{bmr} kcal</strong>
                </div>
                <div className="fx-between" style={{ padding: 14, background: 'rgba(0,216,132,.07)', border: '1px solid rgba(0,216,132,.2)', borderRadius: 12 }}>
                  <div>
                    <div style={{ color: 'var(--green)', fontWeight: 700 }}>TDEE — Gasto Total Diário</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Com nível de atividade</div>
                  </div>
                  <strong style={{ fontSize: 22, color: 'var(--green)' }}>{tdee} kcal</strong>
                </div>
                <div style={{ padding: 12, background: 'rgba(255,255,255,.03)', borderRadius: 10, fontSize: 12, color: 'var(--muted)', lineHeight: 2 }}>
                  📉 Perda de 0,5 kg/sem: <strong style={{ color: 'var(--text)' }}>{tdee - 500} kcal/dia</strong><br />
                  ⚖️ Manutenção: <strong style={{ color: 'var(--text)' }}>{tdee} kcal/dia</strong><br />
                  📈 Ganho de 0,5 kg/sem: <strong style={{ color: 'var(--text)' }}>{tdee + 500} kcal/dia</strong>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Preencha seus dados pessoais</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
