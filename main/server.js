/**
 * Web API
 */
const firebase = require('firebase');
import {Status} from './msg_status.js'
var userDataUrl ='https://randomuser.me/api/';
var admin = require('firebase-admin')
var path = require('path');
const dbServiceAccount = require('./../auth/firebase-admin-cred.json');
var dbApp =admin.initializeApp({
            credential: admin.credential.cert(dbServiceAccount), 
            databaseURL: 'https://huma-eng-test.firebaseio.com/'
            });
var dbRef = dbApp.database().ref('users/');

const bodyParser = require('body-parser');
var express = require('express');
var app = express();
/**
 * Url encoding
 */
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

var port = process.env.PORT || 8000;


var controller = express.Router();


/**
 * Create User
 */
controller.post('/create',(req, res)=>{
    var developerId = req.query.develid;
    var name = req.query.name;
    var dob = req.query.dob;
    let user = new Object();
    user.Dob=dob;
    user.Name=name;
    user.developerID=developerId;
    user.Timestamp =firebase.database.ServerValue.TIMESTAMP;
    dbRef.orderByChild('developerID').equalTo(user.developerID).once('value', snap=>{
            var data =snap.val();
            if(data){
                res.send(Status.CREATEFAIL);
            }else{
                  isNameAndDobEqual(user.Name, user.Dob).then(val=>{
                    if(!val){
                        createAndStoreUser(user).then(result=>{
                          res.send(Status.CREATESUCCESS);
                        })
                    }
                  }); 
            }
    });
});

controller.get('/user', (req, res)=>{
    var name = req.query.name;
    var developerId = req.query.develid;
    if(name){
        name=name.toLowerCase();
        dbRef.orderByChild('Name').startAt(name).endAt(name+"\uf8ff").on('value', snap=>{
            if(snap.val()){
                res.send(snap.val());
            }else{
                res.send(Status.USERNOTFOUND);
            }
        });
    }else{
        if(developerId){
            dbRef.orderByChild('developerID').equalTo(developerId).on('value', snap=>{
                if(snap.val()){
                    res.send(snap.val());
                }else{
                    res.send(Status.USERNOTFOUND);
                }
            });
        }
    }
    
});

controller.delete('/user',(req, res)=>{
    let name = req.query.name.toLowerCase();
    let dob = req.query.dob;
    isNameAndDobEqual(name, dob).then(user=>{
        if(user){
            let key = Object.keys(user)[0];
            user = user[key];    
            dbRef.orderByChild('UID').equalTo(user.UID).on('value', snap=>{
                snap.child(key).ref.remove(result=>{
                    dbApp.auth().deleteUser(user.UID).then(result=>{
                       res.send(Status.DELETESUCCESS);
                    }).catch(err=>{
    
                    });
                });  
            });
        }else{
            res.send(Status.DELETEFAIL);
        }
    });
    
});
controller.put('/user',(req, res)=>{
    var oName = req.query.oname;
    var oDob = req.query.odob;
    var name = req.query.name;
    var dob = req.query.dob;
    if(oName && oDob && name && dob){
        isNameAndDobEqual(oName, oDob).then(result=>{
            if(result){
               updateUser(result, name, dob).then(status=>{
                res.send(Status.UPDATESUCCESS);
               });
               
            }else{
                res.send(Status.UPDATEFAIL);
            }
            
        });
    }else{
        res.send(Status.UPDATEFAIL);
    }
    
});

app.use('/', controller);

app.listen(port,()=>{
    console.log("Server started and listening.........");
});










function updateUser(user, name, dob){
    return new Promise((resolve, reject)=>{
        if(user){
            let pushId = Object.keys(user)[0];
            user = user[pushId];
            dbRef.child(pushId).update({"Name": name, "Dob": dob},res=>{
                if(res){   
                 resolve({msg: "Unable to update the user!!!"}); 
                }else{  
                 resolve({msg: "Successfully updated the user"});
                }
            }); 
        }
    });
}

function createAndStoreUser(user){
    return new Promise((resolve, reject)=>{
        if(user.Name.length>=256){
            user.Name.substring(0,256);
        }
        dbApp.auth().createUser(user)
            .then(userRecord=>{
                user.UID=userRecord.uid;
             resolve(pushUserToFirebase(user));
        });
    });
    
}

function pushUserToFirebase(user){
   return new Promise((resolve, reject)=>{
        if(dbRef!=null){
            dbRef.push(user).then(res=>{
                resolve("Successfully created the user with UID"+user.UID)     ;
            }).catch(erro=>{
                resolve("User cannot be created, check your fields!!!");
            })
        }
    });
}

function isNameAndDobEqual(name, dob){
    return new Promise((resolve, reject)=>{
        dbRef.orderByChild('Name').equalTo(name).once('value',snap=>{
            if(snap.val()){
                // console.log("Name Matched!!!");
                dbRef.orderByChild('Dob').equalTo(dob).once('value', snap=>{
                    if(snap.val()){
                        let user = snap.val();
                        console.log("isNameAndDobEqual............");
                        resolve(user);
                    }else{
                        console.log("isNameAndDobEqual......null............");
                        resolve(null);    
                    }
                });   
            }else{
            resolve(null);
        }
        });
    });    
}
