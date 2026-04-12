"use client";
import React, { useState, useEffect } from 'react';
import metaData from '../../meta_data.json'; 

export default function AnalyzerPage() {
  const [userDeck, setUserDeck] = useState(null);
  const [baseline, setBaseline] = useState('overall'); 
  const [compareSide, setCompareSide] = useState(false);
  const [recPage, setRecPage] = useState(1);
  const RECS_PER_PAGE = 5;

  // --- HYPERGEOMETRIC STATE ---
  const [hpN, setHpN] = useState(40); // Population Size (Deck)
  const [hpn, setHpn] = useState(5);  // Sample Size (Hand)
  const [hpK, setHpK] = useState(3);  // Successes in Pop (Cards in deck)
  const [hpk, setHpk] = useState(1);  // Successes in Sample (Wanted in hand)
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

  // --- HYPERGEOMETRIC MATH ---
  const nCr = (n, r) => {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    if (r > n / 2) r = n - r;
    let res = 1;
    for (let i = 1; i <= r; i++) res = res * (n - i + 1) / i;
    return res;
  };

  const calculateHyper = () => {
    const N = parseInt(hpN); const n = parseInt(hpn);
    const K = parseInt(hpK); const k_wanted = parseInt(hpk);
    if (isNaN(N) || isNaN(n) || isNaN(K) || isNaN(k_wanted)) return;

    const probExact = (k) => (nCr(K, k) * nCr(N - K, n - k)) / nCr(N, n);

    let atLeast = 0;
    for (let i = k_wanted; i <= Math.min(n, K); i++) atLeast += probExact(i);

    let atMost = 0;
    for (let i = 0; i <= k_wanted; i++) atMost += probExact(i);

    setHpResults({
      atLeast: (atLeast * 100).toFixed(2),
      exactly: (probExact(k_wanted) * 100).toFixed(2),
      atMost: (atMost * 100).toFixed(2),
      zero: (probExact(0) * 100).toFixed(2)
    });
  };

  useEffect(() => { calculateHyper(); }, [hpN, hpn, hpK, hpk]);

  const handleFilterChange = (setter, value) => { setter(value); setRecPage(1); };
  const handleCategoryChange = (val) => {
    setFMainType(val); setFRace('All'); setFAttribute('All'); setFFrame('All'); setFMechanic('All');
    setFAtk(''); setFDef(''); setFLvlMin(0); setFLvlMax(13); setRecPage(1);
  };
  const resetFilters = () => {
    setFSearch(''); setFReverse(false); setFMainType('All'); setFDeckType('All');
    setFAttribute('All'); setFRace('All'); setFFrame('All'); setFMechanic('All');
    setFAtk(''); setFDef(''); setFLvlMin(0); setFLvlMax(13); setRecPage(1);
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
      if (fSearch && !name.toLowerCase().includes(fSearch.toLowerCase())) return;
      const isMonster = !info.type.includes('Spell') && !info.type.includes('Trap');
      if (fDeckType === 'Extra' && (!isMonster || !info.isExtra)) return;
      if (fDeckType === 'Main' && (isMonster && info.isExtra)) return;
      if (fMainType === 'Monster' && !isMonster) return;
      if (fMainType === 'Spell' && !info.type.includes('Spell')) return;
      if (fMainType === 'Trap' && !info.type.includes('Trap')) return;
      if (isMonster) {
        if (fAttribute !== 'All' && info.attribute !== fAttribute) return;
        if (fRace !== 'All' && info.race !== fRace) return;
        if (fFrame !== 'All' && !info.type.toLowerCase().includes(fFrame.toLowerCase())) return;
        if (fMechanic === 'Tuner' && !info.isTuner) return;
        if (fAtk !== '' && info.atk != fAtk) return;
        if (fDef !== '' && info.def != fDef) return;
        if (info.level < fLvlMin || info.level > fLvlMax) return;
      } else { if (fRace !== 'All' && info.race !== fRace) return; }

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

  const currentRecs = getRecommendations().slice((recPage - 1) * RECS_PER_PAGE, recPage * RECS_PER_PAGE);

  const Row = ({title, list}) => (
    <div className="mb-8">
      <h3 className="text-zinc-600 font-black text-[10px] uppercase tracking-[0.3em] mb-4 border-b border-zinc-800 pb-2">{title} — {list.length}</h3>
      <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5">
        {list.map((c, i) => (
          <img key={i} src={`https://images.ygoprodeck.com/images/cards/${c.imgId}.jpg`} className="w-full rounded shadow hover:scale-150 hover:z-50 transition cursor-help" title={c.name} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans">
      <div className="flex flex-col items-center mb-10 text-center">
        <h1 className="text-5xl font-black text-blue-600 uppercase italic tracking-tighter drop-shadow-[0_0_15px_rgba(37,99,235,0.3)]">Deck Analyzer</h1>
      </div>

      {/* --- FULL FILTER BAR --- */}
      <div className="max-w-[1600px] mx-auto bg-zinc-900 border border-zinc-800 p-6 rounded-3xl mb-12 shadow-2xl space-y-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col flex-grow min-w-[200px]"><label className="text-[10px] text-blue-500 uppercase font-bold mb-1">Search Suggestions</label><input type="text" value={fSearch} onChange={(e) => handleFilterChange(setFSearch, e.target.value)} placeholder="Type name..." className="bg-black border border-zinc-700 rounded-lg p-2 text-xs outline-none focus:border-blue-500" /></div>
          <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Baseline</label><select value={baseline} onChange={(e) => {setBaseline(e.target.value); setRecPage(1);}} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs text-blue-400 font-bold outline-none cursor-pointer"><option value="overall">Global Trends</option>{Object.keys(metaData.archetypes).sort().map(a => <option key={a} value={a}>{a}</option>)}</select></div>
          <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Category</label><select value={fMainType} onChange={(e) => handleCategoryChange(e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs outline-none"><option value="All">All Types</option><option value="Monster">Monster</option><option value="Spell">Spell</option><option value="Trap">Trap</option></select></div>
          {fMainType === 'Monster' && (
            <>
              <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Attribute</label><select value={fAttribute} onChange={(e) => handleFilterChange(setFAttribute, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{attributes.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
              <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Level Range</label><div className="flex gap-1"><select value={fLvlMin} onChange={(e) => handleFilterChange(setFLvlMin, Number(e.target.value))} className="bg-black border border-zinc-700 rounded p-1.5 text-xs">{[...Array(14)].map((_,i) => <option key={i} value={i}>{i}</option>)}</select><select value={fLvlMax} onChange={(e) => handleFilterChange(setFLvlMax, Number(e.target.value))} className="bg-black border border-zinc-700 rounded p-1.5 text-xs">{[...Array(14)].map((_,i) => <option key={i} value={i}>{i}</option>)}</select></div></div>
            </>
          )}
          <label className="flex items-center gap-2 cursor-pointer bg-blue-900/30 border border-blue-700/50 p-2 px-4 rounded-lg text-[10px] h-[36px]"><input type="checkbox" checked={fReverse} onChange={(e) => handleFilterChange(setFReverse, e.target.checked)} /><span className="font-bold uppercase tracking-tighter text-blue-200">Reverse</span></label>
          <button onClick={resetFilters} className="text-[10px] font-black text-red-500 uppercase border-b border-red-900 pb-1 ml-auto">Reset</button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT BAR: UPLOAD & RECS (Col 1-3) */}
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
                <h2 className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Recommendations</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setRecPage(p => p - 1)} disabled={recPage === 1} className="text-xs disabled:opacity-20">◀</button>
                  <span className="text-[9px] font-mono text-zinc-500">{recPage}</span>
                  <button onClick={() => setRecPage(p => p + 1)} className="text-xs">▶</button>
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
                    <div className="mt-2 bg-blue-900/20 text-blue-400 text-center py-1.5 rounded-lg text-[9px] font-black uppercase border border-blue-900/30">Pro Avg: {r.suggestedQty}x | You: {r.userQty}x</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER: DECK VIEW (Col 4-9) */}
        <div className="lg:col-span-6">
          {userDeck ? (
            <div className="bg-zinc-950 p-6 md:p-10 rounded-[3rem] border border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
              <Row title="Main Deck" list={userDeck.main} />
              <Row title="Extra Deck" list={userDeck.extra} />
              <Row title="Side Deck" list={userDeck.side} />
            </div>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-4 border-dashed border-zinc-900 rounded-[4rem] opacity-20"><p className="text-4xl font-black uppercase tracking-tighter text-zinc-600 text-center">Ready for Analysis</p></div>
          )}
        </div>

        {/* RIGHT BAR: HYPERGEOMETRIC CALCULATOR (Col 10-12) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
            <h2 className="text-sm font-black uppercase text-blue-500 tracking-tighter italic border-b border-zinc-800 pb-2">Probability Calculator</h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Deck Size</label>
                <input type="number" value={hpN} onChange={(e) => setHpN(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-xs font-bold outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Cards Drawn (Hand)</label>
                <input type="number" value={hpn} onChange={(e) => setHpn(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-xs font-bold outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Copies in Deck</label>
                <input type="number" value={hpK} onChange={(e) => setHpK(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-xs font-bold outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Wanted in Hand</label>
                <input type="number" value={hpk} onChange={(e) => setHpk(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-xs font-bold outline-none focus:border-blue-500" />
              </div>
            </div>

            {hpResults && (
              <div className="mt-6 space-y-2 border-t border-zinc-800 pt-4 animate-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between bg-blue-600/20 p-2 rounded-lg border border-blue-600/30">
                  <span className="text-[10px] font-black text-blue-300 uppercase">1 or more</span>
                  <span className="text-xs font-black text-blue-400">{hpResults.atLeast}%</span>
                </div>
                <div className="flex justify-between p-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Exactly {hpk}</span>
                  <span className="text-xs font-bold text-zinc-300">{hpResults.exactly}%</span>
                </div>
                <div className="flex justify-between p-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">{hpk} or less</span>
                  <span className="text-xs font-bold text-zinc-300">{hpResults.atMost}%</span>
                </div>
                <div className="flex justify-between p-2 opacity-50">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Exactly 0</span>
                  <span className="text-xs font-bold text-zinc-300">{hpResults.zero}%</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-[9px] text-zinc-600 italic leading-relaxed">
            Note: This calculator assumes you are drawing cards without replacement (standard hypergeometric distribution).
          </div>
        </div>
      </div>
    </div>
  );
}