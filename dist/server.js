'use strict';

var _msg_status = require('./msg_status.js');

/**
 * Web API
 */
var firebase = require('firebase');

var userDataUrl = 'https://randomuser.me/api/';
var admin = require('firebase-admin');
var path = require('path');
var dbServiceAccount = require('./../auth/firebase-admin-cred.json');
var dbApp = admin.initializeApp({
    credential: admin.credential.cert(dbServiceAccount),
    databaseURL: 'https://huma-eng-test.firebaseio.com/'
});
var dbRef = dbApp.database().ref('users/');

var bodyParser = require('body-parser');
var express = require('express');
var app = express();
/**
 * Url encoding
 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8000;

var controller = express.Router();

/**
 * Create User
 */
controller.post('/create', function (req, res) {
    var developerId = req.query.develid;
    var name = req.query.name;
    var dob = req.query.dob;
    var user = new Object();
    user.Dob = dob;
    user.Name = name;
    user.developerID = developerId;
    user.Timestamp = firebase.database.ServerValue.TIMESTAMP;
    dbRef.orderByChild('developerID').equalTo(user.developerID).once('value', function (snap) {
        var data = snap.val();
        if (data) {
            res.send(_msg_status.Status.CREATEFAIL);
        } else {
            isNameAndDobEqual(user.Name, user.Dob).then(function (val) {
                if (!val) {
                    createAndStoreUser(user).then(function (result) {
                        res.send(_msg_status.Status.CREATESUCCESS);
                    });
                }
            });
        }
    });
});

controller.get('/user', function (req, res) {
    var name = req.query.name;
    var developerId = req.query.develid;
    if (name) {
        name = name.toLowerCase();
        dbRef.orderByChild('Name').startAt(name).endAt(name + '\uF8FF').on('value', function (snap) {
            if (snap.val()) {
                res.send(snap.val());
            } else {
                res.send(_msg_status.Status.USERNOTFOUND);
            }
        });
    } else {
        if (developerId) {
            dbRef.orderByChild('developerID').equalTo(developerId).on('value', function (snap) {
                if (snap.val()) {
                    res.send(snap.val());
                } else {
                    res.send(_msg_status.Status.USERNOTFOUND);
                }
            });
        }
    }
});

controller.delete('/user', function (req, res) {
    var name = req.query.name.toLowerCase();
    var dob = req.query.dob;
    isNameAndDobEqual(name, dob).then(function (user) {
        if (user) {
            var key = Object.keys(user)[0];
            user = user[key];
            dbRef.orderByChild('UID').equalTo(user.UID).on('value', function (snap) {
                snap.child(key).ref.remove(function (result) {
                    dbApp.auth().deleteUser(user.UID).then(function (result) {
                        res.send(_msg_status.Status.DELETESUCCESS);
                    }).catch(function (err) {});
                });
            });
        } else {
            res.send(_msg_status.Status.DELETEFAIL);
        }
    });
});
controller.put('/user', function (req, res) {
    var oName = req.query.oname;
    var oDob = req.query.odob;
    var name = req.query.name;
    var dob = req.query.dob;
    if (oName && oDob && name && dob) {
        isNameAndDobEqual(oName, oDob).then(function (result) {
            if (result) {
                updateUser(result, name, dob).then(function (status) {
                    res.send(_msg_status.Status.UPDATESUCCESS);
                });
            } else {
                res.send(_msg_status.Status.UPDATEFAIL);
            }
        });
    } else {
        res.send(_msg_status.Status.UPDATEFAIL);
    }
});

app.use('/', controller);

app.listen(port, function () {
    console.log("Server started and listening.........");
});

function updateUser(user, name, dob) {
    return new Promise(function (resolve, reject) {
        if (user) {
            var pushId = Object.keys(user)[0];
            user = user[pushId];
            dbRef.child(pushId).update({ "Name": name, "Dob": dob }, function (res) {
                if (res) {
                    resolve({ msg: "Unable to update the user!!!" });
                } else {
                    resolve({ msg: "Successfully updated the user" });
                }
            });
        }
    });
}

function createAndStoreUser(user) {
    return new Promise(function (resolve, reject) {
        if (user.Name.length >= 256) {
            user.Name.substring(0, 256);
        }
        dbApp.auth().createUser(user).then(function (userRecord) {
            user.UID = userRecord.uid;
            resolve(pushUserToFirebase(user));
        });
    });
}

function pushUserToFirebase(user) {
    return new Promise(function (resolve, reject) {
        if (dbRef != null) {
            dbRef.push(user).then(function (res) {
                resolve("Successfully created the user with UID" + user.UID);
            }).catch(function (erro) {
                resolve("User cannot be created, check your fields!!!");
            });
        }
    });
}

function isNameAndDobEqual(name, dob) {
    return new Promise(function (resolve, reject) {
        dbRef.orderByChild('Name').equalTo(name).once('value', function (snap) {
            if (snap.val()) {
                // console.log("Name Matched!!!");
                dbRef.orderByChild('Dob').equalTo(dob).once('value', function (snap) {
                    if (snap.val()) {
                        var user = snap.val();
                        console.log("isNameAndDobEqual............");
                        resolve(user);
                    } else {
                        console.log("isNameAndDobEqual......null............");
                        resolve(null);
                    }
                });
            } else {
                resolve(null);
            }
        });
    });
}
//# sourceMappingURL=server.js.map