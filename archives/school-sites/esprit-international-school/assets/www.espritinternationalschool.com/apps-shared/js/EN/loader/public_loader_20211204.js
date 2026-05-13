// This script can be used for loading JavaScript and CSS files for various pages. It automatically loads Prototype and Scriptaculous libraries. It is programmed to automatically load packed version of files in the production system.
var ENLoader = {

	// These are JavaScript file definitions.
	// *** DON'T ADD THE "-pack.js" PARTS. This loader will automatically load
	// packed version of files in the production system.
	libs : {
		AdminTools :"/apps/js/tools/admin_20080630",
		AJAX :"/apps/ajax/ajax",
		Album :"/apps/js/album3/p/public_album_20191108",
		AlumniDirectory :"/apps/js/alumni_dir/alumni_dir_20090520",
		Assignment :"/apps/js/classes/assignment_20100122",
		BellSchedules :"/apps/js/bell_schedules/bell_schedules_20100810",
		Class :"/apps/js/classes/class_20090821",
		CodePress :"/apps/js/codepress/codepress",
		CommentAdmin :"/apps-shared/js/comment/admin_20080702",
		CommentPublic :"/apps-shared/js/comment/public_20080715",
		Common :"/apps-shared/js/common/common_20131125",
		CommonAdmin :"/apps/js/common/common_admin",
		Compile :"/apps/js/common/compile_20080425",
		Date :"/apps-shared/js/common/date_20150108",
		DatePickerNT :"/apps-shared/js/common/date_picker_NT_20140128",
		DatePicker :"/apps/js/common/date_picker",
		DialogBoxes :"/apps-shared/js/dialog_boxes/dialog_boxes_20100827",
		DonationFund :"/apps/js/donations/fund_20080630",
		DonationIntro :"/apps/js/donations/intro_20080630",
		ENCarousel : "/apps-shared/js/spotlight/encarousel_20151203",
		ENCarouselv2 : "/apps-shared/js/spotlight/encarouselv2",
		ENImageTrans : "/apps-shared/js/spotlight/enImageTransitions",
		ENImageTransv2 : "/apps-shared/js/spotlight/enImageTransitionsv2",
		ENRemoteService :"/apps-shared/js/EN/rpc/ENRemoteService_20090626",
		ENTable :"/apps-shared/js/EN/util/ENTable",
		ENUpload :"/apps-shared/js/EN/rpc/ENUpload_20200323",
		Events :"/apps/js/events/events_20100825",
		Facilities :"/apps/js/facilities/facilities_20140424b",
		FacilitiesCom : "/apps-shared/js/facilities/facilities_com_20170803",
		FileManager :"/apps/js/file_manager/file_manager_20080630",
		FoodMenu :"/apps/js/food_menu/food_menu_20131010",
		Forms :"/apps/js/forms/forms_20080630",
		GoogleTranslate : "/apps-shared/js/google/translate_20190318",
		Help :"/apps/js/common/help_20080627",
		ImageTools :"/apps/js/image_tools/image_tools_20100913",
		JQuery :"/apps-shared/js/jquery/1.2.1/jquery",
		JQuery142 :"/apps/js/jquery/1.4.2/jquery",
		JQuery143 :"/apps-shared/js/jquery/1.4.3/jquery",
		JQuery191 :"/apps-shared/js/jquery/1.9.1/jquery",
		JQuery1124 :"/apps-shared/js/jquery/1.12.4/jquery",
		JQueryCache :"/apps-shared/js/jquery/jquery_cache",
		JQueryClearField :"/apps/js/jquery/jquery_clearfield",
		JQueryPlaceholder : "/apps-shared/js/mmapp/jquery.placeholder_20110119",
		JQuerySimpleModal : "/apps-shared/js/mmapp/jquery.simplemodal-1.4.1_20110119",
		JQueryUI :"/apps/js/jquery/jquery_ui",
		JQueryUI1823 :"/apps-shared/js/jquery/jquery_ui_1823",
		JQueryUI1103 :"/apps/js/jquery/ui/1.10.3/jquery_ui_1103",
		JQueryUI1121 : "/apps-shared/js/jquery/ui/1.12.1/jquery_ui_1121",
		JQueryBaHashChange :"/apps/js/jquery/jquery.ba-hashchange.min",
		JQueryLazyLoad :"/apps/js/jquery/jquery.lazyload",
		JQueryMigration141 :"/apps-shared/js/jquery/migration/1.4.1/jquery_migrate_141",
		Marquee :"/apps/js/marquee/marquee_20080630",
		MM :"/apps/js/mm/mmprogress",
		MMCheck : "/apps-shared/js/mmapp/mmCheck_20120510",
		MuxJS:"/apps/js/shaka/2.4.0/mux",
		News :"/apps/js/news/news_20100608",
		P7_AutoLayers :"/apps/js/common/P7_AutoLayers",
		Pages :"/apps/js/pages/pages_20151013",
		PagesPublic :"/apps/js/pages/p/pages_public_20150211",
		PhotoGrid :"/apps/js/photo_grid/photo_grid_20120606",
		Polls :"/apps-shared/js/polls/polls",
		PollsAdmin :"/apps/js/polls/polls_admin",
		PollsAdminSettings :"/apps/js/polls/polls_admin_settings",
		Prototype :"/apps/js/prototype/prototype-1.6.0.2",
		PublicationsCategory :"/apps-shared/js/publications/category_20080630",
		PublicationsDocument :"/apps-shared/js/publications/document_20080630",
		PublicationsPublic :"/apps-shared/js/publications/public",
		QC :"/apps-shared/js/qc/qc",
		Richtext :"/apps/js/rte/richtext_20100830",
		RotatingImages :"/apps/js/rotating_images/rotating_images_20110225",
		Scriptaculous :"/apps/js/scriptaculous/scriptaculous",
		Settings :"/apps/js/settings/settings_20170803",
		Shaka:"/apps-shared/js/shaka/2.5.7/shaka-player.compiled",
		SliderControl :"/apps/js/slider_control/slider_control_20110706",
		SpNETClient : "/apps/js/sponsors/spnetclient_20090625",
		SpSimple : "/apps-shared/js/spotlight/spsimple_20160609",
		SpSimplev2 : "/apps-shared/js/spotlight/spsimplev2",
		Staff :"/apps-shared/js/staff/staff_20080711",
		StaffCatCom :"/apps-shared/js/staff_cat/staff_cat_com_20141118",
		StaffList :"/apps-shared/js/staff/staff_list_20150121",
		StaffPhotoCom :"/apps-shared/js/staff/staff_photo_com_20141118",
		Store :"/apps-shared/js/store/store",
		Thickbox :"/apps-shared/js/thickbox/3.1/thickbox",
		Thickbox21 :"/apps/js/thickbox/2.1/thickbox",
		Time :"/apps-shared/js/common/time",
		TimeUtils :"/apps/js/common/timeutils_20100810",
		TruView :"/apps/js/file_manager/truview_20090218",
		Twitter : "/apps/js/twitter/twitter_20100721",
		URL :"/apps/js/common/url",
		VideoPane : "/apps-shared/js/mmapp/jquery.paneinitialize_20110119",
		VideoInit : "/apps-shared/js/mmapp/jquery.videoinitialize_20191219",
		VideoIndex : "/apps-shared/js/mmapp/video-index_20150120",
		Webcam :"/apps/js/common/webcam"
	},

	// These are CSS file definitions.
	// *** DON'T ADD THE "-pack.css" PARTS. This loader will automatically load
	// packed version of files in the production system.
	css : {
		Album :"/apps/js/album3/p/public_album_20141219",
		BellSchedules :"/apps/js/bell_schedules/bell_schedules_20100715",
		CommentAdmin :"/apps-shared/js/comment/admin_20080702",
		CommentPublic :"/apps-shared/js/comment/public_20080715",
		DatePicker :"/apps/js/common/date_picker",
		DatePickerNT :"/apps/js/common/date_picker_NT",
		DialogBoxes :"/apps-shared/js/dialog_boxes/dialog_boxes_20100827",
		FacilitiesCom : "/apps-shared/js/facilities/facilities_com_20140424b",
		GoogleTranslate : "/apps-shared/js/google/translate_20170810",
		JQueryUI1103 :"/apps/js/jquery/ui/1.10.3/jquery_ui_1103",
		PagesPublic :"/apps/js/pages/p/pages_public_20150223",
		PhotoGrid :"/apps/js/photo_grid/photo_grid_20120606",
		//Polls :"/apps/js/polls/polls",
		PollsAdmin :"/apps/js/polls/polls_admin",
		PollsAdminSettings :"/apps/js/polls/polls_admin_settings",
		Richtext :"/apps/js/rte/rte",
		RotatingImages :"/apps/js/rotating_images/rotating_images_20110225",
		SliderControl :"/apps/js/slider_control/slider_control_20110706",
		Staff :"/apps-shared/js/staff/staff_20080711",
		StaffList :"/apps-shared/js/staff/staff_list_20150121",
		StaffPhotoCom :"/apps-shared/js/staff/staff_photo_com_20141118",
		Thickbox :"/apps/js/thickbox/3.1/thickbox"
	},

	// Refresh rate of the animation in milliseconds.
	refreshRate :100,

	enLoaderContainerID : "enLoaderContainer",

	enLoaderDiv : null,

	addLibs: function(libNames, onLoadcallback) {

		if(document.libNames == null )
			document.libNames = new Array();
		if(document.onLoadCallback == null )
			document.onLoadCallback = "";
		if(document.loaded == null )
			document.loaded = "";
		if(document.notLoaded == null )
			document.notLoaded = "";
		if(document.debug == null )
			document.debug = false;
		if(document.callbackFunctions == null )
			document.callbackFunctions = new Array();
		if(document.inputLibs == null )
			document.inputLibs = "";
		if(document.toBeLoadedLibs == null )
			document.toBeLoadedLibs = new Array();
		if(document.scriptedLibs == null )
			document.scriptedLibs = new Array();
		if(document.calledFunctions == null )
			document.calledFunctions = "";
		if(document.callbackFunctionsStr == null )
			document.callbackFunctionsStr = "";
		if(document.errorFunctions == null )
			document.errorFunctions = "";


		if (document.URL.indexOf("debug=true") >= 0) {
			document.debug = true;
		}

		// Assign the libNames variables to the global variable.
		if (libNames == null)
			libNames = "";

		document.inputLibs = libNames + " " + document.inputLibs;

		temp = libNames.split(" ");
		for ( var i = 0; i < temp.length; i++) {
			if(temp[i] == "JQuery" || temp[i] == "JQuery142" || temp[i] == "JQuery143") {
				temp[i] = "JQuery143";
			}
			if (temp[i] != "" && !ENLoader.checkInTBLList(temp[i]) && !ENLoader.checkInScrList(temp[i]) && document.loaded.indexOf(temp[i]) < 0) {
				document.toBeLoadedLibs.push(temp[i]);
			}
		}

		if(onLoadcallback != null)
			document.callbackFunctionsStr +=  onLoadcallback + " ";

		ENLoader.loadLibs();
	},

	checkInTBLList: function(libName) {
		for(var j=0; j<document.toBeLoadedLibs.length; j++) {
			if(document.toBeLoadedLibs[j] == libName){
				return true;
			}
		}
		return false;
	},

	checkInScrList: function(libName) {
		for(var j=0; j<document.scriptedLibs.length; j++) {
			if(document.scriptedLibs[j] == libName){
				return true;
			}
		}
		return false;
	},


	loadLibs: function() {
		if ((document.toBeLoadedLibs.length == 0) && (document.callbackFunctionsStr == null || document.callbackFunctionsStr =="")) {
			return;
		}

		var pack = "-pack";
		pack = ""; // Added to avoid loading packed versions.
		if (document.URL.indexOf(".endev.org") >= 0 || document.URL.indexOf("debug=true") >= 0) {
			pack = "";
		}

		for(var i = 0; i < document.toBeLoadedLibs.length; i++) {
			if(ENLoader.checkInScrList(document.toBeLoadedLibs[i])) {
				document.toBeLoadedLibs[i] = "";
				continue;
			}

			var params = "";
			var libName = document.toBeLoadedLibs[i];
			try {
				// If such a JS file exists, load it. Remember to load the packed
				// version on the production system.
				if (this.libs[libName])
					document.write("<" + "script type='text/javascript' src='" +
					this.libs[libName] + pack + ".js" + params + "'><\/" + "script>");
				// If such a CSS file exists, load it. Remember to load the packed
				// version on the production system.
				if (this.css[libName])
					document.write("<link rel='stylesheet' href='" +
					this.css[libName] +
					pack +
					".css' type='text/css' media='screen' />");
			} catch (e) {
				console.log(e);
			}
			document.scriptedLibs.push(document.toBeLoadedLibs[i]);
			document.toBeLoadedLibs[i] = "";
		}

		temp = document.toBeLoadedLibs;
		document.toBeLoadedLibs = new Array();
		for ( var i = 0; i < temp.length; i++) {
			if (temp[i] != "") {
				document.toBeLoadedLibs.push(temp[i]);
			}
		}
		// Trigger the check function.
		ENLoader.checkItems();
	},

	// This function ensures that all the requested libraries are loaded.
	checkItems : function() {
		// Treat the code of the page as an item as well.
		var numNotLoaded = 0;
		document.notLoaded = "";

		for ( var i = 0; i < document.scriptedLibs.length; i++) {
			try {
				try {
					eval(document.scriptedLibs[i] + "IsLoaded()");
				} catch (e1) {
					eval(document.scriptedLibs[i] + ".isLoaded()");
				}
				if (document.loaded.indexOf(" " + document.scriptedLibs[i] + " ") < 0)
					document.loaded += " " + document.scriptedLibs[i] + " ";
				document.scriptedLibs[i] = "";
			} catch (e2) {
				numNotLoaded++;
				document.notLoaded += " " + document.scriptedLibs[i] + " ";
			}
		}

		temp = document.scriptedLibs;
		document.scriptedLibs = new Array();
		for ( var i = 0; i < temp.length; i++) {
			if (temp[i] != "") {
				document.scriptedLibs.push(temp[i]);
			}
		}

		ENLoader.updateStatusDiv();

		// If successfully loaded, call the onLoadCallback function.
		if (numNotLoaded == 0) {
			if (document.callbackFunctionsStr != "") {
				var temp = document.callbackFunctionsStr.split(" ");
				document.callbackFunctionsStr = "";
				for ( var i = 0; i < temp.length; i++) {
					if (temp[i] != "") {
						document.callbackFunctions.push(temp[i]);
					}
				}
				ENLoader.callOnLoadCallbackFunction();
			}
		}
		// Otherwise, run again...
		else if (numNotLoaded != 0 ) {
			setTimeout("ENLoader.checkItems()", this.refreshRate);
		}

	},

	callOnLoadCallbackFunction : function() {
		temp = document.callbackFunctions;
		document.callbackFunctions = new Array();
		for ( var i = 0; i < temp.length; i++) {
			if (temp[i] != "") {
				document.callbackFunctions.push(temp[i]);
			}
		}

		document.errorFunctions = "";
		for ( var i = 0; i < document.callbackFunctions.length; i++) {
			var callbackFunction = document.callbackFunctions[i];
			try {
				eval(callbackFunction
					+ (callbackFunction.indexOf(")") == callbackFunction.length - 1 ? ""
							: "()"));
				document.calledFunctions  += document.callbackFunctions[i] + " ";
				document.callbackFunctions[i] = "";
			} catch (cc) {
				document.errorFunctions +=  document.callbackFunctions[i] + " ";
				setTimeout("ENLoader.callOnLoadCallbackFunction()", 50);
			}
		}
	},

	updateStatusDiv : function() {
		// Make sure div#enLoaderContainer is present...
		if (this.enLoaderDiv == null)
			this.enLoaderDiv = document.getElementById(this.enLoaderContainerID);

		if (this.enLoaderDiv && (typeof(this.enLoaderDiv)).toString().toLowerCase() == "object" && document.debug) {
			// Draw the animation frame by writing the HTML code into
			// div#enLoaderContainer.
			html = "<div style='font-size: 10pt;color: black;'><b>Libs Loaded: </b>" + document.loaded + "<br><b>Libs Not Loaded: </b>"+ document.notLoaded +"<br><b>Functions Called: </b>" + document.calledFunctions + "<br><b>Error Functions: </b>"+ document.errorFunctions +"</div>";
			this.enLoaderDiv.innerHTML = html;
			this.enLoaderDiv.style.display = "block";
		}
	},

	// This function can be called to ensure that ENLoader is loaded. This
	// should be at the end of this file.
	isLoaded : function() {
		return true;
	}
};