const express = require('express');
const app = express();
const http=require('http');
const url = require('url');
const axios = require('axios').default;
const server=http.createServer(app);

const {Server} = require('socket.io');
const io = new Server(server);

let usernames={};
let sockets_proyectos={};
let proyectos_modelos={};

//const urlApi='http://getdataproject.com/wpg/software/public';
const urlApi='http://localhost/softwarec4/public/'; 

io.on('connection', (socket) => { 
    console.log('un usuario se ha conectado');

    socket.on('disconnect', () => { 
        id=socket.id;
        proyecto_id=sockets_proyectos[id];
        users = usernames[proyecto_id]; 
        
        if(users!=undefined && users[id]!=undefined){
            delete users[id];  
        }
        if(sockets_proyectos[id]!=undefined){
            delete sockets_proyectos[id];  
        } 
        if(users!=null){
            let num_users = Object.keys(users).length;
            if(num_users==0){
                console.log('eliminar proyecto modelo'); 
                delete proyectos_modelos[proyecto_id]; 
            } 
        }  
        //delete users[id];
        io.to("room"+proyecto_id).emit("updateusers",users);
        console.log('un usuario se ha DESCONECTADO');
    });
    socket.on('chat', (msg) => {
        console.log('Mensaje: '+msg);
        io.emit('chat', msg);
    });
    socket.on('adduser', function(jsonUsuario){
        let usuario = JSON.parse(jsonUsuario);
        let username = usuario.username;
        let proyecto_id = usuario.proyecto_id;
        let modelos = usuario.modelos; 
        if(!usernames[proyecto_id]){
            usernames[proyecto_id]={};
        }
        let users = usernames[proyecto_id];
        
        let roomId= "room"+proyecto_id;
        socket.join( roomId);
		
		socket.username = username;
		
        sockets_proyectos[socket.id]= proyecto_id;
        users[socket.id] = {username:username, proyecto_id:proyecto_id,es_propietario:usuario.es_propietario};
        usernames[proyecto_id]=users;
        io.to("room"+proyecto_id).emit("updateusers",users);

	});
    socket.on('update_modelo', function(data){
        let modelo = data.modelo;
        let username= data.username;
        // console.log(data);
        id=socket.id;
        proyecto_id=sockets_proyectos[id];
        
        let mod_id = modelo.id;
        
        let modelos = proyectos_modelos[proyecto_id];
        
        let index =getIndexModelo(modelos,mod_id);// modelos.findIndex( m => m.id == mod_id);// modelos.filter(mod=> mod.id==mod_id);
        // console.log('index: '+index);
        if(index>=0){
            modelos[index] = modelo;
            proyectos_modelos[proyecto_id] = modelos;
        }else{
            modelos.push(modelo); 
        }
        
        io.to("room"+proyecto_id).emit("update_modelo",{modelo:modelo,username:username}); 
        
	}); 
    socket.on('guardar_modelo', function(data){
        let username = data.username;
        let json_modelo= data.json_modelo;
        let proyecto_id= data.proyecto_id;
        // console.log(json_modelo);
        // console.log(proyecto_id); 
        axios.post(urlApi+'/api/guardar-modelo', {json_modelo: json_modelo,proyecto_id: proyecto_id})
            .then(function (response) {
                //console.log(response.data)
            io.to("room"+proyecto_id).emit("modelo_guardado",{success:true,username:username}); 
        });
        
        
	});  
});

var engines = require('consolidate');
const { json } = require('express/lib/response');

app.set('views', __dirname + '/views');
app.engine('html', engines.mustache);
app.set('view engine', 'html'); 
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    const queryObject = url.parse(req.url, true).query;
    console.log(queryObject);
    const session_id = queryObject.session_id;
    const proyecto_id = queryObject.p;

    axios.get(urlApi+'/api/auth-user', {params: {session_id: session_id,proyecto_id: proyecto_id}})
      .then(function (response) {
        let data = response.data;
        if(data.success){
            let usuario = data.usuario;
            console.log(proyectos_modelos);
            if(proyectos_modelos[proyecto_id]==undefined){
                if(usuario.modelos!=null && usuario.modelos!=''){
                    usuario.modelos=usuario.modelos;
                }else{
                    usuario.modelos= JSON.stringify(getProyectoInicial());
                }
                proyectos_modelos[proyecto_id]=JSON.parse(usuario.modelos);
            }else{
                usuario.modelos = JSON.stringify(proyectos_modelos[proyecto_id]);
            }
            res.render(`${__dirname}/cliente/index.html`,{usuario: usuario}); 
        }
      })
    //   .catch(function (error) { 
    //     console.log(error);
    //   }) 
    //   .then(function () {
        
    //   })
      ; 
}); 

server.listen(3000,()=>{
    console.log('server is running on port 3000');

});
 
function getProyectoInicial(){
    return [
        {
            id:Date.now(),
            elementos:[],
            elemento_id:0,
            modelo_id:0,
            nivel:1,
            relaciones:[]
        }
    ];

} 
function getIndexModelo(modelos,id){
    
    for (let i = 0; i < modelos.length; i++) {
        const mod = modelos[i];
        
        if(mod.id==id){
            return i;
        }
    }
    return -1;

    
}