// src/puzzles/LogicGatePuzzle.js
// SVG schematic-style logic gate puzzle (grid, white gates with black outlines, circular ports, red wires for signal=1)

export class LogicGatePuzzle {
  constructor({ onSolved } = {}) {
    this.onSolved = onSolved;
    this.ui = null;
    this.attached = false;

    this.nodes = new Map(); // id -> { id, kind, x,y, inputs:[{from}|null]*n, el:<g> }
    this.connections = [];  // { from, to, inIdx, path }
    this.pendingFrom = null; // { id }
    this.dragWire = null; // { fromId, start:{x,y}, path }

  // Simplified palette: puzzle is solvable with just 2 gates
  this.inventory = { XOR:1, AND:0, OR:1, NOT:0 };
    this.inputVals = { A:0, B:0, C:0 };
    this.ids = { next:1 };

    this.targetTruth = this.buildTargetTruth();
  }

  buildTargetTruth(){
    // Simpler target: F = (A XOR B) OR C  -> solvable with 2 gates (XOR + OR)
    const table = [];
    const combos = [
      [0,0,0],[0,0,1],[0,1,0],[0,1,1],
      [1,0,0],[1,0,1],[1,1,0],[1,1,1]
    ];
    for(const [a,b,c] of combos){
      const f = ((a ^ b) | c);
      table.push(f & 1);
    }
    return table; // order corresponds to combos above
  }

  attach(){ if(this.attached) return; this.ensureStyles(); this.buildUI(); this.attached = true; }
  open(){ if(!this.attached) this.attach(); this.ui.classList.remove('hidden'); window.disablePlayerControls = true; if(document.pointerLockElement) document.exitPointerLock(); document.body.style.cursor='default'; this.evaluateAndRender(); }
  close(){ if(!this.ui) return; this.ui.classList.add('hidden'); window.disablePlayerControls = false; }
  dispose(){
    if(this._onWindowPointerMove){ window.removeEventListener('pointermove', this._onWindowPointerMove, true); this._onWindowPointerMove=null; }
    if(this._onWindowPointerUp){ window.removeEventListener('pointerup', this._onWindowPointerUp, true); this._onWindowPointerUp=null; }
    if(!this.ui) return; this.ui.remove(); this.ui=null; this.attached=false; }

  ensureStyles(){
    if(document.getElementById('logic-svg-styles')) return;
    const css = `
      #logicSchematic.hidden{display:none}
      #logicSchematic{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:10000}
      #logicSchematic .wrap{background:#f4f6fb;border:1px solid #cfd6e2;border-radius:10px;box-shadow:0 10px 35px rgba(0,0,0,.35);width:min(1000px,95vw);height:min(640px,92vh);display:grid;grid-template-rows:auto 1fr auto}
      #logicSchematic .top{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #cfd6e2;background:#fff}
      #logicSchematic .palette{display:flex;gap:8px;align-items:center}
      #logicSchematic .pill{background:#fff;border:2px solid #000;border-radius:16px;padding:6px 10px;cursor:grab;user-select:none}
      #logicSchematic .pill[disabled]{opacity:.4;cursor:not-allowed}
  #logicSchematic .buttons button{margin-left:8px;padding:6px 10px;border:1px solid #aab4c6;border-radius:6px;background:#fff;cursor:pointer}
      #logicSchematic .canvas{position:relative;background-size:24px 24px;background-image:linear-gradient(to right, #e5e7ef 1px, transparent 1px),linear-gradient(to bottom, #e5e7ef 1px, transparent 1px)}
      #logicSchematic .io{display:flex;gap:10px;align-items:center}
      #logicSchematic .io .badge{display:inline-block;padding:6px 10px;border-radius:10px;border:2px solid #000;background:#fff;font-weight:700}
      #logicSchematic .io .badge.on{background:#dff7e7;border-color:#1b5e20}
  #logicSchematic .hint{font-size:12px;color:#555;margin-left:6px}
      .gate-body{fill:#fff;stroke:#000;stroke-width:2}
      .port{fill:#fff;stroke:#000;stroke-width:2;cursor:crosshair}
      .wire{fill:none;stroke:#b7bdc9;stroke-width:4;stroke-linecap:round}
      .wire.on{stroke:#c01616}
      .wire.pending{stroke:#7b8aa7;stroke-dasharray:8 6}
    `;
    const style=document.createElement('style'); style.id='logic-svg-styles'; style.textContent=css; document.head.appendChild(style);
  }

  buildUI(){
    const modal = document.createElement('div'); modal.id='logicSchematic'; modal.className='hidden';
    modal.innerHTML = `
      <div class="wrap">
        <div class="top">
          <div class="palette">
            <div class="pill" data-kind="XOR">XOR × <span data-count="XOR"></span></div>
            <div class="pill" data-kind="AND">AND × <span data-count="AND"></span></div>
            <div class="pill" data-kind="OR">OR × <span data-count="OR"></span></div>
            <div class="pill" data-kind="NOT">NOT × <span data-count="NOT"></span></div>
            <span class="hint">Hint: solvable with 2 gates</span>
          </div>
          <div class="io">
            <span>A = <strong class="valA">0</strong></span><button class="btnA">Toggle A</button>
            <span>B = <strong class="valB">0</strong></span><button class="btnB">Toggle B</button>
            <span>C = <strong class="valC">0</strong></span><button class="btnC">Toggle C</button>
            <span class="badge pass">PASS: OFF</span>
          </div>
          <div class="buttons"><button class="btnCheck">Check All Combos</button><button class="btnClear">Clear</button><button class="btnClose">Close</button></div>
        </div>
        <div class="canvas"><svg class="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 460" preserveAspectRatio="xMidYMid meet"></svg></div>
        <div style="height:6px"></div>
      </div>`;
    document.body.appendChild(modal);
    this.ui = modal; this.svg = modal.querySelector('svg');

    // palette counts and disable zero-count pills
    ['XOR','AND','OR','NOT'].forEach(k=>{ 
      const count=this.inventory[k];
      modal.querySelector(`[data-count="${k}"]`).textContent=count; 
      if(count<=0){ modal.querySelector(`[data-kind="${k}"]`).setAttribute('disabled',''); }
    });

    // IO nodes
    this.nodeA = this.addIONode('INPUT_A', 40, 90, 'A');
    this.nodeB = this.addIONode('INPUT_B', 40, 200, 'B');
    this.nodeC = this.addIONode('INPUT_C', 40, 310, 'C');
    this.nodePASS = this.addIONode('OUTPUT_PASS', 820, 200, 'PASS');

    // buttons
    modal.querySelector('.btnA').addEventListener('click', ()=>{ this.inputVals.A^=1; modal.querySelector('.valA').textContent=this.inputVals.A; this.evaluateAndRender(); });
    modal.querySelector('.btnB').addEventListener('click', ()=>{ this.inputVals.B^=1; modal.querySelector('.valB').textContent=this.inputVals.B; this.evaluateAndRender(); });
    modal.querySelector('.btnC').addEventListener('click', ()=>{ this.inputVals.C^=1; modal.querySelector('.valC').textContent=this.inputVals.C; this.evaluateAndRender(); });
    modal.querySelector('.btnClose').addEventListener('click', ()=>this.close());
    modal.querySelector('.btnClear').addEventListener('click', ()=>this.reset());
    modal.querySelector('.btnCheck').addEventListener('click', ()=>this.checkAllCombos());

    // palette drag-to-create
    modal.querySelectorAll('.pill').forEach(pill=>{
      const kind = pill.dataset.kind; let ghost=null;
      const move=(e)=>{ if(!ghost) return; ghost.style.left=`${e.clientX+6}px`; ghost.style.top=`${e.clientY+6}px`; };
      const up=(e)=>{ document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); if(ghost){ghost.remove(); ghost=null;} if(this.inventory[kind]<=0) return; const rect=this.svg.getBoundingClientRect(); if(e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom){ const x=e.clientX-rect.left, y=e.clientY-rect.top; this.createGate(kind,x,y); this.inventory[kind]--; modal.querySelector(`[data-count="${kind}"]`).textContent=this.inventory[kind]; if(this.inventory[kind]===0) pill.setAttribute('disabled',''); } };
      pill.addEventListener('pointerdown',(e)=>{ if(this.inventory[kind]<=0) return; ghost=document.createElement('div'); ghost.className='pill'; ghost.style.position='fixed'; ghost.style.pointerEvents='none'; ghost.style.opacity='.7'; ghost.style.zIndex='10001'; ghost.textContent=kind; document.body.appendChild(ghost); move(e); document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); });
    });

    // wire preview (SVG) and global fallback so drag works even when leaving the SVG bounds
    this.svg.addEventListener('pointermove', (e)=>{ if(!this.dragWire) return; const p=this.svgClientToPoint(e.clientX,e.clientY); this.updateWirePath(this.dragWire.path, this.dragWire.start, p); });
    this.svg.addEventListener('pointerup', (e)=>{
      if(!this.dragWire) return;
      const p=this.svgClientToPoint(e.clientX,e.clientY);
      const hit=this.findNearestInputPort(p.x, p.y, 18);
      if(hit && this.pendingFrom){ this.addConnection(this.pendingFrom.id, hit.nodeId, hit.idx); }
      if(this.dragWire){ this.dragWire.path.remove(); this.dragWire=null; }
      this.pendingFrom=null;
    });
    // Global listeners to make dragging reliable even if pointer leaves the SVG
    this._onWindowPointerMove = (e)=>{ if(!this.dragWire) return; const p=this.svgClientToPoint(e.clientX,e.clientY); this.updateWirePath(this.dragWire.path, this.dragWire.start, p); };
    this._onWindowPointerUp = (e)=>{
      if(!this.dragWire) return;
      const p=this.svgClientToPoint(e.clientX,e.clientY);
      const hit=this.findNearestInputPort(p.x, p.y, 18);
      if(hit && this.pendingFrom){ this.addConnection(this.pendingFrom.id, hit.nodeId, hit.idx); }
      if(this.dragWire){ this.dragWire.path.remove(); this.dragWire=null; }
      this.pendingFrom=null;
    };
    window.addEventListener('pointermove', this._onWindowPointerMove, true);
    window.addEventListener('pointerup', this._onWindowPointerUp, true);

    this.evaluateAndRender();
  }

  svgClientToPoint(cx,cy){ const pt=this.svg.createSVGPoint(); pt.x=cx; pt.y=cy; const m=this.svg.getScreenCTM().inverse(); return pt.matrixTransform(m); }

  findNearestInputPort(x, y, threshold=18){
    const ports = this.svg.querySelectorAll('.port');
    let best = null; let bestD2 = Infinity;
    ports.forEach((p)=>{
      if(p.dataset.dir !== 'in') return;
      const cx = parseFloat(p.getAttribute('cx'));
      const cy = parseFloat(p.getAttribute('cy'));
      const dx = cx - x, dy = cy - y; const d2 = dx*dx + dy*dy;
      if(d2 < bestD2){ bestD2 = d2; best = { nodeId: p.dataset.node, idx: Number(p.dataset.idx), cx, cy }; }
    });
    if(best && Math.sqrt(bestD2) <= threshold) return best;
    return null;
  }

  addIONode(kind, x, y, label){
    const id = `n${this.ids.next++}`;
    const g = document.createElementNS('http://www.w3.org/2000/svg','g'); g.setAttribute('data-id', id);
    const w=60,h=34; const rect=document.createElementNS('http://www.w3.org/2000/svg','rect'); rect.setAttribute('x', x-w/2); rect.setAttribute('y', y-h/2); rect.setAttribute('width', w); rect.setAttribute('height', h); rect.setAttribute('rx','4'); rect.setAttribute('class','gate-body');
    const text=document.createElementNS('http://www.w3.org/2000/svg','text'); text.setAttribute('x',x); text.setAttribute('y',y+5); text.setAttribute('text-anchor','middle'); text.setAttribute('font-family','Segoe UI, Arial'); text.setAttribute('font-size','14'); text.textContent=label;
    g.appendChild(rect); g.appendChild(text);
    if(kind.startsWith('INPUT')){ g.appendChild(this.makePort(x+w/2+8,y,'out',id,0)); }
    else { g.appendChild(this.makePort(x-w/2-8,y,'in',id,0)); this.passBadge = this.ui.querySelector('.badge.pass'); }
    this.svg.appendChild(g);
    this.nodes.set(id, { id, kind, x, y, inputs: kind.startsWith('INPUT')? []:[{from:null}], el:g });
    if(kind==='OUTPUT_PASS') this.nodePASS = id;
    return id;
  }

  createGate(kind, x, y){
    const id=`n${this.ids.next++}`; const g=document.createElementNS('http://www.w3.org/2000/svg','g'); g.setAttribute('data-id',id); g.style.cursor='grab';
    const W=84,H=52; const left=x-W/2, top=y-H/2;
    if(kind==='NOT'){
      const path=document.createElementNS('http://www.w3.org/2000/svg','path'); path.setAttribute('d',`M ${left+10} ${y} L ${left+10} ${top} L ${left+W-16} ${y} L ${left+10} ${top+H} Z`); path.setAttribute('class','gate-body');
      const bubble=document.createElementNS('http://www.w3.org/2000/svg','circle'); bubble.setAttribute('cx', left+W-8); bubble.setAttribute('cy', y); bubble.setAttribute('r', 6); bubble.setAttribute('class','gate-body'); g.appendChild(path); g.appendChild(bubble);
    } else if(kind==='AND'){
      const r=H/2; const path=document.createElementNS('http://www.w3.org/2000/svg','path'); path.setAttribute('d',`M ${left+10} ${top} L ${left+W-10-r} ${top} A ${r} ${r} 0 0 1 ${left+W-10-r} ${top+H} L ${left+10} ${top+H} Z`); path.setAttribute('class','gate-body'); g.appendChild(path);
    } else if(kind==='OR' || kind==='XOR'){
      const main=document.createElementNS('http://www.w3.org/2000/svg','path'); main.setAttribute('d',`M ${left+22} ${top} C ${left+52} ${top} ${left+66} ${top+H} ${left+22} ${top+H} C ${left+10} ${top+H} ${left+10} ${top} ${left+22} ${top} Z`); main.setAttribute('class','gate-body');
      const mouth=document.createElementNS('http://www.w3.org/2000/svg','path'); mouth.setAttribute('d',`M ${left+34} ${top} C ${left+78} ${top+H*0.25} ${left+78} ${top+H*0.75} ${left+34} ${top+H}`); mouth.setAttribute('class','gate-body'); mouth.setAttribute('fill','none');
      g.appendChild(main); if(kind==='XOR'){ const xor=document.createElementNS('http://www.w3.org/2000/svg','path'); xor.setAttribute('d',`M ${left+28} ${top} C ${left+72} ${top+H*0.25} ${left+72} ${top+H*0.75} ${left+28} ${top+H}`); xor.setAttribute('class','gate-body'); xor.setAttribute('fill','none'); g.appendChild(xor);} g.appendChild(mouth);
    }
    // ports
    const inputs = (kind==='NOT'?1:2);
    for(let i=0;i<inputs;i++){ const py = top + (inputs===1? H/2 : (H*0.33 + i*H*0.34)); g.appendChild(this.makePort(left-8, py, 'in', id, i)); }
    g.appendChild(this.makePort(left+W+8, y, 'out', id, 0));

    // drag gate
    let grab=null; g.addEventListener('pointerdown',(e)=>{ if(e.target.closest('.port')) return; const p=this.svgClientToPoint(e.clientX,e.clientY); grab={ox:p.x-x, oy:p.y-y}; g.style.cursor='grabbing'; });
    const onMove=(e)=>{ if(!grab) return; const p=this.svgClientToPoint(e.clientX,e.clientY); const nx=p.x-grab.ox, ny=p.y-grab.oy; const dx=nx-x, dy=ny-y; x=nx; y=ny; this.applyGroupTranslate(g, dx, dy); const n=this.nodes.get(id); n.x=x; n.y=y; this.updateWiresForNode(id); };
    const onUp=()=>{ if(grab){ g.style.cursor='grab'; grab=null; } };
    this.svg.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);

    this.svg.appendChild(g); this.nodes.set(id, { id, kind, x, y, inputs:new Array(inputs).fill(null), el:g }); this.evaluateAndRender(); return id;
  }

  applyGroupTranslate(g, dx, dy){
    // accumulate translation on transform
    const t = g.transform.baseVal.consolidate();
    const m = this.svg.createSVGTransform();
    const base = t ? t.matrix : this.svg.createSVGMatrix();
    m.setMatrix(base.translate(dx, dy));
    const list = g.transform.baseVal; if(list.numberOfItems) list.initialize(m); else list.appendItem(m);
  }

  makePort(x,y,dir,nodeId,idx){
    const c=document.createElementNS('http://www.w3.org/2000/svg','circle'); c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r',6); c.setAttribute('class','port'); c.dataset.node=nodeId; c.dataset.dir=dir; c.dataset.idx=idx;
    c.addEventListener('pointerdown', (e)=>{ e.stopPropagation(); if(dir==='out'){ try{ c.setPointerCapture && c.setPointerCapture(e.pointerId); }catch{} this.pendingFrom={ id:nodeId }; const start=this.portPoint(nodeId,'out',0); const path=document.createElementNS('http://www.w3.org/2000/svg','path'); path.setAttribute('class','wire pending'); this.svg.appendChild(path); this.dragWire={ fromId:nodeId, start, path }; this.updateWirePath(path, start, start); } });
    c.addEventListener('pointerup', (e)=>{ e.stopPropagation(); if(dir==='in'){ const toId=nodeId; const inIdx=Number(idx); if(this.pendingFrom){ this.addConnection(this.pendingFrom.id, toId, inIdx); if(this.dragWire){ this.dragWire.path.remove(); this.dragWire=null; } this.pendingFrom=null; } else { this.removeConnectionToInput(toId,inIdx); } } });
    return c;
  }

  addConnection(fromId,toId,inIdx){ if(fromId===toId) return; this.removeConnectionToInput(toId,inIdx); const path=document.createElementNS('http://www.w3.org/2000/svg','path'); path.setAttribute('class','wire'); this.svg.appendChild(path); const conn={from:fromId,to:toId,inIdx,path}; this.connections.push(conn); const toNode=this.nodes.get(toId); if(toNode && toNode.inputs[inIdx]!==undefined) toNode.inputs[inIdx]={from:fromId}; this.updateWirePathForConnection(conn); this.evaluateAndRender(); }
  removeConnectionToInput(toId,inIdx){ this.connections = this.connections.filter(c=>{ const keep=!(c.to===toId && c.inIdx===inIdx); if(!keep) c.path.remove(); return keep; }); const n=this.nodes.get(toId); if(n && n.inputs[inIdx]!==undefined) n.inputs[inIdx]=null; this.evaluateAndRender(); }

  portPoint(nodeId, dir, idx){
    const n=this.nodes.get(nodeId); if(!n) return {x:0,y:0};
    if(n.kind.startsWith('INPUT')) return { x:n.x+30+8, y:n.y };
    if(n.kind==='OUTPUT_PASS') return { x:n.x-30-8, y:n.y };
    const W=84,H=52; const left=n.x-W/2, top=n.y-H/2; if(dir==='out') return { x:left+W+8, y:n.y };
    const inputs=(n.kind==='NOT'?1:2); const py = inputs===1? (top+H/2) : (top+H*0.33 + idx*H*0.34); return { x:left-8, y:py };
  }

  updateWirePath(path,p1,p2){ const dx=Math.max(40, Math.abs(p2.x-p1.x)*0.5); path.setAttribute('d',`M ${p1.x} ${p1.y} C ${p1.x+dx} ${p1.y}, ${p2.x-dx} ${p2.y}, ${p2.x} ${p2.y}`); }
  updateWirePathForConnection(conn){ const p1=this.portPoint(conn.from,'out',0); const p2=this.portPoint(conn.to,'in',conn.inIdx); this.updateWirePath(conn.path,p1,p2); }
  updateWiresForNode(nodeId){ this.connections.forEach(c=>{ if(c.from===nodeId || c.to===nodeId) this.updateWirePathForConnection(c); }); }

  evaluateAndRender(){
    const memo=new Map();
    const valOf=(id,depth=0)=>{ if(memo.has(id)) return memo.get(id); if(depth>64) return 0; const n=this.nodes.get(id); let v=0; if(!n) v=0; else if(n.kind==='INPUT_A') v=this.inputVals.A; else if(n.kind==='INPUT_B') v=this.inputVals.B; else if(n.kind==='INPUT_C') v=this.inputVals.C; else if(n.kind==='OUTPUT_PASS') v = n.inputs[0]?.from ? valOf(n.inputs[0].from, depth+1):0; else { const a=n.inputs[0]?.from?valOf(n.inputs[0].from, depth+1):0; const b=n.inputs[1]?.from?valOf(n.inputs[1].from, depth+1):0; switch(n.kind){ case 'NOT': v=a?0:1; break; case 'AND': v=(a&b)&1; break; case 'OR': v=(a|b)&1; break; case 'XOR': v=(a^b)&1; break; } } memo.set(id,v); return v; };

    this.connections.forEach(c=>{ const v=valOf(c.from); c.path.classList.toggle('on', !!v); });
    const passVal = valOf(this.nodePASS); const badge=this.passBadge; if(badge){ badge.textContent = passVal? 'PASS: ON':'PASS: OFF'; badge.classList.toggle('on', !!passVal); }
  }

  reset(){
    // remove all user-placed gates and connections
    for(const [id,n] of [...this.nodes]){ if(n.kind.startsWith('INPUT')||n.kind==='OUTPUT_PASS') continue; n.el.remove(); this.nodes.delete(id); }
    this.connections.forEach(c=>c.path.remove()); this.connections=[];
    // reset simplified inventory
    this.inventory={XOR:1,AND:0,OR:1,NOT:0};
    ['XOR','AND','OR','NOT'].forEach(k=>{ 
      const elCount=this.ui.querySelector(`[data-count="${k}"]`);
      const pill=this.ui.querySelector(`[data-kind="${k}"]`);
      if(elCount) elCount.textContent=this.inventory[k];
      if(this.inventory[k]<=0) pill.setAttribute('disabled',''); else pill.removeAttribute('disabled');
    });
    this.evaluateAndRender();
  }

  checkAllCombos(){ const save={...this.inputVals}; const combos=[{A:0,B:0,C:0},{A:0,B:0,C:1},{A:0,B:1,C:0},{A:0,B:1,C:1},{A:1,B:0,C:0},{A:1,B:0,C:1},{A:1,B:1,C:0},{A:1,B:1,C:1}]; const out=[]; for(const c of combos){ this.inputVals=c; this.evaluateAndRender(); const on=this.passBadge?.classList.contains('on')?1:0; out.push(on);} this.inputVals=save; this.evaluateAndRender(); const ok=out.every((v,i)=>v===this.targetTruth[i]); if(ok){ try{ this.onSolved&&this.onSolved(); }catch{} setTimeout(()=>this.close(), 600); } else { alert('Some input combinations do not match the target.'); } }
}
