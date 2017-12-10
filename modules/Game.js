
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
        }
    };
    return pg;
};

// class methods
var setQuestion = function(game, id) {
    // TODO
    if (!game.end) {
        game.current_question = id;
    }
};

var correctAnswer = function(game, name, succes) {
    if (game[name].alive && game.level == game[name].level){
        if (succes){
            game[name].level = game[name].level + 1;
            return true
        }else{
            game[name].alive = false;
        }
    }
    return false
};

var isAlive = function(game, name){
    return game[name].alive;
};

var getPoints = function(game, name){
    return reward[game[name].level]
};

var use50pc = function(game, name){
    // TODO
    if (game[name].comodines["50pc"]){
        game[name].comodines["50pc"] = false;
        return true;
    }
    return false;
};

var useChange = function(game, name){
    // TODO
    if (game[name].comodines.change){
        game[name].comodines.change = false;
        return true;
    }
    return false;
};

var useGoogle = function(game, name){
    if (game[name].comodines.google){
        game[name].comodines.google = false;
        return true;
    }
    return false;
};

// export the class
exports.Game = Game;
exports.setQuestion = setQuestion;
exports.correctAnswer = correctAnswer;
exports.isAlive = isAlive;
exports.getPoints = getPoints;
exports.useChange = useChange;
exports.useGoogle = useGoogle;
exports.use50pc = use50pc;
