import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

class Creature extends Card {
    constructor(...args) {
        super(...args);
    }

    getDescriptions() {
        const first = getCreatureDescription(this);
        const second = super.getDescriptions();
        return [first, second];
    }
}

class Gatling extends Creature {
    constructor() {
        super('Гатлинг', 6);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        const oppositeCards = oppositePlayer.table;
        if (!oppositeCards){
            return;
        }

        //taskQueue.push(onDone => this.view.showAttack(onDone));
        for(let oppositeCard of oppositeCards){
            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {
                if (oppositeCard) {
                    this.dealDamageToCreature(2, oppositeCard, gameContext, onDone);
                }
            });
        }
        taskQueue.continueWith(continuation);
    }
}

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}



// Основа для утки.
class Duck extends Creature {
    constructor(){
        super('Мирная утка', 2);
    }
    quacks() {
        console.log('quack')
    };
    swims() {
        console.log('float: both;')
    };
}

// Основа для собаки.
class Dog extends Creature {
    constructor(name = 'Пес-Бандит', power = 3) {
        super(name, power);
    }
}

class Trasher extends Dog {
    constructor() {
        super('Громила', 5);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        if (value <= 0) {
            continuation(value);
            return;
        }

        const newValue = Math.max(value - 1, 0);
        this.view.signalAbility(() => {
            continuation(newValue);
        })
    }

    getDescriptions() {
        const descriptions = super.getDescriptions();
        descriptions.push('Получает на 1 меньше урона');
        return descriptions;
    }
}

class Lad extends Dog {
    constructor() {
        super('Браток', 2);
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getBonus() {
        const count = this.getInGameCount();
        return count * (count + 1) / 2;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        this.constructor.setInGameCount(this.constructor.getInGameCount() + 1);
        super.doAfterComingIntoPlay(gameContext, continuation);
    }

    doBeforeRemoving(continuation) {
        this.constructor.setInGameCount(this.constructor.getInGameCount() - 1);
        super.doBeforeRemoving(continuation);
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        const bonus = this.constructor.getBonus();
        continuation(value + bonus);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        const bonus = this.constructor.getBonus();
        const newValue = Math.max(value - bonus, 0);
        continuation(newValue);
    }

    getDescriptions() {
        const descriptions = super.getDescriptions();
        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') ||
            Lad.prototype.hasOwnProperty('modifyTakenDamage')) {
            descriptions.push('Чем их больше, тем они сильнее');
        }
        return descriptions;
    }
}

// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
    new Gatling(),
];
const banditStartDeck = [
    new Trasher(),
    new Dog(),
    new Dog(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
