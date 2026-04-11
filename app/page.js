"use client";
import React, { useState } from 'react';
import metaData from '../meta_data.json'; 

export default function Home() {
  const [activeTab, setActiveTab] = useState('overall');
  const [selectedArch, setSelectedArch] = useState(null);

  // FILTER STATES
  const [fMainType, setFMainType] = useState('All'); // All, Monster, Spell, Trap
  const [fAttribute, setFAttribute] = useState('All');
  const [fRace, setFRace] = useState('All'); // Dragon, Field, Continuous, etc.
  const [fExtraDeck, setFExtraDeck] = useState(false);
  const [fMonsterType, setFMonsterType] = useState('All'); // Synchro, XYZ, Link, Pendulum, Normal, Effect, Ritual
  const [fSubtype, setFSubtype] = useState('All'); // Tuner, Gemini, Spirit, Toon, Union
  const [fAtk, setFAtk] = useState('');
  const [fDef, setFDef] = useState('');

  // Dropdown Options
  const attributes = ['All', 'DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'];
  const monsterRaces = ['All', 'Aqua', 'Beast', 'Beast-Warrior', 'Cyberse', 'Dinosaur', 'Divine-Beast', 'Dragon', 'Fairy', 'Fiend', 'Fish', 'Illusion', 'Insect', 'Machine', 'Plant', 'Psychic', 'Pyro', 'Reptile', 'Rock', 'Sea Serpent', 'Spellcaster', 'Thunder', 'Warrior', 'Winged Beast', 'Wyrm'];
  const spellRaces = ['All', 'Normal', 'Field', 'Equip', 'Continuous', 'Quick-Play', 'Ritual'];
  const trapRaces = ['All', 'Normal', 'Continuous', 'Counter'];
  const monsterTypes = ['All', 'Effect', 'Normal', 'Fusion', 'Synchro', 'XYZ', 'Link', 'Pendulum', 'Ritual'];
  const subtypes = ['All', 'Tuner', 'Gemini', 'Spirit', 'Toon', 'Union'];

  const resetFilters = () => {
    setFMainType('All'); setFAttribute('All'); setFRace('All'); setFExtraDeck(false);
    setFMonsterType('All'); setFSubtype('All'); setFAtk(''); setFDef('');
  };

  // FILTERING LOGIC
  const filterCards = (cardsMap) => {
    if (!cardsMap) return [];

    return Object.entries(cardsMap).filter(([name]) => {
      const info = metaData.cardDict[name];
      if (!info) return false;

      const isSpell = info.type.includes('Spell');
      const isTrap = info.type.includes('Trap');
      const isMonster = !isSpell && !isTrap;
      const isExtraDeck = info.type.includes('Fusion') || info.type.includes('Synchro') || info.type.includes('XYZ') || info.type.includes('Link');

      // 1. Main Type Check
      if (fMainType === 'Monster' && !isMonster) return false;
      if (fMainType === 'Spell' && !isSpell) return false;
      if (fMainType === 'Trap' && !isTrap) return false;

      // 2. Monster Specific Checks
      if (isMonster) {
        if (fExtraDeck && !isExtraDeck) return false;
        if (fAttribute !== 'All' && info.attribute !== fAttribute) return false;
        if (fRace !== 'All' && info.race !== fRace) return false;
        if (fMonsterType !== 'All' && !info.type.includes(fMonsterType)) return false;
        if (fSubtype !== 'All' && !info.type.includes(fSubtype)) return false;
        if (fAtk !== '' && info.atk != fAtk) return false;
        if (fDef !== '' && info.def != fDef) return false;
      }

      // 3. Spell/Trap Specific Checks
      if (isSpell && fMainType === 'Spell') {
        if (fRace !== 'All' && info.race !== fRace) return false;
      }
      if (isTrap && fMainType === 'Trap') {
        if (fRace !== 'All' && info.race !== fRace) return false;
      }

      return true;
    });
  };

  const renderGrid = (cardsMap, totalDecks) => {
    const filtered = filterCards(cardsMap);
    const sorted = filtered.sort(([, a], [, b]) => b.playedIn - a.playedIn).slice(0, 100);

    if (sorted.length === 0) return <div className="text-center py-20 text-zinc-600 font-bold">No cards match your filter.</div>;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {sorted.map(([name, data]) => (
          <div key={name} className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg shadow-xl hover:border-blue-500 transition-all group">
            <div className="relative overflow-hidden rounded mb-2">
                <img src={`https://images.ygoprodeck.com/images/cards/${data.imgId}.jpg`} className="w-full transition-transform group-hover:scale-110" alt={name}/>
            </div>
            <div className="text-[10px] text-zinc-400 font-bold truncate text-center mb-2 uppercase">{name}</div>
            <div className="grid grid-cols-2 gap-1 text-[10px] font-mono mb-2">
              <div className="bg-blue-900/30 p-1 rounded text-blue-400 text-center">3x: {data["3x"]}</div>
              <div className="bg-green-900/30 p-1 rounded text-green-400 text-center">2x: {data["2x"]}</div>
              <div className="bg-yellow-900/30 p-1 rounded text-yellow-400 text-center">1x: {data["1x"]}</div>
              <div className="bg-red-900/30 p-1 rounded text-red-400 text-center">0x: {totalDecks - data.playedIn}</div>
            </div>
            <div className="text-center font-black text-blue-500 text-sm border-t border-zinc-800 pt-2">
              {Math.round((data.playedIn / totalDecks) * 100)}% PLAYED
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <header className="flex flex-col items-center mb-8">
        <h1 className="text-5xl font-black tracking-tighter italic text-blue-600 mb-6 drop-shadow-[0_0_15px_rgba(37,99,235,0.4)]">META SCANNER</h1>
        
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 gap-1 flex-wrap justify-center">
          {[
            {id: 'overall', label: 'Main/Extra'},
            {id: 'side', label: 'Side Deck'},
            {id: 'archetypes', label: 'Archetypes'}
          ].map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); resetFilters(); }} 
                className={`px-6 py-2 rounded-lg font-bold text-xs uppercase transition-all ${activeTab === t.id ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-200'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* FILTER TOOLBAR */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-8">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-blue-400 uppercase tracking-widest text-xs border-l-2 border-blue-500 pl-2">Filter Tools</h3>
            <button onClick={resetFilters} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase">Reset Filters</button>
        </div>
        
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Card Type</label>
            <select value={fMainType} onChange={(e) => { setFMainType(e.target.value); setFRace('All'); setFMonsterType('All'); }} className="bg-black border border-zinc-700 rounded p-1 text-xs outline-none">
              <option value="All">All Cards</option>
              <option value="Monster">Monster</option>
              <option value="Spell">Spell</option>
              <option value="Trap">Trap</option>
            </select>
          </div>

          {fMainType === 'Monster' && (
            <>
              <div className="flex flex-col">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Monster Type</label>
                <select value={fMonsterType} onChange={(e) => setFMonsterType(e.target.value)} className="bg-black border border-zinc-700 rounded p-1 text-xs outline-none">
                  {monsterTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Subtype</label>
                <select value={fSubtype} onChange={(e) => setFSubtype(e.target.value)} className="bg-black border border-zinc-700 rounded p-1 text-xs outline-none">
                  {subtypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Attribute</label>
                <select value={fAttribute} onChange={(e) => setFAttribute(e.target.value)} className="bg-black border border-zinc-700 rounded p-1 text-xs outline-none">
                  {attributes.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Race</label>
                <select value={fRace} onChange={(e) => setFRace(e.target.value)} className="bg-black border border-zinc-700 rounded p-1 text-xs outline-none">
                  {monsterRaces.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex flex-col w-16">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">ATK</label>
                <input type="number" value={fAtk} onChange={(e) => setFAtk(e.target.value)} placeholder="Any" className="bg-black border border-zinc-700 rounded p-1 text-xs outline-none text-center" />
              </div>
              <div className="flex flex-col w-16">
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">DEF</label>
                <input type="number" value={fDef} onChange={(e) => setFDef(e.target.value)} placeholder="Any" className="bg-black border border-zinc-700 rounded p-1 text-xs outline-none text-center" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-black border border-zinc-700 p-1 px-3 rounded text-xs">
                <input type="checkbox" checked={fExtraDeck} onChange={(e) => setFExtraDeck(e.target.checked)} />
                <span className="font-bold text-zinc-300">Extra Deck Only</span>
              </label>
            </>
          )}

          {fMainType === 'Spell' && (
            <div className="flex flex-col">
              <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Spell Property</label>
              <select value={fRace} onChange={(e) => setFRace(e.target.value)} className="bg-black border border-zinc-700 rounded p-1 text-xs outline-none">
                {spellRaces.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          {fMainType === 'Trap' && (
            <div className="flex flex-col">
              <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Trap Property</label>
              <select value={fRace} onChange={(e) => setFRace(e.target.value)} className="bg-black border border-zinc-700 rounded p-1 text-xs outline-none">
                {trapRaces.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT RENDERERS */}
      {activeTab === 'overall' && renderGrid(metaData.overall, metaData.totalDecks)}
      {activeTab === 'side' && renderGrid(metaData.overallSide, metaData.totalDecks)}

      {activeTab === 'archetypes' && (
        <>
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {Object.entries(metaData.archetypes).map(([name, data]) => (
              <button key={name} onClick={() => setSelectedArch(name)} className={`px-4 py-1 rounded-full text-[10px] font-bold border transition-all ${selectedArch === name ? 'bg-blue-600 border-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-500'}`}>
                {name} <span className="ml-1 opacity-50">— {data.count}</span>
              </button>
            ))}
          </div>
          {selectedArch ? (
            <div>
              <h2 className="text-3xl font-black mb-6 uppercase italic text-center text-blue-400">{selectedArch}</h2>
              {renderGrid(metaData.archetypes[selectedArch].cards, metaData.archetypes[selectedArch].count)}
            </div>
          ) : (
             <div className="h-40 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-600 font-bold uppercase tracking-widest">
                Select an archetype to analyze
             </div>
          )}
        </>
      )}
    </div>
  );
}