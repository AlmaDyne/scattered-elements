'use strict';

import { clickCount, shuffle, randomNumber, randomInteger } from "./function_storage.js";

const scatterButton = document.querySelector('.ClickingObject');
const elemContainer = document.getElementById('ElementsContainer');
const infoArea = document.querySelector('.TextInfo');
const tableContSizes = document.querySelector('.Table-ContSizes');
const initContSize = document.querySelector('input[name="ContainerSize"]:checked');
const scatterGroup = document.getElementById('ScatterGroup');
const timeScatter = document.getElementById('TimeScatter');
const maxTimeStart = document.getElementById('MaxTimeStart');
const maxScatterLength = document.getElementById('MaxScatterLength');
let timerWarn = null,
    timerWait = null,
    indexes = [],
    orderedTimesRS = new Map(), // RS = Random Start
    iClick = 0,
    elemArray,
    scatterElemAmount,
    scatterElemSum,
    timeOnClick,
    maxTimeWait,
    fillContainerPermission,
    clickCountPermission;

scatterButton.insertAdjacentHTML('beforeend', '<p id="ClickInfo">(Не нажато)</p>');

initialContainer(initContSize);

// Делегирование события для таблицы выбора размеров контейнера
tableContSizes.onclick = function(event) {
    if (event.target.tagName == 'INPUT') initialContainer(event.target);
};

scatterButton.addEventListener('click', () => {
    if (clickCountPermission) clickCount(++iClick);

    if (scatterGroup.value < 1 || scatterGroup.value > 100 || isNaN(scatterGroup.value)) {
        clearTimeout(timerWarn);
        scatterGroup.style.background = '#ff2c2c';
        timerWarn = setTimeout(() => scatterGroup.style.background = '', 500);

        infoArea.innerHTML += 'Неверно указано значение параметра!\n\n';
        infoArea.scrollTop = infoArea.scrollHeight;
    } else {
        cleanContainer({
            elemInGroup: +scatterGroup.value,
            timeElemScatter: Math.round(timeScatter.value ** 2 / 450),
            maxTimeRS: +maxTimeStart.value,
            scatterLength: +maxScatterLength.value
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
                elem.dataset.scattering = true;

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
                    elem.style.transform = `translate(${x}px, ${y}px) /*rotate(${g}deg)*/ scale(${z})`;
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

        const blockElemInGroup = (elemInGroup <= elemArray.length - scatterElemAmount) ?
            elemInGroup - scatterElemCount :
            elemArray.length - scatterElemAmount - scatterElemCount;

        scatterElemSum += scatterElemCount;
        scatterElemAmount += elemInGroup;

        maxTimeWait = Math.max(maxTimeWait, ...sumTimesGroup, timeBlockFX);

        if (scatterElemAmount >= elemArray.length) {
            scatterElemAmount = elemArray.length;
            clickCountPermission = false;

            scatterGroup.setAttribute('disabled', '');
            maxTimeStart.setAttribute('disabled', '');
            maxScatterLength.setAttribute('disabled', '');
            
            scatterButton.setAttribute('disabled', '');
            scatterButton.style.backgroundColor = '#ccc';
            scatterButton.style.border = '1px solid #999';
            scatterButton.style.cursor = 'not-allowed';
            scatterButton.children[0].innerHTML = '<b>...Ожидание...</b>';

            if (scatterElemSum && scatterElemSum === scatterElemAmount) {
                infoArea.innerHTML += `Выброшено элементов: ${scatterElemSum} (+${scatterElemCount}) - Все.\n\n`;
            } else if (scatterElemSum && scatterElemSum !== scatterElemAmount) {
                infoArea.innerHTML += `Выброшено элементов: ${scatterElemSum} (+${scatterElemCount})`;
                if (blockElemInGroup) infoArea.innerHTML += ` (${blockElemInGroup} блок.)`;
                infoArea.innerHTML += ` - Все разрешённые, кроме ${elemArray.length - scatterElemSum} блокиров.\n\n`;
            } else if (!scatterElemSum) {
                infoArea.innerHTML += `Выброшено элементов: ${scatterElemSum} (+${scatterElemCount})`;
                infoArea.innerHTML += ` (${blockElemInGroup} блок.) - Все заблокированы.\n\n`;
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
                    } else if (!scatterElemSum) {
                        infoArea.innerHTML += `Контейнер не имеет элементов, разрешённых для выброса.\n\n`;
                    } else {
                        infoArea.innerHTML += `Контейнер больше не имеет элементов, разрешённых для выброса.\n\n`;
                    }
                    
                    infoArea.scrollTop = infoArea.scrollHeight;
                });
        } else {
            infoArea.innerHTML += `Выброшено элементов: ${scatterElemSum} (+${scatterElemCount})`;
            if (blockElemInGroup) infoArea.innerHTML += ` (${blockElemInGroup} блок.)`;
            infoArea.innerHTML += '\n';
        }

        infoArea.scrollTop = infoArea.scrollHeight;
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
        console.log('Порядок восстановления элементов:');
        
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
                            elem.style.transition = timeElemHover + 'ms ease';
                            elem.removeAttribute('nohover');
                            elem.dataset.scattering = false;
                            elem.style.cursor = 'pointer';
                            resolve(elem);

                            console.log((idx + 1) + ': ' + (timeElemScatter + orderedTimesRS.get(elem)) + 'мс');
                        });
                }, orderedTimesRS.get(elem)); // Время задержки было запомнено во время выброса элемента
            } else {
                elem.classList.add('ElemRestoreFX');
                elem.style.animationDuration = (maxTimeRS + timeElemScatter) + 'ms';
                
                new Promise(res => timerWait = setTimeout(res, maxTimeRS + timeElemScatter))
                    .finally(() => {
                        resolve(elem);

                        console.log((idx + 1) + ': ' + (maxTimeRS + timeElemScatter) + 'мс');
                    });
            }
        })))
            .then(elemArray => {
                for (let elem of elemArray) {
                    elem.style.animationDuration = '';
                    elem.className = 'Element';
                }

                shuffle(indexes);

                clickCountPermission = true;
                orderedTimesRS.clear();
                scatterElemAmount = 0;
                scatterElemSum = 0;
                maxTimeWait = 0;

                scatterGroup.removeAttribute('disabled');
                maxTimeStart.removeAttribute('disabled');
                maxScatterLength.removeAttribute('disabled');
                
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

function initialContainer(containerSize) {
    elemContainer.innerHTML = '';

    const contSideElemAmount = +containerSize.value;
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

    for (let i = 1; i <= elemArray.length; i++) indexes.push(i);
    shuffle(indexes);

    elemContainer.addEventListener('click', contClick);

    scatterGroup.removeAttribute('disabled');
    maxTimeStart.removeAttribute('disabled');
    maxScatterLength.removeAttribute('disabled');

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
        let elem = document.createElement('div');

        elem.className = 'Element';
        elem.setAttribute('data-scattering', false);
        elem.style.width= `${ELEM_SIDE_SIZE}px`;
        elem.style.height = `${ELEM_SIDE_SIZE}px`;
        elem.style.lineHeight = `${ELEM_SIDE_SIZE}px`;
        elem.style.margin = `${elemDistance}px 0 0 ${elemDistance}px`;
        elem.innerHTML = `<spin>&#9678</spin>${i}+`;
        elemContainer.append(elem);
    }

    [].slice.call(document.querySelectorAll('.Element'))
        .forEach(el => el.style.fontSize = `${Math.round(ELEM_SIDE_SIZE / 6)}pt`);
    [].slice.call(document.querySelectorAll('.Element > spin'))
        .forEach(el => el.style.fontSize = `${Math.round(ELEM_SIDE_SIZE / 2.5)}pt`);
}

// Делегирование события для блокирования элементов контейнера
function contClick(event) {
    let target = event.target.closest('.Element'); // Ближайший предок с классом "Element", включая себя

    if (!target) return; // Если event.target не содержится внутри target, то завершить функцию
    if (target.dataset.scattering == 'false') target.classList.add('ElemBlocked');
}
