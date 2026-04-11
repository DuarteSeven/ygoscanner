const fs = require('fs');

function getDaysAgo(dateStr) {
    if (!dateStr) return 0;
    const s = dateStr.toLowerCase();
    if (s.includes('hour') || s.includes('minute') || s.includes('now')) return 0;
    const num = parseInt(s.match(/\d+/) || [0], 10);
    if (s.includes('day')) return num;
    if (s.includes('week')) return num * 7;
    if (s.includes('month')) return num * 30;
    if (s.includes('year')) return num * 365;
    return 0;
}

async function runScraper() {
    console.log("1. Mapping card database and stats...");
    const cardRes = await fetch("https://db.ygoprodeck.com/api/v7/cardinfo.php");
    const { data: allCards } = await cardRes.json();
    
    const idToName = {};
    const nameToImageId = {};
    const cardDictionary = {}; // NEW: Stores ATK, DEF, Type, etc.

    allCards.forEach(card => {
        nameToImageId[card.name] = card.id; 
        
        // Save the card's stats so the website can filter them
        cardDictionary[card.name] = {
            type: card.type,             // e.g., "Effect Monster", "Spell Card"
            race: card.race,             // e.g., "Dragon", "Field", "Counter"
            attribute: card.attribute,   // e.g., "DARK", "WATER"
            atk: card.atk,
            def: card.def,
            level: card.level
        };

        card.card_images.forEach(img => {
            idToName[img.id] = card.name; 
        });
    });

    console.log("2. Deep Scraping: All tournament decks from the last 30 days...");
    const database = { 
        totalDecks: 0, 
        overall: {}, 
        overallSide: {}, 
        archetypes: {},
        cardDict: cardDictionary // We pass the dictionary to the website
    };

    let offset = 0;
    let keepGoing = true;

    while (keepGoing) {
        console.log(`Fetching decks starting at offset ${offset}...`);
        try {
            const res = await fetch(`https://ygoprodeck.com/api/decks/getDecks.php?_sft_category=Tournament%20Meta%20Decks&offset=${offset}`, { headers: { "User-Agent": "Mozilla/5.0" }});
            const decks = await res.json();

            if (!decks || decks.error || decks.length === 0) break;

            for (const deck of decks) {
                if (getDaysAgo(deck.submit_date) > 30) {
                    keepGoing = false;
                    break; 
                }

                const archName = deck.deck_name || "Unknown";
                if (!database.archetypes[archName]) database.archetypes[archName] = { count: 0, cards: {} };
                
                database.totalDecks++;
                database.archetypes[archName].count++;

                const parse = (d) => (typeof d === 'string' ? d.split(',') : (d || [])).map(id => String(id).replace(/\D/g,''));
                
                const processCards = (cardsArray, targetGlobal) => {
                    const counts = {};
                    cardsArray.forEach(id => {
                        const name = idToName[id];
                        if (name) counts[name] = (counts[name] || 0) + 1;
                    });

                    Object.entries(counts).forEach(([name, qty]) => {
                        const targets = targetGlobal === database.overall ? [database.overall, database.archetypes[archName].cards] : [database.overallSide];
                        targets.forEach(target => {
                            if (!target[name]) target[name] = { "3x": 0, "2x": 0, "1x": 0, playedIn: 0, imgId: nameToImageId[name] };
                            const qKey = qty >= 3 ? "3x" : `${qty}x`;
                            target[name][qKey]++;
                            target[name].playedIn++;
                        });
                    });
                };

                processCards(parse(deck.main_deck).concat(parse(deck.extra_deck)), database.overall);
                processCards(parse(deck.side_deck), database.overallSide);
            }
            if (keepGoing) {
                offset += 20;
                await new Promise(r => setTimeout(r, 1000));
            }
        } catch (e) {
            console.error("Batch error:", e);
            break;
        }
    }

    fs.writeFileSync('./meta_data.json', JSON.stringify(database, null, 2));
    console.log(`✅ Finished! Analyzed ${database.totalDecks} decks.`);
}

runScraper();