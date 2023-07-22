'use strict';

import { clickCount, shuffle, randomNumber, randomInteger } from "./function_storage.js";

const scatterButton = document.querySelector('.ClickingObject');
const elemContainer = document.getElementById('ElementsContainer');
const infoArea = document.querySelector('.TextInfo');
let timerWarn = null,
    timerWait = null,
    timersRandomStartsArray = [],
    iClick = 0,
    indexes = [],
    elemArray,
    scatterElemAmount,
    timeOnClick,
    addTimeWait,
    fillContPermission,
    clickCountPermission;

scatterButton.insertAdjacentHTML('beforeend', '<p id="ClickInfo">(Не нажато)</p>');

initialContainer();

for (let radioButton of document.querySelectorAll('input[name="ContainerSize"]')) {
    radioButton.addEventListener('click', () => {     
        for (let timer of timersRandomStartsArray) {
            clearTimeout(timer);
        }
        
        clearTimeout(timerWait);
        
        elemContainer.innerHTML = '';

        initialContainer();
    });
}

scatterButton.addEventListener('click', () => {
    if (clickCountPermission) {
        iClick++;
        clickCount(iClick);
    }

    const ScatterGroup = document.getElementById('ScatterGroup');
    const MaxScatterLength = document.getElementById('MaxScatterLength');
    const SpeedScatter = document.getElementById('SpeedScatter');
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
            scatterLength: +MaxScatterLength.value,
            timeElemScatter: (1000 / +SpeedScatter.value) * 1000,
            maxTimeRandomStart: +MaxTimeStart.value
        });
    }
});

function elemClick() {
    if (this.hasAttribute('data-selected')) {
        this.removeAttribute('data-selected');
        this.style.background = 'rgb(176, 255, 123)';
    } else {
        this.setAttribute('data-selected', '');
        this.style.background = 'rgb(255, 123, 200)';
    }
}

function cleanContainer(options) {
    const parameters = Object.assign({
        timeElemHover: 100,
        timeElemScatter: 500,
        maxTimeRandomStart: 350,
        elemInGroup: 5,
        scatterLength: 500
    }, options);

    let {timeElemHover, timeElemScatter, maxTimeRandomStart, elemInGroup, scatterLength} = parameters;

    if (scatterElemAmount !== elemArray.length) {
        const lastIdxInGroup = (scatterElemAmount + elemInGroup <= elemArray.length) ?
            scatterElemAmount + elemInGroup :
            elemArray.length;
        const fastElemIdx = (scatterElemAmount + elemInGroup <= elemArray.length) ?
            scatterElemAmount + Math.round(- 0.5 + Math.random() * elemInGroup) :
            scatterElemAmount + Math.round(- 0.5 + Math.random() * (elemArray.length - scatterElemAmount));
        const timeRandomStartArray = [];

        if (scatterElemAmount === 0) timeOnClick = Date.now();

        // От предыдущего максимума добавочного времени отнимаем разницу между кликами
        addTimeWait -= Date.now() - timeOnClick;
        timeOnClick = Date.now();

        for (let i = scatterElemAmount; i < lastIdxInGroup; i++) {
            const timeRandomStart = (i === fastElemIdx) ? 0 : Math.ceil(Math.random() * maxTimeRandomStart);
            timeRandomStartArray.push(timeRandomStart);

            timersRandomStartsArray[i] = setTimeout(() => {
                const x = randomInteger(-scatterLength, scatterLength),
                    y = randomInteger(-scatterLength, scatterLength),
                    z = randomNumber(0.3, 2);
                
                elemArray[indexes[i] - 1].setAttribute('disabled', '');
                elemArray[indexes[i] - 1].style.cursor = 'default';
                elemArray[indexes[i] - 1].style.transition = timeElemScatter + 'ms ease-in-out';
                elemArray[indexes[i] - 1].style.transform = `translate(${x}px, ${y}px) rotate(360deg) scale(${z})`;
                elemArray[indexes[i] - 1].style.opacity = 0;
                elemArray[indexes[i] - 1].style.visibility = "hidden";
            }, timeRandomStart);
        }

        addTimeWait = Math.max(addTimeWait, ...timeRandomStartArray);

        scatterElemAmount += elemInGroup;

        if (scatterElemAmount >= elemArray.length) {
            scatterElemAmount = elemArray.length;
            clickCountPermission = false;

            scatterButton.setAttribute('disabled', '');
            scatterButton.style.backgroundColor = '#ccc';
            scatterButton.style.border = '1px solid #999';
            scatterButton.style.cursor = 'not-allowed';
            scatterButton.children[0].innerHTML = '<b>...Ожидание...</b>';

            infoArea.innerHTML += 'Выброшено элементов: ' + scatterElemAmount + ' (контейнер пуст)' + '\n\n';
            infoArea.scrollTop = infoArea.scrollHeight;

            new Promise(resolve => timerWait = setTimeout(resolve, timeElemScatter + addTimeWait))
                .finally(() => {
                    fillContPermission = true;
                    clickCountPermission = true;
                    
                    scatterButton.removeAttribute('disabled');
                    scatterButton.style.backgroundColor = '#fcff3b';
                    scatterButton.style.border = '1px solid #71aaca';
                    scatterButton.style.cursor = 'pointer';
                    scatterButton.children[0].innerHTML = '<b>Заполнить контейнер</b>';
                });
        } else {
            infoArea.innerHTML += 'Выброшено элементов: ' + scatterElemAmount + '\n';
            infoArea.scrollTop = infoArea.scrollHeight;
        }
    } else if (scatterElemAmount === elemArray.length && fillContPermission) {
        const fastElemIdx = Math.round(-0.5 + Math.random() * elemArray.length);

        fillContPermission = false;
        clickCountPermission = false;

        scatterButton.setAttribute('disabled', '');
        scatterButton.style.backgroundColor = '#ccc';
        scatterButton.style.border = '1px solid #999';
        scatterButton.style.cursor = 'not-allowed';
        scatterButton.children[0].innerHTML = '<b>...Ожидание...</b>';

        infoArea.innerHTML += 'Контейнер заполняется...\n\n';
        infoArea.scrollTop = infoArea.scrollHeight;
        
        Promise.all(elemArray.map((elem, idx) => new Promise(resolve => {
            const timeRandomStart = (idx === fastElemIdx) ? 0 : Math.ceil(Math.random() * maxTimeRandomStart);

            timersRandomStartsArray[idx] = setTimeout(() => {
                elem.style.transition = timeElemScatter + 'ms ease';
                elem.style.transform = 'translate(0, 0) rotate(0deg) scale(1)';
                elem.style.opacity = 1;
                elem.style.visibility = "visible";

                new Promise(res => timerWait = setTimeout(res, timeElemScatter))
                    .finally(() => resolve(elem));
            }, timeRandomStart);
        })))
            .then(elemArray => {
                for (let elem of elemArray) {
                    elem.style.transition = timeElemHover + 'ms ease';
                    elem.style.cursor = 'pointer';
                    elem.removeAttribute('disabled');
                }

                shuffle(indexes);

                scatterElemAmount = 0;
                addTimeWait = 0;
                timersRandomStartsArray.length = 0;
                clickCountPermission = true;
                
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
    const contSideElemAmount = +document.querySelector('input[name="ContainerSize"]:checked').value;
    createContainer(contSideElemAmount);

    clickCountPermission = true;
    fillContPermission = false;
    elemArray = [].slice.call(document.querySelectorAll('.Element'));
    scatterElemAmount = 0;
    addTimeWait = 0;
    timersRandomStartsArray.length = 0;
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
        elemArray.map(elem => elem.innerText).join(', ') + '\n\n' +
        'Индексы элементов в порядке выбрасывания:\n' + indexes.join(', ') + '\n\n';
    infoArea.scrollTop = infoArea.scrollHeight;
};

function createContainer(contSideElemAmount) {
    const elemSideSize = 74;
    const elemDistance = Math.round(30 / (contSideElemAmount + 1) + 4);
    const elemQuantity = contSideElemAmount * contSideElemAmount;
    const contSideSize = elemDistance + contSideElemAmount * (elemDistance + elemSideSize);

    elemContainer.style.width = `${contSideSize}px`;
    elemContainer.style.height = `${contSideSize}px`;

    for (let i = 1; i <= elemQuantity; i++) {
        let divElement = document.createElement('div');
        divElement.className = 'Element';
        divElement.style.width= `${elemSideSize}px`;
        divElement.style.height = `${elemSideSize}px`;
        divElement.style.lineHeight = `${elemSideSize}px`;
        divElement.style.margin = `${elemDistance}px 0 0 ${elemDistance}px`;
        divElement.style.background = 'rgb(176, 255, 123)';
        divElement.innerHTML = `<spin>&#9678</spin>${i}+`;
        elemContainer.append(divElement);
    }

    [].slice.call(document.querySelectorAll('.Element'))
        .forEach(el => el.style.fontSize = `${Math.round(elemSideSize / 6)}pt`);
    [].slice.call(document.querySelectorAll('.Element > spin'))
        .forEach(el => el.style.fontSize = `${Math.round(elemSideSize / 2.5)}pt`);
}
