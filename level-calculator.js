const { exception } = require("console");

let multipliers = {
    'xp': 1,
    'mb': '0.05',
};
let currentLevel = 0;
let totalXp = 0;
const goalXp = parseInt(process.argv[2], 10) * multipliers[process.argv[3]];

if (!goalXp) {
    throw new TypeError(`${ process.argv[2] } is not a number or ${ process.argv[3] } is not supported`)
}

if (process.argv !== 'xp') {
    console.log(`${ process.argv[2] } ${ process.argv[3] } = ${ goalXp } xp`)
}

const getXp = (level) => {
    switch (true) {
        case level > 30:
            return 9 * level - 158;

        case level > 15:
            return 5 * currentLevel - 38;

        default:
            return 2 * currentLevel + 7;
    }
};

while (totalXp < goalXp) {
    const requiredXp = getXp(currentLevel);

    totalXp += requiredXp;
    currentLevel += 1;
}

console.log(`${ goalXp } xp = level ${ currentLevel }`);