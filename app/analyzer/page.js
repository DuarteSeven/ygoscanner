"use client";
import React, { useState } from 'react';
import metaData from '../../meta_data.json'; 

export default function AnalyzerPage() {
  const [userDeck, setUserDeck] = useState(null);
  const [baseline, setBaseline] = useState('overall'); 
  const [compareSide, setCompareSide] = useState(false);
  const [recPage, setRecPage] = useState(1);
  const RECS_PER_PAGE = 5;

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
  
  // FIXED: Changed 'Xyz' to 'XYZ' to match API data
  const frames = ['All', 'Normal', 'Effect', 'Fusion', 'Synchro', 'XYZ', 'Link', 'Ritual'];
  const mechanics = ['All', 'Tuner', 'Pendulum', 'Spirit', 'Gemini', 'Union', 'Toon', 'Flip'];
  const spellRaces = ['All', 'Normal', 'Field', 'Equip', 'Continuous', 'Quick-Play', 'Ritual'];
  const trapRaces = ['All', 'Normal', 'Continuous', 'Counter'];

  const handleFilterChange = (setter, value) => {
    setter(value);
    setRecPage(1);
  };

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
            if (currentSection === 'main' || currentSection === 'extra') {
              deck.main.push(card);
              deck.mainCounts[name] = (deck.mainCounts[name] || 0) + 1;
            } else if (currentSection === 'side') {
              deck.side.push(card);
              deck.sideCounts[name] = (deck.sideCounts[name] || 0) + 1;
            }
          }
        }
      });
      setUserDeck(deck);
      setRecPage(1);
    };
    reader.readAsText(file);
  };

  const getRecommendations = () => {
    if (!userDeck) return [];
    
    const proData = compareSide 
      ? (baseline === 'overall' ? metaData.overallSide : metaData.archetypes[baseline].sideCards)
      : (baseline === 'overall' ? metaData.overall : metaData.archetypes[baseline].cards);
    
    const totalBaselineDecks = (baseline === 'overall') ? metaData.totalDecks : metaData.archetypes[baseline].count;
    const userCounts = compareSide ? userDeck.sideCounts : userDeck.mainCounts;
    
    let recs = [];

    Object.entries(proData).forEach(([name, stats]) => {
      const info = metaData.cardDict[name];
      if (!info) return;

      // --- FILTERS ---
      if (fSearch && !name.toLowerCase().includes(fSearch.toLowerCase())) return;
      const isSpell = info.type.includes('Spell');
      const isTrap = info.type.includes('Trap');
      const isMonster = !isSpell && !isTrap;
      const isExtra = info.isExtra;

      // Location Filter Logic
      if (fDeckType === 'Extra' && (!isMonster || !isExtra)) return;
      if (fDeckType === 'Main' && (isMonster && isExtra)) return;
      
      // Category Logic
      if (fMainType === 'Monster' && !isMonster) return;
      if (fMainType === 'Spell' && !isSpell) return;
      if (fMainType === 'Trap' && !isTrap) return;

      if (isMonster) {
        if (fAttribute !== 'All' && info.attribute !== fAttribute) return;
        if (fRace !== 'All' && info.race !== fRace) return;
        // FIXED: Case insensitive match for Frame (XYZ/Synchro etc)
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
        // FIXED: Property filter now correctly applies to Spells and Traps
        if (fRace !== 'All' && info.race !== fRace) return;
      }

      // --- RECOMMENDATION CALC ---
      const userQty = userCounts[name] || 0;
      const inclusionRate = Math.round((stats.playedIn / totalBaselineDecks) * 100);
      let suggestedQty = 1;
      if (stats["3x"] >= stats["2x"] && stats["3x"] >= stats["1x"]) suggestedQty = 3;
      else if (stats["2x"] >= stats["1x"]) suggestedQty = 2;

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
        <p className="text-zinc-500 text-[10px] mt-2 uppercase tracking-widest font-bold">Pro-Level Optimization</p>
      </div>

      {/* --- FULL FILTER BAR --- */}
      <div className="max-w-7xl mx-auto bg-zinc-900 border border-zinc-800 p-6 rounded-3xl mb-12 shadow-2xl space-y-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col flex-grow min-w-[200px]"><label className="text-[10px] text-blue-500 uppercase font-bold mb-1">Search Suggestions</label><input type="text" value={fSearch} onChange={(e) => handleFilterChange(setFSearch, e.target.value)} placeholder="Type name..." className="bg-black border border-zinc-700 rounded-lg p-2 text-xs outline-none focus:border-blue-500" /></div>
          <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Baseline</label><select value={baseline} onChange={(e) => {setBaseline(e.target.value); setRecPage(1);}} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs text-blue-400 font-bold outline-none cursor-pointer"><option value="overall">Global Trends</option>{Object.keys(metaData.archetypes).sort().map(a => <option key={a} value={a}>{a}</option>)}</select></div>
          <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Category</label><select value={fMainType} onChange={(e) => handleCategoryChange(e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs outline-none"><option value="All">All Types</option><option value="Monster">Monster</option><option value="Spell">Spell</option><option value="Trap">Trap</option></select></div>
          <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Location</label><select value={fDeckType} onChange={(e) => handleFilterChange(setFDeckType, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs outline-none"><option value="All">All</option><option value="Main">Main Only</option><option value="Extra">Extra Only</option></select></div>

          {fMainType === 'Monster' && (
            <>
              <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Attribute</label><select value={fAttribute} onChange={(e) => handleFilterChange(setFAttribute, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{attributes.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
              <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Type/Race</label><select value={fRace} onChange={(e) => handleFilterChange(setFRace, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{monsterRaces.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Frame</label><select value={fFrame} onChange={(e) => handleFilterChange(setFFrame, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{frames.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
              <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Mechanic</label><select value={fMechanic} onChange={(e) => handleFilterChange(setFMechanic, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{mechanics.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
              <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Level Range</label><div className="flex gap-1"><select value={fLvlMin} onChange={(e) => handleFilterChange(setFLvlMin, Number(e.target.value))} className="bg-black border border-zinc-700 rounded p-1.5 text-xs text-center">{[...Array(14)].map((_,i) => <option key={i} value={i}>{i}</option>)}</select><select value={fLvlMax} onChange={(e) => handleFilterChange(setFLvlMax, Number(e.target.value))} className="bg-black border border-zinc-700 rounded p-1.5 text-xs text-center">{[...Array(14)].map((_,i) => <option key={i} value={i}>{i}</option>)}</select></div></div>
              <div className="flex flex-col w-12"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">ATK</label><input type="number" value={fAtk} onChange={(e) => handleFilterChange(setFAtk, e.target.value)} className="bg-black border border-zinc-700 rounded p-2 text-xs text-center" /></div>
              <div className="flex flex-col w-12"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">DEF</label><input type="number" value={fDef} onChange={(e) => handleFilterChange(setFDef, e.target.value)} className="bg-black border border-zinc-700 rounded p-2 text-xs text-center" /></div>
            </>
          )}

          {/* FIXED: Restored Spell/Trap property filter dropdown */}
          {(fMainType === 'Spell' || fMainType === 'Trap') && (
            <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Property</label><select value={fRace} onChange={(e) => handleFilterChange(setFRace, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{(fMainType === 'Spell' ? spellRaces : trapRaces).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          )}

          <label className="flex items-center gap-2 cursor-pointer bg-blue-900/30 border border-blue-700/50 p-2 px-4 rounded-lg text-[10px] h-[36px]"><input type="checkbox" checked={fReverse} onChange={(e) => handleFilterChange(setFReverse, e.target.checked)} className="accent-blue-500"/><span className="font-bold uppercase tracking-tighter text-blue-200">Reverse</span></label>
          <button onClick={resetFilters} className="text-[10px] font-black text-red-500 uppercase border-b border-red-900 pb-1 ml-auto">Reset</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
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
                  <button disabled={recPage === 1} onClick={() => setRecPage(p => p - 1)} className="text-xs disabled:opacity-20">◀</button>
                  <span className="text-[9px] font-mono text-zinc-500">{recPage}/{totalPages || 1}</span>
                  <button disabled={recPage === totalPages || totalPages === 0} onClick={() => setRecPage(p => p + 1)} className="text-xs disabled:opacity-20">▶</button>
                </div>
              </div>

              <div className="space-y-4">
                {currentRecs.map(r => (
                  <div key={r.name} className="bg-black border border-zinc-800 p-3 rounded-2xl flex flex-col gap-2 shadow-inner">
                    <div className="flex items-center gap-3">
                      <img src={`https://images.ygoprodeck.com/images/cards/${r.imgId}.jpg`} className="w-10 rounded shadow-md" alt="card" />
                      <div className="overflow-hidden">
                        <p className="text-[9px] font-black truncate uppercase text-zinc-200">{r.name}</p>
                        <p className="text-[10px] text-blue-500 font-bold tracking-tighter">Played in {r.inclusionRate}% of decks</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.ratios.map(ratio => (
                        <span key={ratio.label} className="text-[8px] font-bold bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-800">{ratio.label}: {ratio.val}%</span>
                      ))}
                    </div>
                    <div className="mt-2 bg-blue-900/20 text-blue-400 text-center py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-900/30">
                      Pro Avg: {r.suggestedQty}x <span className="mx-1 text-zinc-700">|</span> You: {r.userQty}x
                    </div>
                  </div>
                ))}
                {allRecs.length === 0 && <p className="text-center text-zinc-600 text-[10px] py-4 font-bold uppercase tracking-widest">Matches baseline filters.</p>}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT DECK VIEW */}
        <div className="lg:col-span-3">
          {userDeck ? (
            <div className="bg-zinc-950 p-6 md:p-10 rounded-[3rem] border border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
              <Row title="Main Deck" list={userDeck.main} />
              <Row title="Extra Deck" list={userDeck.extra} />
              <Row title="Side Deck" list={userDeck.side} />
            </div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center border-4 border-dashed border-zinc-900 rounded-[4rem] opacity-20">
              <p className="text-4xl font-black uppercase tracking-tighter text-zinc-600">Waiting for YDK file</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}