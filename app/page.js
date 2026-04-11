"use client";
import React, { useState } from 'react';
import metaData from '../meta_data.json'; 

export default function Home() {
  const [activeTab, setActiveTab] = useState('overall');
  const [selectedArch, setSelectedArch] = useState(null);
  const [archSubTab, setArchSubTab] = useState('main'); 

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const CARDS_PER_PAGE = 60;

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
  const frames = ['All', 'Normal', 'Effect', 'Fusion', 'Synchro', 'Xyz', 'Link', 'Ritual'];
  const mechanics = ['All', 'Tuner', 'Pendulum', 'Spirit', 'Gemini', 'Union', 'Toon', 'Flip'];

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const handlePageInput = (e, max) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) return;
    if (val < 1) val = 1;
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
      } else {
        if (fRace !== 'All' && info.race !== fRace) return false;
      }
      return true;
    });

    filtered.sort(([, a], [, b]) => b.playedIn - a.playedIn);
    if (fReverse) filtered.reverse();

    const totalResults = filtered.length;
    const totalPages = Math.ceil(totalResults / CARDS_PER_PAGE);
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    const paginatedCards = filtered.slice(startIndex, startIndex + CARDS_PER_PAGE);

    const PaginationControls = () => (
      <div className="flex items-center gap-4 bg-zinc-900/80 p-2 px-4 rounded-xl border border-zinc-800 shadow-lg">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="p-2 hover:text-blue-400 disabled:opacity-20 transition">◀</button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase">Page</span>
          <input type="number" value={currentPage} onChange={(e) => handlePageInput(e, totalPages)} className="w-12 bg-black border border-zinc-700 rounded text-center text-xs font-black py-1 focus:border-blue-500 outline-none" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase">of {totalPages || 1}</span>
        </div>
        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="p-2 hover:text-blue-400 disabled:opacity-20 transition">▶</button>
      </div>
    );

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Showing {startIndex + 1}-{Math.min(startIndex + CARDS_PER_PAGE, totalResults)} of {totalResults}</span>
            <PaginationControls />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {paginatedCards.map(([name, data]) => (
            <div key={name} className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg hover:border-blue-500 transition group relative shadow-2xl">
              <img src={`https://images.ygoprodeck.com/images/cards/${data.imgId}.jpg`} className="w-full rounded mb-2" alt={name}/>
              <div className="text-[9px] font-bold text-zinc-500 truncate mb-2 text-center uppercase">{name}</div>
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-center">
                <div className="bg-blue-900/40 p-1 rounded text-blue-300">3x: {data["3x"]}</div>
                <div className="bg-green-900/40 p-1 rounded text-green-300">2x: {data["2x"]}</div>
                <div className="bg-yellow-900/40 p-1 rounded text-yellow-300">1x: {data["1x"]}</div>
                <div className="bg-red-900/40 p-1 rounded text-red-400">0x: {totalDecks - data.playedIn}</div>
              </div>
              <div className="mt-2 text-center font-black text-blue-500 text-xs border-t border-zinc-800 pt-2">{Math.round((data.playedIn / totalDecks) * 100)}% PLAYED</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-4 py-10 border-t border-zinc-900">
             <PaginationControls />
             <button onClick={() => { setCurrentPage(1); window.scrollTo({top:0, behavior:'smooth'}); }} className="text-zinc-700 hover:text-zinc-400 text-[10px] font-bold uppercase tracking-widest transition">Return to Start</button>
        </div>
      </div>
    );
  };

  const sortedArchetypes = Object.entries(metaData.archetypes).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <header className="flex flex-col items-center mb-8">
        <h1 className="text-5xl font-black tracking-tighter italic text-blue-600 mb-6 uppercase text-center">Pro Meta Scan</h1>
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 gap-1 flex-wrap justify-center">
          {['overall', 'side', 'archetypes'].map(t => (
            <button key={t} onClick={() => { setActiveTab(t); resetFilters(); }} className={`px-8 py-2 rounded-lg font-bold text-xs uppercase transition ${activeTab === t ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-200'}`}>
              {t === 'overall' ? 'Main Trends' : t === 'side' ? 'Global Side' : 'Archetypes'}
            </button>
          ))}
        </div>
      </header>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-10 shadow-2xl space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col flex-grow min-w-[200px]">
            <label className="text-[10px] text-blue-500 uppercase font-black mb-1">Search Database</label>
            <input type="text" value={fSearch} onChange={(e) => handleFilterChange(setFSearch, e.target.value)} placeholder="Search card..." className="bg-black border border-zinc-700 rounded-lg p-2 text-xs outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Category</label>
            <select value={fMainType} onChange={(e) => handleFilterChange(setFMainType, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs outline-none">
              <option value="All">All Types</option>
              <option value="Monster">Monster</option>
              <option value="Spell">Spell</option>
              <option value="Trap">Trap</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Deck Location</label>
            <select value={fDeckType} onChange={(e) => handleFilterChange(setFDeckType, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs outline-none">
              <option value="All">All Decks</option>
              <option value="Main">Main Deck Only</option>
              <option value="Extra">Extra Deck Only</option>
            </select>
          </div>

          {fMainType === 'Monster' && (
            <>
              <div className="flex flex-col">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Attribute</label>
                <select value={fAttribute} onChange={(e) => handleFilterChange(setFAttribute, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{attributes.map(a => <option key={a} value={a}>{a}</option>)}</select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Type (Race)</label>
                <select value={fRace} onChange={(e) => handleFilterChange(setFRace, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{monsterRaces.map(r => <option key={r} value={r}>{r}</option>)}</select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Frame</label>
                <select value={fFrame} onChange={(e) => handleFilterChange(setFFrame, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{frames.map(f => <option key={f} value={f}>{f}</option>)}</select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Mechanic</label>
                <select value={fMechanic} onChange={(e) => handleFilterChange(setFMechanic, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">{mechanics.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Lvl/Rank</label>
                <div className="flex gap-1">
                  <select value={fLvlMin} onChange={(e) => handleFilterChange(setFLvlMin, Number(e.target.value))} className="bg-black border border-zinc-700 rounded p-1.5 text-xs">{[...Array(14)].map((_,i) => <option key={i} value={i}>{i}</option>)}</select>
                  <select value={fLvlMax} onChange={(e) => handleFilterChange(setFLvlMax, Number(e.target.value))} className="bg-black border border-zinc-700 rounded p-1.5 text-xs">{[...Array(14)].map((_,i) => <option key={i} value={i}>{i}</option>)}</select>
                </div>
              </div>
              <div className="flex flex-col w-12">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">ATK</label>
                <input type="number" value={fAtk} onChange={(e) => handleFilterChange(setFAtk, e.target.value)} className="bg-black border border-zinc-700 rounded p-1.5 text-xs text-center" />
              </div>
              <div className="flex flex-col w-12">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">DEF</label>
                <input type="number" value={fDef} onChange={(e) => handleFilterChange(setFDef, e.target.value)} className="bg-black border border-zinc-700 rounded p-1.5 text-xs text-center" />
              </div>
            </>
          )}

          {(fMainType === 'Spell' || fMainType === 'Trap') && (
            <div className="flex flex-col">
              <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Property</label>
              <select value={fRace} onChange={(e) => handleFilterChange(setFRace, e.target.value)} className="bg-black border border-zinc-700 rounded-lg p-2 text-xs">
                <option value="All">All</option>
                {(fMainType === 'Spell' ? ['Normal', 'Field', 'Equip', 'Continuous', 'Quick-Play', 'Ritual'] : ['Normal', 'Continuous', 'Counter']).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer bg-blue-900/30 border border-blue-700/50 p-2 px-4 rounded-lg text-[10px] h-[34px]">
            <input type="checkbox" checked={fReverse} onChange={(e) => handleFilterChange(setFReverse, e.target.checked)} className="accent-blue-500" />
            <span className="font-bold uppercase tracking-tighter text-blue-200">Reverse Sort</span>
          </label>
          <button onClick={resetFilters} className="text-[10px] font-black text-red-500 uppercase border-b border-red-900 pb-1 hover:text-red-400 transition">Reset</button>
        </div>
      </div>

      <div className="animate-in fade-in duration-700">
        {activeTab === 'overall' && renderGrid(metaData.overall, metaData.totalDecks)}
        {activeTab === 'side' && renderGrid(metaData.overallSide, metaData.totalDecks)}

        {activeTab === 'archetypes' && (
            <div className="space-y-10">
                <div className="flex flex-wrap gap-2 justify-center">
                    {sortedArchetypes.map(([name, data]) => (
                    <button key={name} onClick={() => { setSelectedArch(name); setArchSubTab('main'); setCurrentPage(1); }} className={`px-4 py-1 rounded-full text-[10px] font-bold border transition ${selectedArch === name ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>
                        {name} — {data.count}
                    </button>
                    ))}
                </div>
                {selectedArch && (
                    <div>
                    <div className="flex flex-col items-center mb-8 bg-zinc-900/30 p-6 rounded-3xl border border-zinc-800 shadow-inner text-center">
                        <h2 className="text-3xl font-black italic text-blue-500 mb-6 uppercase tracking-tighter">{selectedArch}</h2>
                        <div className="flex bg-black p-1 rounded-xl text-[10px] font-bold uppercase border border-zinc-800">
                            <button onClick={() => {setArchSubTab('main'); setCurrentPage(1);}} className={`px-8 py-2 rounded-lg transition-all ${archSubTab === 'main' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}>Main/Extra</button>
                            <button onClick={() => {setArchSubTab('side'); setCurrentPage(1);}} className={`px-8 py-2 rounded-lg transition-all ${archSubTab === 'side' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}>Side Deck</button>
                        </div>
                    </div>
                    {renderGrid(archSubTab === 'main' ? metaData.archetypes[selectedArch].cards : metaData.archetypes[selectedArch].sideCards, metaData.archetypes[selectedArch].count)}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}