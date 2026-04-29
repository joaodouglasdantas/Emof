# 🚀 Como Rodar o Emof

## Pré-requisitos
- [Node.js 18+](https://nodejs.org) instalado

## Primeira vez (setup)

Abra o terminal na pasta do projeto e rode:

```bash
# 1. Instalar dependências de todos os pacotes de uma vez
npm run install:all
```

## Rodar o projeto

```bash
npm run dev
```

Isso inicia o **backend** (porta 3001) e o **frontend** (porta 5173) ao mesmo tempo.

Abra no navegador: **http://localhost:5173**

---

## Estrutura do projeto

```
Emof/
├── package.json          ← scripts raiz (concurrently)
├── backend/
│   ├── server.js         ← API Express + SQLite
│   ├── data/emof.db      ← banco de dados (criado automaticamente)
│   └── uploads/          ← fotos salvas aqui
└── frontend/
    ├── vite.config.js    ← proxy /api → backend
    └── src/
        ├── App.jsx        ← roteamento e contexto global
        ├── api.js         ← chamadas HTTP (axios)
        ├── utils.js       ← cálculos (BMI, TDEE, datas)
        ├── components/    ← Sidebar, Modal
        └── pages/         ← Dashboard, Meals, Foods, Weight, Photos, Insights, Profile
```

## API Backend (porta 3001)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/PUT | `/api/profile` | Perfil do usuário |
| GET/POST/DELETE | `/api/foods` | Banco de alimentos |
| GET | `/api/meals?date=YYYY-MM-DD` | Refeições do dia |
| POST/DELETE | `/api/meals` | Adicionar/remover item |
| GET | `/api/meals/summary?from=&to=` | Resumo calórico por período |
| GET/POST/DELETE | `/api/weight` | Registro de peso |
| GET/POST/DELETE | `/api/photos` | Fotos do corpo |
