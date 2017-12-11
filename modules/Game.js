
const reward = [
    25000,
    50000,
    75000,
    150000,
    300000,
    350000,
    450000,
    600000,
    750000,
    1500000,
    3000000,
    6000000,
    12000000,
    24000000,
    50000000
];


var Game = function (names) {
    var players = {};

    for (var i in names) {
        players[names[i]] = Player(names[i]);
    }

    var game = {
        end: false,
        current_question: null,
        current_question_change: null,
        question_50pc: null,
        question_change_50pc: null,
        level: 0,
        players: players
    };

    return game;
};

var Player = function (name) {
    // always initialize all instance properties
    pg = {
        level: 0,
        alive: true,
        name: name,
        comodines: {
            '50pc': true,
            'change': true,
            'google': true
        },
        turn_change: false,
        turn_50pc: false
    };
    return pg;
};

// class methods
var increaseLevel = function(game, id1, ans1, id2, ans2) {
    if (!game.end) {
        setQuestion(game, id1, ans1, id2, ans2);
        game.level = game.level + 1;
    }
};

var setQuestion = function(game, id1, ans1, id2, ans2) {
    game.current_question = id1;
    game.current_question_change = id2;
    game.question_50pc = [ans1, randomAnswer(ans1)];
    game.question_change_50pc = [ans2, randomAnswer(ans2)];
};

var nextLevelReady = function (game) {
    for(name in game.players){
        if (!(!game.players[name].alive || game.players[name].level >= game.level)) {
            return false;
        }
    }
    return true;
};

var randomAnswer = function (correct) {
    var ans = ['a','b','c','d'];
    ans.splice(ans.indexOf(correct),1);
    var otherAns = ans[Math.floor(Math.random() * ans.length)];
    return otherAns;
};

var getLevel = function (game) {
    return game.level;
};

var getNextLevel = function (game) {
    return game.level + 1;
};

var getPlayerQuestion = function (game, name) {

    var to_return = {
        'qId': null,
        '50pc': false
    };

    if(game.players[name].turn_change){
        to_return.qId = game.current_question_change;
    }else{
        to_return.qId = game.current_question;
    }

    if(game.players[name].turn_50pc){
        if(game.players[name].turn_change){
            to_return['50pc'] = game.question_change_50pc;
        }else{
            to_return['50pc'] = game.question_50pc;
        }
    }

    return to_return;
};

var correctAnswer = function(game, name, succes) {
    if (game.players[name].alive && game.level > game.players[name].level){
        if (succes){
            game.players[name].level = game.players[name].level + 1;
            return true
        }else{
            game.players[name].alive = false;
        }
    }
    return false
};

var isAlive = function(game, name){
    return game.players[name].alive;
};

var getPoints = function(game, name){
    return reward[game.players[name].level]
};

var use50pc = function(game, name){
    // TODO
    if (game.players[name].comodines["50pc"]){
        game.players[name].comodines["50pc"] = false;
        game.players[name].turn_50pc = true;
        return true;
    }
    return false;
};

var useChange = function(game, name){
    // TODO
    if (game.players[name].comodines.change){
        game.players[name].comodines.change = false;
        game.players[name].turn_change = true;
        return true;
    }
    return false;
};

var useGoogle = function(game, name){
    if (game.players[name].comodines.google){
        game.players[name].comodines.google = false;
        return true;
    }
    return false;
};

// export the class
exports.Game = Game;
exports.increaseLevel = increaseLevel;
exports.correctAnswer = correctAnswer;
exports.isAlive = isAlive;
exports.getPoints = getPoints;
exports.useChange = useChange;
exports.useGoogle = useGoogle;
exports.use50pc = use50pc;
exports.getPlayerQuestion = getPlayerQuestion;
exports.getLevel = getLevel;
exports.getNextLevel = getNextLevel;
exports.nextLevelReady = nextLevelReady;
