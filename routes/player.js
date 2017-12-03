var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var player = require('../modules/Player');


/* POST users listing. */
router.post('/start', function(req, res, next) {
    var players = {};
    var names = req.body.pNames;
    for (var i = 0; i < parseInt(req.body.pNum); i++) {
        players[names[i]] = player.Player(names[i]);
    }

    req.session.players = players;
    req.session.level = 0;
    res.status(200).send('OK');
});

router.get('/user', function(req, res, next) {
    if(req.session.players){
        res.send(req.session.players);
    }else{
        res.status(404).send('404 Player Not Found');
    }
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
    var idQuestion = new mongo.ObjectID(req.body.idQuestion);

    switch(answer) {
        case '50pc':
            if(player.use50pc(req.session.players[pName])){
                res.status(200).send(get50pc(idQuestion));
            }else{
                res.status(404).send("Not Found");
            }
            break;
        case 'change':
            if(player.useChange(req.session.players[pName], )){

            }
            break;
        case 'google':
            code block
            break;
        default:
            code block
    }

});

var get50pc = function(qid){
    var collection = db.collection('Preguntas');
    var idQuestion = new mongo.ObjectID(qid);
    collection.findOne({'_id' : idQuestion}).then(function (value) {
        const ans_to_id= {'a': 'res1', 'b': 'res2','c': 'res3','d': 'res4'};
        var ans = ['a','b','c','d'];
        ans.splice(ans.indexOf(value.correct),1);
        ans = ans[Math.floor(Math.random() * ans.length)];

        

        return {
            'comodin': '50pc',
            'res1': {
                'text': 'a1',
                'id' : 'a'
            },
            'res2': {
                'text': 'a1',
                'id' : 'a'
            }
        };
    })
};

router.get('/pregunta', function(req, res, next){
    var collection = db.collection('Preguntas');
    var level = 'Nivel '+(req.session.level + 1);

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
        {$sample: {size: 1}}
    ], function (err, data) {
        for (var pg in req.session.players) {
            player.setQuestion(req.session.players[pg],data[0]._id);
        }
        res.send(data);
    });
});

module.exports = router;
