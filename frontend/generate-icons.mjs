// Roda com: node generate-icons.mjs
// Gera icon-192.png e icon-512.png na pasta public/
import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Fundo
  ctx.fillStyle = '#08080f'
  ctx.fillRect(0, 0, size, size)

  // Círculo de fundo
  const cx = size / 2
  const cy = size / 2
  const r  = size * 0.42
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  grad.addColorStop(0, '#00d884')
  grad.addColorStop(1, '#ff4757')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  // Texto "e"
  ctx.fillStyle = '#08080f'
  ctx.font = `900 ${size * 0.44}px "Arial Black", Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('e', cx, cy + size * 0.02)

  return canvas.toBuffer('image/png')
}

writeFileSync('public/icon-192.png', drawIcon(192))
writeFileSync('public/icon-512.png', drawIcon(512))
console.log('✓ Ícones gerados: public/icon-192.png e public/icon-512.png')
