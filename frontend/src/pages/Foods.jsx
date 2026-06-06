import { useState, useEffect, useCallback } from 'react'
import { Salad, Search, Trash2, Pencil } from 'lucide-react'
import Modal from '../components/Modal'
import { getFoods, addFood, updateFood, deleteFood } from '../api'
import { useToast } from '../App'

const UNITS = ['g','ml','unidade','colher de sopa','colher de chá','xícara','fatia','porção','copo (200ml)','prato']

const EMPTY_FORM = { name:'', qty:'', unit:'g', cals:'', protein:'', carbs:'', fat:'' }

export default function Foods() {
  const showToast = useToast()
  const [foods, setFoods] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)  // null = novo, id = editando
  const [form, setForm] = useState(EMPTY_FORM)

  const load = useCallback(() => getFoods().then(setFoods).catch(() => {}), [])
  useEffect(() => { load() }, [load])

  const filtered = foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  const openNew = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (f) => {
    setEditingId(f.id)
    setForm({ name: f.name, qty: String(f.qty), unit: f.unit, cals: String(f.cals), protein: String(f.protein || ''), carbs: String(f.carbs || ''), fat: String(f.fat || '') })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.qty || !form.cals) return showToast('Preencha nome, porção e calorias', 'error')
    const data = { ...form, qty: parseFloat(form.qty), cals: parseFloat(form.cals), protein: parseFloat(form.protein)||0, carbs: parseFloat(form.carbs)||0, fat: parseFloat(form.fat)||0 }
    try {
      if (editingId) {
        await updateFood(editingId, data)
        showToast('Alimento atualizado!')
      } else {
        await addFood(data)
        showToast('Alimento cadastrado!')
      }
      load(); setModalOpen(false); setForm(EMPTY_FORM); setEditingId(null)
    } catch { showToast('Erro ao salvar', 'error') }
  }

  const handleDelete = async (id) => {
    try { await deleteFood(id); load(); showToast('Alimento removido') }
    catch { showToast('Erro ao remover', 'error') }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      <div className="page-header fx-between">
        <div>
          <div className="page-title">Alimentos</div>
          <div className="page-sub">Banco de alimentos cadastrados</div>
        </div>
        <button className="btn btn-green" onClick={openNew}>+ Novo Alimento</button>
      </div>

      <div className="search-wrap">
        <span className="search-icon"><Search size={16} /></span>
        <input className="form-input" placeholder="Buscar alimento..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Salad size={48} strokeWidth={1} /></div>
            <h3>Nenhum alimento encontrado</h3>
            <p>Adicione alimentos para montar suas refeições</p>
          </div>
        ) : (
          <div className="table-wrap"><table className="table">
            <thead>
              <tr><th>Alimento</th><th>Porção</th><th>Calorias</th><th>Proteína</th><th>Carb.</th><th>Gordura</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td title={f.name}><strong>{f.name}</strong></td>
                  <td>{f.qty} {f.unit}</td>
                  <td><span className="badge badge-green">{f.cals} kcal</span></td>
                  <td>{f.protein ? f.protein + 'g' : '—'}</td>
                  <td>{f.carbs   ? f.carbs   + 'g' : '—'}</td>
                  <td>{f.fat     ? f.fat     + 'g' : '—'}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(f)}>
                      <Pencil size={13} />
                    </button>
                    <button className="btn btn-red btn-sm" onClick={() => handleDelete(f.id)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Alimento' : 'Novo Alimento'}>
        <div className="form-group">
          <label className="form-label">Nome do Alimento *</label>
          <input className="form-input" placeholder="ex: Arroz branco cozido" value={form.name} onChange={set('name')} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Quantidade da Porção *</label>
            <input className="form-input" type="number" step="0.1" placeholder="ex: 100" value={form.qty} onChange={set('qty')} />
          </div>
          <div className="form-group">
            <label className="form-label">Unidade *</label>
            <select className="form-input" value={form.unit} onChange={set('unit')}>
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Calorias por Porção (kcal) *</label>
          <input className="form-input" type="number" placeholder="kcal" value={form.cals} onChange={set('cals')} />
        </div>
        <div className="form-row3">
          <div className="form-group">
            <label className="form-label">Proteínas (g)</label>
            <input className="form-input" type="number" step="0.1" placeholder="0" value={form.protein} onChange={set('protein')} />
          </div>
          <div className="form-group">
            <label className="form-label">Carboidratos (g)</label>
            <input className="form-input" type="number" step="0.1" placeholder="0" value={form.carbs} onChange={set('carbs')} />
          </div>
          <div className="form-group">
            <label className="form-label">Gorduras (g)</label>
            <input className="form-input" type="number" step="0.1" placeholder="0" value={form.fat} onChange={set('fat')} />
          </div>
        </div>
        <div className="fx-end">
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
          <button className="btn btn-green" onClick={handleSave}>
            {editingId ? 'Salvar Alterações' : 'Salvar Alimento'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
