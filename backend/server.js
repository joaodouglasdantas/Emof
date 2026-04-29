const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const Database = require('better-sqlite3')
const multer = require('multer')

const app = express()
const PORT = 3001

const DATA_DIR = path.join(__dirname, 'data')
const UPLOADS_DIR = path.join(__dirname, 'uploads')
const DB_PATH = path.join(DATA_DIR, 'emof.db')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS profile (
    id       INTEGER PRIMARY KEY DEFAULT 1,
    name     TEXT    DEFAULT '',
    sex      TEXT    DEFAULT 'male',
    age      INTEGER DEFAULT 0,
    weight   REAL    DEFAULT 0,
    height   REAL    DEFAULT 0,
    activity REAL    DEFAULT 1.55,
    goal     INTEGER DEFAULT 0
  );
  INSERT OR IGNORE INTO profile (id) VALUES (1);

  CREATE TABLE IF NOT EXISTS foods (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    qty        REAL NOT NULL,
    unit       TEXT NOT NULL,
    cals       REAL NOT NULL,
    protein    REAL DEFAULT 0,
    carbs      REAL DEFAULT 0,
    fat        REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS meal_entries (
    id         TEXT PRIMARY KEY,
    date       TEXT NOT NULL,
    meal_type  TEXT NOT NULL,
    food_id    TEXT,
    food_name  TEXT NOT NULL,
    qty        REAL NOT NULL,
    unit       TEXT NOT NULL,
    total_cals REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS weight_log (
    id         TEXT PRIMARY KEY,
    date       TEXT NOT NULL UNIQUE,
    weight     REAL NOT NULL,
    note       TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS photos (
    id         TEXT PRIMARY KEY,
    date       TEXT NOT NULL,
    filename   TEXT NOT NULL,
    note       TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
`)

const foodCount = db.prepare('SELECT COUNT(*) as c FROM foods').get().c
if (foodCount === 0) {
  const insert = db.prepare('INSERT INTO foods (id,name,qty,unit,cals,protein,carbs,fat) VALUES (?,?,?,?,?,?,?,?)')
  const defaults = [
    ['df1',  'Arroz branco cozido',     100, 'g',              130, 2.7,  28,   0.3 ],
    ['df2',  'Feijão cozido',           100, 'g',              77,  4.8,  13.6, 0.5 ],
    ['df3',  'Frango grelhado',         100, 'g',              165, 31,   0,    3.6 ],
    ['df4',  'Carne bovina grelhada',   100, 'g',              217, 26,   0,    12  ],
    ['df5',  'Ovo cozido',              1,   'unidade',        78,  6.3,  0.6,  5.3 ],
    ['df6',  'Pão de forma integral',   1,   'fatia',          69,  3.5,  12,   0.9 ],
    ['df7',  'Leite integral',          200, 'ml',             122, 6.4,  9.6,  6.4 ],
    ['df8',  'Iogurte natural',         170, 'g',              100, 9,    11,   2   ],
    ['df9',  'Banana',                  1,   'unidade',        89,  1.1,  23,   0.3 ],
    ['df10', 'Maçã',                    1,   'unidade',        72,  0.4,  19,   0.2 ],
    ['df11', 'Batata doce cozida',      100, 'g',              86,  1.6,  20,   0.1 ],
    ['df12', 'Aveia em flocos',         40,  'g',              148, 5.2,  26,   2.8 ],
    ['df13', 'Azeite de oliva',         1,   'colher de sopa', 119, 0,    0,    13.5],
    ['df14', 'Queijo minas frescal',    30,  'g',              55,  5.1,  0.4,  3.5 ],
    ['df15', 'Whey Protein',            30,  'g',              113, 22,   3,    2   ],
  ]
  defaults.forEach(r => insert.run(...r))
}

app.use(cors())
app.use(express.json({ limit: '20mb' }))
app.use('/uploads', express.static(UPLOADS_DIR))

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, `${uuidv4()}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } })

app.get('/api/profile', (req, res) => {
  res.json(db.prepare('SELECT * FROM profile WHERE id = 1').get())
})

app.put('/api/profile', (req, res) => {
  const { name, sex, age, weight, height, activity, goal } = req.body
  db.prepare('UPDATE profile SET name=?, sex=?, age=?, weight=?, height=?, activity=?, goal=? WHERE id=1')
    .run(name, sex, age || 0, weight || 0, height || 0, activity || 1.55, goal || 0)
  if (weight) {
    const today = new Date().toISOString().split('T')[0]
    db.prepare('INSERT INTO weight_log (id,date,weight,note) VALUES (?,?,?,\'\') ON CONFLICT(date) DO UPDATE SET weight=excluded.weight')
      .run(uuidv4(), today, weight)
  }
  res.json(db.prepare('SELECT * FROM profile WHERE id = 1').get())
})

app.get('/api/foods', (req, res) => {
  res.json(db.prepare('SELECT * FROM foods ORDER BY name ASC').all())
})

app.post('/api/foods', (req, res) => {
  const { name, qty, unit, cals, protein, carbs, fat } = req.body
  if (!name || !qty || !cals) return res.status(400).json({ error: 'Campos obrigatórios faltando' })
  const id = uuidv4()
  db.prepare('INSERT INTO foods (id,name,qty,unit,cals,protein,carbs,fat) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, name, qty, unit || 'g', cals, protein || 0, carbs || 0, fat || 0)
  res.status(201).json(db.prepare('SELECT * FROM foods WHERE id=?').get(id))
})

app.delete('/api/foods/:id', (req, res) => {
  db.prepare('DELETE FROM foods WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

app.get('/api/meals', (req, res) => {
  const { date } = req.query
  if (!date) return res.status(400).json({ error: 'date param required' })
  const rows = db.prepare('SELECT * FROM meal_entries WHERE date=? ORDER BY created_at ASC').all(date)
  const grouped = { breakfast: [], lunch: [], dinner: [], snacks: [] }
  rows.forEach(r => { if (grouped[r.meal_type]) grouped[r.meal_type].push(r) })
  res.json(grouped)
})

app.post('/api/meals', (req, res) => {
  const { date, meal_type, food_id, food_name, qty, unit, total_cals } = req.body
  if (!date || !meal_type || !food_name) return res.status(400).json({ error: 'Dados incompletos' })
  const id = uuidv4()
  db.prepare('INSERT INTO meal_entries (id,date,meal_type,food_id,food_name,qty,unit,total_cals) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, date, meal_type, food_id || null, food_name, qty || 1, unit || 'g', total_cals || 0)
  res.status(201).json(db.prepare('SELECT * FROM meal_entries WHERE id=?').get(id))
})

app.delete('/api/meals/:id', (req, res) => {
  db.prepare('DELETE FROM meal_entries WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

app.get('/api/meals/summary', (req, res) => {
  const { from, to } = req.query
  if (!from || !to) return res.status(400).json({ error: 'from and to required' })
  const rows = db.prepare(`
    SELECT date, SUM(total_cals) as total_cals
    FROM meal_entries WHERE date >= ? AND date <= ?
    GROUP BY date ORDER BY date ASC
  `).all(from, to)
  res.json(rows)
})

app.get('/api/weight', (req, res) => {
  res.json(db.prepare('SELECT * FROM weight_log ORDER BY date DESC').all())
})

app.post('/api/weight', (req, res) => {
  const { date, weight, note } = req.body
  if (!date || !weight) return res.status(400).json({ error: 'date e weight obrigatórios' })
  db.prepare('INSERT INTO weight_log (id,date,weight,note) VALUES (?,?,?,?) ON CONFLICT(date) DO UPDATE SET weight=excluded.weight, note=excluded.note')
    .run(uuidv4(), date, weight, note || '')
  db.prepare('UPDATE profile SET weight=? WHERE id=1').run(weight)
  res.status(201).json(db.prepare('SELECT * FROM weight_log WHERE date=?').get(date))
})

app.delete('/api/weight/:date', (req, res) => {
  db.prepare('DELETE FROM weight_log WHERE date=?').run(req.params.date)
  res.json({ ok: true })
})

app.get('/api/photos', (req, res) => {
  res.json(db.prepare('SELECT * FROM photos ORDER BY date DESC').all())
})

app.post('/api/photos', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' })
  const { date, note } = req.body
  if (!date) return res.status(400).json({ error: 'date obrigatório' })
  const id = uuidv4()
  db.prepare('INSERT INTO photos (id,date,filename,note) VALUES (?,?,?,?)')
    .run(id, date, req.file.filename, note || '')
  res.status(201).json(db.prepare('SELECT * FROM photos WHERE id=?').get(id))
})

app.delete('/api/photos/:id', (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id=?').get(req.params.id)
  if (photo) {
    const filePath = path.join(UPLOADS_DIR, photo.filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    db.prepare('DELETE FROM photos WHERE id=?').run(req.params.id)
  }
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`Emof backend rodando em http://localhost:${PORT}`)
})
