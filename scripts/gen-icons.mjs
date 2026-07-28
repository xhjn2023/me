// 临时脚本:把 icon-1024.jpg 缩放出 PWA 需要的 192/512/180 PNG 图标
import { Jimp } from 'jimp'

const src = 'public/icon-1024.jpg'

async function gen(size, out) {
  const img = await Jimp.read(src)
  img.resize({ w: size, h: size })
  await img.write(out)
  console.log(`✅ 生成 ${out} (${size}x${size})`)
}

await gen(192, 'public/icon-192.png')
await gen(512, 'public/icon-512.png')
await gen(180, 'public/apple-touch-icon.png')
console.log('全部图标生成完成')
