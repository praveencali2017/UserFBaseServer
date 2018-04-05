'use strict';

var fetch = require('node-fetch');
var firebase = require('firebase');
var userDataUrl = 'https://randomuser.me/api/';
var admin = require('firebase-admin');
var dbServiceAccount = require('./../auth/firebase-admin-cred.json');
var dbApp = admin.initializeApp({
    credential: admin.credential.cert(dbServiceAccount),
    databaseURL: 'https://huma-eng-test.firebaseio.com/'
});
var dbRef = dbApp.database().ref('users');
var numberOfUsers = 5;

/**
 * Function to fetch users from randomuser API
 * @param {number of users required} numberOfUsers 
 */
function fetchUserData(numberOfUsers) {
    return new Promise(function (resolve, reject) {
        var data = [];
        var userAuth = [];
        fetch(userDataUrl + '?results=' + numberOfUsers).then(function (res) {
            return res.json();
        }).then(function (users) {
            console.log(users);
            users.results.forEach(function (user) {
                var firstName = user.name.first;
                var lastName = user.name.last;
                var developerID = user.login.username;
                var email = developerID;
                var password = user.login.password;
                var dob = user.dob;
                var userDetails = new Object();
                userDetails.Name = firstName + " " + lastName;
                if (userDetails.length >= 256) {
                    useruserDetails.name.substring(0, 256);
                }
                userDetails.Timestamp = firebase.database.ServerValue.TIMESTAMP;
                userDetails.developerID = developerID;
                var dobFormat = new Date(dob);
                userDetails.Dob = dobFormat.getFullYear().toString() + (dobFormat.getMonth() + 1).toString() + dobFormat.getDate().toString();
                data.push(userDetails);
            });
            resolve(data);
        });
    });
}

function pushUserToFirebase(user) {
    if (dbRef != null) {
        dbRef.push(user).then(function (res) {
            console.log("Successfully created the user with UID" + user.UID);
        });
    }
}

/**Fetch user details**/
// fetchUserData(numberOfUsers).then(data=>{
//     data.forEach(user=>{
//         dbApp.auth().createUser(user)
//         .then(userRecord=>{
//             user.UID=userRecord.uid;
//             pushUserToFirebase(user);
//         });  
//         // console.log(user);
//     });
// })
// .catch(error=>{
//     console.log(error)
// });
//# sourceMappingURL=test_data.js.map