(function () {

	BASE_URL = 'http://vkislichenko.github.io/hifi/scripts/stage/';
	MANAGER_SEARCH_DIST = 10.0;
	
	PERM_CAN_CREATE = true;
	PERM_CAN_EDIT = true;
	PERM_CAN_DELETE = true;
	
	// load
	Script.include(BASE_URL + "app/WebView.js");
	Script.include(BASE_URL + "app/Entity.js");
	Script.include(BASE_URL + "app/Entity/Identifier.js");
	
	Script.include(BASE_URL + "app/Builder.js");
	Script.include(BASE_URL + "app/Manager.js");
	Script.include(BASE_URL + "app/Interface.js");
	

	StageManager.searchForManagerEntity();
	
})();