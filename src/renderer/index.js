// Initial welcome page. Delete the following line to remove it.
'use strict';

import jQuery from 'jquery'
import scollintoview from './helpers/scrollintoview.js'
import { remote } from 'electron'
import settings from 'electron-settings'
import * as path from 'path'
import fs from 'fs'
import ks from 'node-key-sender'
import css from './main.css'
import tpl_app from './tpl_app.html'


window.$ = window.jQuery = jQuery
var kbsettings = settings.get('kbfolder.path')
if(typeof kbsettings != 'undefined'){
	var folderPath = settings.get('kbfolder.path')[0]
} else {
	var folderPath = false
}


init();

function init(){
	$("#app").html(tpl_app);

	let rest_url = 'http://wp.local';
	let rest_path = '/wp-json/wp/v2/kb/';

	jQuery(document).ready(function() {
		let content = ''
		//populate with json data
		$.getJSON(rest_url + rest_path + "?_jsonp=?",function(json){
	  		jQuery(json).each(function(index, kb){
	  			console.log(kb.title.rendered)
	  			content += '<div class="kbelement" tabindex="0">'
				content += '<p class="title">'+ kb.title.rendered +'</p>'
				content += '<p class="content" data-id="'+ kb.id +'">'+ kb['content-unrendered'] +'</p>'
				content += '</div>'
				//console.log(content)
	  		});
			jQuery('#lista').append(content)

		});

		console.log(content)
		// populate with file -> content
		jQuery.each(walkSync(folderPath), function(index, value){
			//content += '<div class="kbelement" tabindex="0">'
			//content += '<p class="title">'+ value['file'] +'</p>'
			//content += '<p class="content" data-path="'+ value['path'] +'">'+ value['content'] +'</p>'
			//content += '</div>'
		})
		jQuery('#lista').html(content)

		//filter
		jQuery("#search").on("keyup", function () {
			var value = this.value.toLowerCase().trim();
			var value_arr = value.split(" ");
			jQuery("#lista div").show().filter(function () {
				for (let i = 0; i < value_arr.length ; i++) {
		    		var maybeHide = jQuery(this).text().toLowerCase().trim().indexOf(value_arr[i]);
		    		console.log(maybeHide)
		    		if (maybeHide == -1){
		      			return maybeHide;
		    		}
		  		}
			}).hide();
			addScrollClass()
		})

		// send text to previous focused app.
		jQuery( ".kbelement" ).click(function() {
			var window = remote.getCurrentWindow();
			window.minimize();

			const ks = require('node-key-sender');
			var fileContent = fs.readFileSync(jQuery(this).find('.content').attr('data-path'), 'utf8');

			var copy = require('clipboard-copy')

			var successPromise = copy(fileContent)
			
			setTimeout(timedSendCombination, 100, ks );

		});

		// initial scroll detect
		addScrollClass()

		// output folder from settings
   		jQuery("footer span").text(folderPath)    

	})

	jQuery(document).keydown(function(e) {
		if (e.keyCode==38) {
			e.preventDefault();
			navigate(e.target, -1);
		}
		if (e.keyCode==40) {
			e.preventDefault();
			navigate(e.target, 1);
		}

		if (e.keyCode==13) {
			// we can't see it but it works.
			// can listen for the click event in order to send info back to the OS.
			jQuery(e.target).trigger('click');
		}
		if (e.keyCode!==40 && e.keyCode!==38 && e.keyCode!==13) {
			jQuery("#search").focus()
			// recalculate scroll
		}
	});

}




function navigate(origin, sens) {
	var inputs = jQuery('#lista').find('.kbelement').filter(function() {
		return jQuery(this).css("display") !== 'none';
	});
	var index = inputs.index(origin);
	index += sens;
	if (index < 0) {
		index = inputs.length - 1;
	}
	if (index > inputs.length - 1) {
		index = 0;
	}
	inputs.eq(index).focus();
}

function addScrollClass(){
	jQuery("#lista").removeClass("hasScrollbar");
	jQuery("#lista:scrollable").addClass("hasScrollbar");
}


function timedSendCombination(ks){
	ks.sendCombination(['control', 'v']).then(
	    function(stdout, stderr) {
	        
	        window.close();
	    },        
	    function(error, stdout, stderr) {
	        
	        console.log('ks error: ' + error);
   			//window.close();
	    }
	);
}

const walkSync = (dir, filelist = []) => {
  if (dir === false){
  	return []
  }
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);

    if (dirent.isDirectory()) {
      //console.log('directory', path.join(dir, file));
      var odir = {
        file: dirFile.replace(folderPath+'/', ''),
        files: [],
        isDir: 'true'
      }

      //odir.files = walkSync(dirFile, dir.files);
      //filelist.push(odir);

      odir.files = walkSync(dirFile, dir.files);
      filelist = filelist.concat(odir.files);
    } else if( dirent.size < 10000 && dirFile.indexOf('.txt') == dirFile.length - 4 ){
    	const fileContent = fs.readFileSync(dirFile, 'utf8')
   		filelist.push({
     		file: dirFile.replace(folderPath+'/', ''),
     		content: fileContent, 
     		path: dirFile
       	});
    	
    }
  }
  return filelist;
};

function getAllKb(){
	$.getJSON("http://wp.local/wp-json/wp/v2/kb?_jsonp=?",function(json){
  		
  		//console.log(json);

  		jQuery(json).each(function(index, kb){
  			console.log(kb);
  		})
	});



	// https://www.npmjs.com/package/request

	var request = require("request")

	var url = "http://wp.local/wp-json/wp/v2/kb?" +
    	"key=d99803c970a04223998cabd90a741633" +
    	"&stop_id=it"

	request({
	    url: url,
	    json: true
	}, function (error, response, body) {

	    if (!error && response.statusCode === 200) {
	        //console.log(body) // Print the json response
	    }
	})
}