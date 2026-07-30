import https from 'node:https'

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'trae' } }, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    }).on('error', reject)
  })
}

const runs = await get('https://api.github.com/repos/xhjn2023/me/actions/runs?per_page=2')
const j = JSON.parse(runs.body)
const cfRun = j.workflow_runs.find(r => r.name.includes('Cloudflare') && r.head_sha.startsWith('cbddcf')) || j.workflow_runs.find(r => r.name.includes('Cloudflare'))
console.log('Run ID:', cfRun.id, 'commit:', cfRun.head_sha.slice(0,7))

const jobsRes = await get(cfRun.jobs_url)
const jobs = JSON.parse(jobsRes.body)
const deployJob = jobs.jobs.find(j => j.name === 'deploy')
console.log('Job ID:', deployJob.id)
for (const step of deployJob.steps) {
  console.log(`  ${step.number.toString().padStart(2)} [${(step.conclusion||'').padEnd(8)}] ${step.name}`)
}

console.log('\n=== check runs annotations ===')
const checkRes = await get(`https://api.github.com/repos/xhjn2023/me/check-runs/${deployJob.id}/annotations`)
const cj = JSON.parse(checkRes.body)
for (const ann of cj) {
  console.log('\n>>> annotation:', ann.annotation_level, '(path:', ann.path, 'line:', ann.start_line+')')
  const msg = (ann.message || '').slice(0, 5000)
  if (msg) console.log(msg)
  const raw = (ann.raw_details || '').slice(0, 3000)
  if (raw) console.log('---raw:', raw)
}
