import { test } from 'node:test'
import assert from 'node:assert'
import { Rating } from 'ts-fsrs'
import {
  newCard, reviewCard, getDueCards, serializeCard, deserializeCard,
  computeStreak, countMastered, previewRatings, RATINGS
} from '../src/db/englishStore.js'

test('newCard 创建状态为 New 的卡片', () => {
  const card = newCard()
  assert.strictEqual(card.state, 0) // State.New
  assert.strictEqual(card.stability, 0)
  assert.strictEqual(card.difficulty, 0)
})

test('reviewCard 应用评分后更新 due 且间隔符合记忆曲线', () => {
  const now = new Date('2026-08-16T10:00:00Z')
  const again = reviewCard(newCard(), Rating.Again, now)
  const hard = reviewCard(newCard(), Rating.Hard, now)
  const good = reviewCard(newCard(), Rating.Good, now)
  const easy = reviewCard(newCard(), Rating.Easy, now)

  // 评分越高，下次复习越晚
  assert.ok(again.due.getTime() > now.getTime(), 'Again 也应大于 now')
  assert.ok(good.due.getTime() > again.due.getTime(), 'Good 间隔应大于 Again')
  assert.ok(easy.due.getTime() >= good.due.getTime(), 'Easy 间隔应大于等于 Good')
  assert.ok(hard.due.getTime() > again.due.getTime(), 'Hard 间隔应大于 Again')
})

test('previewRatings 返回四档预览且含 due', () => {
  const now = new Date('2026-08-16T10:00:00Z')
  const preview = previewRatings(newCard(), now)
  assert.strictEqual(preview.length, 4)
  preview.forEach(p => {
    assert.ok(p.due instanceof Date)
    assert.ok(['again', 'hard', 'good', 'easy'].includes(p.key))
  })
})

test('getDueCards 只返回到期或未排期的卡片', () => {
  const now = new Date('2026-08-16T10:00:00Z')
  const past = { due: new Date('2026-08-16T09:00:00Z') }
  const future = { due: new Date('2026-08-17T10:00:00Z') }
  const nullDue = { due: null }
  const result = getDueCards([past, future, nullDue], now)
  assert.strictEqual(result.length, 2)
  assert.ok(result.includes(past))
  assert.ok(result.includes(nullDue))
  assert.ok(!result.includes(future))
})

test('serializeCard 与 deserializeCard 往返一致', () => {
  const now = new Date('2026-08-16T10:00:00Z')
  const reviewed = reviewCard(newCard(), Rating.Good, now)
  const s = serializeCard(reviewed)

  // 序列化后 due / last_review 为数字时间戳
  assert.strictEqual(typeof s.due, 'number')
  assert.strictEqual(typeof s.last_review, 'number')

  const restored = deserializeCard(s)
  assert.ok(restored.due instanceof Date)
  assert.ok(restored.last_review instanceof Date)
  assert.strictEqual(restored.due.getTime(), reviewed.due.getTime())
  assert.strictEqual(restored.stability, reviewed.stability)
  assert.strictEqual(restored.difficulty, reviewed.difficulty)
  assert.strictEqual(restored.state, reviewed.state)
})

test('deserializeCard 空值回退为新卡', () => {
  const card = deserializeCard(null)
  assert.strictEqual(card.state, 0)
})

test('computeStreak 计算连续天数', () => {
  const tz = new Date().getTimezoneOffset() * 60000
  const day = (offset) => new Date(new Date(Date.now() - offset * 86400000) - tz).toISOString().slice(0, 10)

  assert.strictEqual(computeStreak([day(0), day(1), day(2)]), 3, '连续三天')
  assert.strictEqual(computeStreak([day(1), day(2)]), 2, '从昨天开始连续')
  assert.strictEqual(computeStreak([day(2)]), 0, '前天断档')
  assert.strictEqual(computeStreak([]), 0, '空集合')
  assert.strictEqual(computeStreak([day(0)]), 1, '仅今天')
})

test('countMastered 统计 Review 状态且稳定的卡片', () => {
  const mastered = { state: 2, stability: 3 }
  const reviewUnstable = { state: 2, stability: 0.5 }
  const learning = { state: 1, stability: 0 }
  const fresh = { state: 0, stability: 0 }
  assert.strictEqual(countMastered([mastered, reviewUnstable, learning, fresh]), 1)
})

test('RATINGS 与 ts-fsrs Rating 对齐', () => {
  assert.strictEqual(RATINGS.length, 4)
  assert.deepStrictEqual(RATINGS.map(r => r.rating), [1, 2, 3, 4])
})
