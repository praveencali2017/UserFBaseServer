const fetch = require('node-fetch');
const firebase = require('firebase');
var userDataUrl ='https://randomuser.me/api/';
var admin = require('firebase-admin')
const dbServiceAccount = require('./../auth/firebase-admin-cred.json');
var dbApp =admin.initializeApp({
            credential: admin.credential.cert(dbServiceAccount), 
            databaseURL: 'https://huma-eng-test.firebaseio.com/'
            });
var dbRef = dbApp.database().ref('users');
var numberOfUsers =5;

/**
 * Function to fetch users from randomuser API
 * @param {number of users required} numberOfUsers 
 */
function fetchUserData(numberOfUsers){
   return new Promise((resolve, reject)=>{
        var data=[];
        var userAuth =[];
        fetch(userDataUrl+'?results='+numberOfUsers).then(res=>res.json()).then(users=>{
            console.log(users);
            users.results.forEach(user=>{
                let firstName = user.name.first;
                let lastName = user.name.last;
                let developerID = user.login.username;
                let email = developerID;
                let password = user.login.password;
                let dob = user.dob;
                let userDetails = new Object();
                userDetails.Name =firstName+" "+lastName;
                if(userDetails.length>=256){
                    useruserDetails.name.substring(0,256);
                }
                userDetails.Timestamp = firebase.database.ServerValue.TIMESTAMP;
                userDetails.developerID = developerID;
                let dobFormat = new Date(dob);
                userDetails.Dob =dobFormat.getFullYear().toString()+(dobFormat.getMonth()+1).toString()+dobFormat.getDate().toString();
                data.push(userDetails);
                }); 
            resolve(data);
        });
    });    
}

function pushUserToFirebase(user){
    if(dbRef!=null){
        dbRef.push(user).then(res=>{
           console.log("Successfully created the user with UID"+user.UID);     
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



