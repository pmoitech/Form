var http = location.protocol;
var slashes = http.concat("//");

var server = slashes.concat(window.location.hostname) + '/pruebas/es/';

//console.log(server);
var lat = lng = deslat = destlng = 0;
var scode = null;
var user = null;
var localizationDemonId;
var updateLocationDemonId;
var messageDemonId;
var verification_interval = null;
var updatelocation_interval = null;
var message_interval         = null;
var verifyServiceDemonId;
var verifyServiceStateDemonId;
var WaitVeryServiceDemonid;
var geoOptions = { timeout: verification_interval };
var ubicacionServicio = null;
var user_data = '';
var request_id = null;
var username = null;
var password = null;
var switchBgDemon = null;
var lat_user = null;
var lng_user = null;
var placa = null;
var unidad = null;
var fecha_sos = null;
var page_state  = 'do-login';
var vel = 0;
var pres = 0;
var dir = 0;
var styles = [
                  {
                        "featureType": "poi",
                        "stylers": [
                          { "visibility": "off" }
                        ]
                      },{
                        "featureType": "transit",
                        "stylers": [
                          { "visibility": "off" }
                        ]
                      },{
                        "featureType": "landscape.man_made",
                        "stylers": [
                          { "visibility": "off" }
                        ]
                      }
                    ];
    
var map;
//var latitud;
//var longitud;
//var geocoder = new google.maps.Geocoder();
/*
window.onpopstate = function(event) {
  var count = parseInt(localStorage.getItem('history-changes-count'));
  localStorage.setItem('history-changes-count', ++count);
};
*/

window.onpopstate = function(event) {
 if (window.history && window.history.pushState) {
    $(window).on('popstate', function() {
      var hashLocation = location.hash;
      var hashSplit = hashLocation.split("#!/");
      var hashName = hashSplit[1];

      if (hashName !== '') {
        var hash = window.location.hash;
        console.log('page_state:'+page_state+' hash:'+hash);
        if ((hash === '') && (page_state==='dashboard')) {
          history.go(1); 
        }else{
            if ((hash === '#dashboard') && (page_state==='do-login')) {
                history.go(-2); 
            }
        }
      }
    });
  }
};

$(document).ready(function() {
    $('#current-position').hide();
    
    $(this).bind("contextmenu", function(e) {
             e.preventDefault();
    });   
    
    $('#msg-marquee').hide();

    $('#username').on('keyup', function(e) {  // OK
    //alert (e.which);
    if (e.which == 13) {
        e.preventDefault();        
        $( "#password" ).focus();
        }
    });

    $('#password').on('keyup', function(e) {  // OK
    if (e.which == 13) {
        e.preventDefault();        
        username = $('#username').val();
        password = $('#password').val();
        username = username.toLowerCase();
        login(username, password);
        }
    });
    

    $.mobile.loading( "show" );
    
    $("#audio-wrap, #btn-aplico-wrap, #btn-entregado-wrap, #btn-cancelar-wrap, #btn-llego-wrap").hide();
    $('#current-position').hide(); //show
    init();
    

    $('#btn-close').click(function(e){
        navigator.geolocation.clearWatch(id_watch);
        e.preventDefault();
        clearInterval(verifyServiceStateDemonId);
        clearInterval(localizationDemonId);
        clearInterval(verifyServiceDemonId);
        clearInterval(updateLocationDemonId);
        username = '';
        password = '';
        $('#password').val('');
        $('#username').val('');
        //window.close() ;
        page_state  = 'do-login';
        $("#show-login").trigger('click'); 
    });

    $('#do-login').click(function(e){
        e.preventDefault();
        play_sound('pito'); 
        username = $('#username').val();
        password = $('#password').val();
        $('#service-addr').val('');
        login(username, password);
    });
    
    $('#btn-cancelar').click(function(e){
        e.preventDefault();
        //play_sound('alerta'); 
        if (confirm("Esta seguro que desea cancelar el servicio de taxi?")){ 
            cancel_service();
        }
    });
    
    $('#btn-aplico').click(function(e){
        e.preventDefault();
        //play_sound('alerta'); 
        confirm_service();
    });

    $('#btn-entregado').click(function(e){
        e.preventDefault();
        $('#wraper-voucher').hide();
        $('#select-pay').val("E").change();
        $('#code-cust').val('');
        $('#service-price').val(0);
        $("#show-pay-modal").trigger('click'); 
    });

    $('#btn-save-entrega').click(function(e){
        e.preventDefault();
        service_delivered();
        $("#pay-modal").dialog('close');
    });


    
    $('#btn-llego').click(function(e){
        e.preventDefault();
        play_sound('pito'); 
        arrival_confirmation();
    });
    
    $('#btn-sos').click(function(e){
        e.preventDefault();
        help_me();
    });
    
    $( "#btn-address" ).click(function(e){
        e.preventDefault();
        //play_sound('alerta'); 
        get_address(lat,lng);
    });
   
    
    $('#service-price').priceFormat({
        prefix: '',
        thousandsSeparator: '',
        limit: 8,
        centsLimit: 2

    });

});


$( document ).bind( "pageshow", function( event, data ){
google.maps.event.trigger(map_canvas, 'resize');
});

$(document).on('pagebeforeshow', '#maps-modal', function(){ 
    $('#map_canvas').css('width', '100%');
    $('#map_canvas').css('height', '500px');
    //console.log('cargando mapa');
    cargarMapa();

 });

function setPay(pay){
    if(pay=='V')
        $('#wraper-voucher').show();
    else
        $('#wraper-voucher').hide();
}

function getSelectCust(){
    $('option', '#select-cust').remove();
    $("option","#select-cust" ).empty();

    $.ajax({
            type : "GET",
            url : server + 'agent/get_all_cust' ,        
            dataType : "json",
            data : {}
    }).done(function(response){
        if(response.state == 'ok'){
            //$('#select-cust').append('<option value="-1">Todas</option>');
            for(var i in response.result){
                $('#select-cust').append('<option value="'+response.result[i].id+'" >'+response.result[i].nombre+'</option>');
            }
                
        }
    });
       
}

function getMessage(){
    
    $.ajax({
            type : "GET",
            url : server + 'agent/get_message' ,        
            dataType : "json",
            data : {}
    }).done(function(response){
        if(response.state == 'ok'){
            //$('#msg-marquee').val(response.message);
            
            $('#msg-marquee').html("<MARQUEE BGCOLOR='#ccc'>"+response.message+"</MARQUEE>");
            $('#msg-marquee').show();           
        }else
            $('#msg-marquee').hide();
    });
       
}

 function checkAudioCompat() {
       var myAudio = document.createElement('audio');
      if (myAudio.canPlayType) {
          // CanPlayType returns maybe, probably, or an empty string.
          if ( "" != myAudio.canPlayType('audio/mpeg')) {
              alert("mp3 supported");
          }
          if ( "" != myAudio.canPlayType('audio/ogg; codecs="vorbis"')) {
              alert("ogg supported");
          }
         if ( "" != myAudio.canPlayType('audio/mp4; codecs="mp4a.40.5"')) {
              alert("aac supported");
          }
      }
      else {
         alert("no audio support");
      }
  }


function play_sound(element) {
    document.getElementById(element).play();
}

// url : server + 'agent/switch_to_free',  

function login(id, key){
    clearInterval(localizationDemonId);
    clearInterval(verifyServiceDemonId);
    clearInterval(messageDemonId);
   
    resetSrvAddrBg();

    $.ajax({
        type : "GET",
        url : server + 'api/login',        
        dataType : "json",
        data : {
            username : id,
            password : key,
            hms1: scode,
            cachehora : (new Date()).getTime()
        }
    }).done(function(response){
        
        if(response.state=='ok'){
            page_state  = 'dashboard';
            $("#show-dashboard").trigger('click');
            user = response.data
            $('#agent-name').html(user.nombre);
            if (!user.foto) user.foto = 'default-driver.png';
            $('#agent-photo').attr('src', "../assets/images/agents/" + user.foto) ;
            $('#gps-state').attr('src', "../assets/images/gps/gps_disconnected.png") ;
            // ojoooo no se puede sacar clearInterval de este lado por que no se reinicia el logueo
            clearInterval(updateLocationDemonId);    
            localizame();
            updateLocation();
            verifyService();
            localizationDemonId = setInterval(localizame, verification_interval);
            updateLocationDemonId = setInterval(updateLocation, verification_interval);
            verifyServiceDemonId = setInterval(verifyService, verification_interval);

            placa = user.placa;
            unidad = user.unidad;
            $('#text-sos').html('La unidad '+user.unidad+', con placa '+ user.placa +' solicita ayuda en : ');
            
            //mirar si se puede cargar solo una vez, o se necesita estar actualizando.
            getSelectCust();
            getMessage();
            messageDemonId = setInterval(getMessage, message_interval);

        }else{
            alert(response.msg);
        }
    });     
}


function relogin(id, key){
    
    $.ajax({
        type : "GET",
        url : server + 'api/relogin',        
        dataType : "json",
        data : {
            username : id,
            password : key,
            hms1: scode,
            cachehora : (new Date()).getTime()
        }
    }).done(function(response){
        
        if(response.state=='ok'){
            
            //
        }
    });     
}



function arrival_confirmation(){
    $.ajax({
        type : "GET",
        url : server + 'agent/arrival_confirmation',        
        dataType : "json",
        data : {
            request_id : request_id,
            hms1: scode,
            cachehora : (new Date()).getTime()
        }
    }).done(function(response){
        
    });  
    
}

function verifyService(){
    $.ajax({
        type : "GET",
        url : server + 'agent/get_service',        
        dataType : "json",
        data : {
            demonId : verifyServiceDemonId,
            lat : lat,
            lng : lng,
            hms1: scode,
            cachehora : (new Date()).getTime()
        },
        success: function(response){        
            if(response.state == 'ok'){
                $("#pito")[0].play();
                request_id = response.request;
                
                lat_user = response.latitud;
                lng_user = response.longitud;
                ubicacionServicio = response.ubicacion;
                user_data = '';
                if (response.name!='')
                    user_data  = response.name ;
                if (response.phone!='')
                    user_data += ' - '+'<a href="tel:'+response.phone+'">'+response.phone+'</a>';  
                if ((response.phone!='')&&(response.phone!=response.cell))
                    user_data += ' - '+'<a href="tel:'+response.cell+'" >'+response.cell+'</a>';  ;  
                //ojo, muestra la ubicacion completa del usuario. trae problemas de canivalismo. la opcion correcta es response.sector
                $('#service-addr').val(response.ubicacion);
                $('#btn-aplico-wrap').show();
                $('#btn-cancelar-wrap').show();
            
                clearInterval(verifyServiceDemonId);

                clearInterval(switchBgDemon);
                switchBgDemon = setInterval(switchServiceAddrBg, 1000);
            
                //da espera de 8*4=32 seg para contestar la solicitud
                clearInterval(WaitVeryServiceDemonid);
                WaitVeryServiceDemonid = setInterval(WaitVeryService, verification_interval*4);

                $('#service-addr').css('background-color', 'red');
            }else{
                if(response.state == 'agent_sanction'){
                  $('#service-addr').val('Uste esta sancionado hasta : ' + response.date_santion );  
                }
                //else{
                    //$('#service-addr').val('');  
                //}

            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            //console.log(xhr);
            //login(username, password);
        }
    });
}

var bgColor = null;
var alertService = null;

function switchServiceAddrBg(){
    if(bgColor != 'red'){
        
        bgColor = 'red';
        $('#service-addr').css('background-color', 'red');
        $('#service-addr').css('color', 'white');
        
    }else{
        bgColor = 'white';
        $('#service-addr').css('background-color', 'white');
        $('#service-addr').css('color', 'black');
    }

    alertService = alertService +1;
    //console.log('alertService:'+alertService);
    if(alertService == 4){
        $("#pito")[0].play();
        //alertService = 0;
    }
}

function switchToFree(){
    request_id = null;
    
    $('#service-addr').val('');
    $('#verificacion-cod').html('');      
    $('#user-data').html('');

    $("#btn-aplico-wrap, #btn-entregado-wrap, #btn-cancelar-wrap, #btn-llego-wrap").hide();
    $('#current-position').hide(); //show
    clearInterval(verifyServiceDemonId);    
    verifyServiceDemonId = setInterval(verifyService, verification_interval);
    
    clearInterval(verifyServiceStateDemonId);
    
    resetSrvAddrBg();

    $.ajax({
        type : "GET",
        url : server + 'agent/switch_to_free',        
        dataType : "json",
        data : {
            hms1: scode,
            cachehora : (new Date()).getTime()
        }
    }).done(function(response){});      
}



function WaitVeryService(){
   switchToFree();
   clearInterval(WaitVeryServiceDemonid);
}

function cancel_service(){ 
    
    $('#service-addr').val('');
    $('#verificacion-cod').html('');
    $('#user-data').html('');
    
    $("#btn-aplico-wrap, #btn-entregado-wrap, #btn-cancelar-wrap, #btn-llego-wrap").hide();
    $('#current-position').hide(); //show
    clearInterval(WaitVeryServiceDemonid);

    clearInterval(verifyServiceDemonId);
    verifyServiceDemonId = setInterval(verifyService, verification_interval);
    clearInterval(verifyServiceStateDemonId);
    clearInterval(switchBgDemon);
    resetSrvAddrBg();
     
    $.ajax({
        type : "GET",
        url : server + 'agent/cancel_service',        
        dataType : "json",
        data : {
            hms1: scode,
            request_id: request_id,
            cachehora : (new Date()).getTime()
        }
    }).done(function(response){
        request_id = null;
    }); 
    
}

function service_delivered(){
    var cust = -1;
    if ($('#select-pay').val()=='V')
       cust = $('#select-cust').val();
    $.ajax({
        type : "GET",
        url : server + 'agent/delivered_service',        
        dataType : "json",
        data : {
            request_id  : request_id,
            lat         : lat,
            lng         : lng,
            pay         : $('#select-pay').val(),
            cust        : cust,
            voucher     : $('#code-cust').val(),
            price       : $('#service-price').val(),
            hms1        : scode,
            cachehora   : (new Date()).getTime()
        }
    }).done(function(response){
        if(response.state=='ok'){  
            $('#service-addr').val('');  
            $('#verificacion-cod').html('');      
            $('#user-data').html('');
            switchToFree();
        }
    }).fail(function(jqXHR, textStatus, errorThrown){
         alert("No tienen conexión a internet, por favor intente de nuevo.");
      });  

    
}

function resetSrvAddrBg(){
    clearInterval(switchBgDemon);
    bgColor = 'white';
    $('#service-addr').css('background-color', 'white');
    $('#service-addr').css('color', 'black');
    //$('#service-addr').val('');
}

function confirm_service(){

    clearInterval(WaitVeryServiceDemonid);
    $('#confirm-service').hide();
    resetSrvAddrBg();
    
    $.ajax({
        type : "GET",
        url : server + 'agent/confirm',        
        dataType : "json",
        data : {
            request_id : request_id,
            hms1: scode,
            cachehora : (new Date()).getTime()
        }
    }).done(function(response){        
        if(response.state == 'ok'){
            //assigned
            //liberar espacio en la pantalla ocultando las coordenadas
            $('#current-position').hide();
            $('#btn-aplico-wrap').hide();
            $('#btn-entregado-wrap').show();
            $('#btn-llego-wrap').show();
            $('#verificacion-cod').html('<b>Código de Verificación: ' + request_id +'</b>');
            $('#user-data').html('<b>'+user_data+'</b>');
            $('#service-addr').val(ubicacionServicio);
            
            clearInterval(verifyServiceStateDemonId);
            verifyServiceStateDemonId = setInterval(verifyServiceState, verification_interval);
            
            //$("#alerta")[0].play();
        } else {
            //taken by other one
            //$.playSound('assets/audio/not.mp3');
             //play_sound('not'); 
             //$("#pito")[0].play();
            switchToFree();
        }
    }); 
}

function verifyServiceState(){
    $.ajax({
        type : "GET",
        url : server + 'agent/verify_service_status',        
        dataType : "json",
        data : {
            queryId : request_id,
            demonId : verifyServiceStateDemonId,
            cachehora : (new Date()).getTime()
        }
    }).done(function(response){
        //si el servicio es cancelado por el usuario
        if(response.state == 'cancel'){
            clearInterval(verifyServiceStateDemonId);
            //$.playSound('assets/audio/not.mp3');
            //play_sound('not'); 
            $("#pito")[0].play();
            alert("El servicio de taxi ha sido cancelado por el usuario.");
            switchToFree();
        }
    });  
}




function updateLocation(){
    
    $('#current-position').parent().css('background-color', 'yellow');
    $('#current-position').css('color', 'black');
    $('#current-position').val('vel: ' + vel + ' kmh lat: ' + lat+' lon: '+lng);
    //$('#current-position').val('Latitud: ' + lat + ' Longitud: ' + lng);
    
    $.ajax({
        type : "GET",
        url : server + 'agent/update_location',        
        dataType : "json",
        timeout : 5000,
        data : {
            lat : lat,
            lng : lng,
            cachehora : (new Date()).getTime()
        },
        
    }).done(function(response){
            $('#position-state').attr('src','assets/images/green_dot.png');
            $('#current-position').parent().css('background-color', '#FFFFFF');
            
            if(response.state != 'ok'){
                $('#current-position').val('====== Obteniendo ubicación ======');
            }else{
                $('#current-position').val('vel: ' + vel + ' kmh lat: ' + lat+' lon: '+lng);
            }
            
     }).fail(function(jqXHR, textStatus, errorThrown){
         //$('#current-position').val('======= Error de conexión =======');
         $('#current-position').parent().css('background-color', '#FFFFFF');
         $('#current-position').css('color', 'red');
         $('#current-position').val('vel: ' + vel + ' kmh lat: ' + lat+' lon: '+lng);
         //-------------------------------login(username, password);
         relogin(username, password);
      }); 
     //verificar mensaje de ayuda de otros agentes.
     //get_sos();
}



function help_me(){
    
    $.ajax({
        type : "GET",
        url : server + 'agent/help_me',        
        dataType : "json",
        timeout : 5000,
        data : {
            lat :  lat,
            lng :  lng,
            addr : $('#text-sos').val(),
            cachehora : (new Date()).getTime()
        },
        
    }).done(function(response){
       if(response.state == 'ok'){
            alert('Su solicitud de ayuda fue enviada con exito.');
        }else{
            alert('ERROR al enviar la solicitud, vuelve a intentarlo.');
        }
     }).fail(function(jqXHR, textStatus, errorThrown){
        alert('ERROR al enviar la solicitud, vuelve a intentarlo.');
      }); 
}

function get_sos(){
    
    $.ajax({
        type : "GET",
        url : server + 'agent/get_sos',        
        dataType : "json",
        timeout : 5000,
        data : {
            lat :  lat,
            lng :  lng,
            cachehora : (new Date()).getTime()
        },
        
    }).done(function(response){
        if(response.state == 'ok'){
            if((response.fecha_sos!=fecha_sos)){
                fecha_sos = response.fecha_sos;
                //play_sound('yes'); 
                $("#pito")[0].play();
                alert(response.direccion_sos);
            }
        }
     }); 


}

function localizame() {
    id_watch = navigator.geolocation.watchPosition(coords, errores, {'enableHighAccuracy':true,'timeout':20000,'maximumAge':0});
    /*if (navigator.geolocation) { 
        //navigator.geolocation.getCurrentPosition(coords, errores);
        navigator.geolocation.getCurrentPosition(coords, errores,{'enableHighAccuracy':true,'timeout':20000,'maximumAge':0});
    }else{
        $('#current-position').val('No hay soporte para la geolocalización.');
    }*/
}

function coords(position) {
    lat = position.coords.latitude;
    lng = position.coords.longitude;
    pres = position.coords.accuracy; // presición
    vel = position.coords.speed;  //velocidad m/s
    vel = vel*3.6;
    dir = position.coords.heading; // azimuth
    console.log(lat+" -"+vel);

    //$('#agent-name').text(pres);

    if (lat && vel<=0) 
        $('#gps-state').attr('src', "../assets/images/gps/gps_cellular.png");
    if (lat && vel>0) 
        $('#gps-state').attr('src', "../assets/images/gps/gps_satellite.png");
}

function cargarMapa() {
    var directionsDisplay = new google.maps.DirectionsRenderer();
    var directionsService = new google.maps.DirectionsService();
    var latlon = new google.maps.LatLng(lat,lng); /* Creamos un punto con nuestras coordenadas */
    var myOptions = {
        zoom: 15,
        center: latlon, /* Definimos la posicion del mapa con el punto */
        navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL}, 
        mapTypeControl: true, 
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles : styles

    };/* HYBRID  Configuramos una serie de opciones como el zoom del mapa y el tipo.*/
    map = new google.maps.Map($("#map_canvas").get(0), myOptions); /*Creamos el mapa y lo situamos en su capa */
    
    /*Creamos un marcador AGENTE*/   
    agentMarker = new google.maps.Marker({
            position: new google.maps.LatLng( lat, lng ),
            map: map,
            icon : 'assets/images/taxi.png'
    });
    /*Creamos un marcador USUARIO*/   
    userMarker = new google.maps.Marker({
            position: new google.maps.LatLng( lat_user, lng_user ),
            map: map,
            icon : 'assets/images/male.png'
    });

    var rendererOptions = {
      map: map,
      suppressMarkers : true
    }
    directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);

    var request = {
      origin:  new google.maps.LatLng( lat, lng ),
      destination:new google.maps.LatLng( lat_user, lng_user),
      
      travelMode: google.maps.DirectionsTravelMode.DRIVING
    };

    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
        }
    });

    
}



function errores(err) {
    /*Controlamos los posibles errores */
    if (err.code == 0) {
        $('#current-position').val("Error en la geolocalización.");
    }
    if (err.code == 1) {
        $('#current-position').val("Para utilizar esta aplicación por favor aceptar compartir tu posición gegrafica.");
    }
    if (err.code == 2) {
        $('#current-position').val("No se puede obtener la posición actual desde tu dispositivo.");
    }
    if (err.code == 3) {
        $('#current-position').val("Hemos superado el tiempo de espera. Vuelve a intentarlo.");
    }
}


var sector = null;
var formatted_addr = null;
var geocoder = new google.maps.Geocoder();

function get_address(lat, lng) {

    var latlng = new google.maps.LatLng(lat, lng);
    geocoder.geocode({'latLng': latlng}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            if (results[1]) {
                var tam = results[0].address_components.length;
                sector = results[0].address_components[2] ;
                
                formatted_addr = sector.long_name + ', ' + results[0].formatted_address;
                var guion = formatted_addr.indexOf("-");
                if (guion>0) {
                    formatted_addr = formatted_addr.substring(0, guion) + ' - ';
                } else{
                    formatted_addr = sector.long_name + ', ' + results[0].address_components[1].long_name + ' # ' +results[0].address_components[0].long_name;
                }
                
            
//                $('#address').val(formatted_addr);
                $('#text-sos').html('La unidad '+unidad+', con placa '+placa+' solicita ayuda en '+formatted_addr);
                
    
            } else {
                $('#text-sos').val('No encontró una dirección asociada a las coordenadas.');
            }
            
        } else {
            //$('#address').val("Fallo en las Appis de Google : "+ status);
        }
    });
}

function init(){
    $.ajax({
        type : "GET",
        url : server + 'api/agent_init',        
        dataType : "json",
        data : {cachehora : (new Date()).getTime()}
    }).done(function(response){
        $.mobile.loading( "hide" );
        if(response.state == 'ok'){
            scode                   = response.code;
            verification_interval   = response.verification_interval;
            updatelocation_interval = response.updatelocation_interval;
            message_interval        = response.message_interval;
            $('#app_name').html(response.app_name);
            $('#app_icon').attr('src', "assets/images/" + response.app_icon) ;
            $('#copyright').html(response.copyright);
            $('#copyright2').html(response.copyright);

        }else{
            $('#popupBasic').html('No hay conexión al servidor, intente de nuevo mas tarde.');
            $('#popupBasic').popup();
        }
    }); 
    
}