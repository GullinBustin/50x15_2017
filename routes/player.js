var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var player = require('../modules/Player');
var google = require('google');

/* POST users listing. */
router.post('/start', function(req, res, next) {
    var players = {};
    var names = req.body.pNames;
    for (var i in names) {
        players[names[i]] = player.Player(names[i]);
    }

    req.session.players = players;
    req.session.level = 0;

    console.log(req.session);
    res.status(200).json({status: 200, reason: 'OK'});
});


router.post('/answer', function (req, res, next) {
    var pName = req.body.pName;
    var answer = req.body.answer;
    var idQuestion = new mongo.ObjectID(req.body.idQuestion);

    if(['a','b','c','d'].indexOf(answer) >= 0){
        var collection = db.collection('Preguntas');
        collection.find({'_id': idQuestion, 'correct': answer}).toArray(function (err, data) {
            player.correctAnswer(req.session.players[pName], answer);
            res.status(200).send("OK");
        });
    }else{
        res.status(404).send("Not Found");
    }

});

router.post('/comodin', function (req, res, next) {
    var pName = req.body.pName;
    var answer = req.body.answer;

    switch(answer) {
        case '50pc':
            var idQuestion = new mongo.ObjectID(req.body.idQuestion);
            if(player.use50pc(req.session.players[pName])){
                get50pc(idQuestion, function (data) {
                    res.status(200).send(data);
                });
            }else{
                res.status(404).send("Not Found");
            }
            break;
        case 'change':
            if(player.useChange(req.session.players[pName], req.session.questionChange)){
                getChange(req.session.questionChange, function (data) {
                    res.status(200).send(data);
                });
            }else{
                res.status(404).send("Not Found");
            }
            break;
        case 'google':
            if(player.useGoogle(req.session.players[pName])){
                getGoogle(req.body.text, 5, function (data) {
                    res.status(200).send(data);
                });

            }else{
                res.status(404).send("Not Found");
            }
            break;
        default:
            res.status(404).send("Not Found");
    }

});

var get50pc = function(qid, callBack){
    var collection = db.collection('Preguntas');
    var idQuestion = new mongo.ObjectID(qid);
    collection.findOne({'_id' : idQuestion}).then(function (value) {
        const ans_to_id= {'a': 'resp1', 'b': 'resp2','c': 'resp3','d': 'resp4'};
        var ans = ['a','b','c','d'];
        ans.splice(ans.indexOf(value.correct),1);
        var otherAns = ans[Math.floor(Math.random() * ans.length)];

        var res = [];
        res[0] = {
            'text':  value[ans_to_id[value.correct]],
            'id': value.correct
        };
        console.log(value);
        console.log(ans_to_id[value.correct]);
        console.log(value[ans_to_id[value.correct]]);

        res[1] = {
            'text':  value[ans_to_id[otherAns]],
            'id': otherAns
        };

        res = shuffle(res);
        callBack({
            'comodin': '50pc',
            'data':{
                'res1': res[0],
                'res2': res[1]
            }
        });
    })
};

var getChange = function (newqid, callBack) {
    var collection = db.collection('Preguntas');
    var idNewQuestion = new mongo.ObjectID(newqid);
    collection.findOne({'_id': idNewQuestion},{
        '_id': 1,
        'enunciado': 1,
        'resp1': 1,
        'resp2': 1,
        'resp3': 1,
        'resp4': 1
    }).then(function (data) {
        console.log(data);
        // TODO enviar respuestas en forma de array de JSONs con texto y letra
        callBack({
            'comodin': 'change',
            'data': data
        });
    });
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
    var collection = db.collection('Preguntas');
    req.session.level += 1;
    var level = 'Nivel ' + req.session.level;
    if (req.session.level != undefined) {
        collection.aggregate([
            {$match: {level: level}}, // filter the results
            {
                $project: {
                    '_id': 1
                }
            },
            {$sample: {size: 2}}
        ], function (err, data) {
            for (var pg in req.session.players) {
                player.setQuestion(req.session.players[pg], data[0]._id);
            }

            req.session.question = data[0]._id;
            req.session.questionChange = data[1]._id;
            // TODO enviar respuestas en forma de array de JSONs con texto y letra
            to_send = {
                enunciado: data[0].enunciado,
                respuestas: [
                    {
                        text: data[0].resp1,
                        key: 'a'
                    },
                    {
                        text: data[0].resp2,
                        key: 'b'
                    },
                    {
                        text: data[0].resp3,
                        key: 'c'
                    },
                    {
                        text: data[0].resp4,
                        key: 'd'
                    }
                ]
            };
            res.send(to_send);
        });
    }else{
        res.status(404).json({status: 404, reason: 'User Not Found'});
    }
});

router.get('/pregunta', function(req, res, next){
    var collection = db.collection('Preguntas');
    var level = 'Nivel '+(req.session.level + 1);
    console.log(req.session);
    if (req.session.level != undefined) {
        collection.aggregate([
            {$match: {level: level}}, // filter the results
            {
                $project: {
                    '_id': 1,
                    'enunciado': 1,
                    'resp1': 1,
                    'resp2': 1,
                    'resp3': 1,
                    'resp4': 1
                }
            },
            {$sample: {size: 2}}
        ], function (err, data) {
            for (var pg in req.session.players) {
                player.setQuestion(req.session.players[pg], data[0]._id);
            }

            req.session.question = data[0]._id;
            req.session.questionChange = data[1]._id;
            // TODO enviar respuestas en forma de array de JSONs con texto y letra
            to_send = {
                enunciado: data[0].enunciado,
                respuestas: [
                    {
                        text: data[0].resp1,
                        key: 'a'
                    },
                    {
                        text: data[0].resp2,
                        key: 'b'
                    },
                    {
                        text: data[0].resp3,
                        key: 'c'
                    },
                    {
                        text: data[0].resp4,
                        key: 'd'
                    }
                ]
            };
            res.send(to_send);
        });
    }else{
        res.status(404).json({status: 404, reason: 'User Not Found'});
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
