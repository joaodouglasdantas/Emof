export const today = () => new Date().toISOString().split('T')[0]

export const fmtLong = (d) =>
  new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

export const fmtShort = (d) =>
  new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

export const fmtFull = (d) =>
  new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

export const shiftDate = (dateStr, delta) => {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().split('T')[0]
}

export const calcBMR = ({ sex, weight, height, age }) => {
  const w = parseFloat(weight), h = parseFloat(height), a = parseInt(age)
  if (!w || !h || !a) return 0
  return sex === 'male' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161
}

export const calcTDEE = (profile) =>
  Math.round(calcBMR(profile) * parseFloat(profile.activity || 1.55))

export const calcBMI = (weight, height) => {
  const hm = parseFloat(height) / 100
  return parseFloat(weight) / (hm * hm)
}

export const bmiCategory = (bmi) => {
  if (bmi < 18.5) return { label: 'Abaixo do peso', color: '#4499ff' }
  if (bmi < 25)   return { label: 'Peso normal',    color: 'var(--green)' }
  if (bmi < 30)   return { label: 'Sobrepeso',       color: 'var(--yellow)' }
  if (bmi < 35)   return { label: 'Obesidade I',     color: '#ff8800' }
  return               { label: 'Obesidade II+',  color: 'var(--red)' }
}

export const getLast14Days = () => {
  const days = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}
