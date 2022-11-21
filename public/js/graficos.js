
var eventoimg = 0;
var cv, cx, objetos, objetoActual=null, objetoSelect = null;
var inicioX = 0, inicioY = 0;
var alto = ancho=70;
var altoDif =0;

var eventorel=0;
var numClickRel=0;
var eleA=null;
var eleB=null;

$(document).ready(function(){
    objetos = [];
    cv = document.getElementById('lienzo');
    cx = cv.getContext('2d');

    altoDif = $('#h-titulos').height();

    cv.onmousedown = function(event) {
        console.log(event.clientX, event.clientY);
        if(eventoimg>0){
            var x = event.clientX - ancho/2;
            var y = (event.clientY - alto/2)-altoDif;
            add_elemento(eventoimg, x,y);
            eventoimg=0;
            return;
        }

        let elementos = null;
        objetoSelect=null;
        if(modelo_sel_id>0){
            let modelo_sel = modelos.filter(mod => mod.id==modelo_sel_id);
            if(modelo_sel.length>0){
                elementos = modelo_sel[0].elementos;
            }
        }
        if(elementos!=null){

            for (var i = 0; i < elementos.length; i++) {
                let ele = elementos[i];
                if (ele.posx < event.clientX
                    && (ancho + ele.posx > event.clientX)
                    && ele.posy < event.clientY-altoDif
                    && (alto + ele.posy > event.clientY-altoDif)
                ) {
                    objetoActual = ele;
                    objetoSelect = ele;
                    numClickRel++;
                    if(numClickRel==1 && eventorel>0){
                        eleA = ele;
                    }else if(numClickRel==2 && eventorel>0){
                        eleB = ele;
                        if(eleA.id!= eleB.id){
                            console.log('add_relacion a -> b');
                            add_relacion_elementos(eventorel,eleA, eleB);
                        }
                        
                    }
                    inicioY = event.clientY-altoDif - ele.posy;
                    inicioX = event.clientX - ele.posx;
                    break;
                }
            }
            
        }
        actualizar_pintado();
        
    }

    cv.onmousemove = function(event) {
        if (objetoActual != null) {
            objetoActual.posx = event.clientX - inicioX;
            objetoActual.posy = event.clientY-altoDif - inicioY;
            actualizar_pintado();
            if(modelo_sel_id>0){
                let modelo_sel = modelos.filter(mod => mod.id==modelo_sel_id);
                if(modelo_sel.length>0){
                    notificar_cambio_modelo();//socket.emit('update_modelo', {username:username,modelo:modelo_sel[0]});
                }
            }
        }
    }

    cv.onmouseup = function(evet) {
        objetoActual = null;
    }


    
});

let img_elementos = {};

function actualizar_pintado() {
    if(modelo_sel_id>0){
        let modelo_sel = modelos.filter(mod => mod.id==modelo_sel_id);
        if(modelo_sel.length>0){
            cx.fillStyle = '#f0f0f0';
            cx.fillRect(0, 0, lienzo.width, lienzo.height);
            let elementos = modelo_sel[0].elementos;
            
            let relaciones = modelo_sel[0].relaciones;
            cx.lineWidth = 1;
            cx.strokeStyle = "#000";
            cx.beginPath();

            for (let i = 0; i < relaciones.length; i++) {
                const rel = relaciones[i];
                let eleas = elementos.filter(ele => ele.id==rel.pa);
                let elebs = elementos.filter(ele => ele.id==rel.pb);
                if(eleas.length>0 && elebs.length>0){
                    let elea = eleas[0];
                    let eleb = elebs[0];
                    let posxa = elea.posx+ancho/2;
                    let posya = elea.posy+alto/2;
                    let posxb = eleb.posx+ancho/2;
                    let posyb = eleb.posy+alto/2;
                    cx.beginPath();
                    cx.moveTo(posxa, posya);
                    cx.lineTo(posxb, posyb);
                    cx.stroke();
                }
                
            }

            cx.textAlign="center";
            cx.font="10pt Verdana";
            cx.fillStyle = "#000";
            for (var i = 0; i < elementos.length; i++) {
                let ele = elementos[i];
                let img = img_elementos[ele.id];
                if(img==undefined){
                    img = new Image();
                    img.src='images/'+ getImage(ele.tipo); 
                    img_elementos[ele.id] = img;
                    img.onload = function () {
                        cx.drawImage(img,ele.posx, ele.posy, ancho, alto);
                    }
                }else{
                    cx.drawImage(img,ele.posx, ele.posy, ancho, alto);
                }
                cx.strokeStyle = "#000";
                if(ele.des!=undefined){
                    cx.fillText(ele.des,ele.posx+20,ele.posy+alto+10);

                    //cx.fillText(ele.des,ele.posx,ele.posy+alto+20,150);
                }
                

            }
            if(objetoSelect!=null){
                cx.fillStyle = '#0034d1';
                cx.fillRect(objetoSelect.posx, objetoSelect.posy, 3, 3);
                cx.fillRect(objetoSelect.posx+ancho, objetoSelect.posy, 3, 3);
                cx.fillRect(objetoSelect.posx, objetoSelect.posy+alto, 3, 3);
                cx.fillRect(objetoSelect.posx+ancho, objetoSelect.posy+alto, 3, 3);
            }
            
        }
    }
}

var TIPO_DATABASE = 1;
var TIPO_ACTOR = 2;
var TIPO_COMPONENTE = 3;
var TIPO_CONTENEDOR = 4;

var TIPO_ASOCIACION = 1;
var TIPO_INSTANCIA = 2;

function dibujar_elemento(tipo){
    eventoimg = tipo;
    
}
function dibujar_relacion(tipo){
    eventorel=tipo;
    numClickRel=0;
}
function add_elemento(tipo, pox,posy){
    if(modelo_sel_id>0){
        let modelo_sel = modelos.filter(mod => mod.id==modelo_sel_id);
        if(modelo_sel.length>0){
            let descripcion = prompt('Descripcion:');
            console.log(descripcion);
            modelo_sel[0].elementos.push({
                id: Date.now(),
                tipo: tipo,
                posx: pox,
                posy: posy,
                des: descripcion
            });
            pintar_modelo();
            actualizar_pintado();
            notificar_cambio_modelo();//socket.emit('update_modelo', {username:username,modelo:modelo_sel[0]});
        }
    }
}
function add_relacion_elementos(tipo, eleA, eleB){
    if(modelo_sel_id>0){
        let modelo_sel = modelos.filter(mod => mod.id==modelo_sel_id);
        if(modelo_sel.length>0){
            modelo_sel[0].relaciones.push({
                pa: eleA.id, pb: eleB.id,tipo:tipo
            });
            
            actualizar_pintado();
            notificar_cambio_modelo();//socket.emit('update_modelo', {username:username,modelo:modelo_sel[0]});
        }
    }
}

function insertar_despcripcion(){
    if(objetoSelect!=null){
        let descripcion = prompt('Descripcion:');
        objetoSelect.des= descripcion;
        actualizar_pintado();
        notificar_cambio_modelo();
    }
}
function eliminar_elemento(){
    if(objetoSelect!=null){
        let ele_id = objetoSelect.id;
        if(modelo_sel_id>0){
            let indexModelo = modelos.findIndex(mod => mod.id==modelo_sel_id);
            if(indexModelo>=0){
                let indexElemento =  modelos[indexModelo].elementos.findIndex(ele => ele.id==ele_id);
                if(indexElemento>=0){
                    modelos[indexModelo].elementos.splice(indexElemento, 1);
                    objetoSelect=null;
                }
                let indexRel =  modelos[indexModelo].relaciones.findIndex(ele => ele.pa==ele_id || ele.pb==ele_id);
                while(indexRel>-1){
                    modelos[indexModelo].relaciones.splice(indexRel, 1);
                    indexRel =  modelos[indexModelo].relaciones.findIndex(ele => ele.pa==ele_id || ele.pb==ele_id);
                }
                actualizar_pintado();
                notificar_cambio_modelo();

            }
        }
        
    }
}

function guardar_modelo(){
    let proyecto_id= $('#proyecto_id').val();
    $('#box-guardar').show();
    socket.emit('guardar_modelo', {username:username,json_modelo: JSON.stringify(modelos), proyecto_id: proyecto_id});
}

function abrir_modelo(){
    if(modelo_sel_id>0){
        let modelo_sel = modelos.filter(mod => mod.id==modelo_sel_id);
        console.log(objetoSelect.tipo, modelo_sel.length);
        if(objetoSelect.tipo== TIPO_CONTENEDOR && modelo_sel.length>0){
            var modelos_ele = modelos.filter(e=> e.elemento_id==objetoSelect.id);
            console.log(modelos_ele);
            if(modelos_ele.length==0){
                let new_modelo_id=Date.now();
                modelos.push({
                    id: new_modelo_id,
                    elementos:[],
                    elemento_id:objetoSelect.id,
                    modelo_id:modelo_sel_id,
                    nivel:modelo_sel[0].nivel+1,
                    relaciones:[]
                });
                
                modelo_sel_id= new_modelo_id;
                actualizar_pintado();
                notificar_cambio_modelo();
            }else{
                modelo_sel_id= modelos_ele[0].id;
                actualizar_pintado();
            }
        }
    }
    
}

function modelo_principal(){
    let modelo_sel = modelos.filter(mod => mod.nivel==1 && mod.elemento_id==0);
    if(modelo_sel.length>0){
        modelo_sel_id= modelo_sel[0].id;
        actualizar_pintado();
    }

}
function notificar_cambio_modelo(){
    if(modelo_sel_id>0){
        let modelo_sel = modelos.filter(mod => mod.id==modelo_sel_id);
        if(modelo_sel.length>0){
            socket.emit('update_modelo', {username:username,modelo:modelo_sel[0]});
        }
    }
}

function getImage(tipo){
    if(tipo==1){
        return 'database.png';
    }else if(tipo==2){
        return 'usuario.png';
    }else if(tipo==3){
        return 'componente.png';
    }else if(tipo==4){
        return 'contenedor.png';
    }else{
        return 'contenedor.png';
    }
}