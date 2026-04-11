"use client";
import React, { useState } from 'react';
import metaData from '../meta_data.json'; 

export default function Home() {
  const [activeTab, setActiveTab] = useState('overall');
  const [selectedArch, setSelectedArch] = useState(null);
  const [selectedDeckIndex, setSelectedDeckIndex] = useState("NONE"); 
  const [archSubTab, setArchSubTab] = useState('main'); 

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const CARDS_PER_PAGE = 80; 

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

  const handleFilterChange = (setter, value) => { setter(value); setCurrentPage(1); };

  // --- FIX: Reset sub-filters when Main Category changes ---
  const handleCategoryChange = (val) => {
    setFMainType(val);
    setFRace('All');
    setFAttribute('All');
    setFFrame('All');
    setFMechanic('All');
    setFAtk('');
    setFDef('');
    setFLvlMin(0);
    setFLvlMax(13);
    setCurrentPage(1);
  };

  const handlePageInput = (e, max) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) return;
    if (val > max) val = max;
    setCurrentPage(val);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setFSearch(''); setFReverse(false); setFMainType('All'); setFDeckType('All');
    setFAttribute('All'); setFRace('All'); setFFrame('All'); setFMechanic('All');
    setFAtk(''); setFDef(''); setFLvlMin(0); setFLvlMax(13);
    setCurrentPage(1);
  };

  const renderGrid = (cardsMap, totalDecks) => {
    if (!cardsMap) return null;
    let filtered = Object.entries(cardsMap).filter(([name]) => {
      const info = metaData.cardDict[name];
      if (!info) return false;
      if (fSearch && !name.toLowerCase().includes(fSearch.toLowerCase())) return false;
      const isSpell = info.type.includes('Spell');
      const isTrap = info.type.includes('Trap');
      const isMonster = !isSpell && !isTrap;
      const isExtra = info.isExtra;
      if (fDeckType === 'Extra') { if (!isMonster || !isExtra) return false; }
      if (fDeckType === 'Main') { if (isMonster && isExtra) return false; }
      if (fMainType === 'Monster' && !isMonster) return false;
      if (fMainType === 'Spell' && !isSpell) return false;
      if (fMainType === 'Trap' && !isTrap) return false;
      if (isMonster) {
        if (fAttribute !== 'All' && info.attribute !== fAttribute) return false;
        if (fRace !== 'All' && info.race !== fRace) return false;
        if (fFrame !== 'All' && !info.type.includes(fFrame)) return false;
        if (fMechanic === 'Tuner' && !info.isTuner) return false;
        if (fMechanic === 'Pendulum' && !info.isPendulum) return false;
        if (fMechanic === 'Spirit' && !info.isSpirit) return false;
        if (fMechanic === 'Gemini' && !info.isGemini) return false;
        if (fMechanic === 'Union' && !info.isUnion) return false;
        if (fMechanic === 'Toon' && !info.isToon) return false;
        if (fMechanic === 'Flip' && !info.isFlip) return false;
        if (fAtk !== '' && info.atk != fAtk) return false;
        if (fDef !== '' && info.def != fDef) return false;
        if (info.level < fLvlMin || info.level > fLvlMax) return false;
      } else { if (fRace !== 'All' && info.race !== fRace) return false; }
      return true;
    });

    filtered.sort(([, a], [, b]) => b.playedIn - a.playedIn);
    if (fReverse) filtered.reverse();

    const totalPages = Math.ceil(filtered.length / CARDS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE);

    const Pagination = () => (
      <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-2 px-4 rounded-xl shadow-lg">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p-1))} className="hover:text-blue-500 disabled:opacity-10 text-xs">◀</button>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-zinc-500 uppercase">Page</span>
          <input type="number" value={currentPage} onChange={(e) => handlePageInput(e, totalPages)} className="w-10 bg-black border border-zinc-700 rounded text-center text-[10px] font-black py-1 focus:border-blue-500 outline-none" />
          <span className="text-[9px] font-bold text-zinc-500 uppercase">of {totalPages || 1}</span>
        </div>
        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} className="hover:text-blue-500 disabled:opacity-10 text-xs">▶</button>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center"><span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Library: {filtered.length} Cards</span><Pagination /></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {paginated.map(([name, data]) => (
            <div key={name} className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg hover:border-blue-500 transition shadow-2xl">
              <img src={`https://images.ygoprodeck.com/images/cards/${data.imgId}.jpg`} className="w-full rounded-md mb-1.5" alt={name}/>
              <div className="text-[9px] font-bold text-zinc-400 truncate mb-1.5 text-center uppercase tracking-tighter">{name}</div>
              <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-center mb-1.5">
                <div className="bg-blue-900/30 rounded py-0.5 text-blue-300">3x: {data["3x"]}</div>
                <div className="bg-green-900/30 rounded py-0.5 text-green-300">2x: {data["2x"]}</div>
                <div className="bg-yellow-900/30 rounded py-0.5 text-yellow-300">1x: {data["1x"]}</div>
                <div className="bg-red-900/30 rounded py-0.5 text-red-400">0x: {totalDecks - data.playedIn}</div>
              </div>
              <div className="mt-auto text-center font-black text-blue-500 text-[11px] border-t border-zinc-800 pt-1.5">{Math.round((data.playedIn / totalDecks) * 100)}% PLAYED</div>
            </div>
          ))}
        </div>
        <div className="flex justify-center py-10"><Pagination /></div>
      </div>
    );
  };

  const renderIndividualDeck = (deck) => {
    const Row = ({title, list}) => (
      <div className="mb-8">
        <h3 className="text-zinc-500 font-black text-xs uppercase tracking-[0.3em] mb-4 border-b border-zinc-800 pb-2">{title} — {list.length} Cards</h3>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5">
          {list.map((c, i) => (
            <img key={i} src={`https://images.ygoprodeck.com/images/cards/${c.imgId}.jpg`} className="w-full rounded shadow hover:scale-150 hover:z-50 transition-all cursor-help" title={c.name} />
          ))}
        </div>
      </div>
    );
    return (
      <div className="animate-in fade-in slide-in-from-top-4 duration-500 max-w-7xl mx-auto bg-zinc-950 p-6 md:p-10 rounded-3xl border border-zinc-800 shadow-inner">
        <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-blue-400 uppercase tracking-tighter italic">{deck.player}</h2>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-1">{deck.place} • {deck.event}</p>
        </div>
        <Row title="Main Deck" list={deck.main} /><Row title="Extra Deck" list={deck.extra} /><Row title="Side Deck" list={deck.side} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans">
      <header className="flex flex-col items-center mb-10">
        <h1 className="text-6xl font-black tracking-tighter italic text-blue-600 mb-8 uppercase text-center drop-shadow-[0_0_15px_rgba(37,99,235,0.3)]">Pro Meta Scan</h1>
        <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800 gap-1 flex-wrap justify-center shadow-xl">
          {['overall', 'side', 'archetypes'].map(t => (
            <button key={t} onClick={() => { setActiveTab(t); setSelectedDeckIndex("NONE"); resetFilters(); }} className={`px-10 py-3 rounded-xl font-black text-xs uppercase transition ${activeTab === t ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>{t}</button>
          ))}
        </div>
      </header>

      {selectedDeckIndex === "NONE" && (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl mb-12 shadow-2xl space-y-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col flex-grow min-w-[200px]"><label className="text-[10px] text-blue-500 uppercase font-bold mb-1">Search</label><input type="text" value={fSearch} onChange={(e) => handleFilterChange(setFSearch, e.target.value)} placeholder="Card name..." className="bg-black border border-zinc-700 rounded-lg p-2 text-xs outline-none focus:border-blue-500" /></div>
            <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Category</label><select value={fMainType} onChange={(e) => handleCategoryChange(e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs outline-none"><option value="All">All Types</option><option value="Monster">Monster</option><option value="Spell">Spell</option><option value="Trap">Trap</option></select></div>
            <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Location</label><select value={fDeckType} onChange={(e) => handleFilterChange(setFDeckType, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs outline-none"><option value="All">All</option><option value="Main">Main Only</option><option value="Extra">Extra Only</option></select></div>

            {fMainType === 'Monster' && (
              <>
                <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Attribute</label><select value={fAttribute} onChange={(e) => handleFilterChange(setFAttribute, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{attributes.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Race/Type</label><select value={fRace} onChange={(e) => handleFilterChange(setFRace, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{monsterRaces.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Frame</label><select value={fFrame} onChange={(e) => handleFilterChange(setFFrame, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{frames.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Mechanic</label><select value={fMechanic} onChange={(e) => handleFilterChange(setFMechanic, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{mechanics.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                <div className="flex flex-col"><label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Lvl/Rank Range</label><div className="flex gap-1"><select value={fLvlMin} onChange={(e) => handleFilterChange(setFLvlMin, Number(e.target.value))} className="bg-black border border-zinc-700 rounded p-1.5 text-xs text-center">{[...Array(14)].map((_,i) => <option key={i} value={i}>{i}</option>)}</select><select value={fLvlMax} onChange={(e) => handleFilterChange(setFLvlMax, Number(e.target.value))} className="bg-black border border-zinc-700 rounded p-1.5 text-xs text-center">{[...Array(14)].map((_,i) => <option key={i} value={i}>{i}</option>)}</select></div></div>
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
      )}

      <div className="animate-in fade-in duration-700">
        {activeTab === 'overall' && renderGrid(metaData.overall, metaData.totalDecks)}
        {activeTab === 'side' && renderGrid(metaData.overallSide, metaData.totalDecks)}

        {activeTab === 'archetypes' && (
          <div className="space-y-10">
            <div className="flex flex-wrap gap-2 justify-center">
              {Object.entries(metaData.archetypes).sort((a,b) => b[1].count - a[1].count).map(([name, data]) => (
                <button key={name} onClick={() => { setSelectedArch(name); setSelectedDeckIndex("NONE"); }} className={`px-4 py-2 rounded-full text-[10px] font-black border transition ${selectedArch === name ? 'bg-blue-600 border-blue-400 text-white shadow-xl' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-500'}`}>{name} — {data.count}</button>
              ))}
            </div>
            {selectedArch && (
              <div className="space-y-8">
                <div className="flex flex-col items-center gap-6">
                  <h2 className="text-4xl font-black italic text-blue-500 uppercase tracking-tighter">{selectedArch}</h2>
                  <div className="flex flex-col items-center bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-2xl">
                    <label className="text-[10px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Topping Decklists</label>
                    <select value={selectedDeckIndex} onChange={(e) => setSelectedDeckIndex(e.target.value)} className="bg-black border border-zinc-700 text-blue-400 rounded-xl p-3 text-xs font-black outline-none w-80 shadow-inner cursor-pointer">
                      <option value="NONE">NONE (Statistics)</option>
                      {metaData.archetypes[selectedArch].specificDecks.map((d, i) => (<option key={i} value={i}>{d.player} - {d.place} {d.event}</option>))}
                    </select>
                  </div>
                </div>
                {selectedDeckIndex === "NONE" ? (
                  <div>
                    <div className="flex justify-center mb-8"><div className="flex bg-black p-1.5 rounded-2xl text-[10px] font-black uppercase border border-zinc-800 shadow-inner"><button onClick={() => setArchSubTab('main')} className={`px-10 py-3 rounded-xl transition-all ${archSubTab === 'main' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-400'}`}>General Main</button><button onClick={() => setArchSubTab('side')} className={`px-10 py-3 rounded-xl transition-all ${archSubTab === 'side' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-400'}`}>General Side</button></div></div>
                    {renderGrid(archSubTab === 'main' ? metaData.archetypes[selectedArch].cards : metaData.archetypes[selectedArch].sideCards, metaData.archetypes[selectedArch].count)}
                  </div>
                ) : (renderIndividualDeck(metaData.archetypes[selectedArch].specificDecks[selectedDeckIndex]))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}