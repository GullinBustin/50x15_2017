var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var google = require('google');


router.post('/answer', function (req, res, next) {
    var answer = req.body.answer;
    var idQuestion = new mongo.ObjectID(req.body.idQuestion);

    if(['a','b','c','d'].indexOf(answer) >= 0){
        var collection = db.collection('Preguntas');
        collection.find({'_id': idQuestion, 'correct': answer}).toArray(function (err, data) {
            if (data.length > 0) {
                res.status(200).send("OK");
            }else{
                res.status(200).send("NO");
            }
        });
    }else{
        res.status(404).send("Not Found");
    }

});

router.get('/comodin/50pc/:idQuestion', function (req, res, next) {

    var idQuestion = new mongo.ObjectID(req.params.idQuestion);
    get50pc(idQuestion, function (data) {
        res.status(200).send(data);
    });
});

router.get('/comodin/change/:idQuestion', function (req, res, next) {

    res.status(200).send(data);
});

router.get('/comodin/google/:text', function (req, res, next) {

    getGoogle(req.params.text, 5, function (data) {
        res.status(200).send(data);
    });
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
        callBack({
            'comodin': 'google',
            'data': data
        });
    })
};

router.get('/nextLVL/:level', function (req, res, next) {
    var level = req.params.level;
    var collection = db.collection('Preguntas');
    var level = 'Nivel ' + level;
    collection.aggregate([
        {$match: {level: level}}, // filter the results
        {
            $project: {
                '_id': 1
            }
        },
        {$sample: {size: 2}}
    ], function (err, data) {

        res.send(data);
    });

});

router.get('/pregunta/:idQuestion', function(req, res, next){
    var collection = db.collection('Preguntas');
    var idQuestion = new mongo.ObjectID(req.params.idQuestion);

    var find_fields = {
        '_id': 1,
        'enunciado': 1,
        'resp1': 1,
        'resp2': 1,
        'resp3': 1,
        'resp4': 1
    };

    collection.find({'_id' : idQuestion}).toArray(function(err, results) {
        var shuffled_resp = shuffle([
            {
                text: results[0].resp1,
                key: 'a'
            },
            {
                text: results[0].resp2,
                key: 'b'
            },
            {
                text: results[0].resp3,
                key: 'c'
            },
            {
                text: results[0].resp4,
                key: 'd'
            }]);

        to_send = {
            enunciado: results[0].enunciado,
            respuestas: shuffled_resp
        };
        res.send(to_send);
    });

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
