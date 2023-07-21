export { clickCount, shuffle, randomNumber, randomInteger };

function clickCount(i) {
    const ClickInfo = document.getElementById('ClickInfo');

    if ((String(i).at(-1) === '2' || String(i).at(-1) === '3' || String(i).at(-1) === '4') && 
        String(i).at(-2) !== '1') {
        ClickInfo.innerHTML = `(Нажато ${i} раза)`;
    } else {
        ClickInfo.innerHTML = `(Нажато ${i} раз)`;
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function randomNumber(min, max) {
    return min + Math.random() * (max - min);
}

function randomInteger(min, max) {
    let random = min + Math.random() * (max + 1 - min);
    return Math.floor(random);
}
