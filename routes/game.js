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
    res.status(200).json({status: 200, reason: 'OK'});
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
            res.status(200).send(to_send);
        });
    }else{
        res.status(404).send("Not Found");
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
                    res.status(200).send("OK");
                } else {
                    res.status(200).send("NO");
                }
                break;
            case 'change':
                if (cincuenta.useChange(game, pName)) {
                    res.status(200).send("OK");
                } else {
                    res.status(200).send("NO");
                }
                break;
            case 'google':
                if (cincuenta.useGoogle(game, pName)) {
                    getGoogle(req.body.text, 5, function (data) {
                        res.status(200).send(data);
                    });

                } else {
                    res.status(200).send("NO");
                }
                break;
            default:
                res.status(404).send("Not Found");
        }
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
            'id': answers[0]
        };

        res[1] = {
            'text':  value[ans_to_id[answers[1]]],
            'id': answers[1]
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
                    'tittle': link.title,
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
        if(cincuenta.nextLevelReady(game)) {
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
                cincuenta.increaseLevel(game, data[0]._id, data[0].correct, data[1]._id, data[1].correct);
                res.status(200).send("OK");
            });
        }else{
            res.status(200).send("NO");
        }
    }else{
        res.status(404).json({status: 404, reason: 'User Not Found'});
    }
});

router.get('/pregunta/:player', function(req, res, next){
    if (req.session.game != undefined) {
        var game  = req.session.game;

        var question = cincuenta.getPlayerQuestion(game, req.params.player);

        console.log(question);

        if(question['50pc']){
            get50pc(question.qId, question['50pc'], function(data){
                res.status(200).json(data)
            });
        }else{
            getQuestion(question.qId, function(data){
                res.status(200).json(data);
            });
        }

    }else{
        res.status(404).json({status: 404, reason: 'User Not Found'});
    }
});

router.get('/game', function(req, res, next){
    var game = req.session.game;
    res.status(200).json(game);
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
