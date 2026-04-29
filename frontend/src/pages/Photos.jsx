import { useState, useEffect, useCallback } from 'react'
import Modal from '../components/Modal'
import { getPhotos, addPhoto, deletePhoto } from '../api'
import { getWeight } from '../api'
import { useToast } from '../App'
import { today, fmtFull } from '../utils'

export default function Photos() {
  const showToast = useToast()
  const [photos, setPhotos] = useState([])
  const [weights, setWeights] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [viewPhoto, setViewPhoto] = useState(null)
  const [form, setForm] = useState({ date: today(), note: '' })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)

  const load = useCallback(() => {
    getPhotos().then(setPhotos).catch(() => {})
    getWeight().then(setWeights).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(f)
  }

  const handleSave = async () => {
    if (!form.date) return showToast('Selecione uma data', 'error')
    if (!file) return showToast('Selecione uma foto', 'error')
    const fd = new FormData()
    fd.append('photo', file)
    fd.append('date', form.date)
    fd.append('note', form.note)
    try {
      await addPhoto(fd)
      load(); setModalOpen(false)
      setFile(null); setPreview(null); setForm({ date: today(), note: '' })
      showToast('Foto salva!')
    } catch { showToast('Erro ao salvar foto', 'error') }
  }

  const handleDelete = async (id) => {
    try {
      await deletePhoto(id)
      load(); setViewModal(false); showToast('Foto removida')
    } catch { showToast('Erro ao remover', 'error') }
  }

  const closestWeight = (date) => {
    if (!weights.length) return null
    return weights.reduce((a, b) =>
      Math.abs(new Date(a.date) - new Date(date)) < Math.abs(new Date(b.date) - new Date(date)) ? a : b
    )
  }

  return (
    <div>
      <div className="page-header fx-between">
        <div>
          <div className="page-title">Fotos do Corpo</div>
          <div className="page-sub">Acompanhe sua transformação visual</div>
        </div>
        <button className="btn btn-green" onClick={() => { setForm({ date: today(), note: '' }); setFile(null); setPreview(null); setModalOpen(true) }}>+ Adicionar Foto</button>
      </div>

      {photos.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📸</div>
          <h3>Nenhuma foto adicionada</h3>
          <p>Documente sua evolução com fotos periódicas</p>
        </div>
      ) : (
        <div className="photo-grid">
          {photos.map(p => (
            <div key={p.id} className="photo-card" onClick={() => { setViewPhoto(p); setViewModal(true) }}>
              <img src={`/uploads/${p.filename}`} alt={p.note || 'Foto'} />
              <div className="photo-info">
                <div>{fmtFull(p.date)}</div>
                {p.note && <div>{p.note}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add photo modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="📸 Adicionar Foto" width={460}>
        <div className="form-group">
          <label className="form-label">Data *</label>
          <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Foto *</label>
          <input type="file" accept="image/*" className="form-input" onChange={handleFileChange} />
        </div>
        {preview && (
          <div style={{ marginBottom: 14 }}>
            <img src={preview} style={{ width: '100%', borderRadius: 12, maxHeight: 220, objectFit: 'cover' }} alt="preview" />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Observação</label>
          <input className="form-input" placeholder="ex: Início da dieta" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
        </div>
        <div className="fx-end">
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
          <button className="btn btn-green" onClick={handleSave}>Salvar Foto</button>
        </div>
      </Modal>

      {/* View photo modal */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title={viewPhoto ? `📸 ${fmtFull(viewPhoto.date)}${viewPhoto.note ? ' — ' + viewPhoto.note : ''}` : ''} width={540}>
        {viewPhoto && (
          <>
            <img src={`/uploads/${viewPhoto.filename}`} style={{ width: '100%', borderRadius: 14, maxHeight: 420, objectFit: 'cover', marginBottom: 12 }} alt={viewPhoto.note} />
            {viewPhoto.note && <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 14 }}>{viewPhoto.note}</div>}
            <div className="fx-between">
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                {(() => { const w = closestWeight(viewPhoto.date); return w ? `⚖️ Peso: ${w.weight} kg` : '' })()}
              </span>
              <button className="btn btn-red btn-sm" onClick={() => handleDelete(viewPhoto.id)}>🗑 Excluir</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
