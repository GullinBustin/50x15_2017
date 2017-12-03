
const reward = [25000,
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
    50000000];


// Constructor
var Player = function (name) {
    // always initialize all instance properties
    pg = {
        level: 0,
        alive: true,
        name: name,
        question: null,
        comodines: {
            '50pc': true,
            'change': true,
            'google': true
        }
    };
    return pg;
};

// class methods
var setQuestion = function(pg, id) {
    if (pg.alive) {
        pg.question = id;
    }
};

var correctAnswer = function(pg, succes) {
    if (pg.alive && pg.question){
        if (succes){
            pg.level = pg.level + 1;
        }else{
            pg.alive = false;
        }
        pg.question = null;
    }
};

var isAlive = function(pg){
    return pg.alive;
};

var getPoints = function(pg){
    return reward[pg.level]
};

var use50pc = function(pg){
    if (pg.comodines["50pc"]){
        pg.comodines["50pc"] = false;
        return true;
    }
    return false;
};

var useChange = function(pg,newQ){
    if (pg.comodines.change){
        pg.comodines.change = false;
        pg.question = newQ;
        return true;
    }
    return false;
};

var useGoogle = function(pg){
    if (pg.comodines.google){
        pg.comodines.google = false;
        return true;
    }
    return false;
};

// export the class
exports.Player = Player;
exports.setQuestion = setQuestion;
exports.correctAnswer = correctAnswer;
exports.isAlive = isAlive;
exports.getPoints = getPoints;
exports.useChange = useChange;
exports.useGoogle = useGoogle;
exports.use50pc = use50pc;
