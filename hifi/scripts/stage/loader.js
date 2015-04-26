(function () {

	//BASE_URL = 'http://localhost/hf/stage/';
	BASE_URL = 'http://vkislichenko.github.io/hifi/scripts/stage/';
	MANAGER_SEARCH_DIST = 10.0;
	
	PERM_CAN_CREATE = true;
	PERM_CAN_EDIT = true;
	PERM_CAN_DELETE = true;
	
	// load
	Script.include(BASE_URL + "webView.js");
	Script.include(BASE_URL + "builder.js");
	Script.include(BASE_URL + "manager.js");
	Script.include(BASE_URL + "interface.js");

	
	StageManager.searchForManagerEntity();
	
})();