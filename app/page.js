"use client";
import React, { useState } from 'react';
import metaData from '../meta_data.json'; 

export default function Home() {
  const [activeTab, setActiveTab] = useState('overall');
  const [selectedArch, setSelectedArch] = useState(null);
  const [archSubTab, setArchSubTab] = useState('main'); 

  // --- FILTER STATES ---
  const [fSearch, setFSearch] = useState('');
  const [fReverse, setFReverse] = useState(false);
  const [fMainType, setFMainType] = useState('All'); 
  const [fAttribute, setFAttribute] = useState('All');
  const [fRace, setFRace] = useState('All'); 
  const [fExtraDeck, setFExtraDeck] = useState(false);
  const [fMonsterType, setFMonsterType] = useState('All'); 
  const [fSubtype, setFSubtype] = useState('All'); 
  const [fAtk, setFAtk] = useState('');
  const [fDef, setFDef] = useState('');
  const [fLvlMin, setFLvlMin] = useState(0);
  const [fLvlMax, setFLvlMax] = useState(13);

  const attributes = ['All', 'DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'];
  const monsterRaces = ['All', 'Aqua', 'Beast', 'Beast-Warrior', 'Cyberse', 'Dinosaur', 'Divine-Beast', 'Dragon', 'Fairy', 'Fiend', 'Fish', 'Illusion', 'Insect', 'Machine', 'Plant', 'Psychic', 'Pyro', 'Reptile', 'Rock', 'Sea Serpent', 'Spellcaster', 'Thunder', 'Warrior', 'Winged Beast', 'Wyrm'];
  const spellRaces = ['All', 'Normal', 'Field', 'Equip', 'Continuous', 'Quick-Play', 'Ritual'];
  const trapRaces = ['All', 'Normal', 'Continuous', 'Counter'];
  const monsterTypes = ['All', 'Effect', 'Normal', 'Fusion', 'Synchro', 'XYZ', 'Link', 'Pendulum', 'Ritual'];
  const subtypes = ['All', 'Tuner', 'Gemini', 'Spirit', 'Toon', 'Union'];

  const resetFilters = () => {
    setFSearch(''); setFReverse(false); setFMainType('All'); setFAttribute('All'); 
    setFRace('All'); setFExtraDeck(false); setFMonsterType('All'); 
    setFSubtype('All'); setFAtk(''); setFDef(''); setFLvlMin(0); setFLvlMax(13);
  };

  const renderGrid = (cardsMap, totalDecks) => {
    if (!cardsMap) return null;

    let filtered = Object.entries(cardsMap).filter(([name]) => {
      const info = metaData.cardDict[name];
      if (!info) return false;

      // 1. Text Search
      if (fSearch && !name.toLowerCase().includes(fSearch.toLowerCase())) return false;

      const isSpell = info.type.includes('Spell');
      const isTrap = info.type.includes('Trap');
      const isMonster = !isSpell && !isTrap;
      const isExtra = info.type.includes('Fusion') || info.type.includes('Synchro') || info.type.includes('XYZ') || info.type.includes('Link');

      // 2. Type/Attribute Filters
      if (fMainType === 'Monster' && !isMonster) return false;
      if (fMainType === 'Spell' && !isSpell) return false;
      if (fMainType === 'Trap' && !isTrap) return false;

      if (isMonster) {
        if (fExtraDeck && !isExtra) return false;
        if (fAttribute !== 'All' && info.attribute !== fAttribute) return false;
        if (fRace !== 'All' && info.race !== fRace) return false;
        if (fMonsterType !== 'All' && !info.type.includes(fMonsterType)) return false;
        if (fSubtype !== 'All' && !info.type.includes(fSubtype)) return false;
        if (fAtk !== '' && info.atk != fAtk) return false;
        if (fDef !== '' && info.def != fDef) return false;
        if (info.level < fLvlMin || info.level > fLvlMax) return false;
      } else {
        // Spell/Trap Properties
        if (fRace !== 'All' && info.race !== fRace) return false;
      }

      return true;
    });

    // 3. Sorting
    filtered.sort(([, a], [, b]) => b.playedIn - a.playedIn);
    if (fReverse) filtered.reverse();

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.slice(0, 100).map(([name, data]) => (
          <div key={name} className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg hover:border-blue-500 transition">
            <img src={`https://images.ygoprodeck.com/images/cards/${data.imgId}.jpg`} className="w-full rounded mb-2" alt={name}/>
            <div className="text-[9px] font-bold text-zinc-500 truncate mb-2 text-center uppercase">{name}</div>
            <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
              <div className="bg-blue-900/40 p-1 rounded text-blue-300 text-center">3x: {data["3x"]}</div>
              <div className="bg-green-900/40 p-1 rounded text-green-300 text-center">2x: {data["2x"]}</div>
              <div className="bg-yellow-900/40 p-1 rounded text-yellow-300 text-center">1x: {data["1x"]}</div>
              <div className="bg-red-900/40 p-1 rounded text-red-400 text-center">0x: {totalDecks - data.playedIn}</div>
            </div>
            <div className="mt-2 text-center font-black text-blue-500 text-xs border-t border-zinc-800 pt-2">
              {Math.round((data.playedIn / totalDecks) * 100)}% PLAY RATE
            </div>
          </div>
        ))}
      </div>
    );
  };

  const sortedArchetypes = Object.entries(metaData.archetypes).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <header className="flex flex-col items-center mb-8">
        <h1 className="text-5xl font-black tracking-tighter italic text-blue-600 mb-6">PRO META SCAN</h1>
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 gap-1 flex-wrap justify-center">
          {['overall', 'side', 'archetypes'].map(t => (
            <button key={t} onClick={() => { setActiveTab(t); resetFilters(); }} 
                className={`px-8 py-2 rounded-lg font-bold text-xs uppercase transition ${activeTab === t ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-200'}`}>
              {t === 'overall' ? 'Main' : t === 'side' ? 'Side' : 'Archetypes'}
            </button>
          ))}
        </div>
      </header>

      {/* DETAILED FILTER TOOLBAR */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-10">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col flex-grow">
            <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Search Cards</label>
            <input type="text" value={fSearch} onChange={(e) => setFSearch(e.target.value)} placeholder="Type name..." className="bg-black border border-zinc-700 rounded p-1 text-xs outline-none focus:border-blue-500" />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Category</label>
            <select value={fMainType} onChange={(e) => { setFMainType(e.target.value); setFRace('All'); }} className="bg-black border border-zinc-700 rounded p-1 text-xs outline-none">
              <option value="All">All Types</option>
              <option value="Monster">Monster</option>
              <option value="Spell">Spell</option>
              <option value="Trap">Trap</option>
            </select>
          </div>

          {fMainType === 'Monster' && (
            <>
              <div className="flex flex-col">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Range (Lvl/Rank)</label>
                <div className="flex gap-1">
                  <select value={fLvlMin} onChange={(e) => setFLvlMin(Number(e.target.value))} className="bg-black border border-zinc-700 rounded p-1 text-[10px]">{[...Array(14)].map((_,i) => <option key={i} value={i}>{i}</option>)}</select>
                  <select value={fLvlMax} onChange={(e) => setFLvlMax(Number(e.target.value))} className="bg-black border border-zinc-700 rounded p-1 text-[10px]">{[...Array(14)].map((_,i) => <option key={i} value={i}>{i}</option>)}</select>
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Attribute</label>
                <select value={fAttribute} onChange={(e) => setFAttribute(e.target.value)} className="bg-black border border-zinc-700 rounded p-1 text-xs">{attributes.map(a => <option key={a} value={a}>{a}</option>)}</select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Race</label>
                <select value={fRace} onChange={(e) => setFRace(e.target.value)} className="bg-black border border-zinc-700 rounded p-1 text-xs">{monsterRaces.map(r => <option key={r} value={r}>{r}</option>)}</select>
              </div>
              <div className="flex flex-col w-12">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">ATK</label>
                <input type="number" value={fAtk} onChange={(e) => setFAtk(e.target.value)} className="bg-black border border-zinc-700 rounded p-1 text-xs text-center" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-black border border-zinc-700 p-1 px-3 rounded text-[10px] h-7">
                <input type="checkbox" checked={fExtraDeck} onChange={(e) => setFExtraDeck(e.target.checked)} />
                <span className="font-bold">Extra Only</span>
              </label>
            </>
          )}

          {fMainType !== 'Monster' && fMainType !== 'All' && (
             <div className="flex flex-col">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Property</label>
                <select value={fRace} onChange={(e) => setFRace(e.target.value)} className="bg-black border border-zinc-700 rounded p-1 text-xs">
                  {(fMainType === 'Spell' ? spellRaces : trapRaces).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
             </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer bg-blue-900/20 border border-blue-800 p-1 px-3 rounded text-[10px] h-7">
            <input type="checkbox" checked={fReverse} onChange={(e) => setFReverse(e.target.checked)} />
            <span className="font-bold uppercase">Reverse</span>
          </label>

          <button onClick={resetFilters} className="text-[10px] font-bold text-red-500 uppercase hover:underline">Clear</button>
        </div>
      </div>

      {activeTab === 'overall' && renderGrid(metaData.overall, metaData.totalDecks)}
      {activeTab === 'side' && renderGrid(metaData.overallSide, metaData.totalDecks)}

      {activeTab === 'archetypes' && (
        <>
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {sortedArchetypes.map(([name, data]) => (
              <button key={name} onClick={() => { setSelectedArch(name); setArchSubTab('main'); }} className={`px-4 py-1 rounded-full text-[10px] font-bold border transition ${selectedArch === name ? 'bg-blue-600 border-blue-400 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                {name} — {data.count}
              </button>
            ))}
          </div>
          {selectedArch && (
            <div className="animate-in fade-in duration-500">
               <div className="flex flex-col items-center mb-8">
                 <h2 className="text-3xl font-black italic text-blue-500 mb-4">{selectedArch}</h2>
                 <div className="flex bg-zinc-900 p-1 rounded-lg text-[10px] font-bold uppercase border border-zinc-800">
                    <button onClick={() => setArchSubTab('main')} className={`px-6 py-1 rounded-md ${archSubTab === 'main' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Main/Extra</button>
                    <button onClick={() => setArchSubTab('side')} className={`px-6 py-1 rounded-md ${archSubTab === 'side' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Side Deck</button>
                 </div>
              </div>
              {renderGrid(archSubTab === 'main' ? metaData.archetypes[selectedArch].cards : metaData.archetypes[selectedArch].sideCards, metaData.archetypes[selectedArch].count)}
            </div>
          )}
        </>
      )}
    </div>
  );
}