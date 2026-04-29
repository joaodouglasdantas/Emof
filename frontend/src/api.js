import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getProfile    = () => api.get('/profile').then(r => r.data)
export const updateProfile = (data) => api.put('/profile', data).then(r => r.data)

export const getFoods   = () => api.get('/foods').then(r => r.data)
export const addFood    = (data) => api.post('/foods', data).then(r => r.data)
export const deleteFood = (id) => api.delete(`/foods/${id}`)

export const getMeals       = (date) => api.get('/meals', { params: { date } }).then(r => r.data)
export const addMealEntry   = (data) => api.post('/meals', data).then(r => r.data)
export const deleteMealEntry = (id) => api.delete(`/meals/${id}`)
export const getMealSummary = (from, to) =>
  api.get('/meals/summary', { params: { from, to } }).then(r => r.data)

export const getWeight   = () => api.get('/weight').then(r => r.data)
export const addWeight   = (data) => api.post('/weight', data).then(r => r.data)
export const deleteWeight = (date) => api.delete(`/weight/${date}`)

export const getPhotos  = () => api.get('/photos').then(r => r.data)
export const addPhoto   = (formData) =>
  api.post('/photos', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
export const deletePhoto = (id) => api.delete(`/photos/${id}`)
