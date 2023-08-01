'use strict';

import { clickCount, shuffle, randomNumber, randomInteger } from "./function_storage.js";

const scatterButton = document.querySelector('.ClickingObject');
const elemContainer = document.getElementById('ElementsContainer');
const infoArea = document.querySelector('.TextInfo');
let timerWarn = null,
    timerWait = null,
    indexes = [],
    orderedTimesRS = new Map(),
    iClick = 0,
    elemArray,
    scatterElemAmount,
    scatterElemSum,
    timeOnClick,
    maxTimeWait,
    fillContainerPermission,
    clickCountPermission;

scatterButton.insertAdjacentHTML('beforeend', '<p id="ClickInfo">(Не нажато)</p>');
    
initialContainer();

for (let radioButton of document.querySelectorAll('input[name="ContainerSize"]')) {
    radioButton.addEventListener('click', () => initialContainer());
}

scatterButton.addEventListener('click', () => {
    if (clickCountPermission) clickCount(++iClick);

    const ScatterGroup = document.getElementById('ScatterGroup');
    const MaxScatterLength = document.getElementById('MaxScatterLength');
    const TimeScatter = document.getElementById('TimeScatter');
    const MaxTimeStart = document.getElementById('MaxTimeStart');

    if (ScatterGroup.value < 1 || ScatterGroup.value > 100 || isNaN(ScatterGroup.value)) {
        clearTimeout(timerWarn);
        ScatterGroup.style.background = '#ff2c2c';
        timerWarn = setTimeout(() => ScatterGroup.style.background = '', 500);

        infoArea.innerHTML += 'Неверно указано значение параметра!\n\n';
        infoArea.scrollTop = infoArea.scrollHeight;
    } else {
        cleanContainer({
            elemInGroup: +ScatterGroup.value,
            timeElemScatter: Math.round(TimeScatter.value ** 2 / 450),
            maxTimeRS: +MaxTimeStart.value,
            scatterLength: +MaxScatterLength.value
        });
    }
});

function cleanContainer(options) {
    const parameters = Object.assign({
        timeElemHover: 100,
        timeElemScatter: 500,
        maxTimeRS: 350,
        elemInGroup: 5,
        scatterLength: 500
    }, options);

    let {timeElemHover, timeElemScatter, maxTimeRS, elemInGroup, scatterLength} = parameters;
    
    if (scatterElemAmount !== elemArray.length) {
        const lastIdxInGroup = (scatterElemAmount + elemInGroup <= elemArray.length) ?
            scatterElemAmount + elemInGroup :
            elemArray.length;
        let fastElemIdx = null;
        let sumTimesGroup = [];
        let scatterElemCount = 0;
        let timeBlockFX = 0;

        if (scatterElemAmount === 0) timeOnClick = Date.now();
        maxTimeWait -= Date.now() - timeOnClick;
        timeOnClick = Date.now();

        for (let i = scatterElemAmount; i < lastIdxInGroup; i++) {
            // Если создать ссылку на элемент и заменить их на неё во всём цикле,
            // то таймеры случайного старта автоматически удалятся при инициализации контейнера
            const elem = elemArray[indexes[i] - 1];

            if (!elem.classList.contains('ElemBlocked')) {
                elem.removeEventListener('click', elemClick);

                if (fastElemIdx === null) fastElemIdx = i;
                const timeRandomStart = (i === fastElemIdx) ? 0 : Math.ceil(Math.random() * maxTimeRS);

                setTimeout(() => {
                    const x = randomInteger(-scatterLength, scatterLength),
                        y = randomInteger(-scatterLength, scatterLength),
                        z = randomNumber(0.3, 2),
                        g = shuffle([-1, 1])[0] * 360;
                    
                    elem.setAttribute('nohover', '');
                    elem.style.cursor = 'default';
                    elem.style.transition = timeElemScatter + 'ms ease-in-out';
                    elem.style.transform = `translate(${x}px, ${y}px) rotate(${g}deg) scale(${z})`;
                    elem.style.opacity = 0;
                    elem.style.visibility = "hidden";
                }, timeRandomStart);

                orderedTimesRS.set(elem, timeRandomStart);
                sumTimesGroup.push(timeRandomStart + timeElemScatter);
                scatterElemCount++;
            } else {
                elem.classList.add('ElemBlockedFX');
                timeBlockFX = parseFloat(getComputedStyle(elem).animationDuration) * 1000;
            }
        }

        maxTimeWait = Math.max(maxTimeWait, ...sumTimesGroup, timeBlockFX);
        scatterElemSum += scatterElemCount;
        scatterElemAmount += elemInGroup;

        if (scatterElemAmount >= elemArray.length) {
            scatterElemAmount = elemArray.length;
            clickCountPermission = false;
            
            scatterButton.setAttribute('disabled', '');
            scatterButton.style.backgroundColor = '#ccc';
            scatterButton.style.border = '1px solid #999';
            scatterButton.style.cursor = 'not-allowed';
            scatterButton.children[0].innerHTML = '<b>...Ожидание...</b>';

            if (scatterElemSum && scatterElemSum === scatterElemAmount) {
                infoArea.innerHTML += `Выброшено элементов: ${scatterElemSum} (+${scatterElemCount}) (все)\n\n`;
                infoArea.scrollTop = infoArea.scrollHeight;
            } else if (scatterElemSum && scatterElemSum !== scatterElemAmount) {
                infoArea.innerHTML += `Выброшено элементов: ${scatterElemSum} (+${scatterElemCount}) (все разрешённые)\n\n`;
                infoArea.scrollTop = infoArea.scrollHeight;
            } else if (!scatterElemSum) {
                infoArea.innerHTML += `Выброшено элементов: ${scatterElemSum} (+${scatterElemCount}) (все блокированы)\n\n`;
                infoArea.scrollTop = infoArea.scrollHeight;
            }

            new Promise(resolve => timerWait = setTimeout(resolve, maxTimeWait))
                .finally(() => {
                    elemArray.forEach(elem => elem.classList.remove('ElemBlockedFX'));

                    fillContainerPermission = true;
                    clickCountPermission = true;
                    
                    scatterButton.removeAttribute('disabled');
                    scatterButton.style.backgroundColor = '#fcff3b';
                    scatterButton.style.border = '1px solid #71aaca';
                    scatterButton.style.cursor = 'pointer';
                    scatterButton.children[0].innerHTML = '<b>Заполнить контейнер</b>';

                    if (scatterElemSum === scatterElemAmount) {
                        infoArea.innerHTML += `Контейнер пуст.\n\n`;
                        infoArea.scrollTop = infoArea.scrollHeight;
                    } else {
                        infoArea.innerHTML += `Контейнер не имеет элементов, разрешённых для выброса.\n\n`;
                        infoArea.scrollTop = infoArea.scrollHeight;
                    }
                });
        } else {
            infoArea.innerHTML += `Выброшено элементов: ${scatterElemSum} (+${scatterElemCount}) \n`;
            infoArea.scrollTop = infoArea.scrollHeight;
        }
    } else if (scatterElemAmount === elemArray.length && fillContainerPermission) {
        fillContainerPermission = false;
        clickCountPermission = false;

        scatterButton.setAttribute('disabled', '');
        scatterButton.style.backgroundColor = '#ccc';
        scatterButton.style.border = '1px solid #999';
        scatterButton.style.cursor = 'not-allowed';
        scatterButton.children[0].innerHTML = '<b>...Ожидание...</b>';

        infoArea.innerHTML += 'Контейнер заполняется...\n\n';
        infoArea.scrollTop = infoArea.scrollHeight;
        
        let maxTimeRS = 0;

        for (let elem of elemArray) {
            let timeRS = orderedTimesRS.get(elem) || 0;
                
            if (timeRS > maxTimeRS) maxTimeRS = timeRS;
        }

        Promise.all(elemArray.map((elem, idx) => new Promise(resolve => {
            if (!elem.classList.contains('ElemBlocked')) {
                setTimeout(() => {
                    elem.classList.add('ElemRestoreFX');
                    elem.style.animationDuration = timeElemScatter + 'ms';
                    elem.style.transition = timeElemScatter + 'ms ease';
                    elem.style.transform = 'translate(0, 0) rotate(0deg) scale(1)';
                    elem.style.opacity = 1;
                    elem.style.visibility = "visible";

                    new Promise(res => timerWait = setTimeout(res, timeElemScatter))
                        .finally(() => {
                            console.log((idx + 1) + ': ' + (timeElemScatter + orderedTimesRS.get(elem)));

                            elem.style.transition = timeElemHover + 'ms ease';
                            elem.removeAttribute('nohover');
                            elem.style.cursor = 'pointer';
                            resolve(elem);
                        });
                }, orderedTimesRS.get(elem)); // Время задержки было запомнено во время выброса элемента
            } else {
                elem.classList.add('ElemRestoreFX');
                elem.style.animationDuration = (maxTimeRS + timeElemScatter) + 'ms';
                
                new Promise(res => timerWait = setTimeout(res, maxTimeRS + timeElemScatter))
                    .finally(() => {
                        console.log((idx + 1) + ': ' + (maxTimeRS + timeElemScatter));
                        resolve(elem);
                    });
            }
        })))
            .then(elemArray => {
                for (let elem of elemArray) {
                    elem.addEventListener('click', elemClick);
                    elem.style.animationDuration = '';
                    elem.className = 'Element';
                }

                shuffle(indexes);

                clickCountPermission = true;
                orderedTimesRS.clear();
                scatterElemAmount = 0;
                scatterElemSum = 0;
                maxTimeWait = 0;
                
                scatterButton.removeAttribute('disabled');
                scatterButton.style.backgroundColor = '#fcff3b';
                scatterButton.style.border = '1px solid #71aaca';
                scatterButton.style.cursor = 'pointer';
                scatterButton.children[0].innerHTML = '<b>Разбросать элементы!</b>';

                infoArea.innerHTML += 'Элементы в контейнере восстановлены.\n\n' +
                    'Индексы элементов в порядке выбрасывания: \n' + indexes.join(', ') + '\n\n';
                infoArea.scrollTop = infoArea.scrollHeight;
            })
            .catch(error => console.log(error.name + ': ' + error.message));
    }
}

function initialContainer() {
    elemContainer.innerHTML = '';

    const contSideElemAmount = +document.querySelector('input[name="ContainerSize"]:checked').value;
    createContainer(contSideElemAmount);

    clearTimeout(timerWait);
    clickCountPermission = true;
    fillContainerPermission = false;
    elemArray = [].slice.call(document.querySelectorAll('.Element'));
    orderedTimesRS.clear();
    scatterElemAmount = 0;
    scatterElemSum = 0;
    maxTimeWait = 0;
    indexes.length = 0;

    for (let i = 0; i < elemArray.length; i++) {
        elemArray[i].addEventListener('click', elemClick);
        indexes.push(i + 1);
    }

    shuffle(indexes);

    scatterButton.removeAttribute('disabled');
    scatterButton.style.backgroundColor = '#fcff3b';
    scatterButton.style.border = '1px solid #71aaca';
    scatterButton.style.cursor = 'pointer';
    scatterButton.children[0].innerHTML = '<b>Разбросать элементы!</b>';

    infoArea.innerHTML =
        'Элементы в контейнере (' + elemArray.length + '):\n' +
        elemArray.map(elem => elem.textContent).join(', ') + '\n\n' +
        'Индексы элементов в порядке выбрасывания:\n' + indexes.join(', ') + '\n\n';
    infoArea.scrollTop = infoArea.scrollHeight;
};

function createContainer(contSideElemAmount) {
    const ELEM_SIDE_SIZE = 72;
    const elemDistance = Math.round(ELEM_SIDE_SIZE / (contSideElemAmount + ELEM_SIDE_SIZE / 10) + 2);
    const elemQuantity = contSideElemAmount * contSideElemAmount;
    const contSideSize = elemDistance + contSideElemAmount * (elemDistance + ELEM_SIDE_SIZE);

    elemContainer.style.width = `${contSideSize}px`;
    elemContainer.style.height = `${contSideSize}px`;

    for (let i = 1; i <= elemQuantity; i++) {
        let divElement = document.createElement('div');

        divElement.className = 'Element';
        divElement.style.width= `${ELEM_SIDE_SIZE}px`;
        divElement.style.height = `${ELEM_SIDE_SIZE}px`;
        divElement.style.lineHeight = `${ELEM_SIDE_SIZE}px`;
        divElement.style.margin = `${elemDistance}px 0 0 ${elemDistance}px`;
        divElement.innerHTML = `<spin>&#9678</spin>${i}+`;
        elemContainer.append(divElement);
    }

    [].slice.call(document.querySelectorAll('.Element'))
        .forEach(el => el.style.fontSize = `${Math.round(ELEM_SIDE_SIZE / 6)}pt`);
    [].slice.call(document.querySelectorAll('.Element > spin'))
        .forEach(el => el.style.fontSize = `${Math.round(ELEM_SIDE_SIZE / 2.5)}pt`);
}

function elemClick() {
    this.classList.add('ElemBlocked');
}
