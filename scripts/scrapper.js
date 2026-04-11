const fs = require('fs');

function getDaysAgo(dateStr) {
    if (!dateStr) return 0;
    const s = dateStr.toLowerCase();
    const num = parseInt(s.match(/\d+/) || [0], 10);
    if (s.includes('day')) return num;
    if (s.includes('week')) return num * 7;
    if (s.includes('month')) return num * 30;
    return 0;
}

async function runScraper() {
    console.log("1. Mapping Card Database...");
    const cardRes = await fetch("https://db.ygoprodeck.com/api/v7/cardinfo.php");
    const { data: allCards } = await cardRes.json();
    
    const idToName = {};
    const nameToImageId = {};
    const cardDictionary = {}; 

    allCards.forEach(card => {
        nameToImageId[card.name] = card.id; 
        cardDictionary[card.name] = {
            type: card.type, race: card.race, attribute: card.attribute || 'NONE',
            atk: card.atk ?? -1, def: card.def ?? -1,
            level: card.level || card.rank || card.linkval || 0,
            isExtra: card.type.toLowerCase().includes('fusion') || card.type.toLowerCase().includes('synchro') || card.type.toLowerCase().includes('xyz') || card.type.toLowerCase().includes('link'),
            isTuner: card.type.toLowerCase().includes('tuner'),
            isSpirit: card.type.toLowerCase().includes('spirit'),
            isGemini: card.type.toLowerCase().includes('gemini'),
            isUnion: card.type.toLowerCase().includes('union'),
            isToon: card.type.toLowerCase().includes('toon'),
            isFlip: card.type.toLowerCase().includes('flip'),
            isPendulum: card.type.toLowerCase().includes('pendulum'),
            isRitual: card.type.toLowerCase().includes('ritual')
        };
        card.card_images.forEach(img => { idToName[img.id] = card.name; });
    });

    console.log("2. Deep Scraping Decks + Real Creator Names...");
    const database = { totalDecks: 0, overall: {}, overallSide: {}, archetypes: {}, cardDict: cardDictionary };
    let offset = 0;
    let keepGoing = true;

    while (keepGoing) {
        console.log(`Offset ${offset}...`);
        const res = await fetch(`https://ygoprodeck.com/api/decks/getDecks.php?_sft_category=Tournament%20Meta%20Decks&offset=${offset}`, { headers: { "User-Agent": "Mozilla/5.0" }});
        const decks = await res.json();
        if (!decks || decks.error || decks.length === 0) break;

        for (const deck of decks) {
            if (getDaysAgo(deck.submit_date) > 30) { keepGoing = false; break; }

            const archName = deck.deck_name || "Unknown";
            if (!database.archetypes[archName]) {
                database.archetypes[archName] = { count: 0, cards: {}, sideCards: {}, specificDecks: [] };
            }
            
            database.totalDecks++;
            database.archetypes[archName].count++;

            const parse = (d) => (typeof d === 'string' ? d.split(',') : (d || [])).map(id => String(id).replace(/\D/g,''));
            
            const mainIds = parse(deck.main_deck);
            const extraIds = parse(deck.extra_deck);
            const sideIds = parse(deck.side_deck);

            // --- PLAYER NAME EXTRACTION ---
            let actualPlayer = deck.tournamentPlayerName || deck.username; 
            if (deck.deck_description && deck.deck_description.includes("Creator:")) {
                const match = deck.deck_description.match(/Creator:\s*([^<]+)/);
                if (match && match[1]) actualPlayer = match[1].trim();
            }

            database.archetypes[archName].specificDecks.push({
                player: actualPlayer,
                event: deck.tournamentName || "Tournament",
                place: deck.tournamentPlacement || "Top",
                main: mainIds.map(id => ({ name: idToName[id], imgId: nameToImageId[idToName[id]] })),
                extra: extraIds.map(id => ({ name: idToName[id], imgId: nameToImageId[idToName[id]] })),
                side: sideIds.map(id => ({ name: idToName[id], imgId: nameToImageId[idToName[id]] }))
            });

            // --- AGGREGATE STATS (Using 'playedIn' to avoid NaN) ---
            const countSet = (idList, globalTarget, archTarget) => {
                const counts = {};
                idList.forEach(id => {
                    const name = idToName[id];
                    if (name) counts[name] = (counts[name] || 0) + 1;
                });
                Object.entries(counts).forEach(([name, qty]) => {
                    [globalTarget, archTarget].forEach(t => {
                        if (!t[name]) t[name] = { "3x": 0, "2x": 0, "1x": 0, playedIn: 0, imgId: nameToImageId[name] };
                        const qKey = qty >= 3 ? "3x" : `${qty}x`;
                        t[name][qKey]++;
                        t[name].playedIn++; // Reverted label to 'playedIn'
                    });
                });
            };

            countSet(mainIds.concat(extraIds), database.overall, database.archetypes[archName].cards);
            countSet(sideIds, database.overallSide, database.archetypes[archName].sideCards);
        }
        offset += 20;
        await new Promise(r => setTimeout(r, 1000));
    }
    fs.writeFileSync('./meta_data.json', JSON.stringify(database, null, 2));
    console.log("✅ Success! Percentage data fixed.");
}
runScraper();