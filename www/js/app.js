/*version 1.4*/

var ajax_url= krms_driver_config.ApiUrl ;
var dialog_title_default= krms_driver_config.DialogDefaultTitle;
var search_address;
var ajax_request = [];
var networkState;
var reload_home;
var translator;

var ajax_request2;
var ajax_request3;
var map;
var watchID;
var push;
var app_running_status;

var device_platform;
var app_version = "2.0.0";
var exit_cout = 0;

var ajax_timeout = 50000;
var timer = {};
var ajax_task;
var $cron_interval = (60*1000);
var $handle_cron = [];
var ajax_new_task;
var reload_completed = 0;
var map_navigator = 0;

jQuery.fn.exists = function(){return this.length>0;}

function dump(data)
{
	console.debug(data);
}

dump2 = function(data) {
	alert(JSON.stringify(data));	
};

function setStorage(key,value)
{
	localStorage.setItem(key,value);
}

function getStorage(key)
{
	return localStorage.getItem(key);
}

function removeStorage(key)
{
	localStorage.removeItem(key);
}

function explode(sep,string)
{
	var res=string.split(sep);
	return res;
}

function urlencode(data)
{
	return encodeURIComponent(data);
}

function empty(data)
{
	if (typeof data === "undefined" || data==null || data=="" || data=="null" || data=="undefined" ) {	
		return true;
	}
	return false;
}

function isDebug()
{
	//on/off	
	var debug = krms_driver_config.debug;
	if(debug){
		return true;
	}
	return false;
}

function hasConnection()
{		
	return true;
}

$( document ).on( "keyup", ".numeric_only", function() {
  this.value = this.value.replace(/[^0-9\.]/g,'');
});	 

/*START DEVICE READY*/
document.addEventListener("deviceready", function() {
	
	try {
		
		navigator.splashscreen.hide();
		device_platform = device.platform;
		app_running_status="active";
				
	    document.addEventListener("offline", noNetConnection, false);
	    document.addEventListener("online", hasNetConnection, false);
	   
	    document.addEventListener("pause", onBackgroundMode, false);
        document.addEventListener("resume", onForegroundMode, false);
        
        initFirebasex();
	       	
	} catch(err) {
       //
    } 
			
	
 }, false);
/*END DEVICE READY*/

// set device
ons.platform.select('android');
//ons.platform.select('ios');

ons.ready(function() {
	
	removeStorage("map_icons");
	
	if (isDebug()){
		dump("ons.ready");
		setStorage("device_id","device_1233456789");
		device_platform = "Android";
	}
	
	ons.setDefaultDeviceBackButtonListener(function(event) {				
		exit_cout++;
		if(exit_cout<=1){		
			toastMsg("Press once again to exit!");	
			 setTimeout(function(){ 
			 	 exit_cout=0;
			 }, 3000);
		} else {
			if (navigator.app) {
			   navigator.app.exitApp();
			} else if (navigator.device) {
			   navigator.device.exitApp();
			} else {
			   window.close();
			}
		}
	});
	
}); /*end ready*/


function setBaloon()
{
	var push_count = getStorage("push_count");
	if(empty(push_count)){
		push_count=0;
	}
	push_count=parseInt(push_count)+1;
	dump('setbaloon=>'+push_count);
	if (!empty(push_count)){
		if (push_count>0){
			setStorage("push_count", push_count );	
		    $(".baloon-notification").html(push_count);
		    $(".baloon-notification").show();
		}
	}
}


function noNetConnection()
{
	toastMsg( getTrans("Internet connection lost","net_connection_lost") );
}


function hasNetConnection()
{	
	//
}

function refreshCon(action , params)
{
	if(empty(params)){
		params='';
	}
	dump(action);
	if (hasConnection()){
		callAjax(action,params)
	}
}

document.addEventListener("show", function(event) {	
	//dump( "page id show :" + event.target.id );	
	switch (event.target.id){		
		case "pageLogin":	
		if ( isAutoLogin()!=1){			
			checkGPS();
		}			
		break;				
		
		case "home":	
		    checkGPS();	
		break;	
		
		case "photoPage":			
		  callAjax('getTaskPhoto', 'task_id='+$(".task_id_global").val() );
		break;
		
		case "Signature":
		    callAjax('loadSignature', 'task_id='+$(".task_id_global").val() );
		break;
				
		default:
		break;
		
	}	
}, false);

document.addEventListener("init", function(event) {
		 dump( "page init :" + event.target.id );	
		 dump("init page");
		 
		 var page = event.target;
		 
		 switch (event.target.id) {		 
		 				
			case "Map":			  
			case "home":			  
			  TransLatePage();	  
			break;
					    			
			case "Notification":
			  callAjax('GetNotifications','');
			  
			   var pullHook = document.getElementById('pull-hook-notification');
			   pullHook.onAction = function(done) {						 	  
		              AjaxNotification("GetNotifications",'',done);
	             }; 
				 pullHook.addEventListener('changestate', function(event) {
				 	  var message = '';
				 	   dump(event.state);
				 	   switch (event.state) {
					      case 'initial':
					        message = '<ons-icon size="35px" icon="ion-arrow-down-a"></ons-icon> Pull down to refresh';
					        break;
					      case 'preaction':
					        message = '<ons-icon size="35px" icon="ion-arrow-up-a"></ons-icon> Release';
					        break;
					      case 'action':
					        message = '<ons-icon size="35px" spin="true" icon="ion-load-d"></ons-icon> Loading...';
					        break;
				      }
				      pullHook.innerHTML = message;
				});
			  
			break;
			
			case "Signature":
			case "profile":			
			TransLatePage();
			break;
			
			case "pageGetSettings":
			   callAjax("GetAppSettings",'');
			break;
			
			case "page-login":
			case "pageLogin":
			
			placeholder(".username_field", "Username", "username");
			placeholder(".password_field", "Password", "password");
			
			/*if ( isAutoLogin()==1){
				$("#frm-login").hide();
			    $(".login-header").hide();
			    $(".auto-login-wrap").show();
			} */
			TransLatePage();				
			break;
			
			case "pageforgotpass":			
			TransLatePage();
			break;
			
			case "SettingPage":			
			
			if (isDebug()){
		    	$(".software_version").html( "1.0" );
		    } else {
		    	$(".software_version").html( BuildInfo.version );
		    }
		    
		    device_id=getStorage('device_id');
   			if (!empty(device_id)){
   			  	$('.device_id').html( device_id );
   			}
			
			callAjax("GetSettings",'');
			TransLatePage();
			break;
			
			case "profilePage":			
			  TransLatePage();			  
			  callAjax("GetProfile",'' ,'silent');
			break;			
						
			
			case "CalendarView":
			  $params = getParamsArray();				  
			  dump($params);
			  calendar_height = $("body").height();
   	          calendar_height = parseInt(calendar_height)-100;   	    
			  var calendarEl = document.getElementById('calendar');						 		
			  var calendar = new FullCalendar.Calendar(calendarEl, {
			  	  height: calendar_height,
		          plugins: [ 'dayGrid' ],
		          events: {
		          	 url: ajax_url+"/CalendarTask/",
		          	 method: 'POST',
		          	 extraParams: $params,
		          	 color: '#2E3B49', 
		          	 failure: function() {
				         //toastMsg(  t('error_parsing','there was an error while fetching events!') );
				     },				     
		          },	
		         loading : function(isLoading ){
				    dump("isLoading=>"+isLoading );
				    if(isLoading){
				    	loader.show();	
				    } else {
				    	hideAllModal();	
				    }
				 }, 	          
			     eventClick: function(info) {
			     	$even_date = info.event.start;			     	
			     	$todays_event_date = moment($even_date).format('YYYY-MM-DD');			     				     	
			     	setStorage('kr_todays_date_raw', $todays_event_date );
			     	
			     	kNavigator.popPage().then(function() {
			     		document.querySelector('ons-tabbar').setActiveTab(0);
			     		getTodayTask('');
			     		
			     		setTimeout(function(){			     		   
                           callAjax("getTaskCompleted","date="+$todays_event_date +"&task_type=completed" ,"silent" );	
			     		}, 300);				     		
			     		
			     	});
			     },
		      });
		      calendar.render();
			break;
						
			
			case "pending_task_list":
			   
			     setDuty(1);
			     
			     $(".todays_date").html( getStorage("kr_todays_date") );			     
			     
			     getTodayTask( getStorage("kr_todays_date_raw") );
			
				 var pullHook = document.getElementById('pull-hook');
				 pullHook.onAction = function(done) {		
				 	  params="date="+ getStorage("kr_todays_date_raw");
				 	  var onduty = document.getElementById('onduty').checked==true?1:2 ;	
				 	  params+="&onduty="+onduty;
		              AjaxTask("GetTaskByDate",params,done);
	             }; 
				 pullHook.addEventListener('changestate', function(event) {
				 	  var message = '';
				 	   dump(event.state);
				 	   switch (event.state) {
					      case 'initial':
					        message = '<ons-icon size="35px" icon="ion-arrow-down-a"></ons-icon> Pull down to refresh';
					        break;
					      case 'preaction':
					        message = '<ons-icon size="35px" icon="ion-arrow-up-a"></ons-icon> Release';
					        break;
					      case 'action':
					        message = '<ons-icon size="35px" spin="true" icon="ion-load-d"></ons-icon> Loading...';
					        break;
				      }
				      pullHook.innerHTML = message;
				 });
			 			 
			 break;
			 			 				 
			 case "completed_task_list":	
			   setDuty(2);
			   $(".todays_date2").html( getStorage("kr_todays_date") );
			   			   
			   completedTask();
               
               if (!isDebug()){
		 	      window.plugins.insomnia.keepAwake();
		 	   }
		 	                 
               var pullHook = document.getElementById('pull-hook-completed');
				pullHook.onAction = function(done) {		
				  params="date="+ getStorage("kr_todays_date_raw");
				  var onduty = document.getElementById('onduty').checked==true?1:2 ;	
				  params+="&onduty="+onduty+"&task_type=completed";
				  
				  AjaxTask("getTaskCompleted",params,done);
				}; 
				pullHook.addEventListener('changestate', function(event) {
				  var message = '';
				   dump(event.state);
				   switch (event.state) {
					  case 'initial':
						message = '<ons-icon size="35px" icon="ion-arrow-down-a"></ons-icon> Pull down to refresh';
						break;
					  case 'preaction':
						message = '<ons-icon size="35px" icon="ion-arrow-up-a"></ons-icon> Release';
						break;
					  case 'action':
						message = '<ons-icon size="35px" spin="true" icon="ion-load-d"></ons-icon> Loading...';
						break;
				  }
				  pullHook.innerHTML = message;
				});	
								
				setTimeout(function(){				   
				   $handle_cron[1] =  setInterval(function(){runCron('foreGroundLocation')}, $cron_interval );		
				   $handle_cron[2] =  setInterval(function(){runCron('getNewTask')}, $cron_interval );
			     }, 100);	 
               
				setTimeout(function(){
		 	      initBackgroundTracking();
		 	    }, 100);	  
		 	    
			 break;
			 
			 case "page_map":	
			    TransLatePage();
			    initMap(page.data.lat, page.data.lng, page.data.address );
			 break;
			 
			 case "map_dropoff":
			    TransLatePage();
			    map_provider = getMapProvider();
			    switch (map_provider){
			     	case "mapbox":
			     	  mapbox_initDropOffMap();
			     	break;
			     	
			     	default:
			     	  init_MapDropOff();
			     	break;
			    }		    
			 break;
			 
			case "taskDetails":
			  $(".toolbar-title").html( getTrans("Getting info...",'getting_info')  );
			  task_id =  page.data.task_id ;
			  callAjax("TaskDetails",'task_id=' + task_id);
			break;
			
			case "Notes":
			  TransLatePage();
			  
			  task_id =  page.data.task_id ;
			  $(".task_id").val(task_id);	  
			  
			  status_raw = page.data.status_raw;
			  if ( status_raw=="cancelled" || status_raw=="successful" || status_raw=="failed"){	  	  	  
		  	  	  $(".add_notes_wrapper").hide();	  	
		  	  	  $(".toolbar-title-notes").html( getTrans("View Notes",'view_notes') );  	  
		  	  }	  	
		  	  
		  	  callAjax("loadNotes","task_id="+task_id);
		  	  	 
			break;
			 
		
			case "viewTaskDescription":	
			  $(".toolbar-title").html( getTrans("Getting info...",'getting_info')  );			  
			  task_id =  page.data.task_id ;
			  callAjax("viewTaskDescription",'task_id=' + task_id);
			break;
			 	 
	 } /*end switch*/
	 
	 /*end page init*/
	 		 
}, false);


document.addEventListener('postpop', function(event) {
	
	dump("postpop");
	current_page = document.querySelector('ons-navigator').topPage.id
	dump("=>"+ current_page);	
	
	switch(current_page)
	{
		case "home":
		  dump("reload_home=>"+ reload_home);
		  if(reload_home==1){
		  	  reload_home = 0;
		  	  getTodayTask('');
		  }
		  if(reload_completed==1){
		  	  reload_completed = 0;
		  	  completedTask();
		  }
		break;
	}
	
});

function autoLogin()
{
	dump('autoLogin');
	var kr_remember = getStorage("kr_remember");	
	if ( kr_remember=="on"){
		var kr_username=getStorage("kr_username");
		var kr_password=getStorage("kr_password");
		var kr_remember=getStorage("kr_remember");
		if (!empty(kr_username) && !empty(kr_password)){
			dump('auto login');
			$("#frm-login").hide();
			$(".login-header").hide();
			$(".auto-login-wrap").show();
			var params="username="+kr_username+"&password="+kr_password+"&remember="+kr_remember;
			
			params+="&device_id="+ getStorage("device_id");
	        params+="&device_platform="+ device_platform;
			
			dump(params);
			callAjax("login",params);
		}
	}
}

function exitKApp()
{
	ons.notification.confirm({
	  message: getTrans("Are you sure to close the app?","close_app") ,	  
	  title: dialog_title_default ,
	  buttonLabels: [ "Yes" ,  "No" ],
	  animation: 'default', // or 'none'
	  primaryButtonIndex: 1,
	  cancelable: true,
	  callback: function(index) {	  	   
	  	   if (index==0){	  	   	      	   	  
				if (navigator.app) {
				   navigator.app.exitApp();
				} else if (navigator.device) {
				   navigator.device.exitApp();
				} else {
				   window.close();
				}
	  	   }
	  }
	});
}

function showPage(page_id, action )
{	
	if (action==1){
	   popover.hide();
	}
	var options = {
	  animation: 'slide',
	  onTransitionEnd: function(){		  
	  } 
	};  
	kNavigator.pushPage(page_id, options);		
}

var getTimeNow = function(){
	var d = new Date();
    var n = d.getTime();    
    n = parseInt(n) + parseInt(d.getMilliseconds());    
    return n;
};	

showToast = function(data, modifier) {

  if (empty(data)){
  	  data=' ';
  }	  
  if (empty(modifier)){
  	  modifier=' ';
  }	  
  is_animation = '';
  
  if(modifier=="danger"){
  	is_animation='fall';
  }
    
  toast_handler  = ons.notification.toast(data, {
     timeout: 2500, //
     animation: is_animation ,
     modifier: modifier+ ' thick',
  });
   
};

setLoader = function($loader_type){
	switch($loader_type)
	{
		case "silent":
		  //
		break;
		
		default:
		  loader.show();
		break;
	}
};

/*mycall*/
function callAjax(action, params , loader_type)
{
	try {
		
		$loader_type = '';
		if ((typeof loader_type !== "undefined") && ( loader_type !== null)) {
			$loader_type = loader_type;
		}
				
		timenow = getTimeNow();		
		params+=getParams();
		
		ajax_request[timenow] = $.ajax({
		  url: ajax_url+"/"+action,
		  method: "post" ,
		  data: params ,
		  dataType: "json",
		  timeout: ajax_timeout,
		  crossDomain: true,
		  beforeSend: function( xhr ) {
		  	
		  	  clearTimeout( timer[timenow] ); 
		  	
	         if(ajax_request[timenow] != null) {			 				   
			   hideAllModal();	
	           ajax_request[timenow].abort();
			 } else {    			
			 				 				 				
				setLoader($loader_type);
	
				timer[timenow] = setTimeout(function() {		
	         		if( ajax_request[timenow] != null) {		
					   ajax_request[timenow].abort();
					   hideAllModal();	
	         		}         		         		
		        }, ajax_timeout ); 
						
			 }
	      }
	    });
	    
	    ajax_request[timenow].done(function( data ) {
	    	dump(data);
	    	if (data.code==1){
	    		
	    		switch(action)
		   		{
		   			case "login":		
		   			dump('LOGIN OK');  
		   					   			
		   			setStorage("kr_username", data.details.username);
		   			setStorage("kr_password", data.details.password);
		   			setStorage("kr_remember", data.details.remember);
		   			setStorage("kr_todays_date", data.details.todays_date);
		   			setStorage("kr_todays_date_raw", data.details.todays_date_raw);
		   			setStorage("kr_token", data.details.token);
		   			
		   			setStorage("kr_location_accuracy", data.details.location_accuracy);
		   			setStorage("device_vibration", data.details.device_vibration);		   			
		   			
		   			setStorage("app_disabled_bg_tracking", data.details.app_disabled_bg_tracking);
		   			setStorage("app_track_interval", data.details.app_track_interval);		   			
		   			
		   			setStorage("kr_on_duty", data.details.on_duty);
		   			
		   			
                    setStorage("topic_new_task", data.details.topic_new_task);
		   			setStorage("topic_alert", data.details.topic_alert);
                          
		   			initSubscribe(data.details.enabled_push);
		   			
		   					   	
					kNavigator.resetToPage("home.html", {
					  animation: 'slide',					  
					});
		   			break;
		   			
		   			case "ChangeDutyStatus":
		   			  if ( data.details==1){
		   			     $(".duty_status").html( getTrans("On-Duty",'on_duty') );
		   			     $(".duty_status2").html( getTrans("On-Duty",'on_duty') );
		   			     setStorage("kr_on_duty",1);
		   			  } else {
		   			  	 $(".duty_status").html( getTrans("Off-duty",'off_duty')  );
		   			  	 $(".duty_status2").html( getTrans("Off-duty",'off_duty')  );
		   			  	 setStorage("kr_on_duty",2);
		   			  }
		   			break;
		   			
		   			case "getTaskByDate":
		   			$(".no-task-wrap").hide();
		   			$("#task-wrapper").show();
		   			dump( 'fill task' );
		   			$("#task-wrapper").html( formatTask( data.details ) );   			
		   			break;
		   			
		   			case "TaskDetails":
		   			$(".toolbar-title").html ( data.msg ) ;
		   			$("#task-details").html( 
		   			   formatTaskDetails(data.details) + 
		   			   TaskDetailsChevron_1(data.details)  +  // delivery address
		   			   DroffDetails( data.details ) +       // dropoff details
		   			   TaskDetailsChevron_2(data.details) +  // task description
		   			   //OrderDetails(data.details) +		   			   
		   			   TaskAddSignature( data.details ) +   // task signatore
		   			   DriverNotes( data.history_notes , data.details ) +	// driver notes	   			   
		   			   addPhotoChevron(data.details) +  // take picture
		   			   TaskDetailsChevron_3(data.details.history) + 
		   			   '<div style="height:100px;"></div>'
		   			);
		   			
		   			//show signature
		   			
		   			$("#task-action-wrap").html( 
		   			  swicthButtonAction( data.details.task_id, data.details.status_raw )
		   			);
		   			
		   			$(".task_id_global").val( data.details.task_id );
		   			
		   			/*picture resize settings*/		   			
		   			setStorage("app_resize_picture" , data.details.resize_picture.app_enabled_resize_pic );
		   			setStorage("app_resize_width" , data.details.resize_picture.app_resize_width );
		   			setStorage("app_resize_height" , data.details.resize_picture.app_resize_height );		   		
		   			setStorage("map_icons" , data.details.map_icons );
		   			
		   			setStorage("map_icons", JSON.stringify(data.details.map_icons) );
		   			
		   			break;
		   			
		   			case "viewTaskDescription":
		   			$(".toolbar-title").html ( data.msg ) ;
		   			$("#task-description").html( taskDescription(data.details) );
		   			break;
		   			
		   			
		   			case "changeTaskStatus":
		   			
		   			  reload_home=1;
		   			  if ( data.details.reload_functions =="TaskDetails"){
		   			  	   callAjax("TaskDetails",'task_id=' + data.details.task_id );
		   			  }
		   			  
		   			  if ( data.details.reload_functions=="getTodayTask"){
		   			  	   reload_completed = 1;
		   			  	   kNavigator.popPage().then(function() {
							    //
						   });
		   			  }
		   			  
		   			  $("#task-action-wrap").html( 
		   			     swicthButtonAction( data.details.task_id, data.details.status_raw )
		   			  );
		   			  
		   			break;
		   			
		   			case "AddSignatureToTask":
		   			    kNavigator.popPage().then(function() {							
		   			    	callAjax("TaskDetails",'task_id=' + data.details );
				        });
		   			break;
		   			
		   			
		   			case "GetProfile":
		   			$(".driver-fullname").html( data.details.full_name );
		   			$(".team-name").html( data.details.team_name );
		   			$(".driver-email").html( data.details.email );
		   			$(".phone").val( data.details.phone );
		   			
		   			setTimeout(function(){ 
	  	 		 		  	 		    
			   			$(".transport_type_id2").html( data.details.transport_type_id2 );
			   			$(".transport_description").val( data.details.transport_description );
			   			$(".licence_plate").val( data.details.licence_plate );
			   			$(".color").val( data.details.color );
			   			
			   			$(".transport_type_id").val( data.details.transport_type_id );
			   			switchTransportFields( data.details.transport_type_id );
			   			
			   			if ( !empty(data.details.profile_photo)){
			   				$(".profile-bg").css('background-image', 'url(' + data.details.profile_photo + ')');
			   				$(".profile-bg").css("background-size","cover");
			   				$(".avatar").attr("src", data.details.profile_photo );
			   				imageLoaded('.img_loader');
			   			} else {
			   				imageLoaded('.img_loader');
			   			}
			   			
			   			fillTransportList(data.details.transport_list, data.details.transport_type_id );
		   			
		   			}, 1000);
		   			
		   			break;
		   			
		   			
		   			case "GetTransport":
		   			  var html='';
		   			  x=1;	   			 
		   			  $.each( data.details, function( key, val ) { 		   			  	  
		   			  	  html+=OptionListTransport('transport_type', key, val , x);
		   			  	  x++;
		   			  });
		   			  $("#transport-list").html(  html );
		   			break;
		   			
		   			case "ProfileChangePassword":		   			  
		   			  setStorage("kr_password", data.details);
		   			  showToast( data.msg , 'success');   
		   			break;
		   			
		   			//silent		   			
		   			case "DeviceConnected":		   			
		   			break;
		   			
		   			case "SettingPush":		   			  
		   			  initSubscribe( data.details.enabled_push );
		   			break;
		   			
		   			case "GetSettings":
		   			  
		   			  if ( data.details.enabled_push==1){
		   			      enabled_push.checked=true;
		   			  } else {
		   			  	  enabled_push.checked=false;
		   			  }
		   			  
		   			  kr_lang_id=getStorage("kr_lang_id");
		   			  if(!empty(kr_lang_id)){
		   			  	  $(".language_selected").html( data.details.language[kr_lang_id] );
		   			  }
		   			  
		   			break;
		   			
		   			case "LanguageList":
		   			 $("#language-list").html('');
		   			 var html='';
		   			  x=1;	   			 
		   			  $.each( data.details, function( key, val ) { 		   			  	  
		   			  	   html+=OptionListLanguage('lang_id', val, val , x);
		   			  	  x++;
		   			  });
		   			  $("#language-list").html(  html );
		   			break;
		   			
		   			case "GetAppSettings":
		   					   			   
		   			   setStorage("kr_translation",JSON.stringify(data.details.translation));		   			   
		   			   //set sounds url
		   			   setStorage("notification_sound_url",data.details.notification_sound_url);
		   			   
		   			   setStorage("map_provider",data.details.map_provider);
		   			   setStorage("mapbox_token",data.details.mapbox_access_token);
		   			   
		   			   // set the language id		   			   
		   			   dump( "current languae id : " + getStorage("kr_lang_id") );
		   			   if ( empty( getStorage("kr_lang_id") )){
		   			   	  setStorage("kr_lang_id","en");
		   			   	  if ( !empty(data.details.app_default_lang) ){
		   			   	  	  setStorage("kr_lang_id", data.details.app_default_lang );
		   			   	  }
		   			   } else {
		   			   	  if ( data.details.app_force_lang==1){
		   			   	  	  setStorage("kr_lang_id", data.details.app_default_lang );
		   			   	  }
		   			   }		   			   
		   			   
		   			   dump( "FINAL languae id : " + getStorage("kr_lang_id") );
		   			   
		   			   $valid_token = false;
		   			   if ((typeof data.details.valid_token !== "undefined") && ( data.details.valid_token !== null)) {	
		   			   	   $valid_token = data.details.valid_token;
		   			   }

		   			   if($valid_token){
		   			   	  setStorage("kr_todays_date", data.details.todays_date);
                          setStorage("kr_todays_date_raw", data.details.todays_date_raw);
                          setStorage("kr_token", data.details.token);
                          setStorage("kr_location_accuracy", data.details.location_accuracy);
                          setStorage("device_vibration", data.details.device_vibration);		   			
                          setStorage("app_disabled_bg_tracking", data.details.app_disabled_bg_tracking);
                          setStorage("app_track_interval", data.details.app_track_interval);
                          setStorage("kr_on_duty", data.details.on_duty);
                          
                          setStorage("topic_new_task", data.details.topic_new_task);
		   			      setStorage("topic_alert", data.details.topic_alert);
                          
		   			      initSubscribe(data.details.enabled_push);
                          
                          kNavigator.resetToPage("home.html", {
						    animation: 'slide',					  
						  }); 
						                         
		   			   } else {		   			   
		   			       kNavigator.resetToPage("pagelogin.html", {
							  animation: 'fade',
							  callback: function(){						  	  
							  } 
						   });
		   			   }
	                   
		   			break;
		   			
		   			case "ViewOrderDetails":
		   			$("#order-details").html( formatOrderDetails( data.details , data.msg ) );
		   			break;
		   			
		   			case "GetNotifications":		   			
		   			$("#notifications-details").html( formatNotifications( data.details ) );
		   			clearPushCount();
		   			TransLatePage();		   			
		   			break;
		   			
		   			
		   			case "clearNofications":
		   			$("#notifications-details").html('');	
		   			clearPushCount();
		   			break;
		   			
		   			case "Logout":
		   			removeStorage('kr_token');
		   			break;
		   			
		   			case "addNotes":		   			
		   			case "deleteNotes":		   			
		   			  $(".notes_fields").val('');
		   			  callAjax("loadNotes","task_id="+ data.details.task_id );		 
		   			break;
		   			
		   			case "updateNotes":
		   			  //toastMsg( data.msg );
		   			  var dialog_notes = document.getElementById('editNotes');
		   			  dialog_notes.hide();		   			  
		   			  callAjax("loadNotes","task_id="+ data.details.task_id );		 
		   			break;
		   			
		   			case "loadNotes":
		   			  fillNotes(data);
		   			break;
		   			
		   			case "getTaskPhoto":
		   			  gridPhoto(data , data.msg);
		   			break;
		   			
		   			case "loadSignature":
		   			  if (data.details.status=="successful"){
		   			  	 $(".toolbar-title-signature").html( getTrans("View Signature",'view_signature') );
	  	 	             $(".signature-action").hide();
	  	 	             if (!empty(data.details.data)){
	  	 	             	
	  	 	             	 signature_html='<div class="img_loaded" >';
				  	 	     signature_html += '<img src="'+data.details.data.customer_signature_url+'" />';
				  	 	     signature_html+='</div>';
				  	 	   
				  	 	     $("#signature-pan").html ( signature_html )  ;
				  	 	   
				  	 	     imageLoaded('.img_loaded');
				  	 	     
				  	 	     $(".receive_by").hide();
	  	 	             }
		   			  } else {
		   			  	 $(".toolbar-title-signature").html( getTrans("Add Signature",'add_signature') );
	  	 	             $(".signature-action").show();	
	  	 	             $(".receive_by").show();  	 	               
	  	 	             $sigdiv = $("#signature-pan") ;
	  	 	             $sigdiv.jSignature();
		   			     $(".receive_by").val( data.details.data.receive_by );
		   			     if (!empty(data.details.data)){
		   			     	 $(".signature_id").val( data.details.data.id );
		   			     	 dump(data.details.data.signature_base30);		   			     	 
	  	 	                 $sigdiv.jSignature("setData", "data:"+data.details.data.signature_base30 ) ;	  	 	                 
		   			     }
		   			  }
		   			break;
		   			
		   			case "deletePhoto":
		   			  callAjax('getTaskPhoto', 'task_id='+$(".task_id_global").val() );
		   			break;
		   			
		   			case "getTaskCompleted":
		   			  $("#task_completed").html( formatTask( data.details ) ); 			   			 
		   			break;
		   			
		   			case "ChangePassword":
		   			  document.getElementById('dialogChangePass').hide();
		   			  showToast( data.msg ,'success');  
		   			break;
		   			
		   			default:		   			 
		   			 showToast( data.msg ,'success');
		   			break;
		   		}
	    		
	    	} else {
	    		// FAILED CONDITION
	    		
	    		switch (action)
		   		{
		   			
		   			case "getTaskCompleted":		   			   
		   			   $("#task_completed").html(''); 		
		   			break;
		   			
		   			case "getTaskByDate":		   			  
		   			  $(".no-task-wrap").show();
		   			  $(".no-task-wrap p").html( data.msg );
		   			  $("#task-wrapper").html('');		   			  
		   			  showToast( data.msg ,'danger' );
		   			break;
		   			
		   			//silent		   			
		   			case "SettingPush":
		   			case "GetAppSettings":
		   			case "DeviceConnected":
		   			case "Logout":
		   			break;
		   					   			
		   			case "GetNotifications":
		   			clearPushCount();
		   			showToast( data.msg , 'danger' );
		   			TransLatePage();
		   			break;
		   			
		   			case "changeTaskStatus":		   			
		   			  reload_home=1;
		   			  toastMsg( data.msg );		   			  
		   			break;
		   			
		   			case "loadNotes":
		   			$("#list-notes").html('');
		   			break;
		   			
		   			case "getTaskPhoto":
		   			  $("#list-photos").html('');
		   			break;
		   				
		   			case "loadSignature":
		   			 $(".toolbar-title-signature").html( getTrans("Add Signature",'add_signature') );
	  	 	         $(".signature-action").show();
	  	 	         $("#signature-pan").jSignature();	
		   			break;
		   				
		   			default:		   			
		   			 showToast( data.msg , 'danger' );
		   			break;
		   		}
	    		
	    	} /*END CODE = 1*/
	    });
	    /*AJAX DONE*/
	    
	    /*ALWAYS*/
	    ajax_request[timenow].always(function() {
	        dump("ajax always");
	        hideAllModal();	
	        clearTimeout( timer[timenow] );
	        ajax_request[timenow]=null;          
	    });
	          
	    /*FAIL*/
	    ajax_request[timenow].fail(function( jqXHR, textStatus ) {   
	    	clearTimeout( timer[timenow] ); 	
	    	$text = !empty(jqXHR.responseText)?jqXHR.responseText:'';
	    	if(textStatus!="abort"){
	    	   showToast( textStatus + "\n" + $text );             
	    	}
	    });     	    
		
	} catch(err) {
       showToast(err.message);
    } 
}

function AjaxTask(action, params , done)
{	
	try {
	dump('AjaxTask =>' + action);	
	params+=getParams();			
	
    ajax_task = $.ajax({
	  url: ajax_url+"/"+action,
	  method: "post" ,
	  data: params ,
	  dataType: "json",
	  timeout: ajax_timeout,
	  crossDomain: true,
	  beforeSend: function( xhr ) {
	  	
	  	 clearTimeout( timer[100] ); 
	  	
         if(ajax_task != null) {			 				   		   
           ajax_task.abort();
		 } else {   		 			
		 	timer[100] = setTimeout(function() {		
         		if( ajax_task != null) {		
				   ajax_task.abort();				   
         		}         		         		
	        }, ajax_timeout ); 		 	
		 }
      }
    });
	
    ajax_task.done(function( data ) {
    	if(!empty(done)){
    	   done();
    	}
    	
    	$target = action=="GetTaskByDate"?"task-wrapper":"task_completed";
    	dump("target=>"+$target);
    	
    	if ( data.code==1){	    	
    		if(!empty(data.details.data)){
   			   $("#"+ $target).html( formatTask( data.details.data ) );  	   			   
   			} else {
   			   $("#"+ $target).html( formatTask( data.details ) );  
   			}		    			
		} else {				   			
			$("#"+ $target).html(''); 
			showToast( data.msg ,'danger');			
		}
    });
	
	ajax_task.always(function() {        
        ajax_task = null;  
        if ((typeof  done !== "undefined") && ( done !== null)) {
            done();
        }
    });	   
    
    ajax_task.fail(function( jqXHR, textStatus ) {    	    	
    	$text = !empty(jqXHR.responseText)?jqXHR.responseText:'';
		if(textStatus!="abort"){
		   showToast( textStatus + "\n" + $text );             
		}    	
    });     
	
    } catch(err) {
      showToast(err.message);
    } 	
}

function onsenAlert(message,dialog_title)
{
	if (typeof dialog_title === "undefined" || dialog_title==null || dialog_title=="" ) { 
		dialog_title=dialog_title_default;
	}
	ons.notification.alert({
      message: message,
      title:dialog_title
    });
}

function toastMsg( message )
{	
	showToast(message);
}

function hideAllModal()
{	
	setTimeout('loader.hide()', 1);
}

function login() {	
	var params = $( ".frm").serialize();
	params+="&device_id="+ getStorage("device_id");
	params+="&device_platform="+ device_platform;
	dump(params);	
	callAjax("login",params);
}

function forgotPass()
{
	dump('forgotPass');
	var params = $( "#frm-forgotpass").serialize();
	dump(params);
	callAjax("ForgotPassword",params);
}

var xx=0;
var lastUpdateTime,
minFrequency = 8000;

function getCurrentPosition()
{	 
	 watchID = navigator.geolocation.watchPosition( function(position) {
	 //navigator.geolocation.getCurrentPosition( function(position) {	 
	 
	     var now = new Date();
	     
	     dump( position.coords.latitude);	 
	     dump(  position.coords.longitude );	   
	     
	     var now = new Date();

	     //toastMsg(app_running_status);	     
	     if(!empty(app_running_status)){
		     if (app_running_status=="background"){
		     	 return;
		     }
	     }
	     	     	    
	     app_track_interval = getStorage("app_track_interval");
	     if (!empty(app_track_interval)){
	     	 minFrequency=app_track_interval;
	     }	     	     	     	     
	     
	     if(!empty(lastUpdateTime)){	     	 
	     	 var freq_time = now.getTime() - lastUpdateTime.getTime();	 
	     	 if ( freq_time <  minFrequency ) {
	     	 	 dump("Ignoring position update");
	     	 	 return ;
	     	 }
	     }
	     lastUpdateTime = now;	 	     	     
	     //$(".watch-id").html( xx++ );	     
	     
	     params = 'lat='+ position.coords.latitude + "&lng=" + position.coords.longitude;
	     params+="&app_version="+ app_version;
	     
	     params+="&altitude="+ position.coords.altitude;
	     params+="&accuracy="+ position.coords.accuracy;
	     params+="&altitudeAccuracy="+ position.coords.altitudeAccuracy;
	     params+="&heading="+ position.coords.heading;
	     params+="&speed="+ position.coords.speed;
	     params+="&track_type=active";
	     
	     
	     callAjax2('updateDriverLocation', params);
	     
	 },function(error) {
	 	 dump('error position');
	 	 navigator.geolocation.clearWatch(watchID);
	 },
	   { timeout: 10000, enableHighAccuracy : getLocationAccuracy() } 
	 );	 	 
}

var showChangePassword = function() {
  var dialog = document.getElementById('dialogChangePass');
  if (dialog) {
      dialog.show();
  } else {
    ons.createDialog('changePassword.html')
      .then(function(dialog) {
        dialog.show();       
        setTimeout('TransLatePage()', 300);	
    });
  }
};

function changePassword()
{
	var params = $( "#frm-changepass").serialize();
	callAjax("ChangePassword",params);
}

var onduty_handle=0;

function changeDuty(div)
{		
	onduty_handle++;
	dump(onduty_handle);
	
	var onduty = document.getElementById(div).checked==true?1:2 ;	
	
	params="onduty="+onduty;
	//if ( onduty_handle==2){
	   callAjax("ChangeDutyStatus",params);
	   onduty_handle=0;
	//}
	if ( onduty==2){		
		navigator.geolocation.clearWatch(watchID);
	} else {
		checkGPS();
	}
}

var showMenu = function(element) {   
   popover.show(element);
};

function getTodayTask(raw_date)
{
   if (empty(raw_date)){
   	   raw_date=getStorage('kr_todays_date_raw');
   }
   callAjax("getTaskByDate","date="+raw_date);
}

function showTask(task_id)
{
   dump(task_id);	
   reload_home=2;   
   kNavigator.pushPage("taskDetails.html", {
	  animation: 'slide',
	  data : {
	  	 'task_id' : task_id
	  }	  
   });
}

function viewTaskDescription(task_id)
{	
	kNavigator.pushPage("viewTaskDescription.html", {
	  animation: 'none',
	  data : {
	  	 'task_id' : task_id
	  }	  
   });
}

function swicthButtonAction( task_id, status_raw )
{
	dump(status_raw);
	var html=''; var action='';
	dump("swicthButtonAction " + status_raw);
	switch (status_raw)
	{
		case "assigned":
		case "unassigned":
		action='acknowledged';
		html+='<p><ons-button modifier="large yellow-button"';
		html+='onclick="changeTaskStatus('+task_id+','+ "'"+action+"'" +' )" > '+ getTrans("Accept",'accept') +' </ons-button></p>';
		
		action='declined';
		html+='<p><ons-button modifier="quiet"';
		html+='onclick="declinedTask('+task_id+','+ "'"+action+"'" +' )" >'+ getTrans("Decline",'decline') +'</ons-button></p>';
		break;
		
		case "acknowledged":
		action='started';
		html+='<p><ons-button modifier="large yellow-button"';
		html+='onclick="changeTaskStatus('+task_id+','+ "'"+action+"'" +' )" >'+ getTrans('Start','start') +'</ons-button></p>';
		
		action='cancelled';
		html+='<p><ons-button modifier="quiet"';
		html+='onclick="ShowAddReason('+task_id+','+ "'"+action+"'" +' )" >'+ getTrans('Cancel','cancel') +'</ons-button></p>';
		break;
		
		case "started":
		action='inprogress';
		html+='<p><ons-button modifier="large yellow-button"';
		html+='onclick="changeTaskStatus('+task_id+','+ "'"+action+"'" +' )" >'+getTrans('Arrived','arrived')+'</ons-button></p>';
		
		action='cancelled';
		html+='<p><ons-button modifier="quiet"';
		html+='onclick="ShowAddReason('+task_id+','+ "'"+action+"'" +' )" >'+getTrans('Cancel','cancel')+'</ons-button></p>';
		break;
		
		case "inprogress":
		action='successful';
		html+='<p><ons-button modifier="large yellow-button"';
		html+='onclick="changeTaskStatus('+task_id+','+ "'"+action+"'" +' )" >'+getTrans('Successful','successful')+'</ons-button></p>';
		
		action='failed';
		html+='<p><ons-button modifier="quiet"';
		html+='onclick="ShowAddReason('+task_id+','+ "'"+action+"'" +' )" >'+getTrans('Failed','failed')+'</ons-button></p>';
		break;
		
		case "successful":
		break;
		
		case "failed":
		break;
		
		case "declined":
		break;
		
		case "cancelled":
		break;
		
		default:
		break;
	}
	return html ;	
}

function changeTaskStatus(task_id, status_raw )
{
	dump(task_id );
	dump(status_raw);		
	callAjax("changeTaskStatus",'task_id=' + task_id +"&status_raw="+status_raw ) ;
}

function reloadHome()
{
	dump('reloadHome');
	dump(reload_home);
	if ( reload_home==1){
	   getTodayTask('');	  
	}
}

function ShowAddReason(task_id , status_raw)
{
	dump(task_id);
	dump(status_raw);
	
	var dialog = document.getElementById('reasonTask');
	if (dialog) {
	      dialog.show();	      
	      $("#reason_task_id").val( task_id );
	      $("#reason_status_raw").val( status_raw );
	} else {
	    ons.createDialog('reasonTask.html')
	      .then(function(dialog) {
	        dialog.show();	        
	        $("#reason_task_id").val( task_id );
	        $("#reason_status_raw").val( status_raw );
	        setTimeout('TransLatePage()', 300);	
	    });
	}	
}

function declinedTask( task_id , status_raw )
{
	dump(task_id);
	dump(status_raw);
	ons.notification.confirm({
		title:dialog_title_default,
		message:"Are you sure?",
		buttonLabels: ['No', 'Yes'],
	})
	.then(
      function(answer) {
        if (answer === 1) {
           dump('ok');
           callAjax("changeTaskStatus",'task_id=' + task_id +"&status_raw="+status_raw ) ;
        }
      }
    );
}

function AddReasonTask()
{	
	if ( $("#reason").val()==""){
		onsenAlert("Reason is required");
		return;
	}
	var task_id=$("#reason_task_id").val();
	var status_raw=$("#reason_status_raw").val();
	reasonTask.hide();
	callAjax("changeTaskStatus",'task_id=' + task_id +"&status_raw="+status_raw + "&reason="+ $("#reason").val() ) ;
}

function ShowSignaturePage( task_id , signature , status )
{	
	kNavigator.pushPage("Signature.html", {
	  animation: 'none',
	  callback: function(){		 		
	  	$(".task_id_signature").val(  task_id );
	  	/* 
	  	 if ( status=="successful"){
	  	 	$(".toolbar-title-signature").html( getTrans("View Signature",'view_signature') );
	  	 	$(".signature-action").hide();
	  	 	if ( !empty(signature)){	  	 	
	  	 		
	  	 	   signature_html='<div class="img_loaded" >';
	  	 	   signature_html += '<img src="'+signature+'" />';
	  	 	   signature_html+='</div>';
	  	 	   
	  	 	   $("#signature-pan").html ( signature_html )  ;
	  	 	   
	  	 	   imageLoaded('.img_loaded');	  	 	
	  	 	}
	  	 } else {	  	 	  	 	
	  	 	$(".toolbar-title-signature").html( getTrans("Add Signature",'add_signature') );
	  	 	$(".signature-action").show();
	  	 	$("#signature-pan").jSignature();	  	
	  	 }	  	 	  	*/ 
	  } 
   });
}

function resetSignature()
{
	dump('resetSignature');
	$("#signature-pan").jSignature("reset");	  	
}

function AddSignatureToTask()
{
	//var datapair = $("#signature-pan").jSignature("getData", "svgbase64");
	var datapair = $("#signature-pan").jSignature("getData","base30");	
	callAjax("AddSignatureToTask","image="+datapair +"&task_id=" + $(".task_id_signature").val() + "&receive_by="+ $(".receive_by").val()  + "&signature_id="+ $(".signature_id").val() );
}

function imageLoaded(div_id)
{	
	$(div_id).imagesLoaded()
	  .always( function( instance ) {
	    console.log('all images loaded');
	  })
	  .done( function( instance ) {
	    console.log('all images successfully loaded');
	  })
	  .fail( function() {
	    console.log('all images loaded, at least one is broken');
	  })
	  .progress( function( instance, image ) {
	    var result = image.isLoaded ? 'loaded' : 'broken';	    	   
	    image.img.parentNode.className = image.isLoaded ? '' : 'is-broken';
	    console.log( 'image is ' + result + ' for ' + image.img.src );	    
	});
}

function showCalendarView()
{
	kNavigator.pushPage("CalendarView.html", {
	  animation: 'slide',
	  callback: function(){		 					  	  
	  	  dump('CalendarView');		  
	  } 
   });
}

function showTransportType()
{
   var dialog = document.getElementById('transporType');
   if (dialog) {
      dialog.show();
   } else {
      ons.createDialog('transporType.html')
      .then(function(dialog) {
      	callAjax("GetTransport",'');
        dialog.show();
      });
   }   
}

function setTransportType(key , val)
{	
	transporType.hide();
	$(".transport_type_id2").html( val );
	$(".transport_type_id").val( key );
	switchTransportFields( key );
}

function switchTransportFields( transport_type )
{
	if ( transport_type=="walk" ){
		$(".with-car").hide();
	} else {
		$(".with-car").show();
	}
}

function UpdateForms(form_id , action )
{
	var params = $( "#"+form_id).serialize();	
	callAjax(action,params);
}

var switch_handle=0;

function UpdatePush()
{
	switch_handle++;
	dump('UpdatePush');
	var enabled_push = document.getElementById('enabled_push').checked==true?1:2 ;	
	params="enabled_push="+enabled_push;
	callAjax("SettingPush",params);
	switch_handle=0;
}


function ShowLanguageOption()
{
   var dialog = document.getElementById('LanguageList');
   if (dialog) {
   	  callAjax("LanguageList",'');
      dialog.show();
   } else {
      ons.createDialog('LanguageList.html')
      .then(function(dialog) {
      	callAjax("LanguageList",'');
        dialog.show();
      });
   }   
}

function SetLanguage(lang_id , language)
{
	dump(lang_id);
	dump(language);
	$(".language_selected").html( language );
	setStorage("kr_lang_id",lang_id);
	LanguageList.hide();
	TransLatePage();
}

function Logout()
{	
	popover.hide();	
	
	ons.notification.confirm( getTrans("Are you sure you want to logout?","logout_confirm") ,{
		title: dialog_title_default,
		buttonLabels : [ getTrans("No","no") , getTrans("Yes","yes") ]
	}).then(function(input) {		
		if (input==1){
			
			removeStorage('kr_username');
			removeStorage('kr_password');
			removeStorage('kr_remember');	
										  			    
			kNavigator.resetToPage("pagelogin.html", {
	    	 animation: 'none',
	    	 callback: function(){    	 	
	    	 	navigator.geolocation.clearWatch(watchID);
	    	 	clearInterval($handle_cron[1]);
	            clearInterval($handle_cron[2]);
	    	    callAjax("Logout",'');
	    	 }
			});
		}
	});
}

function TransLatePage()
{
	var dictionary;
	dump('TransLating page');
	if (typeof getStorage("kr_translation") === "undefined" || getStorage("kr_translation")==null || getStorage("kr_translation")=="" ) { 	   
		return;		
	} else {
		dictionary =  JSON.parse( getStorage("kr_translation") );
	}	
	if (!empty(dictionary)){
		//dump(dictionary);
		var kr_lang_id=getStorage("kr_lang_id");		
		if (!empty(kr_lang_id)){
			//dump(kr_lang_id);
			translator = $('body').translate({lang: kr_lang_id, t: dictionary});
			translateForms();
			translateTabs();
		}
	}
}

function translateForms()
{
	var t='';
	$.each( $(".field-wrap") , function() { 				
		var temp_value=$(this).find("input.text-input").attr("placeholder");		
		if(!empty(temp_value)){
			key = $(this).find("ons-input").data("trn-key");			
		    t = getTrans(temp_value, key );		    
		    $(this).find("input.text-input").attr("placeholder",t);
		    $(this).find("._helper").html(t);		    
		}
	});	
}

function translateTabs()
{
	dump("translateTabs");
	var t='';
	/*$.each( $(".tab-bar__item") , function() { 				
		var temp_value=$(this).find(".tab-bar__label").html();		
		if(!empty(temp_value)){		
			key = $(this).data("trn-key");							
			t = getTrans(temp_value, key );		    
		    $(this).find(".tab-bar__label").html(t);    
		}
	});	*/
	
	$.each( $(".tabbar__item") , function() { 				
		var temp_value=$(this).find(".tabbar__label").html();		
		if(!empty(temp_value)){		
			key = $(this).data("trn-key");							
			t = getTrans(temp_value, key );		    
		    $(this).find(".tabbar__label").html(t);    
		}
	});	
}

function getTrans(words,words_key)
{
	var temp_dictionary='';		
	
	if (typeof getStorage("kr_translation") === "undefined" || getStorage("kr_translation")==null || getStorage("kr_translation")=="" ) { 	   
		return words;
	} else {
		temp_dictionary =  JSON.parse( getStorage("kr_translation") );
	}	
	
	if (!empty(temp_dictionary)){
		//dump(temp_dictionary);		
		var default_lang=getStorage("kr_lang_id");
		//dump(default_lang);
		if (default_lang!="undefined" && default_lang!=""){
			//dump("OK");
			if ( array_key_exists(words_key,temp_dictionary) ){
				//dump('found=>' + words_key +"=>"+ temp_dictionary[words_key][default_lang]);				
				return temp_dictionary[words_key][default_lang];
			}
		}
	}	
	return words;
}

function array_key_exists(key, search) {  
  if (!search || (search.constructor !== Array && search.constructor !== Object)) {
    return false;
  }
  return key in search;
}

function isAutoLogin()
{
   var auto_login=2;
   var kr_remember = getStorage("kr_remember");	
   if ( kr_remember=="on"){
   	   var kr_username=getStorage("kr_username");
       var kr_password=getStorage("kr_password");
       var kr_remember=getStorage("kr_remember");
       if (!empty(kr_username) && !empty(kr_password)){
       	    auto_login=1;
       }
   } 
   return auto_login;
}

function ShowOrderDetails( order_id )
{
	kNavigator.pushPage("OrderDetails.html", {
	 animation: 'slide',
	  callback: function(){		 					  	  
	  	 callAjax("ViewOrderDetails",'order_id=' + order_id );
	  } 
   });
}

var watch_count=1;

var onSuccess = function(position) {
	var html='';
	html='Lat : '+position.coords.latitude;
	html+='<br/>';
	html+= watch_count++;
	html+='<br/>';
	html+='Lat : '+position.coords.longitude;
	$(".location-res").html( html );
};

function onError(error) {
    alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
}

function checkGPS()
{				
	 if (isDebug()){
		return ;
	 }
	 	 	 
	  if ( device.platform =="iOS"){
	 	
	 	cordova.plugins.diagnostic.isLocationAuthorized(function(authorized){
	 		
	 		if(authorized){
	 		   cordova.plugins.locationAccuracy.request( onRequestSuccess, 
	           onRequestFailure, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY);
	 		} else {
	 			
	 			 cordova.plugins.diagnostic.requestLocationAuthorization(function(status){
				    switch(status){
				        case cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
				            toastMsg( getTrans("Permission not requested",'permission_not_requested') );
				            return;
				            break;
				        case cordova.plugins.diagnostic.permissionStatus.DENIED:
				            toastMsg( getTrans("Permission denied",'permission_denied') );
				            return;
				            break;
				        case cordova.plugins.diagnostic.permissionStatus.GRANTED:
				            //toastMsg("Permission granted always");		 
				            
				            cordova.plugins.locationAccuracy.request( onRequestSuccess, 
	                        onRequestFailure, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY);
				                       
				            break;
				        case cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE:
				            //toastMsg("Permission granted only when in use");		            		            
				            
				            cordova.plugins.locationAccuracy.request( onRequestSuccess, 
	                        onRequestFailure, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY);
			                
				            break;
				    }
				}, function(error){
				    toastMsg(error);
				    return;
				}, cordova.plugins.diagnostic.locationAuthorizationMode.ALWAYS);				
	 				
	 		}	 		
	 	}, function(error){
		   toastMsg("The following error occurred: "+error);
		});
	 	
	 } else {
	 	
	 	cordova.plugins.diagnostic.requestLocationAuthorization(function(status){
		    switch(status){
		        case cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
		            toastMsg( getTrans("Permission not requested",'permission_not_requested') );
		            return;
		            break;
		        case cordova.plugins.diagnostic.permissionStatus.GRANTED:
		            //toastMsg("Permission granted");
		            
		            cordova.plugins.locationAccuracy.request( onRequestSuccess, 
	                onRequestFailure, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY);
		            
		            break;
		        case cordova.plugins.diagnostic.permissionStatus.DENIED:
		            toastMsg( getTrans("Permission denied",'permission_denied') );
		            return;
		            break;
		        case cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
		            toastMsg( getTrans("Permission permanently denied",'permission_permanently_denied') );
		            return;
		            break;
		    }
		}, function(error){
		    toastMsg(error);
		    return;
		});	
	 }
}

function onRequestSuccess(success){
    //alert("Successfully requested accuracy: "+success.message);
    //getCurrentPosition();
}

function onRequestFailure(error){    
    if(error.code == 4){
    	showToast( getTrans("You have choosen not to turn on location accuracy",'turn_off_location') ,'danger' );
    	checkGPS();
    } else {
    	showToast( error.message ,'danger' );
    }
}

/*function toastOnSuccess()
{
}
function toastOnError()
{
}*/

function viewTaskMap(task_id , task_lat, task_lng , delivery_address )
{
	 setStorage("task_lat", task_lat );
	 setStorage("task_lng", task_lng );
	 setStorage("delivery_address", delivery_address );
	
	 /*if(!isDebug()){
	   loader.show();
	 }*/
	 	 	
	 kNavigator.pushPage("Map.html", {
		  animation: 'none',
		  data : {		  	
		  	lat : task_lat,
		  	lng : task_lng,
		  	address : delivery_address
		  }		 
	 });
}

function viewTaskMapInit()
{
	var task_lat=getStorage('task_lat');
	var task_lng=getStorage('task_lng');
	dump(task_lng);
	dump(task_lat);
		
		
	google_lat = new plugin.google.maps.LatLng( task_lat , task_lng );
	
	/*
    var div = document.getElementById("map_canvas");  
    map = plugin.google.maps.Map.getMap(div,{     
     'camera': {
      'latLng': google_lat,
      'zoom': 17
     }
    });      
    map.on(plugin.google.maps.event.MAP_READY, onMapInit); 
    */
	
	//$('.page__background').not('.page--menu-page__background').css('background-color', 'rgba(0,0,0,0)');
	
	setTimeout(function(){ 	    
        var div = document.getElementById("map_canvas");
        $('#map_canvas').css('height', $(window).height() - $('#map_canvas').offset().top);
        
        map = plugin.google.maps.Map.getMap(div, {     
	     'camera': {
	      'latLng': google_lat,
	      'zoom': 17
	     }
	    });
	    
	    map.clear();
		map.off();
			    
        map.setBackgroundColor('white');
                
        hideAllModal(); 
        
	    map.setCenter(google_lat);
	    map.setZoom(17);	
        
        map.on(plugin.google.maps.event.MAP_READY, onMapInit); 
        
    }, 500); // and timeout for clear transitions        
}

function onMapInit()
{			
	/*map.clear();
	map.showDialog();*/
	//map.clear();	
	var task_lat=getStorage('task_lat');
	var task_lng=getStorage('task_lng');
	var delivery_address=getStorage('delivery_address');
	
	map.addMarker({
	  'position': new plugin.google.maps.LatLng( task_lat , task_lng ),
	  'title': delivery_address ,
	  'snippet': getTrans( "Destination" ,'destination')
     }, function(marker) {
     	
	    marker.showInfoWindow();	
	    
	    navigator.geolocation.getCurrentPosition( function(position) {	    
	    	  
	    	 var driver_location = new plugin.google.maps.LatLng(position.coords.latitude , position.coords.longitude); 	
	    	 //demo
	    	 //var driver_location = new plugin.google.maps.LatLng( 34.039413 , -118.25480649999997 ); 
	    	 var destination = new plugin.google.maps.LatLng( task_lat , task_lng );
	    	 
	    	 if ( iOSeleven() ){	
	    	 	    	 		    	 	
	    	 	  map.animateCamera({
				  'target': driver_location,
				  'zoom': 17,
				  'tilt': 30
				  }, function() {
					
				   var data = [      
			          {'title': getTrans('You are here','you_are_here'), 'position': driver_location }  
			       ];
			   
				   addMarkers(data, function(markers) {
				    markers[markers.length - 1].showInfoWindow();
				   });
					
				 });  
					   
	    	 } else {
	    	  	 
		    	  map.addPolyline({
				    points: [
				      destination,
				      driver_location
				    ],
				    'color' : '#AA00FF',
				    'width': 10,
				    'geodesic': true
				   }, function(polyline) {
				   	
				   	  map.animateCamera({
						  'target': driver_location,
						  'zoom': 17,
						  'tilt': 30
						}, function() {
							
						   var data = [      
					          {'title': getTrans('You are here','you_are_here'), 'position': driver_location }  
					       ];
					   
						   addMarkers(data, function(markers) {
						    markers[markers.length - 1].showInfoWindow();
						   });
							
					   });  
					   
				   });   
		    	 // end position success
	    	 
	    	 }
	    	 
	      }, function(error){
	    	 toastMsg( error.message );
	    	 // end position error
	      }, 
          { timeout: 10000, enableHighAccuracy : getLocationAccuracy() } 
        );	    	  
    });     
}

function addMarkers(data, callback) {
  var markers = [];
  function onMarkerAdded(marker) {
    markers.push(marker);
    if (markers.length === data.length) {
      callback(markers);
    }
  }
  data.forEach(function(markerOptions) {
    map.addMarker(markerOptions, onMarkerAdded);
  });
}

function viewTaskDirection()
{	
	/*plugin.google.maps.external.launchNavigation({
	  "from": "Tokyo, Japan",
	   "to": "Kyoto, Japan"
	});*/	
		
   /*var delivery_address=getStorage('delivery_address');
   dump(delivery_address);*/
   
   var task_lat=getStorage('task_lat');
   var task_lng=getStorage('task_lng');
	
   navigator.geolocation.getCurrentPosition( function(position) {	    
   	         
         var yourLocation = new plugin.google.maps.LatLng(position.coords.latitude , position.coords.longitude); 	        
         //demo
         //var yourLocation = new plugin.google.maps.LatLng(34.039413 , -118.25480649999997); 	        
         
         var destination_location = new plugin.google.maps.LatLng(task_lat , task_lng); 	        
         
         plugin.google.maps.external.launchNavigation({
	         "from": yourLocation,
	         "to": destination_location
	      });	

    	 // end position success    	 
      }, function(error){
    	 toastMsg( error.message );
    	 // end position error
      }, 
      { timeout: 10000, enableHighAccuracy : getLocationAccuracy() } 
    );	    	  		
}

function clearPushCount()
{
	removeStorage("push_count");
	$(".baloon-notification").html('');
	$(".baloon-notification").hide();
}

function playNotification()
{	 	
	 if ( device.platform =="iOS"){	  	
	 	var sound_url= "beep.wav";
	 } else {
	 	var sound_url= "file:///android_asset/www/beep.wav";
	 }	 	 
	 playAudio(sound_url);
}

var my_media;

function playAudio(url) {
    // Play the audio file at url    
    my_media = new Media(url,
        // success callback
        function () {
            dump("playAudio():Audio Success");
            my_media.stop();
            my_media.release();
        },
        // error callback
        function (err) {
            dump("playAudio():Audio Error: " + err);
        }
    );
    // Play audio
    my_media.play({ playAudioWhenScreenIsLocked : true });
    my_media.setVolume('1.0');     
}

function stopNotification()
{
	my_media.stop();
    my_media.release();
}

function AjaxNotification(action, params , done)
{
	try {
	dump('AjaxNotification');
	
	params+=getParams();
		
	ajax_request3 = $.ajax({
	  url: ajax_url+"/"+action,
	  method: "post" ,
	  data: params ,
	  dataType: "json",
	  timeout: ajax_timeout,
	  crossDomain: true,
	  beforeSend: function( xhr ) {
	  	
	  	 clearTimeout( timer[101] );
	  	 
         if(ajax_request3 != null) {			 				   		   
           ajax_request3.abort();
		 } else {    				
			timer[101] = setTimeout(function() {		
         		if( ajax_request3 != null) {		
				   ajax_request3.abort();				   
         		}         		         		
	        }, ajax_timeout ); 		 	
		 }
      }
    });
    
    ajax_request3.done(function( data ) {
    	done();
    	if ( data.code==1){		
			$("#notifications-details").html( formatNotifications( data.details ) );		
		} else {		
			$("#notifications-details").html('');	
			showToast( data.msg ,'danger');		   					
		}
    });
	
	ajax_request3.always(function() {        
        ajax_request3 = null;  
    });	   
    
    ajax_request3.fail(function( jqXHR, textStatus ) {    	
    	$text = !empty(jqXHR.responseText)?jqXHR.responseText:'';
		if(textStatus!="abort"){
		   showToast( textStatus + "\n" + $text );             
		}
    });     
    
    } catch(err) {
      showToast(err.message);
    } 	
}

function getLocationAccuracy()
{
	var location_accuracy = getStorage("kr_location_accuracy");
	if(!empty(location_accuracy)){
		if ( location_accuracy == 1){
			return true;
		}
	}
	return false;
}


/*VERSION 1.1 STARTS HERE*/

function showAddNote(task_id, status_raw )
{	
	kNavigator.pushPage("Notes.html", {
	  animation: 'slide',
	  data : {
	  	'task_id' : task_id,
	  	'status_raw' : task_id,
	  }
	  /*callback: function(){			  	 					  	 
	  	  dump('Notes');		  
	  	  $(".task_id").val(task_id);	  	 
	  	  if ( status_raw=="cancelled" || status_raw=="successful" || status_raw=="failed"){	  	  	  
	  	  	  $(".add_notes_wrapper").hide();	  	
	  	  	  $(".toolbar-title-notes").html( getTrans("View Notes",'view_notes') );  	  
	  	  }	  	  
	  	  callAjax("loadNotes","task_id="+task_id);
	  } */
   });
}

function addNotes()
{
	var params = $( ".frm-notes").serialize();	
	params+="&task_id="+$(".task_id").val();	
	callAjax("addNotes",params);
}

var showNotesPopover = function(element,id,notes) {   
   $(".notes_id").val(id);
   $(".notes_value").val(notes);
   notes_popover.show(element);  
};

function editNotes()
{
   var dialog = document.getElementById('editNotes');
   notes_popover.hide();      
   
   if (dialog) {   	  
      dialog.show();
      $(".edit_notes_fields").val( $(".notes_value").val() );
   } else {
      ons.createDialog('editNotes.html')
      .then(function(dialog) {      	
      	$(".edit_notes_fields").val( $(".notes_value").val() );
        dialog.show();
      });
   }   
}

function deleteNotes()
{
	notes_popover.hide();
	
	ons.notification.confirm({
	  message: getTrans("Are you sure?","are_you_sure") ,	  
	  title: dialog_title_default ,		  
	  buttonLabels: [ getTrans("Yes","yes") ,  getTrans("No","no") ],
	  animation: 'default', // or 'none'
	  primaryButtonIndex: 1,
	  cancelable: true,
	  callback: function(index) {	 	  	     	  
	  	   if (index==0){	  	   	 
				callAjax("deleteNotes","id=" + $(".notes_id").val() + "&task_id="+$(".task_id").val() );
	  	   } else {
	  	   	   return false;
	  	   }
	  }
	});  	
}

function updateNotes()
{
	var params='';
	params+="id="+$(".notes_id").val();
	params+="&notes="+$(".edit_notes_fields").val() + "&task_id="+$(".task_id").val();
	callAjax("updateNotes", params );
}

function addPhotoSelection()
{
	var dialog = document.getElementById('addphotoSelection');
	if (dialog) {
	      dialog.show();	      	      
	} else {
	    ons.createDialog('addphotoSelection.html')
	      .then(function(dialog) {
	        dialog.show();	        	        
	        setTimeout('TransLatePage()', 300);	
	    });
	}	
}

function showCemara()
{

	var app_resize_picture = getStorage("app_resize_picture");
	
	if (isDebug()){
		toastMsg("show camera");			
		var dialog = document.getElementById('addphotoSelection');
	    dialog.hide();
		return;
	}
	
	map_navigator = 1;
	
	var cam_options = {
		destinationType: Camera.DestinationType.FILE_URI,
	    sourceType: Camera.PictureSourceType.CAMERA,
	    popoverOptions: new CameraPopoverOptions(300, 300, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY)
	};
	
	if ( app_resize_picture==1){
		app_resize_height = parseInt(getStorage("app_resize_height"));
		app_resize_width = parseInt(getStorage("app_resize_width"));
		if(app_resize_height>0 && app_resize_width>0){
			cam_options={
				destinationType: Camera.DestinationType.FILE_URI,
			    sourceType: Camera.PictureSourceType.CAMERA,
			    popoverOptions: new CameraPopoverOptions(300, 300, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY),
			    targetHeight: app_resize_height ,
				targetWidth:  app_resize_width
			};
		}
	}
				
	navigator.camera.getPicture(uploadTaskPhoto, function(){
		toastMsg( getTrans("Get photo failed","get_photo_failed") );
	}, cam_options );
}

function uploadTaskPhoto(imageURI)
{
		 
     uploadLoader.show();
	 
	 setTimeout(function(){
		$("#progress_bar").attr("value",0);
		$(".bytes_send").html("0%");
	 }, 1);	
	 	 
	 var options = new FileUploadOptions();
	 options.fileKey = "file";
	 options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
	 options.mimeType = "image/jpeg";
	 	 
	 
	 var params = {};
	 /*params.token = getStorage("kr_token") ;	 
	 params.task_id = $(".task_id_details").val() ;	 */
	 	 
	params.lang_id=getStorage("kr_lang_id");
	if(!empty(krms_driver_config.APIHasKey)){		
		params.api_key=krms_driver_config.APIHasKey;
	}		
	if ( !empty( getStorage("kr_token") )){				
		params.token=getStorage("kr_token");
	}
	
	params.task_id=$(".task_id_global").val();
	 
	 options.params = params;
 
	 options.chunkedMode = false;	
	 
	 var headers={'headerParam':'headerValue'};
	 options.headers = headers;
	
	 var ft = new FileTransfer();	 	 	 
	 
	 ft.onprogress = function(progressEvent) {
     if (progressEvent.lengthComputable) {
     	    
     	    var loaded_bytes= parseInt(progressEvent.loaded);
     	    var total_bytes= parseInt(progressEvent.total);
     	    
     	    var loaded_percent = (loaded_bytes/total_bytes)*100;	        
     	    loaded_percent=Math.ceil(loaded_percent);
     	    	        
	        $("#progress_bar").attr("value",loaded_percent);
		    $(".bytes_send").html(loaded_percent+"%");
	        
	        if(loaded_bytes>=total_bytes){	        	        
	        	uploadLoader.hide();
	        	$("#progress_bar").attr("value",0);
		        $(".bytes_send").html("0%");
	        }
     	    
	        loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);	        
	        
	    } else {	    		    	
	        loadingStatus.increment();	        
	    }
	 };
	 	 
	 ft.upload(imageURI, ajax_url+"/UploadTaskPhoto", function(result){
	    //alert(JSON.stringify(result));
	    /*alert(result.responseCode);
	    alert(JSON.stringify(result.response));	*/

	    if( $('#uploadLoader').is(':visible') ){
			uploadLoader.hide();
			$("#progress_bar").attr("value",0);
		    $(".bytes_send").html("0%");
		}    
	    
	    var response=explode("|",result.response);	    
	    toastMsg(response[1]);		   
	    if ( response[0]=="1" || response[0]==1){
	    	var dialog = document.getElementById('addphotoSelection');
	        dialog.hide();	    	                
	        callAjax("TaskDetails",'task_id=' + $(".task_id_global").val() );
	    }
	    
	 }, function(error){
	 	 uploadLoader.hide();
	     toastMsg( getTrans("An error has occurred: Code","error_occured") + " "+ error.code);
	 }, options);
}

function showDeviceGallery(action_type)
{		
	
	dump("action_type=>"+action_type);
	/*where action type
	1 = profile
	2 = task add picture	
	*/
			
	if(isDebug()){
		var dialog = document.getElementById('addphotoSelection');
	    dialog.hide();
	    
		uploadLoader.show();
		$(".bytes_send").html("10%");		
		setTimeout(function(){
			uploadLoader.hide();
			$("#progress_bar").attr("value",0);
			$(".bytes_send").html("0%");						
	    
		 }, 3000);	
		return;
	}
	
	
	switch (action_type)
	{
		case 1:
		case "1":
		
		map_navigator = 1;
		
		navigator.camera.getPicture(uploadPhoto, function(){
			toastMsg( getTrans("Get photo failed","get_photo_failed") );
		},{
		    destinationType: Camera.DestinationType.FILE_URI,
		    sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
		    popoverOptions: new CameraPopoverOptions(300, 300, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY)		    
	    });
	    
	    
		break;
		
		case 2:
		case "2":
		
		map_navigator = 1;
		
		var dialog = document.getElementById('addphotoSelection');
	    dialog.hide();
	    	   
	    navigator.camera.getPicture(uploadTaskPhoto, function(){
			toastMsg( getTrans("Get photo failed","get_photo_failed") );
		},{
		    destinationType: Camera.DestinationType.FILE_URI,
		    sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
		    popoverOptions: new CameraPopoverOptions(300, 300, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY)		    
	    });
		
		break;
	}		
}

function showPhotoPage()
{
   showPage("photoPage.html",'');
}

function uploadPhoto(imageURI)
{
	 
	 uploadLoader.show();
	 
	 setTimeout(function(){
		$("#progress_bar").attr("value",0);
		$(".bytes_send").html("5%");
	 }, 1);	
	 	 
	 var options = new FileUploadOptions();
	 options.fileKey = "file";
	 options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
	 options.mimeType = "image/jpeg";
	 	 
	 var params = {};
	 if ( !empty( getStorage("kr_token") )){				
		params.token=getStorage("kr_token");
	}	 
	 options.params = params;
 
	 options.chunkedMode = false;	
	 
	 var headers={'headerParam':'headerValue'};
	 options.headers = headers;
	
	 var ft = new FileTransfer();	 	 	 
	 
	 ft.onprogress = function(progressEvent) {
     if (progressEvent.lengthComputable) {
     	    //toastMsg( "progressEvent=>"+progressEvent.loaded + " - " + progressEvent.total );
     	    
     	    var loaded_bytes= parseInt(progressEvent.loaded);
     	    var total_bytes= parseInt(progressEvent.total);
     	    
     	    var loaded_percent = (loaded_bytes/total_bytes)*100;	        
     	    loaded_percent=Math.ceil(loaded_percent);
     	    
	        
	        $("#progress_bar").attr("value",loaded_percent);
		    $(".bytes_send").html(loaded_percent+"%");
	        
	        if(loaded_bytes>=total_bytes){	        	        
	        	uploadLoader.hide();
	        	$("#progress_bar").attr("value",0);
		        $(".bytes_send").html("0%");
	        }
     	    
	        loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);	        
	        
	    } else {	    		    	
	        loadingStatus.increment();	        
	    }
	 };
	 	 
	 ft.upload(imageURI, ajax_url+"/UploadProfile", function(result){
	    //alert(JSON.stringify(result));
	    /*alert(result.responseCode);
	    alert(JSON.stringify(result.response));	*/
	    	    
	    
	    var response=explode("|",result.response);
	    //alert(response[0]);	
	    toastMsg(response[1]);	
	    
	    if ( response[0]=="1" || response[0]==1){
		    $(".profile-bg").css('background-image', 'url(' + response[2] + ')');
			$(".profile-bg").css("background-size","cover");
			$(".avatar").attr("src", response[2] );
			
			$("#img_loader_wrap").addClass("img_loader");
			
		    imageLoaded('.img_loader');
	    }
		
		if( $('#uploadLoader').is(':visible') ){
			uploadLoader.hide();
			$("#progress_bar").attr("value",0);
		    $(".bytes_send").html("0%");
		}
	    
	 }, function(error){
	 	 uploadLoader.hide();
	     toastMsg( getTrans("An error has occurred: Code","error_occured") + " "+ error.code);
	 }, options);
}

function view3DirectionMap(data)
{

	if(!isDebug()){
	   loader.show();
	}
	
	setStorage("map_action",'map2');
	var data = JSON.parse(getStorage("task_full_data"));
	if(!empty(data)){
		
		kNavigator.pushPage("Map.html", {
		  animation: 'fade',
		  callback: function(){		

		  	  dump(data);		
		  	  //alert(JSON.stringify(data));	 
		  	  		  	  
             if(!empty(data)){		  	  	  		  	  	  
		  	  	  if ( data.status_raw=="cancelled" || data.status_raw=="successful" || data.status_raw=="failed"){	  	  	  
		  	  	  	  $(".direction_wrap").hide();
		  	  	  	  $(".floating_action").hide();
		  	  	  }
		  	  }
		  	  
		  	  setStorage("task_lat", data.task_lat );
		  	  setStorage("task_lng", data.task_lng );
		  	  
		  	  //$(".direction_wrap").hide(); 		  	  
		  	  /*var params='';
		  	  params="driver_lat="+data.driver_lat;
		  	  params+="&driver_lng="+data.driver_lng;
		  	  params+="&dropoff_lat="+data.dropoff_lat;
		  	  params+="&dropoff_lng="+data.dropoff_lng;		  	  
		  	  params+="&task_lat="+data.task_lat;
		  	  params+="&task_lng="+data.task_lng;		  	  
		  	  callAjax("trackDistance",params);*/
		  	  

		  	  if (isDebug()){
		        return;
	          }
		  	  
		  	  var dropoff_location = new plugin.google.maps.LatLng( data.dropoff_task_lat , data.dropoff_task_lng );
		  	  var task_location = new plugin.google.maps.LatLng( data.task_lat , data.task_lng );

		  	  /*alert("dropoff "+data.dropoff_lat + " => "+ data.dropoff_lng );
		  	  alert("task location "+data.task_lat + " => "+ data.task_lng );*/
		  	  
		  	  
		  	  setTimeout(function(){ 	    
		        var div = document.getElementById("map_canvas");
		        $('#map_canvas').css('height', $(window).height() - $('#map_canvas').offset().top);
		        
		        map = plugin.google.maps.Map.getMap(div, {     
			     'camera': {
			      'latLng': dropoff_location,
			      'zoom': 17
			     }
			    });
			    
			    map.clear();
		        map.off();
			    
		        map.setBackgroundColor('white');		        
		        map.on(plugin.google.maps.event.MAP_READY, function(){
		        			        	 
		        	 
		        	 navigator.geolocation.getCurrentPosition( function(position) {	   
		        	
		        	    var driver_location = new plugin.google.maps.LatLng(position.coords.latitude , position.coords.longitude); 	
		        	    
		        	    //alert("driver_location "+position.coords.latitude + " => "+ position.coords.longitude );
		        	    
		        	    
		        	    var task_data = JSON.parse(getStorage("task_full_data"));
		        	    		        	    
		        	    /*alert(task_data.map_icons.driver);
		        	    alert(task_data.map_icons.merchant);
		        	    alert(task_data.map_icons.customer);*/		        	    
		        	    		        	    		        	    
		        	    if (task_data.trans_type_raw=="pickup"){
		        	    	
		        	    	var data_marker = [      
							{ 
						        'title': getTrans("You are here","you_are_here"),
						        'position': driver_location ,
						        //'snippet': getTrans( "Driver name" ,'driver_name'),
						        'icon': {
							       'url': task_data.map_icons.driver
							    }
						      },{ 
						        'title': data.drop_address , 							            
						        'position': dropoff_location ,						        
						        'snippet': getTrans( "Drop Details" ,'drop_details') ,
						        'icon': {							       
							       'url': task_data.map_icons.customer
							    }
						      },{ 
						        'title': data.delivery_address , 
						        'position': task_location ,
						        'snippet': getTrans( "Pickup Details" ,'pickup_details') ,
						        'icon': {
							       'url': task_data.map_icons.merchant
							    }
						      }  
						    ];
		        	    	
		        	    } else {
		        	    		        	    
			        	    var data_marker = [      
							{ 
						        'title': getTrans("You are here","you_are_here"),
						        'position': driver_location ,
						        //'snippet': getTrans( "Driver name" ,'driver_name'),
						        'icon': {
							       'url': task_data.map_icons.driver
							    }
						      },{ 
						        'title': data.drop_address , 							            
						        'position': dropoff_location ,
						        'snippet': getTrans( "Pickup Details" ,'pickup_details') ,
						        'icon': {
							       'url': task_data.map_icons.merchant
							    }
						      },{ 
						        'title': data.delivery_address , 
						        'position': task_location ,
						        'snippet': getTrans( "Delivery Address" ,'delivery_address'),
						        'icon': {
							       'url': task_data.map_icons.customer
							    }
						      }  
						    ];
					    
		        	   }
					    
					    
					   hideAllModal(); 
					    
					   map.setCenter(driver_location);             
					   map.setZoom(17);


					   if (task_data.trans_type_raw=="pickup"){
					   						   	
					   	  addMarkers(data_marker, function(markers) {
						    
					   	  	  if ( iOSeleven() ){
					   	  	  	
					   	  	  	 map.animateCamera({
										  'target': task_location,
										  'zoom': 17,
										  'tilt': 30
										}, function() {
											
											map.animateCamera({
											  'target': dropoff_location,
											  'zoom': 17,
											  'tilt': 30
											}, function() {
												
											}); /*end camera*/
																	   
									   });  /*end camera*/
					   	  	  	
					   	  	  } else {
					   	  	
							   	  	map.addPolyline({
									points: [
									  driver_location,
									  task_location
									],
									'color' : '#AA00FF',
									'width': 10,
									'geodesic': true
									}, function(polyline) {
									   
									   map.animateCamera({
										  'target': task_location,
										  'zoom': 17,
										  'tilt': 30
										}, function() {
																			
											map.addPolyline({
											points: [
											  task_location,
											  dropoff_location
											],
											'color' : '#AA00FF',
											'width': 10,
											'geodesic': true
											}, function(polyline) {
											   
												map.animateCamera({
												  'target': dropoff_location,
												  'zoom': 17,
												  'tilt': 30
												}, function() {
													
												}); /*end camera*/
												 
											}); /*end line*/  	
													
																	   
									   });  /*end camera*/
										
									}); /*end line*/  								
					   	  	  }
						   	
						   }); /*end markers*/
					   	
					   } else {
					   				    
						   addMarkers(data_marker, function(markers) {
						    
						   	    if ( iOSeleven() ){
						   	    	
						   	    	  map.animateCamera({
										  'target': dropoff_location,
										  'zoom': 17,
										  'tilt': 30
										}, function() {
											
											map.animateCamera({
											  'target': task_location,
											  'zoom': 17,
											  'tilt': 30
											}, function() {
												
											}); /*end camera*/
																	   
									   });  /*end camera*/
						   	    	
						   	    } else {
							   	  	map.addPolyline({
									points: [
									  driver_location,
									  dropoff_location
									],
									'color' : '#AA00FF',
									'width': 10,
									'geodesic': true
									}, function(polyline) {
									   
									   map.animateCamera({
										  'target': dropoff_location,
										  'zoom': 17,
										  'tilt': 30
										}, function() {
																			
											map.addPolyline({
											points: [
											  dropoff_location,
											  task_location
											],
											'color' : '#AA00FF',
											'width': 10,
											'geodesic': true
											}, function(polyline) {
											   
												map.animateCamera({
												  'target': task_location,
												  'zoom': 17,
												  'tilt': 30
												}, function() {
													
												}); /*end camera*/
												 
											}); /*end line*/  	
													
																	   
									   });  /*end camera*/
										
									}); /*end line*/  								
						   	    }
						   	
						   }); /*end markers*/
					   
					   } 
					    				    
		        	 	 	
		        	 }, function(error){
		        	 	 hideAllModal();	
				    	 toastMsg( error.message );
				    	 // end position error
				      }, 
			          { timeout: 10000, enableHighAccuracy : getLocationAccuracy() } 
			        );	   	
		        	
		       }); 
		        		        
		    }, 300); // and timeout for clear transitions  	  	  
		  	  	  	  
		  } 
	    });
	
	} else {
		hideAllModal();	
		onsenAlert( getTrans("Map not available",'map_not_available') );
	}
}

function deletePhoto(id)
{
	ons.notification.confirm({
	  title: dialog_title_default ,		  
      message: getTrans("Delete this photos?","delete_this_photo") ,
      callback: function(idx) {
        switch (idx) {
          case 0:            
            break;
          case 1:
            callAjax("deletePhoto",'id=' + id + "&task_id=" + $(".task_id_global").val() );
            break;
        }
      }
    });
}

/*Location tracking in background*/

function onBackgroundMode() {        	
	app_running_status="background";	
	clearInterval($handle_cron[1]);
	clearInterval($handle_cron[2]);
}

function onForegroundMode()
{	
	try {
		
		dump('onForegroundMode');
			
		map_navigator=0;
		app_running_status="active";	
		setStorage("bg_tracking",2);
		checkGPS();	
		
		setTimeout(function(){
		   $handle_cron[1] =  setInterval(function(){runCron('foreGroundLocation')}, $cron_interval );		
		   $handle_cron[2] =  setInterval(function(){runCron('getNewTask')}, $cron_interval );
	     }, 100);	 
								
	     
	    if(cordova.platformId == "ios"){
			window.FirebasePlugin.getBadgeNumber(function(n) {		   	       
		       total_badge = parseInt(n);	       
		       if(total_badge>0){
		       	   window.FirebasePlugin.setBadgeNumber(0);
		       }
		    });
		}		
		
	} catch(err) {
       toastMsg(err.message);       
    }  

}

function iOSeleven()
{	
	if ( device.platform =="iOS"){	
		version = parseFloat(device.version);		
		if ( version>=11 ){
			return true;
		}
	}
	return false;
}


playSound = function(){		 
	 try {	 		 	 
		 url = 'file:///android_asset/www/beep.wav';			 
		 if(device_platform=="iOS"){
		 	url = "beep.wav";
		 }
		 //alert(url);
		 my_media = new Media(url,	        
	        function () {
	            dump("playAudio():Audio Success");
	            my_media.stop();
	            my_media.release();
	        },	        
	        function (err) {
	            dump("playAudio():Audio Error: " + err);
	        }
	    );	    
	    my_media.play({ playAudioWhenScreenIsLocked : true });
	    my_media.setVolume('1.0');
    
    } catch(err) {
       alert(err.message);
    } 
};

handleNotification = function(data){	
	//setBaloon();		
};

getParams = function(){
	
	params ='';
	lang = getStorage("kr_lang_id");
		
	if(!empty(lang)){
	   params+="&lang="+lang;
	}
	
	if(!empty(krms_driver_config.APIHasKey)){
		params+="&api_key="+krms_driver_config.APIHasKey;
	}		
	
	if ( !empty( getStorage("kr_token") )){		
		params+="&token="+  getStorage("kr_token");
	}
		
	if( isDebug() ){
	   params+="&device_platform=" + device_platform;
	} else {
	   params+="&device_platform=" + cordova.platformId;
	}
	
	device_id = getStorage("device_id");
	if(!empty(device_id)){
	   params+="&device_id="+ getStorage("device_id");
	}
	
	params+="&app_version=" + app_version;
		
	return params;
};


sendPost = function(action,params){
		
	try {
		
		if ( !hasConnection() ){
		   toastMsg( getTrans("Not connected to internet",'no_connection') );	
		   return;
	    }
	
		params+=getParams();
		
		var send_post_ajax = $.ajax({
		  url: ajax_url+"/"+action, 
		  method: "GET",
		  data: params,
		  dataType: "jsonp",
		  timeout: 20000,
		  crossDomain: true,
		  beforeSend: function( xhr ) {       
	      }
	    });
	    
	    send_post_ajax.done(function( data ) {
	    	 //alert(JSON.stringify(data));
	    	 if(data.code==1){
	    	 	setStorage("device_id", data.details ); 
	    	 	removeStorage("push_unregister");
	    	 } else {    	 
	    	 	// do nothing	
	    	 }
	    });
	    
	    send_post_ajax.always(function() {        
	    	send_post_ajax=null;   
	    });
	          
	    /*FAIL*/
	    send_post_ajax.fail(function( jqXHR, textStatus ) {    	
	    	send_post_ajax=null;   	    	
	    });    
    

    } catch(err) {
       alert(err.message);       
    } 
};

getIcons = function(){
	map_icons='';
	map_icon = getStorage("map_icons");
	if(!empty(map_icon)){
	   map_icons =  JSON.parse( map_icon );
	} else {
	   map_icons = {
	   	 driver : 'http://maps.gstatic.com/mapfiles/markers2/marker.png',
	   	 customer: 'http://maps.gstatic.com/mapfiles/markers2/icon_green.png',
	   	 merchant : 'http://maps.gstatic.com/mapfiles/markers2/boost-marker-mapview.png'
	   };	
	}
	return map_icons;
};

setDuty  = function(options){		
	 var is_duty=1;
     kr_on_duty = getStorage("kr_on_duty");
          
     if(!empty(kr_on_duty)){
     	if(kr_on_duty==1){     		
		  	is_duty=2;
     	}
     }
        
     if(options==2){
     	 if(is_duty==2){
	     	onduty2.checked=true;
		  	$(".duty_status2").html( getTrans("On-Duty",'on_duty') );		  		     	
	     } else {
	     	onduty2.checked=false;
		    $(".duty_status2").html( getTrans("Off-duty",'off_duty')  );
	     }
     } else {
	     if(is_duty==2){
	     	onduty.checked=true;
		  	$(".duty_status").html( getTrans("On-Duty",'on_duty') );		  		     	
	     } else {
	     	onduty.checked=false;
		    $(".duty_status").html( getTrans("Off-duty",'off_duty')  );
	     }
     }
};

getMapProvider = function(){
	map_provider = getStorage("map_provider");
	if(empty(map_provider)){
		map_provider = 'google.maps';
	}
	return map_provider;
};

initMap = function(lat, lng, info){
	map_provider = getStorage("map_provider");
	switch (map_provider){
		case "google":
		   gmaps_initMap('map_canvas',lat, lng, info);
		break;
		
		case "mapbox":
		  mapbox_initMap('map_canvas',lat, lng, info);
		break;
	}
};

setMapCenter = function(){
	map_provider = getStorage("map_provider");
	switch (map_provider){
		case "google":
		  centerMap();
		break;
		
		case "mapbox":
		  centerMapbox();
		break;
	}
};

getDirections = function(){
	
	try {
		
		your_lat = $("#your_lat").val();
		your_lng = $("#your_lng").val();
		
		task_lat = $("#task_lat").val();
		task_lng = $("#task_lng").val();
		
		if (!empty(your_lat) && !empty(task_lat) ) {
			
		   launchnavigator.isAppAvailable(launchnavigator.APP.GOOGLE_MAPS, function(isAvailable){
			    var app;
			    if(isAvailable){
			        app = launchnavigator.APP.GOOGLE_MAPS;
			    }else{		        
			        app = launchnavigator.APP.USER_SELECT;
			    }
			    launchnavigator.navigate( [task_lat, task_lng] , {
			        app: app,
			        start: your_lat+","+your_lng
			    });
		   });
		
		} else {
			toastMsg( getTrans("Missing Coordinates","missing_coordinates") );
		}
		
	} catch(err) {		
	    toastMsg(err.message);
	} 
};

viewDropOffMap = function(){			
	kNavigator.pushPage("map_dropoff.html", {
		animation: 'none',
	});	
};

getDirectionsDropoff = function(){
	
	try {
		var data = JSON.parse(getStorage("task_full_data"));
		dump(data);
		
		var lat = data.task_lat;
		var lng = data.task_lng;
		
		var your_lat;
		var your_lng;
		
		var dropoff_lat;
		var dropoff_lng;
				
		if(empty(lat) && empty(lng)){
		   toastMsg( getTrans("Missing Coordinates","missing_coordinates") );	
		   return;
		}
		
		var your_lat = $(".driver_location_lat").val();
		var your_lng = $(".driver_location_lng").val();
		
		if(!empty(data.dropoff_task_lat) && !empty(data.dropoff_task_lng)){   	
	   	    dropoff_lat = data.dropoff_task_lat;
	   	    dropoff_lng = data.dropoff_task_lng;
		}
				
		if(!empty(your_lat) && !empty(your_lng)){
			launchnavigator.navigate([lat, lng], {
	           start: your_lat+","+your_lng
	        });
		} else {
			toastMsg( getTrans("Missing Coordinates","missing_coordinates") );	
		}
			
	} catch(err) {		
	    toastMsg(err.message);
	} 	
};

document.addEventListener('prechange', function(event) {
	dump('prechange');
	dump("tab index ->" + event.index);	
	
	current_page = kNavigator.topPage.id;
	dump("current_page=>"+ current_page);
	
	switch (event.index){
		case 0:
		  setDuty(1);
		break;
		
		case 1:
		 if(current_page=="home"){
		 	//
		 } else if (current_page=="profilePage") {
		 	TransLatePage();	
		 }
		break;
	}
});

initBackgroundTracking = function(){
	
	try {
			
		var app_disabled_bg_tracking=getStorage("app_disabled_bg_tracking");
		if (app_disabled_bg_tracking==1 || app_disabled_bg_tracking=="1"){		
			return;
		}		
		
		var min_frequency = getStorage("app_track_interval");		
		if (min_frequency<=0){
			min_frequency=60000;
		}
		if (empty(min_frequency)){
			min_frequency=60000;
		}
		
		//dump2("min_frequency=>"+min_frequency);
		
		if(cordova.platformId === "android"){
			$bg_provider =  BackgroundGeolocation.ACTIVITY_PROVIDER;
			$desired_accuracy =  BackgroundGeolocation.MEDIUM_ACCURACY;
			$start_foreground = false;
		} else {
			$bg_provider =  BackgroundGeolocation.RAW_PROVIDER;
			$desired_accuracy =  BackgroundGeolocation.LOW_ACCURACY;
			$start_foreground = true;
		}
		
		
		 BackgroundGeolocation.configure({		    
		    locationProvider: $bg_provider,
		    desiredAccuracy: $desired_accuracy,
		    stationaryRadius: 1,
		    distanceFilter: 1,
		    notificationTitle: getTrans("Tracking","tracking") +  "..." ,
		    notificationText: '',	    
		    interval: min_frequency,
		    fastestInterval: min_frequency,
		    activitiesInterval: min_frequency,
		    stopOnTerminate: true,
		    stopOnStillActivity: false ,
		    saveBatteryOnBackground : true, 
		    debug: false,
		    url : ajax_url+"/updateDriverLocation",
		    postTemplate : {
		    	lat: '@latitude',
		    	lng: '@longitude',		    	
		    	altitude : '@altitude',
		    	accuracy : '@accuracy',
		    	speed : '@speed',
		    	track_type : "background",
		    	token : getStorage("kr_token"),
		    	app_version : app_version,
		    	api_key : krms_driver_config.APIHasKey,		    	
		    }
		});
		
		 BackgroundGeolocation.on('location', function(location) {
		 	 
		 	 BackgroundGeolocation.startTask(function(taskKey) {
		 	 			 	 	 
		 	 	 $latitude = !empty(location.latitude)?location.latitude:'';
		 	 	 $longitude = !empty(location.longitude)?location.longitude:'';
		 	 	 $accuracy = !empty(location.accuracy)?location.accuracy:'';
		 	 	 $altitude = !empty(location.altitude)?location.altitude:'';
		 	 	 
		 	 	 params = 'lat='+ $latitude + "&lng=" + $longitude;
			     params+="&app_version=" + app_version;	     			     
			     params+="&accuracy="+ $accuracy;
			     params+="&altitudeAccuracy="+ $altitude;
			     params+="&heading="+ '';
			     params+="&speed="+ '';
			     params+="&track_type=location";
			     				     
			     callAjax2('updateDriverLocation', params);
		 	 	
		 	 	 BackgroundGeolocation.endTask(taskKey);
		 	 });
		 });
		 
		 BackgroundGeolocation.on('stationary', function(location) {		  		     
		    
		     $latitude = !empty(location.latitude)?location.latitude:'';
	 	 	 $longitude = !empty(location.longitude)?location.longitude:'';
	 	 	 $accuracy = !empty(location.accuracy)?location.accuracy:'';
	 	 	 $altitude = !empty(location.altitude)?location.altitude:'';
	 	 	 
	 	 	 params = 'lat='+ $latitude + "&lng=" + $longitude;
		     params+="&app_version=" + app_version;	     			     
		     params+="&accuracy="+ $accuracy;
		     params+="&altitudeAccuracy="+ $altitude;
		     params+="&heading="+ '';
		     params+="&speed="+ '';
		     params+="&track_type=stationary";
		     				     
		     callAjax2('updateDriverLocation', params);
		    
		 });
		 
		 BackgroundGeolocation.on('error', function(error) {
		    showToast('[ERROR] BackgroundGeolocation error:', error.code, error.message);
		 });
		 
		 BackgroundGeolocation.on('start', function() {
		    //showToast('[INFO] BackgroundGeolocation service has been started');
		 });
		
		 BackgroundGeolocation.on('stop', function() {
		    //showToast('[INFO] BackgroundGeolocation service has been stopped');
		 });			
		
		  BackgroundGeolocation.on('authorization', function(status) {
		    console.log('[INFO] BackgroundGeolocation authorization status: ' + status);
		    if (status !== BackgroundGeolocation.AUTHORIZED) {
		      // we need to set delay or otherwise alert may not be shown
		      setTimeout(function() {
		        var showSettings = confirm('App requires location tracking permission. Would you like to open app settings?');
		        if (showSettings) {
		          return BackgroundGeolocation.showAppSettings();
		        }
		      }, 1000);
		    }
		 });
		 
		BackgroundGeolocation.on('abort_requested', function() {
			 showToast('[INFO] Server responded with 285 Updates Not Required');
		});
		
		BackgroundGeolocation.on('background', function() {
			
			if(map_navigator==1){
				return;
			}
			
			BackgroundGeolocation.checkStatus(function(status) {
				if (!status.isRunning) {
					setTimeout(function() {	    	   
				       BackgroundGeolocation.start();  
				    }, 300);
				}
			});
			
			
		});
		
		BackgroundGeolocation.on('foreground', function() {
									
			BackgroundGeolocation.checkStatus(function(status) {
				if (status.isRunning) {
					setTimeout(function() {	    	   
				       BackgroundGeolocation.stop();				       
				    }, 300);
				}
			});
		});
  
    } catch(err) {
       dump(err.message);   
    }  
};

placeholder = function(field, words , words_key){
	$(field).attr("placeholder", getTrans(words,words_key) );
};

getParamsArray = function(){
		
	$params = {
		"lang": !empty(getStorage("kr_lang_id"))?getStorage("kr_lang_id"):'' ,
		"api_key" : krms_driver_config.APIHasKey,
		"token" : getStorage("kr_token"),
		"device_platform" : device_platform,
		"device_id" : getStorage("device_id"),
		"app_version": app_version,
		"json":1
	};
	return $params;
};

runCron = function($cron_type){
	dump("runCron=>"+ $cron_type);
	switch ($cron_type){
		case "foreGroundLocation":
				   
		   navigator.geolocation.getCurrentPosition( function(position) {	    
		   	     
			   	 $latitude = position.coords.latitude;
		 	 	 $longitude = position.coords.longitude;
		 	 	 $accuracy = position.coords.accuracy;
		 	 	 $altitude = !empty(position.coords.altitudeAccuracy)?position.coords.altitudeAccuracy:'';
		 	 	 $heading = !empty(position.coords.heading)?position.coords.heading:'';
		 	 	 $speed = !empty(position.coords.speed)?position.coords.speed:'';
		 	 	 
		 	 	 params = 'lat='+ $latitude + "&lng=" + $longitude;
			     params+="&app_version=" + app_version;	     			     
			     params+="&accuracy="+ $accuracy;
			     params+="&altitudeAccuracy="+ $altitude;
			     params+="&heading="+ $heading;
			     params+="&speed="+ $speed;
			     params+="&track_type=foreground";
			     			     				    
			     callAjax2('updateDriverLocation', params);     
		   	
		      }, function(error){
		    	 //showToast( error.message );		    	 
		      }, 
		      { timeout: 10000, enableHighAccuracy : getLocationAccuracy() } 
		    );	    	  	
		break;
		
		case "getNewTask":
		   getNewTask();
		break;
	}
};

getNewTask = function(){
	try {
		
	     params='';
	     params+=getParams();	
	   
	     ajax_new_task = $.ajax({
		  url: ajax_url+"/getNewTask",
		  method: "post" ,
		  data: params ,
		  dataType: "json",
		  timeout: ajax_timeout,
		  crossDomain: true,
		  beforeSend: function( xhr ) {
		  	
		  	 clearTimeout( timer[103] );
		  	
	         if(ajax_new_task != null) {		   
	           ajax_new_task.abort();
			 } else {    				
				timer[103] = setTimeout(function() {		
	         		if( ajax_new_task != null) {		
					   ajax_new_task.abort();				   
	         		}         		         		
		        }, ajax_timeout ); 	
			 }
	      }
	    });
	
	    ajax_new_task.done(function( data ) {
	    	dump(data);
	    	if(data.code==1){
	    		refreshOrderTab( data.msg );
	    	}
	    });
		
		ajax_new_task.always(function() {        
	        ajax_new_task = null;  
	    });	
	    
	    ajax_new_task.fail(function( jqXHR, textStatus ) {    		    	
	    	$text = !empty(jqXHR.responseText)?jqXHR.responseText:'';
			if(textStatus!="abort"){
			   showToast( textStatus + "\n" + $text );             
			}
	    });     
	   
	 } catch(err) {
       dump(err.message);       
    } 
};

getCurrentPage = function(){
	return document.querySelector('ons-navigator').topPage.id;
};

q = function(data){
	return "'" + addslashes(data) + "'";
};

var addslashes = function(str)
{
	return (str + '')
    .replace(/[\\"']/g, '\\$&')
    .replace(/\u0000/g, '\\0')
};

mapExternalDirection = function(lat,lng){
	if(!empty(lat)){
	   if( isDebug() ){
	   	   toastMsg("App is in debug mode "+lat+"="+lng);
	   } else {
	   	
	   	 try {
		    	   	 	
	        launchnavigator.isAppAvailable(launchnavigator.APP.GOOGLE_MAPS, function(isAvailable){
				    var app;
				    if(isAvailable){				        
				        app = launchnavigator.APP.USER_SELECT;
				    }else{		        
				        app = launchnavigator.APP.USER_SELECT;
				    }
				    
				    map_navigator = 1;
				    
				    launchnavigator.navigate( [lat, lng] , {
				        app: app
				    });
				});
			
			} catch(err) {		
				map_navigator = 0;
				showToast(err.message);	    				
			}    
		   	
	   }
	} else {
		showToast( t("Empty latitude and longititude") ,'danger');
	}
}

refreshOrderTab = function(message){
		
    $current_page_id = getCurrentPage();
	$active_tabbar = document.querySelector('ons-tabbar').getActiveTabIndex();
		    		
	if(!empty(message)){
	   if(message!="push"){
	      showToast( message ,'success');
	   }
	}
	
	setTimeout(function(){	
	   playMedia("neworder");	    		   
	}, 100);
	
	if($current_page_id=="home"){
		setTimeout(function(){	
			params="date="+ getStorage("kr_todays_date_raw");
	 	    var onduty = document.getElementById('onduty').checked==true?1:2 ;	
	 	    params+="&onduty="+onduty;
	        AjaxTask("GetTaskByDate",params,null);
        }, 100);
	}  
	
};

playMedia = function($sounds_type){
	try {	
		
		 $sound_path = "";					
		 if(cordova.platformId === "android"){
	     	$sound_path = cordova.file.applicationDirectory + "www/sounds/"+$sounds_type+".mp3";
	     } else if(cordova.platformId === "ios"){
	     	$sound_path = "sounds/"+$sounds_type+".mp3";
	     }		 			   
		 var my_media = new Media( $sound_path ,	        
	        function () { 
	        	//ok
	        },	        
	        function (err) { 
	        	// failed
	        }
	    );
	    
	    my_media.play({ playAudioWhenScreenIsLocked : true });
	    my_media.setVolume(1.0);		    
	    my_media.play();
	    setTimeout(function(){		
	    	my_media.stop();
	        my_media.release();	             	    	
	    }, 4000);
		    
    } catch(err) {        
        dump(err.message);        
    }    		
};


handlePushReceive = function(data){	
	 if(cordova.platformId === "android"){
	 	showToast( data.title+"\n"+data.body, 'success');
     } else if(cordova.platformId === "ios"){         	
     	showToast( data.aps.alert.title +"\n"+ data.aps.alert.body , 'success');     	
     }
     
     refreshOrderTab(  'push'  );
     
};

initSubscribe = function($value){
	
	$topic_new_task = getStorage("topic_new_task");
	$topic_alert = getStorage("topic_alert");	
	
	//dump2($value+"=>"+$topic_new_task+"=>"+$topic_alert);
		
	if($value==1 && !empty($topic_new_task) && !empty($topic_alert) ){		
		subscribe($topic_new_task);
		setTimeout(function(){ 			 	 
			subscribe($topic_alert); 
        }, 200);
	} 
	
	if($value!=1 && !empty($topic_new_task) && !empty($topic_alert) ){		
		unsubscribe($topic_new_task);
		setTimeout(function(){ 			 	 
			unsubscribe($topic_alert); 
        }, 200);
	} 
};


completedTask = function(){
   raw_date=getStorage('kr_todays_date_raw');
   if ((typeof  raw_date !== "undefined") && ( raw_date !== null)) {
	   setTimeout(function(){ 		   	  
	   	  callAjax("getTaskCompleted","date="+raw_date +"&task_type=completed" ,'silent' );
       }, 500);
   }
};


/*START FIREBASEX  */
initFirebasex = function(){
	try {	
			   
	    window.FirebasePlugin.onMessageReceived(function(data) {
	        try{	        	
	        	handlePushReceive(data);
	        }catch(e){
	            //alert("Exception in onMessageReceived callback: "+e.data);
	        }
	
	    }, function(error) {
	        alert("Failed receiving FirebasePlugin message", error);
	    });
	    
	    window.FirebasePlugin.onTokenRefresh(function(token){	        
	        device_id = token;
	        setStorage("device_id", token );	        
	    }, function(error) {
	        dump("Failed to refresh token");
	    });
	    	     	    
	     checkNotificationPermission(false);	
	     	     	     
	     if(cordova.platformId === "android"){
	     	initAndroid();
	     }else if(cordova.platformId === "ios"){
	     	initIos();
	     }
	    
	} catch(err) {
       alert(err.message);       
    } 
};

var initIos = function(){
    window.FirebasePlugin.onApnsTokenReceived(function(token){        
        //
    }, function(error) {
        dump("Failed to receive APNS token");
    });
};

var checkNotificationPermission = function(requested){
    window.FirebasePlugin.hasPermission(function(hasPermission){
        if(hasPermission){            
            getToken();
        }else if(!requested){            
            window.FirebasePlugin.grantPermission(checkNotificationPermission.bind(this, true));
        }else{            
            alert("Notifications won't be shown as permission is denied");
        }
    });
};

var getToken = function(){
    window.FirebasePlugin.getToken(function(token){        
        device_id = token;
        setStorage("device_id", token );        
    }, function(error) {
        dump("Failed to get FCM token");
    });
};

initAndroid = function(){
	var customChannel  = {
		id: "kartero",
		name: "kartero channel",
		sound: "neworder",
		vibration: [300, 200, 300],
		light: true,
	    lightColor: "0xFF0000FF",
	    importance: 4,
	    badge: true, 
	    visibility: 1
	};
	
	 window.FirebasePlugin.createChannel(customChannel,
        function() {            
            window.FirebasePlugin.listChannels(
                function(channels) {
                    if(typeof channels == "undefined") return;
                    for(var i=0;i<channels.length;i++) {                        
                    }
                },
                function(error) {
                    dump('List channels error: ' + error);
                }
            );
        },
        function(error) {
            showToast("Create channel error", error);
        }
    );    
        
};

function subscribe($topic){
	try {
		
	    window.FirebasePlugin.subscribe($topic, function(){
	        //showToast("Subscribed to topic");
	    },function(error){
	        //showToast("Failed to subscribe to alert", error);
	    });
	    
    } catch(err) {
       dump(err.message);       
    } 
}

function unsubscribe($topic){
	try {
	    window.FirebasePlugin.unsubscribe($topic, function(){
	        //showToast("Unsubscribed from topic");
	    },function(error){
	        //showToast("Failed to unsubscribe from alert", error);
	    });
    } catch(err) {
       dump(err.message);       
    } 
}

/*END FIREBASEX  */