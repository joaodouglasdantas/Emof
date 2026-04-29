import { useState, useEffect, useCallback } from 'react'
import Modal from '../components/Modal'
import { getMeals, addMealEntry, deleteMealEntry, getFoods } from '../api'
import { today, fmtLong, shiftDate, calcTDEE } from '../utils'
import { useProfile } from '../App'
import { useToast } from '../App'

const MEAL_DEFS = [
  { key: 'breakfast', name: 'Café da Manhã', icon: '☀️' },
  { key: 'lunch',     name: 'Almoço',        icon: '🌞' },
  { key: 'dinner',    name: 'Jantar',        icon: '🌙' },
  { key: 'snacks',    name: 'Lanches',       icon: '🍎' },
]

export default function Meals() {
  const { profile } = useProfile()
  const showToast = useToast()
  const [date, setDate] = useState(today())
  const [meals, setMeals] = useState({ breakfast: [], lunch: [], dinner: [], snacks: [] })
  const [foods, setFoods] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [search, setSearch] = useState('')
  const [pickedFood, setPickedFood] = useState(null)
  const [qty, setQty] = useState(1)

  const goal = profile?.goal || calcTDEE(profile || {}) || 2000
  const totalCals = Object.values(meals).flat().reduce((s, i) => s + (i.total_cals || 0), 0)
  const pct = Math.min(100, Math.round(totalCals / goal * 100))
  const remaining = goal - totalCals

  const loadMeals = useCallback(() => {
    getMeals(date).then(setMeals).catch(() => {})
  }, [date])

  useEffect(() => { loadMeals() }, [loadMeals])
  useEffect(() => { getFoods().then(setFoods).catch(() => {}) }, [])

  const openAdd = (mealKey, mealName) => {
    setSelectedMeal({ key: mealKey, name: mealName })
    setSearch(''); setPickedFood(null); setQty(1)
    setModalOpen(true)
  }

  const handleAdd = async () => {
    if (!pickedFood) return showToast('Selecione um alimento', 'error')
    try {
      await addMealEntry({
        date, meal_type: selectedMeal.key,
        food_id: pickedFood.id, food_name: pickedFood.name,
        qty, unit: pickedFood.unit,
        total_cals: Math.round(qty * pickedFood.cals),
      })
      loadMeals(); setModalOpen(false); showToast('Adicionado à refeição!')
    } catch { showToast('Erro ao adicionar', 'error') }
  }

  const handleRemove = async (id) => {
    try { await deleteMealEntry(id); loadMeals() } catch { showToast('Erro ao remover', 'error') }
  }

  const filtered = foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Refeições</div>
        <div className="page-sub">Registre o que você comeu</div>
      </div>

      {/* Date nav */}
      <div className="date-nav">
        <button className="date-nav-btn" onClick={() => setDate(d => shiftDate(d, -1))}>←</button>
        <div className="date-display">{fmtLong(date)}</div>
        <button className="date-nav-btn" onClick={() => setDate(d => shiftDate(d, 1))}>→</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setDate(today())}>Hoje</button>
      </div>

      {/* Calorie bar */}
      <div className="card mb4">
        <div className="fx-between" style={{ marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 26, fontWeight: 900, color: pct > 100 ? 'var(--red)' : 'var(--green)' }}>{totalCals}</span>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}> / {goal} kcal</span>
          </div>
          <span style={{ fontSize: 13, color: remaining < 0 ? 'var(--red)' : 'var(--green)' }}>
            {remaining >= 0 ? remaining + ' restantes' : '+' + Math.abs(remaining) + ' acima da meta'}
          </span>
        </div>
        <div className="progress" style={{ height: 10 }}>
          <div className={`progress-fill ${pct > 100 ? 'pf-red' : 'pf-green'}`} style={{ width: Math.min(pct, 100) + '%' }} />
        </div>
      </div>

      {/* Meal blocks */}
      {MEAL_DEFS.map(m => {
        const items = meals[m.key] || []
        const mc = items.reduce((s, i) => s + (i.total_cals || 0), 0)
        return (
          <div key={m.key} className="meal-block">
            <div className="meal-block-header">
              <div className="meal-block-name">
                {m.icon} {m.name}
                <span className="meal-block-cal">{mc} kcal</span>
              </div>
              <button className="btn btn-green btn-sm" onClick={() => openAdd(m.key, m.name)}>+ Adicionar</button>
            </div>
            {items.length === 0
              ? <div className="no-food">Nenhum alimento adicionado</div>
              : items.map(item => (
                <div key={item.id} className="food-row">
                  <div>
                    <div className="food-row-name">{item.food_name}</div>
                    <div className="food-row-info">{item.qty} {item.unit}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="food-row-cals">{item.total_cals} kcal</span>
                    <button className="btn btn-red btn-sm" onClick={() => handleRemove(item.id)}>✕</button>
                  </div>
                </div>
              ))
            }
          </div>
        )
      })}

      {/* Add meal modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`➕ Adicionar em: ${selectedMeal?.name}`} width={500}>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Buscar alimento..." value={search} onChange={e => { setSearch(e.target.value); setPickedFood(null) }} />
        </div>
        <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 14 }}>
          {filtered.length === 0
            ? <div style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>Nenhum alimento encontrado.</div>
            : filtered.map(f => (
              <div key={f.id} className={`food-search-item ${pickedFood?.id === f.id ? 'selected' : ''}`} onClick={() => { setPickedFood(f); setQty(1) }}>
                <div className="food-search-item-name">{f.name}</div>
                <div className="food-search-item-info">{f.qty} {f.unit} = {f.cals} kcal</div>
              </div>
            ))
          }
        </div>
        {pickedFood && (
          <>
            <hr className="div" />
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>
              Alimento: <strong style={{ color: 'var(--text)' }}>{pickedFood.name}</strong>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantidade</label>
                <input className="form-input" type="number" step="0.5" min="0.1" value={qty}
                  onChange={e => setQty(parseFloat(e.target.value) || 1)} />
              </div>
              <div className="form-group">
                <label className="form-label">Unidade</label>
                <input className="form-input" value={pickedFood.unit} readOnly style={{ background: 'var(--card2)' }} />
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              Calorias: <strong style={{ color: 'var(--green)', fontSize: 16 }}>{Math.round(qty * pickedFood.cals)}</strong> kcal
            </div>
            <div className="fx-end">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-green" onClick={handleAdd}>✓ Adicionar</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
