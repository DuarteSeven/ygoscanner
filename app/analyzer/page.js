"use client";
import React, { useState, useEffect } from 'react';
import metaData from '../../meta_data.json'; 
import Link from 'next/link';

export default function AnalyzerPage() {
  const [userDeck, setUserDeck] = useState(null);
  const [baseline, setBaseline] = useState('overall'); 
  const [compareSide, setCompareSide] = useState(false);
  const [recPage, setRecPage] = useState(1);
  const RECS_PER_PAGE = 5;

  // --- MARKER STATE ---
  const [cardMarkers, setCardMarkers] = useState({}); 

  // --- HYPERGEOMETRIC STATE ---
  const [hpN, setHpN] = useState(40);
  const [hpn, setHpn] = useState(5); 
  const [hpK, setHpK] = useState(3); 
  const [hpk, setHpk] = useState(1); 
  const [hpResults, setHpResults] = useState(null);

  // --- FILTER STATES ---
  const [fSearch, setFSearch] = useState('');
  const [fReverse, setFReverse] = useState(false);
  const [fMainType, setFMainType] = useState('All'); 
  const [fDeckType, setFDeckType] = useState('All'); 
  const [fAttribute, setFAttribute] = useState('All');
  const [fRace, setFRace] = useState('All'); 
  const [fFrame, setFFrame] = useState('All'); 
  const [fMechanic, setFMechanic] = useState('All'); 
  const [fAtk, setFAtk] = useState('');
  const [fDef, setFDef] = useState('');
  const [fLvlMin, setFLvlMin] = useState(0);
  const [fLvlMax, setFLvlMax] = useState(13);

  const attributes = ['All', 'DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'];
  const monsterRaces = ['All', 'Aqua', 'Beast', 'Beast-Warrior', 'Cyberse', 'Dinosaur', 'Divine-Beast', 'Dragon', 'Fairy', 'Fiend', 'Fish', 'Illusion', 'Insect', 'Machine', 'Plant', 'Psychic', 'Pyro', 'Reptile', 'Rock', 'Sea Serpent', 'Spellcaster', 'Thunder', 'Warrior', 'Winged Beast', 'Wyrm'];
  const frames = ['All', 'Normal', 'Effect', 'Fusion', 'Synchro', 'XYZ', 'Link', 'Ritual'];
  const mechanics = ['All', 'Tuner', 'Pendulum', 'Spirit', 'Gemini', 'Union', 'Toon', 'Flip'];
  const spellRaces = ['All', 'Normal', 'Field', 'Equip', 'Continuous', 'Quick-Play', 'Ritual'];
  const trapRaces = ['All', 'Normal', 'Continuous', 'Counter'];

  // --- MATH ENGINE ---
  const nCr = (n, r) => {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    if (r > n / 2) r = n - r;
    let res = 1;
    for (let i = 1; i <= r; i++) res = res * (n - i + 1) / i;
    return res;
  };

  const getProb = (N, n, K, k) => (nCr(K, k) * nCr(N - K, n - k)) / nCr(N, n);

  const calculateHyper = () => {
    const N = parseInt(hpN); const n_drawn = parseInt(hpn);
    const K = parseInt(hpK); const k_wanted = parseInt(hpk);
    if (isNaN(N) || isNaN(n_drawn) || isNaN(K) || isNaN(k_wanted) || N <= 0) return;
    const probExact = getProb(N, n_drawn, K, k_wanted);
    let atLeast = 0;
    for (let i = k_wanted; i <= Math.min(n_drawn, K); i++) atLeast += getProb(N, n_drawn, K, i);
    let atMost = 0;
    for (let i = 0; i <= k_wanted; i++) atMost += getProb(N, n_drawn, K, i);
    setHpResults({ atLeast: (atLeast * 100).toFixed(2), exactly: (probExact * 100).toFixed(2), atMost: (atMost * 100).toFixed(2), zero: (getProb(N, n_drawn, K, 0) * 100).toFixed(2) });
  };

  useEffect(() => { calculateHyper(); }, [hpN, hpn, hpK, hpk]);

  // --- MARKER LOGIC ---
  const toggleMarker = (name) => {
    setCardMarkers(prev => {
      const current = prev[name] || 0;
      const next = (current + 1) % 4; 
      return { ...prev, [name]: next };
    });
  };

  const getMarkerStats = () => {
    if (!userDeck) return null;
    const N = userDeck.main.length;
    const n = 5;
    if (N < n) return null;
    let kStart = 0; let kNon = 0; let kBrick = 0;
    Object.entries(cardMarkers).forEach(([name, type]) => {
      const count = userDeck.mainCounts[name] || 0;
      if (type === 1) kStart += count;
      if (type === 2) kNon += count;
      if (type === 3) kBrick += count;
    });
    const probZeroStart = getProb(N, n, kStart, 0);
    const starterRatio = probZeroStart > 0 ? (1 / probZeroStart).toFixed(1) : "0";
    const avgNonEngine = (n * (kNon / N)).toFixed(1);
    const probZeroBrick = getProb(N, n, kBrick, 0);
    const brickChance = 1 - probZeroBrick;
    const brickRatio = brickChance > 0 ? (1 / brickChance).toFixed(1) : "0";
    return { starterRatio, avgNonEngine, brickRatio, kStart, kNon, kBrick };
  };

  const mStats = getMarkerStats();

  // --- FILTER HANDLERS ---
  const handleFilterChange = (setter, value) => { setter(value); setRecPage(1); };
  
  const handleCategoryChange = (val) => {
    setFMainType(val);
    setFRace('All'); setFAttribute('All'); setFFrame('All'); setFMechanic('All');
    setFAtk(''); setFDef(''); setFLvlMin(0); setFLvlMax(13);
    setRecPage(1);
  };

  const resetFilters = () => {
    setFSearch(''); setFReverse(false); setFMainType('All'); setFDeckType('All');
    setFAttribute('All'); setFRace('All'); setFFrame('All'); setFMechanic('All');
    setFAtk(''); setFDef(''); setFLvlMin(0); setFLvlMax(13);
    setRecPage(1);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      const text = f.target.result;
      const lines = text.split('\n');
      let currentSection = 'main';
      const deck = { main: [], extra: [], side: [], mainCounts: {}, sideCounts: {} };
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed === '#extra') currentSection = 'extra';
        else if (trimmed === '!side') currentSection = 'side';
        else if (/^\d+$/.test(trimmed)) {
          const name = metaData.idMap[trimmed];
          if (name) {
            const card = { name, imgId: trimmed };
            if (currentSection === 'main') { deck.main.push(card); deck.mainCounts[name] = (deck.mainCounts[name] || 0) + 1; }
            else if (currentSection === 'extra') { deck.extra.push(card); deck.mainCounts[name] = (deck.mainCounts[name] || 0) + 1; }
            else if (currentSection === 'side') { deck.side.push(card); deck.sideCounts[name] = (deck.sideCounts[name] || 0) + 1; }
          }
        }
      });
      setUserDeck(deck);
      setRecPage(1);
      if (deck.main.length > 0) setHpN(deck.main.length);
    };
    reader.readAsText(file);
  };

  const getRecommendations = () => {
    if (!userDeck) return [];
    const proData = compareSide ? (baseline === 'overall' ? metaData.overallSide : metaData.archetypes[baseline].sideCards) : (baseline === 'overall' ? metaData.overall : metaData.archetypes[baseline].cards);
    const totalBaselineDecks = (baseline === 'overall') ? metaData.totalDecks : metaData.archetypes[baseline].count;
    const userCounts = compareSide ? userDeck.sideCounts : userDeck.mainCounts;
    
    let recs = [];
    Object.entries(proData).forEach(([name, stats]) => {
      const info = metaData.cardDict[name];
      if (!info) return;

      // 1. Apply Full Filters
      if (fSearch && !name.toLowerCase().includes(fSearch.toLowerCase())) return;
      const isSpell = info.type.includes('Spell');
      const isTrap = info.type.includes('Trap');
      const isMonster = !isSpell && !isTrap;
      const isExtra = info.isExtra;

      if (fDeckType === 'Extra' && (!isMonster || !isExtra)) return;
      if (fDeckType === 'Main' && (isMonster && isExtra)) return;
      if (fMainType === 'Monster' && !isMonster) return;
      if (fMainType === 'Spell' && !isSpell) return;
      if (fMainType === 'Trap' && !isTrap) return;

      if (isMonster) {
        if (fAttribute !== 'All' && info.attribute !== fAttribute) return;
        if (fRace !== 'All' && info.race !== fRace) return;
        if (fFrame !== 'All' && !info.type.toLowerCase().includes(fFrame.toLowerCase())) return;
        
        if (fMechanic === 'Tuner' && !info.isTuner) return;
        if (fMechanic === 'Pendulum' && !info.isPendulum) return;
        if (fMechanic === 'Spirit' && !info.isSpirit) return;
        if (fMechanic === 'Gemini' && !info.isGemini) return;
        if (fMechanic === 'Union' && !info.isUnion) return;
        if (fMechanic === 'Toon' && !info.isToon) return;
        if (fMechanic === 'Flip' && !info.isFlip) return;

        if (fAtk !== '' && info.atk != fAtk) return;
        if (fDef !== '' && info.def != fDef) return;
        if (info.level < fLvlMin || info.level > fLvlMax) return;
      } else {
        if (fRace !== 'All' && info.race !== fRace) return;
      }

      // 2. Logic Check
      const userQty = userCounts[name] || 0;
      const inclusionRate = Math.round((stats.playedIn / totalBaselineDecks) * 100);
      let suggestedQty = stats["3x"] >= stats["2x"] && stats["3x"] >= stats["1x"] ? 3 : stats["2x"] >= stats["1x"] ? 2 : 1;

      if (userQty < suggestedQty) {
        const ratios = [];
        if (stats["3x"] > 0) ratios.push({ label: "3x", val: Math.round((stats["3x"] / totalBaselineDecks) * 100) });
        if (stats["2x"] > 0) ratios.push({ label: "2x", val: Math.round((stats["2x"] / totalBaselineDecks) * 100) });
        if (stats["1x"] > 0) ratios.push({ label: "1x", val: Math.round((stats["1x"] / totalBaselineDecks) * 100) });
        recs.push({ name, userQty, suggestedQty, inclusionRate, imgId: stats.imgId, ratios });
      }
    });

    recs.sort((a, b) => b.inclusionRate - a.inclusionRate);
    if (fReverse) recs.reverse();
    return recs;
  };

  const allRecs = getRecommendations();
  const totalPages = Math.ceil(allRecs.length / RECS_PER_PAGE);
  const currentRecs = allRecs.slice((recPage - 1) * RECS_PER_PAGE, recPage * RECS_PER_PAGE);

  const UserRow = ({title, list}) => (
    <div className="mb-8">
      <h3 className="text-zinc-600 font-black text-[10px] uppercase tracking-[0.3em] mb-4 border-b border-zinc-800 pb-1">{title} — {list.length}</h3>
      <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5">
        {list.map((c, i) => {
          const m = cardMarkers[c.name] || 0;
          const borderClass = m === 1 ? "border-green-500 scale-105 z-10 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : m === 2 ? "border-blue-500 scale-105 z-10 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : m === 3 ? "border-red-500 scale-105 z-10 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "border-transparent opacity-80 hover:opacity-100";
          return (
            <div key={i} onClick={() => toggleMarker(c.name)} className={`relative border-2 rounded-sm cursor-pointer transition-all duration-200 ${borderClass}`}>
              <img src={`https://images.ygoprodeck.com/images/cards/${c.imgId}.jpg`} className="w-full rounded-sm" title={c.name} />
              {m !== 0 && <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center text-[7px] font-black text-white ${m === 1 ? "bg-green-500" : m === 2 ? "bg-blue-500" : "bg-red-500"}`}>{m === 1 ? "S" : m === 2 ? "N" : "B"}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans relative">
      {/* BACK BUTTON */}
      <Link href="/" className="fixed top-6 left-6 z-[110] bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:border-blue-400 transition-all shadow-2xl">
        ◀ Back to Trends
      </Link>

      <div className="flex flex-col items-center mb-10 text-center">
        <h1 className="text-5xl font-black text-blue-600 uppercase italic tracking-tighter drop-shadow-[0_0_15px_rgba(37,99,235,0.3)]">Deck Analyzer</h1>
      </div>

      {/* --- FULL FILTER BAR (RESTORED) --- */}
      <div className="max-w-[1600px] mx-auto bg-zinc-900 border border-zinc-800 p-6 rounded-3xl mb-12 shadow-2xl space-y-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col flex-grow min-w-[200px]"><label className="text-[10px] text-blue-500 uppercase font-black mb-1">Search Suggestions</label><input type="text" value={fSearch} onChange={(e) => handleFilterChange(setFSearch, e.target.value)} placeholder="Search card..." className="bg-black border border-zinc-700 rounded-lg p-2 text-xs outline-none focus:border-blue-500" /></div>
          <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Baseline</label><select value={baseline} onChange={(e) => {setBaseline(e.target.value); setRecPage(1);}} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs text-blue-400 font-bold outline-none cursor-pointer"><option value="overall">Global Trends</option>{Object.keys(metaData.archetypes).sort().map(a => <option key={a} value={a}>{a}</option>)}</select></div>
          <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Category</label><select value={fMainType} onChange={(e) => handleCategoryChange(e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs outline-none"><option value="All">All Types</option><option value="Monster">Monster</option><option value="Spell">Spell</option><option value="Trap">Trap</option></select></div>
          <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Location</label><select value={fDeckType} onChange={(e) => handleFilterChange(setFDeckType, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs outline-none"><option value="All">All</option><option value="Main">Main Only</option><option value="Extra">Extra Only</option></select></div>

          {fMainType === 'Monster' && (
            <>
              <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Attribute</label><select value={fAttribute} onChange={(e) => handleFilterChange(setFAttribute, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{attributes.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
              <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Race/Type</label><select value={fRace} onChange={(e) => handleFilterChange(setFRace, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{monsterRaces.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Frame</label><select value={fFrame} onChange={(e) => handleFilterChange(setFFrame, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{frames.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
              <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Mechanic</label><select value={fMechanic} onChange={(e) => handleFilterChange(setFMechanic, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{mechanics.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
              <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Lvl Range</label><div className="flex gap-1"><select value={fLvlMin} onChange={(e) => handleFilterChange(setFLvlMin, Number(e.target.value))} className="bg-black border border-zinc-700 rounded p-1.5 text-xs text-center">{[...Array(14)].map((_,i) => <option key={i} value={i}>{i}</option>)}</select><select value={fLvlMax} onChange={(e) => handleFilterChange(setFLvlMax, Number(e.target.value))} className="bg-black border border-zinc-700 rounded p-1.5 text-xs text-center">{[...Array(14)].map((_,i) => <option key={i} value={i}>{i}</option>)}</select></div></div>
              <div className="flex flex-col w-12"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">ATK</label><input type="number" value={fAtk} onChange={(e) => handleFilterChange(setFAtk, e.target.value)} className="bg-black border border-zinc-700 rounded p-2 text-xs text-center" /></div>
              <div className="flex flex-col w-12"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">DEF</label><input type="number" value={fDef} onChange={(e) => handleFilterChange(setFDef, e.target.value)} className="bg-black border border-zinc-700 rounded p-2 text-xs text-center" /></div>
            </>
          )}

          {(fMainType === 'Spell' || fMainType === 'Trap') && (
            <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Property</label><select value={fRace} onChange={(e) => handleFilterChange(setFRace, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{(fMainType === 'Spell' ? spellRaces : trapRaces).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          )}

          <label className="flex items-center gap-2 cursor-pointer bg-blue-900/30 border border-blue-700/50 p-2 px-4 rounded-lg text-[10px] h-[36px]"><input type="checkbox" checked={fReverse} onChange={(e) => handleFilterChange(setFReverse, e.target.checked)} className="accent-blue-500" /><span className="font-bold uppercase tracking-tighter text-blue-200">Reverse</span></label>
          <button onClick={resetFilters} className="text-[10px] font-black text-red-500 uppercase border-b border-red-900 pb-1 ml-auto">Reset</button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT BAR: UPLOAD & RECS */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-xl">
            <label className="block text-[10px] font-black text-zinc-500 uppercase mb-4 tracking-widest text-center">1. Upload .YDK</label>
            <input type="file" accept=".ydk" onChange={handleFileUpload} className="text-[10px] text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-blue-600 file:text-white cursor-pointer w-full" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-xl transition hover:border-zinc-600">
              <input type="checkbox" checked={compareSide} onChange={(e) => {setCompareSide(e.target.checked); setRecPage(1);}} className="accent-blue-500 w-5 h-5" />
              <span className="text-[11px] font-black uppercase tracking-widest text-blue-400">Compare Side Deck</span>
          </label>

          {userDeck && (
            <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Suggestions</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setRecPage(p => Math.max(1, p - 1))} disabled={recPage === 1} className="text-xs disabled:opacity-20">◀</button>
                  <span className="text-[9px] font-mono text-zinc-500">{recPage}/{totalPages || 1}</span>
                  <button onClick={() => setRecPage(p => Math.min(totalPages, p + 1))} disabled={recPage === totalPages} className="text-xs disabled:opacity-20">▶</button>
                </div>
              </div>
              <div className="space-y-4">
                {currentRecs.map(r => (
                  <div key={r.name} className="bg-black border border-zinc-800 p-3 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <img src={`https://images.ygoprodeck.com/images/cards/${r.imgId}.jpg`} className="w-10 rounded shadow-md" alt="card" />
                      <div className="overflow-hidden">
                        <p className="text-[9px] font-black truncate uppercase text-zinc-200">{r.name}</p>
                        <p className="text-[10px] text-blue-500 font-bold">Played in {r.inclusionRate}% of decks</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.ratios.map(ratio => <span key={ratio.label} className="text-[8px] font-bold bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-800">{ratio.label}: {ratio.val}%</span>)}
                    </div>
                    <div className="mt-2 bg-blue-900/20 text-blue-400 text-center py-1.5 rounded-lg text-[9px] font-black uppercase border border-blue-900/30">Pro: {r.suggestedQty}x | You: {r.userQty}x</div>
                  </div>
                ))}
                {allRecs.length === 0 && <p className="text-center text-zinc-600 text-[10px] py-4 font-bold uppercase tracking-widest italic">Matches baseline filters.</p>}
              </div>
            </div>
          )}
        </div>

        {/* CENTER: DECK VIEW */}
        <div className="lg:col-span-6">
          {userDeck ? (
            <div className="bg-zinc-950 p-6 md:p-10 rounded-[3rem] border border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-6 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-center">
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Marker Controls</p>
                    <p className="text-[9px] text-zinc-600 mt-1 italic">Click cards to tag: <span className="text-green-500">Starter</span> → <span className="text-blue-500">Non-Engine</span> → <span className="text-red-500">Brick</span></p>
                </div>
              <UserRow title="Main Deck" list={userDeck.main} />
              <UserRow title="Extra Deck" list={userDeck.extra} />
              <UserRow title="Side Deck" list={userDeck.side} />
            </div>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-4 border-dashed border-zinc-900 rounded-[4rem] opacity-20"><p className="text-4xl font-black uppercase tracking-tighter text-zinc-600 text-center">Ready for Analysis</p></div>
          )}
        </div>

        {/* RIGHT BAR: CALCULATORS */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
            <h2 className="text-sm font-black uppercase text-blue-500 tracking-tighter italic border-b border-zinc-800 pb-2 text-center">Calculator</h2>
            <div className="space-y-3">
              <div><label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Deck Size</label><input type="number" value={hpN} onChange={(e) => setHpN(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-xs font-bold outline-none focus:border-blue-500" /></div>
              <div><label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Hand Size</label><input type="number" value={hpn} onChange={(e) => setHpn(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-xs font-bold outline-none focus:border-blue-500" /></div>
              <div><label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Copies in Deck</label><input type="number" value={hpK} onChange={(e) => setHpK(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-xs font-bold outline-none focus:border-blue-500" /></div>
              <div><label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Wanted in Hand</label><input type="number" value={hpk} onChange={(e) => setHpk(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-xs font-bold outline-none focus:border-blue-500" /></div>
            </div>
            {hpResults && (
              <div className="mt-6 space-y-2 border-t border-zinc-800 pt-4 animate-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between bg-blue-600/20 p-2 rounded-lg border border-blue-600/30"><span className="text-[10px] font-black text-blue-300 uppercase">1 or more</span><span className="text-xs font-black text-blue-400">{hpResults.atLeast}%</span></div>
                <div className="flex justify-between p-2"><span className="text-[10px] font-bold text-zinc-500 uppercase">Exactly {hpk}</span><span className="text-xs font-bold text-zinc-300">{hpResults.exactly}%</span></div>
                <div className="flex justify-between p-2 opacity-50"><span className="text-[10px] font-bold text-zinc-500 uppercase">Exactly 0</span><span className="text-xs font-bold text-zinc-300">{hpResults.zero}%</span></div>
              </div>
            )}
          </div>

          {/* ENGINE CONSISTENCY PANEL */}
          {userDeck && mStats && (
            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-xl space-y-4 animate-in slide-in-from-right-8 duration-500">
                <h2 className="text-sm font-black uppercase text-green-500 tracking-tighter italic border-b border-zinc-800 pb-2 text-center">Consistency</h2>
                <div className="space-y-4">
                    <div className="p-3 bg-green-950/20 rounded-2xl border border-green-900/30">
                        <p className="text-[9px] font-black uppercase text-green-500 mb-1 tracking-widest text-center">Starters ({mStats.kStart})</p>
                        <p className="text-lg font-black text-white leading-none text-center">1 out of {mStats.starterRatio}</p>
                        <p className="text-[8px] text-zinc-500 mt-1 uppercase font-bold tracking-tighter text-center">Games you will brick</p>
                    </div>
                    <div className="p-3 bg-blue-950/20 rounded-2xl border border-blue-900/30">
                        <p className="text-[9px] font-black uppercase text-blue-500 mb-1 tracking-widest text-center">Non-Engine ({mStats.kNon})</p>
                        <p className="text-lg font-black text-white leading-none text-center">{mStats.avgNonEngine}</p>
                        <p className="text-[8px] text-zinc-500 mt-1 uppercase font-bold tracking-tighter text-center">Avg per opening hand</p>
                    </div>
                    <div className="p-3 bg-red-950/20 rounded-2xl border border-red-900/30">
                        <p className="text-[9px] font-black uppercase text-red-500 mb-1 tracking-widest text-center">Bricks ({mStats.kBrick})</p>
                        <p className="text-lg font-black text-white leading-none text-center">Every {mStats.brickRatio}</p>
                        <p className="text-[8px] text-zinc-500 mt-1 uppercase font-bold tracking-tighter text-center">Games you see 1+ bricks</p>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}