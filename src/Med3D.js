/**
 * Global namespace for Med3D.
 *
 * @namespace
 */
	  
 
  //@@cameras/PerspectiveCamera.js

const singleton = Symbol();
const singletonEnforcer = Symbol();

var M3D = {
	revision: 1,

	// Material side constants
	FRONT_SIDE: 0,
	BACK_SIDE: 1,
	FRONT_AND_BACK_SIDE: 2,

	FUNC_LESS: 3,
	FUNC_LEQUAL: 4,
	FUNC_EQUAL: 5,
	FUNC_NOTEQUAL: 6,
	FUNC_GREATER: 7,
	FUNC_GEQUAL: 8,

	//VPT constants
	EAM: 1,
	ISO: 2,
	MCS: 3,
	MIP: 4,
	PHO: 5, 	//Phong test rendeder for volume's mesh projection

};

