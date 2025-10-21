import React,{useMemo,useRef,useState} from 'react'
type Row=Record<string,number|string>
const parse=(t:string):Row[]=>{const L=t.trim().split(/\r?\n/);if(!L.length)return[];const H=L[0].split(',').map(h=>h.trim());return L.slice(1).map(l=>{const c=l.split(',');const r:Row={};H.forEach((h,i)=>r[h]=c[i]??'');return r})}
const z=(a:number[])=>{const n=a.length,m=a.reduce((x,y)=>x+y,0)/(n||1),v=a.reduce((s,x)=>s+(x-m)**2,0)/(n||1),s=Math.sqrt(v||1);return a.map(x=>(x-m)/(s||1))}
const corr=(x:number[],y:number[])=>{const n=Math.min(x.length,y.length);if(!n)return 0;const X=z(x),Y=z(y);let s=0;for(let i=0;i<n;i++)s+=X[i]*Y[i];return s/(n||1)}
export default function GraphDemoV2(){
  const[rows,setRows]=useState<Row[]>([]);const[perf,setPerf]=useState('performance');const[a,setA]=useState(0.3);const[W,setW]=useState<Record<string,number>>({});const[upd,setUpd]=useState<string>('')
  const[athlete,setAthlete]=useState<'weekend_warrior'|'existing_elite'|'young_talent'>('weekend_warrior')
  const[goals,setGoals]=useState<Row[]|null>(null)
  const[goalAware,setGoalAware]=useState(true)
  const fileInputRef=useRef<HTMLInputElement>(null)
  const cols=useMemo(()=>rows[0]?Object.keys(rows[0]):[],[rows])
  const num=useMemo(()=>cols.filter(c=>rows.every(r=>r[c]===''||!isNaN(Number(r[c])))),[cols,rows])
  const factors=useMemo(()=>num.filter(c=>c!==perf&&c!=='user_id'&&c!=='session_ts'),[num,perf])
  const onFile=(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const R=new FileReader();R.onload=()=>{setRows(parse(String(R.result||'')));setW({});setGoals(null);setUpd('')};R.readAsText(f)}
  const loadSample=async()=>{try{const r=await fetch('/sample-data/talent_scout_demo.csv');const t=await r.text();setRows(parse(t));setW({});setGoals(null);setUpd('');setPerf('performance')}catch{}}
  const loadAthleteSessions=async()=>{try{const r=await fetch(`/sample-data/athletes/${athlete}_sessions.csv`);const t=await r.text();setRows(parse(t));setUpd('');}catch{}}
  const loadAthleteWeights=async()=>{try{const r=await fetch(`/sample-data/athletes/${athlete}_weights.csv`);const t=await r.text();const lines=t.trim().split(/\r?\n/);if(!lines.length)return;const headers=lines[0].split(',').map(h=>h.trim());const fi=headers.indexOf('factor'), wi=headers.indexOf('weight');const map:Record<string,number>={};lines.slice(1).forEach(l=>{const c=l.split(',');const f=c[fi];const w=parseFloat(c[wi]);if(f)map[f]=isNaN(w)?0:w});setW(map);setUpd(new Date().toLocaleTimeString())}catch{}}
  const loadAthleteGoals=async()=>{try{const r=await fetch(`/sample-data/athletes/${athlete}_goals_stats.csv`);const t=await r.text();setGoals(parse(t));setUpd(new Date().toLocaleTimeString())}catch{}}
  
  // Ridge regression seed (model-based weights)
  const solve=(A:number[][],b:number[]):number[]=>{const n=b.length;const M=A.map((row,i)=>[...row,b[i]]);for(let c=0;c<n;c++){let piv=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[piv][c]))piv=r; if(Math.abs(M[piv][c])<1e-9)continue; if(piv!==c){const t=M[c];M[c]=M[piv];M[piv]=t}const div=M[c][c];for(let j=c;j<=n;j++)M[c][j]/=div;for(let r=0;r<n;r++)if(r!==c){const f=M[r][c];for(let j=c;j<=n;j++)M[r][j]-=f*M[c][j]}}return M.map(row=>row[n])}
  const computeModel=()=>{ if(!rows.length)return; const p=factors.length, n=rows.length; if(p===0||n===0){setW({});return} const yZ=z(rows.map(r=>Number(r[perf]??0))); const Zcols=factors.map(f=>z(rows.map(r=>Number(r[f]??0)))); const lambda=0.25; const XtX=Array.from({length:p},()=>Array(p).fill(0)); const Xty=Array(p).fill(0); for(let i=0;i<p;i++){for(let k=0;k<n;k++)Xty[i]+=Zcols[i][k]*yZ[k]; for(let j=i;j<p;j++){let s=0; for(let k=0;k<n;k++)s+=Zcols[i][k]*Zcols[j][k]; if(i===j)s+=lambda; XtX[i][j]=XtX[j][i]=s}} const beta=solve(XtX,Xty); const m=Math.max(1e-6,...beta.map(Math.abs)); const out:Record<string,number>={}; factors.forEach((f,i)=>out[f]=beta[i]/m); setW(out); setUpd(new Date().toLocaleTimeString()) }
  const goalScale=()=>{if(!goalAware) return 1; if(!goals||!goals.length||!rows.length)return 1;const g=(goals.find(g=>String(g['metric']||'').toLowerCase().includes('power'))||goals[0]) as any;const target=Number(g.target||g['target']);const current=Number(g.current||g['current']);if([target,current].some(isNaN))return 1;const needUp=target>current;const k=Math.max(1,Math.floor(rows.length*0.1));const recent=rows.slice(-k).map(r=>Number(r[perf]??0));const prev=rows.slice(-2*k,-k).map(r=>Number(r[perf]??0));const avg=(arr:number[])=>arr.length?arr.reduce((s,x)=>s+x,0)/arr.length:0;const trendUp=avg(recent)>avg(prev);if(needUp&&trendUp)return 1.2;if(!needUp&&!trendUp)return 1.2;return 0.9}
  const update=()=>{if(!rows.length)return;const k=Math.max(1,Math.floor(rows.length*0.1)),recent=rows.slice(-k),yr=recent.map(r=>Number(r[perf]??0));const s=goalScale();const w={...W};factors.forEach(c=>{const xr=recent.map(r=>Number(r[c]??0));const nw=corr(xr,yr)*s;w[c]=(1-a)*(w[c]??0)+a*nw});setW(w);setUpd(new Date().toLocaleTimeString())}
  const size=520,ctr={x:size/2,y:size/2},rad=190
  const nodes=useMemo(()=>{const n=[{id:'Performance',x:ctr.x,y:ctr.y}];const N=factors.length;factors.forEach((f,i)=>{const ang=2*Math.PI*i/Math.max(1,N);n.push({id:f,x:ctr.x+rad*Math.cos(ang),y:ctr.y+rad*Math.sin(ang)})});return n},[factors])
  const edges=useMemo(()=>factors.map(f=>({s:f,t:'Performance',w:W[f]??0})),[factors,W])
  return <div style={{padding:16,maxWidth:1000,margin:'0 auto'}}>
    <h2>Graph Demo V2 (POC)</h2>
    <div style={{marginTop:8,padding:12,border:'1px solid #e5e7eb',borderRadius:8,background:'#fafafa'}}>
      <strong>How to use</strong>
      <ul style={{margin:'8px 0 0 16px'}}>
        <li><strong>Data</strong>: Click <em>Load sample</em> or use <em>Upload CSV</em> (wide format).</li>
        <li><strong>Configure</strong>: Pick the performance column (the outcome you care about).</li>
        <li><strong>Compute</strong>: Press <em>Compute Weights</em> to see factor → performance influences.</li>
        <li><strong>Update</strong>: Press <em>Update Weights</em> to emphasize the latest data (EMA). {goalAware ? '(Goal-aware on if goals loaded)' : ''}</li>
      </ul>
      <div style={{marginTop:8}}>
        Sample downloads:
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:6}}>
          <a href="/sample-data/talent_scout_demo.csv" download style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',textDecoration:'none'}}>Download Combined CSV</a>
          <a href="/sample-data/athletes/weekend_warrior_sessions.csv" download style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',textDecoration:'none'}}>WW Sessions</a>
          <a href="/sample-data/athletes/weekend_warrior_weights.csv" download style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',textDecoration:'none'}}>WW Weights</a>
          <a href="/sample-data/athletes/weekend_warrior_goals_stats.csv" download style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',textDecoration:'none'}}>WW Goals/Stats</a>
          <a href="/sample-data/athletes/existing_elite_sessions.csv" download style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',textDecoration:'none'}}>Elite Sessions</a>
          <a href="/sample-data/athletes/existing_elite_weights.csv" download style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',textDecoration:'none'}}>Elite Weights</a>
          <a href="/sample-data/athletes/existing_elite_goals_stats.csv" download style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',textDecoration:'none'}}>Elite Goals/Stats</a>
          <a href="/sample-data/athletes/young_talent_sessions.csv" download style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',textDecoration:'none'}}>Talent Sessions</a>
          <a href="/sample-data/athletes/young_talent_weights.csv" download style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',textDecoration:'none'}}>Talent Weights</a>
          <a href="/sample-data/athletes/young_talent_goals_stats.csv" download style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',textDecoration:'none'}}>Talent Goals/Stats</a>
        </div>
      </div>
    </div>
    <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
      <input ref={fileInputRef} type='file' accept='.csv,text/csv' onChange={onFile} style={{display:'none'}}/>
      <button title='Upload a wide CSV with numeric factor columns and one outcome column (e.g., performance)' style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',cursor:'pointer'}} onClick={()=>fileInputRef.current?.click()}>Upload CSV</button>
      {cols.length>0&&<label title='Choose the dependent/target column (e.g., power or performance)'>Performance<select value={perf} onChange={e=>setPerf(e.target.value)} style={{marginLeft:6}}>{num.map(c=><option key={c} value={c}>{c}</option>)}</select></label>}
      <button style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',cursor:'pointer'}} onClick={loadSample}>Load sample</button>
      <button title='Compute initial weights from a small ridge regression (normalized coefficients)' style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',cursor:'pointer'}} onClick={computeModel} disabled={!rows.length}>Compute Weights</button>
      <label title='Smoothing for online updates (higher = react more to recent data)'>alpha<input type='range' min={0.05} max={0.9} step={0.05} value={a} onChange={e=>setA(Number(e.target.value))} style={{marginLeft:6}}/><span style={{marginLeft:6}}>{a.toFixed(2)}</span></label>
      <button title='Update weights using the most recent slice of data' style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',cursor:'pointer'}} onClick={update} disabled={!rows.length}>Update Weights</button>
      {upd&&<span>Updated: {upd}</span>}
    </div>
    <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginTop:8}}>
      <label>Athlete<select value={athlete} onChange={e=>setAthlete(e.target.value as any)} style={{marginLeft:6}}>
        <option value='weekend_warrior'>Weekend Warrior</option>
        <option value='existing_elite'>Existing Elite</option>
        <option value='young_talent'>Young Talent</option>
      </select></label>
      <button style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',cursor:'pointer'}} onClick={loadAthleteSessions}>Load sessions</button>
      <button style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',cursor:'pointer'}} onClick={loadAthleteWeights}>Load weights</button>
      <button style={{padding:'6px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',cursor:'pointer'}} onClick={loadAthleteGoals}>Load goals</button>
      <label title='If enabled, updates emphasize trends that move toward your goal'>
        <input type='checkbox' checked={goalAware} onChange={e=>setGoalAware(e.target.checked)} style={{marginRight:6}}/>
        Goal‑aware updates
      </label>
      {goals&&<span>Goals loaded</span>}
    </div>
    <div style={{display:'flex',gap:20,marginTop:16,alignItems:'flex-start',flexWrap:'wrap'}}>
      <svg width={size} height={size} style={{border:'1px solid #eee',borderRadius:8}}>
        {edges.map(e=>{const s=nodes.find(n=>n.id===e.s)!,t=nodes.find(n=>n.id===e.t)!;const w=Math.abs(e.w),stroke=e.w>=0?'#16a34a':'#dc2626',sw=1+6*Math.min(1,w);return <line key={e.s} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={stroke} strokeWidth={sw} opacity={0.85}/>})}
        {nodes.map(n=>{const perf=n.id==='Performance';return <g key={n.id}><circle cx={n.x} cy={n.y} r={perf?24:18} fill={perf?'#3b82f6':'#64748b'}/><text x={n.x} y={n.y+4} textAnchor='middle' fontSize={perf?12:10} fill='#fff'>{perf?'Performance':n.id}</text></g>})}
      </svg>
      <div style={{minWidth:260}}>
        <h3>Weights</h3>
        <div style={{fontSize:12,color:'#555',margin:'6px 0 10px'}}>
          Legend: green = positive influence, red = negative; width = strength.
        </div>
        <ul style={{listStyle:'none',padding:0,margin:0}}>
          {factors.map(f=>{const w=W[f]??0;const c=w>=0?'#16a34a':'#dc2626';return <li key={f} style={{marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',fontFamily:'monospace'}}><span>{f}</span><span>{w.toFixed(3)}</span></div><div style={{height:6,background:'#eee',borderRadius:4}}><div style={{width:`${Math.min(100,Math.abs(w)*100)}%`,height:6,background:c,borderRadius:4}}/></div></li>})}
        </ul>
        {Object.keys(W).length>0 && (
          <div style={{marginTop:16}}>
            <h4>Recommendations</h4>
            <ul style={{listStyle:'disc',paddingLeft:16,fontSize:13}}>
              {factors.slice().sort((a,b)=>Math.abs((W[b]??0)) - Math.abs((W[a]??0))).slice(0,5).map(f=>{
                const w=W[f]??0; const dir=w>=0?'Increase':'Reduce'; const why=w>=0?'positively associated with performance':'negatively associated with performance'
                return <li key={f}><strong>{dir}</strong> {f} — {why} (weight {w.toFixed(2)})</li>
              })}
            </ul>
            <div style={{color:'#666',fontSize:12,marginTop:6}}>Demo-only guidance. Apply domain limits and safety checks before acting.</div>
          </div>
        )}
      </div>
    </div>
    {!rows.length&&<div style={{marginTop:12,color:'#666'}}>Upload a simple CSV (numeric factors + performance).</div>}
  </div>
}




