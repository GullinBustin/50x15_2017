var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var cincuenta = require('../modules/Game');
var google = require('google');

/* POST users listing. */
router.post('/start', function(req, res, next) {
    var names = req.body.pNames;
    var game = cincuenta.Game(names);

    req.session.game = game;

    console.log(req.session);
    res.status(201).json({reason: 'Created Game'});
});

router.post('/answer', function (req, res, next) {
    var pName = req.body.pName;
    var answer = req.body.answer;
    var game = req.session.game;

    var idQuestion = new mongo.ObjectID(cincuenta.getPlayerQuestion(game,pName)['qId']);

    if(['a','b','c','d'].indexOf(answer) >= 0){
        var collection = db.collection('Preguntas');
        collection.find({'_id': idQuestion, 'correct': answer}).toArray(function (err, data) {

            var to_send = cincuenta.correctAnswer(game, pName, data.length > 0);
            res.status(200).send({reason: "Answer Done", successful: to_send});
        });
    }else{
        res.status(404).send({reason: "Not Found"});
    }

});

router.post('/comodin', function (req, res, next) {
    var pName = req.body.pName;
    var answer = req.body.answer;
    if (req.session.game != undefined) {
        var game = req.session.game;
        switch (answer) {
            case '50pc':
                if (cincuenta.use50pc(game, pName)) {
                    res.status(200).send({reason: 'OK'});
                } else {
                    res.status(204).send({reason: 'No Content'});
                }
                break;
            case 'change':
                if (cincuenta.useChange(game, pName)) {
                    res.status(200).send({reason: 'OK'});
                } else {
                    res.status(204).send({reason: 'No Content'});
                }
                break;
            case 'google':
                if (cincuenta.useGoogle(game, pName)) {
                    getGoogle(req.body.text, 5, function (data) {
                        res.status(200).send({reason: 'OK', google_search: data});
                    });

                } else {
                    res.status(204).send({reason: 'No Content'});
                }
                break;
            default:
                res.status(404).send({reason: "Not Found"});
        }
    }

});

router.get('/comodines/:player', function (req, res, next) {
    if (req.session.game != undefined) {
        var game = req.session.game;

        var comodines = cincuenta.getPlayerComodines(game, req.params.player);

        res.status(200).send({reason: 'OK', comodines: comodines});
    }
});

var get50pc = function(qid, answers, callBack){
    var collection = db.collection('Preguntas');
    var idQuestion = new mongo.ObjectID(qid);
    const ans_to_id= {'a': 'resp1', 'b': 'resp2','c': 'resp3','d': 'resp4'};

    var find_fields = {
        'enunciado': 1
    };
    find_fields[ans_to_id[answers[0]]] = 1;
    find_fields[ans_to_id[answers[1]]] = 1;

    collection.findOne({'_id' : idQuestion}).then(function (value) {

        var res = [];
        res[0] = {
            'text':  value[ans_to_id[answers[0]]],
            'key': answers[0]
        };

        res[1] = {
            'text':  value[ans_to_id[answers[1]]],
            'key': answers[1]
        };

        res = shuffle(res);

        to_send = {
            enunciado: value.enunciado,
            respuestas: res
        };
        callBack(to_send);
    })
};

var getQuestion = function(qid, callBack){
    var collection = db.collection('Preguntas');
    var idQuestion = new mongo.ObjectID(qid);

    collection.findOne({'_id' : idQuestion}).then(function (value) {

        var shuffled_resp = shuffle([
            {
                text: value.resp1,
                key: 'a'
            },
            {
                text: value.resp2,
                key: 'b'
            },
            {
                text: value.resp3,
                key: 'c'
            },
            {
                text: value.resp4,
                key: 'd'
            }
        ]);

        var to_send = {
            enunciado: value.enunciado,
            respuestas: shuffled_resp
        };

        callBack(to_send);
    })
};

var getGoogle = function (text, nRes, callBack) {
    google.resultsPerPage = 25;
    google.lang = 'es';
    google.tld = 'es';
    google.nextText = 'Siguiente';
    google(text, function (err, res){
        if (err) console.error(err);

        var it = 0;
        var num = 0;
        var data = [];
        while (num < nRes) {
            var link = res.links[it];
            if(link.description) {
                data[num] = {
                    'title': link.title,
                    'description': link.description
                };
                num++;
            }
            it++;
        }
        console.log(callBack);
        console.log(data);


        callBack({
            'comodin': 'google',
            'data': data
        });
    })
};

router.post('/nextLVL', function (req, res, next) {
    if (req.session.game != undefined) {
        var game = req.session.game;
        var level = "Nivel " + cincuenta.getNextLevel(game);
        var isReady = cincuenta.nextLevelReady(game);
        console.log(game);
        if(isReady == "ready") {
            var collection = db.collection('Preguntas');
            collection.aggregate([
                {$match: {level: level}}, // filter the results
                {
                    $project: {
                        '_id': 1,
                        'correct': 1
                    }
                },
                {$sample: {size: 2}}
            ], function (err, data) {
                cincuenta.increaseLevel(game,
                    data[0]._id,
                    data[0].correct,
                    data[1]._id,
                    data[1].correct);
                res.status(200).send({reason: 'OK', game_ends: false});
            });
        }else{
            if(isReady == "notReady") {
                res.status(204).send({reason: 'Not Ready'});
            }else{
                res.status(200).send({reason: 'OK', game_ends: true});
            }
        }
    }else{
        res.status(404).json({reason: 'User Not Found'});
    }
});

router.get('/pregunta/:player', function(req, res, next){
    if (req.session.game != undefined) {
        var game  = req.session.game;

        var question = cincuenta.getPlayerQuestion(game, req.params.player);

        console.log(question);

        if(question['50pc']){
            get50pc(question.qId, question['50pc'], function(data){
                res.status(200).json({reason: 'OK', question: data})
            });
        }else{
            getQuestion(question.qId, function(data){
                res.status(200).json({reason: 'OK', question: data});
            });
        }
    }else{
        res.status(404).json({reason: 'User Not Found'});
    }
});

router.get('/game', function(req, res, next){
    if (req.session.game != undefined) {
        var game = req.session.game;
        res.status(200).json({reason: 'OK', game: game});
    }else {
        res.status(404).send({reason: "Not Found"})
    }
});

router.get('/players_life', function (req, res, next) {
    if (req.session.game != undefined) {
        var game = req.session.game;
        var players_status = cincuenta.playersLife(game);
        res.status(200).send({reason: "OK", players_life: players_status})
    }else {
        res.status(404).send({reason: "Not Found"})
    }
});

router.get('/players_points', function (req, res, next) {
    if (req.session.game != undefined) {
        var game = req.session.game;
        var players_status = cincuenta.playersPoints(game);
        res.status(200).send({reason: "OK", players_points: players_status})
    }else {
        res.status(404).send({reason: "Not Found"})
    }
});

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


module.exports = router;
